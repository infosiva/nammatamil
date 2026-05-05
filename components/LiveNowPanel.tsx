'use client'

/**
 * LiveNowPanel — "What's happening now" live feed in hero.
 * Pulls TVK/coalition/TN politics headlines from /api/tvk-news (purpose-built endpoint).
 * Shows top 4 stories as a stacked list. Auto-refreshes every 2 min.
 */

import { useState, useEffect, useCallback } from 'react'
import { ExternalLink, RefreshCw } from 'lucide-react'

interface TVKNewsItem {
  title: string
  link: string
  source: string
  pubDate: string
  timeAgo: string
  desc: string
  score: number
  isHot: boolean
}

const REFRESH_MS = 2 * 60 * 1000

export default function LiveNowPanel() {
  const [items, setItems] = useState<TVKNewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [secAgo, setSecAgo] = useState(0)

  const fetchNews = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true)
    try {
      const url = manual ? `/api/tvk-news?t=${Date.now()}` : '/api/tvk-news'
      const res = await fetch(url, {
        cache: 'no-store',
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) return
      const json = await res.json()
      setItems((json.news ?? []).slice(0, 5))
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

      <div style={{ padding: '12px 14px 10px', paddingLeft: 18 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
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
            {!loading && (
              <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>
                {refreshing ? 'updating…' : freshLabel}
              </span>
            )}
            <button
              onClick={() => fetchNews(true)}
              disabled={refreshing}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'rgba(255,255,255,0.25)' }}
            >
              <RefreshCw style={{ width: 9, height: 9, animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            </button>
          </div>
        </div>

        {/* News list */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[100, 85, 70].map((w, i) => (
              <div key={i} style={{ height: 12, borderRadius: 4, background: 'rgba(255,255,255,0.06)', width: `${w}%`, animation: 'shimmer 1.5s infinite' }} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: 0 }}>No live updates right now</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {items.map((item, i) => (
              <a
                key={i}
                href={item.link || '#'}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  textDecoration: 'none', display: 'block',
                  padding: '7px 0',
                  borderBottom: i < items.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  {/* Hot indicator */}
                  {item.isHot && (
                    <span style={{
                      flexShrink: 0, marginTop: 2,
                      width: 5, height: 5, borderRadius: '50%',
                      background: '#ef4444',
                      display: 'inline-block',
                    }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: i === 0 ? 12 : 11,
                      fontWeight: i === 0 ? 800 : 600,
                      color: i === 0 ? '#f4f4f5' : 'rgba(255,255,255,0.7)',
                      lineHeight: 1.4, margin: '0 0 3px',
                      display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {item.title}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{
                        fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 99,
                        background: 'rgba(255,193,7,0.1)', color: '#fbbf24',
                        border: '1px solid rgba(255,193,7,0.2)',
                      }}>{item.source}</span>
                      <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>{item.timeAgo}</span>
                      {item.link && i === 0 && (
                        <ExternalLink style={{ width: 8, height: 8, color: 'rgba(255,255,255,0.15)', marginLeft: 'auto' }} />
                      )}
                    </div>
                  </div>
                </div>
              </a>
            ))}
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
