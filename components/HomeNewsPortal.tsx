'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  RefreshCw, ExternalLink, Newspaper, Search,
  TrendingUp, Tv2, Film, Play, Trophy, Radio,
  Clock, Flame, Zap,
} from 'lucide-react'
import { goLink } from '@/lib/goLink'
import CricketWidget from '@/components/CricketWidget'
import AdUnit from '@/components/AdUnit'
import VisitorCounter from '@/components/VisitorCounter'
import TVKSpotlight from '@/components/TVKSpotlight'
import CinemaReviewStrip from '@/components/CinemaReviewStrip'

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
const CACHE_TTL  = 3 * 60 * 1000

const SRC: Record<string, string> = {
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
  'NammaTVK':             '#f59e0b',
  'Kalaignar News':       '#ef4444',
  'Thanthi TV':           '#f97316',
}

const CATS = [
  { key: 'all',      label: 'All News',  icon: Radio,   color: '#f87171' },
  { key: 'tvk',     label: 'TVK 2026',  icon: Zap,     color: '#f59e0b', badge: 'LIVE' },
  { key: 'politics', label: 'Politics',  icon: Zap,     color: '#fbbf24' },
  { key: 'cinema',   label: 'Cinema',    icon: Film,    color: '#a78bfa' },
  { key: 'sports',   label: 'Sports',    icon: Trophy,  color: '#4ade80' },
]

const SPORTS_KW = ['cricket','ipl','csk','dhoni','match','விளையாட்டு','கிரிக்கெட்','rcb','mi ','kkr']

