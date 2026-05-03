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
  { name: 'TVK', seats: '98–120', color: '#fbbf24', leader: 'Vijay', emoji: '🔦' },
  { name: 'DMK', seats: '92–110', color: '#f87171', leader: 'Stalin', emoji: '🌅' },
  { name: 'AIADMK', seats: '22–32', color: '#4ade80', leader: 'EPS', emoji: '🍃' },
]

// Show modal once per session — dismissed = stays gone until page reload
const SESSION_KEY = 'tn2026_modal_dismissed'

export default function ElectionModal() {
  const [open, setOpen] = useState(false)
  const [countdown, setCountdown] = useState(getCountdown)
  const [isLive, setIsLive] = useState(() => Date.now() >= COUNTING_DATE.getTime())

  useEffect(() => {
    // Show after 1.5s, only once per session
    if (typeof window !== 'undefined' && !sessionStorage.getItem(SESSION_KEY)) {
      const t = setTimeout(() => setOpen(true), 1500)
      return () => clearTimeout(t)
    }
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      const c = getCountdown()
      setCountdown(c)
      if (!c) setIsLive(true)
    }, 1000)
    return () => clearInterval(id)
  }, [])

  function dismiss() {
    setOpen(false)
    sessionStorage.setItem(SESSION_KEY, '1')
  }

  if (!open) return null

  const accentColor = isLive ? '#ef4444' : '#fbbf24'
  const accentBg    = isLive ? 'rgba(239,68,68,0.15)' : 'rgba(251,191,36,0.12)'
  const accentBorder = isLive ? 'rgba(239,68,68,0.4)' : 'rgba(251,191,36,0.35)'

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={dismiss}
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(7,1,15,0.82)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          animation: 'fadeIn 0.25s ease',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', zIndex: 9999,
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '92vw', maxWidth: 440,
        borderRadius: 24, overflow: 'hidden',
        background: 'linear-gradient(160deg, rgba(12,4,28,0.99) 0%, rgba(7,1,15,0.99) 100%)',
        border: `1px solid ${accentBorder}`,
        boxShadow: `0 0 60px ${accentColor}20, 0 24px 60px rgba(0,0,0,0.7)`,
        animation: 'modalSlideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',
      }}>

        {/* Indian flag stripe at top */}
        <div style={{ height: 3, display: 'flex' }}>
          {['#FF9933','#FF9933','#ffffff','#ffffff','#138808','#138808'].map((c, i) => (
            <div key={i} style={{ flex: 1, background: c }} />
          ))}
        </div>

        {/* Header */}
        <div style={{
          padding: '18px 20px 14px',
          background: accentBg,
          borderBottom: `1px solid ${accentBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isLive ? (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '5px 12px', borderRadius: 99,
                background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.55)',
                color: '#ef4444', fontSize: 10, fontWeight: 900, letterSpacing: '0.1em',
              }}>
                <span style={{
                  width: 7, height: 7, borderRadius: '50%', background: '#ef4444',
                  display: 'inline-block', animation: 'ping 1s infinite',
                }} />
                LIVE NOW
              </span>
            ) : (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '5px 12px', borderRadius: 99,
                background: 'rgba(251,191,36,0.18)', border: '1px solid rgba(251,191,36,0.5)',
                color: '#fbbf24', fontSize: 10, fontWeight: 900, letterSpacing: '0.08em',
                animation: 'pulse 2s infinite',
              }}>
                🗳️ TODAY 8AM IST
              </span>
            )}
          </div>
          <button
            onClick={dismiss}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8, color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
              width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700,
            }}
          >
            ✕
          </button>
        </div>

        {/* Main content */}
        <div style={{ padding: '20px 20px 0' }}>

          {/* Title */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 900, fontSize: 20, color: '#fff', lineHeight: 1.2, marginBottom: 4 }}>
              {isLive ? '🔴 TN Election 2026 — Counting Live' : 'தமிழ்நாடு தேர்தல் 2026'}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
              {isLive
                ? 'Live seat-by-seat count • Who is forming government?'
                : '234 Assembly Seats · Majority 118 · Counting starts 8 AM IST'}
            </div>
          </div>

          {/* Countdown (pre-live only) */}
          {!isLive && countdown && (
            <div style={{
              marginBottom: 16, padding: '12px 16px', borderRadius: 14,
              background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.2)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 9, color: 'rgba(251,191,36,0.6)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>
                Counting begins in
              </div>
              <div style={{ fontWeight: 900, fontSize: 30, fontVariantNumeric: 'tabular-nums', color: '#fbbf24', lineHeight: 1 }}>
                {String(countdown.h).padStart(2, '0')}
                <span style={{ color: 'rgba(251,191,36,0.4)', margin: '0 2px' }}>:</span>
                {String(countdown.m).padStart(2, '0')}
                <span style={{ color: 'rgba(251,191,36,0.4)', margin: '0 2px' }}>:</span>
                <span style={{ color: 'rgba(251,191,36,0.5)' }}>{String(countdown.s).padStart(2, '0')}</span>
              </div>
            </div>
          )}

          {/* Party exit poll chips */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            {PARTIES.map(p => (
              <div key={p.name} style={{
                flex: 1, padding: '10px 8px', borderRadius: 14, textAlign: 'center',
                background: `${p.color}10`, border: `1px solid ${p.color}28`,
              }}>
                <div style={{ fontSize: 16, marginBottom: 3 }}>{p.emoji}</div>
                <div style={{ fontWeight: 900, fontSize: 13, color: p.color, fontVariantNumeric: 'tabular-nums' }}>{p.seats}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.05em', marginTop: 1 }}>{p.name}</div>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>{p.leader}</div>
              </div>
            ))}
          </div>

          {/* TVK highlight — projected winner */}
          <div style={{
            marginBottom: 18, padding: '10px 14px', borderRadius: 12,
            background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 18 }}>🏆</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 12, color: '#fbbf24' }}>
                {isLive ? 'Track live: who is winning?' : 'TVK (Vijay) — Projected Winner'}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>
                {isLive ? 'Real-time seat count from ECI' : 'Axis My India exit poll · 98–120 seats'}
              </div>
            </div>
          </div>
        </div>

        {/* CTA buttons */}
        <div style={{ padding: '0 20px 20px', display: 'flex', gap: 10 }}>
          <Link
            href="/tn-election-2026"
            onClick={dismiss}
            style={{
              flex: 1, padding: '13px 16px', borderRadius: 14, textAlign: 'center',
              fontWeight: 900, fontSize: 13, textDecoration: 'none',
              background: isLive
                ? 'linear-gradient(135deg, rgba(239,68,68,0.9), rgba(220,38,38,0.8))'
                : 'linear-gradient(135deg, rgba(251,191,36,0.9), rgba(245,158,11,0.8))',
              color: isLive ? '#fff' : '#07010f',
              border: `1px solid ${accentColor}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            {isLive ? '🔴 Live Results' : '🗳️ Track Results'}
          </Link>
          <button
            onClick={dismiss}
            style={{
              padding: '13px 16px', borderRadius: 14,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.4)', fontWeight: 700, fontSize: 12,
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            Maybe later
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translate(-50%, calc(-50% + 24px)); }
          to   { opacity: 1; transform: translate(-50%, -50%); }
        }
      `}</style>
    </>
  )
}
