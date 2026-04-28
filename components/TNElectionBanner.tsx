'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, Zap, TrendingUp } from 'lucide-react'

// TN Local Body Election — May 4, 2026 (counting day)
const ELECTION_DATE = new Date('2026-05-04T00:00:00+05:30') // IST midnight

// Party data for live count pools display
const PARTIES = [
  { id: 'dmk',    name: 'DMK',      fullName: 'திமுக',      color: '#e53e3e', bg: 'rgba(229,62,62,0.12)',   border: 'rgba(229,62,62,0.35)',   symbol: '🌅', seats: null, lead: null },
  { id: 'aiadmk', name: 'AIADMK',   fullName: 'அதிமுக',     color: '#16a34a', bg: 'rgba(22,163,74,0.12)',   border: 'rgba(22,163,74,0.35)',   symbol: '🌿', seats: null, lead: null },
  { id: 'tvk',    name: 'TVK',      fullName: 'தவக',         color: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.4)',   symbol: '⭐', seats: null, lead: null },
  { id: 'bjp',    name: 'BJP',      fullName: 'பாஜக',        color: '#f97316', bg: 'rgba(249,115,22,0.12)',  border: 'rgba(249,115,22,0.35)',  symbol: '🪷', seats: null, lead: null },
  { id: 'inc',    name: 'Congress', fullName: 'காங்கிரஸ்',   color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.35)',  symbol: '✋', seats: null, lead: null },
  { id: 'pmk',    name: 'PMK',      fullName: 'பாமக',        color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)',  border: 'rgba(139,92,246,0.35)',  symbol: '🥥', seats: null, lead: null },
]

// Live streaming sources for election counting
const STREAMS = [
  { name: 'Sun News',   url: 'https://www.youtube.com/@SunNewsTV/live',     color: '#dc2626' },
  { name: 'Puthiya Thalaimurai', url: 'https://www.youtube.com/@puthiyathalaimurai/live', color: '#f97316' },
  { name: 'News18 Tamil', url: 'https://www.youtube.com/@News18TamilNadu/live', color: '#3b82f6' },
  { name: 'Thanthi TV', url: 'https://www.youtube.com/@ThanthiTV/live',    color: '#10b981' },
]

function getCountdown() {
  const now = Date.now()
  const diff = ELECTION_DATE.getTime() - now
  if (diff <= 0) return null
  const d = Math.floor(diff / (1000 * 60 * 60 * 24))
  const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const s = Math.floor((diff % (1000 * 60)) / 1000)
  return { d, h, m, s }
}

export default function TNElectionBanner() {
  const [countdown, setCountdown] = useState(getCountdown)
  const [isLive, setIsLive] = useState(false)
  const [activeStream, setActiveStream] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const id = setInterval(() => {
      const c = getCountdown()
      setCountdown(c)
      setIsLive(c === null)
    }, 1000)
    return () => clearInterval(id)
  }, [])

  if (dismissed) return null

  const isCountingDay = countdown === null || (countdown.d === 0)

  return (
    <div
      className="w-full relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(220,38,38,0.06) 50%, rgba(245,158,11,0.04) 100%)',
        borderBottom: '1px solid rgba(245,158,11,0.2)',
      }}
    >
      {/* Animated border top */}
      <div className="h-1 w-full flex">
        <div className="flex-1 bg-red-600" />
        <div className="flex-1 bg-green-600" />
        <div className="flex-1" style={{ background: '#f59e0b' }} />
        <div className="flex-1 bg-orange-500" />
        <div className="flex-1 bg-blue-600" />
        <div className="flex-1 bg-purple-600" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">

        {/* Header row */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            {isLive ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black flex-shrink-0 animate-pulse"
                style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.5)', color: '#ef4444' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                LIVE
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black flex-shrink-0"
                style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', color: '#f59e0b' }}>
                <Zap className="w-3 h-3" />
                COUNTING STARTS MAY 4
              </span>
            )}
            <div className="min-w-0">
              <h3 className="text-white font-black text-sm sm:text-base leading-tight">
                TN Local Body Election {isLive ? '— Counting LIVE 🔴' : '2026'}
              </h3>
              <p className="text-white/40 text-[10px] sm:text-xs truncate">
                {isLive ? 'Real-time vote counting underway across Tamil Nadu' : 'Vote counting begins May 4 — watch live results across all parties'}
              </p>
            </div>
          </div>

          {/* Dismiss */}
          <button
            onClick={() => setDismissed(true)}
            className="text-white/20 hover:text-white/60 text-lg leading-none flex-shrink-0 transition-colors"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>

        {/* Countdown or LIVE indicator */}
        {!isLive && countdown && (
          <div className="flex items-center gap-2 sm:gap-3 mb-3">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span className="text-white/40 text-xs flex-shrink-0">Counting begins in:</span>
            {[
              { val: countdown.d, label: 'Days' },
              { val: countdown.h, label: 'Hrs' },
              { val: countdown.m, label: 'Min' },
              { val: countdown.s, label: 'Sec' },
            ].map(({ val, label }) => (
              <div key={label} className="countdown-digit rounded-lg px-2 py-1 text-center min-w-[42px]">
                <div className="text-amber-400 font-black text-base sm:text-lg leading-none tabular-nums">
                  {String(val).padStart(2, '0')}
                </div>
                <div className="text-white/30 text-[9px] uppercase tracking-wider">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Party count pools */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
          {PARTIES.map(party => (
            <div
              key={party.id}
              className="rounded-xl p-2 text-center transition-all hover:scale-[1.03]"
              style={{ background: party.bg, border: `1px solid ${party.border}` }}
            >
              <div className="text-base sm:text-lg leading-none mb-0.5">{party.symbol}</div>
              <div className="font-black text-xs" style={{ color: party.color }}>{party.name}</div>
              <div className="text-[9px] text-white/40 truncate">{party.fullName}</div>
              {isLive ? (
                <div className="mt-1">
                  <div className="font-black text-sm text-white">{party.seats ?? '—'}</div>
                  <div className="text-[9px] text-white/30">seats</div>
                </div>
              ) : (
                <div className="mt-1 text-[9px] text-white/25">awaiting</div>
              )}
            </div>
          ))}
        </div>

        {/* Live stream links */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-white/30 text-xs flex-shrink-0">Watch live:</span>
          {STREAMS.map((stream, i) => (
            <a
              key={stream.name}
              href={stream.url}
              target="_blank"
              rel="noopener noreferrer"
              data-track="election-stream"
              data-track-value={stream.name}
              onClick={() => setActiveStream(i)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold transition-all hover:scale-105 active:scale-95"
              style={{
                background: activeStream === i ? `${stream.color}22` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${activeStream === i ? stream.color + '55' : 'rgba(255,255,255,0.1)'}`,
                color: activeStream === i ? stream.color : 'rgba(255,255,255,0.5)',
              }}
            >
              {isLive && <span className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0" style={{ background: stream.color }} />}
              {stream.name}
              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
            </a>
          ))}
        </div>
      </div>

      {/* Subtle bottom gradient */}
      <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.2), transparent)' }} />
    </div>
  )
}
