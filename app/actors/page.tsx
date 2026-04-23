import { Users, Music, Film, Clapperboard } from 'lucide-react'
import Link from 'next/link'
import AdUnit from '@/components/AdUnit'
import { actors } from '@/data/actors'
import type { Metadata } from 'next'
import clsx from 'clsx'

export const metadata: Metadata = {
  title: 'Tamil Artists — Actors, Directors & Composers',
  description: 'Profiles of Tamil cinema\'s greatest actors, directors, and music composers — Rajinikanth, Vijay, AR Rahman, Ilaiyaraaja, Mani Ratnam and more.',
}

const TYPE_CONFIG = {
  actor:    { label: 'Actor',    icon: Film,        color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  actress:  { label: 'Actress',  icon: Film,        color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
  director: { label: 'Director', icon: Clapperboard, color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  composer: { label: 'Composer', icon: Music,        color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
}

export default function ActorsPage() {
  const byType = {
    actors:    actors.filter(a => a.type === 'actor' || a.type === 'actress'),
    directors: actors.filter(a => a.type === 'director'),
    composers: actors.filter(a => a.type === 'composer'),
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20">
            <Users className="w-6 h-6 text-teal-400" />
          </div>
          <h1 className="text-4xl font-black text-white">Tamil Artists</h1>
        </div>
        <p className="text-muted max-w-2xl">
          The legends behind Tamil cinema — actors, directors, and composers who defined and continue to shape Tamil entertainment.
        </p>
      </div>

      <AdUnit format="horizontal" className="mb-10 min-h-[90px]" />

      {/* Actors & Actresses */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-white mb-6">Actors & Actresses</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {byType.actors.map((person) => <ArtistCard key={person.id} person={person} />)}
        </div>
      </section>

      <AdUnit format="rectangle" className="mb-16 min-h-[250px]" />

      {/* Directors */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-white mb-6">Directors</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {byType.directors.map((person) => <ArtistCard key={person.id} person={person} />)}
        </div>
      </section>

      {/* Composers */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-6">Music Composers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {byType.composers.map((person) => <ArtistCard key={person.id} person={person} />)}
        </div>
      </section>
    </div>
  )
}

function ArtistCard({ person }: { person: (typeof actors)[0] }) {
  const cfg = TYPE_CONFIG[person.type]
  const Icon = cfg.icon
  return (
    <Link href={`/actors/${person.slug}`} className="group">
      <div className="glass rounded-2xl overflow-hidden border border-white/5 card-hover flex">
        {/* Colour strip */}
        <div className={clsx('w-2 bg-gradient-to-b flex-shrink-0', person.gradient)} />
        <div className="p-5 flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h3 className="text-white font-bold text-lg leading-tight group-hover:text-gold-300 transition-colors">
                {person.name}
              </h3>
              {person.tamilName && (
                <p className="text-gold-500/70 text-sm mt-0.5">{person.tamilName}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <span className={clsx('badge border flex items-center gap-1 text-xs', cfg.color)}>
                <Icon className="w-3 h-3" /> {cfg.label}
              </span>
              {person.badge && (
                <span className="badge bg-gold-500/15 text-gold-400 border border-gold-500/20 text-xs">
                  {person.badge}
                </span>
              )}
            </div>
          </div>
          <p className="text-muted text-sm line-clamp-2 mb-3">{person.description}</p>
          <div className="flex flex-wrap gap-1.5">
            {person.notableWorks.slice(0, 3).map(w => (
              <span key={w} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-slate-400">{w}</span>
            ))}
            {person.notableWorks.length > 3 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-slate-500">
                +{person.notableWorks.length - 3} more
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
