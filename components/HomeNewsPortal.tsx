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

// ── Daily rotating accent — same site, fresh feel every visit ────────────────
function getDayAccent() {
  const day = new Date().getDay() // 0-6
  if (day === 0 || day === 3 || day === 6) return { primary: '#f04747', light: '#ff6b6b', name: 'coral' }
  if (day === 1 || day === 4)              return { primary: '#f5a623', light: '#fbbf24', name: 'amber' }
  return                                         { primary: '#14b8a6', light: '#2dd4bf', name: 'teal'  }
}
const ACCENT = getDayAccent()

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:      '#0f0f13',    // warm dark slate
  bg2:     '#15151c',    // card background
  bg3:     '#1c1c26',    // elevated surface
  border:  'rgba(255,255,255,0.07)',
  border2: 'rgba(255,255,255,0.13)',
  text:    '#ededf2',
  sub:     'rgba(237,237,242,0.65)',
  muted:   'rgba(237,237,242,0.38)',
  dim:     'rgba(237,237,242,0.18)',
  accent:  ACCENT.primary,
  accentL: ACCENT.light,
  gold:    '#f5a623',
  purple:  '#9c6fe4',
  green:   '#22c55e',
  blue:    '#3b82f6',
  cinema:  '#6d28d9',  // cinema section tint
}

interface NewsItem {
  title: string; link: string; source: string; sourceLogo: string
  pubDate: string; timeAgo: string; desc: string; imageUrl: string | null; category: string
}
interface ApiResponse { news: NewsItem[]; updatedAt: string; count: number }

const REFRESH_MS   = 6 * 60 * 1000
const CACHE_TTL    = 5 * 60 * 1000
const LS_CACHE_TTL = 30 * 60 * 1000
const LS_KEY       = 'nt_news_ls_v4'
const SS_KEY       = 'nt_news_v6'
const SPORTS_KW    = ['cricket','ipl','csk','dhoni','match','விளையாட்டு','கிரிக்கெட்']

const SRC: Record<string, string> = {
  'Dinamalar': '#e53935', 'Maalaimalar': '#7c3aed', 'OneIndia Tamil': '#0288d1',
  'The Hindu Tamil': '#1565c0', 'Vikatan': '#e65100', 'Puthiya Thalaimurai': '#c62828',
  'Sun News': '#f5a623', 'Polimer News': '#2e7d32', 'NammaTVK': '#f5a623',
  'Kalaignar News': '#b71c1c', 'Thanthi TV': '#e65100', 'NDTV India': '#b71c1c',
}

const CATS = [
  { key: 'all',      label: 'அனைத்தும்',   icon: Radio,   color: T.accent },
  { key: 'tvk',      label: 'TVK 2026',    icon: Zap,     color: T.gold,   badge: 'LIVE' },
  { key: 'politics', label: 'அரசியல்',     icon: Flame,   color: '#f97316' },
  { key: 'cinema',   label: 'சினிமா',      icon: Film,    color: T.purple },
  { key: 'sports',   label: 'விளையாட்டு',  icon: Trophy,  color: T.green },
]

const OTT_PLATFORMS = [
  { href: '/ott-plans', label: 'Netflix',   icon: 'N', color: '#e50914' },
  { href: '/ott-plans', label: 'Prime',     icon: '▶', color: '#00a8e0' },
  { href: '/ott-plans', label: 'Disney+',   icon: '★', color: '#0073e6' },
  { href: '/ott-plans', label: 'ZEE5',      icon: 'Z', color: '#8b5cf6' },
  { href: '/ott-plans', label: 'SunNXT',    icon: '☀', color: '#f5a623' },
  { href: '/ott-plans', label: 'YouTube',   icon: '▷', color: '#ff0000' },
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
  if (r >= 8) return '#22c55e'; if (r >= 7) return '#f5a623'; if (r >= 6) return '#fb923c'; return '#f87171'
}

