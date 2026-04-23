import { notFound } from 'next/navigation'
import { Star, Film, Globe, Calendar, Users, Play, Tv2 } from 'lucide-react'
import AdUnit from '@/components/AdUnit'
import ContentCard from '@/components/ContentCard'
import { movies } from '@/data/movies'
import type { Metadata } from 'next'
import clsx from 'clsx'

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

const STREAMING_COLORS: Record<string, string> = {
  'Netflix': 'bg-red-600',
  'Amazon Prime': 'bg-blue-500',
  'Disney+ Hotstar': 'bg-indigo-600',
  'ZEE5': 'bg-purple-600',
  'YouTube': 'bg-red-500',
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
                <div className="flex flex-wrap gap-2">
                  {movie.streamingOn.map(s => (
                    <span key={s} className={clsx('px-3 py-1 rounded-lg text-white text-xs font-semibold', STREAMING_COLORS[s] ?? 'bg-slate-600')}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AdUnit format="horizontal" className="mb-10 min-h-[90px]" />

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
