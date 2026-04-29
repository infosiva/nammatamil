'use client'

import { useState, useEffect } from 'react'
import { X, ChevronRight, Zap } from 'lucide-react'
import Link from 'next/link'

const COUNTING_DATE = new Date('2026-05-04T06:00:00+05:30')

function getCountdown() {
  const diff = COUNTING_DATE.getTime() - Date.now()
  if (diff <= 0) return null
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  }
}

export default function TNElectionBanner() {
  const [countdown, setCountdown] = useState(getCountdown)
  const [isLive, setIsLive] = useState(false)
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

  return (
    <div
      className="w-full relative"
      style={{
        background: 'linear-gradient(90deg, rgba(220,38,38,0.12) 0%, rgba(22,163,74,0.08) 40%, rgba(245,158,11,0.12) 100%)',
        borderBottom: '1px solid rgba(245,158,11,0.2)',
      }}
    >
      {/* Top colour stripe */}
      <div className="h-0.5 w-full flex">
        {['#dc2626','#16a34a','#f59e0b','#f97316','#3b82f6','#10b981'].map(c => (
          <div key={c} className="flex-1" style={{ background: c }} />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-3 flex-wrap sm:flex-nowrap">

        {/* Badge */}
        {isLive ? (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black flex-shrink-0"
            style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.5)', color: '#ef4444' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping inline-block" />
            LIVE NOW
          </span>
        ) : (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black flex-shrink-0"
            style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.35)', color: '#f59e0b' }}>
            <Zap className="w-3 h-3" /> EXIT POLL
          </span>
        )}

        {/* Text */}
        <p className="text-white/80 text-xs sm:text-sm font-semibold flex-1 min-w-0 truncate">
          {isLive
            ? 'TN Election 2026 — Vote counting LIVE. Watch results & party seat tally →'
            : '🏆 EXIT POLLS: TVK (Vijay) projected WINNER · 98–120 seats · Vijay preferred CM 37% · Results May 4'}
        </p>

        {/* Countdown digits — shown only pre-live */}
        {!isLive && countdown && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {[
              { val: countdown.d, label: 'd' },
              { val: countdown.h, label: 'h' },
              { val: countdown.m, label: 'm' },
              { val: countdown.s, label: 's' },
            ].map(({ val, label }) => (
              <span key={label} className="tabular-nums text-amber-400 font-black text-xs">
                {String(val).padStart(2, '0')}<span className="text-white/25 font-normal">{label}</span>
              </span>
            ))}
          </div>
        )}

        {/* CTA */}
        <Link
          href="/tn-election-2026"
          data-track="election-banner-cta"
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black flex-shrink-0 transition-all hover:scale-105"
          style={{ background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.45)', color: '#f59e0b' }}
        >
          {isLive ? 'Watch Live' : 'Vote & Predict'}
          <ChevronRight className="w-3 h-3" />
        </Link>

        {/* Dismiss */}
        <button onClick={() => setDismissed(true)} className="text-white/20 hover:text-white/60 transition-colors flex-shrink-0 p-0.5">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
