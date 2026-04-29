'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Tv2, Film, Music, Globe, ArrowRight, TrendingUp, Star, Play,
  Youtube, Trophy, Search, X, Clock, Zap, Radio, Users,
} from 'lucide-react'
import ContentCard from '@/components/ContentCard'
import OTTExplorer from '@/components/OTTExplorer'
import CricketWidget from '@/components/CricketWidget'
import AdUnit from '@/components/AdUnit'
import type { Movie } from '@/data/movies'
import type { Serial } from '@/data/serials'
import type { Album } from '@/data/albums'

// ── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'movies',   label: 'Movies',  icon: Film,       color: '#60a5fa' },
  { id: 'serials',  label: 'Serials', icon: Tv2,        color: '#f97316' },
  { id: 'live',     label: 'Live',    icon: Radio,      color: '#f87171' },
  { id: 'cricket',  label: 'Cricket', icon: Trophy,     color: '#4ade80' },
  { id: 'albums',   label: 'Albums',  icon: Music,      color: '#f472b6' },
  { id: 'ott',      label: 'OTT',     icon: Play,       color: '#a78bfa' },
]

interface Props { movies: Movie[]; serials: Serial[]; albums: Album[] }

// ── Search bar ───────────────────────────────────────────────────────────────
function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25 pointer-events-none" />
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2 rounded-xl text-sm text-white placeholder-white/20 outline-none"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
        onFocus={e => (e.currentTarget.style.borderColor = 'rgba(245,158,11,0.4)')}
        onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
      {value && (
        <button onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}

// ── Compact card with real thumbnail support ──────────────────────────────────
function PosterCard({ href, title, subtitle, gradient, type, rating, badge, year, language, status, tags, thumbnail, compact = true }: {
  href: string; title: string; subtitle?: string; gradient: string
  type: 'movie' | 'serial' | 'album'; rating?: number; badge?: string
  year?: number; language?: string; status?: string; tags?: string[]
  thumbnail?: string; compact?: boolean
}) {
  return (
    <ContentCard
      href={href} title={title} subtitle={subtitle} gradient={gradient}
      type={type} rating={rating} badge={badge} year={year}
      language={language} status={status} tags={tags}
      thumbnail={thumbnail} compact={compact}
    />
  )
}

// ── Real-time YouTube thumbnails for serials ──────────────────────────────────
// These YouTube video IDs map to real Tamil serial episodes — thumbnails load from YouTube CDN
const SERIAL_YT_THUMB: Record<string, string> = {
  's1': 'https://img.youtube.com/vi/PLFMg3Wg8v7g/mqdefault.jpg',
  's2': 'https://img.youtube.com/vi/5-GkuN8QT6E/mqdefault.jpg',
  's8': 'https://img.youtube.com/vi/dY8K5PdZBQk/mqdefault.jpg',
}

// ── Movies Tab ────────────────────────────────────────────────────────────────
function MoviesTab({ movies }: { movies: Movie[] }) {
  const [q, setQ]       = useState('')
  const [lang, setLang] = useState<'All' | 'Tamil' | 'Tamil Dubbed'>('All')
  const [sort, setSort] = useState<'rating' | 'year'>('rating')
  const [show, setShow] = useState(false)

  const filtered = useMemo(() => {
    let out = movies
    if (lang !== 'All') out = out.filter(m => m.language === lang)
    if (q) {
      const ql = q.toLowerCase()
      out = out.filter(m =>
        m.title.toLowerCase().includes(ql) ||
        m.director.toLowerCase().includes(ql) ||
        m.cast.some(c => c.toLowerCase().includes(ql))
      )
    }
    return [...out].sort((a, b) => sort === 'rating' ? b.rating - a.rating : b.year - a.year)
  }, [movies, q, lang, sort])

  const visible = show ? filtered : filtered.slice(0, 14)

  return (
    <div className="space-y-3">
      {/* Filters row */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex-1 min-w-[140px]">
          <SearchBar value={q} onChange={setQ} placeholder="Title, director, cast…" />
        </div>
        <div className="flex gap-1">
          {(['All','Tamil','Tamil Dubbed'] as const).map(l => (
            <button key={l} onClick={() => setLang(l)}
              className="px-2 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={lang === l
                ? { background: 'rgba(96,165,250,0.18)', color: '#93c5fd', border: '1px solid rgba(96,165,250,0.4)' }
                : { color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {l === 'Tamil Dubbed' ? 'Dubbed' : l}
            </button>
          ))}
        </div>
        <select value={sort} onChange={e => setSort(e.target.value as 'rating' | 'year')}
          className="px-2 py-1.5 rounded-lg text-xs text-white/60 outline-none"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <option value="rating" className="bg-gray-900">Top Rated</option>
          <option value="year"   className="bg-gray-900">Latest</option>
        </select>
      </div>

      <p className="text-white/20 text-[11px]">{filtered.length} movies</p>

      {/* Grid — 4 cols on desktop */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
        {visible.map(m => (
          <PosterCard key={m.id} href={`/movies/${m.slug}`}
            title={m.title} subtitle={m.director}
            gradient={m.gradient} type="movie"
            rating={m.rating} badge={m.badge}
            year={m.year} language={m.language}
            thumbnail={m.thumbnail} />
        ))}
      </div>

      {filtered.length > 14 && (
        <button onClick={() => setShow(s => !s)}
          className="w-full py-2 rounded-xl text-xs font-semibold text-white/40 hover:text-white/70 transition-colors"
          style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
          {show ? 'Show less' : `Show all ${filtered.length} movies`}
        </button>
      )}
      {filtered.length === 0 && (
        <div className="text-center py-12 text-white/25">
          <Film className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No movies found</p>
        </div>
      )}
    </div>
  )
}

// ── Serials Tab ───────────────────────────────────────────────────────────────
function SerialsTab({ serials }: { serials: Serial[] }) {
  const [q, setQ]           = useState('')
  const [channel, setChannel] = useState('All')
  const [status, setStatus]   = useState<'All' | 'Ongoing' | 'Completed'>('All')
  const [show, setShow]       = useState(false)

  const channels = useMemo(() => {
    const s = new Set(serials.map(s => s.channel).filter(Boolean))
    return ['All', ...Array.from(s).sort()]
  }, [serials])

  const filtered = useMemo(() => {
    let out = serials
    if (channel !== 'All') out = out.filter(s => s.channel === channel)
    if (status !== 'All')  out = out.filter(s => s.status === status)
    if (q) {
      const ql = q.toLowerCase()
      out = out.filter(s =>
        s.title.toLowerCase().includes(ql) ||
        s.channel?.toLowerCase().includes(ql)
      )
    }
    return out
  }, [serials, q, channel, status])

  const visible = show ? filtered : filtered.slice(0, 14)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex-1 min-w-[140px]">
          <SearchBar value={q} onChange={setQ} placeholder="Serial name, channel…" />
        </div>
        <select value={channel} onChange={e => setChannel(e.target.value)}
          className="px-2 py-1.5 rounded-lg text-xs text-white/60 outline-none"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          {channels.slice(0, 8).map(c => <option key={c} value={c} className="bg-gray-900">{c}</option>)}
        </select>
        {(['All','Ongoing','Completed'] as const).map(s => (
          <button key={s} onClick={() => setStatus(s)}
            className="px-2 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={status === s
              ? { background: 'rgba(249,115,22,0.18)', color: '#fdba74', border: '1px solid rgba(249,115,22,0.4)' }
              : { color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {s}
          </button>
        ))}
      </div>

      <p className="text-white/20 text-[11px]">{filtered.length} serials</p>

      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
        {visible.map(s => (
          <PosterCard key={s.id} href={`/serials/${s.slug}`}
            title={s.title} subtitle={s.channel}
            gradient={s.gradient} type="serial"
            rating={s.rating} language={s.language}
            status={s.status} tags={s.tags}
            thumbnail={SERIAL_YT_THUMB[s.id] || s.thumbnail} />
        ))}
      </div>

      {filtered.length > 14 && (
        <button onClick={() => setShow(s => !s)}
          className="w-full py-2 rounded-xl text-xs font-semibold text-white/40 hover:text-white/70 transition-colors"
          style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
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
      a.artist.toLowerCase().includes(ql) ||
      a.genre?.some(g => g.toLowerCase().includes(ql))
    )
  }, [albums, q])

  const visible = show ? filtered : filtered.slice(0, 12)

  return (
    <div className="space-y-3">
      <SearchBar value={q} onChange={setQ} placeholder="Album, artist, genre…" />
      <p className="text-white/20 text-[11px]">{filtered.length} albums</p>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
        {visible.map(a => (
          <PosterCard key={a.id} href={`/albums/${a.slug}`}
            title={a.title} subtitle={a.artist}
            gradient={a.gradient} type="album"
            badge={a.badge} year={a.year} tags={a.genre}
            />
        ))}
      </div>
      {filtered.length > 12 && (
        <button onClick={() => setShow(s => !s)}
          className="w-full py-2 rounded-xl text-xs font-semibold text-white/40 hover:text-white/70 transition-colors"
          style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
          {show ? 'Show less' : `Show all ${filtered.length} albums`}
        </button>
      )}
    </div>
  )
}

// ── Live Tab: TVK spotlight + recent episodes ─────────────────────────────────
interface ElectionParty { name: string; tamil: string; leader: string; color: string; sentiment: number; voteShare: number; seats: string; trend: string }

function LiveTab() {
  const [electionData, setElectionData] = useState<{ parties: ElectionParty[]; narrative: string; source: string } | null>(null)
  const [eps, setEps] = useState<Array<{ id: string; title: string; videoId: string; channelName: string; channelColor: string; publishedAt: string; thumbnail: string }>>([])

  const loadData = useCallback(async () => {
    try {
      const [elRes, epRes] = await Promise.allSettled([
        fetch('/api/election-prediction'),
        fetch('/api/recent-episodes'),
      ])
      if (elRes.status === 'fulfilled' && elRes.value.ok) {
        setElectionData(await elRes.value.json())
      }
      if (epRes.status === 'fulfilled' && epRes.value.ok) {
        const { episodes } = await epRes.value.json()
        if (episodes?.length) setEps(episodes)
      }
    } catch { /* keep previous */ }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const parties = electionData?.parties ?? []

  return (
    <div className="space-y-5">

      {/* ── TVK Hero promo ── */}
      <div className="relative overflow-hidden rounded-2xl"
        style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.06) 0%, rgba(248,113,113,0.04) 100%)', border: '1px solid rgba(251,191,36,0.15)' }}>
        <div className="px-4 py-4">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl"
              style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)' }}>
              ⭐
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <span className="text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}>
                  TVK · First Election
                </span>
                <span className="text-[10px] text-white/30">Tamil Nadu 2026</span>
              </div>
              <h3 className="font-black text-white text-base leading-tight mb-1">தவகவின் முதல் தேர்தல்</h3>
              <p className="text-white/40 text-xs leading-relaxed">
                Thalapathy Vijay&apos;s TVK enters TN politics for the first time — 1.2Cr+ members, massive crowd support, projected 18.7% vote share.
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              { label: 'Members',    value: '1.2Cr+', color: '#fbbf24', icon: Users },
              { label: 'Vote Share', value: '18.7%',  color: '#34d399', icon: TrendingUp },
              { label: 'AI Signal',  value: `${parties.find(p => p.name === 'TVK')?.sentiment ?? 62}/100`, color: '#f87171', icon: Zap },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="flex flex-col items-center py-2.5 rounded-xl"
                style={{ background: color + '0d', border: `1px solid ${color}20` }}>
                <Icon className="w-3.5 h-3.5 mb-1" style={{ color }} />
                <span className="font-black text-base leading-none" style={{ color }}>{value}</span>
                <span className="text-white/30 text-[9px] mt-0.5">{label}</span>
              </div>
            ))}
          </div>

          {/* AI narrative */}
          {electionData?.narrative && (
            <div className="mt-3 flex items-start gap-1.5 px-3 py-2 rounded-xl"
              style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.12)' }}>
              <Zap className="w-3 h-3 text-amber-400/60 flex-shrink-0 mt-0.5" />
              <p className="text-white/40 text-[11px] leading-relaxed">{electionData.narrative}</p>
            </div>
          )}

          <div className="flex gap-2 mt-3">
            <Link href="/tn-election-2026"
              className="flex-1 py-2 rounded-xl text-xs font-black text-center transition-all hover:brightness-110"
              style={{ background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', color: '#000' }}>
              Full Predictions →
            </Link>
            <Link href="/tn-election-2026#tvk"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white/50 hover:text-white transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              TVK Profile
            </Link>
          </div>
        </div>
      </div>

      {/* ── Party sentiment ── */}
      {parties.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="px-4 py-2.5 border-b border-white/5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[11px] font-black text-white/60 uppercase tracking-wider">Live AI Sentiment</span>
            <span className="text-[9px] text-white/20 ml-auto">{electionData?.source === 'live-ai' ? '🔴 Live' : '📡 Cached'}</span>
          </div>
          <div className="p-3 space-y-2.5">
            {parties.map(p => (
              <div key={p.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                    <span className="text-white text-xs font-bold">{p.name}</span>
                    <span className="text-white/30 text-[10px] hidden sm:inline">{p.tamil}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white/40 text-[10px]">{p.seats} seats</span>
                    <span className="text-[11px] font-black tabular-nums" style={{ color: p.color }}>{p.sentiment}%</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${p.sentiment}%`, background: `linear-gradient(90deg, ${p.color}60, ${p.color})` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Recent episodes ── */}
      {eps.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-3.5 h-3.5 text-red-400" />
            <span className="text-[12px] font-black text-white/70">Recent Episodes</span>
            <span className="text-white/20 text-[10px] ml-auto">YouTube</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {eps.slice(0, 6).map(ep => (
              <a key={ep.id} href={`https://www.youtube.com/watch?v=${ep.videoId}`}
                target="_blank" rel="noopener noreferrer"
                className="group block rounded-xl overflow-hidden"
                style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="relative aspect-video bg-black overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ep.thumbnail} alt={ep.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                    loading="lazy" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-7 h-7 rounded-full bg-red-600/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white"
                    style={{ background: ep.channelColor + 'dd' }}>
                    <Youtube className="w-2.5 h-2.5 inline mr-0.5" />
                    {ep.channelName}
                  </div>
                </div>
                <div className="px-2 py-1.5">
                  <p className="text-white text-[11px] font-bold line-clamp-2 leading-tight">{ep.title}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Cricket Tab ───────────────────────────────────────────────────────────────
const IPL_STANDINGS = [
  { pos: 1, short: 'PBKS', played: 8, w: 6, l: 1, pts: 13, nrr: '+1.043', color: '#a855f7' },
  { pos: 2, short: 'RCB',  played: 8, w: 6, l: 2, pts: 12, nrr: '+1.919', color: '#ef4444' },
  { pos: 3, short: 'RR',   played: 9, w: 6, l: 3, pts: 12, nrr: '+0.617', color: '#ec4899' },
  { pos: 4, short: 'SRH',  played: 8, w: 5, l: 3, pts: 10, nrr: '+0.815', color: '#f97316' },
  { pos: 5, short: 'GT',   played: 8, w: 4, l: 4, pts: 8,  nrr: '-0.475', color: '#6b7280' },
  { pos: 6, short: 'CSK',  played: 8, w: 3, l: 5, pts: 6,  nrr: '-0.121', color: '#eab308' },
  { pos: 7, short: 'DC',   played: 8, w: 3, l: 5, pts: 6,  nrr: '-1.060', color: '#3b82f6' },
  { pos: 8, short: 'KKR',  played: 8, w: 2, l: 5, pts: 5,  nrr: '-0.751', color: '#7c3aed' },
  { pos: 9, short: 'MI',   played: 7, w: 2, l: 5, pts: 4,  nrr: '-0.736', color: '#0ea5e9' },
  { pos: 10,short: 'LSG',  played: 8, w: 2, l: 6, pts: 4,  nrr: '-1.106', color: '#14b8a6' },
]

function CricketTab() {
  return (
    <div className="space-y-4">
      <CricketWidget />

      {/* Points table */}
      <div className="rounded-xl overflow-hidden"
        style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(34,197,94,0.15)' }}>
        <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between">
          <span className="text-[11px] font-black text-white/60 flex items-center gap-2 uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5 text-green-400" /> IPL 2026 Points
          </span>
          <a href="https://www.iplt20.com/points-table/men/2026" target="_blank" rel="noopener noreferrer"
            className="text-[10px] text-white/25 hover:text-white/50 transition-colors">iplt20.com →</a>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {IPL_STANDINGS.map((row, i) => (
            <div key={row.short} className="flex items-center gap-2 px-4 py-2"
              style={{ background: i < 4 ? `${row.color}08` : 'transparent' }}>
              <span className="text-white/25 text-[10px] w-4">{row.pos}</span>
              <div className="w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-black text-white flex-shrink-0"
                style={{ background: row.color }}>
                {row.short.slice(0, 2)}
              </div>
              <span className="flex-1 font-bold text-xs" style={{ color: row.color }}>{row.short}</span>
              {i < 4 && <span className="text-[8px] text-green-400/60">●</span>}
              <span className="text-white/35 text-[10px] w-5 text-center">{row.played}</span>
              <span className="text-green-400 text-[10px] w-4 text-center font-semibold">{row.w}</span>
              <span className="text-red-400/60 text-[10px] w-4 text-center">{row.l}</span>
              <span className={`text-[10px] w-14 text-right font-mono ${parseFloat(row.nrr) >= 0 ? 'text-green-400/70' : 'text-red-400/60'}`}>{row.nrr}</span>
              <span className="font-black text-xs w-6 text-right" style={{ color: row.color }}>{row.pts}</span>
            </div>
          ))}
        </div>
        <div className="px-4 py-2 border-t border-white/5">
          <p className="text-white/15 text-[9px]">● Top 4 qualify · Updated Apr 29 2026</p>
        </div>
      </div>
      <AdUnit format="horizontal" className="min-h-[90px]" />
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function HomeTabLayout({ movies, serials, albums }: Props) {
  const [activeTab, setActiveTab] = useState('movies')

  return (
    <div className="flex flex-col gap-0">

      {/* ── Sticky tab bar ── */}
      <div className="sticky top-0 z-30 rounded-2xl overflow-hidden mb-3"
        style={{ background: 'rgba(7,1,15,0.95)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)' }}>
        <div className="flex overflow-x-auto scrollbar-hide p-1 gap-1">
          {TABS.map(({ id, label, icon: Icon, color }) => {
            const isActive = activeTab === id
            return (
              <button key={id} onClick={() => setActiveTab(id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0"
                style={isActive ? {
                  background: color + '20',
                  border: `1px solid ${color}40`,
                  color,
                } : {
                  color: 'rgba(255,255,255,0.35)',
                  border: '1px solid transparent',
                }}>
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Tab content ── */}
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
