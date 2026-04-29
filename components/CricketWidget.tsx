'use client'

import { useState, useEffect } from 'react'
import { Trophy, RefreshCw, Wifi } from 'lucide-react'

interface Team { name: string; shortName: string; score?: string; wickets?: number; overs?: number }
interface Match {
  id: string; name: string; status: string; venue?: string
  teams: Team[]; live: boolean; matchType?: string; date?: string
}
interface Standing {
  pos: number; short: string; name: string; played: number
  w: number; l: number; pts: number; nrr: string; color: string
}

const TEAM_COLORS: Record<string, string> = {
  CSK: '#f7de00', MI: '#005da0', RCB: '#dc2626', KKR: '#6d28d9',
  SRH: '#f97316', DC: '#1d4ed8', PBKS: '#a855f7', RR: '#ec4899',
  GT: '#6b7280', LSG: '#14b8a6',
}

function TeamRow({ t }: { t: Team }) {
  const color = TEAM_COLORS[t.shortName] ?? '#f59e0b'
  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-black text-white flex-shrink-0"
          style={{ background: color, boxShadow: `0 0 8px ${color}40` }}>
          {t.shortName.slice(0, 2)}
        </div>
        <div className="min-w-0">
          <span className="text-xs font-black block leading-tight" style={{ color }}>{t.shortName}</span>
          <span className="text-[9px] text-white/25 block">{t.name.split(' ').slice(-2).join(' ')}</span>
        </div>
      </div>
      {t.score !== undefined ? (
        <div className="text-right flex-shrink-0">
          <span className="text-white font-black text-sm tabular-nums">{t.score}</span>
          <span className="text-white/45 text-xs">/{t.wickets}</span>
          <p className="text-white/25 text-[9px]">{t.overs} ov</p>
        </div>
      ) : (
        <span className="text-white/20 text-[10px] flex-shrink-0 font-semibold">vs</span>
      )}
    </div>
  )
}

