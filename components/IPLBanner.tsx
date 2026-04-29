'use client'

import { useState, useEffect } from 'react'
import { X, ChevronRight } from 'lucide-react'

interface LiveMatch {
  id: string
  team1Short: string; team1Color: string
  team2Short: string; team2Color: string
  score1?: string; score2?: string
  /** ISO date string: YYYY-MM-DD */
  isoDate: string
  time: string
  venue: string
  status: 'live' | 'upcoming' | 'completed'
  result?: string
}

interface StandingRow {
  pos: number; team: string; color: string
  pts: number; played: number; w: number; l: number; nrr: string
}

// ─── Standings — updated after Match 40 (PBKS vs RR, Apr 28) ────────────────
// PBKS won → still unbeaten, 15 pts, 8 played
const STANDINGS: StandingRow[] = [
  { pos: 1,  team: 'PBKS', color: '#a855f7', pts: 15, played: 8,  w: 7, l: 0, nrr: '+1.512' },
  { pos: 2,  team: 'RCB',  color: '#ef4444', pts: 12, played: 8,  w: 6, l: 2, nrr: '+1.919' },
  { pos: 3,  team: 'SRH',  color: '#f97316', pts: 10, played: 8,  w: 5, l: 3, nrr: '+0.815' },
  { pos: 4,  team: 'RR',   color: '#ec4899', pts: 10, played: 9,  w: 5, l: 4, nrr: '+0.481' },
  { pos: 5,  team: 'GT',   color: '#6b7280', pts: 8,  played: 8,  w: 4, l: 4, nrr: '-0.475' },
  { pos: 6,  team: 'CSK',  color: '#eab308', pts: 6,  played: 8,  w: 3, l: 5, nrr: '-0.121' },
  { pos: 7,  team: 'DC',   color: '#3b82f6', pts: 6,  played: 8,  w: 3, l: 5, nrr: '-1.060' },
  { pos: 8,  team: 'KKR',  color: '#7c3aed', pts: 5,  played: 8,  w: 2, l: 5, nrr: '-0.751' },
  { pos: 9,  team: 'MI',   color: '#0ea5e9', pts: 4,  played: 7,  w: 2, l: 5, nrr: '-0.736' },
  { pos: 10, team: 'LSG',  color: '#14b8a6', pts: 4,  played: 8,  w: 2, l: 6, nrr: '-1.106' },
]

// ─── All IPL 2026 upcoming fixtures (remaining after Apr 29) ─────────────────
// Using ISO dates so label logic ("Today"/"Tomorrow"/date) stays accurate forever
const ALL_MATCHES: LiveMatch[] = [
  // ── Completed ──
  {
    id: 'c1', status: 'completed',
    team1Short: 'DC',   team1Color: '#3b82f6',
    team2Short: 'RCB',  team2Color: '#ef4444',
    isoDate: '2026-04-27', time: '', venue: 'Delhi',
    score1: '75 (16.3)', score2: '76/1 (6.3)',
    result: 'RCB won by 9 wkts',
  },
  {
    id: 'c2', status: 'completed',
    team1Short: 'PBKS', team1Color: '#a855f7',
    team2Short: 'RR',   team2Color: '#ec4899',
    isoDate: '2026-04-28', time: '', venue: 'Mullanpur',
    score1: '183/5 (20)', score2: '158/8 (20)',
    result: 'PBKS won by 25 runs',
  },
  // ── Today Apr 29 ──
  {
    id: 'u1', status: 'upcoming',
    team1Short: 'MI',  team1Color: '#0ea5e9',
    team2Short: 'SRH', team2Color: '#f97316',
    isoDate: '2026-04-29', time: '7:30 PM', venue: 'Wankhede',
  },
  // ── Apr 30 ──
  {
    id: 'u2', status: 'upcoming',
    team1Short: 'GT',  team1Color: '#6b7280',
    team2Short: 'RCB', team2Color: '#ef4444',
    isoDate: '2026-04-30', time: '7:30 PM', venue: 'Ahmedabad',
  },
  // ── May 1 ──
  {
    id: 'u3', status: 'upcoming',
    team1Short: 'LSG', team1Color: '#14b8a6',
    team2Short: 'KKR', team2Color: '#7c3aed',
    isoDate: '2026-05-01', time: '7:30 PM', venue: 'Lucknow',
  },
  // ── May 2 ──
  {
    id: 'u4', status: 'upcoming',
    team1Short: 'CSK', team1Color: '#eab308',
    team2Short: 'DC',  team2Color: '#3b82f6',
    isoDate: '2026-05-02', time: '3:30 PM', venue: 'Chennai',
  },
  {
    id: 'u5', status: 'upcoming',
    team1Short: 'PBKS', team1Color: '#a855f7',
    team2Short: 'SRH',  team2Color: '#f97316',
    isoDate: '2026-05-02', time: '7:30 PM', venue: 'Mullanpur',
  },
  // ── May 3 ──
  {
    id: 'u6', status: 'upcoming',
    team1Short: 'MI',  team1Color: '#0ea5e9',
    team2Short: 'RR',  team2Color: '#ec4899',
    isoDate: '2026-05-03', time: '3:30 PM', venue: 'Wankhede',
  },
  {
    id: 'u7', status: 'upcoming',
    team1Short: 'KKR', team1Color: '#7c3aed',
    team2Short: 'GT',  team2Color: '#6b7280',
    isoDate: '2026-05-03', time: '7:30 PM', venue: 'Eden Gardens',
  },
  // ── May 4 ──
  {
    id: 'u8', status: 'upcoming',
    team1Short: 'RCB', team1Color: '#ef4444',
    team2Short: 'CSK', team2Color: '#eab308',
    isoDate: '2026-05-04', time: '7:30 PM', venue: 'Bengaluru',
  },
  // ── May 5 ──
  {
    id: 'u9', status: 'upcoming',
    team1Short: 'LSG', team1Color: '#14b8a6',
    team2Short: 'PBKS', team2Color: '#a855f7',
    isoDate: '2026-05-05', time: '7:30 PM', venue: 'Lucknow',
  },
]

