'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RefreshCw, Newspaper,
  TrendingUp, Tv2, Film, Play, Trophy, Radio,
  Clock, Flame, Zap, Star, ChevronRight, ChevronLeft,
} from 'lucide-react'
import { goLink } from '@/lib/goLink'
import CricketWidget from '@/components/CricketWidget'
import AdUnit from '@/components/AdUnit'
import VisitorCounter from '@/components/VisitorCounter'
import TVKSpotlight from '@/components/TVKSpotlight'
import { movies } from '@/data/movies'

// ── Design tokens — Vikatan editorial dark ───────────────────────────────────
const T = {
  bg:      '#0a0a0a',       // near-black, not purple
  bg2:     '#111111',
  bg3:     '#1a1a1a',
  card:    '#141414',
  border:  'rgba(255,255,255,0.08)',
  border2: 'rgba(255,255,255,0.14)',
  text:    '#f0f0f0',
  sub:     'rgba(255,255,255,0.58)',
  muted:   'rgba(255,255,255,0.36)',
  dim:     'rgba(255,255,255,0.16)',
  red:     '#e53935',       // Vikatan red
  gold:    '#f5a623',       // TVK gold
  purple:  '#9c6fe4',       // cinema
  green:   '#43a047',       // sports/live
  blue:    '#2979ff',       // English sources
  orange:  '#fb8c00',       // Thanthi / politics
}

interface NewsItem {
  title: string
  link: string
  source: string
  sourceLogo: string
  pubDate: string
  timeAgo: string
  desc: string
  imageUrl: string | null
  category: string
}
interface ApiResponse { news: NewsItem[]; updatedAt: string; count: number }

const REFRESH_MS   = 6 * 60 * 1000
const CACHE_TTL    = 5 * 60 * 1000
const LS_CACHE_TTL = 30 * 60 * 1000
const LS_KEY       = 'nt_news_ls_v3'
const SS_KEY       = 'nt_news_v5'
const SPORTS_KW    = ['cricket','ipl','csk','dhoni','match','விளையாட்டு','கிரிக்கெட்','rcb','kkr']

// Source → accent color
const SRC: Record<string, string> = {
  'Dinamalar':           '#e53935',
  'Maalaimalar':         '#9c6fe4',
  'OneIndia Tamil':      '#0288d1',
  'The Hindu Tamil':     '#1565c0',
  'Vikatan':             '#e65100',
  'Puthiya Thalaimurai': '#c62828',
  'Sun News':            '#f5a623',
  'Polimer News':        '#2e7d32',
  'NammaTVK':            '#f5a623',
  'Kalaignar News':      '#b71c1c',
  'Thanthi TV':          '#e65100',
  'NDTV India':          '#b71c1c',
}

const CATS = [
  { key: 'all',      label: 'அனைத்தும்',   icon: Radio,   color: T.red },
  { key: 'tvk',      label: 'TVK 2026',    icon: Zap,     color: T.gold,   badge: 'LIVE' },
  { key: 'politics', label: 'அரசியல்',     icon: Flame,   color: T.orange },
  { key: 'cinema',   label: 'சினிமா',      icon: Film,    color: T.purple },
  { key: 'sports',   label: 'விளையாட்டு',  icon: Trophy,  color: T.green },
]

const OTT_PLATFORMS = [
  { href: '/ott-plans', label: 'Netflix',    icon: 'N', color: '#e50914', sub: 'Tamil Originals' },
  { href: '/ott-plans', label: 'Prime',      icon: '▶', color: '#00a8e0', sub: 'New Releases' },
  { href: '/ott-plans', label: 'Disney+',    icon: '★', color: '#0073e6', sub: 'Star Vijay' },
  { href: '/ott-plans', label: 'ZEE5',       icon: 'Z', color: '#8b5cf6', sub: 'Serials' },
  { href: '/ott-plans', label: 'SunNXT',     icon: '☀', color: '#f5a623', sub: 'Sun TV' },
  { href: '/ott-plans', label: 'YouTube',    icon: '▷', color: '#ff0000', sub: 'Free Movies' },
]

const OTT_C: Record<string, string> = {
  'Netflix': '#e50914', 'Amazon Prime': '#00a8e0',
  'Disney+ Hotstar': '#0073e6', 'ZEE5': '#8b5cf6', 'YouTube': '#ff0000',
}

