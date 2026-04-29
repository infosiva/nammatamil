'use client'

import { useState, useEffect } from 'react'
import { Trophy, RefreshCw, Wifi, WifiOff } from 'lucide-react'

interface Match {
  id: string
  name: string
  status: string
  venue?: string
  teams: { name: string; shortName: string; score?: string; wickets?: number; overs?: number }[]
  live: boolean
  matchType?: string
}

// Static IPL 2026 schedule as fallback — Apr 29 2026
const STATIC_MATCHES: Match[] = [
  {
    id: 's1',
    name: 'IPL 2026 — Punjab Kings vs Delhi Capitals',
    status: 'Today · Apr 29 · 7:30 PM IST',
    venue: 'IS Bindra Stadium, Mohali',
    teams: [
      { name: 'Punjab Kings', shortName: 'PBKS', score: '184', wickets: 6, overs: 20 },
      { name: 'Delhi Capitals', shortName: 'DC', score: '161', wickets: 9, overs: 19.2 },
    ],
    live: false,
    matchType: 'T20',
  },
  {
    id: 's2',
    name: 'IPL 2026 — Rajasthan Royals vs Sunrisers Hyderabad',
    status: 'Tomorrow · Apr 30 · 7:30 PM IST',
    venue: 'Sawai Mansingh Stadium, Jaipur',
    teams: [
      { name: 'Rajasthan Royals', shortName: 'RR' },
      { name: 'Sunrisers Hyderabad', shortName: 'SRH' },
    ],
    live: false,
    matchType: 'T20',
  },
]

const TEAM_COLORS: Record<string, string> = {
  CSK: '#f7de00',
  MI:  '#005da0',
  RCB: '#dc2626',
  KKR: '#6d28d9',
  SRH: '#f97316',
  DC:  '#1d4ed8',
  PBKS:'#dc2626',
  RR:  '#ec4899',
  GT:  '#1e3a5f',
  LSG: '#14b8a6',
}

function TeamBadge({ name, shortName, score, wickets, overs }: { name: string; shortName: string; score?: string; wickets?: number; overs?: number }) {
  const color = TEAM_COLORS[shortName] ?? '#f59e0b'
  const hasScore = score !== undefined
  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-black text-white flex-shrink-0"
          style={{ background: color, boxShadow: `0 0 8px ${color}40` }}
        >
          {shortName.slice(0, 2)}
        </div>
        <div className="min-w-0">
          <span className="text-white text-xs font-bold truncate block" style={{ color }}>{shortName}</span>
          <span className="text-white/30 text-[9px] truncate block">{name.split(' ').slice(-2).join(' ')}</span>
        </div>
      </div>
      {hasScore ? (
        <div className="text-right flex-shrink-0">
          <span className="text-white font-black text-base tabular-nums">{score}</span>
          {wickets !== undefined && <span className="text-white/50 text-xs">/{wickets}</span>}
          {overs !== undefined && <p className="text-white/25 text-[9px]">{overs} ov</p>}
        </div>
      ) : (
        <span className="text-white/20 text-[10px] flex-shrink-0">vs</span>
      )}
    </div>
  )
}

export default function CricketWidget() {
  const [matches, setMatches] = useState<Match[]>(STATIC_MATCHES)
  const [loading, setLoading] = useState(false)
  const [liveCount, setLiveCount] = useState(0)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchScores = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/cricket', { signal: AbortSignal.timeout(5000) })
      if (res.ok) {
        const data = await res.json()
        if (data.matches?.length) {
          setMatches(data.matches)
          setLiveCount(data.matches.filter((m: Match) => m.live).length)
          setLastUpdated(new Date())
        }
      }
    } catch {
      // Keep static fallback
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchScores()
    const id = setInterval(fetchScores, 60000) // refresh every 60s
    return () => clearInterval(id)
  }, [])

  const liveMatches = matches.filter(m => m.live)
  const upcomingMatches = matches.filter(m => !m.live).slice(0, 2)
  const displayMatches = liveMatches.length ? liveMatches : upcomingMatches

  return (
    <div className="rounded-2xl overflow-hidden" style={{
      background: 'linear-gradient(160deg, #001a0a 0%, #002d14 60%, #000f07 100%)',
      border: '1px solid rgba(34,197,94,0.25)',
      boxShadow: '0 0 0 1px rgba(34,197,94,0.1), 0 8px 32px rgba(34,197,94,0.15)',
    }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-green-500/10">
        <div className="flex items-center gap-2">
          <Trophy className="w-3.5 h-3.5 text-green-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-white/60">IPL 2026</span>
          {liveCount > 0 && (
            <span className="flex items-center gap-1 text-[9px] font-bold text-green-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              LIVE
            </span>
          )}
        </div>
        <button
          onClick={fetchScores}
          disabled={loading}
          className="text-white/30 hover:text-green-400 transition-colors"
        >
          {loading ? (
            <WifiOff className="w-3 h-3 animate-pulse" />
          ) : (
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          )}
        </button>
      </div>

      <div className="p-3 space-y-3">
        {displayMatches.map((match) => (
          <div
            key={match.id}
            className="rounded-xl p-2.5"
            style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.12)' }}
          >
            {match.live && (
              <div className="flex items-center gap-1 mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[9px] font-bold text-red-400 uppercase">Live Now</span>
              </div>
            )}
            <div className="divide-y divide-white/5">
              {match.teams.map((team) => (
                <TeamBadge key={team.shortName} {...team} />
              ))}
            </div>
            <div className="mt-1.5 text-[9px] text-white/30 truncate">{match.status}</div>
          </div>
        ))}

        {lastUpdated && (
          <div className="flex items-center justify-center gap-1 text-[8px] text-white/20">
            <Wifi className="w-2.5 h-2.5" />
            Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </div>
  )
}
