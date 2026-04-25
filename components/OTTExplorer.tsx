'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { Star, Play, Tv2, Calendar, Search, X, ChevronDown, ChevronUp, Loader2, Sparkles, Zap } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────
interface OTTMovie {
  id: string
  slug: string
  title: string
  year: number
  director: string
  cast: string[]
  genre: string[]
  language: string
  originalLanguage?: string
  description?: string
  streamingOn: string[]
  ottDate?: string
  rating: number
  gradient: string
  badge?: string
  // AI-generated fields (present when from crawler)
  tamilRelevanceScore?: number
  vibeTag?: string
}

// ── OTT platform config ───────────────────────────────────────────────
const OTT: Record<string, { color: string; bg: string; border: string; short: string }> = {
  'Netflix':         { color: '#e50914', bg: 'rgba(229,9,20,0.13)',   border: 'rgba(229,9,20,0.35)',   short: 'N' },
  'Amazon Prime':    { color: '#00a8e0', bg: 'rgba(0,168,224,0.13)',  border: 'rgba(0,168,224,0.35)',  short: '▶' },
  'Disney+ Hotstar': { color: '#0073e6', bg: 'rgba(0,115,230,0.13)',  border: 'rgba(0,115,230,0.35)',  short: '★' },
  'ZEE5':            { color: '#8b5cf6', bg: 'rgba(139,92,246,0.13)', border: 'rgba(139,92,246,0.35)', short: 'Z' },
  'YouTube':         { color: '#ff0000', bg: 'rgba(255,0,0,0.10)',    border: 'rgba(255,0,0,0.30)',    short: '▷' },
}

const PLATFORMS = ['All', 'Netflix', 'Amazon Prime', 'Disney+ Hotstar', 'ZEE5']
const GENRES    = ['All', 'Action', 'Thriller', 'Drama', 'Romance', 'Historical', 'True Story', 'Comedy', 'War']

function ottLabel(date?: string) {
  if (!date) return null
  if (date === 'Coming Soon') return { text: 'Coming Soon', soon: true }
  const d = new Date(date)
  return { text: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }), soon: false }
}

function Avatar({ name }: { name: string }) {
  const initials = name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const hue = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return (
    <div
      title={name}
      className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black text-white border border-white/10 flex-shrink-0"
      style={{ background: `hsl(${hue},48%,24%)` }}
    >
      {initials}
    </div>
  )
}

function PlatformBadge({ platform }: { platform: string }) {
  const c = OTT[platform]
  if (!c) return <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/6 text-slate-400">{platform}</span>
  return (
    <span
      className="inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full font-black"
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}
    >
      {c.short} {platform}
    </span>
  )
}

// Relevance dots (AI score visualised)
function RelevanceDots({ score }: { score?: number }) {
  if (!score) return null
  const filled = Math.round(score / 2) // 0-10 → 0-5 dots
  return (
    <div className="flex items-center gap-0.5" title={`Tamil relevance: ${score}/10`}>
      {[1,2,3,4,5].map(i => (
        <div
          key={i}
          className="w-1 h-1 rounded-full"
          style={{ background: i <= filled ? '#e11d48' : 'rgba(255,255,255,0.12)' }}
        />
      ))}
    </div>
  )
}