// ── Ticker ────────────────────────────────────────────────────────────
function Ticker({ items }: { items: NewsItem[] }) {
  if (!items.length) return null
  const heads = items.slice(0, 12).map(n => n.title)
  return (
    <div style={{ background: 'rgba(239,68,68,0.07)', borderBottom: '1px solid rgba(239,68,68,0.12)', overflow: 'hidden', display: 'flex', alignItems: 'center', height: 28 }}>
      <div style={{ flexShrink: 0, padding: '0 12px', height: '100%', display: 'flex', alignItems: 'center', gap: 5, background: '#ef4444', fontSize: 9, fontWeight: 900, color: '#fff', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff', display: 'inline-block', animation: 'ping 1.5s ease-in-out infinite' }} />
        LIVE
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 40, whiteSpace: 'nowrap', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)', animation: 'marquee 110s linear infinite', paddingLeft: 20 }}>
          {[...heads, ...heads].map((h, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: '#ef4444', fontSize: 9 }}>●</span>{h}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Hero card (large) ──────────────────────────────────────────────────
function HeroCard({ item, height = 200 }: { item: NewsItem; height?: number }) {
  const c = SRC[item.source] ?? '#6b7280'
  return (
    <a href={goLink(item.link, 'hero')} target="_blank" rel="noopener noreferrer"
      style={{ display: 'block', textDecoration: 'none', borderRadius: 12, overflow: 'hidden', position: 'relative', height, transition: 'transform 0.2s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.01)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
    >
      <div style={{ position: 'absolute', inset: 0 }}>
        {item.imageUrl
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={item.imageUrl} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          : <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${c}30, rgba(5,5,16,0.95))` }} />
        }
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(5,5,16,0.97) 0%, rgba(5,5,16,0.55) 50%, rgba(5,5,16,0.1) 100%)' }} />
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 16px' }}>
        <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 99, background: `${c}22`, color: c, border: `1px solid ${c}35`, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'inline-block', marginBottom: 7 }}>
          {item.source}
        </span>
        <h2 style={{ fontSize: 'clamp(13px, 1.8vw, 17px)', fontWeight: 900, color: '#fff', lineHeight: 1.3, margin: '0 0 4px', letterSpacing: '-0.02em', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {item.title}
        </h2>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: 3 }}>
          <Clock style={{ width: 8, height: 8 }} />{item.timeAgo}
        </span>
      </div>
    </a>
  )
}

// ── Mini news row (for sidebar / trending) ─────────────────────────────
function MiniRow({ item, rank }: { item: NewsItem; rank?: number }) {
  const c = SRC[item.source] ?? '#6b7280'
  return (
    <motion.a
      href={goLink(item.link, rank ? 'trending' : 'news-list')}
      target="_blank" rel="noopener noreferrer"
      whileHover={{ x: 2 }} transition={{ duration: 0.1 }}
      style={{ display: 'flex', gap: 8, textDecoration: 'none', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', alignItems: 'flex-start' }}
    >
      {rank !== undefined && (
        <span style={{ flexShrink: 0, width: 16, fontSize: 10, fontWeight: 900, color: rank <= 3 ? '#f59e0b' : 'rgba(255,255,255,0.18)', textAlign: 'right', paddingTop: 1 }}>{rank}</span>
      )}
      {rank === undefined && item.imageUrl && (
        <div style={{ flexShrink: 0, width: 54, height: 40, borderRadius: 6, overflow: 'hidden', background: `${c}20` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.imageUrl} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#e4e4e7', lineHeight: 1.3, margin: '0 0 3px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {item.title}
        </p>
        <span style={{ fontSize: 9, fontWeight: 700, color: c, opacity: 0.8 }}>{item.source}</span>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginLeft: 5 }}>{item.timeAgo}</span>
      </div>
    </motion.a>
  )
}

// ── Compact news card with thumbnail ──────────────────────────────────
function NewsCard({ item }: { item: NewsItem }) {
  const c = SRC[item.source] ?? '#6b7280'
  return (
    <motion.a
      href={goLink(item.link, 'news-list')} target="_blank" rel="noopener noreferrer"
      whileHover={{ backgroundColor: 'rgba(255,255,255,0.07)', x: 1 }} transition={{ duration: 0.12 }}
      style={{ display: 'flex', gap: 9, textDecoration: 'none', borderRadius: 9, padding: '8px 9px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', alignItems: 'flex-start' }}
    >
      <div style={{ flexShrink: 0, width: 60, height: 44, borderRadius: 6, overflow: 'hidden', background: `${c}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {item.imageUrl
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={item.imageUrl} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          : <Newspaper style={{ width: 14, height: 14, color: `${c}60` }} />
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 11.5, fontWeight: 700, color: '#f4f4f5', lineHeight: 1.3, margin: '0 0 4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {item.title}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 99, background: `${c}18`, color: c, border: `1px solid ${c}25` }}>{item.source}</span>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Clock style={{ width: 8, height: 8 }} />{item.timeAgo}
          </span>
          <ExternalLink style={{ width: 8, height: 8, color: 'rgba(255,255,255,0.1)', marginLeft: 'auto' }} />
        </div>
      </div>
    </motion.a>
  )
}

function Skel({ h = 60, radius = 8 }: { h?: number; radius?: number }) {
  return <div style={{ height: h, borderRadius: radius, background: 'rgba(255,255,255,0.04)', animation: 'shimmer 1.5s infinite' }} />
}

function SecLabel({ icon: Icon, label, color, href }: { icon: React.ElementType; label: string; color: string; href?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ width: 3, height: 14, borderRadius: 99, background: color, flexShrink: 0 }} />
      <Icon style={{ width: 11, height: 11, color, flexShrink: 0 }} />
      <span style={{ fontSize: 11, fontWeight: 900, color: '#fff', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</span>
      {href && <Link href={href} style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textDecoration: 'none' }}>All →</Link>}
    </div>
  )
}

const TVK_PROMO: NewsItem = {
  title: 'Thalapathy Vijay — TVK கட்சி | Tamil Nadu CM Race 2026',
  desc: 'வெற்றி கழகம் தலைவர் விஜய், 2026 தமிழ்நாடு சட்டமன்ற தேர்தலில் ஆட்சி அமைக்க தயாராகிறார்.',
  link: 'https://en.wikipedia.org/wiki/Tamilaga_Vettri_Kazhagam',
  source: 'NammaTamil.tv', sourceLogo: '',
  pubDate: new Date().toISOString(), timeAgo: 'pinned',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Vijay_at_CWC_2011.jpg/800px-Vijay_at_CWC_2011.jpg',
  category: 'tvk',
}

// ── Main ───────────────────────────────────────────────────────────────
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
    if (manual) setRefresh(true)
    else {
      try {
        const cached = sessionStorage.getItem('nt_news_v2')
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
      try { sessionStorage.setItem('nt_news_v2', JSON.stringify({ d: json, at: Date.now() })) } catch { /* ignore */ }
    } catch { /* keep stale */ }
    finally { setLoading(false); setRefresh(false) }
  }, [])

  useEffect(() => {
    fetchNews()
    const refresh = setInterval(fetchNews, REFRESH_MS)
    const tick    = setInterval(() => setSecAgo(s => s + 1), 1000)
    return () => { clearInterval(refresh); clearInterval(tick) }
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
    <div style={{ minHeight: '100vh', background: 'transparent' }}>

      {/* TICKER */}
      {!loading && <Ticker items={all} />}

      {/* CATEGORY NAV */}
      <div style={{ background: 'rgba(255,255,255,0.025)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {CATS.map(cat => {
              const active = category === cat.key
              const Ic = cat.icon
              return (
                <button key={cat.key}
                  onClick={() => { setCat(cat.key as typeof category); setShowMore(false) }}
                  style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px', fontSize: 11, fontWeight: active ? 800 : 600, color: active ? cat.color : 'rgba(255,255,255,0.38)', background: 'none', border: 'none', cursor: 'pointer', borderBottom: active ? `2px solid ${cat.color}` : '2px solid transparent', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                >
                  <Ic style={{ width: 11, height: 11 }} />
                  {cat.label}
                  {'badge' in cat && cat.badge && (
                    <span style={{ fontSize: 7, fontWeight: 900, padding: '1px 4px', borderRadius: 3, background: '#ef4444', color: '#fff' }}>{cat.badge}</span>
                  )}
                </button>
              )
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0, padding: '6px 0' }}>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.18)', whiteSpace: 'nowrap' }}>
              {refreshing ? 'Refreshing…' : `${freshLabel}`}
            </span>
            <button onClick={() => fetchNews(true)} disabled={refreshing}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', padding: 3, lineHeight: 0 }}>
              <RefreshCw style={{ width: 10, height: 10, animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            </button>
            <VisitorCounter />
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">

        {/* ── ABOVE-FOLD GRID: hero | cinema | trending sidebar ──────── */}
        <div className="above-fold" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10, marginBottom: 12 }}>

          {/* LEFT col: hero + 2 secondary cards */}
          <div className="af-left">
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Skel h={190} radius={12} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}><Skel h={100} radius={10} /><Skel h={100} radius={10} /></div>
              </div>
            ) : heroItem ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* hero rotation dots */}
                {heroPool.length > 1 && (
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                    {heroPool.map((_, i) => (
                      <button key={i} onClick={() => setHeroIdx(i)}
                        style={{ width: i === heroIdx ? 16 : 5, height: 5, borderRadius: 99, background: i === heroIdx ? '#ef4444' : 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', transition: 'all 0.3s', padding: 0 }} />
                    ))}
                  </div>
                )}
                <div className="hero-fade"><HeroCard item={heroItem} height={185} /></div>
                {/* 2 secondary cards below hero */}
                <div className="secondary-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {filtered.slice(1, 3).map((it, i) => <HeroCard key={i} item={it} height={110} />)}
                </div>
              </div>
            ) : null}
          </div>

          {/* MIDDLE col: cinema reviews */}
          <div className="af-mid" style={{ display: 'none' }}>
            <CinemaReviewStrip />
          </div>

          {/* RIGHT col: trending now */}
          <div className="af-right" style={{ display: 'none' }}>
            <SecLabel icon={TrendingUp} label="Trending Now" color="#fbbf24" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <Skel key={i} h={42} radius={5} />)
                : trending.slice(0, 10).map((it, i) => <MiniRow key={i} item={it} rank={i + 1} />)
              }
            </div>
          </div>
        </div>

        {/* Cinema on mobile (shown below hero) */}
        <div className="cinema-mobile" style={{ marginBottom: 12 }}>
          <CinemaReviewStrip />
        </div>

        {/* Trending on mobile */}
        <div className="trending-mobile" style={{ marginBottom: 12 }}>
          <SecLabel icon={TrendingUp} label="Trending Now" color="#fbbf24" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0 }}>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <Skel key={i} h={42} radius={5} />)
              : trending.slice(0, 8).map((it, i) => <MiniRow key={i} item={it} rank={i + 1} />)
            }
          </div>
        </div>

        {/* ── LOWER GRID: news feed | sidebar ────────────────────────── */}
        <div className="lower-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>

          {/* News list */}
          <div className="news-col">
            <SecLabel icon={Flame} label={category === 'all' ? 'Latest News' : CATS.find(c => c.key === category)?.label ?? 'News'} color="#f87171" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <Skel key={i} h={66} radius={10} />)
                : listItems.map((item, i) => (
                  <div key={i}>
                    <NewsCard item={item} />
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
                style={{ marginTop: 12, width: '100%', padding: '9px 0', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                {showMore ? 'Show Less' : `Load More (${filtered.length - 18} more)`}
              </button>
            )}
          </div>

          {/* Sidebar */}
          <div className="sidebar-col" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* OTT platforms */}
            <div>
              <SecLabel icon={Play} label="Watch Now" color="#a78bfa" href="/movies" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 5 }}>
                {[
                  { href: '/ott-plans', label: 'Netflix',        short: 'N', color: '#e50914', sub: 'Tamil originals' },
                  { href: '/ott-plans', label: 'Prime Video',    short: '▶', color: '#00a8e0', sub: 'Latest releases' },
                  { href: '/ott-plans', label: 'Disney+',        short: '★', color: '#0073e6', sub: 'Star Vijay live' },
                  { href: '/ott-plans', label: 'ZEE5',           short: 'Z', color: '#8b5cf6', sub: 'Serials & shows' },
                ].map(({ href, label, short, color, sub }) => (
                  <motion.div key={label} whileHover={{ scale: 1.02 }} transition={{ duration: 0.13 }}>
                    <Link href={href} style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none', padding: '8px 9px', borderRadius: 9, background: `${color}10`, border: `1px solid ${color}28` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{ width: 20, height: 20, borderRadius: 5, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: '#fff', flexShrink: 0 }}>{short}</span>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#f4f4f5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
                      </div>
                      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', paddingLeft: 26 }}>{sub}</span>
                    </Link>
                  </motion.div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginTop: 5 }}>
                <Link href="/movies" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, textDecoration: 'none', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', padding: '6px 0', borderRadius: 7, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <Film style={{ width: 10, height: 10 }} /> Movies
                </Link>
                <Link href="/serials" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, textDecoration: 'none', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', padding: '6px 0', borderRadius: 7, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <Tv2 style={{ width: 10, height: 10 }} /> Serials
                </Link>
              </div>
            </div>

            {/* Cricket */}
            <div>
              <SecLabel icon={Trophy} label="IPL Live" color="#4ade80" />
              <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
                <CricketWidget compact />
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
        @keyframes ping { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.4); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes heroFade { 0% { opacity: 0; } 100% { opacity: 1; } }
        .hero-fade { animation: heroFade 0.45s ease-out; }

        /* ── DESKTOP: above-fold 3-col ─────────────────────────────── */
        @media (min-width: 1024px) {
          .above-fold {
            grid-template-columns: 1fr 340px 260px !important;
            align-items: start;
          }
          .af-mid  { display: block !important; }
          .af-right { display: block !important; }
          .cinema-mobile  { display: none !important; }
          .trending-mobile { display: none !important; }
        }

        /* ── TABLET: above-fold 2-col ──────────────────────────────── */
        @media (min-width: 700px) and (max-width: 1023px) {
          .above-fold {
            grid-template-columns: 1fr 240px !important;
            align-items: start;
          }
          .af-right { display: block !important; }
          .cinema-mobile  { display: block; }
          .trending-mobile { display: none !important; }
        }

        /* ── LOWER GRID desktop ────────────────────────────────────── */
        @media (min-width: 1024px) {
          .lower-grid { grid-template-columns: 1fr 280px !important; align-items: start; }
        }
        @media (min-width: 700px) and (max-width: 1023px) {
          .lower-grid { grid-template-columns: 1fr 220px !important; align-items: start; }
        }

        /* secondary-row: on mobile stack vertically */
        @media (max-width: 500px) {
          .secondary-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
