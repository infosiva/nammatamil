'use client'

import { useState, useEffect } from 'react'
import { Radio, ChevronDown, ChevronUp } from 'lucide-react'

const SCHEDULE: {
  time: string; show: string; channel: string; color: string
  type: 'serial' | 'movie' | 'show'; emoji: string
}[] = [
  { time: '18:00', show: 'Pandian Stores',       channel: 'Vijay TV',     color: '#f97316', type: 'serial', emoji: '🏠' },
  { time: '18:30', show: 'Baakiyalakshmi',       channel: 'Vijay TV',     color: '#f97316', type: 'serial', emoji: '👩' },
  { time: '19:00', show: 'Chithi',               channel: 'Sun TV',       color: '#dc2626', type: 'serial', emoji: '💌' },
  { time: '19:00', show: 'Raja Rani S2',          channel: 'Zee Tamil',   color: '#7c3aed', type: 'serial', emoji: '👑' },
  { time: '19:30', show: 'Anandham',             channel: 'Sun TV',       color: '#dc2626', type: 'serial', emoji: '😊' },
  { time: '19:30', show: 'Rettai Roja',          channel: 'Colors Tamil', color: '#ec4899', type: 'serial', emoji: '🌹' },
  { time: '20:00', show: 'Kana Kaanum Kalangal', channel: 'Sun TV',       color: '#dc2626', type: 'show',   emoji: '🎓' },
  { time: '20:30', show: 'Super Singer',         channel: 'Vijay TV',     color: '#f97316', type: 'show',   emoji: '🎤' },
  { time: '21:00', show: 'Tamil Movie',          channel: 'Sun TV',       color: '#dc2626', type: 'movie',  emoji: '🎬' },
  { time: '21:00', show: 'Bigg Boss Tamil',      channel: 'Vijay TV',     color: '#f97316', type: 'show',   emoji: '🏠' },
  { time: '22:00', show: 'Tamil Dubbed Movie',   channel: 'Zee Tamil',    color: '#7c3aed', type: 'movie',  emoji: '🎥' },
]

function getISTMinutes() {
  const now    = new Date()
  const utcMs  = now.getTime() + now.getTimezoneOffset() * 60_000
  const istMs  = utcMs + 5.5 * 3_600_000
  const ist    = new Date(istMs)
  return ist.getHours() * 60 + ist.getMinutes()
}

function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function fmt(t: string) {
  const [h, m] = t.split(':').map(Number)
  const ap = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ap}`
}

export default function TVKWidget() {
  const [nowMin, setNowMin] = useState(getISTMinutes)
  const [open, setOpen]     = useState(true)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    // Restore dismissed state from session storage
    const dismissed = sessionStorage.getItem('tvkwidget-hidden')
    if (dismissed === '1') setHidden(true)
  }, [])

  useEffect(() => {
    const id = setInterval(() => setNowMin(getISTMinutes()), 30_000)
    return () => clearInterval(id)
  }, [])

  const sorted   = [...SCHEDULE].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))
  const live     = sorted.filter(s => {
    const start = timeToMinutes(s.time)
    return start <= nowMin && nowMin < start + 60
  })
  const upcoming = sorted.filter(s => timeToMinutes(s.time) > nowMin).slice(0, 3)

  const isNighttime = nowMin < 18 * 60 || nowMin >= 23 * 60
  if ((isNighttime && live.length === 0) || hidden) return null

  return (
    <div className="fixed top-[60px] right-3 z-[200] select-none" style={{ maxWidth: 200 }}>
      <div className="rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: 'rgba(8,4,20,0.96)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 16px 48px rgba(0,0,0,0.7)',
        }}>

        {/* ── Header ── */}
        <div className="flex items-center" style={{ borderBottom: open ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
          <button
            onClick={() => setOpen(o => !o)}
            className="flex-1 flex items-center gap-2 px-3 py-2.5 transition-colors"
          >
            {/* Live pulse dot */}
            <div className="relative flex-shrink-0">
              <Radio className="w-3.5 h-3.5 text-red-400" />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-red-500" />
            </div>
            <span className="flex-1 text-left text-[11px] font-black text-white tracking-tight">
              {live.length > 0 ? 'On Air Now' : 'Coming Up'}
            </span>
            <span className="text-white/25">
              {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </span>
          </button>
          {/* Close / hide button */}
          <button
            onClick={() => { setHidden(true); sessionStorage.setItem('tvkwidget-hidden', '1') }}
            className="px-2 py-2.5 text-white/20 hover:text-white/60 transition-colors flex-shrink-0"
            title="Hide"
            style={{ fontSize: 14, lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        {open && (
          <div className="px-3 py-2.5 space-y-2">

            {/* ── Live shows ── */}
            {live.length > 0 && (
              <div className="space-y-1.5">
                {live.map((s, i) => (
                  <div key={i}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-xl"
                    style={{ background: `${s.color}14`, border: `1px solid ${s.color}30` }}>
                    <span className="text-lg leading-none flex-shrink-0">{s.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-black text-[11px] leading-tight truncate">{s.show}</p>
                      <p className="text-[9px] font-semibold mt-0.5 truncate" style={{ color: s.color }}>{s.channel}</p>
                    </div>
                    <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: s.color }} />
                  </div>
                ))}
              </div>
            )}

            {/* ── Up next ── */}
            {upcoming.length > 0 && (
              <>
                {live.length > 0 && (
                  <p className="text-[8px] font-bold uppercase tracking-widest text-white/20 pt-0.5">Up Next</p>
                )}
                <div className="space-y-1">
                  {upcoming.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 py-1">
                      <span className="text-[8px] font-bold tabular-nums text-white/25 w-12 flex-shrink-0">{fmt(s.time)}</span>
                      <span className="text-[10px] leading-none flex-shrink-0">{s.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/60 text-[10px] font-semibold truncate leading-tight">{s.show}</p>
                        <p className="text-[8px] truncate" style={{ color: s.color + '99' }}>{s.channel}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {live.length === 0 && upcoming.length === 0 && (
              <p className="text-white/25 text-[10px] text-center py-2">No schedule right now</p>
            )}
          </div>
        )}

        {/* bottom accent */}
        <div className="h-px w-full" style={{
          background: 'linear-gradient(90deg, #dc2626, #f97316, #7c3aed, #f59e0b)',
        }} />
      </div>
    </div>
  )
}
