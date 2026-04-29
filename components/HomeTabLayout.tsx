'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import {
  Tv2, Film, Music, Play, Search, X,
  Radio, Trophy, ChevronRight,
} from 'lucide-react'
import ContentCard from '@/components/ContentCard'
import OTTExplorer from '@/components/OTTExplorer'
import CricketWidget from '@/components/CricketWidget'
import type { Movie } from '@/data/movies'
import type { Serial } from '@/data/serials'
import type { Album } from '@/data/albums'

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'movies',  label: 'Movies',  icon: Film,   color: '#60a5fa' },
  { id: 'serials', label: 'Serials', icon: Tv2,    color: '#f97316' },
  { id: 'live',    label: 'Live',    icon: Radio,  color: '#f87171' },
  { id: 'cricket', label: 'Cricket', icon: Trophy, color: '#4ade80' },
  { id: 'albums',  label: 'Albums',  icon: Music,  color: '#f472b6' },
  { id: 'ott',     label: 'OTT',     icon: Play,   color: '#a78bfa' },
]

interface Props { movies: Movie[]; serials: Serial[]; albums: Album[] }


// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ label, count, href, color }: { label: string; count?: number; href?: string; color?: string }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <h3 className="font-black text-sm text-white flex items-center gap-1.5">
        {label}
        {count !== undefined && (
          <span className="text-[11px] font-normal text-white/25">{count}</span>
        )}
      </h3>
      {href && (
        <Link href={href} className="text-xs font-semibold flex items-center gap-0.5 transition-colors hover:text-white"
          style={{ color: color ?? 'rgba(255,255,255,0.35)' }}>
          All <ChevronRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  )
}

// ── Card grid — 3 on mobile, 4 on xl ─────────────────────────────────────────
function CardGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
      {children}
    </div>
  )
}

