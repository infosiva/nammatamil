'use client'

import { useState, useEffect } from 'react'
import { Zap, TrendingUp, X, ChevronDown, ChevronUp } from 'lucide-react'

// TN Local Body Election — May 4, 2026 (counting day)
const ELECTION_DATE = new Date('2026-05-04T06:00:00+05:30') // counting starts ~6 AM IST

// Party data — correct symbols matching actual election symbols
const PARTIES = [
  {
    id: 'dmk',
    name: 'DMK',
    fullName: 'திமுக',
    color: '#dc2626',
    bg: 'rgba(220,38,38,0.12)',
    border: 'rgba(220,38,38,0.35)',
    // DMK symbol: Rising Sun
    symbolSvg: (
      <svg viewBox="0 0 32 32" className="w-6 h-6 mx-auto">
        <circle cx="16" cy="20" r="7" fill="#dc2626"/>
        {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg, i) => (
          <line key={i}
            x1={16 + 10 * Math.cos((deg-90)*Math.PI/180)}
            y1={20 + 10 * Math.sin((deg-90)*Math.PI/180)}
            x2={16 + 14 * Math.cos((deg-90)*Math.PI/180)}
            y2={20 + 14 * Math.sin((deg-90)*Math.PI/180)}
            stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round"
          />
        ))}
        <path d="M4 20 Q16 4 28 20" fill="#dc2626" opacity="0.35"/>
      </svg>
    ),
    seats: null,
  },
  {
    id: 'aiadmk',
    name: 'AIADMK',
    fullName: 'அதிமுக',
    color: '#16a34a',
    bg: 'rgba(22,163,74,0.12)',
    border: 'rgba(22,163,74,0.35)',
    // AIADMK symbol: Two Leaves
    symbolSvg: (
      <svg viewBox="0 0 32 32" className="w-6 h-6 mx-auto">
        <path d="M16 28 C16 28 6 20 6 12 C6 7 10 4 16 8 C22 4 26 7 26 12 C26 20 16 28 16 28Z" fill="none" stroke="#16a34a" strokeWidth="2"/>
        <path d="M16 28 C14 22 8 18 8 12 C8 8 11 6 16 8" fill="#16a34a" opacity="0.4"/>
        <path d="M16 28 C18 22 24 18 24 12 C24 8 21 6 16 8" fill="#16a34a" opacity="0.7"/>
        <line x1="16" y1="28" x2="16" y2="10" stroke="#16a34a" strokeWidth="1.5"/>
      </svg>
    ),
    seats: null,
  },
  {
    id: 'tvk',
    name: 'TVK',
    fullName: 'தவக',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.15)',
    border: 'rgba(245,158,11,0.4)',
    // TVK symbol: Whistle (விசில் — Thalapathy Vijay's party symbol)
    symbolSvg: (
      <svg viewBox="0 0 32 32" className="w-6 h-6 mx-auto">
        {/* Whistle body */}
        <rect x="4" y="12" width="16" height="10" rx="5" fill="#f59e0b"/>
        {/* Mouthpiece stem */}
        <rect x="18" y="15" width="8" height="4" rx="2" fill="#d97706"/>
        {/* Air hole on top */}
        <rect x="7" y="10" width="5" height="3" rx="1.5" fill="#d97706"/>
        {/* Ball inside whistle (circle detail) */}
        <circle cx="12" cy="17" r="2.5" fill="none" stroke="#92400e" strokeWidth="1.2"/>
        <circle cx="12" cy="17" r="1" fill="#92400e" opacity="0.6"/>
        {/* Ring/loop at left end */}
        <circle cx="5" cy="17" r="2.5" fill="none" stroke="#f59e0b" strokeWidth="1.5"/>
      </svg>
    ),
    seats: null,
  },
  {
    id: 'bjp',
    name: 'BJP',
    fullName: 'பாஜக',
    color: '#f97316',
    bg: 'rgba(249,115,22,0.12)',
    border: 'rgba(249,115,22,0.35)',
    // BJP symbol: Lotus flower
    symbolSvg: (
      <svg viewBox="0 0 32 32" className="w-6 h-6 mx-auto">
        <ellipse cx="16" cy="22" rx="10" ry="4" fill="#f97316" opacity="0.3"/>
        <path d="M16 8 C16 8 10 14 10 20 C12 18 14 17 16 22 C18 17 20 18 22 20 C22 14 16 8 16 8Z" fill="#f97316"/>
        <path d="M9 12 C9 12 5 16 7 22 C9 19 12 18 16 22 C12 17 9 14 9 12Z" fill="#f97316" opacity="0.6"/>
        <path d="M23 12 C23 12 27 16 25 22 C23 19 20 18 16 22 C20 17 23 14 23 12Z" fill="#f97316" opacity="0.6"/>
        <circle cx="16" cy="20" r="2.5" fill="#fbbf24"/>
      </svg>
    ),
    seats: null,
  },
  {
    id: 'inc',
    name: 'Congress',
    fullName: 'காங்கிரஸ்',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.12)',
    border: 'rgba(59,130,246,0.35)',
    // Congress symbol: Hand (open palm)
    symbolSvg: (
      <svg viewBox="0 0 32 32" className="w-6 h-6 mx-auto">
        <rect x="10" y="16" width="12" height="11" rx="2" fill="#3b82f6"/>
        <rect x="10" y="10" width="2.5" height="8" rx="1.25" fill="#3b82f6"/>
        <rect x="13" y="8" width="2.5" height="10" rx="1.25" fill="#3b82f6"/>
        <rect x="16.5" y="8" width="2.5" height="10" rx="1.25" fill="#3b82f6"/>
        <rect x="19.5" y="10" width="2.5" height="8" rx="1.25" fill="#3b82f6"/>
        <rect x="7.5" y="14" width="2.5" height="7" rx="1.25" fill="#3b82f6" transform="rotate(-15 7.5 17)"/>
      </svg>
    ),
    seats: null,
  },
  {
    id: 'pmk',
    name: 'PMK',
    fullName: 'பாமக',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.12)',
    border: 'rgba(16,185,129,0.35)',
    // PMK symbol: Mango
    symbolSvg: (
      <svg viewBox="0 0 32 32" className="w-6 h-6 mx-auto">
        <path d="M16 6 C10 6 6 12 8 18 C10 24 14 27 16 27 C18 27 22 24 24 18 C26 12 22 6 16 6Z" fill="#10b981"/>
        <path d="M16 6 C14 8 13 12 14 18 C15 22 16 27 16 27" stroke="#065f46" strokeWidth="1" fill="none" opacity="0.5"/>
        <line x1="16" y1="6" x2="18" y2="2" stroke="#10b981" strokeWidth="2" strokeLinecap="round"/>
        <path d="M18 2 C20 1 22 3 20 4" stroke="#10b981" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      </svg>
    ),
    seats: null,
  },
]

