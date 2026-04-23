import { Music } from 'lucide-react'
import ContentCard from '@/components/ContentCard'
import AdUnit from '@/components/AdUnit'
import { albums } from '@/data/albums'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tamil Music Albums — AR Rahman, Ilaiyaraaja & More',
  description: 'Iconic Tamil film soundtracks and music albums — AR Rahman, Ilaiyaraaja, GV Prakash, Sam CS and more. Song lists, descriptions, and ratings.',
}

export default function AlbumsPage() {
  const rahman = albums.filter(a => a.artist === 'A.R. Rahman')
  const others = albums.filter(a => a.artist !== 'A.R. Rahman')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-xl bg-pink-500/10 border border-pink-500/20">
            <Music className="w-6 h-6 text-pink-400" />
          </div>
          <h1 className="text-4xl font-black text-white">Tamil Music Albums</h1>
        </div>
        <p className="text-muted max-w-2xl">
          From Ilaiyaraaja&apos;s classics to AR Rahman&apos;s revolutions — the greatest Tamil film soundtracks ever recorded.
        </p>
      </div>

      <AdUnit format="horizontal" className="mb-10 min-h-[90px]" />

      <section className="mb-16">
        <h2 className="text-2xl font-bold text-white mb-2">A.R. Rahman</h2>
        <p className="text-muted text-sm mb-6">The Mozart of Madras — defining Tamil music for 3 decades</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {rahman.map((a) => (
            <ContentCard key={a.id} href={`/albums/${a.slug}`} title={a.title} subtitle={`${a.artist} · ${a.year}`} gradient={a.gradient} type="album" badge={a.badge} year={a.year} tags={a.genre} />
          ))}
        </div>
      </section>

      <AdUnit format="rectangle" className="mb-16 min-h-[250px]" />

      <section>
        <h2 className="text-2xl font-bold text-white mb-2">Other Legendary Composers</h2>
        <p className="text-muted text-sm mb-6">Ilaiyaraaja, GV Prakash, Sam CS, Govind Vasantha & more</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {others.map((a) => (
            <ContentCard key={a.id} href={`/albums/${a.slug}`} title={a.title} subtitle={`${a.artist} · ${a.year}`} gradient={a.gradient} type="album" badge={a.badge} year={a.year} tags={a.genre} />
          ))}
        </div>
      </section>
    </div>
  )
}
