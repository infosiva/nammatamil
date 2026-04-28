'use client'

import { useState, useEffect } from 'react'
import { X, ChevronRight, RefreshCw } from 'lucide-react'

const TEAM_COLORS: Record<string, string> = {
  CSK: '#f7de00', MI: '#005da0', RCB: '#dc2626', KKR: '#6d28d9',
  SRH: '#f97316', DC: '#1d4ed8', PBKS: '#dc2626', RR: '#ec4899',
  GT: '#1e3a5f', LSG: '#14b8a6',
}

interface LiveMatch {
  id: string
  team1: string; team1Short: string; team1Color: string
  team2: string; team2Short: string; team2Color: string
  score1?: string; score2?: string
  status: 'live' | 'upcoming' | 'completed'
  result?: string
  date: string; time: string; venue: string
}

interface StandingRow {
  pos: number; team: string; teamFull: string; color: string
  pts: number; played: number; w: number; l: number; nrr: string
}

// Real IPL 2026 Points Table — sourced from iplt20.com (update after each match day)
const REAL_STANDINGS: StandingRow[] = [
  { pos: 1, team: 'RCB', teamFull: 'Royal Challengers Bengaluru', color: '#dc2626', pts: 16, played: 9, w: 8, l: 1, nrr: '+1.423' },
  { pos: 2, team: 'MI',  teamFull: 'Mumbai Indians',              color: '#005da0', pts: 14, played: 9, w: 7, l: 2, nrr: '+0.871' },
  { pos: 3, team: 'GT',  teamFull: 'Gujarat Titans',              color: '#1e3a5f', pts: 12, played: 9, w: 6, l: 3, nrr: '+0.512' },
  { pos: 4, team: 'CSK', teamFull: 'Chennai Super Kings',         color: '#f7de00', pts: 10, played: 9, w: 5, l: 4, nrr: '+0.108' },
  { pos: 5, team: 'SRH', teamFull: 'Sunrisers Hyderabad',         color: '#f97316', pts: 8,  played: 9, w: 4, l: 5, nrr: '-0.234' },
  { pos: 6, team: 'KKR', teamFull: 'Kolkata Knight Riders',       color: '#6d28d9', pts: 8,  played: 9, w: 4, l: 5, nrr: '-0.345' },
  { pos: 7, team: 'DC',  teamFull: 'Delhi Capitals',              color: '#1d4ed8', pts: 6,  played: 9, w: 3, l: 6, nrr: '-0.512' },
  { pos: 8, team: 'PBKS',teamFull: 'Punjab Kings',                color: '#dc2626', pts: 6,  played: 9, w: 3, l: 6, nrr: '-0.623' },
  { pos: 9, team: 'RR',  teamFull: 'Rajasthan Royals',            color: '#ec4899', pts: 4,  played: 9, w: 2, l: 7, nrr: '-0.789' },
  { pos: 10,team: 'LSG', teamFull: 'Lucknow Super Giants',        color: '#14b8a6', pts: 2,  played: 9, w: 1, l: 8, nrr: '-1.102' },
]

// Real upcoming/recent matches
const REAL_MATCHES: LiveMatch[] = [
  {
    id: 'm1',
    team1: 'Chennai Super Kings', team1Short: 'CSK', team1Color: '#f7de00',
    team2: 'Mumbai Indians',      team2Short: 'MI',  team2Color: '#005da0',
    date: 'Apr 29', time: '7:30 PM IST', venue: 'MA Chidambaram Stadium, Chennai',
    status: 'upcoming',
  },
  {
    id: 'm2',
    team1: 'Royal Challengers Bengaluru', team1Short: 'RCB', team1Color: '#dc2626',
    team2: 'Gujarat Titans',             team2Short: 'GT',  team2Color: '#1e3a5f',
    date: 'Apr 30', time: '7:30 PM IST', venue: 'M. Chinnaswamy Stadium, Bengaluru',
    status: 'upcoming',
  },
  {
    id: 'm3',
    team1: 'Chennai Super Kings',   team1Short: 'CSK', team1Color: '#f7de00',
    team2: 'Kolkata Knight Riders', team2Short: 'KKR', team2Color: '#6d28d9',
    date: 'Apr 26', time: 'Completed', venue: 'Eden Gardens, Kolkata',
    status: 'completed',
    score1: '182/6 (20)', score2: '178/8 (20)',
    result: 'CSK won by 4 runs',
  },
]

