import { Tv2, Globe } from 'lucide-react'
import ContentCard from '@/components/ContentCard'
import AdUnit from '@/components/AdUnit'
import { serials } from '@/data/serials'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tamil Serials — All Channels',
  description: 'Complete list of Tamil serials from Sun TV, Vijay TV, Star Vijay, Zee Tamil — original Tamil and Tamil dubbed serials with cast, ratings, and episode details.',
}

const CHANNELS = ['All', 'Sun TV', 'Vijay TV', 'Star Vijay', 'Zee Tamil']

export default function SerialsPage() {
  const original = serials.filter(s => s.language === 'Tamil')
  const dubbed = serials.filter(s => s.language === 'Tamil Dubbed')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-xl bg-gold-500/10 border border-gold-500/20">
            <Tv2 className="w-6 h-6 text-gold-400" />
          </div>
          <h1 className="text-4xl font-black text-white">Tamil Serials</h1>
        </div>
        <p className="text-muted max-w-2xl">
          Browse all Tamil serials — original productions and Tamil dubbed serials from Sun TV, Vijay TV, Star Vijay, and Zee Tamil.
        </p>
      </div>

      <AdUnit format="horizontal" className="mb-10 min-h-[90px]" />

      {/* Original Tamil Serials */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-white mb-2">Original Tamil Serials</h2>
        <p className="text-muted text-sm mb-6">Produced in Tamil across all major channels</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {original.map((s) => (
            <ContentCard
              key={s.id}
              href={`/serials/${s.slug}`}
              title={s.title}
              subtitle={s.channel}
              gradient={s.gradient}
              type="serial"
              rating={s.rating}
              channel={s.channel}
              status={s.status}
              language={s.language}
              tags={s.tags}
            />
          ))}
        </div>
      </section>

      <AdUnit format="rectangle" className="mb-16 min-h-[250px]" />

      {/* Tamil Dubbed Serials */}
      {dubbed.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-5 h-5 text-cyan-400" />
            <h2 className="text-2xl font-bold text-white">Tamil Dubbed Serials</h2>
          </div>
          <p className="text-muted text-sm mb-6">Telugu, Malayalam and other language serials dubbed in Tamil</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {dubbed.map((s) => (
              <ContentCard
                key={s.id}
                href={`/serials/${s.slug}`}
                title={s.title}
                subtitle={`${s.channel} · ${s.originalLanguage}`}
                gradient={s.gradient}
                type="serial"
                rating={s.rating}
                channel={s.channel}
                status={s.status}
                language={s.language}
                tags={s.tags}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
