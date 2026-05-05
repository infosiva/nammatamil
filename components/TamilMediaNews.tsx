'use client'

/**
 * TamilMediaNews — Live Tamil media news feed
 * Pulls from Tamil news RSS feeds: Dinamalar, Maalaimalar, OneIndia Tamil,
 * The Hindu Tamil, Vikatan, Puthiya Thalaimurai etc.
 * Auto-refreshes every 6 min. Shows news cards with source, time, headline.
 */

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, ExternalLink, Newspaper } from 'lucide-react'

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
  'Dinamalar':          '#e11d48',
  'Maalaimalar':        '#7c3aed',
  'OneIndia Tamil':     '#0891b2',
  'The Hindu Tamil':    '#1d4ed8',
  'Vikatan':            '#d97706',
  'Puthiya Thalaimurai': '#dc2626',
  'Sun News':           '#f59e0b',
  'Polimer News':       '#16a34a',
}

function NewsCard({ item }: { item: NewsItem }) {
  const color = SOURCE_COLORS[item.source] ?? '#6b7280'
  return (
    <a
      href={item.link || '#'}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex', gap: 12, textDecoration: 'none',
        borderRadius: 14, padding: '12px 14px',
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.07)',
        transition: 'border-color 0.15s, background 0.15s',
        alignItems: 'flex-start',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = `${color}40`
        e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
        e.currentTarget.style.background = 'rgba(255,255,255,0.025)'
      }}
    >
      {/* Thumbnail or placeholder */}
      <div style={{
        flexShrink: 0, width: 80, height: 60, borderRadius: 10, overflow: 'hidden',
        background: 'rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <Newspaper style={{ width: 20, height: 20, color: 'rgba(255,255,255,0.12)' }} />
        )}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 13, fontWeight: 700, color: '#f4f4f5',
          lineHeight: 1.45, margin: '0 0 5px',
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {item.title}
        </p>
        {item.desc && (
          <p style={{
            fontSize: 10, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5,
            margin: '0 0 6px',
            display: '-webkit-box', WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {item.desc}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 99,
            background: `${color}18`, color, border: `1px solid ${color}30`,
          }}>{item.source}</span>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>{item.timeAgo}</span>
          {item.link && <ExternalLink style={{ width: 9, height: 9, color: 'rgba(255,255,255,0.12)', marginLeft: 'auto' }} />}
        </div>
      </div>
    </a>
  )
}

function SkeletonCard() {
  return (
    <div style={{ display: 'flex', gap: 12, borderRadius: 14, padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ flexShrink: 0, width: 80, height: 60, borderRadius: 10, background: 'rgba(255,255,255,0.05)', animation: 'shimmer 1.5s infinite' }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: 11, borderRadius: 4, background: 'rgba(255,255,255,0.06)', marginBottom: 6, animation: 'shimmer 1.5s infinite' }} />
        <div style={{ height: 11, borderRadius: 4, background: 'rgba(255,255,255,0.04)', width: '75%', marginBottom: 10, animation: 'shimmer 1.5s infinite' }} />
        <div style={{ height: 9, borderRadius: 4, background: 'rgba(255,255,255,0.04)', width: '35%', animation: 'shimmer 1.5s infinite' }} />
      </div>
    </div>
  )
}

export default function TamilMediaNews() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [secAgo, setSecAgo] = useState(0)
  const [activeTab, setActiveTab] = useState<'all' | 'politics' | 'cinema' | 'sports'>('all')

  const fetchNews = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true)
    try {
      const res = await fetch('/api/tamil-media-news', { cache: 'no-store', signal: AbortSignal.timeout(14000) })
      if (!res.ok) return
      const json: ApiResponse = await res.json()
      setData(json)
      setSecAgo(0)
    } catch { /* keep existing */ }
    finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => {
    fetchNews()
    const d = setInterval(fetchNews, REFRESH_MS)
    const t = setInterval(() => setSecAgo(s => s + 1), 1000)
    return () => { clearInterval(d); clearInterval(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const allNews = data?.news ?? []
  const filtered = activeTab === 'all' ? allNews
    : allNews.filter(n => n.category === activeTab)
  const visible = showAll ? filtered : filtered.slice(0, 8)

  const tabs: Array<{ key: typeof activeTab; label: string }> = [
    { key: 'all',      label: 'All' },
    { key: 'politics', label: 'Politics' },
    { key: 'cinema',   label: 'Cinema' },
    { key: 'sports',   label: 'Sports' },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 3, height: 20, borderRadius: 99, background: 'linear-gradient(180deg, #e11d48, #f59e0b)' }} />
          <span style={{ fontWeight: 800, fontSize: 16, color: 'rgba(255,255,255,0.85)' }}>Tamil Media — Latest News</span>
          <span style={{
            fontSize: 9, fontWeight: 900, padding: '2px 8px', borderRadius: 99,
            background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)',
          }}>LIVE</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>
            {loading ? '' : refreshing ? 'Refreshing…' : secAgo < 60 ? `${secAgo}s ago` : `${Math.floor(secAgo / 60)}m ago`}
          </span>
          <button onClick={() => fetchNews(true)} disabled={refreshing}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '5px 8px', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}>
            <RefreshCw style={{ width: 12, height: 12, animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => { setActiveTab(tab.key); setShowAll(false) }}
            style={{
              padding: '5px 14px', borderRadius: 99, fontSize: 11, fontWeight: 700, cursor: 'pointer',
              border: activeTab === tab.key ? '1px solid rgba(251,191,36,0.5)' : '1px solid rgba(255,255,255,0.08)',
              background: activeTab === tab.key ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.03)',
              color: activeTab === tab.key ? '#fbbf24' : 'rgba(255,255,255,0.4)',
            }}>
            {tab.label}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 9, color: 'rgba(255,255,255,0.2)', alignSelf: 'center' }}>
          {filtered.length} stories
        </span>
      </div>

      {/* News list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : visible.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px', color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
          No stories in this category right now.
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {visible.map((item, i) => <NewsCard key={`${item.link}-${i}`} item={item} />)}
          </div>
          {filtered.length > 8 && (
            <button onClick={() => setShowAll(p => !p)}
              style={{
                width: '100%', marginTop: 10, padding: '10px',
                borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.025)',
                color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}>
              {showAll ? '↑ Show less' : `↓ ${filtered.length - 8} more stories`}
            </button>
          )}
        </>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
