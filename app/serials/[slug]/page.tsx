import { notFound } from 'next/navigation'
import { Star, Tv2, Globe, Calendar, Users } from 'lucide-react'
import AdUnit from '@/components/AdUnit'
import ContentCard from '@/components/ContentCard'
import { serials } from '@/data/serials'
import type { Metadata } from 'next'
import clsx from 'clsx'

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
          </div>
        </div>
      </div>

      <AdUnit format="horizontal" className="mb-10 min-h-[90px]" />

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
