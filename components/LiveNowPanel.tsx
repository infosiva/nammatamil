'use client'

/**
 * LiveNowPanel — "What's happening now" live feed in hero.
 * Pulls political/TVK/coalition headlines from /api/tamil-media-news
 * filtered to politics category. Auto-refreshes every 3 min.
 */

import { useState, useEffect, useCallback } from 'react'
import { ExternalLink, RefreshCw } from 'lucide-react'

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

const REFRESH_MS = 3 * 60 * 1000

// Keywords that signal TVK / coalition / government formation news
const TVK_KW = [
  'tvk', 'vijay', 'thalapathy', 'coalition', 'alliance', 'கூட்டணி',
  'government', 'cabinet', 'chief minister', 'cm', 'முதலமைச்சர்',
  'ஆட்சி', 'dmk', 'திமுக', 'stalin', 'ஸ்டாலின்',
  'government formation', 'oath', 'swearing', 'minister',
]

function isTVKRelated(title: string, desc: string): boolean {
  const text = (title + ' ' + desc).toLowerCase()
  return TVK_KW.some(kw => text.includes(kw.toLowerCase()))
}

export default function LiveNowPanel() {
  const [items, setItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const [secAgo, setSecAgo] = useState(0)

  const fetchNews = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true)
    try {
      const res = await fetch('/api/tamil-media-news', {
        cache: 'no-store',
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) return
      const json = await res.json()
      const all: NewsItem[] = json.news ?? []

      // Priority: TVK/coalition headlines first, then any politics
      const tvk = all.filter(n => isTVKRelated(n.title, n.desc))
      const politics = all.filter(n => n.category === 'politics' && !isTVKRelated(n.title, n.desc))
      const merged = [...tvk, ...politics].slice(0, 8)
      setItems(merged)
      setActiveIdx(0)
      setSecAgo(0)
    } catch { /* keep existing */ }
    finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => {
    fetchNews()
    const poll = setInterval(() => fetchNews(), REFRESH_MS)
    const tick = setInterval(() => setSecAgo(s => s + 1), 1000)
    return () => { clearInterval(poll); clearInterval(tick) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-rotate through items every 5s
  useEffect(() => {
    if (items.length === 0) return
    const id = setInterval(() => setActiveIdx(i => (i + 1) % items.length), 5000)
    return () => clearInterval(id)
  }, [items.length])

  const item = items[activeIdx]
  const freshLabel = secAgo < 5 ? 'just now' : secAgo < 60 ? `${secAgo}s ago` : `${Math.floor(secAgo / 60)}m ago`

  return (
    <div style={{
      borderRadius: 14,
      background: 'rgba(10,2,18,0.85)',
      border: '1px solid rgba(251,191,36,0.25)',
      overflow: 'hidden',
      position: 'relative',
      backdropFilter: 'blur(8px)',
    }}>
      {/* Left accent */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
        background: 'linear-gradient(180deg, #8B0000 0%, #FFC107 50%, #8B0000 100%)',
      }} />

      <div style={{ padding: '12px 14px 12px', paddingLeft: 18 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            {/* Pulsing live dot */}
            <span style={{
              display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
              background: '#ef4444', boxShadow: '0 0 0 0 rgba(239,68,68,0.6)',
              animation: 'livePulse 1.8s ease-in-out infinite',
              flexShrink: 0,
            }} />
            <span style={{ fontWeight: 900, fontSize: 12, color: '#fff', letterSpacing: '0.04em' }}>LIVE NOW</span>
            <span style={{
              padding: '1px 7px', borderRadius: 99, fontSize: 9, fontWeight: 800,
              background: 'rgba(251,191,36,0.12)', color: '#fbbf24',
              border: '1px solid rgba(251,191,36,0.25)',
            }}>TVK · Coalition · TN Politics</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>
              {refreshing ? 'updating…' : freshLabel}
            </span>
            <button
              onClick={() => fetchNews(true)}
              disabled={refreshing}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'rgba(255,255,255,0.25)' }}
            >
              <RefreshCw style={{ width: 9, height: 9, animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ height: 14, borderRadius: 4, background: 'rgba(255,255,255,0.06)', animation: 'shimmer 1.5s infinite' }} />
            <div style={{ height: 14, borderRadius: 4, background: 'rgba(255,255,255,0.04)', width: '80%', animation: 'shimmer 1.5s infinite' }} />
            <div style={{ height: 10, borderRadius: 4, background: 'rgba(255,255,255,0.03)', width: '45%', animation: 'shimmer 1.5s infinite' }} />
          </div>
        ) : !item ? (
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: 0 }}>No live updates right now</p>
        ) : (
          <a
            href={item.link || '#'}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'none', display: 'block' }}
          >
            {/* Headline */}
            <p style={{
              fontSize: 13, fontWeight: 800, color: '#f4f4f5',
              lineHeight: 1.45, margin: '0 0 6px',
              display: '-webkit-box', WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {item.title}
            </p>

            {/* Meta row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 99,
                background: `${item.sourceLogo}18`, color: item.sourceLogo,
                border: `1px solid ${item.sourceLogo}30`,
              }}>{item.source}</span>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>{item.timeAgo}</span>
              {item.link && (
                <ExternalLink style={{ width: 9, height: 9, color: 'rgba(255,255,255,0.2)', marginLeft: 'auto' }} />
              )}
            </div>
          </a>
        )}

        {/* Dot indicators */}
        {items.length > 1 && (
          <div style={{ display: 'flex', gap: 4, marginTop: 10, alignItems: 'center' }}>
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                style={{
                  width: i === activeIdx ? 16 : 4, height: 4, borderRadius: 99,
                  background: i === activeIdx ? '#fbbf24' : 'rgba(255,255,255,0.15)',
                  border: 'none', cursor: 'pointer', padding: 0,
                  transition: 'all 0.3s ease',
                  flexShrink: 0,
                }}
              />
            ))}
            <span style={{ marginLeft: 'auto', fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>
              {activeIdx + 1}/{items.length}
            </span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes livePulse {
          0%   { box-shadow: 0 0 0 0 rgba(239,68,68,0.6); }
          70%  { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
          100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
