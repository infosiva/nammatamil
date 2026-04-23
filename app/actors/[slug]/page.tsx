import { notFound } from 'next/navigation'
import { Film, Music, Clapperboard, Calendar } from 'lucide-react'
import Link from 'next/link'
import AdUnit from '@/components/AdUnit'
import { actors } from '@/data/actors'
import { movies } from '@/data/movies'
import { albums } from '@/data/albums'
import ContentCard from '@/components/ContentCard'
import type { Metadata } from 'next'
import clsx from 'clsx'

interface Props { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return actors.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const person = actors.find(a => a.slug === slug)
  if (!person) return {}
  return {
    title: `${person.name} — Tamil ${person.type === 'composer' ? 'Composer' : person.type === 'director' ? 'Director' : 'Actor'}`,
    description: person.description,
    keywords: [person.name, ...(person.tamilName ? [person.tamilName] : []), ...person.notableWorks, 'Tamil cinema'],
  }
}

const TYPE_ICON = { actor: Film, actress: Film, director: Clapperboard, composer: Music }

export default async function ActorDetailPage({ params }: Props) {
  const { slug } = await params
  const person = actors.find(a => a.slug === slug)
  if (!person) notFound()

  const Icon = TYPE_ICON[person.type]

  // Find related movies (by cast or director name)
  const relatedMovies = movies
    .filter(m => m.cast.some(c => c.toLowerCase().includes(person.name.split(' ')[0].toLowerCase()))
      || m.director.toLowerCase().includes(person.name.split(' ')[0].toLowerCase()))
    .slice(0, 4)

  // Find related albums (by composer)
  const relatedAlbums = person.type === 'composer'
    ? albums.filter(a => a.artist === person.name).slice(0, 4)
    : []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      {/* Profile hero */}
      <div className="glass rounded-3xl overflow-hidden mb-10 border border-white/5">
        <div className={clsx('h-48 bg-gradient-to-br relative', person.gradient)}>
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/30 to-transparent" />
          {/* Floating orbs */}
          <div className="absolute top-4 right-10 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-black/30 blur-xl" />
        </div>

        <div className="px-6 md:px-8 pb-8">
          {/* Avatar */}
          <div className={clsx(
            'w-20 h-20 rounded-2xl bg-gradient-to-br border-4 border-dark-900 flex items-center justify-center -mt-10 mb-4',
            person.gradient
          )}>
            <Icon className="w-8 h-8 text-white" />
          </div>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white">{person.name}</h1>
              {person.tamilName && (
                <p className="text-gold-400 text-lg mt-1">{person.tamilName}</p>
              )}
              {person.badge && (
                <span className="mt-2 inline-block badge bg-gold-500 text-dark-900 font-bold">{person.badge}</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-muted text-sm">
              <Calendar className="w-4 h-4" />
              Born {person.born}
            </div>
          </div>

          <p className="text-slate-300 leading-relaxed mt-4 max-w-3xl">{person.description}</p>

          {/* Known for */}
          <div className="flex flex-wrap gap-2 mt-4">
            {person.knownFor.map(k => (
              <span key={k} className="badge bg-white/5 text-slate-300 border border-white/10">{k}</span>
            ))}
          </div>

          {/* Notable works */}
          <div className="mt-6">
            <p className="text-muted text-xs uppercase tracking-wider mb-3">Notable Works</p>
            <div className="flex flex-wrap gap-2">
              {person.notableWorks.map(w => (
                <span key={w} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/8 text-white text-sm hover:bg-white/10 transition-colors">
                  {w}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AdUnit format="horizontal" className="mb-10 min-h-[90px]" />

      {/* Related movies */}
      {relatedMovies.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-bold text-white mb-4">
            {person.type === 'director' ? 'Directed Films' : 'Films Featuring'} {person.name.split(' ')[0]}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {relatedMovies.map(m => (
              <ContentCard key={m.id} href={`/movies/${m.slug}`} title={m.title} subtitle={m.director} gradient={m.gradient} type="movie" rating={m.rating} badge={m.badge} year={m.year} language={m.language} />
            ))}
          </div>
        </section>
      )}

      {/* Related albums */}
      {relatedAlbums.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-white mb-4">Albums by {person.name}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {relatedAlbums.map(a => (
              <ContentCard key={a.id} href={`/albums/${a.slug}`} title={a.title} subtitle={a.artist} gradient={a.gradient} type="album" badge={a.badge} year={a.year} tags={a.genre} />
            ))}
          </div>
        </section>
      )}

      {relatedMovies.length === 0 && relatedAlbums.length === 0 && (
        <div className="text-center py-12 text-muted">
          <p>More content coming soon for {person.name}.</p>
          <Link href="/movies" className="mt-4 inline-block text-gold-400 hover:text-gold-300 text-sm">
            Browse all movies →
          </Link>
        </div>
      )}
    </div>
  )
}