export default function CricketWidget() {
  const [matches, setMatches] = useState<Match[]>([])
  const [standings, setStandings] = useState<Standing[]>([])
  const [loading, setLoading] = useState(true)
  const [lastResult, setLastResult] = useState('')
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const [liveCount, setLiveCount] = useState(0)
  const [standingsSource, setStandingsSource] = useState<'live' | 'static'>('static')

  const fetch_ = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/cricket', { signal: AbortSignal.timeout(6000) })
      if (res.ok) {
        const d = await res.json()
        if (d.matches?.length)   setMatches(d.matches)
        if (d.standings?.length) setStandings(d.standings)
        if (d.lastMatchResult)   setLastResult(d.lastMatchResult)
        setLiveCount(d.matches?.filter((m: Match) => m.live).length ?? 0)
        setStandingsSource(d.standingsSource ?? 'static')
        setUpdatedAt(new Date())
      }
    } catch { /* keep previous */ }
    finally { setLoading(false) }
  }

  useEffect(() => {
    fetch_()
    const id = setInterval(fetch_, 60000)
    return () => clearInterval(id)
  }, [])

  const liveMatches     = matches.filter(m => m.live)
  const upcomingMatches = matches.filter(m => !m.live).slice(0, 2)
  const displayMatches  = liveMatches.length ? liveMatches : upcomingMatches

  return (
    <div className="space-y-4">
      {/* Match card */}
      <div className="rounded-2xl overflow-hidden" style={{
        background: 'linear-gradient(160deg, #001a0a 0%, #002d14 60%, #000f07 100%)',
        border: '1px solid rgba(34,197,94,0.25)',
      }}>
        <div className="flex items-center justify-between px-3 py-2 border-b border-green-500/10">
          <div className="flex items-center gap-2">
            <Trophy className="w-3.5 h-3.5 text-green-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/60">IPL 2026</span>
            {liveCount > 0 && (
              <span className="flex items-center gap-1 text-[9px] font-bold text-green-400">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> LIVE
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {updatedAt && <span className="text-[8px] text-white/20">{updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
            <button onClick={fetch_} disabled={loading} className="text-white/30 hover:text-green-400 transition-colors">
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="p-3 space-y-2">
          {loading && !matches.length ? (
            <div className="space-y-2">
              {[1,2].map(i => <div key={i} className="h-16 rounded-xl shimmer" />)}
            </div>
          ) : displayMatches.map(match => (
            <div key={match.id} className="rounded-xl p-2.5"
              style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.12)' }}>
              {match.live && (
                <div className="flex items-center gap-1 mb-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[9px] font-bold text-red-400 uppercase">Live Now</span>
                </div>
              )}
              <div className="divide-y divide-white/5">
                {match.teams.map(t => <TeamRow key={t.shortName} t={t} />)}
              </div>
              <p className="text-[9px] text-white/30 mt-1.5 truncate">{match.status}</p>
            </div>
          ))}

          {lastResult && (
            <p className="text-[9px] text-white/20 flex items-center gap-1 pt-0.5">
              <Wifi className="w-2.5 h-2.5" /> {lastResult}
            </p>
          )}
        </div>
      </div>

      {/* Points Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(34,197,94,0.15)' }}>
        <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between">
          <span className="text-xs font-black text-white/70 flex items-center gap-2 uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5 text-green-400" /> Points Table
          </span>
          <div className="flex items-center gap-2">
            {standingsSource === 'live' && <span className="text-[8px] text-green-400/60 flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />Live</span>}
            <a href="https://www.iplt20.com/points-table/men/2026" target="_blank" rel="noopener noreferrer"
              className="text-[10px] text-white/25 hover:text-white/50">iplt20.com →</a>
          </div>
        </div>

        {/* Column headers */}
        <div className="flex items-center gap-3 px-4 py-1.5 border-b border-white/[0.04]">
          <span className="text-white/20 text-[9px] w-4">#</span>
          <span className="text-white/20 text-[9px] w-7" />
          <span className="flex-1 text-white/20 text-[9px]">Team</span>
          <span className="text-white/20 text-[9px] w-5 text-center">P</span>
          <span className="text-white/20 text-[9px] w-4 text-center">W</span>
          <span className="text-white/20 text-[9px] w-4 text-center">L</span>
          <span className="text-white/20 text-[9px] w-14 text-right">NRR</span>
          <span className="text-white/20 text-[9px] w-6 text-right">Pts</span>
        </div>

        <div className="divide-y divide-white/[0.04]">
          {(standings.length ? standings : []).map((row, i) => (
            <div key={row.short} className="flex items-center gap-3 px-4 py-2"
              style={{ background: i < 4 ? `${row.color}08` : 'transparent' }}>
              <span className="text-white/25 text-xs w-4">{row.pos}</span>
              <div className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
                style={{ background: row.color }}>
                {row.short.slice(0, 2)}
              </div>
              <span className="flex-1 font-bold text-xs truncate" style={{ color: row.color }}>{row.short}</span>
              {i < 4 && <span className="text-[8px] text-green-400/50">●</span>}
              <span className="text-white/35 text-xs w-5 text-center tabular-nums">{row.played}</span>
              <span className="text-green-400 text-xs w-4 text-center font-semibold tabular-nums">{row.w}</span>
              <span className="text-red-400/60 text-xs w-4 text-center tabular-nums">{row.l}</span>
              <span className={`text-xs w-14 text-right font-mono tabular-nums ${parseFloat(row.nrr) >= 0 ? 'text-green-400/70' : 'text-red-400/60'}`}>{row.nrr}</span>
              <span className="font-black text-sm w-6 text-right tabular-nums" style={{ color: row.color }}>{row.pts}</span>
            </div>
          ))}
        </div>
        <div className="px-4 py-1.5 border-t border-white/5">
          <p className="text-white/20 text-[9px]">● Top 4 qualify for playoffs · Apr 29 2026</p>
        </div>
      </div>
    </div>
  )
}
