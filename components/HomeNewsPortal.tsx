'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RefreshCw, ExternalLink, Newspaper,
  TrendingUp, Tv2, Film, Play, Trophy, Radio,
  Clock, Flame, Zap, Star, ChevronRight,
} from 'lucide-react'
import { goLink } from '@/lib/goLink'
import CricketWidget from '@/components/CricketWidget'
import AdUnit from '@/components/AdUnit'
import VisitorCounter from '@/components/VisitorCounter'
import TVKSpotlight from '@/components/TVKSpotlight'
import { movies } from '@/data/movies'

// ── Design tokens (navy editorial, like Variant B) ─────────────────────
const T = {
  bg:       '#04040f',
  surface:  '#0c0c1e',
  surface2: '#12122a',
  border:   'rgba(255,255,255,0.08)',
  border2:  'rgba(255,255,255,0.12)',
  text:     '#f1f0ff',
  muted:    'rgba(255,255,255,0.38)',
  gold:     '#f59e0b',
  red:      '#ef4444',
  purple:   '#a78bfa',
  green:    '#4ade80',
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

const REFRESH_MS = 6 * 60 * 1000
const CACHE_TTL  = 3 * 60 * 1000
const SPORTS_KW  = ['cricket','ipl','csk','dhoni','match','விளையாட்டு','கிரிக்கெட்','rcb','kkr']

const SRC: Record<string, string> = {
  'Dinamalar':           '#e11d48', 'Maalaimalar':         '#7c3aed',
  'OneIndia Tamil':      '#0891b2', 'The Hindu Tamil':     '#1d4ed8',
  'Vikatan':             '#d97706', 'Puthiya Thalaimurai': '#dc2626',
  'Sun News':            '#f59e0b', 'Polimer News':        '#16a34a',
  'NammaTVK':            '#f59e0b', 'Kalaignar News':      '#ef4444',
  'Thanthi TV':          '#f97316', 'NDTV India':          '#dc2626',
}

const CATS = [
  { key: 'all',      label: 'All',      icon: Radio,   color: T.red },
  { key: 'tvk',     label: 'TVK 2026', icon: Zap,     color: T.gold, badge: 'LIVE' },
  { key: 'politics', label: 'Politics', icon: Zap,     color: '#fbbf24' },
  { key: 'cinema',   label: 'Cinema',   icon: Film,    color: T.purple },
  { key: 'sports',   label: 'Sports',   icon: Trophy,  color: T.green },
]

const OTT_PLATFORMS = [
  { href: '/ott-plans', label: 'Netflix',       icon: 'N',  color: '#e50914', sub: 'Tamil Originals'   },
  { href: '/ott-plans', label: 'Prime Video',   icon: '▶',  color: '#00a8e0', sub: 'New Releases'      },
  { href: '/ott-plans', label: 'Disney+',       icon: '★',  color: '#0073e6', sub: 'Star Vijay Live'   },
  { href: '/ott-plans', label: 'ZEE5',          icon: 'Z',  color: '#8b5cf6', sub: 'Serials & Shows'   },
  { href: '/ott-plans', label: 'SunNXT',        icon: '☀',  color: '#f59e0b', sub: 'Sun TV Originals'  },
  { href: '/ott-plans', label: 'YouTube',       icon: '▷',  color: '#ff0000', sub: 'Free Tamil Movies' },
]

// ── Cinema data ────────────────────────────────────────────────────────
const OTT_C: Record<string, string> = {
  'Netflix': '#e50914', 'Amazon Prime': '#00a8e0',
  'Disney+ Hotstar': '#0073e6', 'ZEE5': '#8b5cf6', 'YouTube': '#ff0000',
}
const CINEMA = movies
  .filter(m => m.language === 'Tamil' && m.year >= 2025)
  .sort((a, b) => {
    const ar = a.ottDate && a.ottDate !== 'Coming Soon' ? 1 : 0
    const br = b.ottDate && b.ottDate !== 'Coming Soon' ? 1 : 0
    if (br !== ar) return br - ar
    if (b.year !== a.year) return b.year - a.year
    return b.rating - a.rating
  })
  .slice(0, 8)

function ratingColor(r: number) {
  if (r >= 8) return '#4ade80'; if (r >= 7) return '#fbbf24'; if (r >= 6) return '#fb923c'; return '#f87171'
}

// ── Ticker ─────────────────────────────────────────────────────────────
function Ticker({ items }: { items: NewsItem[] }) {
  if (!items.length) return null
  const heads = items.slice(0, 12).map(n => n.title)
  return (
    <div style={{ background: 'rgba(239,68,68,0.06)', borderBottom: `1px solid rgba(239,68,68,0.1)`, overflow: 'hidden', display: 'flex', alignItems: 'center', height: 28 }}>
      <div style={{ flexShrink: 0, padding: '0 14px', height: '100%', display: 'flex', alignItems: 'center', gap: 6, background: T.red, fontSize: 9, fontWeight: 900, color: '#fff', letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff', display: 'inline-block', animation: 'ping 1.5s ease-in-out infinite' }} />
        LIVE
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 40, whiteSpace: 'nowrap', fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.65)', animation: 'marquee 110s linear infinite', paddingLeft: 20 }}>
          {[...heads, ...heads].map((h, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: T.red, fontSize: 8 }}>●</span>{h}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Section heading (editorial style) ─────────────────────────────────
function SH({ label, color, href, sub }: { label: string; color: string; href?: string; sub?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 12 }}>
      <div style={{ width: 3, height: 18, background: color, borderRadius: 2, marginRight: 10, flexShrink: 0 }} />
      <div>
        <span style={{ fontSize: 11, fontWeight: 900, color: T.text, letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1 }}>{label}</span>
        {sub && <div style={{ fontSize: 9, color: T.muted, marginTop: 1 }}>{sub}</div>}
      </div>
      {href && (
        <Link href={href} style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 600, color: T.muted, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
          All <ChevronRight style={{ width: 10, height: 10 }} />
        </Link>
      )}
    </div>
  )
}

// ── Hero news card (large, image bg) ──────────────────────────────────
function HeroCard({ item, height = 200 }: { item: NewsItem; height?: number }) {
  const c = SRC[item.source] ?? '#6b7280'
  return (
    <a href={goLink(item.link, 'hero')} target="_blank" rel="noopener noreferrer"
      style={{ display: 'block', textDecoration: 'none', borderRadius: 12, overflow: 'hidden', position: 'relative', height, transition: 'transform 0.22s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.01)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
    >
      <div style={{ position: 'absolute', inset: 0 }}>
        {item.imageUrl
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={item.imageUrl} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          : <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${c}35, ${T.surface})` }} />
        }
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(4,4,15,0.97) 0%, rgba(4,4,15,0.5) 55%, transparent 100%)' }} />
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
          <span style={{ fontSize: 8, fontWeight: 800, padding: '2px 7px', borderRadius: 3, background: `${c}25`, color: c, border: `1px solid ${c}40`, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{item.source}</span>
          {item.category !== 'all' && item.category !== 'politics' && (
            <span style={{ fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 3, background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.category}</span>
          )}
          <span style={{ fontSize: 9, color: T.muted, display: 'flex', alignItems: 'center', gap: 2, marginLeft: 'auto' }}>
            <Clock style={{ width: 8, height: 8 }} />{item.timeAgo}
          </span>
        </div>
        <h2 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 'clamp(14px, 1.9vw, 19px)', fontWeight: 700, color: '#fff', lineHeight: 1.25, margin: 0, letterSpacing: '-0.01em', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {item.title}
        </h2>
      </div>
    </a>
  )
}

// ── Compact secondary card ─────────────────────────────────────────────
function SecCard({ item }: { item: NewsItem }) {
  const c = SRC[item.source] ?? '#6b7280'
  return (
    <a href={goLink(item.link, 'secondary')} target="_blank" rel="noopener noreferrer"
      style={{ display: 'block', textDecoration: 'none', borderRadius: 10, overflow: 'hidden', position: 'relative', height: 115, transition: 'transform 0.18s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
    >
      <div style={{ position: 'absolute', inset: 0 }}>
        {item.imageUrl
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={item.imageUrl} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          : <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${c}30, ${T.surface})` }} />
        }
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(4,4,15,0.95) 0%, rgba(4,4,15,0.25) 60%, transparent 100%)' }} />
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 11px' }}>
        <span style={{ fontSize: 8, fontWeight: 700, color: c, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.source}</span>
        <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 12, fontWeight: 700, color: '#fff', lineHeight: 1.3, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {item.title}
        </p>
      </div>
    </a>
  )
}

// ── News list row (readable, clear) ───────────────────────────────────
function NewsRow({ item }: { item: NewsItem }) {
  const c = SRC[item.source] ?? '#6b7280'
  return (
    <motion.a
      href={goLink(item.link, 'news-list')} target="_blank" rel="noopener noreferrer"
      whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }} transition={{ duration: 0.12 }}
      style={{ display: 'flex', gap: 10, textDecoration: 'none', borderRadius: 10, padding: '9px 10px', background: T.surface, border: `1px solid ${T.border}`, alignItems: 'flex-start' }}
    >
      {item.imageUrl && (
        <div style={{ flexShrink: 0, width: 62, height: 46, borderRadius: 7, overflow: 'hidden', background: `${c}18` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.imageUrl} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        </div>
      )}
      {!item.imageUrl && (
        <div style={{ flexShrink: 0, width: 62, height: 46, borderRadius: 7, background: `${c}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Newspaper style={{ width: 14, height: 14, color: `${c}60` }} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 13, fontWeight: 600, color: T.text, lineHeight: 1.35, margin: '0 0 5px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {item.title}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 3, background: `${c}15`, color: c, border: `1px solid ${c}22` }}>{item.source}</span>
          <span style={{ fontSize: 9, color: T.muted, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Clock style={{ width: 8, height: 8 }} />{item.timeAgo}
          </span>
          <ExternalLink style={{ width: 8, height: 8, color: 'rgba(255,255,255,0.08)', marginLeft: 'auto' }} />
        </div>
      </div>
    </motion.a>
  )
}

// ── Trending row ────────────────────────────────────────────────────────
function TrendRow({ item, rank }: { item: NewsItem; rank: number }) {
  const c = SRC[item.source] ?? '#6b7280'
  return (
    <motion.a
      href={goLink(item.link, 'trending')} target="_blank" rel="noopener noreferrer"
      whileHover={{ x: 3 }} transition={{ duration: 0.1 }}
      style={{ display: 'flex', gap: 10, textDecoration: 'none', padding: '7px 0', borderBottom: `1px solid ${T.border}`, alignItems: 'flex-start' }}
    >
      <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 900, color: rank <= 3 ? T.gold : 'rgba(255,255,255,0.15)', width: 18, textAlign: 'right', paddingTop: 1, fontFamily: "'Newsreader', Georgia, serif" }}>{rank}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 11.5, fontWeight: 600, color: '#ddd', lineHeight: 1.3, margin: '0 0 3px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.title}</p>
        <span style={{ fontSize: 9, fontWeight: 700, color: c, opacity: 0.8 }}>{item.source}</span>
        <span style={{ fontSize: 9, color: T.muted, marginLeft: 5 }}>{item.timeAgo}</span>
      </div>
    </motion.a>
  )
}

// ── Cinema poster card ──────────────────────────────────────────────────
function CinemaCard({ movie }: { movie: (typeof CINEMA)[0] }) {
  const rc = ratingColor(movie.rating)
  const platform = movie.streamingOn?.[0]
  const ottColor = platform ? (OTT_C[platform] ?? '#6b7280') : null
  const isOtt = movie.ottDate && movie.ottDate !== 'Coming Soon'

  return (
    <motion.div whileHover={{ y: -3, boxShadow: '0 8px 28px rgba(0,0,0,0.5)' }} transition={{ duration: 0.18 }}>
      <Link href={`/movies/${movie.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
        <div style={{ borderRadius: 10, overflow: 'hidden', background: T.surface, border: `1px solid ${T.border}` }}>
          {/* Poster */}
          <div style={{ aspectRatio: '2/3', background: `linear-gradient(160deg, ${rc}28 0%, ${T.surface} 60%, ${T.bg} 100%)`, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Rating pill */}
            <div style={{ position: 'absolute', top: 6, left: 6, display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(0,0,0,0.8)', borderRadius: 5, padding: '3px 6px', backdropFilter: 'blur(4px)' }}>
              <Star style={{ width: 8, height: 8, color: rc, fill: rc }} />
              <span style={{ fontSize: 9, fontWeight: 900, color: rc }}>{movie.rating.toFixed(1)}</span>
            </div>
            {/* OTT badge */}
            {isOtt && ottColor && (
              <div style={{ position: 'absolute', top: 6, right: 6, fontSize: 7, fontWeight: 900, padding: '2px 5px', borderRadius: 3, background: `${ottColor}22`, color: ottColor, border: `1px solid ${ottColor}45`, maxWidth: 54, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {platform}
              </div>
            )}
            {/* Genre center icon */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <Play style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.18)' }} />
              <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.05em' }}>{movie.genre?.[0]}</span>
            </div>
            {/* Year bottom right */}
            <span style={{ position: 'absolute', bottom: 5, right: 6, fontSize: 8, color: 'rgba(255,255,255,0.18)' }}>{movie.year}</span>
          </div>
          {/* Info */}
          <div style={{ padding: '7px 8px 9px' }}>
            <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 10.5, fontWeight: 700, color: T.text, lineHeight: 1.3, margin: '0 0 2px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{movie.title}</p>
            <p style={{ fontSize: 8, color: T.muted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{movie.cast?.slice(0, 1).join(', ')}</p>
            {movie.badge && (
              <span style={{ display: 'inline-block', marginTop: 4, fontSize: 7, fontWeight: 900, padding: '1px 5px', borderRadius: 3, background: 'rgba(167,139,250,0.12)', color: T.purple, border: `1px solid rgba(167,139,250,0.2)` }}>{movie.badge}</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

// ── OTT platform tile ──────────────────────────────────────────────────
function OttTile({ href, label, icon, color, sub }: { href: string; label: string; icon: string; color: string; sub: string }) {
  return (
    <motion.div whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.14 }}>
      <Link href={href} style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none', padding: '10px 11px', borderRadius: 10, background: `${color}0d`, border: `1px solid ${color}30`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: 40, height: 40, background: `${color}12`, borderRadius: '0 10px 0 40px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: '#fff', flexShrink: 0 }}>{icon}</div>
          <span style={{ fontSize: 11, fontWeight: 800, color: T.text }}>{label}</span>
        </div>
        <span style={{ fontSize: 9, color: T.muted, paddingLeft: 32, lineHeight: 1.2 }}>{sub}</span>
      </Link>
    </motion.div>
  )
}

function Skel({ h = 60, radius = 10 }: { h?: number; radius?: number }) {
  return <div style={{ height: h, borderRadius: radius, background: T.surface, animation: 'shimmer 1.5s infinite' }} />
}

const TVK_PROMO: NewsItem = {
  title: 'Thalapathy Vijay — TVK கட்சி | Tamil Nadu CM Race 2026',
  desc: 'வெற்றி கழகம் தலைவர் விஜய், 2026 தமிழ்நாடு சட்டமன்ற தேர்தலில் ஆட்சி அமைக்க தயாராகிறார்.',
  link: 'https://en.wikipedia.org/wiki/Tamilaga_Vettri_Kazhagam',
  source: 'NammaTamil.tv', sourceLogo: '', pubDate: new Date().toISOString(),
  timeAgo: 'pinned', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Vijay_at_CWC_2011.jpg/800px-Vijay_at_CWC_2011.jpg',
  category: 'tvk',
}

// ═══════════════════════════════════════════════════════════════════════
export default function HomeNewsPortal() {
  const [data, setData]         = useState<ApiResponse | null>(null)
  const [loading, setLoading]   = useState(true)
  const [refreshing, setRefresh] = useState(false)
  const [category, setCat]      = useState<'all' | 'tvk' | 'politics' | 'cinema' | 'sports'>('all')
  const [showMore, setShowMore] = useState(false)
  const [secAgo, setSecAgo]     = useState(0)
  const [heroIdx, setHeroIdx]   = useState(0)
  const heroTimer               = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchNews = useCallback(async (manual = false) => {
    if (manual) setRefresh(true)
    else {
      try {
        const cached = sessionStorage.getItem('nt_news_v3')
        if (cached) {
          const { d, at } = JSON.parse(cached)
          if (Date.now() - at < CACHE_TTL) { setData(d); setLoading(false); return }
        }
      } catch { /* ignore */ }
    }
    try {
      const res = await fetch('/api/tamil-media-news', { cache: 'no-store', signal: AbortSignal.timeout(8000) })
      if (!res.ok) return
      const json: ApiResponse = await res.json()
      setData(json); setSecAgo(0); setShowMore(false); setHeroIdx(0)
      try { sessionStorage.setItem('nt_news_v3', JSON.stringify({ d: json, at: Date.now() })) } catch { /* ignore */ }
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
      const extra = all.filter(n => SPORTS_KW.some(kw => (n.title + n.desc).toLowerCase().includes(kw)) && n.category !== 'sports')
      return [...tagged, ...extra]
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

  const listItems  = showMore ? filtered.slice(3) : filtered.slice(3, 18)
  const freshLabel = secAgo < 60 ? `${secAgo}s ago` : `${Math.floor(secAgo / 60)}m ago`

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', color: T.text }}>

      {/* ── TICKER ─────────────────────────────────────────────────── */}
      {!loading && <Ticker items={all} />}

      {/* ── CATEGORY NAV ───────────────────────────────────────────── */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(12px)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {CATS.map(cat => {
              const active = category === cat.key
              const Ic = cat.icon
              return (
                <button key={cat.key}
                  onClick={() => { setCat(cat.key as typeof category); setShowMore(false) }}
                  style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, padding: '10px 14px', fontSize: 11, fontWeight: active ? 800 : 500, color: active ? cat.color : T.muted, background: 'none', border: 'none', cursor: 'pointer', borderBottom: active ? `2px solid ${cat.color}` : '2px solid transparent', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                >
                  <Ic style={{ width: 11, height: 11 }} />
                  {cat.label}
                  {'badge' in cat && cat.badge && (
                    <span style={{ fontSize: 7, fontWeight: 900, padding: '1px 4px', borderRadius: 3, background: T.red, color: '#fff' }}>{cat.badge}</span>
                  )}
                </button>
              )
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, padding: '8px 0' }}>
            <span style={{ fontSize: 9, color: T.muted, whiteSpace: 'nowrap' }}>{refreshing ? 'Refreshing…' : freshLabel}</span>
            <button onClick={() => fetchNews(true)} disabled={refreshing}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, padding: 3, lineHeight: 0 }}>
              <RefreshCw style={{ width: 10, height: 10, animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            </button>
            <VisitorCounter />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">

        {/* ═══════════════════════════════════════════════════════════
            TOP SECTION: hero (left) + trending sidebar (right)
            ═══════════════════════════════════════════════════════════ */}
        <div className="top-section" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14, marginBottom: 16 }}>

          {/* ── HERO + 2 secondary ──────────────────────────────────── */}
          <div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Skel h={200} /><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}><Skel h={115} /><Skel h={115} /></div>
              </div>
            ) : heroItem ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {heroPool.length > 1 && (
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                    {heroPool.map((_, i) => (
                      <button key={i} onClick={() => setHeroIdx(i)}
                        style={{ width: i === heroIdx ? 18 : 5, height: 4, borderRadius: 99, background: i === heroIdx ? T.red : 'rgba(255,255,255,0.18)', border: 'none', cursor: 'pointer', transition: 'all 0.3s', padding: 0 }} />
                    ))}
                  </div>
                )}
                <AnimatePresence mode="wait">
                  <motion.div key={heroItem.link} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                    <HeroCard item={heroItem} height={195} />
                  </motion.div>
                </AnimatePresence>
                <div className="sec-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {filtered.slice(1, 3).map((it, i) => <SecCard key={i} item={it} />)}
                </div>
              </div>
            ) : null}
          </div>

          {/* ── TRENDING sidebar (desktop only) ─────────────────────── */}
          <div className="trend-aside" style={{ display: 'none' }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 14px 8px' }}>
              <SH label="Trending Now" color={T.gold} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => <Skel key={i} h={42} radius={5} />)
                  : trending.slice(0, 10).map((it, i) => <TrendRow key={i} item={it} rank={i + 1} />)
                }
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            CINEMA SECTION — full-width poster grid
            ═══════════════════════════════════════════════════════════ */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 14px 16px', marginBottom: 16 }}>
          <SH label="Cinema Reviews" color={T.purple} href="/movies" sub="Tamil releases 2025–2026" />
          <div className="cinema-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {CINEMA.map((movie, i) => (
              <motion.div key={movie.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.28 }}>
                <CinemaCard movie={movie} />
              </motion.div>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            WATCH ON OTT — full-width with 6 platform tiles
            ═══════════════════════════════════════════════════════════ */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 14px 16px', marginBottom: 16 }}>
          <SH label="Watch on OTT" color="#00a8e0" href="/ott-plans" sub="Stream Tamil content" />
          <div className="ott-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 10 }}>
            {OTT_PLATFORMS.map(p => <OttTile key={p.label} {...p} />)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Link href="/movies" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, textDecoration: 'none', fontSize: 11, fontWeight: 700, color: T.muted, padding: '8px 0', borderRadius: 8, background: T.surface2, border: `1px solid ${T.border}` }}>
              <Film style={{ width: 11, height: 11 }} /> Browse Tamil Movies
            </Link>
            <Link href="/serials" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, textDecoration: 'none', fontSize: 11, fontWeight: 700, color: T.muted, padding: '8px 0', borderRadius: 8, background: T.surface2, border: `1px solid ${T.border}` }}>
              <Tv2 style={{ width: 11, height: 11 }} /> Browse Tamil Serials
            </Link>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            LOWER: news feed | sidebar (IPL + trending on mobile)
            ═══════════════════════════════════════════════════════════ */}
        <div className="lower-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>

          {/* News list */}
          <div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 12px' }}>
              <SH label={category === 'all' ? 'Latest News' : CATS.find(c => c.key === category)?.label ?? 'News'} color={T.red} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => <Skel key={i} h={68} />)
                  : listItems.map((item, i) => (
                    <div key={i}>
                      <NewsRow item={item} />
                      {(i + 1) % 6 === 0 && (
                        <ins className="adsbygoogle" style={{ display: 'block' }}
                          data-ad-format="fluid" data-ad-layout-key="-fb+5w+4e-db+86"
                          data-ad-client="ca-pub-4237294630161176" data-ad-slot="auto" />
                      )}
                    </div>
                  ))
                }
              </div>
              {!loading && filtered.length > 18 && (
                <button onClick={() => setShowMore(s => !s)}
                  style={{ marginTop: 12, width: '100%', padding: '10px 0', borderRadius: 8, background: T.surface2, border: `1px solid ${T.border}`, color: T.muted, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                  {showMore ? 'Show Less' : `Load ${filtered.length - 18} More Stories`}
                </button>
              )}
            </div>
          </div>

          {/* Sidebar: IPL + trending (mobile) */}
          <div className="sidebar-col" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* IPL widget */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 12px' }}>
              <SH label="IPL 2025 Live" color={T.green} sub="Live scores & updates" />
              <div style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${T.border}` }}>
                <CricketWidget compact />
              </div>
            </div>

            {/* Trending on mobile */}
            <div className="trend-mobile">
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 12px' }}>
                <SH label="Trending Now" color={T.gold} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {loading
                    ? Array.from({ length: 6 }).map((_, i) => <Skel key={i} h={42} radius={5} />)
                    : trending.slice(0, 8).map((it, i) => <TrendRow key={i} item={it} rank={i + 1} />)
                  }
                </div>
              </div>
            </div>

            <AdUnit size="rectangle" />
          </div>

        </div>
      </div>

      {/* TVK SPOTLIGHT */}
      <TVKSpotlight />

      {/* FOOTER AD */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <AdUnit size="banner" />
      </div>

      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes ping { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.5)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes shimmer { 0%{opacity:0.6} 50%{opacity:1} 100%{opacity:0.6} }

        /* ── DESKTOP top section: hero + trending ─────────────────── */
        @media (min-width: 960px) {
          .top-section { grid-template-columns: 1fr 280px !important; align-items: start; }
          .trend-aside { display: block !important; }
          .trend-mobile { display: none !important; }
        }

        /* ── DESKTOP cinema: 8-col ────────────────────────────────── */
        @media (min-width: 960px) {
          .cinema-grid { grid-template-columns: repeat(8, 1fr) !important; }
        }
        @media (min-width: 640px) and (max-width: 959px) {
          .cinema-grid { grid-template-columns: repeat(6, 1fr) !important; }
        }

        /* ── OTT grid: 6-col on desktop ──────────────────────────── */
        @media (min-width: 960px) {
          .ott-grid { grid-template-columns: repeat(6, 1fr) !important; }
        }
        @media (min-width: 640px) and (max-width: 959px) {
          .ott-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }

        /* ── Lower 2-col on desktop ───────────────────────────────── */
        @media (min-width: 960px) {
          .lower-grid { grid-template-columns: 1fr 280px !important; align-items: start; }
        }

        /* ── Mobile: secondary cards stack ───────────────────────── */
        @media (max-width: 480px) {
          .sec-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
