'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RefreshCw, ExternalLink, Newspaper,
  TrendingUp, Tv2, Film, Play, Trophy, Radio,
  Clock, Flame, Zap, Star, ChevronRight, ChevronLeft,
} from 'lucide-react'
import { goLink } from '@/lib/goLink'
import CricketWidget from '@/components/CricketWidget'
import AdUnit from '@/components/AdUnit'
import VisitorCounter from '@/components/VisitorCounter'
import TVKSpotlight from '@/components/TVKSpotlight'
import { movies } from '@/data/movies'

// ── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg:       '#04040f',
  bg2:      '#090920',
  bg3:      '#0e0e28',
  surface:  'rgba(255,255,255,0.035)',
  surface2: 'rgba(255,255,255,0.065)',
  border:   'rgba(255,255,255,0.07)',
  border2:  'rgba(255,255,255,0.12)',
  text:     '#f2f0ff',
  sub:      'rgba(255,255,255,0.55)',
  muted:    'rgba(255,255,255,0.36)',
  dim:      'rgba(255,255,255,0.18)',
  gold:     '#f59e0b',
  red:      '#ef4444',
  crimson:  '#dc2626',
  purple:   '#a78bfa',
  green:    '#4ade80',
  blue:     '#60a5fa',
  teal:     '#2dd4bf',
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
const LS_KEY       = 'nt_news_ls_v2'
const SS_KEY       = 'nt_news_v4'
const SPORTS_KW    = ['cricket','ipl','csk','dhoni','match','விளையாட்டு','கிரிக்கெட்','rcb','kkr']

const SRC: Record<string, string> = {
  'Dinamalar':           '#e11d48', 'Maalaimalar':         '#7c3aed',
  'OneIndia Tamil':      '#0891b2', 'The Hindu Tamil':     '#1d4ed8',
  'Vikatan':             '#d97706', 'Puthiya Thalaimurai': '#dc2626',
  'Sun News':            '#f59e0b', 'Polimer News':        '#16a34a',
  'NammaTVK':            '#f59e0b', 'Kalaignar News':      '#ef4444',
  'Thanthi TV':          '#f97316', 'NDTV India':          '#dc2626',
}

const CATS = [
  { key: 'all',      label: 'அனைத்தும்',  icon: Radio,   color: T.crimson },
  { key: 'tvk',     label: 'TVK 2026',  icon: Zap,     color: T.gold,   badge: 'LIVE' },
  { key: 'politics', label: 'அரசியல்',   icon: Flame,   color: '#fbbf24' },
  { key: 'cinema',   label: 'சினிமா',    icon: Film,    color: T.purple },
  { key: 'sports',   label: 'விளையாட்டு', icon: Trophy,  color: T.green },
]

