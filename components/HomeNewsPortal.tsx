'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RefreshCw, Newspaper, TrendingUp, Tv2, Film,
  Play, Trophy, Radio, Clock, Flame, Zap, Star,
  ChevronRight, ChevronLeft,
} from 'lucide-react'
import { goLink } from '@/lib/goLink'
import CricketWidget from '@/components/CricketWidget'
import AdUnit from '@/components/AdUnit'
import VisitorCounter from '@/components/VisitorCounter'
import TVKSpotlight from '@/components/TVKSpotlight'
import { movies } from '@/data/movies'

// ── Daily accent rotation (coral Mon/Thu, amber Tue/Fri, teal Wed/Sat/Sun) ────
const DAY = new Date().getDay()
const ACCENT = DAY === 1 || DAY === 4
  ? '#f5a623'
  : DAY === 2 || DAY === 5
  ? '#14b8a6'
  : '#f04747'

const ACCENT_NAME = DAY === 1 || DAY === 4 ? 'amber' : DAY === 2 || DAY === 5 ? 'teal' : 'coral'

// ── Tokens ────────────────────────────────────────────────────────────────────
const T = {
  bg:     '#0f0f13',
  card:   '#16161f',
  card2:  '#1d1d2a',
  border: 'rgba(255,255,255,0.07)',
  bord2:  'rgba(255,255,255,0.13)',
  text:   '#eeedf5',
  sub:    'rgba(238,237,245,0.62)',
  muted:  'rgba(238,237,245,0.38)',
  dim:    'rgba(238,237,245,0.18)',
  accent: ACCENT,
  gold:   '#f5a623',
  purple: '#9c6fe4',
  green:  '#22c55e',
  blue:   '#3b82f6',
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface NewsItem {
  title: string; link: string; source: string; sourceLogo: string
  pubDate: string; timeAgo: string; desc: string; imageUrl: string | null; category: string
}
interface ApiResponse { news: NewsItem[]; updatedAt: string; count: number }

// ── Constants ─────────────────────────────────────────────────────────────────
const REFRESH_MS   = 6 * 60 * 1000
const CACHE_TTL    = 5 * 60 * 1000
const LS_TTL       = 30 * 60 * 1000
const LS_KEY       = 'nt_v5'
const SS_KEY       = 'nt_ss5'
const SPORTS_KW    = ['cricket','ipl','csk','dhoni','match','விளையாட்டு','கிரிக்கெட்']

const SRC: Record<string, string> = {
  'Dinamalar': '#e53935', 'Maalaimalar': '#7c3aed', 'OneIndia Tamil': '#0288d1',
  'The Hindu Tamil': '#1565c0', 'Vikatan': '#e65100', 'Puthiya Thalaimurai': '#c62828',
  'Sun News': '#f5a623', 'Polimer News': '#2e7d32', 'NammaTVK': '#f5a623',
  'Kalaignar News': '#b71c1c', 'Thanthi TV': '#e65100', 'NDTV India': '#b71c1c',
}

const CATS = [
  { key: 'all',      label: 'அனைத்தும்',  icon: Radio,   color: ACCENT },
  { key: 'tvk',      label: 'TVK 2026',   icon: Zap,     color: '#f5a623', badge: 'LIVE' },
  { key: 'politics', label: 'அரசியல்',    icon: Flame,   color: '#f97316' },
  { key: 'cinema',   label: 'சினிமா',     icon: Film,    color: '#9c6fe4' },
  { key: 'sports',   label: 'விளையாட்டு', icon: Trophy,  color: '#22c55e' },
]

const OTT = [
  { href: '/ott-plans', label: 'Netflix',  icon: 'N', color: '#e50914' },
  { href: '/ott-plans', label: 'Prime',    icon: '▶', color: '#00a8e0' },
  { href: '/ott-plans', label: 'Disney+',  icon: '★', color: '#0073e6' },
  { href: '/ott-plans', label: 'ZEE5',     icon: 'Z', color: '#8b5cf6' },
  { href: '/ott-plans', label: 'SunNXT',   icon: '☀', color: '#f5a623' },
  { href: '/ott-plans', label: 'YouTube',  icon: '▷', color: '#ff0000' },
]

const OTT_C: Record<string, string> = {
  'Netflix': '#e50914', 'Amazon Prime': '#00a8e0',
  'Disney+ Hotstar': '#0073e6', 'ZEE5': '#8b5cf6', 'YouTube': '#ff0000',
}

// Only movies with OTT date in last 6 weeks OR Coming Soon — fresh content only
const SIX_WEEKS_AGO = new Date(Date.now() - 42 * 24 * 60 * 60 * 1000)
function isRecentOtt(ottDate: string | undefined): boolean {
  if (!ottDate) return false
  if (ottDate === 'Coming Soon') return true
  // formats: "15 May 2025", "May 2025", "2025"
  try { return new Date(ottDate) >= SIX_WEEKS_AGO } catch { return false }
}

const CINEMA = movies
  .filter(m => m.language === 'Tamil' && (isRecentOtt(m.ottDate) || m.year >= 2025))
  .sort((a, b) => {
    // Coming Soon first, then most recent OTT date, then rating
    const acs = a.ottDate === 'Coming Soon' ? 2 : a.ottDate ? 1 : 0
    const bcs = b.ottDate === 'Coming Soon' ? 2 : b.ottDate ? 1 : 0
    if (bcs !== acs) return bcs - acs
    return b.rating - a.rating
  })
  .slice(0, 12)

function ratingColor(r: number) {
  if (r >= 8) return '#22c55e'; if (r >= 7) return '#f5a623'; if (r >= 6) return '#fb923c'; return '#f87171'
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function Ticker({ items }: { items: NewsItem[] }) {
  if (!items.length) return null
  const heads = items.slice(0, 16).map(n => n.title)
  return (
    <div style={{ background: ACCENT, height: 32, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
      <div style={{ flexShrink: 0, padding: '0 14px', height: '100%', display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.2)', fontSize: 9, fontWeight: 900, color: '#fff', letterSpacing: '0.18em', whiteSpace: 'nowrap' }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff', display: 'inline-block', animation: 'ntPing 1.5s ease-in-out infinite' }} />
        LIVE
      </div>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div style={{ display: 'flex', gap: 48, whiteSpace: 'nowrap', fontSize: 12, color: 'rgba(255,255,255,0.95)', animation: 'ntMarquee 120s linear infinite', paddingLeft: 20 }}>
          {[...heads, ...heads].map((h, i) => (
            <span key={i}><span style={{ fontSize: 5, opacity: 0.6, marginRight: 10 }}>◆</span>{h}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

// Info bar: date + story count + time
function InfoBar({ count }: { count: number }) {
  const now = new Date()
  const TAMIL_DAYS = ['ஞாயிறு','திங்கள்','செவ்வாய்','புதன்','வியாழன்','வெள்ளி','சனி']
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const tDay = TAMIL_DAYS[now.getDay()]
  const dateStr = `${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`
  const h = now.getHours().toString().padStart(2, '0')
  const m = now.getMinutes().toString().padStart(2, '0')
  return (
    <div style={{ background: '#0c0c10', borderBottom: `1px solid ${T.border}`, padding: '5px 0' }}>
      <div className="ntw" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: T.text }}>{tDay} · {dateStr}</span>
        <span style={{ fontSize: 10, color: T.muted }}>{h}:{m} IST · 📍 Chennai</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {count > 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: `${ACCENT}18`, color: ACCENT, border: `1px solid ${ACCENT}35` }}>
              {count} செய்திகள்
            </span>
          )}
          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: T.card2, color: T.muted, border: `1px solid ${T.bord2}`, textTransform: 'capitalize' }}>
            ◉ {ACCENT_NAME}
          </span>
        </div>
      </div>
    </div>
  )
}

// Section heading
function SH({ label, color = ACCENT, href, icon: Icon }: { label: string; color?: string; href?: string; icon?: React.ElementType }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', borderBottom: `2px solid ${color}22`, paddingBottom: 8, marginBottom: 12 }}>
      <div style={{ width: 3, height: 16, borderRadius: 2, background: color, marginRight: 8, flexShrink: 0 }} />
      {Icon && <Icon style={{ width: 11, height: 11, color, marginRight: 5, flexShrink: 0 }} />}
      <span style={{ fontSize: 11, fontWeight: 900, color: T.text, letterSpacing: '0.08em', textTransform: 'uppercase', flex: 1 }}>{label}</span>
      {href && (
        <Link href={href} style={{ fontSize: 10, color: T.muted, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
          More <ChevronRight style={{ width: 9, height: 9 }} />
        </Link>
      )}
    </div>
  )
}

function SrcBadge({ source }: { source: string }) {
  const c = SRC[source] ?? '#555'
  return <span style={{ fontSize: 8.5, fontWeight: 800, padding: '2px 6px', borderRadius: 3, background: c, color: '#fff', whiteSpace: 'nowrap', flexShrink: 0 }}>{source.slice(0, 11)}</span>
}

// Hero — full-bleed image card
function HeroCard({ item }: { item: NewsItem }) {
  const c = SRC[item.source] ?? '#444'
  const [err, setErr] = useState(false)
  return (
    <a href={goLink(item.link, 'hero')} target="_blank" rel="noopener noreferrer"
      className="ntHero"
      style={{ display: 'block', textDecoration: 'none', borderRadius: 10, overflow: 'hidden', position: 'relative', aspectRatio: '16/9', background: `linear-gradient(135deg, ${c}55 0%, #16161f 55%)` }}
    >
      {item.imageUrl && !err && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.imageUrl} alt={item.title} loading="eager" fetchPriority="high" decoding="async"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setErr(true)} />
      )}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.55) 40%, rgba(0,0,0,0.05) 75%)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 14px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8, flexWrap: 'wrap' }}>
          <SrcBadge source={item.source} />
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.42)', display: 'flex', alignItems: 'center', gap: 2, marginLeft: 'auto' }}>
            <Clock style={{ width: 8, height: 8 }} />{item.timeAgo}
          </span>
        </div>
        <h2 style={{ margin: 0, fontSize: 'clamp(15px, 3vw, 22px)', fontWeight: 800, lineHeight: 1.22, color: '#fff', fontFamily: "'Noto Serif', Georgia, serif", display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {item.title}
        </h2>
      </div>
    </a>
  )
}