// ─── Date label helpers ───────────────────────────────────────────────────────
function toLocalDateStr(date: Date): string {
  // Returns YYYY-MM-DD in IST (UTC+5:30)
  const ist = new Date(date.getTime() + 5.5 * 60 * 60 * 1000)
  return ist.toISOString().slice(0, 10)
}

function getDateLabel(isoDate: string, todayStr: string, tomorrowStr: string): string {
  if (isoDate === todayStr) return 'Today'
  if (isoDate === tomorrowStr) return 'Tomorrow'
  // Format: "May 2"
  const [, m, d] = isoDate.split('-').map(Number)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[m - 1]} ${d}`
}

export default function IPLBanner() {
  const [dismissed, setDismissed] = useState(false)
  const [tab, setTab]             = useState<'matches' | 'standings'>('matches')
  const [todayStr, setTodayStr]   = useState('')
  const [tomorrowStr, setTomorrowStr] = useState('')

  // Recalculate today/tomorrow every minute so labels stay accurate
  useEffect(() => {
    function update() {
      const now = new Date()
      const today    = toLocalDateStr(now)
      const tomorrow = toLocalDateStr(new Date(now.getTime() + 86_400_000))
      setTodayStr(today)
      setTomorrowStr(tomorrow)
    }
    update()
    const id = setInterval(update, 60_000)
    return () => clearInterval(id)
  }, [])

  if (dismissed || !todayStr) return null

  // ── Filter: show today + upcoming. Also show last 2 completed for context.
  const upcoming  = ALL_MATCHES.filter(m => m.isoDate >= todayStr).slice(0, 6)
  const recent    = ALL_MATCHES
    .filter(m => m.status === 'completed' && m.isoDate < todayStr)
    .slice(-2)
  const displayed = [...recent, ...upcoming]

  const nextMatch = upcoming.find(m => m.status === 'upcoming')

  return (
    <div className="w-full" style={{ background: '#0d0d14', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Colour accent bar */}
      <div className="h-[2px]" style={{ background: 'linear-gradient(90deg,#a855f7 0%,#ef4444 35%,#f97316 65%,#eab308 100%)' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">

        {/* ── Top row ── */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-[10px] font-black tracking-wider px-2 py-0.5 rounded flex-shrink-0"
            style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)' }}>
            🏏 IPL 2026
          </span>
          {nextMatch && (
            <p className="text-white/45 text-xs flex-1 truncate min-w-0">
              Next —{' '}
              <span className="font-bold" style={{ color: nextMatch.team1Color }}>{nextMatch.team1Short}</span>
              <span className="text-white/25 mx-1">vs</span>
              <span className="font-bold" style={{ color: nextMatch.team2Color }}>{nextMatch.team2Short}</span>
              <span className="text-white/25 ml-1.5">
                {getDateLabel(nextMatch.isoDate, todayStr, tomorrowStr)} · {nextMatch.time} IST
              </span>
            </p>
          )}
          <button onClick={() => setDismissed(true)} className="ml-auto text-white/20 hover:text-white/50 transition-colors flex-shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ── Tab pills ── */}
        <div className="flex gap-1.5 mb-3">
          {(['matches', 'standings'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-2.5 py-1 rounded-full text-[11px] font-bold transition-all"
              style={{
                background: tab === t ? 'rgba(245,158,11,0.14)' : 'transparent',
                border: `1px solid ${tab === t ? 'rgba(245,158,11,0.35)' : 'rgba(255,255,255,0.08)'}`,
                color: tab === t ? '#f59e0b' : 'rgba(255,255,255,0.35)',
              }}>
              {t === 'matches' ? '📅 Fixtures' : '🏆 Table'}
            </button>
          ))}
        </div>

        {/* ── Matches tab ── */}
        {tab === 'matches' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
            {displayed.map(m => {
              const label      = getDateLabel(m.isoDate, todayStr, tomorrowStr)
              const isToday    = m.isoDate === todayStr
              const isDone     = m.status === 'completed'
              const isLive     = m.status === 'live'

              return (
                <div key={m.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{
                    background: isToday && !isDone ? 'rgba(245,158,11,0.05)' : isDone ? 'transparent' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isToday && !isDone ? 'rgba(245,158,11,0.15)' : isDone ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.06)'}`,
                  }}>

                  {/* Date pill */}
                  <span className="text-[9px] font-black w-16 flex-shrink-0 text-center px-1.5 py-0.5 rounded-md"
                    style={{
                      background: isDone ? 'rgba(255,255,255,0.04)' : isLive ? 'rgba(239,68,68,0.15)' : isToday ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.05)',
                      color: isDone ? 'rgba(255,255,255,0.25)' : isLive ? '#f87171' : isToday ? '#f59e0b' : 'rgba(255,255,255,0.45)',
                    }}>
                    {isDone ? 'FT' : isLive ? '🔴 LIVE' : label}
                  </span>

                  {/* Teams */}
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className="font-black text-sm leading-none" style={{ color: m.team1Color }}>{m.team1Short}</span>
                    {m.score1 && <span className="text-white/35 text-[9px] font-mono truncate">{m.score1}</span>}
                    <span className="text-white/20 text-[10px] flex-shrink-0">v</span>
                    <span className="font-black text-sm leading-none" style={{ color: m.team2Color }}>{m.team2Short}</span>
                    {m.score2 && <span className="text-white/35 text-[9px] font-mono truncate">{m.score2}</span>}
                  </div>

                  {/* Right: result or time */}
                  <div className="flex-shrink-0 text-right min-w-[56px]">
                    {m.result ? (
                      <span className="text-[9px] text-white/40 leading-tight">{m.result}</span>
                    ) : (
                      <div>
                        <p className="text-[10px] font-bold" style={{ color: isToday ? '#f59e0b' : 'rgba(255,255,255,0.45)' }}>{m.time}</p>
                        <p className="text-[9px] text-white/20 truncate">{m.venue}</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Standings tab ── */}
        {tab === 'standings' && (
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="grid px-3 py-1.5 border-b border-white/5"
              style={{ gridTemplateColumns: '16px 1fr 28px 28px 28px 52px 32px' }}>
              {['#','TEAM','P','W','L','NRR','PTS'].map(h => (
                <span key={h} className="text-[9px] font-bold text-white/20 text-center first:text-left last:text-right">{h}</span>
              ))}
            </div>
            {STANDINGS.map((row, i) => (
              <div key={row.team}
                className="grid items-center px-3 py-1.5"
                style={{
                  gridTemplateColumns: '16px 1fr 28px 28px 28px 52px 32px',
                  background: i < 4 ? `${row.color}0a` : i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
                  borderBottom: i < STANDINGS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}>
                <span className="text-[10px] text-white/25">{row.pos}</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-sm flex items-center justify-center text-[8px] font-black text-white flex-shrink-0"
                    style={{ background: row.color }}>
                    {row.team.slice(0, 1)}
                  </span>
                  <span className="font-bold text-[11px]" style={{ color: row.color }}>{row.team}</span>
                  {i < 4 && <span className="w-1 h-1 rounded-full bg-green-400/50 flex-shrink-0" />}
                </div>
                <span className="text-[10px] text-white/35 text-center">{row.played}</span>
                <span className="text-[10px] text-green-400/80 text-center font-semibold">{row.w}</span>
                <span className="text-[10px] text-red-400/60 text-center">{row.l}</span>
                <span className={`text-[10px] font-mono text-center ${parseFloat(row.nrr) >= 0 ? 'text-green-400/70' : 'text-red-400/60'}`}>{row.nrr}</span>
                <span className="font-black text-[11px] text-right" style={{ color: row.color }}>{row.pts}</span>
              </div>
            ))}
            <div className="px-3 py-1.5 border-t border-white/5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400/50" />
              <span className="text-[9px] text-white/20">Top 4 qualify for playoffs · Updated {new Date().toLocaleDateString('en-IN', { day:'numeric', month:'short' })}</span>
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="mt-2.5 flex justify-end">
          <a href="https://www.iplt20.com" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-0.5 text-[10px] text-white/20 hover:text-white/50 transition-colors">
            iplt20.com <ChevronRight className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  )
}