// ── Ticker ─────────────────────────────────────────────────────────────────────
function Ticker({ items }: { items: NewsItem[] }) {
  if (!items.length) return null
  const heads = items.slice(0, 16).map(n => n.title)
  return (
    <div style={{ background: T.accent, overflow: 'hidden', display: 'flex', alignItems: 'center', height: 32 }}>
      <div style={{ flexShrink: 0, padding: '0 14px', height: '100%', display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.2)', fontSize: 9, fontWeight: 900, color: '#fff', letterSpacing: '0.18em', whiteSpace: 'nowrap' }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff', display: 'inline-block', animation: 'ping 1.5s ease-in-out infinite' }} />
        LIVE
      </div>
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 48, whiteSpace: 'nowrap', fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.95)', animation: 'marquee 120s linear infinite', paddingLeft: 20 }}>
          {[...heads, ...heads].map((h, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 5, opacity: 0.7 }}>◆</span>{h}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Section header — colored top border ────────────────────────────────────────
function SH({ label, color = T.accent, href, icon: Icon, sub }: { label: string; color?: string; href?: string; icon?: React.ElementType; sub?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', paddingBottom: 10, marginBottom: 14, borderBottom: `1px solid ${T.border}`, position: 'relative' }}>
      {/* colored left accent */}
      <div style={{ width: 3, height: 18, borderRadius: 2, background: color, marginRight: 10, flexShrink: 0 }} />
      {Icon && <Icon style={{ width: 12, height: 12, color, marginRight: 5, flexShrink: 0 }} />}
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 12, fontWeight: 900, color: T.text, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
        {sub && <span style={{ fontSize: 9.5, color: T.muted, marginLeft: 8 }}>{sub}</span>}
      </div>
      {href && (
        <Link href={href} style={{ fontSize: 10.5, color: color, textDecoration: 'none', opacity: 0.8, display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          More <ChevronRight style={{ width: 9, height: 9 }} />
        </Link>
      )}
    </div>
  )
}

// ── Source badge ───────────────────────────────────────────────────────────────
function SrcBadge({ source }: { source: string }) {
  const c = SRC[source] ?? '#666'
  return <span style={{ fontSize: 8.5, fontWeight: 800, padding: '2px 6px', borderRadius: 3, background: c, color: '#fff', whiteSpace: 'nowrap', flexShrink: 0, letterSpacing: '0.02em' }}>{source.slice(0, 11)}</span>
}

// ── Hero card — 3:2 ratio, tall on mobile ──────────────────────────────────────
function HeroCard({ item }: { item: NewsItem }) {
  const c = SRC[item.source] ?? '#444'
  const [err, setErr] = useState(false)
  return (
    <a href={goLink(item.link, 'hero')} target="_blank" rel="noopener noreferrer"
      style={{ display: 'block', textDecoration: 'none', position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: '4/3' }}
      className="nt-hero"
    >
      <div style={{ position: 'absolute', inset: 0 }}>
        {item.imageUrl && !err
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={item.imageUrl} alt={item.title} loading="eager" fetchPriority="high" decoding="async"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setErr(true)} />
          : <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${c}55 0%, #15151c 55%)` }} />
        }
        {/* Bottom gradient scrim */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.93) 0%, rgba(0,0,0,0.6) 38%, rgba(0,0,0,0.05) 72%)' }} />
        {/* Top fade */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 60, background: 'linear-gradient(to bottom, rgba(0,0,0,0.4), transparent)' }} />
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '18px 16px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9, flexWrap: 'wrap' }}>
          <SrcBadge source={item.source} />
          {item.category !== 'general' && (
            <span style={{ fontSize: 8.5, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.category}</span>
          )}
          <span style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(255,255,255,0.42)', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Clock style={{ width: 8, height: 8 }} />{item.timeAgo}
          </span>
        </div>
        <h2 style={{ margin: 0, fontFamily: "'Noto Serif', Georgia, serif", fontSize: 'clamp(16px, 4.5vw, 24px)', fontWeight: 800, lineHeight: 1.22, color: '#fff', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', letterSpacing: '-0.01em', textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
          {item.title}
        </h2>
      </div>
    </a>
  )
}

// ── Story card — for 2nd and 3rd top stories ──────────────────────────────────
function StoryCard({ item, size = 'md' }: { item: NewsItem; size?: 'sm' | 'md' }) {
  const c = SRC[item.source] ?? '#444'
  const [err, setErr] = useState(false)
  const isSmall = size === 'sm'
  return (
    <a href={goLink(item.link, 'story')} target="_blank" rel="noopener noreferrer"
      style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none' }}
      className="nt-story"
    >
      {/* image */}
      <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', marginBottom: 8, aspectRatio: '16/9' }}>
        {item.imageUrl && !err
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={item.imageUrl} alt={item.title} loading="lazy" decoding="async"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setErr(true)} />
          : <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${c}45 0%, ${T.bg3} 60%)` }} />
        }
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 50%)' }} />
        <div style={{ position: 'absolute', bottom: 5, left: 6 }}><SrcBadge source={item.source} /></div>
      </div>
      <p style={{ margin: '0 0 5px', fontFamily: "'Noto Serif', Georgia, serif", fontSize: isSmall ? 12 : 13, fontWeight: 700, color: T.text, lineHeight: 1.36, display: '-webkit-box', WebkitLineClamp: isSmall ? 2 : 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {item.title}
      </p>
      <span style={{ fontSize: 9.5, color: T.muted, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Clock style={{ width: 7, height: 7 }} />{item.timeAgo}
      </span>
    </a>
  )
}

// ── News row — readable, not cramped ──────────────────────────────────────────
function NewsRow({ item, idx }: { item: NewsItem; idx: number }) {
  const c = SRC[item.source] ?? '#555'
  const [err, setErr] = useState(false)
  const hot = idx < 3
  return (
    <a href={goLink(item.link, 'news-list')} target="_blank" rel="noopener noreferrer"
      className="nt-row"
      style={{ display: 'flex', alignItems: 'flex-start', gap: 10, textDecoration: 'none', padding: '10px 12px', borderRadius: 8, marginBottom: 4 }}
    >
      {/* rank */}
      <span style={{ flexShrink: 0, fontSize: 13, fontWeight: 900, color: hot ? T.accent : T.dim, width: 18, paddingTop: 2, fontFamily: 'Georgia, serif', textAlign: 'right' }}>{idx + 1}</span>
      {/* text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: '0 0 5px', fontSize: 13.5, fontWeight: 650, color: T.text, lineHeight: 1.42, fontFamily: "'Noto Serif', Georgia, serif", display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {item.title}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: c }}>{item.source}</span>
          {item.category !== 'general' && (
            <span style={{ fontSize: 8.5, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: `${c}1a`, color: c, border: `1px solid ${c}30` }}>{item.category}</span>
          )}
          <span style={{ fontSize: 9.5, color: T.muted, display: 'flex', alignItems: 'center', gap: 2, marginLeft: 'auto' }}>
            <Clock style={{ width: 7, height: 7 }} />{item.timeAgo}
          </span>
        </div>
      </div>
      {/* thumb — larger */}
      <div style={{ flexShrink: 0, width: 80, height: 60, borderRadius: 7, overflow: 'hidden', background: `${c}18` }}>
        {item.imageUrl && !err
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={item.imageUrl} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setErr(true)} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Newspaper style={{ width: 16, height: 16, color: `${c}40` }} />
            </div>
        }
      </div>
    </a>
  )
}

// ── Trending row ───────────────────────────────────────────────────────────────
function TrendRow({ item, rank }: { item: NewsItem; rank: number }) {
  const c = SRC[item.source] ?? '#555'
  return (
    <a href={goLink(item.link, 'trending')} target="_blank" rel="noopener noreferrer"
      className="nt-trow"
      style={{ display: 'flex', gap: 9, textDecoration: 'none', padding: '8px 0', borderBottom: `1px solid ${T.border}`, alignItems: 'flex-start' }}
    >
      <span style={{ flexShrink: 0, fontSize: 13, fontWeight: 900, color: rank <= 3 ? T.accent : T.dim, width: 20, textAlign: 'right', fontFamily: 'Georgia, serif' }}>{rank}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: T.sub, lineHeight: 1.35, margin: '0 0 4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.title}</p>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: c }}>{item.source}</span>
          <span style={{ fontSize: 9, color: T.muted }}>{item.timeAgo}</span>
        </div>
      </div>
    </a>
  )
}

// ── Cinema card — poster 2:3 ───────────────────────────────────────────────────
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
        <div style={{ borderRadius: 8, overflow: 'hidden', background: T.bg3, border: `1px solid ${T.border}` }}>
          <div style={{ aspectRatio: '2/3', position: 'relative', overflow: 'hidden' }}>
            {hasThumb
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={movie.thumbnail} alt={movie.title} loading="lazy" decoding="async"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  onError={() => setErr(true)} />
              : <div style={{ width: '100%', height: '100%', background: `linear-gradient(160deg, ${ratingC}30 0%, ${T.bg3} 55%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Play style={{ width: 20, height: 20, color: `${ratingC}50` }} />
                </div>
            }
            {movie.rating > 0 && (
              <div style={{ position: 'absolute', top: 5, left: 5, display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(0,0,0,0.8)', borderRadius: 4, padding: '2px 6px' }}>
                <Star style={{ width: 8, height: 8, color: ratingC, fill: ratingC }} />
                <span style={{ fontSize: 9, fontWeight: 900, color: ratingC }}>{movie.rating.toFixed(1)}</span>
              </div>
            )}
            {isOtt && ottColor && (
              <div style={{ position: 'absolute', top: 5, right: 5, fontSize: 7.5, fontWeight: 900, padding: '2px 5px', borderRadius: 3, background: ottColor, color: '#fff', maxWidth: 52, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {platform}
              </div>
            )}
          </div>
          <div style={{ padding: '6px 8px 8px' }}>
            <p style={{ fontSize: 10.5, fontWeight: 700, color: T.text, lineHeight: 1.3, margin: '0 0 2px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontFamily: "'Noto Serif', Georgia, serif" }}>{movie.title}</p>
          </div>
        </div>
      </Link>
    </div>
  )
}

// ── OTT chip ───────────────────────────────────────────────────────────────────
function OttChip({ href, label, icon, color }: { href: string; label: string; icon: string; color: string }) {
  return (
    <Link href={href} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, textDecoration: 'none', padding: '8px 14px', borderRadius: 99, background: T.bg3, border: `1px solid ${T.border2}` }}
      className="nt-ott">
      <div style={{ width: 22, height: 22, borderRadius: 6, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: '#fff', flexShrink: 0 }}>{icon}</div>
      <span style={{ fontSize: 12, fontWeight: 700, color: T.text, whiteSpace: 'nowrap' }}>{label}</span>
    </Link>
  )
}

function Skel({ h = 50, r = 6 }: { h?: number; r?: number }) {
  return <div style={{ height: h, borderRadius: r, background: 'rgba(255,255,255,0.05)', animation: 'shimmer 1.6s ease-in-out infinite' }} />
}

// ── Info bar — date, story count, Chennai time, theme ────────────────────────
function InfoBar({ newsCount, accent, accentName }: { newsCount: number; accent: string; accentName: string }) {
  const now = new Date()
  const dateStr = now.toLocaleDateString('ta-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })
  const dayOfWeek = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][now.getDay()]
  // Tamil Nadu day name
  const tamilDay: Record<string, string> = { Sun: 'ஞாயிறு', Mon: 'திங்கள்', Tue: 'செவ்வாய்', Wed: 'புதன்', Thu: 'வியாழன்', Fri: 'வெள்ளி', Sat: 'சனி' }
  const tDay = tamilDay[dayOfWeek]

  return (
    <div style={{ background: '#0c0c10', borderBottom: `1px solid ${T.border}` }}>
      <div className="nt-w" style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '6px 0', flexWrap: 'wrap' }}>
        {/* Date + day */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: T.text, whiteSpace: 'nowrap' }}>
            {tDay} · {now.getDate()} {now.toLocaleDateString('en-IN', { month: 'short' })} {now.getFullYear()}
          </span>
          <span style={{ fontSize: 10, color: T.muted, whiteSpace: 'nowrap' }}>{timeStr} IST</span>
        </div>
        {/* Stats pills */}
        <div className="nt-infobar-stats" style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {newsCount > 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: `${accent}18`, color: accent, border: `1px solid ${accent}35`, whiteSpace: 'nowrap' }}>
              {newsCount} செய்திகள்
            </span>
          )}
          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: 'rgba(255,255,255,0.05)', color: T.muted, border: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>
            📍 Chennai
          </span>
          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: `${accent}10`, color: accent, border: `1px solid ${accent}25`, whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
            ◉ {accentName}
          </span>
        </div>
      </div>
    </div>
  )
}

const TVK_PROMO: NewsItem = {
  title: 'Thalapathy Vijay — TVK கட்சி | Tamil Nadu CM Race 2026',
  desc: '', link: 'https://en.wikipedia.org/wiki/Tamilaga_Vettri_Kazhagam',
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
      try { const ss = sessionStorage.getItem(SS_KEY); if (ss) { const { d, at } = JSON.parse(ss); if (Date.now() - at < CACHE_TTL) { setData(d); setLoading(false); return } } } catch { /* ignore */ }
      try { const ls = localStorage.getItem(LS_KEY); if (ls) { const { d, at } = JSON.parse(ls); if (Date.now() - at < LS_CACHE_TTL) { setData(d); setLoading(false) } } } catch { /* ignore */ }
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
        <div style={{ background: T.bg2, borderBottom: `1px solid ${T.border}`, position: 'sticky', top: 56, zIndex: 40, backdropFilter: 'blur(12px)' }}>
          <div className="nt-w" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', overflowX: 'auto', scrollbarWidth: 'none', gap: 3, padding: '9px 0' }}>
              {CATS.map(cat => {
                const active = category === cat.key
                const Ic = cat.icon
                return (
                  <button key={cat.key}
                    onClick={() => { setCat(cat.key as typeof category); setShowMore(false) }}
                    style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', fontSize: 12, fontWeight: active ? 800 : 500, color: active ? '#fff' : T.muted, background: active ? cat.color : 'transparent', border: `1px solid ${active ? 'transparent' : T.border}`, borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.12s' }}
                  >
                    <Ic style={{ width: 11, height: 11 }} />
                    {cat.label}
                    {'badge' in cat && cat.badge && (
                      <span style={{ fontSize: 7.5, fontWeight: 900, padding: '1px 4px', borderRadius: 2, background: 'rgba(255,255,255,0.2)', color: '#fff' }}>{cat.badge}</span>
                    )}
                  </button>
                )
              })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <span style={{ fontSize: 9.5, color: T.dim }}>{refreshing ? '…' : freshLabel}</span>
              <button onClick={() => fetchNews(true)} disabled={refreshing}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.dim, padding: 3, lineHeight: 0 }}>
                <RefreshCw style={{ width: 11, height: 11, animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              </button>
              <VisitorCounter />
            </div>
          </div>
        </div>

        {/* ── INFO BAR — date + quick stats + today theme ────────────────── */}
        <InfoBar newsCount={all.length} accent={T.accent} accentName={ACCENT.name} />

        <div className="nt-w nt-vpad">

          {/* ══════════════════════════════════════════════════════════════════
              TOP ZONE — all visible before scroll
              Mobile:  hero full-width → 2 mini cards side by side
              Desktop: [hero 2col | story-stack 1col | trending 1col]  4-col grid
              ══════════════════════════════════════════════════════════════════ */}

          {/* ── Mobile top: hero + 2 side-by-side mini cards ─────────────────── */}
          <div className="nt-mob-top" style={{ marginBottom: 16 }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Skel h={200} r={10} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <Skel h={110} /><Skel h={110} />
                </div>
              </div>
            ) : heroItem ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {heroPool.length > 1 && (
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                    {heroPool.map((_, i) => (
                      <button key={i} onClick={() => setHeroIdx(i)}
                        style={{ width: i === heroIdx ? 20 : 4, height: 4, borderRadius: 99, background: i === heroIdx ? T.accent : 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', padding: 0, transition: 'width 0.25s ease' }} />
                    ))}
                  </div>
                )}
                <AnimatePresence mode="wait">
                  <motion.div key={heroItem.link} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                    <HeroCard item={heroItem} />
                  </motion.div>
                </AnimatePresence>
                {/* 2 mini cards immediately below hero — visible before scroll */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {filtered.slice(1, 3).map((it, i) => <StoryCard key={i} item={it} size="sm" />)}
                </div>
              </div>
            ) : null}
          </div>

          {/* ── Desktop top: 4-col grid (all above fold) ─────────────────────── */}
          <div className="nt-desk-top" style={{ display: 'none', gap: 12, marginBottom: 18 }}>

            {/* Hero — spans 2 cols */}
            <div className="nt-hero-col">
              {loading ? <Skel h={340} r={10} /> : heroItem ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%' }}>
                  {heroPool.length > 1 && (
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      {heroPool.map((_, i) => (
                        <button key={i} onClick={() => setHeroIdx(i)}
                          style={{ width: i === heroIdx ? 20 : 4, height: 4, borderRadius: 99, background: i === heroIdx ? T.accent : 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', padding: 0, transition: 'width 0.25s ease' }} />
                      ))}
                    </div>
                  )}
                  <AnimatePresence mode="wait">
                    <motion.div key={heroItem.link} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} style={{ flex: 1 }}>
                      <HeroCard item={heroItem} />
                    </motion.div>
                  </AnimatePresence>
                </div>
              ) : null}
            </div>

            {/* Story stack — 2 cards vertically */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {loading
                ? <><Skel h={160} r={8} /><Skel h={160} r={8} /></>
                : filtered.slice(1, 3).map((it, i) => <StoryCard key={i} item={it} />)
              }
            </div>

            {/* Trending sidebar */}
            <div>
              <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 14px 10px', position: 'sticky', top: 108 }}>
                <SH label="Trending" color={T.gold} icon={TrendingUp} />
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => <Skel key={i} h={44} r={4} />)
                  : trending.slice(0, 10).map((it, i) => <TrendRow key={i} item={it} rank={i + 1} />)
                }
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              CINEMA — cinema-tinted section
              ══════════════════════════════════════════════════════════════════ */}
          <div style={{ background: `linear-gradient(135deg, rgba(109,40,217,0.12) 0%, ${T.bg2} 60%)`, border: `1px solid rgba(109,40,217,0.2)`, borderRadius: 12, padding: '14px 14px 16px', marginBottom: 16 }}>
            <SH label="சினிமா" color={T.purple} href="/movies" icon={Film} sub="Tamil releases 2024–2026" />
            <div className="nt-cm-g" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
              {CINEMA.map(m => <CinemaCard key={m.id} movie={m} />)}
            </div>
            <div className="nt-cm-s" style={{ display: 'none', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
              {CINEMA.map(m => <div key={m.id} style={{ flexShrink: 0, width: 100 }}><CinemaCard movie={m} /></div>)}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              OTT — pill chips row
              ══════════════════════════════════════════════════════════════════ */}
          <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 14px 16px', marginBottom: 16 }}>
            <SH label="OTT Platforms" color={T.blue} href="/ott-plans" icon={Tv2} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              {OTT_PLATFORMS.map(p => <OttChip key={p.label} {...p} />)}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <Link href="/movies" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, textDecoration: 'none', fontSize: 11.5, fontWeight: 700, color: T.muted, padding: '9px 0', borderRadius: 8, background: T.bg3, border: `1px solid ${T.border2}` }}>
                <Film style={{ width: 11, height: 11 }} /> Tamil Movies
              </Link>
              <Link href="/serials" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, textDecoration: 'none', fontSize: 11.5, fontWeight: 700, color: T.muted, padding: '9px 0', borderRadius: 8, background: T.bg3, border: `1px solid ${T.border2}` }}>
                <Tv2 style={{ width: 11, height: 11 }} /> Tamil Serials
              </Link>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              NEWS FEED + SIDEBAR
              ══════════════════════════════════════════════════════════════════ */}
          <div className="nt-low" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>

            {/* News list */}
            <div>
              <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 4px 10px' }}>
                <div style={{ padding: '0 10px' }}>
                  <SH label={category === 'all' ? 'Latest News' : CATS.find(c => c.key === category)?.label ?? 'News'} color={T.accent} icon={Newspaper} />
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
                  <div style={{ padding: '10px 12px 2px' }}>
                    <button onClick={() => setShowMore(s => !s)}
                      style={{ width: '100%', padding: '10px 0', borderRadius: 8, background: T.bg3, border: `1px solid ${T.border2}`, color: T.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      {showMore ? <><ChevronLeft style={{ width: 12, height: 12 }} /> Show less</> : <>Load more <ChevronRight style={{ width: 12, height: 12 }} /></>}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="nt-side" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 12px' }}>
                <SH label="IPL Live" color={T.green} />
                <div style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${T.border}` }}>
                  <CricketWidget compact />
                </div>
              </div>
              <div className="nt-tend-m">
                <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 12px' }}>
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

        <div className="nt-w" style={{ paddingBottom: 28 }}>
          <AdUnit size="banner" />
        </div>

        <style>{`
          @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
          @keyframes ping    { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(1.5)} }
          @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
          @keyframes shimmer { 0%{opacity:0.3} 50%{opacity:0.65} 100%{opacity:0.3} }

          /* ── Wrapper ──────────────────────── */
          .nt-w { max-width: 1280px; margin: 0 auto; padding-left: 14px; padding-right: 14px; }
          @media(min-width:640px)  { .nt-w { padding-left: 20px; padding-right: 20px; } }
          @media(min-width:1024px) { .nt-w { padding-left: 28px; padding-right: 28px; } }
          .nt-vpad { padding-top: 16px; padding-bottom: 8px; }

          /* ── Mobile/desktop top zone toggle ── */
          .nt-mob-top  { display: block; }
          .nt-desk-top { display: none !important; }
          @media(min-width:960px) {
            .nt-mob-top  { display: none !important; }
            .nt-desk-top { display: grid !important; grid-template-columns: 2fr 1fr 1fr; align-items: start; }
            .nt-hero-col { /* hero spans naturally as 2fr */ }
            .nt-tend-m   { display: none !important; }
          }

          /* ── Hero — 4:3 mobile, 16:9 desktop ── */
          @media(min-width:640px) { .nt-hero { aspect-ratio: 16/9 !important; } }
          @media(min-width:960px)  { .nt-hero { aspect-ratio: unset !important; min-height: 320px; height: 100%; } }

          /* ── Cinema ───────────────────────── */
          @media(min-width:960px)  { .nt-cm-g { grid-template-columns: repeat(12,1fr) !important; } .nt-cm-s { display:none !important; } }
          @media(min-width:600px) and (max-width:959px) { .nt-cm-g { grid-template-columns: repeat(6,1fr) !important; } .nt-cm-s { display:none !important; } }
          @media(max-width:599px)  { .nt-cm-g { display:none !important; } .nt-cm-s { display:flex !important; } }

          /* ── Lower grid ───────────────────── */
          @media(min-width:960px) { .nt-low { grid-template-columns: 1fr 280px !important; align-items: start; } }

          /* ── Hover / interaction ──────────── */
          .nt-hero  { transition: transform 0.2s cubic-bezier(.23,1,.32,1); }
          .nt-hero:hover { transform: scale(1.007); }
          .nt-story { transition: opacity 0.15s; }
          .nt-story:hover { opacity: 0.78; }
          .nt-row   { transition: background 0.1s; }
          .nt-row:hover { background: rgba(255,255,255,0.04); }
          .nt-trow  { transition: background 0.1s; }
          .nt-trow:hover { background: rgba(255,255,255,0.03); }
          .nt-ccard { transition: transform 0.15s ease; }
          .nt-ccard:hover { transform: translateY(-4px); }
          .nt-ott   { transition: opacity 0.12s; }
          .nt-ott:hover { opacity: 0.75; }
        `}</style>
      </div>
    </div>
  )
}
