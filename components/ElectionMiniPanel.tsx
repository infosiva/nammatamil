'use client'

/**
 * ElectionMiniPanel — Compact homepage election widget.
 * Shows: seat snapshot bar + latest coalition headline + CTA to full page.
 * Auto-fetches latest coalition news every 5 min.
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'

const PARTIES = [
  { id: 'tvk',    name: 'TVK',    seats: 107, color: '#fbbf24', needs: 11 },
  { id: 'dmk',    name: 'DMK',    seats: 60,  color: '#f87171', needs: 58 },
  { id: 'aiadmk', name: 'AIADMK', seats: 47,  color: '#4ade80', needs: 71 },
  { id: 'others', name: 'Others', seats: 20,  color: '#94a3b8', needs: null },
]

const MAJORITY = 118
const TOTAL = 234

export default function ElectionMiniPanel() {
  const [headline, setHeadline] = useState<string | null>(null)
  const [headlineUrl, setHeadlineUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  async function fetchLatestNews() {
    try {
      const res = await fetch('/api/election-news', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      // Grab first relevant news item headline
      if (data.news && data.news.length > 0) {
        setHeadline(data.news[0].title)
        setHeadlineUrl(data.news[0].url ?? null)
      }
      if (data.analysis?.breakingAlert) {
        setHeadline(data.analysis.breakingAlert)
      }
      setLastUpdated(new Date())
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLatestNews()
    const id = setInterval(fetchLatestNews, 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <Link href="/tn-election-2026" style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{
        borderRadius: 16,
        background: '#0e0108',
        border: '1px solid rgba(139,0,0,0.5)',
        overflow: 'hidden',
        position: 'relative',
        transition: 'border-color 0.2s',
        boxShadow: '0 4px 32px rgba(139,0,0,0.18)',
      }}>
        {/* TVK Flag stripe bands */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {/* Crimson top */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '35%', background: 'linear-gradient(180deg, rgba(139,0,0,0.55) 0%, rgba(139,0,0,0.1) 100%)' }} />
          {/* Gold centre stripe */}
          <div style={{ position: 'absolute', top: '30%', left: 0, right: 0, height: '20%', background: 'rgba(255,193,7,0.18)' }} />
          {/* Crimson bottom */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '38%', background: 'linear-gradient(0deg, rgba(139,0,0,0.45) 0%, rgba(139,0,0,0.05) 100%)' }} />
        </div>

        {/* Left accent border — flag colours */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: 'linear-gradient(180deg, #8B0000 0%, #FFC107 50%, #8B0000 100%)', pointerEvents: 'none' }} />

        {/* Vijay photo — right, waving pose */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/tvk-vijay.jpg"
          alt=""
          aria-hidden
          style={{
            position: 'absolute', right: 0, top: 0, bottom: 0,
            width: '38%', height: '100%',
            objectFit: 'cover', objectPosition: 'center top',
            opacity: 0.18,
            maskImage: 'linear-gradient(to left, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)',
            WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, padding: '14px 16px 12px', paddingLeft: 20 }}>

          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* TVK Whistle icon inline */}
              <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                <MiniWhistle />
              </span>
              <span style={{ fontWeight: 900, fontSize: 13, color: '#FFC107', letterSpacing: '0.02em' }}>
                தமிழக வெற்றி கழகம்
              </span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '2px 8px', borderRadius: 99,
                background: 'rgba(139,0,0,0.35)', border: '1px solid rgba(139,0,0,0.6)',
                color: '#fca5a5', fontSize: 9, fontWeight: 900, letterSpacing: '0.08em',
              }}>
                ⚖️ HUNG
              </span>
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700, color: '#FFC107',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              Full analysis →
            </span>
          </div>

          {/* Seat bar */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ height: 8, borderRadius: 99, overflow: 'hidden', display: 'flex', gap: 1 }}>
              {PARTIES.map(p => (
                <div key={p.id} style={{
                  width: `${(p.seats / TOTAL) * 100}%`,
                  background: p.color,
                  opacity: p.id === 'others' ? 0.3 : 0.85,
                  borderRadius: p.id === 'tvk' ? '99px 0 0 99px' : p.id === 'others' ? '0 99px 99px 0' : 0,
                }} />
              ))}
            </div>
            {/* 118 majority marker */}
            <div style={{ position: 'relative', height: 12 }}>
              <div style={{
                position: 'absolute', top: 0,
                left: `${(MAJORITY / TOTAL) * 100}%`,
                width: 1.5, height: 10,
                background: 'rgba(255,255,255,0.5)',
              }} />
              <span style={{
                position: 'absolute', top: 1, fontSize: 8,
                color: 'rgba(255,255,255,0.35)', fontWeight: 700,
                left: `calc(${(MAJORITY / TOTAL) * 100}% + 3px)`,
              }}>
                118 majority
              </span>
            </div>
          </div>

          {/* Party chips */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'nowrap', alignItems: 'center' }}>
            {PARTIES.filter(p => p.id !== 'others').map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontWeight: 900, fontSize: 11, color: p.color }}>{p.name}</span>
                <span style={{ fontWeight: 900, fontSize: 18, color: p.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{p.seats}</span>
                {p.needs && (
                  <span style={{ fontSize: 9, color: '#ef4444', fontWeight: 700 }}>+{p.needs}</span>
                )}
              </div>
            ))}
            <span style={{ marginLeft: 'auto', fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>needs 118</span>
          </div>

          {/* Latest coalition news headline */}
          <div style={{
            padding: '8px 10px', borderRadius: 10,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'flex-start', gap: 7,
          }}>
            <span style={{ fontSize: 11, flexShrink: 0, marginTop: 1 }}>📰</span>
            <div style={{ minWidth: 0 }}>
              {loading ? (
                <div style={{ height: 12, width: '80%', borderRadius: 4, background: 'rgba(255,255,255,0.07)' }} />
              ) : headline ? (
                <span style={{
                  fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)',
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {headline}
                </span>
              ) : (
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                  Coalition talks ongoing · Governor has 14 days to invite majority
                </span>
              )}
              {lastUpdated && (
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 3 }}>
                  Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </Link>
  )
}

/* Inline whistle icon for the mini panel header */
function MiniWhistle() {
  return (
    <svg width="22" height="17" viewBox="0 0 200 156" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="72" cy="90" rx="58" ry="58" fill="#FFC107" opacity="0.9" />
      <ellipse cx="72" cy="90" rx="38" ry="38" fill="none" stroke="#FFC107" strokeWidth="2" opacity="0.3" />
      <rect x="124" y="72" width="70" height="28" rx="8" fill="#FFC107" opacity="0.85" />
      <rect x="126" y="58" width="42" height="18" rx="5" fill="#FFC107" opacity="0.7" />
      <path d="M 124 72 Q 112 72 108 82 Q 112 98 124 100" fill="#FFC107" opacity="0.6" />
      <circle cx="72" cy="148" r="7" fill="none" stroke="#FFC107" strokeWidth="3" opacity="0.7" />
      <line x1="72" y1="141" x2="72" y2="148" stroke="#FFC107" strokeWidth="2.5" opacity="0.5" />
    </svg>
  )
}