// ── Inline search toggle ───────────────────────────────────────────────────────
function SearchToggle({ placeholder, value, onChange }: { placeholder: string; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  return open ? (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
      <input
        autoFocus
        type="text" value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2 rounded-xl text-sm text-white placeholder-white/25 outline-none"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
      />
      <button onClick={() => { setOpen(false); onChange('') }}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  ) : (
    <button onClick={() => setOpen(true)}
      className="p-2 rounded-xl text-white/35 hover:text-white/70 transition-colors"
      style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
      <Search className="w-4 h-4" />
    </button>
  )
}

// ── Movies Tab ────────────────────────────────────────────────────────────────
function MoviesTab({ movies }: { movies: Movie[] }) {
  const [q, setQ]     = useState('')
  const [lang, setLang] = useState<'All' | 'Tamil' | 'Dubbed'>('All')
  const [show, setShow] = useState(false)

  const filtered = useMemo(() => {
    let out = movies
    if (lang === 'Tamil')  out = out.filter(m => m.language === 'Tamil')
    if (lang === 'Dubbed') out = out.filter(m => m.language === 'Tamil Dubbed')
    if (q) {
      const ql = q.toLowerCase()
      out = out.filter(m =>
        m.title.toLowerCase().includes(ql) ||
        m.director.toLowerCase().includes(ql) ||
        m.cast.some(c => c.toLowerCase().includes(ql))
      )
    }
    // Sort by year desc first, then rating — newest first
    return [...out].sort((a, b) => b.year !== a.year ? b.year - a.year : b.rating - a.rating)
  }, [movies, q, lang])

  const visible = show ? filtered : filtered.slice(0, 9)

  return (
    <div className="space-y-3">
      {/* Controls row */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-1 flex-1">
          {(['All', 'Tamil', 'Dubbed'] as const).map(l => (
            <button key={l} onClick={() => setLang(l)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
              style={lang === l
                ? { background: 'rgba(96,165,250,0.18)', color: '#93c5fd', border: '1px solid rgba(96,165,250,0.4)' }
                : { color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {l}
            </button>
          ))}
        </div>
        <SearchToggle placeholder="Search movies…" value={q} onChange={setQ} />
      </div>

      <SectionHeader label="Latest Movies" count={filtered.length} href="/movies" color="#60a5fa" />

      <CardGrid>
        {visible.map(m => (
          <ContentCard key={m.id} href={`/movies/${m.slug}`}
            title={m.title} subtitle={m.director}
            gradient={m.gradient} type="movie"
            rating={m.rating} badge={m.badge}
            year={m.year} language={m.language}
            thumbnail={m.thumbnail} compact />
        ))}
      </CardGrid>

      {filtered.length > 9 && (
        <button onClick={() => setShow(s => !s)}
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white/40 hover:text-white transition-colors"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          {show ? 'Show less' : `Show all ${filtered.length} movies`}
        </button>
      )}
      {filtered.length === 0 && (
        <div className="text-center py-16 text-white/25">
          <Film className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-base">No movies found</p>
        </div>
      )}
    </div>
  )
}

// ── Serials Tab ───────────────────────────────────────────────────────────────
function SerialsTab({ serials }: { serials: Serial[] }) {
  const [q, setQ]       = useState('')
  const [status, setStatus] = useState<'All' | 'Ongoing' | 'Completed'>('All')
  const [show, setShow]     = useState(false)

  const filtered = useMemo(() => {
    let out = serials
    if (status !== 'All') out = out.filter(s => s.status === status)
    if (q) {
      const ql = q.toLowerCase()
      out = out.filter(s => s.title.toLowerCase().includes(ql) || s.channel?.toLowerCase().includes(ql))
    }
    return out
  }, [serials, q, status])

  const visible = show ? filtered : filtered.slice(0, 9)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex gap-1 flex-1">
          {(['All', 'Ongoing', 'Completed'] as const).map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
              style={status === s
                ? { background: 'rgba(249,115,22,0.18)', color: '#fdba74', border: '1px solid rgba(249,115,22,0.4)' }
                : { color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {s}
            </button>
          ))}
        </div>
        <SearchToggle placeholder="Search serials…" value={q} onChange={setQ} />
      </div>

      <SectionHeader label="Tamil Serials" count={filtered.length} href="/serials" color="#f97316" />

      <CardGrid>
        {visible.map(s => (
          <ContentCard key={s.id} href={`/serials/${s.slug}`}
            title={s.title} subtitle={s.channel}
            gradient={s.gradient} type="serial"
            rating={s.rating} language={s.language}
            status={s.status} tags={s.tags}
            thumbnail={s.thumbnail} compact />
        ))}
      </CardGrid>

      {filtered.length > 9 && (
        <button onClick={() => setShow(s => !s)}
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white/40 hover:text-white transition-colors"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          {show ? 'Show less' : `Show all ${filtered.length} serials`}
        </button>
      )}
    </div>
  )
}

// ── Albums Tab ────────────────────────────────────────────────────────────────
function AlbumsTab({ albums }: { albums: Album[] }) {
  const [q, setQ]   = useState('')
  const [show, setShow] = useState(false)

  const filtered = useMemo(() => {
    if (!q) return albums
    const ql = q.toLowerCase()
    return albums.filter(a =>
      a.title.toLowerCase().includes(ql) ||
      a.artist.toLowerCase().includes(ql)
    )
  }, [albums, q])

  const visible = show ? filtered : filtered.slice(0, 9)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex-1" />
        <SearchToggle placeholder="Search albums…" value={q} onChange={setQ} />
      </div>

      <SectionHeader label="Tamil Albums" count={filtered.length} href="/albums" color="#f472b6" />

      <CardGrid>
        {visible.map(a => (
          <ContentCard key={a.id} href={`/albums/${a.slug}`}
            title={a.title} subtitle={a.artist}
            gradient={a.gradient} type="album"
            badge={a.badge} year={a.year} tags={a.genre} compact />
        ))}
      </CardGrid>

      {filtered.length > 9 && (
        <button onClick={() => setShow(s => !s)}
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white/40 hover:text-white transition-colors"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          {show ? 'Show less' : `Show all ${filtered.length} albums`}
        </button>
      )}
    </div>
  )
}

// ── News Tab (real-time Tamil entertainment news) ─────────────────────────────
interface NewsItem {
  id: string
  title: string
  category: string
  categoryColor: string
  thumbnail: string
  timeAgo: string
  source: string
  link?: string
  color?: string
}

const REFRESH_MS = 10 * 60 * 1000 // 10 minutes

function NewsSkeletons() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl h-44 shimmer" />
      {[1, 2, 3].map(i => (
        <div key={i} className="flex gap-3 p-3 rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="w-20 h-20 rounded-xl flex-shrink-0 shimmer" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-3 w-16 rounded shimmer" />
            <div className="h-4 rounded shimmer" />
            <div className="h-3 w-24 rounded shimmer" />
          </div>
        </div>
      ))}
    </div>
  )
}

function LiveTab() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [updatedAt, setUpdatedAt] = useState('')

  const fetchNews = () => {
    fetch('/api/tamil-news')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => {
        if (d?.news?.length) {
          setNews(d.news)
          setUpdatedAt(d.updatedAt ?? '')
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchNews()
    const id = setInterval(fetchNews, REFRESH_MS)
    return () => clearInterval(id)
  }, [])

  if (loading) return <NewsSkeletons />

  const featured = news[0]
  const cards    = news.slice(1, 5)
  const compact  = news.slice(5)

  const lastUpdated = updatedAt
    ? new Date(updatedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : ''

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-base font-black text-white">Tamil Entertainment News</span>
        <div className="ml-auto flex items-center gap-2">
          {lastUpdated && (
            <span className="text-[10px] text-white/20">updated {lastUpdated}</span>
          )}
          <button onClick={fetchNews}
            className="text-[10px] text-white/30 hover:text-white/60 transition-colors px-2 py-0.5 rounded"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* No news fallback */}
      {news.length === 0 && (
        <div className="text-center py-16 text-white/25">
          <Radio className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Could not load news — try refreshing</p>
        </div>
      )}

      {/* Featured story */}
      {featured && (
        <a href={featured.link ?? '#'} target="_blank" rel="noopener noreferrer"
          className="block rounded-2xl overflow-hidden group"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="relative h-44 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={featured.thumbnail} alt={featured.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="eager"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
            <div className="absolute inset-0"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.2) 55%, transparent 100%)' }} />
            <div className="absolute top-3 left-3">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black"
                style={{ background: (featured.categoryColor ?? '#60a5fa') + '28', color: featured.categoryColor ?? '#60a5fa', border: `1px solid ${featured.categoryColor ?? '#60a5fa'}45` }}>
                {featured.category}
              </span>
            </div>
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] text-white/60"
              style={{ background: 'rgba(0,0,0,0.5)' }}>
              {featured.source}
            </div>
            <div className="absolute bottom-0 inset-x-0 p-4">
              <p className="text-white font-black text-base leading-snug line-clamp-2 mb-1">{featured.title}</p>
              <p className="text-white/45 text-xs">{featured.timeAgo}</p>
            </div>
          </div>
        </a>
      )}

      {/* Card list */}
      {cards.length > 0 && (
        <div className="space-y-2.5">
          {cards.map(item => (
            <a key={item.id} href={item.link ?? '#'} target="_blank" rel="noopener noreferrer"
              className="flex gap-3 rounded-xl overflow-hidden group p-3 transition-all"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)' }}>
              <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-white/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.thumbnail} alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wide" style={{ color: item.categoryColor ?? '#60a5fa' }}>{item.category}</span>
                <p className="text-white text-sm font-bold leading-snug line-clamp-2 mt-0.5 group-hover:text-amber-200 transition-colors">{item.title}</p>
                <p className="text-white/35 text-xs mt-1">{item.source} · {item.timeAgo}</p>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Compact tail */}
      {compact.length > 0 && (
        <div className="space-y-0">
          {compact.map(item => (
            <a key={item.id} href={item.link ?? '#'} target="_blank" rel="noopener noreferrer"
              className="flex gap-2.5 items-start py-2.5 group transition-all"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-white/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.thumbnail} alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/80 text-xs font-bold leading-snug line-clamp-2 group-hover:text-white transition-colors">{item.title}</p>
                <p className="text-white/30 text-[10px] mt-1">{item.source} · {item.timeAgo}</p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Cricket Tab ───────────────────────────────────────────────────────────────
function CricketTab() {
  return <CricketWidget />
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function HomeTabLayout({ movies, serials, albums }: Props) {
  const [activeTab, setActiveTab] = useState('movies')

  return (
    <div className="flex flex-col gap-0">

      {/* Sticky tab bar — compact pill style */}
      <div className="sticky top-[56px] z-20 mb-3"
        style={{ background: 'rgba(7,1,15,0.97)', backdropFilter: 'blur(20px)' }}>
        <div className="flex overflow-x-auto scrollbar-hide gap-1 py-2">
          {TABS.map(({ id, label, icon: Icon, color }) => {
            const isActive = activeTab === id
            return (
              <button key={id} onClick={() => setActiveTab(id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex-shrink-0"
                style={isActive ? {
                  background: color + '20',
                  border: `1px solid ${color}45`,
                  color,
                } : {
                  color: 'rgba(255,255,255,0.35)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}>
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            )
          })}
        </div>
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'movies'  && <MoviesTab movies={movies} />}
        {activeTab === 'serials' && <SerialsTab serials={serials} />}
        {activeTab === 'live'    && <LiveTab />}
        {activeTab === 'cricket' && <CricketTab />}
        {activeTab === 'albums'  && <AlbumsTab albums={albums} />}
        {activeTab === 'ott'     && <OTTExplorer />}
      </div>
    </div>
  )
}
