'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import {
  RefreshCw, Newspaper, TrendingUp, Tv2, Film,
  Play, Trophy, Radio, Clock, Flame, Zap, Star,
  ChevronRight, ArrowUpRight,
} from 'lucide-react'
import { goLink } from '@/lib/goLink'
import CricketWidget from '@/components/CricketWidget'
import AdUnit from '@/components/AdUnit'
import VisitorCounter from '@/components/VisitorCounter'
import TVKSpotlight from '@/components/TVKSpotlight'
import { movies } from '@/data/movies'

// ── Daily accent — 3 palettes, rotates by day ────────────────────────────────
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
  gold:    '#f59e0b',
  purple:  '#a855f7',
  green:   '#22c55e',
  teal:    '#14b8a6',
}

// ── Source color map ──────────────────────────────────────────────────────────
const SRC: Record<string, string> = {
  'Dinamalar':           '#e53935',
  'Maalaimalar':         '#7c3aed',
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
  'CricBuzz':            '#1b5e20',
  'ESPN Cricinfo':       '#d32f2f',
}

// ── Gradient fallbacks — never show empty ─────────────────────────────────────
// Each item maps to a visually rich gradient + icon, keyed to source/category
function gradientFallback(source: string, _category: string, seed: number): string {
  const c = SRC[source] ?? T.accent
  const pairs: [string, string][] = [
    [c,        '#1a1a2e'],
    ['#1a1a2e', c       ],
    [c + 'cc', T.card   ],
  ]
  const [a, b] = pairs[seed % pairs.length]
  const angle = 120 + (seed % 4) * 30
  return `linear-gradient(${angle}deg, ${a} 0%, ${b} 100%)`
}

// Cinema grid — only show movies with real thumbs
const _10W = new Date(Date.now() - 70 * 24 * 60 * 60 * 1000)
function _hasThumb(m: { thumbnail?: string }) {
  return !!(m.thumbnail && !m.thumbnail.includes('default.jpg') && !m.thumbnail.includes('goat-vijay'))
}
function _freshOtt(d?: string) {
  if (!d) return false
  if (d === 'Coming Soon') return true
  try { return new Date(d) >= _10W } catch { return false }
}
const CINEMA = movies
  .filter(m => m.language === 'Tamil' && _hasThumb(m) && (_freshOtt(m.ottDate) || m.year >= 2025))
  .sort((a, b) => {
    const as = a.ottDate === 'Coming Soon' ? 2 : _freshOtt(a.ottDate) ? 1 : 0
    const bs = b.ottDate === 'Coming Soon' ? 2 : _freshOtt(b.ottDate) ? 1 : 0
    if (bs !== as) return bs - as
    return b.rating - a.rating
  })
  .slice(0, 10)

function ratingColor(r: number) {
  if (r >= 8) return '#22c55e'
  if (r >= 7) return '#f5a623'
  if (r >= 6) return '#fb923c'
  return '#f87171'
}

const OTT_C: Record<string, string> = {
  'Netflix': '#e50914', 'Amazon Prime': '#00a8e0',
  'Disney+ Hotstar': '#0073e6', 'ZEE5': '#8b5cf6', 'YouTube': '#ff0000',
}

// ── Interfaces ────────────────────────────────────────────────────────────────
interface NewsItem {
  title: string; link: string; source: string; sourceLogo: string
  pubDate: string; timeAgo: string; desc: string; imageUrl: string | null; category: string
}
interface ApiResponse { news: NewsItem[]; updatedAt: string; count: number }

// ── Cache constants ───────────────────────────────────────────────────────────
const REFRESH_MS   = 6 * 60 * 1000   // auto-refresh 6min
const CACHE_TTL    = 5 * 60 * 1000   // sessionStorage 5min
const LS_CACHE_TTL = 10 * 60 * 1000  // localStorage 10min (was 30min — too stale)
const LS_KEY       = 'nt_news_ls_v5'
const SS_KEY       = 'nt_news_v7'
const SPORTS_KW    = ['cricket','ipl','csk','dhoni','match','விளையாட்டு','கிரிக்கெட்']

const CATS = [
  { key: 'all',      label: 'அனைத்தும்',  icon: Radio,   color: T.accent },
  { key: 'tvk',      label: 'TVK 2026',   icon: Zap,     color: T.gold,   badge: 'LIVE' },
  { key: 'politics', label: 'அரசியல்',    icon: Flame,   color: '#f97316' },
  { key: 'cinema',   label: 'சினிமா',     icon: Film,    color: T.purple  },
  { key: 'sports',   label: 'விளையாட்டு', icon: Trophy,  color: T.green   },
]

