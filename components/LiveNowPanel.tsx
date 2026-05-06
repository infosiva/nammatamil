'use client'

/**
 * LiveNowPanel — "What's happening now" live feed in hero.
 * Primary: /api/tamil-media-news filtered to politics (Tamil-language sources first).
 * Fallback: /api/tvk-news (English TVK headlines) to fill any gaps.
 * Shows top 5 stories stacked. Auto-refreshes every 2 min.
 */

import { useState, useEffect, useCallback } from 'react'
import { ExternalLink, RefreshCw } from 'lucide-react'
import { goLink } from '@/lib/goLink'

interface NewsItem {
  title: string
  link: string
  source: string
  sourceLogo?: string
  pubDate: string
  timeAgo: string
  desc: string
  category?: string
  isHot?: boolean
  lang?: string
}

interface TallyParty {
  name: string
  seats: number
  bloc: 'tvk_direct' | 'tvk_support' | 'opposition' | 'admk' | 'others'
}

interface Tally {
  tvk_direct: number
  tvk_support: number
  tvk_total: number
  opposition: number
  admk_bloc: number
  others: number
  declared: number
  total: number
  majority: number
  majority_gap: number
  parties: TallyParty[]
  source: 'eci_live' | 'fallback'
  updatedAt: string
}

// TVK/politics keywords to filter from general Tamil media news
const POLITICS_KW = [
  'tvk', 'vijay', 'thalapathy', 'coalition', 'alliance', 'கூட்டணி',
  'government', 'cabinet', 'chief minister', 'cm', 'முதலமைச்சர்',
  'ஆட்சி', 'dmk', 'திமுக', 'aiadmk', 'அதிமுக', 'stalin', 'ஸ்டாலின்',
  'election', 'தேர்தல்', 'minister', 'அமைச்சர்', 'assembly', 'சட்டமன்றம்',
  'political', 'அரசியல்', 'bjp', 'pmk', 'mla', 'vote', 'voter',
]

function isPolitics(title: string, desc: string): boolean {
  const text = (title + ' ' + desc).toLowerCase()
  return POLITICS_KW.some(kw => text.includes(kw.toLowerCase()))
}

function isTamil(text: string): boolean {
  return /[\u0B80-\u0BFF]/.test(text)
}

const REFRESH_MS = 2 * 60 * 1000

