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

// Post-counting final results — hung assembly
const PARTIES = [
  { id: 'tvk',    name: 'TVK',    seats: '107', color: '#fbbf24', leader: 'Vijay' },
  { id: 'dmk',    name: 'DMK',    seats: '60',  color: '#f87171', leader: 'Stalin' },
  { id: 'aiadmk', name: 'AIADMK', seats: '47',  color: '#4ade80', leader: 'EPS' },
]

export default function ElectionHomeBanner() {
  const [countdown, setCountdown] = useState(getCountdown)
  const [isLive, setIsLive] = useState(() => Date.now() >= COUNTING_DATE.getTime())

  const countingDay = new Date(COUNTING_DATE)
  const now = new Date()
  const isCountingToday = now.getDate() === countingDay.getDate()
    && now.getMonth() === countingDay.getMonth()
    && now.getFullYear() === countingDay.getFullYear()
  const preLabel = isCountingToday ? '🗳️ TODAY' : '🗳️ TOMORROW'
  const preHeadline = isCountingToday
    ? 'தமிழ்நாடு தேர்தல் 2026 — Results Today'
    : 'தமிழ்நாடு தேர்தல் 2026 — Results Tomorrow'

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
        background: 'linear-gradient(90deg, rgba(139,0,0,0.55) 0%, rgba(7,1,15,0.92) 45%, rgba(139,0,0,0.35) 100%)',
        borderBottom: '1px solid rgba(255,193,7,0.25)',
        cursor: 'pointer',
        transition: 'filter 0.2s',
      }}>
        {/* TVK flag gold stripe */}
        <div style={{
          position: 'absolute', top: '30%', left: 0, right: 0, height: '38%',
          background: 'rgba(255,193,7,0.12)', zIndex: 0, pointerEvents: 'none',
        }} />
        {/* Radial glow */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: 'radial-gradient(ellipse 60% 100% at 50% 50%, rgba(255,193,7,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          position: 'relative', zIndex: 1,
          padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>

          {/* Badge */}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 99, flexShrink: 0,
            background: 'rgba(139,0,0,0.4)', border: '1px solid rgba(255,193,7,0.5)',
            color: '#FFC107', fontSize: 9, fontWeight: 900, letterSpacing: '0.08em',
          }}>
            ⚖️ HUNG
          </span>

          {/* Headline — flex-1 to take remaining space */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 900, fontSize: 13, color: '#fff', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {isLive ? '⚖️ HUNG ASSEMBLY · TVK 107 · Coalition talks' : preHeadline}
            </div>
            {/* Party chips row — always visible */}
            <div style={{ display: 'flex', gap: 5, marginTop: 4, flexWrap: 'nowrap', alignItems: 'center' }}>
              {PARTIES.map(p => (
                <span key={p.id} style={{
                  fontWeight: 900, fontSize: 10, color: p.color,
                  fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
                }}>
                  {p.name} <span style={{ opacity: 0.7 }}>{p.seats}</span>
                </span>
              ))}
              {isLive && (
                <span style={{ fontSize: 9, color: 'rgba(239,68,68,0.8)', fontWeight: 700, marginLeft: 2 }}>
                  · needs 118
                </span>
              )}
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
            background: 'rgba(255,193,7,0.15)',
            border: '1px solid rgba(255,193,7,0.5)',
            color: '#FFC107',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            Coalition →
          </div>
        </div>
      </div>
    </Link>
  )
}
