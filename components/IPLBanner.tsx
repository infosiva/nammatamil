'use client'

import { useState, useEffect } from 'react'
import { X, ChevronRight } from 'lucide-react'

// IPL 2026 — current & upcoming Tamil Nadu connected matches
// CSK = Chennai Super Kings (most Tamil fans follow)
const MATCHES = [
  {
    id: 1,
    team1: 'CSK', team1Full: 'Chennai Super Kings', team1Color: '#f59e0b', team1Short: 'CHE',
    team2: 'MI',  team2Full: 'Mumbai Indians',      team2Color: '#1e40af', team2Short: 'MUM',
    date: 'Apr 29', time: '7:30 PM IST', venue: 'MA Chidambaram Stadium, Chennai',
    status: 'upcoming',
    score1: null, score2: null, result: null,
  },
  {
    id: 2,
    team1: 'CSK', team1Full: 'Chennai Super Kings', team1Color: '#f59e0b', team1Short: 'CHE',
    team2: 'RCB',  team2Full: 'Royal Challengers',  team2Color: '#dc2626', team2Short: 'BLR',
    date: 'May 2', time: '3:30 PM IST', venue: 'MA Chidambaram Stadium, Chennai',
    status: 'upcoming',
    score1: null, score2: null, result: null,
  },
  {
    id: 3,
    team1: 'CSK', team1Full: 'Chennai Super Kings', team1Color: '#f59e0b', team1Short: 'CHE',
    team2: 'KKR',  team2Full: 'Kolkata Knight Riders', team2Color: '#7c3aed', team2Short: 'KOL',
    date: 'Apr 26', time: 'Completed', venue: 'Eden Gardens, Kolkata',
    status: 'completed',
    score1: '182/6', score2: '178/8',
    result: 'CSK won by 4 runs',
  },
]

// IPL standings (simplified — CSK & other top teams)
const STANDINGS = [
  { pos: 1, team: 'MI',  color: '#1e40af', pts: 14, w: 7, l: 2 },
  { pos: 2, team: 'CSK', color: '#f59e0b', pts: 12, w: 6, l: 3 },
  { pos: 3, team: 'RCB', color: '#dc2626', pts: 10, w: 5, l: 4 },
  { pos: 4, team: 'GT',  color: '#1d4ed8', pts: 10, w: 5, l: 4 },
  { pos: 5, team: 'SRH', color: '#f97316', pts: 8,  w: 4, l: 5 },
]

export default function IPLBanner() {
  const [dismissed, setDismissed] = useState(false)
  const [tab, setTab] = useState<'matches'|'standings'>('matches')

  if (dismissed) return null

  const today = MATCHES.find(m => m.status === 'upcoming')
  const last  = MATCHES.find(m => m.status === 'completed')

  return (
    <div
      className="w-full relative"
      style={{
        background: 'linear-gradient(90deg, rgba(245,158,11,0.08) 0%, rgba(30,64,175,0.08) 100%)',
        borderBottom: '1px solid rgba(245,158,11,0.15)',
      }}
    >
      {/* Top stripe — CSK yellow */}
      <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg,#f59e0b,#1e40af,#f59e0b)' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">

        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="px-2.5 py-1 rounded-full text-xs font-black flex-shrink-0"
              style={{ background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.45)', color: '#f59e0b' }}>
              🏏 IPL 2026
            </span>
            <p className="text-white/70 text-xs sm:text-sm font-semibold truncate min-w-0">
              {today ? `Next: CSK vs ${today.team2} · ${today.date} · ${today.time}` : 'IPL 2026 Live Scores & Schedule'}
            </p>
          </div>
          <button onClick={() => setDismissed(true)} className="text-white/20 hover:text-white/60 transition-colors flex-shrink-0 p-0.5">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 mb-3">
          {(['matches','standings'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-3 py-1 rounded-full text-xs font-bold capitalize transition-all"
              style={{
                background: tab === t ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${tab === t ? 'rgba(245,158,11,0.45)' : 'rgba(255,255,255,0.08)'}`,
                color: tab === t ? '#f59e0b' : 'rgba(255,255,255,0.4)',
              }}>
              {t === 'matches' ? '📅 Matches' : '🏆 Points Table'}
            </button>
          ))}
        </div>

        {/* Matches tab */}
        {tab === 'matches' && (
          <div className="space-y-2">
            {MATCHES.map(match => (
              <div key={match.id}
                className="rounded-xl px-3 py-2.5 flex items-center gap-3 flex-wrap sm:flex-nowrap"
                style={{
                  background: match.status === 'upcoming' ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.025)',
                  border: `1px solid ${match.status === 'upcoming' ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)'}`,
                }}>

                {/* Status badge */}
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                  match.status === 'upcoming' ? '' : ''
                }`} style={{
                  background: match.status === 'upcoming' ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.06)',
                  color: match.status === 'upcoming' ? '#f59e0b' : 'rgba(255,255,255,0.4)',
                  border: `1px solid ${match.status === 'upcoming' ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.08)'}`,
                }}>
                  {match.status === 'upcoming' ? match.date : 'FT'}
                </span>

                {/* Teams */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="font-black text-sm" style={{ color: match.team1Color }}>{match.team1Short}</span>
                  {match.score1 && <span className="text-white/60 text-xs font-mono">{match.score1}</span>}
                  <span className="text-white/25 text-xs">vs</span>
                  <span className="font-black text-sm" style={{ color: match.team2Color }}>{match.team2Short}</span>
                  {match.score2 && <span className="text-white/60 text-xs font-mono">{match.score2}</span>}
                </div>

                {/* Result / time */}
                <div className="text-right flex-shrink-0">
                  {match.result ? (
                    <p className="text-xs font-bold" style={{ color: match.result.startsWith('CSK') ? '#f59e0b' : 'rgba(255,255,255,0.5)' }}>
                      {match.result}
                    </p>
                  ) : (
                    <div>
                      <p className="text-amber-400 font-bold text-xs">{match.time}</p>
                      <p className="text-white/25 text-[9px] truncate max-w-[140px]">{match.venue.split(',')[0]}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Standings tab */}
        {tab === 'standings' && (
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
            {STANDINGS.map((row, i) => (
              <div key={row.team}
                className="flex items-center gap-3 px-3 py-2"
                style={{
                  background: row.team === 'CSK' ? 'rgba(245,158,11,0.08)' : i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                  borderBottom: i < STANDINGS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                }}>
                <span className="text-white/30 text-xs w-4 flex-shrink-0">{row.pos}</span>
                <span className="font-black text-sm flex-shrink-0 w-10" style={{ color: row.color }}>{row.team}</span>
                <div className="flex-1 flex items-center gap-1">
                  <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full" style={{ width: `${(row.pts/14)*100}%`, background: row.color }} />
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-white/35 text-[10px]">{row.w}W {row.l}L</span>
                  <span className="font-black text-xs" style={{ color: row.color }}>{row.pts} pts</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer link */}
        <div className="mt-3 flex justify-end">
          <a href="https://www.iplt20.com" target="_blank" rel="noopener noreferrer"
            data-track="ipl-banner-cta"
            className="flex items-center gap-1 text-[10px] font-bold text-white/30 hover:text-white/60 transition-colors">
            Full schedule on iplt20.com <ChevronRight className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  )
}
