'use client'

import { useState, useEffect } from 'react'
import { X, ChevronRight, Zap } from 'lucide-react'
import Link from 'next/link'

// Counting starts May 4 2026 at 8:00 AM IST
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

export default function TNElectionBanner() {
  const [countdown, setCountdown] = useState(getCountdown)
  const [isLive, setIsLive] = useState(() => Date.now() >= COUNTING_DATE.getTime())
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const id = setInterval(() => {
      const c = getCountdown()
      setCountdown(c)
      if (!c) setIsLive(true)
    }, 1000)
    return () => clearInterval(id)
  }, [])

  if (dismissed) return null

  const isTomorrow = !isLive && countdown && countdown.h < 24

  return (
    <div className="w-full relative" style={{
      background: isLive
        ? 'linear-gradient(90deg, rgba(239,68,68,0.18) 0%, rgba(220,38,38,0.10) 100%)'
        : 'linear-gradient(90deg, rgba(251,191,36,0.12) 0%, rgba(245,158,11,0.06) 50%, rgba(251,191,36,0.12) 100%)',
      borderBottom: `1px solid ${isLive ? 'rgba(239,68,68,0.35)' : 'rgba(251,191,36,0.25)'}`,
    }}>
      {/* Top stripe — Indian flag colours */}
      <div className="h-0.5 w-full flex">
        {['#FF9933','#FF9933','#ffffff','#ffffff','#138808','#138808'].map((c, i) => (
          <div key={i} className="flex-1" style={{ background: c }} />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 flex items-center gap-2 sm:gap-3">

        {/* Live / Tomorrow badge */}
        {isLive ? (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black flex-shrink-0"
            style={{ background: 'rgba(239,68,68,0.22)', border: '1px solid rgba(239,68,68,0.55)', color: '#ef4444' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping inline-block" />
            LIVE NOW
          </span>
        ) : isTomorrow ? (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black flex-shrink-0 animate-pulse"
            style={{ background: 'rgba(251,191,36,0.2)', border: '1px solid rgba(251,191,36,0.5)', color: '#fbbf24' }}>
            🗳️ TODAY 8AM
          </span>
        ) : (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black flex-shrink-0"
            style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.35)', color: '#a78bfa' }}>
            <Zap className="w-3 h-3" /> EXIT POLL
          </span>
        )}

        {/* Text */}
        <p className="text-white/85 text-[11px] sm:text-sm font-semibold flex-1 min-w-0 truncate">
          {isLive
            ? '🗳️ TN Election 2026 — LIVE counting. Track seat-by-seat results now →'
            : isTomorrow
            ? '🏆 TN Election Results TODAY 8 AM IST · TVK leads exit polls · Watch live on NammaTamil'
            : '🏆 EXIT POLLS: TVK (Vijay) projected WINNER · 98–120 seats · Results May 4 at 8 AM IST'}
        </p>

        {/* Countdown — only pre-live */}
        {!isLive && countdown && (
          <div className="hidden sm:flex items-center gap-1 flex-shrink-0 font-black text-[11px] tabular-nums"
            style={{ color: '#fbbf24' }}>
            {String(countdown.h).padStart(2,'0')}
            <span className="text-white/20 animate-pulse">:</span>
            {String(countdown.m).padStart(2,'0')}
            <span className="text-white/20 animate-pulse">:</span>
            {String(countdown.s).padStart(2,'0')}
          </div>
        )}

        {/* CTA */}
        <Link href="/tn-election-2026"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-black flex-shrink-0 transition-all hover:scale-105"
          style={isLive
            ? { background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.5)', color: '#ef4444' }
            : { background: 'rgba(251,191,36,0.18)', border: '1px solid rgba(251,191,36,0.45)', color: '#fbbf24' }}>
          {isLive ? 'Live Results' : 'Track Now'}
          <ChevronRight className="w-3 h-3" />
        </Link>

        {/* Dismiss */}
        <button onClick={() => setDismissed(true)}
          className="text-white/20 hover:text-white/50 transition-colors flex-shrink-0 p-0.5">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