const OTT_PLATFORMS = [
  { href: '/ott-plans', label: 'Netflix',     icon: 'N', color: '#e50914', sub: 'Tamil Originals' },
  { href: '/ott-plans', label: 'Prime Video', icon: '▶', color: '#00a8e0', sub: 'New Releases' },
  { href: '/ott-plans', label: 'Disney+',     icon: '★', color: '#0073e6', sub: 'Star Vijay Live' },
  { href: '/ott-plans', label: 'ZEE5',        icon: 'Z', color: '#8b5cf6', sub: 'Serials & Shows' },
  { href: '/ott-plans', label: 'SunNXT',      icon: '☀', color: '#f59e0b', sub: 'Sun TV Originals' },
  { href: '/ott-plans', label: 'YouTube',     icon: '▷', color: '#ff0000', sub: 'Free Tamil Movies' },
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
  .slice(0, 10)

function ratingColor(r: number) {
  if (r >= 8) return '#4ade80'; if (r >= 7) return '#fbbf24'; if (r >= 6) return '#fb923c'; return '#f87171'
}

function catColor(cat: string): string {
  switch (cat) {
    case 'tvk':      return T.gold
    case 'politics': return '#fbbf24'
    case 'cinema':   return T.purple
    case 'sports':   return T.green
    default:         return T.teal
  }
}

// ── Rolling Ticker ────────────────────────────────────────────────────────────
function Ticker({ items }: { items: NewsItem[] }) {
  if (!items.length) return null
  const heads = items.slice(0, 14).map(n => n.title)
  return (
    <div style={{ background: 'rgba(220,38,38,0.07)', borderBottom: `1px solid rgba(220,38,38,0.14)`, overflow: 'hidden', display: 'flex', alignItems: 'center', height: 34 }}>
      <div style={{ flexShrink: 0, padding: '0 16px', height: '100%', display: 'flex', alignItems: 'center', gap: 7, background: T.crimson, fontSize: 9, fontWeight: 900, color: '#fff', letterSpacing: '0.16em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', display: 'inline-block', animation: 'ping 1.5s ease-in-out infinite' }} />
        LIVE
      </div>
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 48, background: `linear-gradient(to right, ${T.bg}, transparent)`, zIndex: 2, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 48, background: `linear-gradient(to left, ${T.bg}, transparent)`, zIndex: 2, pointerEvents: 'none' }} />
        <div style={{ display: 'flex', gap: 56, whiteSpace: 'nowrap', fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.6)', animation: 'marquee 130s linear infinite', paddingLeft: 28 }}>
          {[...heads, ...heads].map((h, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 14 }}>
              <span style={{ color: T.crimson, fontSize: 6 }}>◆</span>{h}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Section heading ───────────────────────────────────────────────────────────
function SH({ label, color, href, sub, icon: Icon }: { label: string; color: string; href?: string; sub?: string; icon?: React.ElementType }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
      <div style={{ width: 3, height: 22, background: `linear-gradient(to bottom, ${color}, ${color}55)`, borderRadius: 2, marginRight: 12, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          {Icon && <Icon style={{ width: 13, height: 13, color }} />}
          <span style={{ fontSize: 13, fontWeight: 900, color: T.text, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
        </div>
        {sub && <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>{sub}</div>}
      </div>
      {href && (
        <Link href={href} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', fontSize: 11, fontWeight: 700, color, opacity: 0.7, whiteSpace: 'nowrap' }}>
          View all <ChevronRight style={{ width: 11, height: 11 }} />
        </Link>
      )}
    </div>
  )
}

// ── Category badge ────────────────────────────────────────────────────────────
function CatBadge({ cat }: { cat: string }) {
  if (!cat || cat === 'general') return null
  const c = catColor(cat)
  const labels: Record<string, string> = { tvk: 'TVK', politics: 'அரசியல்', cinema: 'சினிமா', sports: 'SPORTS' }
  return (
    <span style={{ fontSize: 8.5, fontWeight: 900, padding: '2px 7px', borderRadius: 4, background: `${c}1a`, color: c, border: `1px solid ${c}35`, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
      {labels[cat] ?? cat}
    </span>
  )
}

// ── Hero card ─────────────────────────────────────────────────────────────────
function HeroCard({ item }: { item: NewsItem }) {
  const c = SRC[item.source] ?? '#6b7280'
  const [imgFailed, setImgFailed] = useState(false)
  return (
    <a href={goLink(item.link, 'hero')} target="_blank" rel="noopener noreferrer"
      style={{ display: 'block', textDecoration: 'none', borderRadius: 18, overflow: 'hidden', position: 'relative', aspectRatio: '16/9' }}
      className="hero-card"
    >
      <div style={{ position: 'absolute', inset: 0 }}>
        {item.imageUrl && !imgFailed
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={item.imageUrl} alt={item.title} loading="eager" fetchPriority="high" decoding="async"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImgFailed(true)} />
          : <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${c}55 0%, ${T.bg2} 45%, ${T.bg} 100%)` }} />
        }
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(4,4,15,1) 0%, rgba(4,4,15,0.72) 35%, rgba(4,4,15,0.08) 72%, transparent 100%)' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(to bottom, rgba(4,4,15,0.45), transparent)' }} />
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '28px 22px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 7, marginBottom: 11 }}>
          <span style={{ fontSize: 9.5, fontWeight: 900, padding: '3px 10px', borderRadius: 5, background: c, color: '#fff', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{item.source}</span>
          <CatBadge cat={item.category} />
          <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 3, marginLeft: 'auto' }}>
            <Clock style={{ width: 9, height: 9 }} />{item.timeAgo}
          </span>
        </div>
        <h2 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 'clamp(18px, 3vw, 28px)', fontWeight: 800, lineHeight: 1.2, margin: 0, letterSpacing: '-0.02em', color: '#fff', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', textShadow: '0 2px 20px rgba(0,0,0,0.7)' }}>
          {item.title}
        </h2>
      </div>
    </a>
  )
}

// ── Secondary card ────────────────────────────────────────────────────────────
function SecCard({ item }: { item: NewsItem }) {
  const c = SRC[item.source] ?? '#6b7280'
  const [imgFailed, setImgFailed] = useState(false)
  return (
    <a href={goLink(item.link, 'secondary')} target="_blank" rel="noopener noreferrer"
      style={{ display: 'block', textDecoration: 'none', borderRadius: 13, overflow: 'hidden', position: 'relative', aspectRatio: '16/9' }}
      className="sec-card"
    >
      <div style={{ position: 'absolute', inset: 0 }}>
        {item.imageUrl && !imgFailed
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={item.imageUrl} alt={item.title} loading="lazy" decoding="async"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImgFailed(true)} />
          : <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${c}40 0%, ${T.bg2} 65%, ${T.bg} 100%)` }} />
        }
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(4,4,15,0.97) 0%, rgba(4,4,15,0.3) 55%, transparent 100%)' }} />
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
          <span style={{ fontSize: 8.5, fontWeight: 900, color: c, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{item.source}</span>
          <CatBadge cat={item.category} />
        </div>
        <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.3, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textShadow: '0 1px 12px rgba(0,0,0,0.9)' }}>
          {item.title}
        </p>
      </div>
    </a>
  )
}

// ── News row — larger mobile-optimised ───────────────────────────────────────
function NewsRow({ item, idx }: { item: NewsItem; idx: number }) {
  const c = SRC[item.source] ?? '#6b7280'
  const [imgFailed, setImgFailed] = useState(false)
  return (
    <a
      href={goLink(item.link, 'news-list')} target="_blank" rel="noopener noreferrer"
      className="news-row-link"
      style={{ display: 'flex', gap: 13, textDecoration: 'none', borderRadius: 12, padding: '12px 13px', background: 'rgba(255,255,255,0.022)', border: `1px solid ${T.border}`, alignItems: 'flex-start' }}
    >
      <div style={{ flex: 1, minWidth: 0, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <span style={{ flexShrink: 0, fontSize: 13, fontWeight: 900, color: idx < 3 ? T.gold : T.dim, minWidth: 20, textAlign: 'right', paddingTop: 2, fontFamily: "'Newsreader', Georgia, serif" }}>{idx + 1}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 14, fontWeight: 650, color: T.text, lineHeight: 1.4, margin: '0 0 7px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {item.title}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
            <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: `${c}16`, color: c, border: `1px solid ${c}26` }}>{item.source}</span>
            <CatBadge cat={item.category} />
            <span style={{ fontSize: 10, color: T.muted, display: 'flex', alignItems: 'center', gap: 2, marginLeft: 'auto' }}>
              <Clock style={{ width: 8, height: 8 }} />{item.timeAgo}
            </span>
          </div>
        </div>
      </div>
      <div className="news-thumb" style={{ flexShrink: 0, width: 84, height: 64, borderRadius: 10, overflow: 'hidden', background: `${c}12`, position: 'relative' }}>
        {item.imageUrl && !imgFailed
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={item.imageUrl} alt="" loading="lazy" decoding="async"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={() => setImgFailed(true)} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Newspaper style={{ width: 18, height: 18, color: `${c}45` }} />
            </div>
        }
      </div>
    </a>
  )
}

// ── Trending row ──────────────────────────────────────────────────────────────
function TrendRow({ item, rank }: { item: NewsItem; rank: number }) {
  const c = SRC[item.source] ?? '#6b7280'
  return (
    <a href={goLink(item.link, 'trending')} target="_blank" rel="noopener noreferrer"
      style={{ display: 'flex', gap: 11, textDecoration: 'none', padding: '10px 0', borderBottom: `1px solid ${T.border}`, alignItems: 'flex-start' }}
    >
      <span style={{ flexShrink: 0, fontSize: 14, fontWeight: 900, color: rank <= 3 ? T.gold : 'rgba(255,255,255,0.1)', width: 22, textAlign: 'right', paddingTop: 1, fontFamily: "'Newsreader', Georgia, serif" }}>{rank}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,0.8)', lineHeight: 1.35, margin: '0 0 4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.title}</p>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: c, opacity: 0.85 }}>{item.source}</span>
          <span style={{ fontSize: 9, color: T.muted }}>{item.timeAgo}</span>
        </div>
      </div>
    </a>
  )
}