const TVK_PROMO: NewsItem = {
  title: 'Thalapathy Vijay — TVK கட்சி | Tamil Nadu CM Race 2026',
  desc: '', link: 'https://en.wikipedia.org/wiki/Tamilaga_Vettri_Kazhagam',
  source: 'NammaTamil.tv', sourceLogo: '', pubDate: new Date().toISOString(),
  timeAgo: 'pinned',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Vijay_at_CWC_2011.jpg/800px-Vijay_at_CWC_2011.jpg',
  category: 'tvk',
}

// ── Animation variants ────────────────────────────────────────────────────────
const EASE_OUT = 'easeOut' as const
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.055 } },
}
const rowVariant = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.22, ease: EASE_OUT } },
}

// ════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ════════════════════════════════════════════════════════════════════════════

// ── Breaking news ticker ───────────────────────────────────────────────────
function Ticker({ items }: { items: NewsItem[] }) {
  if (!items.length) return null
  const heads = items.slice(0, 18).map(n => n.title)
  return (
    <div style={{ background: T.accent, overflow: 'hidden', display: 'flex', alignItems: 'center', height: 30 }}>
      <div style={{
        flexShrink: 0, padding: '0 14px', height: '100%',
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'rgba(0,0,0,0.25)', fontSize: 8.5, fontWeight: 900,
        color: '#fff', letterSpacing: '0.2em', whiteSpace: 'nowrap',
      }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff', display: 'inline-block', animation: 'nt-ping 1.4s ease-in-out infinite' }} />
        LIVE
      </div>
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 52, whiteSpace: 'nowrap', fontSize: 11.5, fontWeight: 500, color: 'rgba(255,255,255,0.96)', animation: 'nt-marquee 130s linear infinite', paddingLeft: 20 }}>
          {[...heads, ...heads].map((h, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 4, opacity: 0.6 }}>◆</span>{h}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Section header ────────────────────────────────────────────────────────
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

// ── Source badge ──────────────────────────────────────────────────────────
function SrcBadge({ source, small }: { source: string; small?: boolean }) {
  const c = SRC[source] ?? '#555'
  return (
    <span style={{
      fontSize: small ? 7.5 : 8.5, fontWeight: 800, padding: small ? '1px 5px' : '2px 7px',
      borderRadius: 3, background: c, color: '#fff', whiteSpace: 'nowrap',
      flexShrink: 0, letterSpacing: '0.02em',
    }}>
      {source.slice(0, 12)}
    </span>
  )
}

// ── Hero card — full-bleed image, editorial overlay ───────────────────────
function HeroCard({ item, idx }: { item: NewsItem; idx: number }) {
  const [err, setErr] = useState(false)
  const bg = gradientFallback(item.source, item.category, idx)
  return (
    <a href={goLink(item.link, 'hero')} target="_blank" rel="noopener noreferrer"
      style={{ display: 'block', textDecoration: 'none', position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: '16/9' }}
      className="nt-hero"
    >
      <div style={{ position: 'absolute', inset: 0 }}>
        {item.imageUrl && !err
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={item.imageUrl} alt={item.title} loading="eager" fetchPriority="high" decoding="async"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setErr(true)} />
          : <div style={{ width: '100%', height: '100%', background: bg }} />
        }
        {/* multi-stop scrim for legibility */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.55) 38%, rgba(0,0,0,0.08) 70%)' }} />
      </div>
      {/* category stripe */}
      <div style={{ position: 'absolute', top: 10, left: 10 }}>
        <SrcBadge source={item.source} />
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 16px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          {item.category !== 'general' && (
            <span style={{ fontSize: 8, fontWeight: 800, color: T.accentL, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {item.category}
            </span>
          )}
          <span style={{ marginLeft: 'auto', fontSize: 9.5, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Clock style={{ width: 7, height: 7 }} />{item.timeAgo}
          </span>
        </div>
        <h2 style={{
          margin: 0, fontFamily: "'Noto Serif', Georgia, serif",
          fontSize: 'clamp(15px, 4vw, 22px)', fontWeight: 800, lineHeight: 1.22,
          color: '#fff', display: '-webkit-box', WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
          letterSpacing: '-0.015em', textShadow: '0 2px 16px rgba(0,0,0,0.6)',
        }}>
          {item.title}
        </h2>
      </div>
    </a>
  )
}

// ── Compact story tile — used in 2-col grid below hero ────────────────────
function StoryTile({ item, idx }: { item: NewsItem; idx: number }) {
  const [err, setErr] = useState(false)
  const bg = gradientFallback(item.source, item.category, idx + 2)
  return (
    <a href={goLink(item.link, 'story')} target="_blank" rel="noopener noreferrer"
      style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none' }}
      className="nt-tile"
    >
      <div style={{ position: 'relative', borderRadius: 7, overflow: 'hidden', marginBottom: 7, aspectRatio: '16/9' }}>
        {item.imageUrl && !err
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={item.imageUrl} alt={item.title} loading="lazy" decoding="async"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setErr(true)} />
          : <div style={{ width: '100%', height: '100%', background: bg }} />
        }
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 55%)' }} />
        <div style={{ position: 'absolute', bottom: 5, left: 6 }}>
          <SrcBadge source={item.source} small />
        </div>
      </div>
      <p style={{
        margin: '0 0 4px', fontFamily: "'Noto Serif', Georgia, serif",
        fontSize: 12.5, fontWeight: 700, color: T.text, lineHeight: 1.38,
        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {item.title}
      </p>
      <span style={{ fontSize: 9, color: T.muted, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Clock style={{ width: 6, height: 6 }} />{item.timeAgo}
      </span>
    </a>
  )
}

// ── News row — source-colored left border, thumb right ────────────────────
function NewsRow({ item, idx }: { item: NewsItem; idx: number }) {
  const c = SRC[item.source] ?? '#555'
  const [err, setErr] = useState(false)
  const bg = gradientFallback(item.source, item.category, idx)
  const ref = useRef<HTMLAnchorElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -40px 0px' })

  return (
    <motion.a
      ref={ref}
      href={goLink(item.link, 'feed')}
      target="_blank" rel="noopener noreferrer"
      className="nt-row"
      variants={rowVariant}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        textDecoration: 'none', padding: '9px 12px 9px 0',
        borderBottom: `1px solid ${T.border}`,
        borderLeft: `3px solid ${c}`,
        paddingLeft: 11,
        background: 'transparent',
      }}
    >
      {/* text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: '0 0 5px', fontSize: 13, fontWeight: 650, color: T.text,
          lineHeight: 1.42, fontFamily: "'Noto Serif', Georgia, serif",
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {item.title}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 8.5, fontWeight: 800, color: c }}>{item.source}</span>
          {item.category !== 'general' && (
            <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: `${c}1a`, color: c, border: `1px solid ${c}28` }}>
              {item.category}
            </span>
          )}
          <span style={{ fontSize: 9, color: T.muted, display: 'flex', alignItems: 'center', gap: 2, marginLeft: 'auto' }}>
            <Clock style={{ width: 6, height: 6 }} />{item.timeAgo}
          </span>
        </div>
      </div>
      {/* thumb — always shows something */}
      <div style={{ flexShrink: 0, width: 72, height: 52, borderRadius: 6, overflow: 'hidden' }}>
        {item.imageUrl && !err
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={item.imageUrl} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setErr(true)} />
          : <div style={{ width: '100%', height: '100%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Newspaper style={{ width: 14, height: 14, color: `${c}60` }} />
            </div>
        }
      </div>
    </motion.a>
  )
}

// ── Sidebar trending row — compact, numbered ──────────────────────────────
function TrendRow({ item, rank }: { item: NewsItem; rank: number }) {
  const c = SRC[item.source] ?? '#555'
  const hot = rank <= 3
  return (
    <a href={goLink(item.link, 'trending')} target="_blank" rel="noopener noreferrer"
      className="nt-trow"
      style={{ display: 'flex', gap: 9, textDecoration: 'none', padding: '7px 0', borderBottom: `1px solid ${T.border}`, alignItems: 'flex-start' }}
    >
      <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 900, color: hot ? T.accent : T.dim, width: 18, textAlign: 'right', fontFamily: 'Georgia, serif', paddingTop: 1 }}>{rank}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 11.5, fontWeight: 600, color: T.sub, lineHeight: 1.36, margin: '0 0 3px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.title}</p>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          <span style={{ fontSize: 8.5, fontWeight: 700, color: c }}>{item.source}</span>
          <span style={{ fontSize: 8.5, color: T.muted }}>{item.timeAgo}</span>
        </div>
      </div>
    </a>
  )
}

// ── Cinema poster card ────────────────────────────────────────────────────
function CinemaCard({ movie }: { movie: (typeof CINEMA)[0] }) {
  const rc = ratingColor(movie.rating)
  const platform = movie.streamingOn?.[0]
  const ottColor = platform ? (OTT_C[platform] ?? '#555') : null
  const isOtt = movie.ottDate && movie.ottDate !== 'Coming Soon'
  const [err, setErr] = useState(false)
  const hasThumb = !err && _hasThumb(movie)
  // deterministic gradient fallback based on title
  const fbGrad = `linear-gradient(135deg, ${rc}40 0%, #1a1a2e 100%)`
  return (
    <div className="nt-ccard">
      <Link href={`/movies/${movie.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
        <div style={{ borderRadius: 7, overflow: 'hidden', background: T.raised, border: `1px solid ${T.border}` }}>
          <div style={{ aspectRatio: '2/3', position: 'relative', overflow: 'hidden' }}>
            {hasThumb
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={movie.thumbnail} alt={movie.title} loading="lazy" decoding="async"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  onError={() => setErr(true)} />
              : <div style={{ width: '100%', height: '100%', background: fbGrad, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Play style={{ width: 18, height: 18, color: `${rc}60` }} />
                </div>
            }
            {movie.rating > 0 && (
              <div style={{ position: 'absolute', top: 5, left: 5, display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(0,0,0,0.82)', borderRadius: 4, padding: '2px 5px' }}>
                <Star style={{ width: 7, height: 7, color: rc, fill: rc }} />
                <span style={{ fontSize: 8.5, fontWeight: 900, color: rc }}>{movie.rating.toFixed(1)}</span>
              </div>
            )}
            {isOtt && ottColor && (
              <div style={{ position: 'absolute', bottom: 5, right: 5, fontSize: 7, fontWeight: 900, padding: '2px 5px', borderRadius: 3, background: ottColor, color: '#fff', maxWidth: 52, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {platform}
              </div>
            )}
          </div>
          <div style={{ padding: '5px 7px 7px' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: T.text, lineHeight: 1.3, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontFamily: "'Noto Serif', Georgia, serif" }}>
              {movie.title}
            </p>
          </div>
        </div>
      </Link>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────
function Skel({ h = 50, r = 6 }: { h?: number; r?: number }) {
  return <div style={{ height: h, borderRadius: r, background: 'rgba(255,255,255,0.045)', animation: 'nt-shimmer 1.8s ease-in-out infinite', flexShrink: 0 }} />
}

// ── Category tab bar with animated indicator ──────────────────────────────
function CatBar({
  category, setCategory, onRefresh, refreshing, freshLabel, newsCount,
}: {
  category: string
  setCategory: (k: string) => void
  onRefresh: () => void
  refreshing: boolean
  freshLabel: string
  newsCount: number
}) {
  return (
    <div style={{
      background: T.card, borderBottom: `1px solid ${T.border}`,
      position: 'sticky', top: 56, zIndex: 40,
    }}>
      <div className="nt-w" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* animated pill tabs */}
        <div style={{ display: 'flex', overflowX: 'auto', scrollbarWidth: 'none', gap: 2, padding: '8px 0' }}>
          {CATS.map(cat => {
            const active = category === cat.key
            const Ic = cat.icon
            return (
              <button key={cat.key} onClick={() => setCategory(cat.key)}
                style={{
                  flexShrink: 0, position: 'relative', display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 12px', fontSize: 11.5, fontWeight: active ? 800 : 500,
                  color: active ? '#fff' : T.muted, background: 'transparent',
                  border: 'none', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                {/* animated background pill */}
                {active && (
                  <motion.span
                    layoutId="cat-pill"
                    style={{ position: 'absolute', inset: 0, borderRadius: 6, background: cat.color, zIndex: -1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                  />
                )}
                <Ic style={{ width: 10, height: 10 }} />
                {cat.label}
                {'badge' in cat && cat.badge && (
                  <span style={{ fontSize: 7, fontWeight: 900, padding: '1px 4px', borderRadius: 2, background: 'rgba(255,255,255,0.22)', color: '#fff' }}>{cat.badge}</span>
                )}
              </button>
            )
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, paddingLeft: 8 }}>
          {newsCount > 0 && (
            <span style={{ fontSize: 9.5, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: `${T.accent}18`, color: T.accent, border: `1px solid ${T.accent}30` }}>
              {newsCount}
            </span>
          )}
          <span style={{ fontSize: 9.5, color: T.dim }}>{refreshing ? '…' : freshLabel}</span>
          <button onClick={onRefresh} disabled={refreshing}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.dim, padding: 3, lineHeight: 0 }}>
            <RefreshCw style={{ width: 10, height: 10, animation: refreshing ? 'nt-spin 1s linear infinite' : 'none' }} />
          </button>
          <VisitorCounter />
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════
export default function HomeNewsPortal() {
  const [data, setData]          = useState<ApiResponse | null>(null)
  const [loading, setLoading]    = useState(true)
  const [refreshing, setRefresh] = useState(false)
  const [category, setCat]       = useState<string>('all')
  const [showMore, setShowMore]  = useState(false)
  const [secAgo, setSecAgo]      = useState(0)
  const [heroIdx, setHeroIdx]    = useState(0)
  const heroTimer                = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchNews = useCallback(async (manual = false) => {
    if (manual) { setRefresh(true) }
    else {
      // sessionStorage — fastest, 5min TTL
      try {
        const ss = sessionStorage.getItem(SS_KEY)
        if (ss) {
          const { d, at } = JSON.parse(ss)
          if (Date.now() - at < CACHE_TTL) { setData(d); setLoading(false); return }
        }
      } catch { /* ignore */ }
      // localStorage — fallback warmup, 10min TTL
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

  const filtered = useMemo(() => {
    if (category === 'all') return all
    if (category === 'tvk') {
      const tvk = all.filter(n => n.category === 'tvk' || (n.category === 'politics' && /tvk|vijay|தாளபதி|வெற்றி கழகம்/i.test(n.title + n.desc)))
      return tvk
    }
    if (category === 'sports') {
      const tagged = all.filter(n => n.category === 'sports')
      if (tagged.length >= 4) return tagged
      return [...tagged, ...all.filter(n => SPORTS_KW.some(kw => (n.title + n.desc).toLowerCase().includes(kw)) && n.category !== 'sports')]
    }
    return all.filter(n => n.category === category)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all.length, category])

  const trending = useMemo(() => {
    // sorted by source score — Tamil sources first
    return [...all].slice(0, 12)
  }, [data])

  // Hero pool — prefer items with real, non-generic images
  const WIKI_GENERIC = ['Tamil_country', 'Tamil_Nadu_state', 'Tamil_language_inscription', 'Flag_of_Tamil_Nadu']
  const heroPool = useMemo(() => {
    const withReal = filtered.filter(n => n.imageUrl && !WIKI_GENERIC.some(g => n.imageUrl!.includes(g)))
    return (withReal.length >= 2 ? withReal : filtered).slice(0, 5)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered.length, category])

  const heroItem = heroPool[heroIdx] ?? heroPool[0] ?? (category === 'tvk' ? TVK_PROMO : null)

  useEffect(() => {
    if (heroPool.length <= 1) return
    if (heroTimer.current) clearInterval(heroTimer.current)
    heroTimer.current = setInterval(() => setHeroIdx(p => (p + 1) % heroPool.length), 10000)
    return () => { if (heroTimer.current) clearInterval(heroTimer.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all.length, category])

  const listStart = filtered.length >= 3 ? 3 : filtered.length >= 1 ? 1 : 0
  const listItems = showMore ? filtered.slice(listStart) : filtered.slice(listStart, listStart + 24)
  const freshLabel = secAgo < 60 ? `${secAgo}s` : `${Math.floor(secAgo / 60)}m`

  // Featured movie (spotlight banner)
  const featuredMovie = CINEMA[0]

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text }}>

      {/* ── BREAKING TICKER ─────────────────────────────────────────────── */}
      {!loading && <Ticker items={all} />}

      {/* ── CATEGORY NAV ────────────────────────────────────────────────── */}
      <CatBar
        category={category}
        setCategory={k => { setCat(k); setShowMore(false) }}
        onRefresh={() => fetchNews(true)}
        refreshing={refreshing}
        freshLabel={freshLabel}
        newsCount={all.length}
      />

      {/* ── DATE / STATUS BAR ───────────────────────────────────────────── */}
      <div style={{ background: '#0c0c12', borderBottom: `1px solid ${T.border}`, padding: '5px 0' }}>
        <div className="nt-w" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {(() => {
            const now = new Date()
            const TDAYS = ['ஞாயிறு','திங்கள்','செவ்வாய்','புதன்','வியாழன்','வெள்ளி','சனி']
            const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
            const h = now.getHours().toString().padStart(2, '0')
            const m = now.getMinutes().toString().padStart(2, '0')
            return (
              <>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: T.sub }}>
                  {TDAYS[now.getDay()]} · {now.getDate()} {MONTHS[now.getMonth()]} {now.getFullYear()}
                </span>
                <span style={{ fontSize: 9.5, color: T.muted }}>📍 Chennai · {h}:{m} IST</span>
                <span style={{ marginLeft: 'auto', fontSize: 9, padding: '2px 7px', borderRadius: 99, background: T.raised, color: T.muted, border: `1px solid ${T.border2}`, textTransform: 'capitalize' }}>
                  ◉ {ACCENT.name}
                </span>
              </>
            )
          })()}
        </div>
      </div>

      <div className="nt-w nt-vpad">

        {/* ── FEATURED MOVIE BANNER ─────────────────────────────────────── */}
        {featuredMovie && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} style={{ marginBottom: 14 }}>
            <Link href={`/movies/${featuredMovie.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
              <div className="nt-feat"
                style={{
                  background: `linear-gradient(135deg, rgba(0,0,0,0.7) 0%, ${T.card} 55%)`,
                  border: `1px solid ${T.border2}`,
                  borderRadius: 10, padding: '10px 13px',
                  display: 'flex', alignItems: 'center', gap: 11, position: 'relative', overflow: 'hidden',
                }}>
                {/* subtle glow */}
                <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 50% 80% at 0% 50%, ${ratingColor(featuredMovie.rating)}10 0%, transparent 60%)`, pointerEvents: 'none' }} />
                {featuredMovie.thumbnail && (
                  <div style={{ flexShrink: 0, width: 44, height: 66, borderRadius: 5, overflow: 'hidden', border: `1px solid ${T.border2}` }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={featuredMovie.thumbnail} alt={featuredMovie.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 8, fontWeight: 900, padding: '2px 7px', borderRadius: 3, background: T.accent, color: '#fff', letterSpacing: '0.06em' }}>
                      {featuredMovie.badge ?? 'NEW RELEASE'}
                    </span>
                    <span style={{ fontSize: 8.5, color: T.gold, fontWeight: 800 }}>★ {featuredMovie.rating.toFixed(1)}</span>
                  </div>
                  <p style={{ margin: '0 0 2px', fontSize: 13.5, fontWeight: 800, color: T.text, fontFamily: "'Noto Serif', Georgia, serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {featuredMovie.title}
                  </p>
                  <p style={{ margin: 0, fontSize: 10.5, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {featuredMovie.cast?.slice(0, 3).join(' · ')} · {featuredMovie.director}
                  </p>
                </div>
                <ArrowUpRight style={{ width: 13, height: 13, color: T.dim, flexShrink: 0 }} />
              </div>
            </Link>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            HERO GRID — large hero left, trending sidebar right (desktop)
            ════════════════════════════════════════════════════════════════ */}
        <div className="nt-top" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginBottom: 16 }}>

          {/* Left: hero + 2 story tiles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {loading ? (
              <>
                <Skel h={210} r={10} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <Skel h={130} /><Skel h={130} />
                </div>
              </>
            ) : heroItem ? (
              <>
                {/* hero dot nav */}
                {heroPool.length > 1 && (
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                    {heroPool.map((_, i) => (
                      <button key={i} onClick={() => setHeroIdx(i)}
                        style={{ width: i === heroIdx ? 18 : 4, height: 4, borderRadius: 99, background: i === heroIdx ? T.accent : 'rgba(255,255,255,0.14)', border: 'none', cursor: 'pointer', padding: 0, transition: 'width 0.22s ease, background 0.22s ease' }} />
                    ))}
                  </div>
                )}
                <AnimatePresence mode="wait">
                  <motion.div key={heroItem.link}
                    initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}>
                    <HeroCard item={heroItem} idx={heroIdx} />
                  </motion.div>
                </AnimatePresence>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {filtered.slice(1, 3).map((it, i) => <StoryTile key={i} item={it} idx={i} />)}
                </div>
              </>
            ) : null}
          </div>

          {/* Right: trending sidebar (desktop only) */}
          <div className="nt-tend" style={{ display: 'none' }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '13px 13px 10px', position: 'sticky', top: 106 }}>
              <SH label="Trending" color={T.gold} icon={TrendingUp} />
              {loading
                ? Array.from({ length: 9 }).map((_, i) => <div key={i} style={{ marginBottom: 6 }}><Skel h={42} r={4} /></div>)
                : trending.slice(0, 10).map((it, i) => <TrendRow key={i} item={it} rank={i + 1} />)
              }
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            CINEMA STRIP
            ════════════════════════════════════════════════════════════════ */}
        <div style={{ background: `linear-gradient(135deg, rgba(168,85,247,0.09) 0%, ${T.card} 60%)`, border: `1px solid rgba(168,85,247,0.18)`, borderRadius: 10, padding: '13px 13px 14px', marginBottom: 14 }}>
          <SH label="சினிமா" color={T.purple} href="/movies" icon={Film} sub="Latest Tamil releases" />
          {/* desktop grid */}
          <div className="nt-cm-g" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 7 }}>
            {CINEMA.slice(0, 10).map(m => <CinemaCard key={m.id} movie={m} />)}
          </div>
          {/* mobile scroll strip */}
          <div className="nt-cm-s" style={{ display: 'none', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
            {CINEMA.map(m => <div key={m.id} style={{ flexShrink: 0, width: 90 }}><CinemaCard movie={m} /></div>)}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            OTT PLATFORMS
            ════════════════════════════════════════════════════════════════ */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '13px 13px 14px', marginBottom: 14 }}>
          <SH label="OTT Platforms" color={T.teal} href="/ott-plans" icon={Tv2} />
          <div style={{ display: 'flex', gap: 7, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
            {[
              { href: '/ott-plans', label: 'Netflix',  color: '#e50914', icon: 'N' },
              { href: '/ott-plans', label: 'Prime',    color: '#00a8e0', icon: '▶' },
              { href: '/ott-plans', label: 'Disney+',  color: '#0073e6', icon: '★' },
              { href: '/ott-plans', label: 'ZEE5',     color: '#8b5cf6', icon: 'Z' },
              { href: '/ott-plans', label: 'SunNXT',   color: '#f5a623', icon: '☀' },
              { href: '/ott-plans', label: 'YouTube',  color: '#ff0000', icon: '▷' },
            ].map(p => (
              <Link key={p.label} href={p.href}
                style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', padding: '6px 12px', borderRadius: 99, background: T.raised, border: `1px solid ${T.border2}` }}
                className="nt-ott">
                <div style={{ width: 20, height: 20, borderRadius: 5, background: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: '#fff', flexShrink: 0 }}>{p.icon}</div>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: T.text, whiteSpace: 'nowrap' }}>{p.label}</span>
              </Link>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 7, marginTop: 8 }}>
            <Link href="/movies" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, textDecoration: 'none', fontSize: 11, fontWeight: 700, color: T.muted, padding: '8px 0', borderRadius: 7, background: T.raised, border: `1px solid ${T.border2}` }}>
              <Film style={{ width: 10, height: 10 }} /> Tamil Movies
            </Link>
            <Link href="/serials" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, textDecoration: 'none', fontSize: 11, fontWeight: 700, color: T.muted, padding: '8px 0', borderRadius: 7, background: T.raised, border: `1px solid ${T.border2}` }}>
              <Tv2 style={{ width: 10, height: 10 }} /> Tamil Serials
            </Link>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            MAIN FEED + SIDEBAR
            ════════════════════════════════════════════════════════════════ */}
        <div className="nt-low" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>

          {/* News feed */}
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '13px 13px 0' }}>
                <SH
                  label={category === 'all' ? 'செய்திகள்' : CATS.find(c => c.key === category)?.label ?? 'News'}
                  color={T.accent} icon={Newspaper}
                />
              </div>
              {loading ? (
                <div style={{ padding: '0 13px 10px' }}>
                  {Array.from({ length: 10 }).map((_, i) => <div key={i} style={{ marginBottom: 8 }}><Skel h={60} r={4} /></div>)}
                </div>
              ) : (
                <motion.div variants={stagger} initial="hidden" animate="visible" style={{ padding: '0 0 4px' }}>
                  {listItems.map((item, i) => (
                    <div key={item.link + i}>
                      <NewsRow item={item} idx={i} />
                      {(i + 1) % 8 === 0 && (
                        <ins className="adsbygoogle" style={{ display: 'block', margin: '4px 12px' }}
                          data-ad-format="fluid" data-ad-layout-key="-fb+5w+4e-db+86"
                          data-ad-client="ca-pub-4237294630161176" data-ad-slot="auto" />
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
              {!loading && filtered.length > listStart + 24 && (
                <div style={{ padding: '10px 13px 13px' }}>
                  <button onClick={() => setShowMore(s => !s)}
                    style={{ width: '100%', padding: '9px 0', borderRadius: 7, background: T.raised, border: `1px solid ${T.border2}`, color: T.muted, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, transition: 'background 0.12s' }}
                    className="nt-more">
                    {showMore ? 'Show less' : `Load more · ${filtered.length - listStart - 24} more`}
                    <ChevronRight style={{ width: 11, height: 11, transform: showMore ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="nt-side" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '13px 12px' }}>
              <SH label="IPL Live" color={T.green} />
              <div style={{ borderRadius: 7, overflow: 'hidden', border: `1px solid ${T.border}` }}>
                <CricketWidget compact />
              </div>
            </div>
            <div className="nt-tend-m">
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '13px 12px' }}>
                <SH label="Trending" color={T.gold} icon={TrendingUp} />
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => <div key={i} style={{ marginBottom: 6 }}><Skel h={40} r={4} /></div>)
                  : trending.slice(0, 8).map((it, i) => <TrendRow key={i} item={it} rank={i + 1} />)
                }
              </div>
            </div>
            <AdUnit size="rectangle" />
          </div>
        </div>
      </div>

      <TVKSpotlight />

      <div className="nt-w" style={{ paddingBottom: 24 }}>
        <AdUnit size="banner" />
      </div>

      <style>{`
        @keyframes nt-marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes nt-ping    { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.35;transform:scale(1.5)} }
        @keyframes nt-spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes nt-shimmer { 0%{opacity:0.25} 50%{opacity:0.55} 100%{opacity:0.25} }

        /* Wrapper */
        .nt-w { max-width: 1280px; margin: 0 auto; padding-left: 14px; padding-right: 14px; }
        @media(min-width:640px)  { .nt-w { padding-left: 20px; padding-right: 20px; } }
        @media(min-width:1024px) { .nt-w { padding-left: 28px; padding-right: 28px; } }
        .nt-vpad { padding-top: 14px; padding-bottom: 8px; }

        /* Top section — hero + sidebar */
        @media(min-width:960px) {
          .nt-top  { grid-template-columns: 1fr 268px !important; align-items: start; }
          .nt-tend { display: block !important; }
          .nt-tend-m { display: none !important; }
        }

        /* Cinema grid */
        @media(min-width:1024px) { .nt-cm-g { grid-template-columns: repeat(10,1fr) !important; } .nt-cm-s { display:none !important; } }
        @media(min-width:640px) and (max-width:1023px) { .nt-cm-g { grid-template-columns: repeat(5,1fr) !important; } .nt-cm-s { display:none !important; } }
        @media(max-width:639px) { .nt-cm-g { display:none !important; } .nt-cm-s { display:flex !important; } }

        /* Lower grid */
        @media(min-width:960px) { .nt-low { grid-template-columns: 1fr 268px !important; align-items: start; } }

        /* News row — colored left border hover */
        .nt-row { transition: background 0.1s ease; }
        .nt-row:hover { background: rgba(255,255,255,0.035) !important; }

        /* Hero — subtle zoom */
        .nt-hero { transition: transform 0.22s cubic-bezier(.23,1,.32,1); }
        .nt-hero:hover { transform: scale(1.006); }

        /* Story tile fade */
        .nt-tile { transition: opacity 0.14s ease; }
        .nt-tile:hover { opacity: 0.76; }

        /* Cinema card lift */
        .nt-ccard { transition: transform 0.16s ease; }
        .nt-ccard:hover { transform: translateY(-3px); }

        /* OTT chip */
        .nt-ott { transition: opacity 0.12s; }
        .nt-ott:hover { opacity: 0.72; }

        /* Trending row */
        .nt-trow { transition: background 0.1s; }
        .nt-trow:hover { background: rgba(255,255,255,0.03); }

        /* Feature banner */
        .nt-feat { transition: border-color 0.15s, transform 0.15s ease; }
        .nt-feat:hover { border-color: rgba(255,255,255,0.2) !important; transform: translateY(-1px); }

        /* Load more btn */
        .nt-more:hover { background: rgba(255,255,255,0.06) !important; }
      `}</style>
    </div>
  )
}
