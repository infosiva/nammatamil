import { notFound } from 'next/navigation'
import { Star, Tv2, Globe, Calendar, Users, Play, ExternalLink, ShoppingBag } from 'lucide-react'
import AdUnit from '@/components/AdUnit'
import RecentEpisodes from '@/components/RecentEpisodes'

const AMAZON_TAG = 'nammatamil-21'
import ContentCard from '@/components/ContentCard'
import { serials } from '@/data/serials'
import type { Metadata } from 'next'
import clsx from 'clsx'

const STREAMING_LINKS: Record<string, { color: string; bg: string; border: string; url: string }> = {
  'Sun TV':        { color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.35)', url: 'https://www.sunnxt.com/show/' },
  'Vijay TV':      { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.35)', url: 'https://www.hotstar.com/in/search?q=' },
  'Star Vijay':    { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.35)', url: 'https://www.hotstar.com/in/search?q=' },
  'Zee Tamil':     { color: '#06b6d4', bg: 'rgba(6,182,212,0.12)',  border: 'rgba(6,182,212,0.35)',  url: 'https://www.zee5.com/search?q=' },
  'Colors Tamil':  { color: '#ec4899', bg: 'rgba(236,72,153,0.12)', border: 'rgba(236,72,153,0.35)', url: 'https://www.voot.com/search?q=' },
  'Netflix':       { color: '#e50914', bg: 'rgba(229,9,20,0.12)',   border: 'rgba(229,9,20,0.35)',   url: 'https://www.netflix.com/in/search?q=' },
  'Amazon Prime':  { color: '#00a8e0', bg: 'rgba(0,168,224,0.12)',  border: 'rgba(0,168,224,0.35)',  url: 'https://www.primevideo.com/search/ref=atv_nb_sr?phrase=' },
}

interface Props { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return serials.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const serial = serials.find((s) => s.slug === slug)
  if (!serial) return {}
  return {
    title: `${serial.title} — ${serial.channel}`,
    description: serial.description,
    keywords: [serial.title, serial.channel, ...serial.genre, 'Tamil serial', 'Tamil drama'],
  }
}

export default async function SerialDetailPage({ params }: Props) {
  const { slug } = await params
  const serial = serials.find((s) => s.slug === slug)
  if (!serial) notFound()

  const related = serials.filter((s) => s.id !== serial.id && (s.channel === serial.channel || s.genre.some(g => serial.genre.includes(g)))).slice(0, 4)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      {/* Hero card */}
      <div className="glass rounded-3xl overflow-hidden mb-10 border border-white/5">
        <div className={clsx('h-64 bg-gradient-to-br relative', serial.gradient)}>
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/50 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex flex-wrap gap-2 mb-3">
              {serial.language === 'Tamil Dubbed' && (
                <span className="badge bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Tamil Dubbed · {serial.originalLanguage}
                </span>
              )}
              <span className={clsx('badge border', serial.status === 'Ongoing' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-slate-500/20 text-slate-400 border-slate-500/30')}>
                {serial.status}
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white">{serial.title}</h1>
          </div>
        </div>

        <div className="p-6 md:p-8 grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            <p className="text-slate-300 leading-relaxed">{serial.description}</p>
            <div className="flex flex-wrap gap-2">
              {serial.genre.map(g => (
                <span key={g} className="badge bg-white/5 text-slate-300 border border-white/10">{g}</span>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="glass-gold rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-gold-400 fill-gold-400" />
                <span className="text-2xl font-black text-gradient">{serial.rating}</span>
                <span className="text-muted text-sm">/10</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted">
                <Tv2 className="w-4 h-4" /> {serial.channel}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted">
                <Calendar className="w-4 h-4" />
                {serial.startYear}{serial.endYear ? ` – ${serial.endYear}` : ' – Present'}
              </div>
              {serial.cast.length > 0 && (
                <div className="flex items-start gap-2 text-sm text-muted">
                  <Users className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{serial.cast.join(', ')}</span>
                </div>
              )}
            </div>

            {/* Watch / Stream CTA */}
            {serial.channel && (() => {
              const cfg = STREAMING_LINKS[serial.channel]
              if (!cfg) return null
              return (
                <a
                  href={`${cfg.url}${encodeURIComponent(serial.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-track="watch-cta"
                  data-track-value={`${serial.channel}-${serial.title}`}
                  className="flex items-center justify-between w-full px-4 py-3 rounded-2xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
                >
                  <span className="flex items-center gap-2"><Play className="w-4 h-4" /> Watch {serial.title}</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                </a>
              )
            })()}
          </div>
        </div>
      </div>

      <AdUnit format="horizontal" className="mb-10 min-h-[90px]" />

      {/* Recent Episodes — only for ongoing serials */}
      {serial.status === 'Ongoing' && (
        <RecentEpisodes serialTitle={serial.title} channelName={serial.channel} />
      )}

      {/* Amazon affiliate — serial soundtrack / merch */}
      <div className="glass rounded-2xl p-4 mb-10 border border-white/5 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div>
          <p className="text-white font-bold text-sm">🎵 Serial Soundtrack & Merchandise</p>
          <p className="text-white/40 text-xs mt-0.5">Find {serial!.title} music on Amazon</p>
        </div>
        <a
          href={`https://www.amazon.co.uk/s?k=${encodeURIComponent(serial!.title + ' Tamil serial soundtrack')}&tag=${AMAZON_TAG}`}
          target="_blank" rel="noopener noreferrer sponsored"
          data-track="amazon-affiliate"
          data-track-value={`serial-soundtrack-${serial!.title}`}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:scale-105 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#f90,#e47911)', border: '1px solid rgba(249,153,17,0.4)' }}
        >
          <ShoppingBag className="w-3.5 h-3.5" /> Find on Amazon UK
        </a>
      </div>

      <AdUnit format="rectangle" className="mb-10 min-h-[250px]" />

      {/* Related */}
      {related.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-white mb-4">You May Also Like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {related.map((s) => (
              <ContentCard key={s.id} href={`/serials/${s.slug}`} title={s.title} subtitle={s.channel} gradient={s.gradient} type="serial" rating={s.rating} channel={s.channel} status={s.status} language={s.language} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