const CINEMA = movies
  .filter(m => m.language === 'Tamil' && m.year >= 2024)
  .sort((a, b) => {
    const ar = a.ottDate && a.ottDate !== 'Coming Soon' ? 1 : 0
    const br = b.ottDate && b.ottDate !== 'Coming Soon' ? 1 : 0
    if (br !== ar) return br - ar
    if (b.year !== a.year) return b.year - a.year
    return b.rating - a.rating
  })
  .slice(0, 12)

function rc(r: number) {
  if (r >= 8) return '#43a047'; if (r >= 7) return '#f5a623'; if (r >= 6) return '#fb8c00'; return '#e53935'
}

// ── Ticker ────────────────────────────────────────────────────────────────────
function Ticker({ items }: { items: NewsItem[] }) {
  if (!items.length) return null
  const heads = items.slice(0, 16).map(n => n.title)
  return (
    <div style={{ background: T.red, overflow: 'hidden', display: 'flex', alignItems: 'center', height: 30, flexShrink: 0 }}>
      <div style={{ flexShrink: 0, padding: '0 14px', height: '100%', display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.25)', fontSize: 9, fontWeight: 900, color: '#fff', letterSpacing: '0.18em', whiteSpace: 'nowrap' }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff', display: 'inline-block', animation: 'ping 1.5s ease-in-out infinite' }} />
        LIVE
      </div>
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 44, whiteSpace: 'nowrap', fontSize: 11.5, fontWeight: 500, color: 'rgba(255,255,255,0.92)', animation: 'marquee 120s linear infinite', paddingLeft: 20 }}>
          {[...heads, ...heads].map((h, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 5, opacity: 0.7 }}>●</span>{h}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Section head — Vikatan red bar style ──────────────────────────────────────
function SH({ label, color = T.red, href, icon: Icon }: { label: string; color?: string; href?: string; icon?: React.ElementType }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', borderBottom: `2px solid ${color}`, paddingBottom: 8, marginBottom: 12 }}>
      {Icon && <Icon style={{ width: 11, height: 11, color, marginRight: 5, flexShrink: 0 }} />}
      <span style={{ fontSize: 11, fontWeight: 900, color, letterSpacing: '0.1em', textTransform: 'uppercase', flex: 1 }}>{label}</span>
      {href && (
        <Link href={href} style={{ fontSize: 10, color: T.muted, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
          More <ChevronRight style={{ width: 9, height: 9 }} />
        </Link>
      )}
    </div>
  )
}

// ── Source pill ───────────────────────────────────────────────────────────────
function SourcePill({ source }: { source: string }) {
  const c = SRC[source] ?? '#666'
  return (
    <span style={{ fontSize: 9, fontWeight: 800, padding: '1.5px 6px', borderRadius: 3, background: c, color: '#fff', letterSpacing: '0.04em', whiteSpace: 'nowrap', flexShrink: 0 }}>
      {source.slice(0, 10)}
    </span>
  )
}

// ── Hero — 16:9 full-bleed editorial ──────────────────────────────────────────
function HeroCard({ item }: { item: NewsItem }) {
  const c = SRC[item.source] ?? '#555'
  const [err, setErr] = useState(false)
  return (
    <a href={goLink(item.link, 'hero')} target="_blank" rel="noopener noreferrer"
      style={{ display: 'block', textDecoration: 'none', position: 'relative', aspectRatio: '16/9', overflow: 'hidden', borderRadius: 6 }}
      className="nt-hero"
    >
      {item.imageUrl && !err
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={item.imageUrl} alt={item.title} loading="eager" fetchPriority="high" decoding="async"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setErr(true)} />
        : <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${c}60 0%, #111 60%)` }} />
      }
      {/* Scrim */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.55) 38%, rgba(0,0,0,0.06) 75%)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 14px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
          <SourcePill source={item.source} />
          {item.category !== 'general' && item.category !== 'all' && (
            <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.category}</span>
          )}
          <span style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.4)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Clock style={{ width: 8, height: 8 }} />{item.timeAgo}
          </span>
        </div>
        <h2 style={{ margin: 0, fontSize: 'clamp(15px, 3.2vw, 22px)', fontWeight: 800, lineHeight: 1.22, color: '#fff', fontFamily: "'Noto Serif', Georgia, serif", display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', letterSpacing: '-0.01em' }}>
          {item.title}
        </h2>
      </div>
    </a>
  )
}

// ── Small card — for secondary top stories ────────────────────────────────────
function SmCard({ item }: { item: NewsItem }) {
  const c = SRC[item.source] ?? '#555'
  const [err, setErr] = useState(false)
  return (
    <a href={goLink(item.link, 'secondary')} target="_blank" rel="noopener noreferrer"
      style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none', gap: 0 }}
      className="nt-smcard"
    >
      <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', borderRadius: 5, marginBottom: 7 }}>
        {item.imageUrl && !err
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={item.imageUrl} alt={item.title} loading="lazy" decoding="async"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setErr(true)} />
          : <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${c}50 0%, #111 60%)` }} />
        }
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 55%)' }} />
        <div style={{ position: 'absolute', bottom: 5, left: 6 }}>
          <SourcePill source={item.source} />
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: T.text, lineHeight: 1.35, fontFamily: "'Noto Serif', Georgia, serif", display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {item.title}
      </p>
      <span style={{ fontSize: 9.5, color: T.muted, marginTop: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Clock style={{ width: 7, height: 7 }} />{item.timeAgo}
      </span>
    </a>
  )
}

// ── News row — Dinamalar list style ───────────────────────────────────────────
function NewsRow({ item, idx }: { item: NewsItem; idx: number }) {
  const c = SRC[item.source] ?? '#555'
  const [err, setErr] = useState(false)
  const hot = idx < 3
  return (
    <a href={goLink(item.link, 'news-list')} target="_blank" rel="noopener noreferrer"
      className="nt-row"
      style={{ display: 'flex', alignItems: 'flex-start', gap: 9, textDecoration: 'none', padding: '8px 0', borderBottom: `1px solid ${T.border}` }}
    >
      {/* rank */}
      <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 900, color: hot ? T.red : T.dim, width: 16, paddingTop: 1, fontFamily: 'Georgia, serif', textAlign: 'right' }}>{idx + 1}</span>
      {/* text block */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: '0 0 4px', fontSize: 12.5, fontWeight: 650, color: T.text, lineHeight: 1.36, fontFamily: "'Noto Serif', Georgia, serif", display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {item.title}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 8.5, fontWeight: 700, color: c }}>{item.source}</span>
          <span style={{ fontSize: 9, color: T.muted, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Clock style={{ width: 7, height: 7 }} />{item.timeAgo}
          </span>
        </div>
      </div>
      {/* thumb */}
      <div style={{ flexShrink: 0, width: 66, height: 50, borderRadius: 4, overflow: 'hidden', background: `${c}18` }}>
        {item.imageUrl && !err
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={item.imageUrl} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setErr(true)} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Newspaper style={{ width: 14, height: 14, color: `${c}50` }} />
            </div>
        }
      </div>
    </a>
  )
}