export default function OTTExplorer() {
  const [allMovies, setAllMovies]   = useState<OTTMovie[]>([])
  const [loading, setLoading]       = useState(true)
  const [source, setSource]         = useState<'crawler' | 'static' | null>(null)

  const [platform, setPlatform]     = useState('All')
  const [genre, setGenre]           = useState('All')
  const [query, setQuery]           = useState('')
  const [showAll, setShowAll]       = useState(false)

  // Fetch from /api/ott on mount (ISR-cached on Vercel, falls back to static)
  const fetchMovies = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ott')
      const data = await res.json()
      setAllMovies(data.movies ?? [])
      setSource(data.source)
    } catch {
      setAllMovies([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchMovies() }, [fetchMovies])

  // Client-side filtering
  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allMovies
      .filter(m => platform === 'All' || m.streamingOn.includes(platform))
      .filter(m => genre === 'All' || m.genre?.some(g => g.toLowerCase().includes(genre.toLowerCase())))
      .filter(m =>
        !q ||
        m.title.toLowerCase().includes(q) ||
        m.director.toLowerCase().includes(q) ||
        m.cast?.some(c => c.toLowerCase().includes(q)) ||
        m.genre?.some(g => g.toLowerCase().includes(q)) ||
        m.vibeTag?.toLowerCase().includes(q)
      )
  }, [allMovies, platform, genre, query])

  const shown = showAll ? results : results.slice(0, 8)
  const comingSoon = results.filter(m => m.ottDate === 'Coming Soon').length

  return (
    <section>
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2 flex-wrap">
            <Tv2 className="w-5 h-5 text-red-400" />
            OTT Now Streaming
            {comingSoon > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold animate-pulse">
                {comingSoon} Coming Soon
              </span>
            )}
            {source === 'crawler' && (
              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#e11d48]/12 border border-[#e11d48]/25 text-[#e11d48] font-bold">
                <Sparkles className="w-2.5 h-2.5" /> AI-enriched
              </span>
            )}
          </h2>
          <p className="text-muted text-xs mt-0.5">
            Latest Tamil &amp; dubbed releases — with AI-generated insights &amp; Tamil relevance scoring
          </p>
        </div>
        <Link href="/movies" className="text-gold-400 text-xs font-medium hover:text-gold-300 flex items-center gap-1">
          All movies →
        </Link>
      </div>

      {/* ── Search ── */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setShowAll(false) }}
          placeholder="Search title, actor, director, genre, vibe..."
          className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none transition-all"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Platform filter ── */}
      <div className="flex gap-2 flex-wrap mb-2.5">
        {PLATFORMS.map(p => {
          const c = OTT[p]
          const active = platform === p
          return (
            <button
              key={p}
              onClick={() => { setPlatform(p); setShowAll(false) }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150"
              style={active ? {
                background: c ? c.bg : 'rgba(225,29,72,0.15)',
                border: `1px solid ${c ? c.border : 'rgba(225,29,72,0.4)'}`,
                color: c ? c.color : '#e11d48',
              } : {
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                color: '#64748b',
              }}
            >
              {c && <span className="mr-1 text-[11px]">{c.short}</span>}{p}
            </button>
          )
        })}
      </div>

      {/* ── Genre filter ── */}
      <div className="flex gap-1.5 flex-wrap mb-5 pb-4 border-b border-white/5">
        {GENRES.map(g => (
          <button
            key={g}
            onClick={() => { setGenre(g); setShowAll(false) }}
            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all duration-150"
            style={genre === g ? {
              background: 'rgba(225,29,72,0.15)',
              border: '1px solid rgba(225,29,72,0.35)',
              color: '#e11d48',
            } : {
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              color: '#64748b',
            }}
          >
            {g}
          </button>
        ))}
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-16 gap-3 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading OTT data...</span>
        </div>
      )}

      {/* ── Results count ── */}
      {!loading && query && (
        <p className="text-xs text-slate-600 mb-3">
          {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
        </p>
      )}

      {/* ── Empty state ── */}
      {!loading && results.length === 0 && (
        <div className="text-center py-12 text-slate-600">
          <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No movies found. Try a different filter or search term.</p>
        </div>
      )}

      {/* ── Cards grid ── */}
      {!loading && results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {shown.map(movie => {
            const ott = ottLabel(movie.ottDate)
            const primary = movie.streamingOn[0]
            const cfg = OTT[primary]
            const isSoon = ott?.soon
            const hasAI  = !!movie.vibeTag

            return (
              <Link key={movie.id} href={`/movies/${movie.slug}`} className="group block">
                <div
                  className="relative rounded-xl overflow-hidden border transition-all duration-250 group-hover:-translate-y-1 h-full flex flex-col"
                  style={{
                    background: 'rgba(255,255,255,0.025)',
                    borderColor: isSoon
                      ? 'rgba(245,158,11,0.35)'
                      : cfg ? cfg.border : 'rgba(255,255,255,0.08)',
                  }}
                >
                  {/* Gradient top strip */}
                  <div className={`h-1.5 w-full bg-gradient-to-r ${movie.gradient} flex-shrink-0`} />

                  <div className="p-3.5 flex flex-col gap-2 flex-1">

                    {/* Title + badge */}
                    <div className="flex items-start gap-2">
                      <h3 className="text-white font-bold text-sm leading-tight group-hover:text-gold-300 transition-colors line-clamp-2 flex-1">
                        {movie.title}
                      </h3>
                      {movie.badge && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-gold-500/12 border border-gold-500/20 text-gold-400 font-bold whitespace-nowrap flex-shrink-0 leading-tight">
                          {movie.badge}
                        </span>
                      )}
                    </div>

                    {/* AI vibe tag */}
                    {hasAI && movie.vibeTag && (
                      <div className="flex items-center gap-1.5">
                        <Zap className="w-2.5 h-2.5 text-[#e11d48] flex-shrink-0" />
                        <span className="text-[10px] font-semibold text-[#e11d48]/80">{movie.vibeTag}</span>
                        <RelevanceDots score={movie.tamilRelevanceScore} />
                      </div>
                    )}

                    {/* Director · Year */}
                    <p className="text-slate-600 text-[10px]">
                      {movie.director} · {movie.year}
                      {movie.originalLanguage && (
                        <span className="text-cyan-700/80"> · {movie.originalLanguage}</span>
                      )}
                    </p>

                    {/* Rating bar */}
                    {movie.rating > 0 && (
                      <div className="flex items-center gap-1.5">
                        <div className="flex gap-0.5 flex-1">
                          {[1,2,3,4,5].map(s => (
                            <div
                              key={s}
                              className="h-1 flex-1 rounded-full"
                              style={{
                                background: s <= Math.round(movie.rating / 2)
                                  ? (cfg ? cfg.color : '#f59e0b')
                                  : 'rgba(255,255,255,0.07)',
                              }}
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 text-gold-400 fill-gold-400" />
                          <span className="text-gold-400 text-[10px] font-bold">{movie.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    )}

                    {/* Cast avatars */}
                    <div className="flex items-center gap-1">
                      {(movie.cast ?? []).slice(0, 4).map(n => <Avatar key={n} name={n} />)}
                      {(movie.cast?.length ?? 0) > 4 && (
                        <span className="text-[9px] text-slate-600 ml-0.5">+{movie.cast.length - 4}</span>
                      )}
                    </div>

                    {/* Genre tags */}
                    <div className="flex flex-wrap gap-1">
                      {(movie.genre ?? []).slice(0, 3).map(g => (
                        <span key={g} className="text-[9px] px-1.5 py-0.5 rounded bg-white/4 text-slate-500 border border-white/5">
                          {g}
                        </span>
                      ))}
                    </div>

                    {/* OTT + date — pinned to bottom */}
                    <div className="mt-auto pt-2 border-t border-white/5 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex flex-wrap gap-1">
                        {(movie.streamingOn ?? []).map(p => <PlatformBadge key={p} platform={p} />)}
                      </div>
                      {ott && (
                        isSoon ? (
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold animate-pulse">
                            Coming Soon
                          </span>
                        ) : (
                          <span className="flex items-center gap-0.5 text-[9px] text-slate-600">
                            <Calendar className="w-2.5 h-2.5" />
                            {ott.text}
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  {/* Play hover overlay */}
                  <div
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                    style={{ background: 'rgba(0,0,0,0.45)' }}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center"
                      style={{
                        background: cfg ? cfg.color : '#f59e0b',
                        boxShadow: `0 0 24px ${cfg ? cfg.bg : 'rgba(245,158,11,0.3)'}`,
                      }}
                    >
                      <Play className="w-4 h-4 text-white fill-white" />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* ── Show more / less ── */}
      {!loading && results.length > 8 && (
        <div className="text-center mt-4">
          <button
            onClick={() => setShowAll(s => !s)}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-slate-500 border border-white/7 hover:border-white/15 hover:text-white transition-all"
          >
            {showAll
              ? <><ChevronUp className="w-3.5 h-3.5" /> Show less</>
              : <><ChevronDown className="w-3.5 h-3.5" /> Show {results.length - 8} more films</>
            }
          </button>
        </div>
      )}
    </section>
  )
}
