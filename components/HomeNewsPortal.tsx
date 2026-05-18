'use client'

/**
 * NammaTamil Super-App Home
 *
 * Architecture: 5-tab layout — News | Cinema | Serials | Calendar | TVK
 * - Stat bar: live story count, sources active, Tamil date, festival today
 * - Tab 1 NEWS: hero + sidebar grid, stagger-animated feed, source-color borders
 * - Tab 2 CINEMA: poster grid with OTT badges, rating colors, coming-soon strip
 * - Tab 3 SERIALS: channel-grouped cards, ongoing status, episode count
 * - Tab 4 CALENDAR: Tamil date, festivals, upcoming events mini-calendar
 * - Tab 5 TVK: dedicated TVK/political news stream, election focus
 *
 * Design principles:
 * - Source colors = identity (never plain gray)
 * - Gradient fallbacks when no image — keyed to source brand color
 * - Noto Serif Tamil for ALL Tamil script text
 * - Dense but breathable: 6+ stories above fold on 375px mobile
 * - Framer Motion: shared-layout tab pill, stagger lists, scroll-reveal rows
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import {
  RefreshCw, Newspaper, TrendingUp, Tv2, Film, Play, Trophy,
  Radio, Clock, Flame, Zap, Star, ChevronRight, ArrowUpRight,
  CalendarDays, Sun, Music, Users, Rss,
} from 'lucide-react'
import { goLink } from '@/lib/goLink'
import CricketWidget from '@/components/CricketWidget'
import AdUnit from '@/components/AdUnit'
import VisitorCounter from '@/components/VisitorCounter'
import TVKSpotlight from '@/components/TVKSpotlight'
import { movies } from '@/data/movies'
import { serials } from '@/data/serials'

// ── Daily accent palette ──────────────────────────────────────────────────────
function getDayAccent() {
  const d = new Date().getDay()
  if (d === 0 || d === 3 || d === 6) return { primary: '#e53935', light: '#ff6b6b', name: 'crimson' }
  if (d === 1 || d === 4)            return { primary: '#f59e0b', light: '#fbbf24', name: 'amber'   }
  return                                    { primary: '#0ea5e9', light: '#38bdf8', name: 'sky'     }
}
const ACCENT = getDayAccent()

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:      '#09090f',
  card:    '#111118',
  raised:  '#18181f',
  border:  'rgba(255,255,255,0.06)',
  border2: 'rgba(255,255,255,0.11)',
  text:    '#f0f0f5',
  sub:     'rgba(240,240,245,0.62)',
  muted:   'rgba(240,240,245,0.36)',
  dim:     'rgba(240,240,245,0.16)',
  accent:  ACCENT.primary,
  accentL: ACCENT.light,
  gold:    '#f5a623',
  purple:  '#a855f7',
  green:   '#22c55e',
  teal:    '#14b8a6',
  red:     '#ef4444',
}

// ── Source color map ──────────────────────────────────────────────────────────
const SRC: Record<string, string> = {
  'Dinamalar':           '#e53935',
  'Maalaimalar':         '#7c3aed',
  'OneIndia Tamil':      '#0288d1',
  'The Hindu Tamil':     '#1565c0',
  'Vikatan':             '#e65100',
  'Puthiya Thalaimurai': '#c62828',
  'Sun News':            '#f59e0b',
  'Polimer News':        '#2e7d32',
  'NammaTVK':            '#f59e0b',
  'Kalaignar News':      '#b71c1c',
  'Thanthi TV':          '#e65100',
  'NDTV India':          '#b71c1c',
  'CricBuzz':            '#1b5e20',
  'ESPN Cricinfo':       '#d32f2f',
}

const OTT_C: Record<string, string> = {
  'Netflix': '#e50914', 'Amazon Prime': '#00a8e0',
  'Disney+ Hotstar': '#0073e6', 'ZEE5': '#8b5cf6',
  'YouTube': '#ff0000', 'SunNXT': '#f59e0b',
}

// ── Gradient fallback — never empty ──────────────────────────────────────────
function gradFb(source: string, seed: number): string {
  const c = SRC[source] ?? ACCENT.primary
  const angle = 120 + (seed % 4) * 30
  return `linear-gradient(${angle}deg, ${c}55 0%, #1a1a2e 100%)`
}

// ── Tamil calendar utils ──────────────────────────────────────────────────────
const TAMIL_MONTHS = [
  'சித்திரை','வைகாசி','ஆனி','ஆடி','ஆவணி','புரட்டாசி',
  'ஐப்பசி','கார்த்திகை','மார்கழி','தை','மாசி','பங்குனி',
]
const TAMIL_MONTH_EN = [
  'Chittirai','Vaikasi','Aani','Aadi','Aavani','Purattasi',
  'Aippasi','Karthigai','Margazhi','Thai','Maasi','Panguni',
]
const TAMIL_DAYS = ['ஞாயிறு','திங்கள்','செவ்வாய்','புதன்','வியாழன்','வெள்ளி','சனி']
const FESTIVALS: Array<{ month: number; day: number; name: string; tamil: string; color: string }> = [
  { month: 1,  day: 14, name: 'Thai Pongal',         tamil: 'தை பொங்கல்',         color: '#fbbf24' },
  { month: 4,  day: 13, name: 'Tamil New Year',       tamil: 'தமிழ் புத்தாண்டு',  color: '#f59e0b' },
  { month: 5,  day: 1,  name: 'Labour Day',           tamil: 'தொழிலாளர் தினம்',   color: '#ef4444' },
  { month: 5,  day: 18, name: 'தமிழீழ நினைவு நாள்', tamil: 'Eelam Remembrance',   color: '#f97316' },
  { month: 6,  day: 21, name: 'Vaikasi Visakam',      tamil: 'வைகாசி விசாகம்',    color: '#10b981' },
  { month: 7,  day: 17, name: 'Aadi Perukku',         tamil: 'ஆடி பெருக்கு',      color: '#06b6d4' },
  { month: 8,  day: 15, name: 'Independence Day',     tamil: 'சுதந்திர தினம்',    color: '#f97316' },
  { month: 9,  day: 2,  name: 'Ganesh Chaturthi',     tamil: 'விநாயகர் சதுர்த்தி',color: '#fb923c' },
  { month: 11, day: 1,  name: 'Karthigai Deepam',     tamil: 'கார்த்திகை தீபம்',  color: '#fbbf24' },
  { month: 12, day: 25, name: 'Christmas',            tamil: 'கிறிஸ்மஸ்',         color: '#34d399' },
]

function getTamilDate() {
  const now = new Date()
  const m = now.getMonth() + 1
  const d = now.getDate()
  // approximate Tamil month by Gregorian month (±2 weeks offset)
  const tamilMonthIdx = (m + 9) % 12  // rough approximation
  const festival = FESTIVALS.find(f => f.month === m && f.day === d)
  return {
    day: d, month: m, weekdayIdx: now.getDay(),
    tamilMonth: TAMIL_MONTHS[tamilMonthIdx],
    tamilMonthEn: TAMIL_MONTH_EN[tamilMonthIdx],
    tamilYear: now.getFullYear() + 56,
    festival,
  }
}

// ── Cinema data — only real posters ──────────────────────────────────────────
const _10W = new Date(Date.now() - 70 * 24 * 60 * 60 * 1000)
function hasThumb(m: { thumbnail?: string }) {
  return !!(m.thumbnail && !m.thumbnail.includes('default.jpg') && !m.thumbnail.includes('goat-vijay'))
}
function freshOtt(d?: string) {
  if (!d) return false
  if (d === 'Coming Soon') return true
  try { return new Date(d) >= _10W } catch { return false }
}

const CINEMA_GRID = movies
  .filter(m => m.language === 'Tamil' && hasThumb(m) && (freshOtt(m.ottDate) || m.year >= 2025))
  .sort((a, b) => {
    const as = a.ottDate === 'Coming Soon' ? 2 : freshOtt(a.ottDate) ? 1 : 0
    const bs = b.ottDate === 'Coming Soon' ? 2 : freshOtt(b.ottDate) ? 1 : 0
    if (bs !== as) return bs - as
    return b.rating - a.rating
  })
  .slice(0, 20)

const ALL_CINEMA = movies
  .filter(m => m.language === 'Tamil')
  .sort((a, b) => b.rating - a.rating)
  .slice(0, 40)

function rc(r: number) {
  if (r >= 8) return '#22c55e'; if (r >= 7) return '#f5a623'; if (r >= 6) return '#fb923c'; return '#f87171'
}

// ── News types ────────────────────────────────────────────────────────────────
interface NewsItem {
  title: string; link: string; source: string; sourceLogo: string
  pubDate: string; timeAgo: string; desc: string; imageUrl: string | null; category: string
}
interface ApiResponse { news: NewsItem[]; updatedAt: string; count: number }

const REFRESH_MS   = 6 * 60 * 1000
const CACHE_TTL    = 5 * 60 * 1000
const LS_CACHE_TTL = 10 * 60 * 1000
const LS_KEY       = 'nt_news_ls_v5'
const SS_KEY       = 'nt_news_v7'
const SPORTS_KW    = ['cricket','ipl','csk','dhoni','match','விளையாட்டு','கிரிக்கெட்']

const TVK_PROMO: NewsItem = {
  title: 'Thalapathy Vijay — TVK கட்சி | Tamil Nadu CM Race 2026',
  desc: '', link: 'https://en.wikipedia.org/wiki/Tamilaga_Vettri_Kazhagam',
  source: 'NammaTamil.tv', sourceLogo: '', pubDate: new Date().toISOString(),
  timeAgo: 'pinned',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Vijay_at_CWC_2011.jpg/800px-Vijay_at_CWC_2011.jpg',
  category: 'tvk',
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'news',     label: 'செய்திகள்',  labelEn: 'News',     icon: Newspaper, color: ACCENT.primary },
  { key: 'cinema',   label: 'சினிமா',     labelEn: 'Cinema',   icon: Film,      color: T.purple       },
  { key: 'serials',  label: 'சீரியல்கள்', labelEn: 'Serials',  icon: Tv2,       color: T.teal         },
  { key: 'calendar', label: 'பஞ்சாங்கம்', labelEn: 'Calendar', icon: CalendarDays, color: T.gold      },
  { key: 'tvk',      label: 'TVK 2026',   labelEn: 'TVK',      icon: Zap,       color: '#f59e0b', badge: 'LIVE' },
]

const NEWS_CATS = [
  { key: 'all',      label: 'அனைத்தும்',   icon: Radio,   color: ACCENT.primary },
  { key: 'politics', label: 'அரசியல்',    icon: Flame,   color: '#f97316' },
  { key: 'cinema',   label: 'சினிமா',     icon: Film,    color: T.purple  },
  { key: 'sports',   label: 'விளையாட்டு', icon: Trophy,  color: T.green   },
]

// ── Animation variants ────────────────────────────────────────────────────────
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.048 } } }
const rowVar  = { hidden: { opacity: 0, x: -8 }, visible: { opacity: 1, x: 0, transition: { duration: 0.2, ease: 'easeOut' as const } } }
const fadeIn  = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' as const } } }

// ════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ════════════════════════════════════════════════════════════════════════════

// ── Breaking ticker ───────────────────────────────────────────────────────────
function Ticker({ items }: { items: NewsItem[] }) {
  if (!items.length) return null
  const heads = items.slice(0, 20).map(n => n.title)
  return (
    <div style={{ background: T.accent, overflow: 'hidden', display: 'flex', alignItems: 'center', height: 30, flexShrink: 0 }}>
      <div style={{ flexShrink: 0, padding: '0 14px', height: '100%', display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.25)', fontSize: 8.5, fontWeight: 900, color: '#fff', letterSpacing: '0.2em', whiteSpace: 'nowrap' }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff', display: 'inline-block', animation: 'nt-ping 1.4s ease-in-out infinite' }} />
        LIVE
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 52, whiteSpace: 'nowrap', fontSize: 11.5, fontWeight: 500, color: 'rgba(255,255,255,0.96)', animation: 'nt-marquee 140s linear infinite', paddingLeft: 20 }}>
          {[...heads, ...heads].map((h, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 4, opacity: 0.55 }}>◆</span>{h}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Stat bar — MandiRates-inspired ────────────────────────────────────────────
function StatBar({ newsCount, sourceCount, tamilDate, festival }: {
  newsCount: number; sourceCount: number
  tamilDate: ReturnType<typeof getTamilDate>; festival?: typeof FESTIVALS[0]
}) {
  return (
    <div style={{ background: '#0d0d14', borderBottom: `1px solid ${T.border}`, padding: '7px 0' }}>
      <div className="nt-w" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {/* Story count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 6, background: `${T.accent}14`, border: `1px solid ${T.accent}28` }}>
          <Rss style={{ width: 9, height: 9, color: T.accent }} />
          <span style={{ fontSize: 10, fontWeight: 800, color: T.accent }}>{newsCount}</span>
          <span style={{ fontSize: 9, color: T.muted }}>stories</span>
        </div>
        {/* Sources */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 6, background: `${T.teal}14`, border: `1px solid ${T.teal}28` }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: T.green, display: 'inline-block', animation: 'nt-ping 2s ease-in-out infinite' }} />
          <span style={{ fontSize: 10, fontWeight: 800, color: T.teal }}>{sourceCount}</span>
          <span style={{ fontSize: 9, color: T.muted }}>sources live</span>
        </div>
        {/* Tamil date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 6, background: `${T.gold}10`, border: `1px solid ${T.gold}22` }}>
          <CalendarDays style={{ width: 9, height: 9, color: T.gold }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: T.gold, fontFamily: "'Noto Serif Tamil', serif" }}>{tamilDate.tamilMonth}</span>
          <span style={{ fontSize: 9, color: T.muted }}>{tamilDate.tamilMonthEn}</span>
        </div>
        {/* Festival */}
        {festival && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 6, background: `${festival.color}12`, border: `1px solid ${festival.color}28` }}>
            <Star style={{ width: 9, height: 9, color: festival.color }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: festival.color }}>{festival.name}</span>
          </div>
        )}
        {/* Time */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
          <VisitorCounter />
          <span style={{ fontSize: 9, color: T.dim }}>
            {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })} IST
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Section header ────────────────────────────────────────────────────────────
function SH({ label, color = T.accent, href, icon: Icon, sub }: {
  label: string; color?: string; href?: string; icon?: React.ElementType; sub?: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', paddingBottom: 10, marginBottom: 14, borderBottom: `1px solid ${T.border}` }}>
      <div style={{ width: 3, height: 16, borderRadius: 2, background: color, marginRight: 9, flexShrink: 0 }} />
      {Icon && <Icon style={{ width: 11, height: 11, color, marginRight: 5, flexShrink: 0 }} />}
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 11, fontWeight: 900, color: T.text, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
        {sub && <span style={{ fontSize: 9.5, color: T.muted, marginLeft: 8 }}>{sub}</span>}
      </div>
      {href && (
        <Link href={href} style={{ fontSize: 10, color, textDecoration: 'none', opacity: 0.75, display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          More <ChevronRight style={{ width: 8, height: 8 }} />
        </Link>
      )}
    </div>
  )
}

// ── Source badge ──────────────────────────────────────────────────────────────
function Src({ source, small }: { source: string; small?: boolean }) {
  const c = SRC[source] ?? '#555'
  return (
    <span style={{ fontSize: small ? 7.5 : 8.5, fontWeight: 800, padding: small ? '1px 5px' : '2px 7px', borderRadius: 3, background: c, color: '#fff', whiteSpace: 'nowrap', flexShrink: 0 }}>
      {source.slice(0, 12)}
    </span>
  )
}

// ── Hero card ─────────────────────────────────────────────────────────────────
function HeroCard({ item, idx }: { item: NewsItem; idx: number }) {
  const [err, setErr] = useState(false)
  return (
    <a href={goLink(item.link, 'hero')} target="_blank" rel="noopener noreferrer"
      style={{ display: 'block', textDecoration: 'none', position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: '16/9' }}
      className="nt-hero">
      <div style={{ position: 'absolute', inset: 0 }}>
        {item.imageUrl && !err
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={item.imageUrl} alt={item.title} loading="eager" fetchPriority="high" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setErr(true)} />
          : <div style={{ width: '100%', height: '100%', background: gradFb(item.source, idx) }} />
        }
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.45) 42%, rgba(0,0,0,0.05) 72%)' }} />
      </div>
      <div style={{ position: 'absolute', top: 10, left: 10 }}><Src source={item.source} /></div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 14px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
          {item.category !== 'general' && (
            <span style={{ fontSize: 8, fontWeight: 800, color: T.accentL, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{item.category}</span>
          )}
          <span style={{ marginLeft: 'auto', fontSize: 9.5, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Clock style={{ width: 7, height: 7 }} />{item.timeAgo}
          </span>
        </div>
        <h2 style={{ margin: 0, fontFamily: "'Noto Serif Tamil', 'Noto Serif', Georgia, serif", fontSize: 'clamp(15px, 3.8vw, 22px)', fontWeight: 800, lineHeight: 1.22, color: '#fff', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', letterSpacing: '-0.01em', textShadow: '0 2px 16px rgba(0,0,0,0.6)' }}>
          {item.title}
        </h2>
      </div>
    </a>
  )
}

// ── Story tile ────────────────────────────────────────────────────────────────
function StoryTile({ item, idx }: { item: NewsItem; idx: number }) {
  const [err, setErr] = useState(false)
  return (
    <a href={goLink(item.link, 'story')} target="_blank" rel="noopener noreferrer"
      style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none' }} className="nt-tile">
      <div style={{ position: 'relative', borderRadius: 7, overflow: 'hidden', marginBottom: 7, aspectRatio: '16/9' }}>
        {item.imageUrl && !err
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={item.imageUrl} alt={item.title} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setErr(true)} />
          : <div style={{ width: '100%', height: '100%', background: gradFb(item.source, idx + 2) }} />
        }
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)' }} />
        <div style={{ position: 'absolute', bottom: 5, left: 6 }}><Src source={item.source} small /></div>
      </div>
      <p style={{ margin: '0 0 4px', fontFamily: "'Noto Serif Tamil', 'Noto Serif', Georgia, serif", fontSize: 12.5, fontWeight: 700, color: T.text, lineHeight: 1.38, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {item.title}
      </p>
      <span style={{ fontSize: 9, color: T.muted, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Clock style={{ width: 6, height: 6 }} />{item.timeAgo}
      </span>
    </a>
  )
}

// ── News row — left border = source color ─────────────────────────────────────
function NewsRow({ item, idx }: { item: NewsItem; idx: number }) {
  const c = SRC[item.source] ?? '#555'
  const [err, setErr] = useState(false)
  const ref = useRef<HTMLAnchorElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -30px 0px' })
  return (
    <motion.a ref={ref as React.Ref<HTMLAnchorElement>}
      href={goLink(item.link, 'feed')} target="_blank" rel="noopener noreferrer"
      variants={rowVar} initial="hidden" animate={inView ? 'visible' : 'hidden'}
      className="nt-row"
      style={{ display: 'flex', alignItems: 'flex-start', gap: 10, textDecoration: 'none', padding: '9px 12px 9px 11px', borderBottom: `1px solid ${T.border}`, borderLeft: `3px solid ${c}` }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: '0 0 5px', fontSize: 13, fontWeight: 650, color: T.text, lineHeight: 1.42, fontFamily: "'Noto Serif Tamil', 'Noto Serif', Georgia, serif", display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {item.title}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 8.5, fontWeight: 800, color: c }}>{item.source}</span>
          {item.category !== 'general' && (
            <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: `${c}1a`, color: c, border: `1px solid ${c}28` }}>{item.category}</span>
          )}
          <span style={{ fontSize: 9, color: T.muted, display: 'flex', alignItems: 'center', gap: 2, marginLeft: 'auto' }}>
            <Clock style={{ width: 6, height: 6 }} />{item.timeAgo}
          </span>
        </div>
      </div>
      <div style={{ flexShrink: 0, width: 72, height: 52, borderRadius: 6, overflow: 'hidden', background: gradFb(item.source, idx) }}>
        {item.imageUrl && !err
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={item.imageUrl} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setErr(true)} />
          : null
        }
      </div>
    </motion.a>
  )
}

// ── Trending row ──────────────────────────────────────────────────────────────
function TrendRow({ item, rank }: { item: NewsItem; rank: number }) {
  const c = SRC[item.source] ?? '#555'
  return (
    <a href={goLink(item.link, 'trending')} target="_blank" rel="noopener noreferrer" className="nt-trow"
      style={{ display: 'flex', gap: 9, textDecoration: 'none', padding: '7px 0', borderBottom: `1px solid ${T.border}`, alignItems: 'flex-start' }}>
      <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 900, color: rank <= 3 ? T.accent : T.dim, width: 18, textAlign: 'right', fontFamily: 'Georgia, serif', paddingTop: 1 }}>{rank}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 11.5, fontWeight: 600, color: T.sub, lineHeight: 1.36, margin: '0 0 3px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.title}</p>
        <div style={{ display: 'flex', gap: 5 }}>
          <span style={{ fontSize: 8.5, fontWeight: 700, color: c }}>{item.source}</span>
          <span style={{ fontSize: 8.5, color: T.muted }}>{item.timeAgo}</span>
        </div>
      </div>
    </a>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Sk({ h = 50, r = 6, mb = 0 }: { h?: number; r?: number; mb?: number }) {
  return <div style={{ height: h, borderRadius: r, background: 'rgba(255,255,255,0.045)', animation: 'nt-shimmer 1.8s ease-in-out infinite', marginBottom: mb, flexShrink: 0 }} />
}

// ── Cinema poster card ────────────────────────────────────────────────────────
function CinemaCard({ movie, wide }: { movie: typeof ALL_CINEMA[0]; wide?: boolean }) {
  const [err, setErr] = useState(false)
  const has = !err && hasThumb(movie)
  const rating = rc(movie.rating)
  const platform = movie.streamingOn?.[0]
  const ottC = platform ? (OTT_C[platform] ?? '#555') : null
  const isOtt = movie.ottDate && movie.ottDate !== 'Coming Soon'
  const fbGrad = `linear-gradient(160deg, ${rating}40 0%, #1a1a2e 100%)`
  return (
    <div className="nt-ccard">
      <Link href={`/movies/${movie.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
        <div style={{ borderRadius: 8, overflow: 'hidden', background: T.raised, border: `1px solid ${T.border}` }}>
          <div style={{ aspectRatio: wide ? '16/9' : '2/3', position: 'relative', overflow: 'hidden' }}>
            {has
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={movie.thumbnail} alt={movie.title} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={() => setErr(true)} />
              : <div style={{ width: '100%', height: '100%', background: fbGrad, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Play style={{ width: 18, height: 18, color: `${rating}60` }} /></div>
            }
            {movie.rating > 0 && (
              <div style={{ position: 'absolute', top: 5, left: 5, display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(0,0,0,0.82)', borderRadius: 4, padding: '2px 5px' }}>
                <Star style={{ width: 7, height: 7, color: rating, fill: rating }} />
                <span style={{ fontSize: 8.5, fontWeight: 900, color: rating }}>{movie.rating.toFixed(1)}</span>
              </div>
            )}
            {isOtt && ottC && (
              <div style={{ position: 'absolute', bottom: 5, right: 5, fontSize: 7, fontWeight: 900, padding: '2px 5px', borderRadius: 3, background: ottC, color: '#fff', maxWidth: 52, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {platform}
              </div>
            )}
            {movie.ottDate === 'Coming Soon' && (
              <div style={{ position: 'absolute', bottom: 5, left: 5, fontSize: 7, fontWeight: 900, padding: '2px 5px', borderRadius: 3, background: T.accent, color: '#fff' }}>SOON</div>
            )}
          </div>
          <div style={{ padding: '5px 7px 7px' }}>
            <p style={{ fontSize: wide ? 12 : 10, fontWeight: 700, color: T.text, lineHeight: 1.3, margin: '0 0 2px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontFamily: "'Noto Serif Tamil', 'Noto Serif', Georgia, serif" }}>{movie.title}</p>
            {wide && <p style={{ fontSize: 9.5, color: T.muted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{movie.cast?.slice(0, 2).join(' · ')}</p>}
          </div>
        </div>
      </Link>
    </div>
  )
}

// ── Serial card ───────────────────────────────────────────────────────────────
function SerialCard({ serial }: { serial: typeof serials[0] }) {
  const [err, setErr] = useState(false)
  const has = !err && !!(serial.thumbnail && !serial.thumbnail.includes('default.jpg'))
  const fbGrad = `linear-gradient(135deg, ${T.teal}40 0%, #1a1a2e 100%)`
  const channelColor: Record<string, string> = {
    'Sun TV': '#f59e0b', 'Vijay TV': '#3b82f6', 'Zee Tamil': '#9333ea',
    'Colors Tamil': '#ef4444', 'Kalaignar TV': '#dc2626', 'Star Vijay': '#2563eb',
  }
  const cc = channelColor[serial.channel] ?? T.teal
  return (
    <Link href={`/serials/${serial.slug}`} style={{ textDecoration: 'none', display: 'block' }} className="nt-scard">
      <div style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: `1px solid ${T.border}`, alignItems: 'flex-start' }}>
        <div style={{ flexShrink: 0, width: 60, height: 80, borderRadius: 7, overflow: 'hidden', background: fbGrad, border: `1px solid ${T.border}` }}>
          {has
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={serial.thumbnail} alt={serial.title} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setErr(true)} />
            : <div style={{ width: '100%', height: '100%', background: fbGrad, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Tv2 style={{ width: 16, height: 16, color: `${T.teal}60` }} /></div>
          }
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 8.5, fontWeight: 800, padding: '1px 6px', borderRadius: 3, background: cc, color: '#fff' }}>{serial.channel}</span>
            <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: serial.status === 'Ongoing' ? `${T.green}20` : `${T.muted}18`, color: serial.status === 'Ongoing' ? T.green : T.muted, border: `1px solid ${serial.status === 'Ongoing' ? T.green : T.muted}28` }}>
              {serial.status === 'Ongoing' ? '● Ongoing' : 'Completed'}
            </span>
          </div>
          <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 800, color: T.text, lineHeight: 1.3, fontFamily: "'Noto Serif Tamil', 'Noto Serif', Georgia, serif", display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {serial.title}
          </p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {serial.genre.slice(0, 2).map(g => (
              <span key={g} style={{ fontSize: 8.5, color: T.muted, padding: '1px 5px', borderRadius: 3, background: T.raised, border: `1px solid ${T.border}` }}>{g}</span>
            ))}
            {serial.rating > 0 && <span style={{ fontSize: 9, color: T.gold, fontWeight: 700, marginLeft: 'auto' }}>★ {serial.rating.toFixed(1)}</span>}
          </div>
        </div>
      </div>
    </Link>
  )
}

// ── Tamil Calendar Panel ──────────────────────────────────────────────────────
function CalendarPanel() {
  const td = useMemo(() => getTamilDate(), [])
  const greg = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  // Upcoming festivals (next 90 days)
  const now = new Date()
  const upcoming = FESTIVALS
    .map(f => {
      const d = new Date(now.getFullYear(), f.month - 1, f.day)
      if (d < now) d.setFullYear(d.getFullYear() + 1)
      const diff = Math.ceil((d.getTime() - now.getTime()) / 86400000)
      return { ...f, diff, date: d }
    })
    .filter(f => f.diff <= 90)
    .sort((a, b) => a.diff - b.diff)
    .slice(0, 8)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }} className="nt-cal-g">
      {/* Today card */}
      <div style={{ background: `linear-gradient(135deg, ${T.gold}10 0%, ${T.card} 55%)`, border: `1px solid ${T.gold}28`, borderRadius: 12, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: `${T.gold}18`, border: `1px solid ${T.gold}35`, flexShrink: 0 }}>
            <span style={{ fontSize: 24, fontWeight: 900, color: T.gold, lineHeight: 1 }}>{td.day}</span>
            <span style={{ fontSize: 8, color: T.muted, fontWeight: 700, letterSpacing: '0.05em' }}>{TAMIL_DAYS[td.weekdayIdx]?.slice(0, 4)}</span>
          </div>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: 22, fontWeight: 900, color: T.text, fontFamily: "'Noto Serif Tamil', serif", lineHeight: 1 }}>{td.tamilMonth}</p>
            <p style={{ margin: '0 0 1px', fontSize: 11, color: T.muted }}>{td.tamilMonthEn} · {greg}</p>
            <p style={{ margin: 0, fontSize: 10, color: T.dim }}>Tamil Year {td.tamilYear}</p>
          </div>
        </div>
        <div style={{ padding: '8px 12px', borderRadius: 8, background: T.raised, border: `1px solid ${T.border}` }}>
          <span style={{ fontSize: 14, fontWeight: 900, color: T.text, fontFamily: "'Noto Serif Tamil', serif" }}>{TAMIL_DAYS[td.weekdayIdx]}</span>
          <span style={{ fontSize: 10, color: T.muted, marginLeft: 8 }}>({['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][td.weekdayIdx]})</span>
        </div>
        {td.festival && (
          <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 8, background: `${td.festival.color}12`, border: `1px solid ${td.festival.color}30`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Star style={{ width: 14, height: 14, color: td.festival.color, flexShrink: 0 }} />
            <div>
              <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 900, color: td.festival.color }}>{td.festival.name}</p>
              <p style={{ margin: 0, fontSize: 10, color: T.muted }}>{td.festival.tamil}</p>
            </div>
          </div>
        )}
      </div>

      {/* Upcoming festivals */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
        <SH label="Upcoming Festivals" color={T.gold} icon={Star} />
        {upcoming.map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < upcoming.length - 1 ? `1px solid ${T.border}` : 'none' }}>
            <div style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${f.color}15`, border: `1px solid ${f.color}30` }}>
              <span style={{ fontSize: 9, fontWeight: 900, color: f.color }}>{f.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: '0 0 2px', fontSize: 12, fontWeight: 800, color: T.text }}>{f.name}</p>
              <p style={{ margin: 0, fontSize: 10, color: T.muted, fontFamily: "'Noto Serif Tamil', serif" }}>{f.tamil}</p>
            </div>
            <span style={{ flexShrink: 0, fontSize: 9.5, fontWeight: 800, padding: '2px 7px', borderRadius: 99, background: `${f.color}15`, color: f.color }}>
              {f.diff === 0 ? 'Today' : f.diff === 1 ? 'Tomorrow' : `${f.diff}d`}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// TABS
// ════════════════════════════════════════════════════════════════════════════

// ── Tab: News ─────────────────────────────────────────────────────────────────
function NewsTab({ all, loading }: { all: NewsItem[]; loading: boolean }) {
  const [newsCat, setNewsCat] = useState('all')
  const [showMore, setShowMore] = useState(false)
  const [heroIdx, setHeroIdx] = useState(0)
  const heroTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const filtered = useMemo(() => {
    if (newsCat === 'all') return all
    if (newsCat === 'sports') {
      const tagged = all.filter(n => n.category === 'sports')
      if (tagged.length >= 4) return tagged
      return [...tagged, ...all.filter(n => SPORTS_KW.some(kw => (n.title + n.desc).toLowerCase().includes(kw)) && n.category !== 'sports')]
    }
    return all.filter(n => n.category === newsCat)
  }, [all, newsCat])

  const WIKI_GENERIC = ['Tamil_country','Tamil_Nadu_state','Tamil_language_inscription','Flag_of_Tamil_Nadu']
  const heroPool = useMemo(() => {
    const withReal = filtered.filter(n => n.imageUrl && !WIKI_GENERIC.some(g => n.imageUrl!.includes(g)))
    return (withReal.length >= 2 ? withReal : filtered).slice(0, 5)
  }, [filtered])

  const heroItem = heroPool[heroIdx] ?? heroPool[0] ?? null
  const trending = useMemo(() => all.slice(0, 12), [all])

  useEffect(() => {
    if (heroPool.length <= 1) return
    if (heroTimer.current) clearInterval(heroTimer.current)
    heroTimer.current = setInterval(() => setHeroIdx(p => (p + 1) % heroPool.length), 10000)
    return () => { if (heroTimer.current) clearInterval(heroTimer.current) }
  }, [heroPool.length])

  const listStart = filtered.length >= 3 ? 3 : 1
  const listItems = showMore ? filtered.slice(listStart) : filtered.slice(listStart, listStart + 24)

  return (
    <div>
      {/* News category sub-tabs */}
      <div style={{ display: 'flex', gap: 3, padding: '8px 0', overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 14 }}>
        {NEWS_CATS.map(cat => {
          const active = newsCat === cat.key
          const Ic = cat.icon
          return (
            <button key={cat.key} onClick={() => { setNewsCat(cat.key); setShowMore(false) }}
              style={{ flexShrink: 0, position: 'relative', display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', fontSize: 11.5, fontWeight: active ? 800 : 500, color: active ? '#fff' : T.muted, background: 'transparent', border: 'none', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {active && <motion.span layoutId="news-cat-pill" style={{ position: 'absolute', inset: 0, borderRadius: 6, background: cat.color, zIndex: -1 }} transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
              <Ic style={{ width: 10, height: 10 }} />
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* Hero + sidebar grid */}
      <div className="nt-top" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14, marginBottom: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading ? (
            <><Sk h={200} r={10} mb={10} /><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}><Sk h={120} /><Sk h={120} /></div></>
          ) : heroItem ? (
            <>
              {heroPool.length > 1 && (
                <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                  {heroPool.map((_, i) => (
                    <button key={i} onClick={() => setHeroIdx(i)} style={{ width: i === heroIdx ? 18 : 4, height: 4, borderRadius: 99, background: i === heroIdx ? T.accent : 'rgba(255,255,255,0.14)', border: 'none', cursor: 'pointer', padding: 0, transition: 'width 0.22s ease, background 0.22s ease' }} />
                  ))}
                </div>
              )}
              <AnimatePresence mode="wait">
                <motion.div key={heroItem.link} initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
                  <HeroCard item={heroItem} idx={heroIdx} />
                </motion.div>
              </AnimatePresence>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {filtered.slice(1, 3).map((it, i) => <StoryTile key={i} item={it} idx={i} />)}
              </div>
            </>
          ) : null}
        </div>
        {/* desktop trending sidebar */}
        <div className="nt-tend" style={{ display: 'none' }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '13px 13px 8px', position: 'sticky', top: 110 }}>
            <SH label="Trending" color={T.gold} icon={TrendingUp} />
            {loading
              ? Array.from({ length: 9 }).map((_, i) => <Sk key={i} h={42} r={4} mb={6} />)
              : trending.map((it, i) => <TrendRow key={i} item={it} rank={i + 1} />)
            }
          </div>
        </div>
      </div>

      {/* Cinema strip */}
      <div style={{ background: `linear-gradient(135deg, ${T.purple}10 0%, ${T.card} 60%)`, border: `1px solid ${T.purple}20`, borderRadius: 10, padding: '12px 12px 14px', marginBottom: 14 }}>
        <SH label="சினிமா" color={T.purple} href="/movies" icon={Film} sub="Latest Tamil releases" />
        <div className="nt-cm-g" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 7 }}>
          {CINEMA_GRID.slice(0, 10).map(m => <CinemaCard key={m.id} movie={m} />)}
        </div>
        <div className="nt-cm-s" style={{ display: 'none', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
          {CINEMA_GRID.slice(0, 8).map(m => <div key={m.id} style={{ flexShrink: 0, width: 88 }}><CinemaCard movie={m} /></div>)}
        </div>
      </div>

      {/* Main feed + sidebar */}
      <div className="nt-low" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '12px 12px 0' }}>
              <SH label="செய்திகள்" color={T.accent} icon={Newspaper} />
            </div>
            {loading
              ? <div style={{ padding: '0 12px 10px' }}>{Array.from({ length: 10 }).map((_, i) => <Sk key={i} h={60} r={4} mb={7} />)}</div>
              : (
                <motion.div variants={stagger} initial="hidden" animate="visible" style={{ padding: '0 0 4px' }}>
                  {listItems.map((item, i) => (
                    <div key={item.link + i}>
                      <NewsRow item={item} idx={i} />
                      {(i + 1) % 8 === 0 && <ins className="adsbygoogle" style={{ display: 'block', margin: '4px 12px' }} data-ad-format="fluid" data-ad-layout-key="-fb+5w+4e-db+86" data-ad-client="ca-pub-4237294630161176" data-ad-slot="auto" />}
                    </div>
                  ))}
                </motion.div>
              )
            }
            {!loading && filtered.length > listStart + 24 && (
              <div style={{ padding: '10px 12px 12px' }}>
                <button onClick={() => setShowMore(s => !s)} className="nt-more"
                  style={{ width: '100%', padding: '9px 0', borderRadius: 7, background: T.raised, border: `1px solid ${T.border2}`, color: T.muted, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                  {showMore ? 'Show less' : `Load more · ${filtered.length - listStart - 24} more`}
                  <ChevronRight style={{ width: 11, height: 11, transform: showMore ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="nt-side" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 12px' }}>
            <SH label="IPL Live" color={T.green} />
            <div style={{ borderRadius: 7, overflow: 'hidden', border: `1px solid ${T.border}` }}>
              <CricketWidget compact />
            </div>
          </div>
          <div className="nt-tend-m">
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 12px' }}>
              <SH label="Trending" color={T.gold} icon={TrendingUp} />
              {loading ? Array.from({ length: 6 }).map((_, i) => <Sk key={i} h={40} r={4} mb={5} />) : trending.slice(0, 8).map((it, i) => <TrendRow key={i} item={it} rank={i + 1} />)}
            </div>
          </div>
          <AdUnit size="rectangle" />
        </div>
      </div>
    </div>
  )
}

// ── Tab: Cinema ───────────────────────────────────────────────────────────────
function CinemaTab() {
  const comingSoon = ALL_CINEMA.filter(m => m.ottDate === 'Coming Soon')
  const nowOTT     = ALL_CINEMA.filter(m => m.ottDate && m.ottDate !== 'Coming Soon' && freshOtt(m.ottDate))
  const topRated   = [...ALL_CINEMA].sort((a, b) => b.rating - a.rating).slice(0, 16)

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible">
      {/* Coming soon */}
      {comingSoon.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <SH label="Coming Soon" color={T.accent} icon={Star} sub="OTT premiere confirmed" />
          <div style={{ display: 'flex', gap: 9, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
            {comingSoon.map(m => <div key={m.id} style={{ flexShrink: 0, width: 110 }}><CinemaCard movie={m} /></div>)}
          </div>
        </div>
      )}

      {/* Now on OTT */}
      {nowOTT.length > 0 && (
        <div style={{ marginBottom: 16, background: `linear-gradient(135deg, ${T.purple}08 0%, ${T.card} 55%)`, border: `1px solid ${T.purple}18`, borderRadius: 10, padding: 14 }}>
          <SH label="Now on OTT" color={T.purple} href="/movies" icon={Tv2} sub="Released last 10 weeks" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }} className="nt-ott-g">
            {nowOTT.slice(0, 8).map(m => <CinemaCard key={m.id} movie={m} wide />)}
          </div>
        </div>
      )}

      {/* Top rated */}
      <div>
        <SH label="Top Rated" color={T.gold} href="/movies" icon={Star} />
        <div className="nt-cm-g" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 9 }}>
          {topRated.map(m => <CinemaCard key={m.id} movie={m} />)}
        </div>
      </div>
    </motion.div>
  )
}

// ── Tab: Serials ──────────────────────────────────────────────────────────────
function SerialsTab() {
  const ongoing  = serials.filter(s => s.status === 'Ongoing' && s.language === 'Tamil')
  const channels = [...new Set(ongoing.map(s => s.channel))].sort()

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible">
      <div style={{ marginBottom: 10, display: 'flex', gap: 5, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {channels.map(ch => {
          const cc: Record<string, string> = { 'Sun TV': '#f59e0b', 'Vijay TV': '#3b82f6', 'Zee Tamil': '#9333ea', 'Colors Tamil': '#ef4444', 'Kalaignar TV': '#dc2626' }
          const c = cc[ch] ?? T.teal
          return (
            <div key={ch} style={{ flexShrink: 0, padding: '4px 12px', borderRadius: 99, background: `${c}18`, border: `1px solid ${c}30`, fontSize: 10.5, fontWeight: 800, color: c, whiteSpace: 'nowrap' }}>{ch}</div>
          )
        })}
      </div>

      {channels.map(ch => {
        const chSerials = ongoing.filter(s => s.channel === ch)
        if (!chSerials.length) return null
        const cc: Record<string, string> = { 'Sun TV': '#f59e0b', 'Vijay TV': '#3b82f6', 'Zee Tamil': '#9333ea', 'Colors Tamil': '#ef4444', 'Kalaignar TV': '#dc2626' }
        const c = cc[ch] ?? T.teal
        return (
          <div key={ch} style={{ marginBottom: 14, background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 14px' }}>
            <SH label={ch} color={c} icon={Tv2} sub={`${chSerials.length} ongoing`} />
            {chSerials.map(s => <SerialCard key={s.id} serial={s} />)}
          </div>
        )
      })}

      <div style={{ marginTop: 8, textAlign: 'center' }}>
        <Link href="/serials" style={{ fontSize: 12, fontWeight: 700, color: T.teal, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, padding: '9px 20px', borderRadius: 8, border: `1px solid ${T.teal}30`, background: `${T.teal}08` }}>
          View all Tamil serials <ArrowUpRight style={{ width: 12, height: 12 }} />
        </Link>
      </div>
    </motion.div>
  )
}

// ── Tab: TVK ──────────────────────────────────────────────────────────────────
function TVKTab({ all, loading }: { all: NewsItem[]; loading: boolean }) {
  const tvkItems = useMemo(() => {
    const tagged = all.filter(n =>
      n.category === 'tvk' ||
      /tvk|vijay|தாளபதி|வெற்றி கழகம்|tamilaga|2026 election|tn election/i.test(n.title + n.desc)
    )
    return tagged.length ? tagged : [TVK_PROMO, ...all.filter(n => n.category === 'politics').slice(0, 8)]
  }, [all])

  const heroItem = tvkItems.find(n => n.imageUrl) ?? tvkItems[0] ?? TVK_PROMO

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible">
      {/* TVK banner */}
      <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(99,102,241,0.08) 50%, #111118 100%)', border: '1px solid rgba(245,158,11,0.22)', borderRadius: 10, padding: 14, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(245,158,11,0.18)', border: '1px solid rgba(245,158,11,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Zap style={{ width: 20, height: 20, color: T.gold }} />
        </div>
        <div>
          <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 900, color: T.text }}>TVK — Tamilaga Vettri Kazhagam</p>
          <p style={{ margin: 0, fontSize: 11, color: T.muted }}>Thalapathy Vijay's party · Tamil Nadu 2026 elections · Real-time updates</p>
        </div>
        <span style={{ marginLeft: 'auto', flexShrink: 0, fontSize: 8, fontWeight: 900, padding: '3px 7px', borderRadius: 4, background: T.red, color: '#fff', animation: 'nt-ping-bg 2s ease-in-out infinite' }}>LIVE</span>
      </div>

      {loading ? (
        <><Sk h={200} r={10} mb={12} />{Array.from({ length: 6 }).map((_, i) => <Sk key={i} h={62} r={4} mb={7} />)}</>
      ) : (
        <>
          {heroItem && (
            <div style={{ marginBottom: 14 }}>
              <HeroCard item={heroItem} idx={0} />
            </div>
          )}
          <motion.div variants={stagger} initial="hidden" animate="visible" style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
            {tvkItems.slice(1, 20).map((item, i) => <NewsRow key={i} item={item} idx={i} />)}
          </motion.div>
        </>
      )}

      <TVKSpotlight />
    </motion.div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════
export default function HomeNewsPortal() {
  const [data, setData]          = useState<ApiResponse | null>(null)
  const [loading, setLoading]    = useState(true)
  const [refreshing, setRefresh] = useState(false)
  const [tab, setTab]            = useState('news')
  const [secAgo, setSecAgo]      = useState(0)

  const fetchNews = useCallback(async (manual = false) => {
    if (manual) setRefresh(true)
    else {
      try { const ss = sessionStorage.getItem(SS_KEY); if (ss) { const { d, at } = JSON.parse(ss); if (Date.now() - at < CACHE_TTL) { setData(d); setLoading(false); return } } } catch { /* ignore */ }
      try { const ls = localStorage.getItem(LS_KEY); if (ls) { const { d, at } = JSON.parse(ls); if (Date.now() - at < LS_CACHE_TTL) { setData(d); setLoading(false) } } } catch { /* ignore */ }
    }
    try {
      const res = await fetch('/api/tamil-media-news', { cache: 'no-store', signal: AbortSignal.timeout(12000) })
      if (!res.ok) return
      const json: ApiResponse = await res.json()
      setData(json); setSecAgo(0)
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

  const all = data?.news ?? []
  const sourceCount = useMemo(() => new Set(all.map(n => n.source)).size, [all])
  const tamilDate = useMemo(() => getTamilDate(), [])
  const freshLabel = secAgo < 60 ? `${secAgo}s` : `${Math.floor(secAgo / 60)}m`

  // Featured movie for spotlight banner
  const featuredMovie = CINEMA_GRID[0]

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text }}>

      {/* ── BREAKING TICKER ─────────────────────────────────────────────── */}
      {!loading && <Ticker items={all} />}

      {/* ── MAIN TAB NAV ────────────────────────────────────────────────── */}
      <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, position: 'sticky', top: 56, zIndex: 40 }}>
        <div className="nt-w" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', overflowX: 'auto', scrollbarWidth: 'none', gap: 2, padding: '8px 0' }}>
            {TABS.map(t => {
              const active = tab === t.key
              const Ic = t.icon
              return (
                <button key={t.key} onClick={() => setTab(t.key)}
                  style={{ flexShrink: 0, position: 'relative', display: 'flex', alignItems: 'center', gap: 5, padding: '6px 13px', fontSize: 12, fontWeight: active ? 800 : 500, color: active ? '#fff' : T.muted, background: 'transparent', border: 'none', borderRadius: 7, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {active && <motion.span layoutId="main-tab-pill" style={{ position: 'absolute', inset: 0, borderRadius: 7, background: t.color, zIndex: -1 }} transition={{ type: 'spring', stiffness: 480, damping: 36 }} />}
                  <Ic style={{ width: 11, height: 11 }} />
                  <span className="nt-tab-label">{t.label}</span>
                  {'badge' in t && t.badge && (
                    <span style={{ fontSize: 7, fontWeight: 900, padding: '1px 4px', borderRadius: 2, background: 'rgba(255,255,255,0.22)', color: '#fff' }}>{t.badge}</span>
                  )}
                </button>
              )
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, paddingLeft: 8 }}>
            <span style={{ fontSize: 9.5, color: T.dim }}>{refreshing ? '…' : freshLabel}</span>
            <button onClick={() => fetchNews(true)} disabled={refreshing}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.dim, padding: 3, lineHeight: 0 }}>
              <RefreshCw style={{ width: 10, height: 10, animation: refreshing ? 'nt-spin 1s linear infinite' : 'none' }} />
            </button>
          </div>
        </div>
      </div>

      {/* ── STAT BAR ────────────────────────────────────────────────────── */}
      <StatBar newsCount={all.length} sourceCount={sourceCount} tamilDate={tamilDate} festival={tamilDate.festival} />

      <div className="nt-w nt-vpad">

        {/* ── Featured movie banner ─────────────────────────────────────── */}
        {featuredMovie && tab === 'news' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }} style={{ marginBottom: 14 }}>
            <Link href={`/movies/${featuredMovie.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
              <div className="nt-feat" style={{ background: `linear-gradient(135deg, rgba(0,0,0,0.72) 0%, ${T.card} 55%)`, border: `1px solid ${T.border2}`, borderRadius: 10, padding: '10px 13px', display: 'flex', alignItems: 'center', gap: 11, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 50% 80% at 0% 50%, ${rc(featuredMovie.rating)}0e 0%, transparent 65%)`, pointerEvents: 'none' }} />
                {featuredMovie.thumbnail && (
                  <div style={{ flexShrink: 0, width: 44, height: 66, borderRadius: 5, overflow: 'hidden', border: `1px solid ${T.border2}` }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={featuredMovie.thumbnail} alt={featuredMovie.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 8, fontWeight: 900, padding: '2px 7px', borderRadius: 3, background: T.accent, color: '#fff', letterSpacing: '0.06em' }}>{featuredMovie.badge ?? 'NEW RELEASE'}</span>
                    <span style={{ fontSize: 8.5, color: T.gold, fontWeight: 800 }}>★ {featuredMovie.rating.toFixed(1)}</span>
                  </div>
                  <p style={{ margin: '0 0 2px', fontSize: 13.5, fontWeight: 800, color: T.text, fontFamily: "'Noto Serif Tamil', 'Noto Serif', Georgia, serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{featuredMovie.title}</p>
                  <p style={{ margin: 0, fontSize: 10.5, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{featuredMovie.cast?.slice(0, 3).join(' · ')}</p>
                </div>
                <ArrowUpRight style={{ width: 13, height: 13, color: T.dim, flexShrink: 0 }} />
              </div>
            </Link>
          </motion.div>
        )}

        {/* ── TAB CONTENT ─────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
            {tab === 'news'     && <NewsTab all={all} loading={loading} />}
            {tab === 'cinema'   && <CinemaTab />}
            {tab === 'serials'  && <SerialsTab />}
            {tab === 'calendar' && <CalendarPanel />}
            {tab === 'tvk'      && <TVKTab all={all} loading={loading} />}
          </motion.div>
        </AnimatePresence>

      </div>

      {tab !== 'tvk' && <TVKSpotlight />}

      <div className="nt-w" style={{ paddingBottom: 24 }}>
        <AdUnit size="banner" />
      </div>

      <style>{`
        @keyframes nt-marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes nt-ping    { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.3;transform:scale(1.5)} }
        @keyframes nt-spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes nt-shimmer { 0%{opacity:0.22} 50%{opacity:0.5} 100%{opacity:0.22} }

        /* Wrapper */
        .nt-w { max-width: 1280px; margin: 0 auto; padding-left: 14px; padding-right: 14px; }
        @media(min-width:640px)  { .nt-w { padding-left: 20px; padding-right: 20px; } }
        @media(min-width:1024px) { .nt-w { padding-left: 28px; padding-right: 28px; } }
        .nt-vpad { padding-top: 14px; padding-bottom: 8px; }

        /* Main tabs — show English labels only on mobile to save space */
        @media(max-width:400px) {
          .nt-tab-label { font-size: 0; }
          .nt-tab-label::after { font-size: 11px; content: attr(data-en); }
        }

        /* Top hero section */
        @media(min-width:960px) {
          .nt-top  { grid-template-columns: 1fr 268px !important; align-items: start; }
          .nt-tend { display: block !important; }
          .nt-tend-m { display: none !important; }
        }

        /* Cinema grids */
        @media(min-width:1024px) { .nt-cm-g { grid-template-columns: repeat(10,1fr) !important; } .nt-cm-s { display:none !important; } }
        @media(min-width:640px) and (max-width:1023px) { .nt-cm-g { grid-template-columns: repeat(5,1fr) !important; } .nt-cm-s { display:none !important; } }
        @media(max-width:639px)  { .nt-cm-g { display:none !important; } .nt-cm-s { display:flex !important; } }

        /* OTT grid */
        @media(max-width:639px)  { .nt-ott-g { grid-template-columns: repeat(2,1fr) !important; } }

        /* Lower grid */
        @media(min-width:960px) { .nt-low { grid-template-columns: 1fr 268px !important; align-items: start; } }

        /* Calendar two-col */
        @media(min-width:768px) { .nt-cal-g { grid-template-columns: 1fr 1fr !important; } }

        /* Hero zoom */
        .nt-hero { transition: transform 0.22s cubic-bezier(.23,1,.32,1); }
        .nt-hero:hover { transform: scale(1.006); }

        /* News row */
        .nt-row { transition: background 0.1s ease; }
        .nt-row:hover { background: rgba(255,255,255,0.03) !important; }

        /* Story tile */
        .nt-tile { transition: opacity 0.14s; }
        .nt-tile:hover { opacity: 0.75; }

        /* Cinema card */
        .nt-ccard { transition: transform 0.16s ease; }
        .nt-ccard:hover { transform: translateY(-3px); }

        /* Serial card */
        .nt-scard { transition: background 0.1s; }
        .nt-scard:hover { background: rgba(255,255,255,0.02); }

        /* Feature banner */
        .nt-feat { transition: border-color 0.15s, transform 0.15s; }
        .nt-feat:hover { border-color: rgba(255,255,255,0.18) !important; transform: translateY(-1px); }

        /* Trending row */
        .nt-trow { transition: background 0.1s; }
        .nt-trow:hover { background: rgba(255,255,255,0.03); }

        /* Load more */
        .nt-more:hover { background: rgba(255,255,255,0.055) !important; }
      `}</style>
    </div>
  )
}