// ── Trending row ──────────────────────────────────────────────────────────────
function TrendRow({ item, rank }: { item: NewsItem; rank: number }) {
  const c = SRC[item.source] ?? '#555'
  return (
    <a href={goLink(item.link, 'trending')} target="_blank" rel="noopener noreferrer"
      className="nt-trow"
      style={{ display: 'flex', gap: 8, textDecoration: 'none', padding: '7px 0', borderBottom: `1px solid ${T.border}`, alignItems: 'flex-start' }}
    >
      <span style={{ flexShrink: 0, fontSize: 13, fontWeight: 900, color: rank <= 3 ? T.red : T.dim, width: 18, textAlign: 'right', fontFamily: 'Georgia, serif' }}>{rank}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 11.5, fontWeight: 600, color: T.sub, lineHeight: 1.33, margin: '0 0 3px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.title}</p>
        <span style={{ fontSize: 9, color: c, fontWeight: 700 }}>{item.source}</span>
      </div>
    </a>
  )
}

// ── Cinema poster card ────────────────────────────────────────────────────────
function CinemaCard({ movie }: { movie: (typeof CINEMA)[0] }) {
  const ratingC = rc(movie.rating)
  const platform = movie.streamingOn?.[0]
  const ottColor = platform ? (OTT_C[platform] ?? '#555') : null
  const isOtt = movie.ottDate && movie.ottDate !== 'Coming Soon'
  const [err, setErr] = useState(false)
  const hasThumb = movie.thumbnail && !err && !movie.thumbnail.includes('default.jpg') && !movie.thumbnail.includes('goat-vijay')
  return (
    <div className="nt-ccard">
      <Link href={`/movies/${movie.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
        <div style={{ borderRadius: 5, overflow: 'hidden', background: T.card, border: `1px solid ${T.border}` }}>
          <div style={{ aspectRatio: '2/3', position: 'relative', overflow: 'hidden' }}>
            {hasThumb
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={movie.thumbnail} alt={movie.title} loading="lazy" decoding="async"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  onError={() => setErr(true)} />
              : <div style={{ width: '100%', height: '100%', background: `linear-gradient(160deg, ${ratingC}35 0%, ${T.bg2} 55%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Play style={{ width: 18, height: 18, color: `${ratingC}60` }} />
                </div>
            }
            {movie.rating > 0 && (
              <div style={{ position: 'absolute', top: 4, left: 4, display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(0,0,0,0.85)', borderRadius: 3, padding: '2px 5px' }}>
                <Star style={{ width: 7, height: 7, color: ratingC, fill: ratingC }} />
                <span style={{ fontSize: 8.5, fontWeight: 900, color: ratingC }}>{movie.rating.toFixed(1)}</span>
              </div>
            )}
            {isOtt && ottColor && (
              <div style={{ position: 'absolute', top: 4, right: 4, fontSize: 7, fontWeight: 900, padding: '2px 5px', borderRadius: 3, background: ottColor, color: '#fff', maxWidth: 50, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {platform}
              </div>
            )}
          </div>
          <div style={{ padding: '5px 7px 7px' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: T.text, lineHeight: 1.28, margin: '0 0 2px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontFamily: "'Noto Serif', Georgia, serif" }}>{movie.title}</p>
          </div>
        </div>
      </Link>
    </div>
  )
}

// ── OTT tile ──────────────────────────────────────────────────────────────────
function OttTile({ href, label, icon, color, sub }: { href: string; label: string; icon: string; color: string; sub: string }) {
  return (
    <div className="nt-ott">
      <Link href={href} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', padding: '8px 10px', borderRadius: 6, background: T.card, border: `1px solid ${T.border}` }}>
        <div style={{ width: 26, height: 26, borderRadius: 5, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#fff', flexShrink: 0 }}>{icon}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
          <div style={{ fontSize: 9, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>
        </div>
      </Link>
    </div>
  )
}

function Skel({ h = 50, r = 5 }: { h?: number; r?: number }) {
  return <div style={{ height: h, borderRadius: r, background: 'rgba(255,255,255,0.05)', animation: 'shimmer 1.6s ease-in-out infinite' }} />
}

const TVK_PROMO: NewsItem = {
  title: 'Thalapathy Vijay — TVK கட்சி | Tamil Nadu CM Race 2026',
  desc: '',
  link: 'https://en.wikipedia.org/wiki/Tamilaga_Vettri_Kazhagam',
  source: 'NammaTamil.tv', sourceLogo: '', pubDate: new Date().toISOString(),
  timeAgo: 'pinned',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Vijay_at_CWC_2011.jpg/800px-Vijay_at_CWC_2011.jpg',
  category: 'tvk',
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function HomeNewsPortal() {
  const [data, setData]          = useState<ApiResponse | null>(null)
  const [loading, setLoading]    = useState(true)
  const [refreshing, setRefresh] = useState(false)
  const [category, setCat]       = useState<'all' | 'tvk' | 'politics' | 'cinema' | 'sports'>('all')
  const [showMore, setShowMore]  = useState(false)
  const [secAgo, setSecAgo]      = useState(0)
  const [heroIdx, setHeroIdx]    = useState(0)
  const heroTimer                = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchNews = useCallback(async (manual = false) => {
    if (manual) { setRefresh(true) }
    else {
      try {
        const ss = sessionStorage.getItem(SS_KEY)
        if (ss) { const { d, at } = JSON.parse(ss); if (Date.now() - at < CACHE_TTL) { setData(d); setLoading(false); return } }
      } catch { /* ignore */ }
      try {
        const ls = localStorage.getItem(LS_KEY)
        if (ls) { const { d, at } = JSON.parse(ls); if (Date.now() - at < LS_CACHE_TTL) { setData(d); setLoading(false) } }
      } catch { /* ignore */ }
    }
    try {
      const res = await fetch('/api/tamil-media-news', { cache: 'no-store', signal: AbortSignal.timeout(12000) })
      if (!res.ok) return
      const json: ApiResponse = await res.json()
      setData(json); setSecAgo(0); setShowMore(false); setHeroIdx(0)
      const p = JSON.stringify({ d: json, at: Date.now() })
      try { sessionStorage.setItem(SS_KEY, p) } catch { /* ignore */ }
      try { localStorage.setItem(LS_KEY, p) } catch { /* ignore */ }
    } catch { /* keep stale */ }
    finally { setLoading(false); setRefresh(false) }
  }, [])

  useEffect(() => {
    fetchNews()
    const r = setInterval(fetchNews, REFRESH_MS)
    const t = setInterval(() => setSecAgo(s => s + 1), 1000)
    return () => { clearInterval(r); clearInterval(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const all      = data?.news ?? []
  const tvkItems = all.filter(n => n.category === 'tvk' || (n.category === 'politics' && /tvk|vijay|தாளபதி|வெற்றி கழகம்/i.test(n.title + n.desc)))

  const filtered = useMemo(() => {
    if (category === 'all') return all
    if (category === 'tvk') return tvkItems
    if (category === 'sports') {
      const tagged = all.filter(n => n.category === 'sports')
      if (tagged.length >= 4) return tagged
      return [...tagged, ...all.filter(n => SPORTS_KW.some(kw => (n.title + n.desc).toLowerCase().includes(kw)) && n.category !== 'sports')]
    }
    return all.filter(n => n.category === category)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all.length, category])

  const trending = useMemo(() => [...all].sort(() => Math.random() - 0.5).slice(0, 10), [data])
  const heroPool = filtered.slice(0, 5)
  const heroItem = heroPool[heroIdx] ?? heroPool[0] ?? (category === 'tvk' ? TVK_PROMO : null)

  useEffect(() => {
    if (heroPool.length <= 1) return
    if (heroTimer.current) clearInterval(heroTimer.current)
    heroTimer.current = setInterval(() => setHeroIdx(p => (p + 1) % heroPool.length), 10000)
    return () => { if (heroTimer.current) clearInterval(heroTimer.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all.length, category])

  const listStart = filtered.length >= 3 ? 3 : filtered.length >= 1 ? 1 : 0
  const listItems = showMore ? filtered.slice(listStart) : filtered.slice(listStart, listStart + 20)
  const freshLabel = secAgo < 60 ? `${secAgo}s` : `${Math.floor(secAgo / 60)}m ago`

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text }}>

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ── TICKER ─────────────────────────────────────────────────────────── */}
        {!loading && <Ticker items={all} />}

        {/* ── CATEGORY NAV ───────────────────────────────────────────────────── */}
        <div style={{ background: T.bg2, borderBottom: `1px solid ${T.border}`, position: 'sticky', top: 56, zIndex: 40 }}>
          <div className="nt-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', overflowX: 'auto', scrollbarWidth: 'none', gap: 2, padding: '8px 0' }}>
              {CATS.map(cat => {
                const active = category === cat.key
                const Ic = cat.icon
                return (
                  <button key={cat.key}
                    onClick={() => { setCat(cat.key as typeof category); setShowMore(false) }}
                    style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, padding: '5px 13px', fontSize: 11.5, fontWeight: active ? 800 : 500, color: active ? '#fff' : T.muted, background: active ? cat.color : 'transparent', border: active ? 'none' : `1px solid ${T.border}`, borderRadius: 4, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background 0.1s, color 0.1s' }}
                  >
                    <Ic style={{ width: 10, height: 10 }} />
                    {cat.label}
                    {'badge' in cat && cat.badge && (
                      <span style={{ fontSize: 7.5, fontWeight: 900, padding: '1px 4px', borderRadius: 2, background: 'rgba(255,255,255,0.22)', color: '#fff' }}>{cat.badge}</span>
                    )}
                  </button>
                )
              })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
              <span style={{ fontSize: 9.5, color: T.dim }}>{refreshing ? '…' : freshLabel}</span>
              <button onClick={() => fetchNews(true)} disabled={refreshing}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.dim, padding: 3, lineHeight: 0 }}>
                <RefreshCw style={{ width: 10, height: 10, animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              </button>
              <VisitorCounter />
            </div>
          </div>
        </div>

        <div className="nt-wrap nt-v">

          {/* ════════════════════════════════════════════════════════════════════
              MAIN LAYOUT: hero+sec left · trending right
              ════════════════════════════════════════════════════════════════════ */}
          <div className="nt-top" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14, marginBottom: 16 }}>

            {/* Left: hero + 4 secondary cards */}
            <div>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Skel h={200} r={6} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <Skel h={100} /><Skel h={100} /><Skel h={100} /><Skel h={100} />
                  </div>
                </div>
              ) : heroItem ? (
                <div>
                  {/* Dot nav */}
                  {heroPool.length > 1 && (
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', marginBottom: 5 }}>
                      {heroPool.map((_, i) => (
                        <button key={i} onClick={() => setHeroIdx(i)}
                          style={{ width: i === heroIdx ? 18 : 4, height: 3, borderRadius: 99, background: i === heroIdx ? T.red : 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', padding: 0, transition: 'width 0.25s ease' }} />
                      ))}
                    </div>
                  )}
                  <AnimatePresence mode="wait">
                    <motion.div key={heroItem.link} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.28 }}>
                      <HeroCard item={heroItem} />
                    </motion.div>
                  </AnimatePresence>
                  {/* 2×2 secondary grid */}
                  <div className="nt-sec" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                    {filtered.slice(1, 5).map((it, i) => <SmCard key={i} item={it} />)}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Right: trending (desktop) */}
            <div className="nt-tend" style={{ display: 'none' }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '12px 12px 8px', position: 'sticky', top: 106 }}>
                <SH label="Trending" color={T.gold} icon={TrendingUp} />
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => <Skel key={i} h={42} r={3} />)
                  : trending.slice(0, 10).map((it, i) => <TrendRow key={i} item={it} rank={i + 1} />)
                }
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════════
              CINEMA STRIP
              ════════════════════════════════════════════════════════════════════ */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '12px 12px 14px', marginBottom: 14 }}>
            <SH label="சினிமா" color={T.purple} href="/movies" icon={Film} />
            <div className="nt-cm-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {CINEMA.map(m => <CinemaCard key={m.id} movie={m} />)}
            </div>
            <div className="nt-cm-scroll" style={{ display: 'none', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
              {CINEMA.map(m => (
                <div key={m.id} style={{ flexShrink: 0, width: 90 }}><CinemaCard movie={m} /></div>
              ))}
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════════
              OTT PLATFORMS
              ════════════════════════════════════════════════════════════════════ */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '12px 12px 14px', marginBottom: 14 }}>
            <SH label="OTT Platforms" color={T.blue} href="/ott-plans" icon={Tv2} />
            <div className="nt-ott-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 7 }}>
              {OTT_PLATFORMS.map(p => <OttTile key={p.label} {...p} />)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginTop: 8 }}>
              <Link href="/movies" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, textDecoration: 'none', fontSize: 11, fontWeight: 700, color: T.muted, padding: '8px 0', borderRadius: 5, background: T.bg3, border: `1px solid ${T.border2}` }}>
                <Film style={{ width: 10, height: 10 }} /> Tamil Movies
              </Link>
              <Link href="/serials" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, textDecoration: 'none', fontSize: 11, fontWeight: 700, color: T.muted, padding: '8px 0', borderRadius: 5, background: T.bg3, border: `1px solid ${T.border2}` }}>
                <Tv2 style={{ width: 10, height: 10 }} /> Tamil Serials
              </Link>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════════
              NEWS FEED + SIDEBAR
              ════════════════════════════════════════════════════════════════════ */}
          <div className="nt-low" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>

            {/* News list */}
            <div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '12px 12px 10px' }}>
                <SH label={category === 'all' ? 'Latest News' : CATS.find(c => c.key === category)?.label ?? 'News'} color={T.red} icon={Newspaper} />
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => <Skel key={i} h={58} r={3} />)
                  : listItems.map((item, i) => (
                    <div key={i}>
                      <NewsRow item={item} idx={i} />
                      {(i + 1) % 6 === 0 && (
                        <ins className="adsbygoogle" style={{ display: 'block' }}
                          data-ad-format="fluid" data-ad-layout-key="-fb+5w+4e-db+86"
                          data-ad-client="ca-pub-4237294630161176" data-ad-slot="auto" />
                      )}
                    </div>
                  ))
                }
                {!loading && filtered.length > listStart + 20 && (
                  <button onClick={() => setShowMore(s => !s)}
                    style={{ marginTop: 10, width: '100%', padding: '9px 0', borderRadius: 5, background: T.bg3, border: `1px solid ${T.border2}`, color: T.muted, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                    {showMore
                      ? <><ChevronLeft style={{ width: 11, height: 11 }} /> Show less</>
                      : <>Load more <ChevronRight style={{ width: 11, height: 11 }} /></>}
                  </button>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="nt-side" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Cricket */}
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '12px 10px' }}>
                <SH label="IPL Live" color={T.green} />
                <div style={{ borderRadius: 5, overflow: 'hidden', border: `1px solid ${T.border}` }}>
                  <CricketWidget compact />
                </div>
              </div>
              {/* Trending mobile */}
              <div className="nt-tend-m">
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '12px 10px' }}>
                  <SH label="Trending" color={T.gold} icon={TrendingUp} />
                  {loading
                    ? Array.from({ length: 5 }).map((_, i) => <Skel key={i} h={40} r={3} />)
                    : trending.slice(0, 7).map((it, i) => <TrendRow key={i} item={it} rank={i + 1} />)
                  }
                </div>
              </div>
              <AdUnit size="rectangle" />
            </div>
          </div>

        </div>{/* nt-wrap */}

        <TVKSpotlight />

        <div className="nt-wrap" style={{ paddingBottom: 24 }}>
          <AdUnit size="banner" />
        </div>

        <style>{`
          @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
          @keyframes ping    { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(1.5)} }
          @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
          @keyframes shimmer { 0%{opacity:0.35} 50%{opacity:0.65} 100%{opacity:0.35} }

          /* ── Wrapper padding ───────────────── */
          .nt-wrap { max-width: 1280px; margin: 0 auto; padding-left: 14px; padding-right: 14px; }
          @media(min-width:640px) { .nt-wrap { padding-left: 20px; padding-right: 20px; } }
          @media(min-width:1024px) { .nt-wrap { padding-left: 28px; padding-right: 28px; } }
          .nt-v { padding-top: 14px; padding-bottom: 8px; }

          /* ── Top section sidebar ──────────── */
          @media(min-width:960px) {
            .nt-top  { grid-template-columns: 1fr 260px !important; align-items: start; }
            .nt-tend { display: block !important; }
            .nt-tend-m { display: none !important; }
          }

          /* ── Secondary grid: 4 on desktop, 2 on mobile ── */
          @media(max-width:400px) {
            .nt-sec { grid-template-columns: 1fr 1fr !important; }
          }

          /* ── Cinema ───────────────────────── */
          @media(min-width:960px)  { .nt-cm-grid { grid-template-columns: repeat(12,1fr) !important; } .nt-cm-scroll { display:none !important; } }
          @media(min-width:600px) and (max-width:959px) { .nt-cm-grid { grid-template-columns: repeat(6,1fr) !important; } .nt-cm-scroll { display:none !important; } }
          @media(max-width:599px)  { .nt-cm-grid { display:none !important; } .nt-cm-scroll { display:flex !important; } }

          /* ── OTT ──────────────────────────── */
          @media(min-width:960px)  { .nt-ott-grid { grid-template-columns: repeat(6,1fr) !important; } }
          @media(min-width:600px) and (max-width:959px) { .nt-ott-grid { grid-template-columns: repeat(3,1fr) !important; } }

          /* ── Lower grid ───────────────────── */
          @media(min-width:960px) { .nt-low { grid-template-columns: 1fr 260px !important; align-items: start; } }

          /* ── Hover states ─────────────────── */
          .nt-hero  { transition: opacity 0.18s ease; }
          .nt-hero:hover { opacity: 0.92; }
          .nt-smcard { transition: opacity 0.15s ease; }
          .nt-smcard:hover { opacity: 0.8; }
          .nt-row   { transition: background 0.1s; }
          .nt-row:hover { background: rgba(255,255,255,0.03); }
          .nt-trow  { transition: background 0.1s; }
          .nt-trow:hover { background: rgba(255,255,255,0.03); }
          .nt-ccard { transition: transform 0.15s ease; }
          .nt-ccard:hover { transform: translateY(-3px); }
          .nt-ott   { transition: opacity 0.12s; }
          .nt-ott:hover { opacity: 0.8; }
        `}</style>
      </div>
    </div>
  )
}
