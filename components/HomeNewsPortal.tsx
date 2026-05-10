'use client'

/**
 * HomeNewsPortal — full editorial news-portal homepage
 * Layout: ticker → category nav → hero grid → 3-col (feed | trending | sidebar) → entertainment
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  RefreshCw, ExternalLink, Newspaper, Search, X,
  TrendingUp, Tv2, Film, Music, Play, Trophy, Radio,
  ChevronRight, Clock, Flame, Zap,
} from 'lucide-react'
import { goLink } from '@/lib/goLink'
import CricketWidget from '@/components/CricketWidget'
import AdUnit from '@/components/AdUnit'
import VisitorCounter from '@/components/VisitorCounter'

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

interface ApiResponse {
  news: NewsItem[]
  updatedAt: string
  count: number
}

const REFRESH_MS = 6 * 60 * 1000

const SOURCE_COLORS: Record<string, string> = {
  'Dinamalar':            '#e11d48',
  'Maalaimalar':          '#7c3aed',
  'OneIndia Tamil':       '#0891b2',
  'The Hindu Tamil':      '#1d4ed8',
  'Vikatan':              '#d97706',
  'Puthiya Thalaimurai':  '#dc2626',
  'Sun News':             '#f59e0b',
  'Polimer News':         '#16a34a',
  'NDTV India':           '#dc2626',
  'India Today':          '#d97706',
}

const CATEGORIES = [
  { key: 'all',      label: 'All News',  icon: Radio,       color: '#f87171' },
  { key: 'politics', label: 'Politics',  icon: Zap,         color: '#fbbf24' },
  { key: 'cinema',   label: 'Cinema',    icon: Film,        color: '#a78bfa' },
  { key: 'sports',   label: 'Sports',    icon: Trophy,      color: '#4ade80' },
]

// ── Ticker ────────────────────────────────────────────────────────────────────
function NewsTicker({ items }: { items: NewsItem[] }) {
  const ref = useRef<HTMLDivElement>(null)
  if (!items.length) return null
  const headlines = items.slice(0, 10).map(n => n.title)

  return (
    <div
      style={{
        background: 'rgba(239,68,68,0.08)',
        borderBottom: '1px solid rgba(239,68,68,0.15)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        height: 32,
      }}
    >
      <div
        style={{
          flexShrink: 0,
          padding: '0 14px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: '#ef4444',
          fontSize: 10,
          fontWeight: 900,
          color: '#fff',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff', display: 'inline-block', animation: 'ping 1.5s ease-in-out infinite' }} />
        LIVE
      </div>
      <div ref={ref} style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div
          style={{
            display: 'flex',
            gap: 48,
            whiteSpace: 'nowrap',
            fontSize: 11,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.75)',
            animation: 'marquee 60s linear infinite',
            paddingLeft: 24,
          }}
        >
          {[...headlines, ...headlines].map((h, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: '#ef4444', fontSize: 10 }}>●</span>
              {h}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Hero lead story ────────────────────────────────────────────────────────────
function HeroStory({ item }: { item: NewsItem }) {
  const color = SOURCE_COLORS[item.source] ?? '#6b7280'
  return (
    <a
      href={goLink(item.link, 'hero')}
      target="_blank"
      rel="noopener noreferrer"
      style={{ display: 'block', textDecoration: 'none', borderRadius: 20, overflow: 'hidden', position: 'relative', aspectRatio: '16/9' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.01)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
    >
      <div style={{ position: 'absolute', inset: 0 }}>
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(245,158,11,0.1))' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(5,5,16,0.97) 0%, rgba(5,5,16,0.6) 50%, rgba(5,5,16,0.1) 100%)' }} />
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 99, background: `${color}22`, color, border: `1px solid ${color}35`, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {item.source}
          </span>
          {item.category !== 'all' && (
            <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {item.category}
            </span>
          )}
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: 3, marginLeft: 'auto' }}>
            <Clock style={{ width: 9, height: 9 }} />{item.timeAgo}
          </span>
        </div>
        <h2 style={{ fontSize: 'clamp(15px, 2.2vw, 20px)', fontWeight: 900, color: '#fff', lineHeight: 1.35, margin: 0, letterSpacing: '-0.01em' }}>
          {item.title}
        </h2>
        {item.desc && (
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, margin: '8px 0 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {item.desc}
          </p>
        )}
      </div>
    </a>
  )
}

// ── Secondary story (smaller hero card) ──────────────────────────────────────
function SecondaryStory({ item }: { item: NewsItem }) {
  const color = SOURCE_COLORS[item.source] ?? '#6b7280'
  return (
    <a
      href={goLink(item.link, 'secondary')}
      target="_blank"
      rel="noopener noreferrer"
      style={{ display: 'block', textDecoration: 'none', borderRadius: 14, overflow: 'hidden', position: 'relative', aspectRatio: '4/3', transition: 'transform 0.2s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
    >
      <div style={{ position: 'absolute', inset: 0 }}>
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${color}18, rgba(5,5,16,0.8))` }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(5,5,16,0.95) 0%, rgba(5,5,16,0.3) 60%, transparent 100%)' }} />
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 14px' }}>
        <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 99, background: `${color}22`, color, border: `1px solid ${color}30`, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'inline-block', marginBottom: 6 }}>
          {item.source}
        </span>
        <p style={{ fontSize: 12, fontWeight: 800, color: '#fff', lineHeight: 1.35, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {item.title}
        </p>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', display: 'block', marginTop: 6 }}>{item.timeAgo}</span>
      </div>
    </a>
  )
}

// ── News list card ─────────────────────────────────────────────────────────────
function NewsCard({ item, rank }: { item: NewsItem; rank?: number }) {
  const color = SOURCE_COLORS[item.source] ?? '#6b7280'
  return (
    <a
      href={goLink(item.link, 'news-list')}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex', gap: 12, textDecoration: 'none',
        borderRadius: 12, padding: '11px 12px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        transition: 'all 0.15s',
        alignItems: 'flex-start',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
        e.currentTarget.style.borderColor = `${color}30`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
      }}
    >
      {rank !== undefined && (
        <div style={{ flexShrink: 0, width: 20, height: 20, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {rank}
        </div>
      )}
      <div style={{ flexShrink: 0, width: 72, height: 54, borderRadius: 8, overflow: 'hidden', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        ) : (
          <Newspaper style={{ width: 18, height: 18, color: 'rgba(255,255,255,0.1)' }} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#f4f4f5', lineHeight: 1.4, margin: '0 0 5px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {item.title}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 99, background: `${color}18`, color, border: `1px solid ${color}28` }}>
            {item.source}
          </span>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Clock style={{ width: 8, height: 8 }} />{item.timeAgo}
          </span>
          <ExternalLink style={{ width: 9, height: 9, color: 'rgba(255,255,255,0.1)', marginLeft: 'auto' }} />
        </div>
      </div>
    </a>
  )
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ h = 60, w = '100%', radius = 8 }: { h?: number; w?: number | string; radius?: number }) {
  return <div style={{ height: h, width: w, borderRadius: radius, background: 'rgba(255,255,255,0.04)', animation: 'shimmer 1.5s infinite' }} />
}

// ── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ icon: Icon, label, color, action, onAction }: { icon: React.ElementType; label: string; color: string; action?: string; onAction?: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ width: 3, height: 18, borderRadius: 99, background: color, flexShrink: 0 }} />
      <Icon style={{ width: 13, height: 13, color, flexShrink: 0 }} />
      <span style={{ fontSize: 12, fontWeight: 900, color: '#fff', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</span>
      {action && onAction && (
        <button onClick={onAction} style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <RefreshCw style={{ width: 10, height: 10 }} />{action}
        </button>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function HomeNewsPortal() {
  const [data, setData]           = useState<ApiResponse | null>(null)
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefresh]  = useState(false)
  const [category, setCategory]   = useState<'all' | 'politics' | 'cinema' | 'sports'>('all')
  const [showMore, setShowMore]   = useState(false)
  const [secAgo, setSecAgo]       = useState(0)

  const fetchNews = useCallback(async (manual = false) => {
    if (manual) setRefresh(true)
    try {
      const res = await fetch('/api/tamil-media-news', { cache: 'no-store', signal: AbortSignal.timeout(14000) })
      if (!res.ok) return
      const json: ApiResponse = await res.json()
      setData(json)
      setSecAgo(0)
      setShowMore(false)
    } catch { /* keep stale */ }
    finally { setLoading(false); setRefresh(false) }
  }, [])

  useEffect(() => {
    fetchNews()
    const d = setInterval(fetchNews, REFRESH_MS)
    const t = setInterval(() => setSecAgo(s => s + 1), 1000)
    return () => { clearInterval(d); clearInterval(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const all = data?.news ?? []
  const filtered = category === 'all' ? all : all.filter(n => n.category === category)
  const hero = filtered[0] ?? null
  const secondary = filtered.slice(1, 4)
  const listItems = showMore ? filtered.slice(4) : filtered.slice(4, 16)
  const trending = [...all].sort(() => Math.random() - 0.5).slice(0, 8) // randomise for "trending" feel

  const freshLabel = secAgo < 60 ? `${secAgo}s ago` : `${Math.floor(secAgo / 60)}m ago`

  return (
    <div style={{ minHeight: '100vh', background: '#050510' }}>

      {/* ── LIVE TICKER ──────────────────────────────────────────────── */}
      {!loading && <NewsTicker items={all} />}

      {/* ── CATEGORY NAV ─────────────────────────────────────────────── */}
      <div style={{ background: 'rgba(255,255,255,0.015)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {CATEGORIES.map(cat => {
              const active = category === cat.key
              const Icon = cat.icon
              return (
                <button
                  key={cat.key}
                  onClick={() => { setCategory(cat.key as typeof category); setShowMore(false) }}
                  style={{
                    flexShrink: 0,
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '10px 14px',
                    fontSize: 11, fontWeight: active ? 800 : 600,
                    color: active ? cat.color : 'rgba(255,255,255,0.4)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    borderBottom: active ? `2px solid ${cat.color}` : '2px solid transparent',
                    transition: 'all 0.15s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Icon style={{ width: 12, height: 12 }} />
                  {cat.label}
                </button>
              )
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, padding: '8px 0' }}>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', whiteSpace: 'nowrap' }}>
              {refreshing ? 'Refreshing…' : `Updated ${freshLabel}`}
            </span>
            <button
              onClick={() => fetchNews(true)}
              disabled={refreshing}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', padding: 4, lineHeight: 0 }}
            >
              <RefreshCw style={{ width: 11, height: 11, animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            </button>
            <VisitorCounter />
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>

          {/* ── HERO GRID ─────────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: 12 }} className="hero-grid">
            {loading ? (
              <>
                <Skeleton h={280} radius={20} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  <Skeleton h={160} radius={14} />
                  <Skeleton h={160} radius={14} />
                  <Skeleton h={160} radius={14} />
                </div>
              </>
            ) : hero ? (
              <>
                <HeroStory item={hero} />
                {secondary.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(secondary.length, 3)}, 1fr)`, gap: 10 }}>
                    {secondary.map((item, i) => <SecondaryStory key={i} item={item} />)}
                  </div>
                )}
              </>
            ) : null}
          </div>

          {/* ── 3-COL: news feed | trending | sidebar ─────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }} className="three-col">

            {/* ── LEFT: news list ───────────────────────────────────── */}
            <div>
              <SectionLabel
                icon={Flame}
                label={category === 'all' ? 'Latest News' : CATEGORIES.find(c => c.key === category)?.label ?? 'News'}
                color="#f87171"
                action={refreshing ? 'Refreshing…' : undefined}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} h={72} radius={12} />)
                  : listItems.map((item, i) => <NewsCard key={i} item={item} />)
                }
              </div>
              {!loading && filtered.length > 20 && (
                <button
                  onClick={() => setShowMore(s => !s)}
                  style={{
                    marginTop: 14, width: '100%', padding: '11px 0', borderRadius: 10,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)' }}
                >
                  {showMore ? 'Show Less' : `Load More (${filtered.length - 16} more stories)`}
                </button>
              )}
            </div>

            {/* ── MIDDLE: trending + entertainment nav ─────────────── */}
            <div>
              <SectionLabel icon={TrendingUp} label="Trending" color="#fbbf24" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} h={56} radius={10} />)
                  : trending.map((item, i) => <NewsCard key={i} item={item} rank={i + 1} />)
                }
              </div>

              {/* Quick nav to entertainment */}
              <div style={{ marginTop: 20 }}>
                <SectionLabel icon={Tv2} label="Entertainment" color="#a78bfa" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {[
                    { href: '/serials',   label: 'Serials',   icon: Tv2,   color: '#f97316' },
                    { href: '/movies',    label: 'Movies',    icon: Film,  color: '#60a5fa' },
                    { href: '/albums',    label: 'Albums',    icon: Music, color: '#f472b6' },
                    { href: '/ott-plans', label: 'OTT',       icon: Play,  color: '#a78bfa' },
                  ].map(({ href, label, icon: Icon, color }) => (
                    <Link key={href} href={href}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none',
                        padding: '10px 12px', borderRadius: 10,
                        background: 'rgba(255,255,255,0.025)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = `${color}10`
                        ;(e.currentTarget as HTMLElement).style.borderColor = `${color}30`
                        ;(e.currentTarget as HTMLElement).style.color = color
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.025)'
                        ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'
                        ;(e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)'
                      }}
                    >
                      <Icon style={{ width: 14, height: 14, color, flexShrink: 0 }} />
                      {label}
                      <ChevronRight style={{ width: 11, height: 11, marginLeft: 'auto', opacity: 0.4 }} />
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* ── RIGHT: cricket + ad ───────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <SectionLabel icon={Trophy} label="IPL Live" color="#4ade80" />
                <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.025)' }}>
                  <CricketWidget compact />
                </div>
              </div>
              <AdUnit size="square" />
            </div>

          </div>
        </div>
      </div>

      {/* ── FOOTER AD ─────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <AdUnit size="banner" />
      </div>

      {/* ── RESPONSIVE STYLES ──────────────────────────────────────────── */}
      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes ping {
          0%,100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }

        /* Desktop: hero = 2 rows (big + 3-up) */
        @media (min-width: 768px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
          }
        }

        /* Desktop: 3-col layout */
        @media (min-width: 1024px) {
          .three-col {
            grid-template-columns: 1fr 340px 300px !important;
          }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .three-col {
            grid-template-columns: 1fr 280px !important;
          }
        }
      `}</style>
    </div>
  )
}
