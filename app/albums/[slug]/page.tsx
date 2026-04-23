import { notFound } from 'next/navigation'
import { Music, Calendar, Film, Disc3 } from 'lucide-react'
import AdUnit from '@/components/AdUnit'
import ContentCard from '@/components/ContentCard'
import { albums } from '@/data/albums'
import type { Metadata } from 'next'
import clsx from 'clsx'

interface Props { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return albums.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const album = albums.find((a) => a.slug === slug)
  if (!album) return {}
  return {
    title: `${album.title} — ${album.artist} (${album.year})`,
    description: album.description,
    keywords: [album.title, album.artist, ...(album.movieName ? [album.movieName] : []), 'Tamil album', 'Tamil music'],
  }
}

export default async function AlbumDetailPage({ params }: Props) {
  const { slug } = await params
  const album = albums.find((a) => a.slug === slug)
  if (!album) notFound()

  const related = albums.filter((a) => a.id !== album.id && (a.artist === album.artist || a.genre.some(g => album.genre.includes(g)))).slice(0, 4)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="glass rounded-3xl overflow-hidden mb-10 border border-white/5">
        <div className={clsx('h-64 bg-gradient-to-br relative', album.gradient)}>
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/40 to-transparent" />
          <div className="absolute bottom-6 left-6">
            {album.badge && (
              <span className="badge bg-gold-500 text-dark-900 font-bold mb-3 block w-fit">{album.badge}</span>
            )}
            <h1 className="text-3xl md:text-5xl font-black text-white">{album.title}</h1>
            <p className="text-slate-300 mt-1">{album.artist} · {album.year}</p>
          </div>
        </div>

        <div className="p-6 md:p-8 grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-5">
            <p className="text-slate-300 leading-relaxed">{album.description}</p>
            <div className="flex flex-wrap gap-2">
              {album.genre.map(g => (
                <span key={g} className="badge bg-white/5 text-slate-300 border border-white/10">{g}</span>
              ))}
            </div>

            {album.songs.length > 0 && (
              <div>
                <p className="text-muted text-xs uppercase tracking-wider mb-3 flex items-center gap-1"><Disc3 className="w-3 h-3" /> Track List</p>
                <div className="space-y-2">
                  {album.songs.map((song, i) => (
                    <div key={song} className="flex items-center gap-3 glass rounded-xl px-4 py-2.5">
                      <span className="text-muted text-sm w-5 text-right flex-shrink-0">{i + 1}</span>
                      <Music className="w-3 h-3 text-gold-400 flex-shrink-0" />
                      <span className="text-white text-sm">{song}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="glass-gold rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted">
                <Music className="w-4 h-4 text-gold-400" /> {album.artist}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted">
                <Calendar className="w-4 h-4" /> {album.year}
              </div>
              {album.movieName && (
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Film className="w-4 h-4" /> {album.movieName}
                </div>
              )}
              <div className="text-muted text-sm">
                {album.songs.length} tracks
              </div>
            </div>
          </div>
        </div>
      </div>

      <AdUnit format="horizontal" className="mb-10 min-h-[90px]" />

      {related.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-white mb-4">More Albums</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {related.map((a) => (
              <ContentCard key={a.id} href={`/albums/${a.slug}`} title={a.title} subtitle={`${a.artist} · ${a.year}`} gradient={a.gradient} type="album" badge={a.badge} year={a.year} tags={a.genre} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