export default function LiveNowPanel() {
  const [items, setItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [secAgo, setSecAgo] = useState(0)
  const [tally, setTally] = useState<Tally | null>(null)

  const fetchNews = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true)
    try {
      // Fetch both in parallel
      const [tamilRes, tvkRes] = await Promise.allSettled([
        fetch(manual ? `/api/tamil-media-news?t=${Date.now()}` : '/api/tamil-media-news', {
          cache: 'no-store', signal: AbortSignal.timeout(10000),
        }),
        fetch('/api/tvk-news', {
          cache: 'no-store', signal: AbortSignal.timeout(10000),
        }),
      ])

      const combined: NewsItem[] = []

      // Primary: Tamil media news filtered to politics — Tamil items bubble up naturally
      if (tamilRes.status === 'fulfilled' && tamilRes.value.ok) {
        const json = await tamilRes.value.json()
        const all: NewsItem[] = json.news ?? []
        const political = all.filter(n => isPolitics(n.title, n.desc))
        // Tamil-script titles first, then English
        const tamilFirst = [
          ...political.filter(n => isTamil(n.title)),
          ...political.filter(n => !isTamil(n.title)),
        ]
        combined.push(...tamilFirst.slice(0, 5))
      }

      // Fallback: fill with English TVK news if not enough Tamil politics
      if (combined.length < 3 && tvkRes.status === 'fulfilled' && tvkRes.value.ok) {
        const json = await tvkRes.value.json()
        const tvkItems: NewsItem[] = (json.news ?? []).map((n: NewsItem & { score?: number; isHot?: boolean }) => ({
          ...n,
          isHot: n.isHot ?? false,
        }))
        // Only add items not already in combined (dedup by title prefix)
        const existingTitles = new Set(combined.map(i => i.title.slice(0, 50).toLowerCase()))
        for (const item of tvkItems) {
          if (!existingTitles.has(item.title.slice(0, 50).toLowerCase())) {
            combined.push(item)
          }
          if (combined.length >= 5) break
        }
      }

      if (combined.length > 0) {
        setItems(combined.slice(0, 5))
        setSecAgo(0)
      }
    } catch { /* keep existing */ }
    finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => {
    fetchNews()
    const poll = setInterval(() => fetchNews(), REFRESH_MS)
    const tick = setInterval(() => setSecAgo(s => s + 1), 1000)

    // Fetch real-time seat tally from ECI
    const fetchTally = async () => {
      try {
        const res = await fetch('/api/tvk-tally', { cache: 'no-store', signal: AbortSignal.timeout(6000) })
        if (res.ok) {
          const data: Tally = await res.json()
          setTally(data)
        }
      } catch { /* keep existing */ }
    }
    fetchTally()
    const tallyPoll = setInterval(fetchTally, 3 * 60 * 1000) // refresh every 3 min

    return () => { clearInterval(poll); clearInterval(tick); clearInterval(tallyPoll) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const freshLabel = secAgo < 5 ? 'just now' : secAgo < 60 ? `${secAgo}s ago` : `${Math.floor(secAgo / 60)}m ago`

  return (
    <div style={{
      borderRadius: 14,
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      overflow: 'hidden',
      position: 'relative',
      backdropFilter: 'blur(12px)',
    }}>
      {/* Left accent — gold only */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
        background: 'linear-gradient(180deg, transparent 0%, #f59e0b 30%, #f59e0b 70%, transparent 100%)',
        opacity: 0.8,
      }} />

      <div style={{ padding: '14px 16px 12px', paddingLeft: 20 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
              background: '#ef4444', boxShadow: '0 0 0 0 rgba(239,68,68,0.6)',
              animation: 'livePulse 1.8s ease-in-out infinite', flexShrink: 0,
            }} />
            <span style={{ fontWeight: 900, fontSize: 11, color: '#fff', letterSpacing: '0.08em' }}>LIVE</span>
            <span style={{
              padding: '2px 8px', borderRadius: 99, fontSize: 9, fontWeight: 800,
              background: 'rgba(239,68,68,0.15)', color: '#f87171',
              border: '1px solid rgba(239,68,68,0.3)', letterSpacing: '0.03em',
            }}>🌟 CM OATH · MAY 7</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {!loading && (
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.18)' }}>
                {refreshing ? 'updating…' : freshLabel}
              </span>
            )}
            <button
              onClick={() => fetchNews(true)}
              disabled={refreshing}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'rgba(255,255,255,0.22)', lineHeight: 0 }}
            >
              <RefreshCw style={{ width: 10, height: 10, animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            </button>
          </div>
        </div>

        {/* Seat count context strip — live from /api/tvk-tally (ECI JSON) */}
        {tally && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
            marginBottom: 10, padding: '6px 10px', borderRadius: 8,
            background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)',
          }}>
            {/* TVK direct */}
            <span style={{ fontSize: 10, fontWeight: 800, color: '#f59e0b' }}>
              TVK {tally.tvk_direct}
            </span>
            {/* Support parties (INC, PMK, Left etc.) */}
            {tally.parties
              .filter(p => p.bloc === 'tvk_support')
              .map((p, i) => (
                <span key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>+</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>
                    {p.name} {p.seats}
                  </span>
                </span>
              ))
            }
            {/* Majority badge */}
            <span style={{
              marginLeft: 'auto', fontSize: 9, fontWeight: 800, padding: '2px 7px',
              borderRadius: 99, whiteSpace: 'nowrap',
              background: tally.majority_gap >= 0 ? 'rgba(74,222,128,0.12)' : 'rgba(239,68,68,0.12)',
              color: tally.majority_gap >= 0 ? '#4ade80' : '#f87171',
              border: `1px solid ${tally.majority_gap >= 0 ? 'rgba(74,222,128,0.25)' : 'rgba(239,68,68,0.25)'}`,
            }}>
              {tally.majority_gap >= 0
                ? `✓ ${tally.tvk_total} seats · Majority +${tally.majority_gap}`
                : `⚠ ${tally.tvk_total} seats · Need ${Math.abs(tally.majority_gap)} more`
              }
            </span>
          </div>
        )}

        {/* News list */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[100, 88, 74].map((w, i) => (
              <div key={i} style={{ height: i === 0 ? 16 : 12, borderRadius: 4, background: 'rgba(255,255,255,0.06)', width: `${w}%`, animation: 'shimmer 1.5s infinite' }} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', margin: 0 }}>No live updates right now</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {items.map((item, i) => (
              <a
                key={i}
                href={goLink(item.link, 'live-panel')}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  textDecoration: 'none', display: 'block',
                  padding: i === 0 ? '0 0 10px' : '8px 0',
                  borderBottom: i < items.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                  {/* Hot indicator */}
                  {item.isHot && (
                    <span style={{
                      flexShrink: 0, marginTop: i === 0 ? 4 : 3,
                      width: 5, height: 5, borderRadius: '50%',
                      background: '#ef4444',
                      display: 'inline-block',
                    }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: i === 0 ? 14 : 11,
                      fontWeight: i === 0 ? 800 : 600,
                      color: i === 0 ? 'rgba(255,255,255,0.93)' : 'rgba(255,255,255,0.65)',
                      lineHeight: i === 0 ? 1.45 : 1.4,
                      margin: i === 0 ? '0 0 6px' : '0 0 4px',
                      display: '-webkit-box', WebkitLineClamp: i === 0 ? 3 : 2,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {item.title}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
                        background: 'rgba(245,158,11,0.10)', color: '#f59e0b',
                        border: '1px solid rgba(245,158,11,0.18)',
                        letterSpacing: '0.02em',
                      }}>{item.source}</span>
                      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.22)' }}>{item.timeAgo}</span>
                      {item.link && i === 0 && (
                        <ExternalLink style={{ width: 9, height: 9, color: 'rgba(255,255,255,0.18)', marginLeft: 'auto' }} />
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
