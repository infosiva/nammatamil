'use client'

import { useState, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, Tv2, Film, Music, Users } from 'lucide-react'
import ContentCard from '@/components/ContentCard'
import { serials } from '@/data/serials'
import { movies } from '@/data/movies'
import { albums } from '@/data/albums'
import { actors } from '@/data/actors'

type TabType = 'all' | 'serials' | 'movies' | 'albums' | 'actors'

const TABS: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: 'all', label: 'All', icon: Search },
  { id: 'serials', label: 'Serials', icon: Tv2 },
  { id: 'movies', label: 'Movies', icon: Film },
  { id: 'albums', label: 'Albums', icon: Music },
  { id: 'actors', label: 'Artists', icon: Users },
]

function SearchContent() {
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [tab, setTab] = useState<TabType>('all')

  const q = query.toLowerCase().trim()

  const results = useMemo(() => {
    if (!q) return { serials: [], movies: [], albums: [], actors: [] }

    const matchSerials = serials.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.channel.toLowerCase().includes(q) ||
      s.genre.some(g => g.toLowerCase().includes(q)) ||
      s.cast.some(c => c.toLowerCase().includes(q)) ||
      s.tags.some(t => t.toLowerCase().includes(q))
    )

    const matchMovies = movies.filter(m =>
      m.title.toLowerCase().includes(q) ||
      m.director.toLowerCase().includes(q) ||
      m.cast.some(c => c.toLowerCase().includes(q)) ||
      m.genre.some(g => g.toLowerCase().includes(q)) ||
      (m.originalLanguage?.toLowerCase().includes(q) ?? false)
    )

    const matchAlbums = albums.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.artist.toLowerCase().includes(q) ||
      (a.movieName?.toLowerCase().includes(q) ?? false) ||
      a.songs.some(s => s.toLowerCase().includes(q))
    )

    const matchActors = actors.filter(a =>
      a.name.toLowerCase().includes(q) ||
      (a.tamilName?.toLowerCase().includes(q) ?? false) ||
      a.notableWorks.some(w => w.toLowerCase().includes(q))
    )

    return { serials: matchSerials, movies: matchMovies, albums: matchAlbums, actors: matchActors }
  }, [q])

  const totalCount = results.serials.length + results.movies.length + results.albums.length + results.actors.length

  const showSerials = tab === 'all' || tab === 'serials'
  const showMovies  = tab === 'all' || tab === 'movies'
  const showAlbums  = tab === 'all' || tab === 'albums'
  const showActors  = tab === 'all' || tab === 'actors'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      {/* Search input */}
      <div className="mb-8 max-w-2xl mx-auto">
        <h1 className="text-3xl font-black text-white text-center mb-6">
          Search <span className="text-gradient">NammaTamil</span>
        </h1>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search serials, movies, albums, artists..."
            className="w-full pl-12 pr-4 py-4 rounded-2xl glass border border-white/10 text-white placeholder-slate-500 text-lg focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/30 bg-transparent transition-all"
            autoFocus
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap justify-center mb-8">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === id
                ? 'bg-gold-500/15 text-gold-400 border border-gold-500/30'
                : 'glass border border-white/5 text-muted hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Results */}
      {!q ? (
        <div className="text-center py-20">
          <Search className="w-12 h-12 text-muted mx-auto mb-4 opacity-40" />
          <p className="text-muted text-lg">Start typing to search Tamil entertainment</p>
          <p className="text-muted/60 text-sm mt-2">Serials · Movies · Albums · Artists</p>
        </div>
      ) : totalCount === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted text-lg">No results for <span className="text-white">&ldquo;{query}&rdquo;</span></p>
          <p className="text-muted/60 text-sm mt-2">Try a different search term</p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Serials */}
          {showSerials && results.serials.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Tv2 className="w-5 h-5 text-gold-400" /> Serials
                <span className="text-muted text-sm font-normal">({results.serials.length})</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {results.serials.map(s => (
                  <ContentCard key={s.id} href={`/serials/${s.slug}`} title={s.title} subtitle={s.channel} gradient={s.gradient} type="serial" rating={s.rating} channel={s.channel} status={s.status} language={s.language} />
                ))}
              </div>
            </section>
          )}

          {/* Movies */}
          {showMovies && results.movies.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Film className="w-5 h-5 text-crimson-500" /> Movies
                <span className="text-muted text-sm font-normal">({results.movies.length})</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {results.movies.map(m => (
                  <ContentCard key={m.id} href={`/movies/${m.slug}`} title={m.title} subtitle={m.director} gradient={m.gradient} type="movie" rating={m.rating} badge={m.badge} year={m.year} language={m.language} />
                ))}
              </div>
            </section>
          )}

          {/* Albums */}
          {showAlbums && results.albums.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Music className="w-5 h-5 text-pink-400" /> Albums
                <span className="text-muted text-sm font-normal">({results.albums.length})</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {results.albums.map(a => (
                  <ContentCard key={a.id} href={`/albums/${a.slug}`} title={a.title} subtitle={a.artist} gradient={a.gradient} type="album" badge={a.badge} year={a.year} tags={a.genre} />
                ))}
              </div>
            </section>
          )}

          {/* Actors */}
          {showActors && results.actors.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-400" /> Artists
                <span className="text-muted text-sm font-normal">({results.actors.length})</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.actors.map(a => (
                  <a key={a.id} href={`/actors/${a.slug}`} className="glass rounded-2xl p-4 border border-white/5 card-hover flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${a.gradient} flex-shrink-0`} />
                    <div className="min-w-0">
                      <p className="text-white font-semibold truncate">{a.name}</p>
                      <p className="text-muted text-sm capitalize">{a.type}</p>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <Search className="w-10 h-10 text-muted mx-auto mb-4 opacity-40 animate-pulse" />
        <p className="text-muted">Loading search...</p>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
