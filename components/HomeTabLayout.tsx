'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Tv2, Film, Music, Globe, ArrowRight, TrendingUp, Star, Play,
  Youtube, Trophy, Search, X,
} from 'lucide-react'
import ContentCard from '@/components/ContentCard'
import OTTExplorer from '@/components/OTTExplorer'
import CricketWidget from '@/components/CricketWidget'
import VideoShowcase from '@/components/VideoShowcase'
import AdUnit from '@/components/AdUnit'
import type { Movie } from '@/data/movies'
import type { Serial } from '@/data/serials'
import type { Album } from '@/data/albums'

const TABS = [
  { id: 'featured', label: 'Home',    icon: Star,    color: 'text-gold-400   border-gold-400'   },
  { id: 'movies',   label: 'Movies',  icon: Film,    color: 'text-blue-400   border-blue-400'   },
  { id: 'serials',  label: 'Serials', icon: Tv2,     color: 'text-orange-400 border-orange-400' },
  { id: 'ott',      label: 'OTT',     icon: Play,    color: 'text-rose-400   border-rose-400'   },
  { id: 'videos',   label: 'Videos',  icon: Youtube, color: 'text-red-400    border-red-400'    },
  { id: 'cricket',  label: 'Cricket', icon: Trophy,  color: 'text-green-400  border-green-400'  },
  { id: 'albums',   label: 'Albums',  icon: Music,   color: 'text-pink-400   border-pink-400'   },
]

interface Props { movies: Movie[]; serials: Serial[]; albums: Album[] }