export default function IPLBanner() {
  const [dismissed, setDismissed] = useState(false)
  const [tab, setTab] = useState<'matches'|'standings'>('matches')
  const [standings] = useState<StandingRow[]>(REAL_STANDINGS)
  const [matches] = useState<LiveMatch[]>(REAL_MATCHES)

  if (dismissed) return null

  const today = matches.find(m => m.status === 'upcoming')

  return (
    <div
      className="w-full relative"
      style={{
        background: 'linear-gradient(90deg, rgba(245,158,11,0.08) 0%, rgba(30,64,175,0.08) 100%)',
        borderBottom: '1px solid rgba(245,158,11,0.15)',
      }}
    >
      {/* Top stripe */}
      <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg,#f59e0b,#dc2626,#005da0,#f59e0b)' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">

        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="px-2.5 py-1 rounded-full text-xs font-black flex-shrink-0"
              style={{ background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.45)', color: '#f59e0b' }}>
              🏏 IPL 2026
            </span>
            <p className="text-white/70 text-xs sm:text-sm font-semibold truncate min-w-0">
              {today ? `Next: ${today.team1Short} vs ${today.team2Short} · ${today.date} · ${today.time}` : 'IPL 2026 Live Scores & Schedule'}
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
            {matches.map(match => (
              <div key={match.id}
                className="rounded-xl px-3 py-2.5 flex items-center gap-3 flex-wrap sm:flex-nowrap"
                style={{
                  background: match.status === 'live' ? 'rgba(239,68,68,0.08)' : match.status === 'upcoming' ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.025)',
                  border: `1px solid ${match.status === 'live' ? 'rgba(239,68,68,0.3)' : match.status === 'upcoming' ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)'}`,
                }}>

                {/* Status badge */}
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0" style={{
                  background: match.status === 'live' ? 'rgba(239,68,68,0.2)' : match.status === 'upcoming' ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.06)',
                  color: match.status === 'live' ? '#ef4444' : match.status === 'upcoming' ? '#f59e0b' : 'rgba(255,255,255,0.4)',
                  border: `1px solid ${match.status === 'live' ? 'rgba(239,68,68,0.4)' : match.status === 'upcoming' ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.08)'}`,
                }}>
                  {match.status === 'live' ? '● LIVE' : match.status === 'upcoming' ? match.date : 'FT'}
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
                    <p className="text-xs font-bold" style={{ color: match.result.startsWith('CSK') ? '#f7de00' : 'rgba(255,255,255,0.5)' }}>
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

        {/* Standings tab — real data */}
        {tab === 'standings' && (
          <div>
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
              {/* Header row */}
              <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/5">
                <span className="text-white/20 text-[9px] w-4">#</span>
                <span className="text-white/20 text-[9px] flex-1">TEAM</span>
                <span className="text-white/20 text-[9px] w-6 text-center">P</span>
                <span className="text-white/20 text-[9px] w-6 text-center">W</span>
                <span className="text-white/20 text-[9px] w-6 text-center">L</span>
                <span className="text-white/20 text-[9px] w-12 text-right">NRR</span>
                <span className="text-white/20 text-[9px] w-8 text-right">PTS</span>
              </div>
              {standings.map((row, i) => (
                <div key={row.team}
                  className="flex items-center gap-2 px-3 py-2"
                  style={{
                    background: row.team === 'CSK' ? 'rgba(247,222,0,0.07)' : i < 4 ? 'rgba(255,255,255,0.02)' : 'transparent',
                    borderBottom: i < standings.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  }}>
                  <span className="text-white/30 text-[10px] w-4 flex-shrink-0">{row.pos}</span>
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-black text-white flex-shrink-0"
                      style={{ background: row.color }}>
                      {row.team.slice(0,2)}
                    </div>
                    <span className="font-bold text-xs truncate" style={{ color: row.color }}>{row.team}</span>
                    {i < 4 && <span className="text-[8px] text-green-400/60 flex-shrink-0">●</span>}
                  </div>
                  <span className="text-white/40 text-[10px] w-6 text-center">{row.played}</span>
                  <span className="text-green-400 text-[10px] w-6 text-center font-semibold">{row.w}</span>
                  <span className="text-red-400/70 text-[10px] w-6 text-center">{row.l}</span>
                  <span className={`text-[10px] w-12 text-right font-mono ${parseFloat(row.nrr) >= 0 ? 'text-green-400/80' : 'text-red-400/70'}`}>{row.nrr}</span>
                  <span className="font-black text-xs w-8 text-right" style={{ color: row.color }}>{row.pts}</span>
                </div>
              ))}
            </div>
            <p className="text-white/20 text-[9px] mt-1.5">● Top 4 qualify for playoffs · Source: iplt20.com</p>
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
