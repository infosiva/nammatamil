'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import {
  Tv2, Film, Music, Globe, ArrowRight, TrendingUp, Star, Play,
  Youtube, Trophy, Search, X, Clock,
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
function SectionHeader({ title, icon: Icon, iconClass, href }: {
  title: string; icon: React.ElementType; iconClass: string; href?: string
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-[13px] font-black text-white flex items-center gap-2 tracking-tight">
        <span className={`w-6 h-6 rounded-lg flex items-center justify-center ${iconClass.replace('text-', 'bg-').replace('-400','-500/10')}`}>
          <Icon className={`w-3.5 h-3.5 ${iconClass}`} />
        </span>
        {title}
      </h2>
      {href && (
        <Link href={href}
          className="flex items-center gap-1 text-[11px] font-semibold transition-colors"
          style={{ color: 'rgba(245,158,11,0.7)' }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#f59e0b')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(245,158,11,0.7)')}>
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  )
}

function Shelf({
  title, icon: Icon, iconClass, href, children,
}: {
  title: string; icon: React.ElementType; iconClass: string; href?: string; children: React.ReactNode
}) {
  return (
    <section>
      <SectionHeader title={title} icon={Icon} iconClass={iconClass} href={href} />
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

interface RecentEp {
  id: string
  title: string
  videoId: string
  channelName: string
  channelColor: string
  publishedAt: string
  thumbnail: string
}

const FALLBACK_EPS: RecentEp[] = [
  { id: 'fb1', title: 'Pandian Stores Latest Episode',  videoId: 'PLFMg3Wg8v7g', channelName: 'Vijay TV',     channelColor: '#f97316', publishedAt: '', thumbnail: 'https://img.youtube.com/vi/PLFMg3Wg8v7g/mqdefault.jpg' },
  { id: 'fb2', title: 'Baakiyalakshmi Latest Episode',  videoId: '5-GkuN8QT6E',  channelName: 'Vijay TV',     channelColor: '#f97316', publishedAt: '', thumbnail: 'https://img.youtube.com/vi/5-GkuN8QT6E/mqdefault.jpg'  },
  { id: 'fb3', title: 'Raja Rani S2 Latest Episode',    videoId: 'fFDolUh5mXw',  channelName: 'Zee Tamil',    channelColor: '#7c3aed', publishedAt: '', thumbnail: 'https://img.youtube.com/vi/fFDolUh5mXw/mqdefault.jpg'  },
  { id: 'fb4', title: 'Chithi Latest Episode',          videoId: 'dY8K5PdZBQk',  channelName: 'Sun TV',       channelColor: '#dc2626', publishedAt: '', thumbnail: 'https://img.youtube.com/vi/dY8K5PdZBQk/mqdefault.jpg'  },
  { id: 'fb5', title: 'Anandham Latest Episode',        videoId: 'mHSoNLpHKBI',  channelName: 'Sun TV',       channelColor: '#dc2626', publishedAt: '', thumbnail: 'https://img.youtube.com/vi/mHSoNLpHKBI/mqdefault.jpg'  },
  { id: 'fb6', title: 'Rettai Roja Latest Episode',     videoId: '2V9UiWnSi1c',  channelName: 'Colors Tamil', channelColor: '#ec4899', publishedAt: '', thumbnail: 'https://img.youtube.com/vi/2V9UiWnSi1c/mqdefault.jpg'  },
]

function useRecentEpisodes() {
  const [eps, setEps] = useState<RecentEp[]>(FALLBACK_EPS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check local cache first (6h TTL in sessionStorage)
    try {
      const raw = sessionStorage.getItem('recent_eps')
      if (raw) {
        const { data, ts } = JSON.parse(raw) as { data: RecentEp[]; ts: number }
        if (Date.now() - ts < 6 * 60 * 60 * 1000) {
          setEps(data)
          setLoading(false)
          return
        }
      }
    } catch { /* ignore */ }

    fetch('/api/recent-episodes')
      .then(r => r.json())
      .then(({ episodes }: { episodes: RecentEp[] }) => {
        if (episodes?.length) {
          setEps(episodes)
          try { sessionStorage.setItem('recent_eps', JSON.stringify({ data: episodes, ts: Date.now() })) } catch { /* ignore */ }
        }
      })
      .catch(() => { /* keep fallback */ })
      .finally(() => setLoading(false))
  }, [])

  return { eps, loading }
}

function dayLabel(publishedAt: string) {
  if (!publishedAt) return 'Recent'
  const diff = Date.now() - new Date(publishedAt).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

function RecentEpisodeCard({ ep }: { ep: RecentEp }) {
  return (
    <a
      href={`https://www.youtube.com/watch?v=${ep.videoId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
      style={{ textDecoration: 'none' }}
    >
      <div className="rounded-xl overflow-hidden" style={{ background: '#100008', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="relative aspect-video overflow-hidden bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ep.thumbnail} alt={ep.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85 group-hover:opacity-100"
            loading="lazy" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/10 transition-colors">
            <div className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Play className="w-4 h-4 text-white ml-0.5 fill-white" />
            </div>
          </div>
          <div className="absolute top-2 left-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white"
            style={{ background: ep.channelColor + 'dd' }}>
            <Clock className="w-2.5 h-2.5" /> {dayLabel(ep.publishedAt)}
          </div>
        </div>
        <div className="px-3 py-2">
          <p className="text-white text-xs font-bold truncate leading-snug">{ep.title}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Youtube className="w-2.5 h-2.5 text-red-500" />
            <span className="text-white/35 text-[10px] truncate">{ep.channelName}</span>
          </div>
        </div>
      </div>
    </a>
  )
}

/* ── Featured / Home Tab ─────────────────────────────────────────────────────── */
function FeaturedTab({ movies, serials, albums }: Props) {
  const featuredSerials = serials.slice(0, 10)
  const featuredMovies  = movies.filter(m => m.language === 'Tamil').slice(0, 10)
  const dubbedMovies    = movies.filter(m => m.language === 'Tamil Dubbed').slice(0, 8)
  const featuredAlbums  = albums.slice(0, 8)
  const { eps, loading } = useRecentEpisodes()

  return (
    <div className="space-y-10">
      {/* Recent Episodes */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[13px] font-black text-white flex items-center gap-2 tracking-tight">
            <span className="w-6 h-6 rounded-lg flex items-center justify-center bg-red-500/10">
              <Clock className="w-3.5 h-3.5 text-red-400" />
            </span>
            Recent Episodes
            <span className="text-[10px] font-normal ml-1" style={{ color: 'rgba(255,255,255,0.25)' }}>Last 7 days</span>
          </h2>
          <a href="https://www.youtube.com/@SunTV" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] font-semibold text-red-400 hover:text-red-300 transition-colors">
            <Youtube className="w-3 h-3" /> YouTube
          </a>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl aspect-video shimmer" style={{ background: 'rgba(255,255,255,0.04)' }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {eps.slice(0, 6).map(ep => (
              <RecentEpisodeCard key={ep.id} ep={ep} />
            ))}
          </div>
        )}
      </section>

      {/* Popular Serials */}
      <section>
        <SectionHeader title="Popular Serials" icon={Tv2} iconClass="text-orange-400" href="/serials" />
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {featuredSerials.slice(0, 10).map(s => (
            <ContentCard key={s.id} href={`/serials/${s.slug}`} title={s.title} subtitle={s.channel}
              gradient={s.gradient} type="serial" rating={s.rating} language={s.language}
              channel={s.channel} status={s.status} tags={s.tags} />
          ))}
        </div>
      </section>

      {/* Ad slot 1 */}
      <AdUnit format="horizontal" className="min-h-[90px]" />

      {/* Must-Watch Movies */}
      <section>
        <SectionHeader title="Must-Watch Movies" icon={TrendingUp} iconClass="text-red-400" href="/movies" />
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {featuredMovies.slice(0, 10).map(m => (
            <ContentCard key={m.id} href={`/movies/${m.slug}`} title={m.title} subtitle={m.director}
              gradient={m.gradient} type="movie" rating={m.rating} badge={m.badge}
              year={m.year} language={m.language} />
          ))}
        </div>
      </section>

      {/* Latest Videos */}
      <section>
        <SectionHeader title="Latest Videos & Trailers" icon={Youtube} iconClass="text-red-400" />
        <VideoShowcase />
      </section>

      {/* Ad slot 2 */}
      <AdUnit format="horizontal" className="min-h-[90px]" />

      {/* Tamil Dubbed Gems */}
      <section>
        <SectionHeader title="Tamil Dubbed Gems" icon={Globe} iconClass="text-cyan-400" href="/movies" />
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {dubbedMovies.slice(0, 10).map(m => (
            <ContentCard key={m.id} href={`/movies/${m.slug}`} title={m.title}
              subtitle={`${m.director} · ${m.originalLanguage}`}
              gradient={m.gradient} type="movie" rating={m.rating} badge={m.badge}
              year={m.year} language={m.language} />
          ))}
        </div>
      </section>

      {/* Iconic Albums */}
      <section>
        <SectionHeader title="Iconic Albums" icon={Music} iconClass="text-pink-400" href="/albums" />
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {featuredAlbums.slice(0, 10).map(a => (
            <ContentCard href={`/albums/${a.slug}`} title={a.title} subtitle={a.artist}
              gradient={a.gradient} type="album" badge={a.badge} year={a.year} tags={a.genre} />
          ))}
        </div>
      </section>

      {/* Ad slot 3 */}
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

// Real IPL 2026 standings — after Match 39 (Apr 27) — source: cricketaddictor.com
const IPL_2026_STANDINGS = [
  { pos: 1,  team: 'Punjab Kings',                short: 'PBKS', played: 7, w: 6, l: 0, pts: 13, nrr: '+1.333', color: '#a855f7' },
  { pos: 2,  team: 'Royal Challengers Bengaluru', short: 'RCB',  played: 8, w: 6, l: 2, pts: 12, nrr: '+1.919', color: '#ef4444' },
  { pos: 3,  team: 'Sunrisers Hyderabad',         short: 'SRH',  played: 8, w: 5, l: 3, pts: 10, nrr: '+0.815', color: '#f97316' },
  { pos: 4,  team: 'Rajasthan Royals',            short: 'RR',   played: 8, w: 5, l: 3, pts: 10, nrr: '+0.602', color: '#ec4899' },
  { pos: 5,  team: 'Gujarat Titans',              short: 'GT',   played: 8, w: 4, l: 4, pts: 8,  nrr: '-0.475', color: '#6b7280' },
  { pos: 6,  team: 'Chennai Super Kings',         short: 'CSK',  played: 8, w: 3, l: 5, pts: 6,  nrr: '-0.121', color: '#eab308' },
  { pos: 7,  team: 'Delhi Capitals',              short: 'DC',   played: 8, w: 3, l: 5, pts: 6,  nrr: '-1.060', color: '#3b82f6' },
  { pos: 8,  team: 'Kolkata Knight Riders',       short: 'KKR',  played: 8, w: 2, l: 5, pts: 5,  nrr: '-0.751', color: '#7c3aed' },
  { pos: 9,  team: 'Mumbai Indians',              short: 'MI',   played: 7, w: 2, l: 5, pts: 4,  nrr: '-0.736', color: '#0ea5e9' },
  { pos: 10, team: 'Lucknow Super Giants',        short: 'LSG',  played: 8, w: 2, l: 6, pts: 4,  nrr: '-1.106', color: '#14b8a6' },
]

/* ── Cricket Tab ─────────────────────────────────────────────────────────────── */
function CricketTab() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CricketWidget />

        {/* Real IPL 2026 Points Table */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #001a0a 0%, #002d14 60%)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <div className="px-4 py-3 border-b border-green-500/10 flex items-center justify-between">
            <h3 className="text-white font-bold text-sm flex items-center gap-2">
              <Trophy className="w-4 h-4 text-green-400" /> IPL 2026 Points Table
            </h3>
            <a href="https://www.iplt20.com/points-table/men/2026" target="_blank" rel="noopener noreferrer"
              className="text-[10px] text-white/30 hover:text-white/60 transition-colors">
              iplt20.com →
            </a>
          </div>

          {/* Column headers */}
          <div className="flex items-center gap-2 px-4 py-1.5 border-b border-white/5">
            <span className="text-white/20 text-[9px] w-4">#</span>
            <span className="text-white/20 text-[9px] flex-1">TEAM</span>
            <span className="text-white/20 text-[9px] w-5 text-center">P</span>
            <span className="text-white/20 text-[9px] w-5 text-center">W</span>
            <span className="text-white/20 text-[9px] w-5 text-center">L</span>
            <span className="text-white/20 text-[9px] w-12 text-right">NRR</span>
            <span className="text-white/20 text-[9px] w-8 text-right">PTS</span>
          </div>

          <div className="divide-y divide-white/[0.04]">
            {IPL_2026_STANDINGS.map((row, i) => (
              <div key={row.short}
                className="flex items-center gap-2 px-4 py-2.5"
                style={{ background: row.short === 'CSK' ? 'rgba(247,222,0,0.06)' : i < 4 ? 'rgba(34,197,94,0.03)' : 'transparent' }}>
                <span className="text-white/30 text-[10px] w-4 flex-shrink-0">{row.pos}</span>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-black text-white flex-shrink-0"
                    style={{ background: row.color }}>
                    {row.short.slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs block truncate" style={{ color: row.color }}>{row.short}</span>
                    <span className="text-white/30 text-[9px] truncate block">{row.team}</span>
                  </div>
                  {i < 4 && <span className="text-[8px] text-green-400/70 flex-shrink-0 ml-1">●</span>}
                </div>
                <span className="text-white/40 text-[10px] w-5 text-center">{row.played}</span>
                <span className="text-green-400 text-[10px] w-5 text-center font-semibold">{row.w}</span>
                <span className="text-red-400/60 text-[10px] w-5 text-center">{row.l}</span>
                <span className={`text-[10px] w-12 text-right font-mono ${parseFloat(row.nrr) >= 0 ? 'text-green-400/80' : 'text-red-400/60'}`}>{row.nrr}</span>
                <span className="font-black text-xs w-8 text-right" style={{ color: row.color }}>{row.pts}</span>
              </div>
            ))}
          </div>
          <div className="px-4 py-2 border-t border-white/5">
            <p className="text-white/20 text-[9px]">● Top 4 qualify for playoffs · Updated Apr 28 2026</p>
          </div>
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
      {/* ── Tab Bar ── */}
      <div className="mb-5 -mx-4 sm:mx-0">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide px-4 sm:px-0 pb-1">
          {TABS.map(({ id, label, icon: Icon, color }) => {
            const isActive = activeTab === id
            const [textColor] = color.split(' ')
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                  isActive ? textColor : 'text-white/30 hover:text-white/60'
                }`}
                style={isActive ? {
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                } : {
                  background: 'transparent',
                  border: '1px solid transparent',
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            )
          })}
        </div>
        <div className="h-px mt-1" style={{ background: 'rgba(255,255,255,0.05)' }} />
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
              <SectionHeader title="Tamil Trailers & Highlights" icon={Youtube} iconClass="text-red-400" />
              <p className="text-[11px] mb-4" style={{ color: 'rgba(255,255,255,0.25)' }}>Latest trailers, song releases, IPL highlights</p>
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