// Small story card — image top, title below
function SmCard({ item }: { item: NewsItem }) {
  const c = SRC[item.source] ?? '#444'
  const [err, setErr] = useState(false)
  return (
    <a href={goLink(item.link, 'sm')} target="_blank" rel="noopener noreferrer"
      className="ntSmCard"
      style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none', gap: 0 }}
    >
      <div style={{ position: 'relative', aspectRatio: '16/9', borderRadius: 7, overflow: 'hidden', marginBottom: 7, background: `linear-gradient(135deg, ${c}45 0%, ${T.card} 60%)` }}>
        {item.imageUrl && !err && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt="" loading="lazy" decoding="async"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            onError={() => setErr(true)} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 55%)' }} />
        <div style={{ position: 'absolute', bottom: 5, left: 6 }}><SrcBadge source={item.source} /></div>
      </div>
      <p style={{ margin: '0 0 4px', fontSize: 12.5, fontWeight: 700, color: T.text, lineHeight: 1.35, fontFamily: "'Noto Serif', Georgia, serif", display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {item.title}
      </p>
      <span style={{ fontSize: 9.5, color: T.muted, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Clock style={{ width: 7, height: 7 }} />{item.timeAgo}
      </span>
    </a>
  )
}

// News list row
function NewsRow({ item, idx }: { item: NewsItem; idx: number }) {
  const c = SRC[item.source] ?? '#555'
  const [err, setErr] = useState(false)
  return (
    <a href={goLink(item.link, 'row')} target="_blank" rel="noopener noreferrer"
      className="ntRow"
      style={{ display: 'flex', alignItems: 'flex-start', gap: 10, textDecoration: 'none', padding: '9px 12px', borderRadius: 7, marginBottom: 3 }}
    >
      <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 900, color: idx < 3 ? ACCENT : T.dim, width: 18, paddingTop: 2, textAlign: 'right', fontFamily: 'Georgia, serif' }}>{idx + 1}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: '0 0 5px', fontSize: 13.5, fontWeight: 650, color: T.text, lineHeight: 1.4, fontFamily: "'Noto Serif', Georgia, serif", display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {item.title}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: c }}>{item.source}</span>
          {item.category !== 'general' && item.category !== 'all' && (
            <span style={{ fontSize: 8.5, padding: '1px 5px', borderRadius: 3, background: `${c}18`, color: c, border: `1px solid ${c}28` }}>{item.category}</span>
          )}
          <span style={{ fontSize: 9.5, color: T.muted, marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Clock style={{ width: 7, height: 7 }} />{item.timeAgo}
          </span>
        </div>
      </div>
      <div style={{ flexShrink: 0, width: 78, height: 58, borderRadius: 6, overflow: 'hidden', background: `${c}15` }}>
        {item.imageUrl && !err
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={item.imageUrl} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setErr(true)} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Newspaper style={{ width: 14, height: 14, color: `${c}40` }} />
            </div>
        }
      </div>
    </a>
  )
}

// Trending row
function TrendRow({ item, rank }: { item: NewsItem; rank: number }) {
  const c = SRC[item.source] ?? '#555'
  return (
    <a href={goLink(item.link, 'trend')} target="_blank" rel="noopener noreferrer"
      className="ntTrow"
      style={{ display: 'flex', gap: 9, textDecoration: 'none', padding: '8px 0', borderBottom: `1px solid ${T.border}`, alignItems: 'flex-start' }}
    >
      <span style={{ flexShrink: 0, fontSize: 13, fontWeight: 900, color: rank <= 3 ? ACCENT : T.dim, width: 20, textAlign: 'right', fontFamily: 'Georgia, serif' }}>{rank}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: T.sub, lineHeight: 1.35, margin: '0 0 3px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.title}</p>
        <span style={{ fontSize: 9, fontWeight: 700, color: c }}>{item.source}</span>
      </div>
    </a>
  )
}

// Cinema poster
function CinemaCard({ movie }: { movie: (typeof CINEMA)[0] }) {
  const rc = ratingColor(movie.rating)
  const platform = movie.streamingOn?.[0]
  const ottColor = platform ? (OTT_C[platform] ?? '#555') : null
  const isOtt = movie.ottDate && movie.ottDate !== 'Coming Soon'
  const [err, setErr] = useState(false)
  const hasThumb = movie.thumbnail && !err && !movie.thumbnail.includes('default.jpg') && !movie.thumbnail.includes('goat-vijay')
  return (
    <div className="ntCcard">
      <Link href={`/movies/${movie.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
        <div style={{ borderRadius: 7, overflow: 'hidden', background: T.card2, border: `1px solid ${T.border}` }}>
          <div style={{ aspectRatio: '2/3', position: 'relative', overflow: 'hidden' }}>
            {hasThumb
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={movie.thumbnail} alt={movie.title} loading="lazy" decoding="async"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={() => setErr(true)} />
              : <div style={{ width: '100%', height: '100%', background: `linear-gradient(160deg, ${rc}30 0%, ${T.card2} 55%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Play style={{ width: 18, height: 18, color: `${rc}50` }} />
                </div>
            }
            {movie.rating > 0 && (
              <div style={{ position: 'absolute', top: 4, left: 4, display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(0,0,0,0.8)', borderRadius: 3, padding: '2px 5px' }}>
                <Star style={{ width: 7, height: 7, color: rc, fill: rc }} />
                <span style={{ fontSize: 8.5, fontWeight: 900, color: rc }}>{movie.rating.toFixed(1)}</span>
              </div>
            )}
            {isOtt && ottColor && (
              <div style={{ position: 'absolute', top: 4, right: 4, fontSize: 7, fontWeight: 900, padding: '2px 5px', borderRadius: 3, background: ottColor, color: '#fff', maxWidth: 50, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {platform}
              </div>
            )}
          </div>
          <div style={{ padding: '5px 7px 7px' }}>
            <p style={{ fontSize: 10.5, fontWeight: 700, color: T.text, lineHeight: 1.28, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontFamily: "'Noto Serif', Georgia, serif" }}>{movie.title}</p>
          </div>
        </div>
      </Link>
    </div>
  )
}

// OTT chip
function OttChip({ href, label, icon, color }: { href: string; label: string; icon: string; color: string }) {
  return (
    <Link href={href} className="ntOtt"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 7, textDecoration: 'none', padding: '7px 13px', borderRadius: 99, background: T.card2, border: `1px solid ${T.bord2}` }}>
      <div style={{ width: 20, height: 20, borderRadius: 5, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: '#fff', flexShrink: 0 }}>{icon}</div>
      <span style={{ fontSize: 11.5, fontWeight: 700, color: T.text, whiteSpace: 'nowrap' }}>{label}</span>
    </Link>
  )
}

function Skel({ h = 50, r = 6 }: { h?: number; r?: number }) {
  return <div style={{ height: h, borderRadius: r, background: 'rgba(255,255,255,0.05)', animation: 'ntShimmer 1.6s ease-in-out infinite' }} />
}

const TVK_PROMO: NewsItem = {
  title: 'Thalapathy Vijay — TVK கட்சி | Tamil Nadu CM Race 2026',
  desc: '', link: 'https://en.wikipedia.org/wiki/Tamilaga_Vettri_Kazhagam',
  source: 'NammaTamil.tv', sourceLogo: '', pubDate: new Date().toISOString(), timeAgo: 'pinned',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Vijay_at_CWC_2011.jpg/800px-Vijay_at_CWC_2011.jpg',
  category: 'tvk',
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
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
      try { const ss = sessionStorage.getItem(SS_KEY); if (ss) { const { d, at } = JSON.parse(ss); if (Date.now() - at < CACHE_TTL) { setData(d); setLoading(false); return } } } catch { /**/ }
      try { const ls = localStorage.getItem(LS_KEY); if (ls) { const { d, at } = JSON.parse(ls); if (Date.now() - at < LS_TTL) { setData(d); setLoading(false) } } } catch { /**/ }
    }
    try {
      const res = await fetch('/api/tamil-media-news', { cache: 'no-store', signal: AbortSignal.timeout(12000) })
      if (!res.ok) return
      const json: ApiResponse = await res.json()
      setData(json); setSecAgo(0); setShowMore(false); setHeroIdx(0)
      const p = JSON.stringify({ d: json, at: Date.now() })
      try { sessionStorage.setItem(SS_KEY, p) } catch { /**/ }
      try { localStorage.setItem(LS_KEY, p) } catch { /**/ }
    } catch { /**/ }
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

      {/* TICKER */}
      {!loading && <Ticker items={all} />}

      {/* CATEGORY NAV */}
      <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, position: 'sticky', top: 56, zIndex: 40, backdropFilter: 'blur(12px)' }}>
        <div className="ntw" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', overflowX: 'auto', scrollbarWidth: 'none', gap: 3, padding: '9px 0' }}>
            {CATS.map(cat => {
              const active = category === cat.key
              const Ic = cat.icon
              return (
                <button key={cat.key} onClick={() => { setCat(cat.key as typeof category); setShowMore(false) }}
                  style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', fontSize: 12, fontWeight: active ? 800 : 500, color: active ? '#fff' : T.muted, background: active ? cat.color : 'transparent', border: `1px solid ${active ? 'transparent' : T.border}`, borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.12s' }}>
                  <Ic style={{ width: 11, height: 11 }} />
                  {cat.label}
                  {'badge' in cat && cat.badge && <span style={{ fontSize: 7.5, fontWeight: 900, padding: '1px 4px', borderRadius: 2, background: 'rgba(255,255,255,0.2)', color: '#fff' }}>{cat.badge}</span>}
                </button>
              )
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 9.5, color: T.dim }}>{refreshing ? '…' : freshLabel}</span>
            <button onClick={() => fetchNews(true)} disabled={refreshing}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.dim, padding: 3, lineHeight: 0 }}>
              <RefreshCw style={{ width: 11, height: 11, animation: refreshing ? 'ntSpin 1s linear infinite' : 'none' }} />
            </button>
            <VisitorCounter />
          </div>
        </div>
      </div>

      {/* INFO BAR */}
      <InfoBar count={all.length} />

      {/* MAIN CONTENT */}
      <div className="ntw" style={{ paddingTop: 16, paddingBottom: 8 }}>

        {/* ── TOP SECTION ──────────────────────────────────────────────────── */}
        {/* Mobile: hero full width → 2 cards below (all above fold) */}
        {/* Desktop: hero (2fr) | 2 story cards (1fr) | trending (1fr) */}

        {loading ? (
          <div style={{ marginBottom: 18 }}>
            <Skel h={240} r={10} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
              <Skel h={120} /><Skel h={120} />
            </div>
          </div>
        ) : heroItem ? (
          <div className="ntTopGrid" style={{ marginBottom: 18 }}>

            {/* Hero */}
            <div className="ntHeroCol">
              {heroPool.length > 1 && (
                <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', marginBottom: 5 }}>
                  {heroPool.map((_, i) => (
                    <button key={i} onClick={() => setHeroIdx(i)}
                      style={{ width: i === heroIdx ? 20 : 4, height: 4, borderRadius: 99, background: i === heroIdx ? ACCENT : 'rgba(255,255,255,0.14)', border: 'none', cursor: 'pointer', padding: 0, transition: 'width 0.25s ease' }} />
                  ))}
                </div>
              )}
              <AnimatePresence mode="wait">
                <motion.div key={heroItem.link} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.28 }}>
                  <HeroCard item={heroItem} />
                </motion.div>
              </AnimatePresence>
              {/* Mobile only: 2 story cards below hero */}
              <div className="ntMobCards" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                {filtered.slice(1, 3).map((it, i) => <SmCard key={i} item={it} />)}
              </div>
            </div>

            {/* Desktop: story stack */}
            <div className="ntStoryCol" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.slice(1, 3).map((it, i) => <SmCard key={i} item={it} />)}
            </div>

            {/* Desktop: trending */}
            <div className="ntTrendCol">
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 14px 10px', position: 'sticky', top: 108 }}>
                <SH label="Trending" color={T.gold} icon={TrendingUp} />
                {trending.slice(0, 10).map((it, i) => <TrendRow key={i} item={it} rank={i + 1} />)}
              </div>
            </div>

          </div>
        ) : null}

        {/* ── CINEMA ────────────────────────────────────────────────────────── */}
        <div style={{ background: `linear-gradient(135deg, rgba(109,40,217,0.1) 0%, ${T.card} 60%)`, border: `1px solid rgba(109,40,217,0.18)`, borderRadius: 10, padding: '12px 12px 14px', marginBottom: 14 }}>
          <SH label="சினிமா" color={T.purple} href="/movies" icon={Film} />
          <div className="ntCmGrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
            {CINEMA.map(m => <CinemaCard key={m.id} movie={m} />)}
          </div>
          <div className="ntCmScroll" style={{ display: 'none', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
            {CINEMA.map(m => <div key={m.id} style={{ flexShrink: 0, width: 95 }}><CinemaCard movie={m} /></div>)}
          </div>
        </div>

        {/* ── OTT ──────────────────────────────────────────────────────────── */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 12px 14px', marginBottom: 14 }}>
          <SH label="OTT Platforms" color={T.blue} href="/ott-plans" icon={Tv2} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
            {OTT.map(p => <OttChip key={p.label} {...p} />)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
            <Link href="/movies" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, textDecoration: 'none', fontSize: 11.5, fontWeight: 700, color: T.muted, padding: '8px 0', borderRadius: 7, background: T.card2, border: `1px solid ${T.bord2}` }}>
              <Film style={{ width: 10, height: 10 }} /> Tamil Movies
            </Link>
            <Link href="/serials" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, textDecoration: 'none', fontSize: 11.5, fontWeight: 700, color: T.muted, padding: '8px 0', borderRadius: 7, background: T.card2, border: `1px solid ${T.bord2}` }}>
              <Tv2 style={{ width: 10, height: 10 }} /> Tamil Serials
            </Link>
          </div>
        </div>

        {/* ── NEWS FEED + SIDEBAR ───────────────────────────────────────────── */}
        <div className="ntLowGrid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>

          {/* News list */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 4px 10px' }}>
            <div style={{ padding: '0 10px' }}>
              <SH label={category === 'all' ? 'Latest News' : CATS.find(c => c.key === category)?.label ?? 'News'} color={ACCENT} icon={Newspaper} />
            </div>
            {loading
              ? <div style={{ padding: '0 10px' }}>{Array.from({ length: 8 }).map((_, i) => <Skel key={i} h={64} r={4} />)}</div>
              : listItems.map((item, i) => (
                <div key={i}>
                  <NewsRow item={item} idx={i} />
                  {(i + 1) % 6 === 0 && (
                    <ins className="adsbygoogle" style={{ display: 'block', margin: '4px 12px' }}
                      data-ad-format="fluid" data-ad-layout-key="-fb+5w+4e-db+86"
                      data-ad-client="ca-pub-4237294630161176" data-ad-slot="auto" />
                  )}
                </div>
              ))
            }
            {!loading && filtered.length > listStart + 20 && (
              <div style={{ padding: '8px 12px 2px' }}>
                <button onClick={() => setShowMore(s => !s)}
                  style={{ width: '100%', padding: '9px 0', borderRadius: 7, background: T.card2, border: `1px solid ${T.bord2}`, color: T.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {showMore ? <><ChevronLeft style={{ width: 12, height: 12 }} /> Show less</> : <>Load more <ChevronRight style={{ width: 12, height: 12 }} /></>}
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="ntSide" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 10px' }}>
              <SH label="IPL Live" color={T.green} />
              <div style={{ borderRadius: 7, overflow: 'hidden', border: `1px solid ${T.border}` }}>
                <CricketWidget compact />
              </div>
            </div>
            {/* Mobile: trending here */}
            <div className="ntTrendMob">
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 10px' }}>
                <SH label="Trending" color={T.gold} icon={TrendingUp} />
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => <Skel key={i} h={42} r={4} />)
                  : trending.slice(0, 7).map((it, i) => <TrendRow key={i} item={it} rank={i + 1} />)
                }
              </div>
            </div>
            <AdUnit size="rectangle" />
          </div>

        </div>
      </div>

      <TVKSpotlight />

      <div className="ntw" style={{ paddingBottom: 28 }}>
        <AdUnit size="banner" />
      </div>

      <style>{`
        @keyframes ntMarquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes ntPing    { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(1.5)} }
        @keyframes ntSpin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes ntShimmer { 0%{opacity:0.3} 50%{opacity:0.65} 100%{opacity:0.3} }

        /* wrapper */
        .ntw { max-width:1280px; margin:0 auto; padding-left:14px; padding-right:14px; }
        @media(min-width:640px)  { .ntw { padding-left:20px; padding-right:20px; } }
        @media(min-width:1024px) { .ntw { padding-left:28px; padding-right:28px; } }

        /* top grid — mobile: single col, desktop: hero|stories|trending */
        .ntTopGrid  { display:block; }
        .ntStoryCol { display:none; }
        .ntTrendCol { display:none; }
        .ntMobCards { display:grid; }
        .ntTrendMob { display:block; }
        @media(min-width:960px) {
          .ntTopGrid  { display:grid; grid-template-columns:2fr 1fr 1fr; gap:14px; align-items:start; }
          .ntHeroCol  { display:flex; flex-direction:column; }
          .ntStoryCol { display:flex !important; }
          .ntTrendCol { display:block !important; }
          .ntMobCards { display:none !important; }
          .ntTrendMob { display:none !important; }
        }

        /* cinema */
        @media(min-width:960px)  { .ntCmGrid { grid-template-columns:repeat(12,1fr) !important; } .ntCmScroll { display:none !important; } }
        @media(min-width:600px) and (max-width:959px) { .ntCmGrid { grid-template-columns:repeat(6,1fr) !important; } .ntCmScroll { display:none !important; } }
        @media(max-width:599px)  { .ntCmGrid { display:none !important; } .ntCmScroll { display:flex !important; } }

        /* lower grid */
        @media(min-width:960px) { .ntLowGrid { grid-template-columns:1fr 280px !important; align-items:start; } }

        /* hovers */
        .ntHero   { transition:transform 0.2s cubic-bezier(.23,1,.32,1); }
        .ntHero:hover { transform:scale(1.006); }
        .ntSmCard { transition:opacity 0.15s; }
        .ntSmCard:hover { opacity:0.78; }
        .ntRow    { transition:background 0.1s; }
        .ntRow:hover { background:rgba(255,255,255,0.04); }
        .ntTrow   { transition:background 0.1s; }
        .ntTrow:hover { background:rgba(255,255,255,0.03); }
        .ntCcard  { transition:transform 0.15s ease; }
        .ntCcard:hover { transform:translateY(-3px); }
        .ntOtt    { transition:opacity 0.12s; }
        .ntOtt:hover { opacity:0.75; }
      `}</style>
    </div>
  )
}
