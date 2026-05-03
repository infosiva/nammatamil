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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{
          position: 'relative', zIndex: 1,
          padding: '14px 20px',
          display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
        }}>

          {/* LEFT: badge + headline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 220 }}>
            {isLive ? (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '5px 12px', borderRadius: 99, flexShrink: 0,
                background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.5)',
                color: '#ef4444', fontSize: 10, fontWeight: 900, letterSpacing: '0.1em',
              }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'ping 1s infinite' }} />
                LIVE
              </span>
            ) : (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '5px 12px', borderRadius: 99, flexShrink: 0,
                background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.4)',
                color: '#fbbf24', fontSize: 10, fontWeight: 900, letterSpacing: '0.08em',
                animation: 'pulse 2s infinite',
              }}>
                🗳️ RESULTS TODAY
              </span>
            )}

            <div>
              <div style={{ fontWeight: 900, fontSize: 14, color: '#fff', lineHeight: 1.2 }}>
                {isLive ? '🔴 TN Election 2026 — LIVE counting now' : 'தமிழ்நாடு தேர்தல் 2026 — Results May 4'}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                {isLive ? 'Track live seat count · Who is winning?' : '234 seats · Majority: 118 · Counting 8 AM IST'}
              </div>
            </div>
          </div>

          {/* CENTRE: party seat chips */}
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {PARTIES.map(p => (
              <div key={p.id} style={{
                padding: '4px 10px', borderRadius: 99,
                background: `${p.color}14`, border: `1px solid ${p.color}30`,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
              }}>
                <span style={{ fontWeight: 900, fontSize: 12, color: p.color, fontVariantNumeric: 'tabular-nums' }}>{p.seats}</span>
                <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em' }}>{p.name}</span>
              </div>
            ))}
          </div>

          {/* RIGHT: countdown or CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {!isLive && countdown && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontWeight: 900, fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
                <span style={{ color: '#fbbf24' }}>
                  {String(countdown.h).padStart(2, '0')}:{String(countdown.m).padStart(2, '0')}:{String(countdown.s).padStart(2, '0')}
                </span>
              </div>
            )}
            <div style={{
              padding: '7px 16px', borderRadius: 10, fontWeight: 900, fontSize: 12,
              background: isLive ? 'rgba(239,68,68,0.2)' : 'rgba(251,191,36,0.18)',
              border: isLive ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(251,191,36,0.45)',
              color: isLive ? '#ef4444' : '#fbbf24',
              whiteSpace: 'nowrap',
            }}>
              {isLive ? '🔴 Live Results →' : 'Track Results →'}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
