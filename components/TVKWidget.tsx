'use client'

import { useState, useEffect } from 'react'
import { Tv2, Circle } from 'lucide-react'

// Tamil TV prime-time schedule (IST) — slot: [hhmm, title, channel, channelColor]
const SCHEDULE: { time: string; show: string; channel: string; color: string; type: 'serial' | 'movie' | 'show' }[] = [
  { time: '18:00', show: 'Pandian Stores',    channel: 'Vijay TV',     color: '#f97316', type: 'serial'  },
  { time: '18:30', show: 'Baakiyalakshmi',    channel: 'Vijay TV',     color: '#f97316', type: 'serial'  },
  { time: '19:00', show: 'Chithi',            channel: 'Sun TV',       color: '#dc2626', type: 'serial'  },
  { time: '19:30', show: 'Anandham',          channel: 'Sun TV',       color: '#dc2626', type: 'serial'  },
  { time: '19:00', show: 'Raja Rani S2',      channel: 'Zee Tamil',    color: '#7c3aed', type: 'serial'  },
  { time: '19:30', show: 'Rettai Roja',       channel: 'Colors Tamil', color: '#ec4899', type: 'serial'  },
  { time: '20:00', show: 'Kana Kaanum Kalangal', channel: 'Sun TV',    color: '#dc2626', type: 'show'    },
  { time: '20:30', show: 'Super Singer',      channel: 'Vijay TV',     color: '#f97316', type: 'show'    },
  { time: '21:00', show: 'Tamil Movie',       channel: 'Sun TV',       color: '#dc2626', type: 'movie'   },
  { time: '21:00', show: 'Bigg Boss Tamil',   channel: 'Vijay TV',     color: '#f97316', type: 'show'    },
  { time: '22:00', show: 'Tamil Dubbed Movie', channel: 'Zee Tamil',   color: '#7c3aed', type: 'movie'   },
]

function getISTMinutes() {
  const now = new Date()
  // IST = UTC+5:30
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000
  const istMs = utcMs + 5.5 * 3_600_000
  const ist = new Date(istMs)
  return ist.getHours() * 60 + ist.getMinutes()
}

function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

export default function TVKWidget() {
  const [nowMin, setNowMin] = useState(getISTMinutes)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setNowMin(getISTMinutes()), 30_000)
    return () => clearInterval(id)
  }, [])

  // Sort by start time, find what's current and upcoming
  const sorted = [...SCHEDULE].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))
  const current = sorted.filter(s => {
    const start = timeToMinutes(s.time)
    return start <= nowMin && nowMin < start + 60
  })
  const upcoming = sorted.filter(s => timeToMinutes(s.time) > nowMin).slice(0, 4)
  const shown = current.length > 0 ? current : upcoming.slice(0, 1)
  const next = upcoming.slice(0, collapsed ? 0 : 3)

  const h = Math.floor(nowMin / 60)
  const m = nowMin % 60
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  const timeStr = `${h12}:${String(m).padStart(2, '0')} ${ampm} IST`

  return (
    <div className="fixed top-3 right-3 z-[200] select-none">
      <div
        className="w-52 rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: '#0c0005',
          border: '1px solid rgba(220,38,38,0.35)',
          boxShadow: '0 0 0 1px rgba(220,38,38,0.06), 0 12px 40px rgba(0,0,0,0.75)',
        }}
      >
        {/* Channel colour stripe */}
        <div className="flex h-1 w-full">
          <div className="flex-1" style={{ background: '#dc2626' }} />
          <div className="flex-1" style={{ background: '#f97316' }} />
          <div className="flex-1" style={{ background: '#7c3aed' }} />
          <div className="flex-1" style={{ background: '#f59e0b' }} />
        </div>

        {/* Header */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="w-full flex items-center gap-2 px-3 pt-2.5 pb-2 hover:bg-white/3 transition-colors"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #dc2626, #991b1b)', boxShadow: '0 0 8px rgba(220,38,38,0.4)' }}
          >
            <Tv2 className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="flex-1 text-left">
            <div className="text-[10px] font-black tracking-wider uppercase" style={{ color: '#f87171' }}>TV Schedule</div>
            <div className="text-[8px] text-white/25 leading-tight">{timeStr}</div>
          </div>
          <span className="text-white/20 text-[10px]">{collapsed ? '▼' : '▲'}</span>
        </button>

        {/* On Now */}
        {!collapsed && (
          <div className="px-3 py-2.5 space-y-1.5">
            <p className="text-[8px] font-bold uppercase tracking-widest text-white/25 mb-1">On Now</p>
            {shown.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <Circle className="w-1.5 h-1.5 flex-shrink-0 fill-current" style={{ color: s.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-[11px] font-bold truncate leading-tight">{s.show}</p>
                  <p className="text-[9px] truncate" style={{ color: s.color + 'cc' }}>{s.channel} · {formatTime(s.time)}</p>
                </div>
              </div>
            ))}

            {/* Upcoming */}
            {next.length > 0 && (
              <>
                <p className="text-[8px] font-bold uppercase tracking-widest text-white/20 pt-1">Up Next</p>
                {next.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 opacity-60">
                    <span className="text-[8px] text-white/30 w-9 flex-shrink-0 text-right">{formatTime(s.time)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/70 text-[10px] truncate leading-tight">{s.show}</p>
                      <p className="text-[8px] text-white/25 truncate">{s.channel}</p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Bottom stripe */}
        <div className="flex h-0.5 w-full">
          <div className="flex-1" style={{ background: '#dc2626' }} />
          <div className="flex-1" style={{ background: '#f97316' }} />
          <div className="flex-1" style={{ background: '#7c3aed' }} />
          <div className="flex-1" style={{ background: '#f59e0b' }} />
        </div>
      </div>
    </div>
  )
}
