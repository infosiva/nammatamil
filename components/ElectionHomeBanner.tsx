'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const COUNTING_DATE = new Date('2026-05-04T08:00:00+05:30')

function getCountdown() {
  const diff = COUNTING_DATE.getTime() - Date.now()
  if (diff <= 0) return null
  return {
    h: Math.floor(diff / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  }
}

const PARTIES = [
  { id: 'tvk',    name: 'TVK',    seats: '98–120', color: '#fbbf24', leader: 'Vijay' },
  { id: 'dmk',    name: 'DMK',    seats: '92–110', color: '#f87171', leader: 'Stalin' },
  { id: 'aiadmk', name: 'AIADMK', seats: '22–32',  color: '#4ade80', leader: 'EPS' },
]

export default function ElectionHomeBanner() {
  const [countdown, setCountdown] = useState(getCountdown)
  const [isLive, setIsLive] = useState(() => Date.now() >= COUNTING_DATE.getTime())

  useEffect(() => {
    const id = setInterval(() => {
      const c = getCountdown()
      setCountdown(c)
      if (!c) setIsLive(true)
    }, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <Link href="/tn-election-2026" style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: isLive
          ? 'linear-gradient(135deg, rgba(239,68,68,0.18) 0%, rgba(7,1,15,0.95) 50%, rgba(239,68,68,0.12) 100%)'
          : 'linear-gradient(135deg, rgba(255,153,51,0.15) 0%, rgba(7,1,15,0.95) 50%, rgba(19,136,8,0.12) 100%)',
        borderBottom: isLive
          ? '1px solid rgba(239,68,68,0.3)'
          : '1px solid rgba(251,191,36,0.2)',
        cursor: 'pointer',
        transition: 'filter 0.2s',
      }}>
        {/* Animated radial glow */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: isLive
            ? 'radial-gradient(ellipse 60% 100% at 50% 50%, rgba(239,68,68,0.08) 0%, transparent 70%)'
            : 'radial-gradient(ellipse 60% 100% at 50% 50%, rgba(251,191,36,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          position: 'relative', zIndex: 1,
          padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>

          {/* Badge */}
          {isLive ? (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 99, flexShrink: 0,
              background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.5)',
              color: '#ef4444', fontSize: 9, fontWeight: 900, letterSpacing: '0.1em',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'ping 1s infinite' }} />
              LIVE
            </span>
          ) : (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '4px 10px', borderRadius: 99, flexShrink: 0,
              background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.4)',
              color: '#fbbf24', fontSize: 9, fontWeight: 900, letterSpacing: '0.06em',
              animation: 'pulse 2s infinite',
            }}>
              🗳️ TODAY
            </span>
          )}

          {/* Headline — flex-1 to take remaining space */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 900, fontSize: 13, color: '#fff', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {isLive ? '🔴 TN Election 2026 — LIVE counting' : 'தமிழ்நாடு தேர்தல் 2026 — Results Today'}
            </div>
            {/* Party chips row — always visible */}
            <div style={{ display: 'flex', gap: 5, marginTop: 4, flexWrap: 'nowrap' }}>
              {PARTIES.map(p => (
                <span key={p.id} style={{
                  fontWeight: 900, fontSize: 10, color: p.color,
                  fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
                }}>
                  {p.name} <span style={{ opacity: 0.7 }}>{p.seats}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Countdown (pre-live) */}
          {!isLive && countdown && (
            <span style={{
              fontWeight: 900, fontSize: 12, fontVariantNumeric: 'tabular-nums',
              color: '#fbbf24', flexShrink: 0, whiteSpace: 'nowrap',
            }}>
              {String(countdown.h).padStart(2, '0')}:{String(countdown.m).padStart(2, '0')}:{String(countdown.s).padStart(2, '0')}
            </span>
          )}

          {/* CTA */}
          <div style={{
            padding: '6px 12px', borderRadius: 8, fontWeight: 900, fontSize: 11,
            background: isLive ? 'rgba(239,68,68,0.2)' : 'rgba(251,191,36,0.18)',
            border: isLive ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(251,191,36,0.45)',
            color: isLive ? '#ef4444' : '#fbbf24',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            {isLive ? '🔴 Live →' : 'Track →'}
          </div>
        </div>
      </div>
    </Link>
  )
}