// Live stream YouTube channel IDs for direct embed
const STREAMS = [
  { name: 'Sun News',             channelId: 'UCj9AS2DWFBCg-3HqbvBnMYA', color: '#dc2626' },
  { name: 'Puthiya Thalaimurai',  channelId: 'UCzN2mJH6M0m0Nq7FJeAnHiA', color: '#f97316' },
  { name: 'News18 Tamil',         channelId: 'UCp4DmMG2eTHX-k6jJ3QBXZQ', color: '#3b82f6' },
  { name: 'Thanthi TV',           channelId: 'UCnInANB7yJnYrSjMmJBbHZg', color: '#10b981' },
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
  const [isLive, setIsLive] = useState(() => getCountdown() === null)
  const [activeStream, setActiveStream] = useState(0)
  const [dismissed, setDismissed] = useState(false)
  const [showEmbed, setShowEmbed] = useState(false)

  useEffect(() => {
    const id = setInterval(() => {
      const c = getCountdown()
      setCountdown(c)
      setIsLive(c === null)
    }, 1000)
    return () => clearInterval(id)
  }, [])

  if (dismissed) return null

  // YouTube live stream embed URL for selected channel
  const embedUrl = `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(STREAMS[activeStream].name + ' election counting live')}&autoplay=1&mute=1`

  return (
    <div
      className="w-full relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(245,158,11,0.07) 0%, rgba(220,38,38,0.05) 50%, rgba(245,158,11,0.04) 100%)',
        borderBottom: '1px solid rgba(245,158,11,0.18)',
      }}
    >
      {/* Party colour stripe top */}
      <div className="h-1 w-full flex">
        <div className="flex-1 bg-red-600" />
        <div className="flex-1 bg-green-600" />
        <div className="flex-1" style={{ background: '#f59e0b' }} />
        <div className="flex-1 bg-orange-500" />
        <div className="flex-1 bg-blue-600" />
        <div className="flex-1 bg-emerald-500" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">

        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            {isLive ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black flex-shrink-0"
                style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.5)', color: '#ef4444' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping inline-block" />
                LIVE
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black flex-shrink-0"
                style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', color: '#f59e0b' }}>
                <Zap className="w-3 h-3" />
                MAY 4
              </span>
            )}
            <div className="min-w-0">
              <h3 className="text-white font-black text-sm sm:text-base leading-tight">
                தமிழ்நாடு தேர்தல் முடிவுகள் {isLive ? '— நேரலை 🔴' : '2026'}
              </h3>
              <p className="text-white/40 text-[10px] sm:text-xs">
                TN Local Body Election · Counting {isLive ? 'underway LIVE' : 'starts May 4, 2026'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-white/25 hover:text-white/70 transition-colors flex-shrink-0 p-1"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Countdown */}
        {!isLive && countdown && (
          <div className="flex items-center gap-2 sm:gap-3 mb-3 flex-wrap">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span className="text-white/35 text-xs">Counting begins in:</span>
            {[
              { val: countdown.d, label: 'Days' },
              { val: countdown.h, label: 'Hrs' },
              { val: countdown.m, label: 'Min' },
              { val: countdown.s, label: 'Sec' },
            ].map(({ val, label }) => (
              <div key={label} className="countdown-digit rounded-lg px-2.5 py-1 text-center min-w-[44px]">
                <div className="text-amber-400 font-black text-base sm:text-lg leading-none tabular-nums">
                  {String(val).padStart(2, '0')}
                </div>
                <div className="text-white/30 text-[9px] uppercase tracking-wider">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Party vote count grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
          {PARTIES.map(party => (
            <div
              key={party.id}
              className="rounded-xl p-2 text-center transition-all hover:scale-[1.03] cursor-default"
              style={{ background: party.bg, border: `1px solid ${party.border}` }}
            >
              <div className="mb-1">{party.symbolSvg}</div>
              <div className="font-black text-[11px] sm:text-xs leading-tight" style={{ color: party.color }}>{party.name}</div>
              <div className="text-[8px] text-white/35 truncate">{party.fullName}</div>
              {isLive ? (
                <div className="mt-1">
                  <div className="font-black text-sm text-white tabular-nums">{party.seats ?? '—'}</div>
                  <div className="text-[8px] text-white/30">seats</div>
                </div>
              ) : (
                <div className="mt-1 text-[8px] text-white/20">May 4</div>
              )}
            </div>
          ))}
        </div>

        {/* Stream selector + toggle embed */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-white/30 text-xs flex-shrink-0">Watch live:</span>
          {STREAMS.map((stream, i) => (
            <button
              key={stream.name}
              onClick={() => { setActiveStream(i); setShowEmbed(true) }}
              data-track="election-stream"
              data-track-value={stream.name}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold transition-all hover:scale-105 active:scale-95"
              style={{
                background: activeStream === i && showEmbed ? `${stream.color}25` : 'rgba(255,255,255,0.05)',
                border: `1px solid ${activeStream === i && showEmbed ? stream.color + '60' : 'rgba(255,255,255,0.1)'}`,
                color: activeStream === i && showEmbed ? stream.color : 'rgba(255,255,255,0.55)',
              }}
            >
              {isLive && <span className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0" style={{ background: stream.color }} />}
              {stream.name}
            </button>
          ))}
          <button
            onClick={() => setShowEmbed(e => !e)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ml-auto"
            style={{
              background: showEmbed ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${showEmbed ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.1)'}`,
              color: showEmbed ? '#f59e0b' : 'rgba(255,255,255,0.4)',
            }}
          >
            {showEmbed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {showEmbed ? 'Hide stream' : 'Show stream'}
          </button>
        </div>

        {/* Inline YouTube embed — shown when a channel is selected */}
        {showEmbed && (
          <div className="mt-3 rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)', aspectRatio: '16/9', maxHeight: '360px' }}>
            <iframe
              key={activeStream}
              src={embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={`${STREAMS[activeStream].name} Live`}
              style={{ display: 'block', minHeight: '220px' }}
            />
          </div>
        )}
      </div>

      {/* Bottom shimmer line */}
      <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.25), transparent)' }} />
    </div>
  )
}