/* ── Shared search bar ─────────────────────────────────────────────────────── */
function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-9 py-2 rounded-xl text-sm text-white placeholder-white/25 outline-none transition-all"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
        onFocus={e => (e.currentTarget.style.borderColor = 'rgba(245,158,11,0.4)')}
        onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
      />
      {value && (
        <button onClick={() => onChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}

/* ── Horizontal scroll shelf ────────────────────────────────────────────────── */
function Shelf({
  title, icon: Icon, iconClass, href, children,
}: {
  title: string; icon: React.ElementType; iconClass: string; href?: string; children: React.ReactNode
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-black text-white flex items-center gap-1.5">
          <Icon className={`w-4 h-4 ${iconClass}`} />
          {title}
        </h2>
        {href && (
          <Link href={href} className="text-gold-400 text-[11px] flex items-center gap-0.5 hover:text-gold-300 transition-colors">
            See all <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
      {/* Horizontal scroll row */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        {children}
      </div>
    </section>
  )
}

/* ── Card wrapper for shelf items ───────────────────────────────────────────── */
function ShelfCard({ children }: { children: React.ReactNode }) {
  return <div className="flex-shrink-0 w-28 sm:w-32">{children}</div>
}

/* ── Featured / Home Tab ─────────────────────────────────────────────────────── */
function FeaturedTab({ movies, serials, albums }: Props) {
  const featuredSerials = serials.slice(0, 10)
  const featuredMovies  = movies.filter(m => m.language === 'Tamil').slice(0, 10)
  const dubbedMovies    = movies.filter(m => m.language === 'Tamil Dubbed').slice(0, 8)
  const featuredAlbums  = albums.slice(0, 8)

  return (
    <div className="space-y-7">
      {/* Popular Serials */}
      <Shelf title="Popular Serials" icon={Tv2} iconClass="text-orange-400" href="/serials">
        {featuredSerials.map(s => (
          <ShelfCard key={s.id}>
            <ContentCard href={`/serials/${s.slug}`} title={s.title} subtitle={s.channel}
              gradient={s.gradient} type="serial" rating={s.rating} language={s.language}
              channel={s.channel} status={s.status} tags={s.tags} compact />
          </ShelfCard>
        ))}
      </Shelf>

      {/* Ad slot 1 — between serials and movies */}
      <AdUnit format="horizontal" className="min-h-[90px]" />

      {/* Must-Watch Movies */}
      <Shelf title="Must-Watch Movies" icon={TrendingUp} iconClass="text-crimson-500" href="/movies">
        {featuredMovies.map(m => (
          <ShelfCard key={m.id}>
            <ContentCard href={`/movies/${m.slug}`} title={m.title} subtitle={m.director}
              gradient={m.gradient} type="movie" rating={m.rating} badge={m.badge}
              year={m.year} language={m.language} compact />
          </ShelfCard>
        ))}
      </Shelf>

      {/* Latest Videos */}
      <section>
        <h2 className="text-sm font-black text-white flex items-center gap-1.5 mb-3">
          <Youtube className="w-4 h-4 text-red-400" />
          Latest Videos &amp; Trailers
        </h2>
        <VideoShowcase />
      </section>

      {/* Ad slot 2 — between videos and dubbed gems */}
      <AdUnit format="horizontal" className="min-h-[90px]" />

      {/* Tamil Dubbed Gems */}
      <Shelf title="Tamil Dubbed Gems" icon={Globe} iconClass="text-cyan-400" href="/movies?lang=Tamil+Dubbed">
        {dubbedMovies.map(m => (
          <ShelfCard key={m.id}>
            <ContentCard href={`/movies/${m.slug}`} title={m.title}
              subtitle={`${m.director} · ${m.originalLanguage}`}
              gradient={m.gradient} type="movie" rating={m.rating} badge={m.badge}
              year={m.year} language={m.language} compact />
          </ShelfCard>
        ))}
      </Shelf>

      {/* Iconic Albums */}
      <Shelf title="Iconic Albums" icon={Music} iconClass="text-pink-400" href="/albums">
        {featuredAlbums.map(a => (
          <ShelfCard key={a.id}>
            <ContentCard href={`/albums/${a.slug}`} title={a.title} subtitle={a.artist}
              gradient={a.gradient} type="album" badge={a.badge} year={a.year} tags={a.genre} compact />
          </ShelfCard>
        ))}
      </Shelf>

      {/* Ad slot 3 — below albums */}
      <AdUnit format="rectangle" className="min-h-[250px]" />
    </div>
  )
}

/* ── Movies Tab ──────────────────────────────────────────────────────────────── */
function MoviesTab({ movies }: { movies: Movie[] }) {
  const [q, setQ]         = useState('')
  const [lang, setLang]   = useState<'All' | 'Tamil' | 'Tamil Dubbed'>('All')
  const [genre, setGenre] = useState('All')
  const [sort, setSort]   = useState<'rating' | 'year'>('rating')

  const allGenres = useMemo(() => {
    const s = new Set<string>()
    movies.forEach(m => m.genre.forEach(g => s.add(g)))
    return ['All', ...Array.from(s).sort()]
  }, [movies])

  const filtered = useMemo(() => {
    let out = movies
    if (lang !== 'All') out = out.filter(m => m.language === lang)
    if (genre !== 'All') out = out.filter(m => m.genre.some(g => g === genre))
    if (q) {
      const ql = q.toLowerCase()
      out = out.filter(m =>
        m.title.toLowerCase().includes(ql) ||
        m.director.toLowerCase().includes(ql) ||
        m.cast.some(c => c.toLowerCase().includes(ql))
      )
    }
    return [...out].sort((a, b) => sort === 'rating' ? b.rating - a.rating : b.year - a.year)
  }, [movies, q, lang, genre, sort])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex-1 min-w-[160px]">
          <SearchBar value={q} onChange={setQ} placeholder="Title, director, cast…" />
        </div>
        <div className="flex gap-1">
          {(['All', 'Tamil', 'Tamil Dubbed'] as const).map(l => (
            <button key={l} onClick={() => setLang(l)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                lang === l ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                           : 'text-white/40 border border-white/10 hover:text-white/70'}`}>
              {l}
            </button>
          ))}
        </div>
        <select value={genre} onChange={e => setGenre(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg text-xs text-white/70 outline-none"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
          {allGenres.slice(0, 8).map(g => <option key={g} value={g} className="bg-gray-900">{g}</option>)}
        </select>
        <select value={sort} onChange={e => setSort(e.target.value as 'rating' | 'year')}
          className="px-2.5 py-1.5 rounded-lg text-xs text-white/70 outline-none"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
          <option value="rating" className="bg-gray-900">Top Rated</option>
          <option value="year"   className="bg-gray-900">Latest</option>
        </select>
      </div>
      <div className="text-white/25 text-xs">{filtered.length} movies</div>
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-2.5">
        {filtered.map(m => (
          <ContentCard key={m.id} href={`/movies/${m.slug}`} title={m.title} subtitle={m.director}
            gradient={m.gradient} type="movie" rating={m.rating} badge={m.badge}
            year={m.year} language={m.language} compact />
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="text-center py-10 text-white/30">
          <Film className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No movies found</p>
        </div>
      )}
    </div>
  )
}

/* ── Serials Tab ─────────────────────────────────────────────────────────────── */
function SerialsTab({ serials }: { serials: Serial[] }) {
  const [q, setQ]           = useState('')
  const [channel, setChannel] = useState('All')
  const [status, setStatus]   = useState<'All' | 'Ongoing' | 'Completed'>('All')

  const channels = useMemo(() => {
    const s = new Set(serials.map(s => s.channel).filter(Boolean))
    return ['All', ...Array.from(s).sort()]
  }, [serials])

  const filtered = useMemo(() => {
    let out = serials
    if (channel !== 'All') out = out.filter(s => s.channel === channel)
    if (status !== 'All') out = out.filter(s => s.status === status)
    if (q) {
      const ql = q.toLowerCase()
      out = out.filter(s =>
        s.title.toLowerCase().includes(ql) ||
        s.channel?.toLowerCase().includes(ql)
      )
    }
    return out
  }, [serials, q, channel, status])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex-1 min-w-[160px]">
          <SearchBar value={q} onChange={setQ} placeholder="Serial name, channel…" />
        </div>
        <select value={channel} onChange={e => setChannel(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg text-xs text-white/70 outline-none"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
          {channels.map(c => <option key={c} value={c} className="bg-gray-900">{c}</option>)}
        </select>
        {(['All', 'Ongoing', 'Completed'] as const).map(s => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              status === s ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                          : 'text-white/40 border border-white/10 hover:text-white/70'}`}>
            {s}
          </button>
        ))}
      </div>
      <div className="text-white/25 text-xs">{filtered.length} serials</div>
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-2.5">
        {filtered.map(s => (
          <ContentCard key={s.id} href={`/serials/${s.slug}`} title={s.title} subtitle={s.channel}
            gradient={s.gradient} type="serial" rating={s.rating} language={s.language}
            channel={s.channel} status={s.status} tags={s.tags} compact />
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="text-center py-10 text-white/30">
          <Tv2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No serials found</p>
        </div>
      )}
    </div>
  )
}

/* ── Albums Tab ──────────────────────────────────────────────────────────────── */
function AlbumsTab({ albums }: { albums: Album[] }) {
  const [q, setQ] = useState('')
  const filtered = useMemo(() => {
    if (!q) return albums
    const ql = q.toLowerCase()
    return albums.filter(a =>
      a.title.toLowerCase().includes(ql) ||
      a.artist.toLowerCase().includes(ql) ||
      a.genre?.some(g => g.toLowerCase().includes(ql))
    )
  }, [albums, q])

  return (
    <div className="space-y-4">
      <SearchBar value={q} onChange={setQ} placeholder="Album, artist, genre…" />
      <div className="text-white/25 text-xs">{filtered.length} albums</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
        {filtered.map(a => (
          <ContentCard key={a.id} href={`/albums/${a.slug}`} title={a.title} subtitle={a.artist}
            gradient={a.gradient} type="album" badge={a.badge} year={a.year} tags={a.genre} />
        ))}
      </div>
    </div>
  )
}

/* ── Cricket Tab ─────────────────────────────────────────────────────────────── */
function CricketTab() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CricketWidget />
        <div className="rounded-2xl p-4 space-y-2.5"
          style={{ background: 'linear-gradient(160deg, #001a0a 0%, #002d14 60%)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            <Trophy className="w-4 h-4 text-green-400" /> IPL 2025 Points Table
          </h3>
          <div className="space-y-1.5 text-xs">
            {[
              { pos: 1, team: 'Royal Challengers Bangalore', short: 'RCB', w: 6, color: '#dc2626' },
              { pos: 2, team: 'Chennai Super Kings',          short: 'CSK', w: 5, color: '#f7de00' },
              { pos: 3, team: 'Mumbai Indians',               short: 'MI',  w: 5, color: '#005da0' },
              { pos: 4, team: 'Kolkata Knight Riders',        short: 'KKR', w: 4, color: '#6d28d9' },
              { pos: 5, team: 'Sunrisers Hyderabad',          short: 'SRH', w: 4, color: '#f97316' },
            ].map(row => (
              <div key={row.team} className="flex items-center gap-2 py-1 border-b border-white/5">
                <span className="text-white/30 w-4 text-right text-[10px]">{row.pos}</span>
                <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-black text-white flex-shrink-0"
                  style={{ background: row.color }}>
                  {row.short.slice(0, 2)}
                </div>
                <span className="text-white/70 flex-1 truncate">{row.team}</span>
                <span className="text-green-400 font-bold">{row.w * 2}pts</span>
              </div>
            ))}
          </div>
          <p className="text-white/20 text-[9px]">* Indicative — check ESPNCricinfo for official standings</p>
        </div>
      </div>
    </div>
  )
}

/* ── Main Component ──────────────────────────────────────────────────────────── */
export default function HomeTabLayout({ movies, serials, albums }: Props) {
  const [activeTab, setActiveTab] = useState('featured')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Tab Bar */}
      <div className="relative mb-5 -mx-4 sm:mx-0">
        <div className="flex gap-0.5 overflow-x-auto scrollbar-hide px-4 sm:px-0 pb-1">
          {TABS.map(({ id, label, icon: Icon, color }) => {
            const isActive = activeTab === id
            const [textColor, borderColor] = color.split(' ')
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 border-b-2 ${
                  isActive
                    ? `${textColor} ${borderColor} bg-white/5`
                    : 'text-white/35 border-transparent hover:text-white/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            )
          })}
        </div>
        <div className="h-px bg-white/5 -mx-4 sm:mx-0" />
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'featured' && <FeaturedTab movies={movies} serials={serials} albums={albums} />}
        {activeTab === 'movies'   && <MoviesTab movies={movies} />}
        {activeTab === 'serials'  && <SerialsTab serials={serials} />}
        {activeTab === 'ott'      && <OTTExplorer />}
        {activeTab === 'videos'   && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-black text-white mb-1 flex items-center gap-2">
                <Youtube className="w-4 h-4 text-red-400" /> Tamil Trailers &amp; Highlights
              </h2>
              <p className="text-white/25 text-xs mb-4">Latest trailers, song releases, IPL highlights</p>
            </div>
            <VideoShowcase />
            <AdUnit format="rectangle" className="min-h-[250px]" />
          </div>
        )}
        {activeTab === 'cricket' && <CricketTab />}
        {activeTab === 'albums'  && <AlbumsTab albums={albums} />}
      </div>
    </div>
  )
}