// ── Cinema card ───────────────────────────────────────────────────────────────
function CinemaCard({ movie }: { movie: (typeof CINEMA)[0] }) {
  const rc = ratingColor(movie.rating)
  const platform = movie.streamingOn?.[0]
  const ottColor = platform ? (OTT_C[platform] ?? '#6b7280') : null
  const isOtt = movie.ottDate && movie.ottDate !== 'Coming Soon'
  const [imgFailed, setImgFailed] = useState(false)
  const hasThumbnail = movie.thumbnail && !imgFailed && !movie.thumbnail.includes('default.jpg') && !movie.thumbnail.includes('goat-vijay')

  return (
    <div className="cinema-card-wrap">
      <Link href={`/movies/${movie.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
        <div style={{ borderRadius: 12, overflow: 'hidden', background: T.surface, border: `1px solid ${T.border}` }}>
          <div style={{ aspectRatio: '2/3', position: 'relative', overflow: 'hidden' }}>
            {hasThumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={movie.thumbnail} alt={movie.title} loading="lazy" decoding="async"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={() => setImgFailed(true)} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: `linear-gradient(160deg, ${rc}40 0%, ${T.bg2} 55%, ${T.bg} 100%)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${rc}18`, border: `1px solid ${rc}35`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Play style={{ width: 16, height: 16, color: `${rc}80` }} />
                </div>
                <span style={{ fontSize: 8, color: `${rc}70`, letterSpacing: '0.07em', textTransform: 'uppercase' }}>{movie.genre?.[0]}</span>
              </div>
            )}
            {movie.rating > 0 && (
              <div style={{ position: 'absolute', top: 7, left: 7, display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(0,0,0,0.82)', borderRadius: 6, padding: '3px 7px' }}>
                <Star style={{ width: 8, height: 8, color: rc, fill: rc }} />
                <span style={{ fontSize: 9.5, fontWeight: 900, color: rc }}>{movie.rating.toFixed(1)}</span>
              </div>
            )}
            {isOtt && ottColor && (
              <div style={{ position: 'absolute', top: 7, right: 7, fontSize: 7.5, fontWeight: 900, padding: '2px 6px', borderRadius: 4, background: `${ottColor}22`, color: ottColor, border: `1px solid ${ottColor}45`, maxWidth: 58, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {platform}
              </div>
            )}
          </div>
          <div style={{ padding: '8px 9px 10px' }}>
            <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 11, fontWeight: 700, color: T.text, lineHeight: 1.3, margin: '0 0 3px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{movie.title}</p>
            <p style={{ fontSize: 8.5, color: T.muted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{movie.cast?.slice(0, 1).join(', ')}</p>
          </div>
        </div>
      </Link>
    </div>
  )
}

// ── OTT tile ──────────────────────────────────────────────────────────────────
function OttTile({ href, label, icon, color, sub }: { href: string; label: string; icon: string; color: string; sub: string }) {
  return (
    <div className="ott-tile-wrap">
      <Link href={href} style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none', padding: '13px 14px', borderRadius: 13, background: `${color}0a`, border: `1px solid ${color}25`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: 50, height: 50, background: `${color}0e`, borderRadius: '0 13px 0 50px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#fff', flexShrink: 0 }}>{icon}</div>
          <span style={{ fontSize: 12, fontWeight: 800, color: T.text }}>{label}</span>
        </div>
        <span style={{ fontSize: 9.5, color: T.muted, paddingLeft: 40, lineHeight: 1.3 }}>{sub}</span>
      </Link>
    </div>
  )
}

function Skel({ h = 60, radius = 10 }: { h?: number; radius?: number }) {
  return <div style={{ height: h, borderRadius: radius, background: 'rgba(255,255,255,0.035)', animation: 'shimmer 1.8s ease-in-out infinite' }} />
}

const TVK_PROMO: NewsItem = {
  title: 'Thalapathy Vijay — TVK கட்சி | Tamil Nadu CM Race 2026',
  desc: 'வெற்றி கழகம் தலைவர் விஜய், 2026 தமிழ்நாடு சட்டமன்ற தேர்தலில் ஆட்சி அமைக்க தயாராகிறார்.',
  link: 'https://en.wikipedia.org/wiki/Tamilaga_Vettri_Kazhagam',
  source: 'NammaTamil.tv', sourceLogo: '', pubDate: new Date().toISOString(),
  timeAgo: 'pinned', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Vijay_at_CWC_2011.jpg/800px-Vijay_at_CWC_2011.jpg',
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
    if (manual) {
      setRefresh(true)
    } else {
      try {
        const ss = sessionStorage.getItem(SS_KEY)
        if (ss) {
          const { d, at } = JSON.parse(ss)
          if (Date.now() - at < CACHE_TTL) { setData(d); setLoading(false); return }
        }
      } catch { /* ignore */ }
      try {
        const ls = localStorage.getItem(LS_KEY)
        if (ls) {
          const { d, at } = JSON.parse(ls)
          if (Date.now() - at < LS_CACHE_TTL) { setData(d); setLoading(false) }
        }
      } catch { /* ignore */ }
    }
    try {
      const res = await fetch('/api/tamil-media-news', { cache: 'no-store', signal: AbortSignal.timeout(12000) })
      if (!res.ok) return
      const json: ApiResponse = await res.json()
      setData(json); setSecAgo(0); setShowMore(false); setHeroIdx(0)
      const payload = JSON.stringify({ d: json, at: Date.now() })
      try { sessionStorage.setItem(SS_KEY, payload) } catch { /* ignore */ }
      try { localStorage.setItem(LS_KEY, payload) } catch { /* ignore */ }
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

  const listStart = filtered.length >= 3 ? 3 : filtered.length >= 1 ? 1 : 0
  const listItems = showMore ? filtered.slice(listStart) : filtered.slice(listStart, listStart + 18)
  const freshLabel = secAgo < 60 ? `${secAgo}s ago` : `${Math.floor(secAgo / 60)}m ago`

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, position: 'relative', isolation: 'isolate' }}>

      {/* ── Subtle dot grid ──────────────────────────────────────────────────── */}
      <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '36px 36px' }} />

      {/* ── Brand glow blobs ─────────────────────────────────────────────────── */}
      <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: [
          'radial-gradient(ellipse 60% 40% at 8% 15%, rgba(245,158,11,0.14) 0%, transparent 55%)',
          'radial-gradient(ellipse 50% 40% at 92% 85%, rgba(220,38,38,0.10) 0%, transparent 50%)',
          'radial-gradient(ellipse 40% 30% at 65% 0%,  rgba(167,139,250,0.07) 0%, transparent 45%)',
        ].join(', ') }} />

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ── Ticker ───────────────────────────────────────────────────────────── */}
        {!loading && <Ticker items={all} />}

        {/* ── Category nav ─────────────────────────────────────────────────────── */}
        <div style={{ background: 'rgba(4,4,15,0.94)', borderBottom: `1px solid ${T.border}`, position: 'sticky', top: 56, zIndex: 40, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', scrollbarWidth: 'none', gap: 5, padding: '10px 0' }}>
              {CATS.map(cat => {
                const active = category === cat.key
                const Ic = cat.icon
                return (
                  <button key={cat.key}
                    onClick={() => { setCat(cat.key as typeof category); setShowMore(false) }}
                    style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', fontSize: 12, fontWeight: active ? 800 : 500, color: active ? cat.color : 'rgba(255,255,255,0.38)', background: active ? `${cat.color}1a` : 'rgba(255,255,255,0.025)', border: active ? `1px solid ${cat.color}40` : '1px solid rgba(255,255,255,0.06)', borderRadius: 9999, cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: active ? `0 0 16px ${cat.color}20` : 'none', transition: 'background 0.12s, color 0.12s, border-color 0.12s' }}
                  >
                    <Ic style={{ width: 12, height: 12 }} />
                    {cat.label}
                    {'badge' in cat && cat.badge && (
                      <span style={{ fontSize: 8, fontWeight: 900, padding: '1px 5px', borderRadius: 3, background: T.red, color: '#fff', letterSpacing: '0.05em' }}>{cat.badge}</span>
                    )}
                  </button>
                )
              })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0, padding: '10px 0' }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', whiteSpace: 'nowrap' }}>{refreshing ? 'Refreshing…' : freshLabel}</span>
              <button onClick={() => fetchNews(true)} disabled={refreshing}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.22)', padding: 3, lineHeight: 0 }}>
                <RefreshCw style={{ width: 11, height: 11, animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              </button>
              <VisitorCounter />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto nt-pad">

          {/* ════════════════════════════════════════════════════════════════════
              TOP GRID — hero left · trending sidebar right
              ════════════════════════════════════════════════════════════════════ */}
          <div className="top-section" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginBottom: 18 }}>

            {/* Hero + 2 secondary cards */}
            <div>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  <Skel h={240} radius={18} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
                    <Skel h={130} radius={13} /><Skel h={130} radius={13} />
                  </div>
                </div>
              ) : heroItem ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {/* Dot indicators */}
                  {heroPool.length > 1 && (
                    <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end', alignItems: 'center' }}>
                      {heroPool.map((_, i) => (
                        <button key={i} onClick={() => setHeroIdx(i)}
                          style={{ width: i === heroIdx ? 22 : 5, height: 4, borderRadius: 99, background: i === heroIdx ? T.crimson : 'rgba(255,255,255,0.14)', border: 'none', cursor: 'pointer', padding: 0, transition: 'width 0.3s ease, background 0.3s ease' }} />
                      ))}
                    </div>
                  )}
                  <AnimatePresence mode="wait">
                    <motion.div key={heroItem.link} initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
                      <HeroCard item={heroItem} />
                    </motion.div>
                  </AnimatePresence>
                  <div className="sec-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
                    {filtered.slice(1, 3).map((it, i) => <SecCard key={i} item={it} />)}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Trending sidebar — desktop */}
            <div className="trend-aside" style={{ display: 'none' }}>
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: '16px 15px 12px', position: 'sticky', top: 106 }}>
                <SH label="Trending" color={T.gold} icon={TrendingUp} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {loading
                    ? Array.from({ length: 8 }).map((_, i) => <Skel key={i} h={46} radius={5} />)
                    : trending.slice(0, 10).map((it, i) => <TrendRow key={i} item={it} rank={i + 1} />)
                  }
                </div>
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════════
              CINEMA STRIP
              ════════════════════════════════════════════════════════════════════ */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 18, padding: '18px 18px 20px', marginBottom: 18 }}>
            <SH label="Cinema" color={T.purple} href="/movies" sub="Tamil releases 2024–2026" icon={Film} />
            <div className="cinema-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {CINEMA.map((movie) => <CinemaCard key={movie.id} movie={movie} />)}
            </div>
            <div className="cinema-scroll" style={{ display: 'none', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
              {CINEMA.map((movie) => (
                <div key={movie.id} style={{ flexShrink: 0, width: 110 }}>
                  <CinemaCard movie={movie} />
                </div>
              ))}
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════════
              OTT PLATFORMS
              ════════════════════════════════════════════════════════════════════ */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 18, padding: '18px 18px 20px', marginBottom: 18 }}>
            <SH label="Watch on OTT" color={T.blue} href="/ott-plans" sub="Stream Tamil content anywhere" icon={Tv2} />
            <div className="ott-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 12 }}>
              {OTT_PLATFORMS.map(p => <OttTile key={p.label} {...p} />)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
              <Link href="/movies" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, textDecoration: 'none', fontSize: 12, fontWeight: 700, color: T.muted, padding: '11px 0', borderRadius: 10, background: 'rgba(255,255,255,0.035)', border: `1px solid ${T.border2}` }}>
                <Film style={{ width: 12, height: 12 }} /> Tamil Movies
              </Link>
              <Link href="/serials" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, textDecoration: 'none', fontSize: 12, fontWeight: 700, color: T.muted, padding: '11px 0', borderRadius: 10, background: 'rgba(255,255,255,0.035)', border: `1px solid ${T.border2}` }}>
                <Tv2 style={{ width: 12, height: 12 }} /> Tamil Serials
              </Link>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════════
              NEWS FEED + SIDEBAR
              ════════════════════════════════════════════════════════════════════ */}
          <div className="lower-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>

            {/* News list */}
            <div>
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: '18px 16px' }}>
                <SH label={category === 'all' ? 'Latest News' : CATS.find(c => c.key === category)?.label ?? 'News'} color={T.red} icon={Newspaper} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {loading
                    ? Array.from({ length: 8 }).map((_, i) => <Skel key={i} h={78} />)
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
                </div>
                {!loading && filtered.length > listStart + 18 && (
                  <button onClick={() => setShowMore(s => !s)}
                    style={{ marginTop: 16, width: '100%', padding: '12px 0', borderRadius: 11, background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border2}`, color: T.muted, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                    {showMore ? <><ChevronLeft style={{ width: 13, height: 13 }} /> Show Less</> : <>{`Load ${filtered.length - listStart - 18} More`} <ChevronRight style={{ width: 13, height: 13 }} /></>}
                  </button>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="sidebar-col" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: '16px 14px' }}>
                <SH label="IPL 2025 Live" color={T.green} sub="Live scores & updates" />
                <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${T.border}` }}>
                  <CricketWidget compact />
                </div>
              </div>
              <div className="trend-mobile">
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: '16px 14px' }}>
                  <SH label="Trending" color={T.gold} icon={TrendingUp} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {loading
                      ? Array.from({ length: 6 }).map((_, i) => <Skel key={i} h={46} radius={5} />)
                      : trending.slice(0, 8).map((it, i) => <TrendRow key={i} item={it} rank={i + 1} />)
                    }
                  </div>
                </div>
              </div>
              <AdUnit size="rectangle" />
            </div>

          </div>
        </div>

        <TVKSpotlight />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
          <AdUnit size="banner" />
        </div>

        <style>{`
          @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
          @keyframes ping    { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(1.6)} }
          @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
          @keyframes shimmer { 0%{opacity:0.35} 50%{opacity:0.7} 100%{opacity:0.35} }

          /* ── Padding ─────────────────────────────────── */
          .nt-pad { padding: 18px 16px; }
          @media (min-width: 640px) { .nt-pad { padding: 22px 24px; } }
          @media (min-width: 1024px) { .nt-pad { padding: 24px 32px; } }

          /* ── Desktop 2-col top section ───────────────── */
          @media (min-width: 960px) {
            .top-section { grid-template-columns: 1fr 300px !important; align-items: start; }
            .trend-aside  { display: block !important; }
            .trend-mobile { display: none !important; }
          }

          /* ── Cinema ──────────────────────────────────── */
          @media (min-width: 960px)  { .cinema-grid { grid-template-columns: repeat(10, 1fr) !important; } .cinema-scroll { display: none !important; } }
          @media (min-width: 640px) and (max-width: 959px) { .cinema-grid { grid-template-columns: repeat(5, 1fr) !important; } .cinema-scroll { display: none !important; } }
          @media (max-width: 639px)  { .cinema-grid { display: none !important; } .cinema-scroll { display: flex !important; } }

          /* ── OTT ─────────────────────────────────────── */
          @media (min-width: 960px)  { .ott-grid { grid-template-columns: repeat(6, 1fr) !important; } }
          @media (min-width: 640px) and (max-width: 959px) { .ott-grid { grid-template-columns: repeat(3, 1fr) !important; } }

          /* ── Lower grid ──────────────────────────────── */
          @media (min-width: 960px) { .lower-grid { grid-template-columns: 1fr 300px !important; align-items: start; } }

          /* ── Card hovers ─────────────────────────────── */
          .hero-card { transition: transform 0.22s cubic-bezier(.23,1,.32,1); }
          .hero-card:hover { transform: scale(1.008); }
          .sec-card  { transition: transform 0.18s cubic-bezier(.23,1,.32,1); }
          .sec-card:hover  { transform: scale(1.018); }
          .cinema-card-wrap { transition: transform 0.18s ease, box-shadow 0.18s ease; }
          .cinema-card-wrap:hover { transform: translateY(-4px); box-shadow: 0 14px 36px rgba(0,0,0,0.6); }
          .ott-tile-wrap { transition: transform 0.14s ease; }
          .ott-tile-wrap:hover  { transform: scale(1.025) translateY(-2px); }
          .ott-tile-wrap:active { transform: scale(0.97); }
          .news-row-link { transition: background 0.12s ease; }
          .news-row-link:hover { background: rgba(255,255,255,0.042) !important; }

          /* ── Narrow mobile tweaks ────────────────────── */
          @media (max-width: 380px) {
            .sec-row { grid-template-columns: 1fr !important; }
            .news-thumb { width: 68px !important; height: 52px !important; }
          }
        `}</style>
      </div>
    </div>
  )
}
