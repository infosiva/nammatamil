import { notFound } from 'next/navigation'
import { Star, Film, Globe, Calendar, Users, Play, ShoppingBag } from 'lucide-react'
import AdUnit from '@/components/AdUnit'
import ContentCard from '@/components/ContentCard'
import { movies } from '@/data/movies'
import type { Metadata } from 'next'
import clsx from 'clsx'

// Amazon Associates tag — Tamil music/DVD
const AMAZON_TAG = 'nammatamil-21'

interface Props { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return movies.map((m) => ({ slug: m.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const movie = movies.find((m) => m.slug === slug)
  if (!movie) return {}
  return {
    title: `${movie.title} (${movie.year}) — Tamil Movie`,
    description: movie.description,
    keywords: [movie.title, movie.director, ...movie.cast.slice(0, 3), ...movie.genre, 'Tamil movie'],
  }
}

// Affiliate deep-links — direct to Tamil content search on each platform
const OTT_CONFIG: Record<string, { color: string; bg: string; border: string; url: string; label: string }> = {
  'Netflix':         { color: '#e50914', bg: 'rgba(229,9,20,0.15)',  border: 'rgba(229,9,20,0.4)',  url: 'https://www.netflix.com/in/search?q=', label: 'Watch on Netflix' },
  'Amazon Prime':    { color: '#00a8e0', bg: 'rgba(0,168,224,0.15)', border: 'rgba(0,168,224,0.4)', url: 'https://www.primevideo.com/search/ref=atv_nb_sr?phrase=', label: 'Watch on Prime Video' },
  'Disney+ Hotstar': { color: '#0073e6', bg: 'rgba(0,115,230,0.15)', border: 'rgba(0,115,230,0.4)', url: 'https://www.hotstar.com/in/search?q=', label: 'Watch on Hotstar' },
  'ZEE5':            { color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)',border: 'rgba(139,92,246,0.4)',url: 'https://www.zee5.com/search?q=', label: 'Watch on ZEE5' },
  'YouTube':         { color: '#ff0000', bg: 'rgba(255,0,0,0.12)',   border: 'rgba(255,0,0,0.35)',  url: 'https://www.youtube.com/results?search_query=', label: 'Watch on YouTube' },
}

export default async function MovieDetailPage({ params }: Props) {
  const { slug } = await params
  const movie = movies.find((m) => m.slug === slug)
  if (!movie) notFound()

  const related = movies.filter((m) => m.id !== movie.id && (m.director === movie.director || m.language === movie.language || m.genre.some(g => movie.genre.includes(g)))).slice(0, 4)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="glass rounded-3xl overflow-hidden mb-10 border border-white/5">
        <div className={clsx('h-72 bg-gradient-to-br relative', movie.gradient)}>
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/40 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex flex-wrap gap-2 mb-3">
              {movie.language === 'Tamil Dubbed' && (
                <span className="badge bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Tamil Dubbed · {movie.originalLanguage}
                </span>
              )}
              {movie.badge && (
                <span className="badge bg-gold-500 text-dark-900 font-bold">{movie.badge}</span>
              )}
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white">{movie.title}</h1>
            <p className="text-slate-300 mt-1">{movie.year} · {movie.director}</p>
          </div>
        </div>

        <div className="p-6 md:p-8 grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            <p className="text-slate-300 leading-relaxed">{movie.description}</p>
            <div className="flex flex-wrap gap-2">
              {movie.genre.map(g => (
                <span key={g} className="badge bg-white/5 text-slate-300 border border-white/10">{g}</span>
              ))}
            </div>
            {movie.cast.length > 0 && (
              <div>
                <p className="text-muted text-xs uppercase tracking-wider mb-2 flex items-center gap-1"><Users className="w-3 h-3" /> Cast</p>
                <p className="text-slate-300 text-sm">{movie.cast.join(', ')}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="glass-gold rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-gold-400 fill-gold-400" />
                <span className="text-2xl font-black text-gradient">{movie.rating}</span>
                <span className="text-muted text-sm">/10</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted">
                <Calendar className="w-4 h-4" /> {movie.year}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted">
                <Film className="w-4 h-4" /> {movie.director}
              </div>
            </div>

            {movie.streamingOn.length > 0 && (
              <div>
                <p className="text-muted text-xs uppercase tracking-wider mb-2 flex items-center gap-1"><Play className="w-3 h-3" /> Watch On</p>
                <div className="flex flex-col gap-2">
                  {movie.streamingOn.map(platform => {
                    const cfg = OTT_CONFIG[platform]
                    if (!cfg) return (
                      <span key={platform} className="px-3 py-2 rounded-xl text-white text-xs font-semibold bg-slate-600">{platform}</span>
                    )
                    return (
                      <a
                        key={platform}
                        href={`${cfg.url}${encodeURIComponent(movie.title)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-track="watch-cta"
                        data-track-value={`${platform}-${movie.title}`}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                        style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
                      >
                        <span>{cfg.label}</span>
                        <Play className="w-3.5 h-3.5" />
                      </a>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AdUnit format="horizontal" className="mb-10 min-h-[90px]" />

      {/* Amazon affiliate — soundtrack & movie */}
      <div className="glass rounded-2xl p-4 mb-10 border border-white/5 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div>
          <p className="text-white font-bold text-sm">🎵 Buy the Soundtrack / DVD</p>
          <p className="text-white/40 text-xs mt-0.5">Support Tamil cinema — buy from Amazon</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <a
            href={`https://www.amazon.co.uk/s?k=${encodeURIComponent(movie!.title + ' Tamil soundtrack')}&tag=${AMAZON_TAG}`}
            target="_blank" rel="noopener noreferrer sponsored"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg,#f90,#e47911)', border: '1px solid rgba(249,153,17,0.4)' }}
          >
            <ShoppingBag className="w-3.5 h-3.5" /> Soundtrack (UK)
          </a>
          <a
            href={`https://www.amazon.co.uk/s?k=${encodeURIComponent(movie!.title + ' Tamil DVD')}&tag=${AMAZON_TAG}`}
            target="_blank" rel="noopener noreferrer sponsored"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:scale-105"
            style={{ background: 'rgba(249,153,17,0.12)', border: '1px solid rgba(249,153,17,0.3)', color: '#f90' }}
          >
            <ShoppingBag className="w-3.5 h-3.5" /> DVD / Blu-ray
          </a>
        </div>
      </div>

      <AdUnit format="rectangle" className="mb-10 min-h-[250px]" />

      {related.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-white mb-4">You May Also Like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {related.map((m) => (
              <ContentCard key={m.id} href={`/movies/${m.slug}`} title={m.title} subtitle={m.director} gradient={m.gradient} type="movie" rating={m.rating} badge={m.badge} year={m.year} language={m.language} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
