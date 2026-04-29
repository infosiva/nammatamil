'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, ChevronRight, RefreshCw } from 'lucide-react'

interface Fixture {
  id: string
  isoDate: string
  team1: string
  team2: string
  time: string
  venue: string
}

interface StandingRow {
  pos: number; team: string; short: string; color: string
  pts: number; played: number; w: number; l: number; nrr: string
}

interface LiveScore {
  score1?: string; score2?: string; status: string; isLive: boolean
}

interface IPLData {
  standings:  StandingRow[]
  fixtures:   Fixture[]
  liveScores: Record<string, LiveScore>
  updatedAt:  string
  source:     'live' | 'static'
}

// ── Completed matches (hardcoded — they won't change) ────────────────────────
const COMPLETED = [
  {
    id: 'c1', isoDate: '2026-04-27',
    team1: 'DC', team2: 'RCB',
    score1: '75 (16.3)', score2: '76/1 (6.3)',
    result: 'RCB won by 9 wkts',
  },
  {
    id: 'c2', isoDate: '2026-04-28',
    team1: 'PBKS', team2: 'RR',
    score1: '183/5 (20)', score2: '158/8 (20)',
    result: 'PBKS won by 25 runs',
  },
]

// ── Team colours ─────────────────────────────────────────────────────────────
const TEAM_COLOR: Record<string, string> = {
  PBKS: '#a855f7', RCB: '#ef4444', RR: '#ec4899', SRH: '#f97316',
  GT:   '#6b7280', CSK: '#eab308', DC: '#3b82f6', KKR: '#7c3aed',
  MI:   '#0ea5e9', LSG: '#14b8a6',
}

// ── IST date helpers ──────────────────────────────────────────────────────────
function toISTDateStr(date: Date): string {
  const ist = new Date(date.getTime() + 5.5 * 60 * 60 * 1000)
  return ist.toISOString().slice(0, 10)
}

function getDateLabel(isoDate: string, todayStr: string, tomorrowStr: string): string {
  if (isoDate === todayStr) return 'Today'
  if (isoDate === tomorrowStr) return 'Tomorrow'
  const [, m, d] = isoDate.split('-').map(Number)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[m - 1]} ${d}`
}

export default function IPLBanner() {
  const [dismissed, setDismissed]   = useState(false)
  const [tab, setTab]               = useState<'matches' | 'standings'>('matches')
  const [todayStr, setTodayStr]     = useState('')
  const [tomorrowStr, setTomorrowStr] = useState('')
  const [data, setData]             = useState<IPLData | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState('')

  // Refresh today/tomorrow strings every minute
  useEffect(() => {
    function tick() {
      const now = new Date()
      setTodayStr(toISTDateStr(now))
      setTomorrowStr(toISTDateStr(new Date(now.getTime() + 86_400_000)))
    }
    tick()
    const id = setInterval(tick, 60_000)
    return () => clearInterval(id)
  }, [])

  // Fetch IPL data from API
  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true)
    try {
      const res = await fetch('/api/ipl', { cache: 'no-store' })
      if (!res.ok) throw new Error(`${res.status}`)
      const json: IPLData = await res.json()
      setData(json)
      const now = new Date()
      const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000)
      setLastRefresh(ist.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }))
    } catch {
      // keep previous data
    } finally {
      setRefreshing(false)
    }
  }, [])

  // Initial fetch + auto-refresh every 2 minutes
  useEffect(() => {
    fetchData()
    const id = setInterval(() => fetchData(), 2 * 60 * 1000)
    return () => clearInterval(id)
  }, [fetchData])

  if (dismissed || !todayStr) return null

  const fixtures  = data?.fixtures ?? []
  const standings = data?.standings ?? []

  // Show last 2 completed + upcoming from today
  const upcoming  = fixtures.filter(f => f.isoDate >= todayStr).slice(0, 7)
  const displayed = [...COMPLETED.slice(-2), ...upcoming]

  const nextMatch = upcoming[0]

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
              <span className="font-bold" style={{ color: TEAM_COLOR[nextMatch.team1] }}>{nextMatch.team1}</span>
              <span className="text-white/25 mx-1">vs</span>
              <span className="font-bold" style={{ color: TEAM_COLOR[nextMatch.team2] }}>{nextMatch.team2}</span>
              <span className="text-white/25 ml-1.5">
                {getDateLabel(nextMatch.isoDate, todayStr, tomorrowStr)} · {nextMatch.time} IST
              </span>
            </p>
          )}
          <div className="flex items-center gap-2 flex-shrink-0">
            {lastRefresh && (
              <span className="text-white/15 text-[9px] hidden sm:inline">
                {data?.source === 'live' ? '🔴 Live' : '📡'} {lastRefresh}
              </span>
            )}
            <button onClick={() => fetchData(true)} disabled={refreshing}
              className="p-1 rounded transition-colors hover:bg-white/5"
              title="Refresh scores">
              <RefreshCw className={`w-3 h-3 text-white/25 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => setDismissed(true)} className="text-white/20 hover:text-white/50 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
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
              const isCompleted = 'result' in m
              const isoDate     = m.isoDate
              const label       = getDateLabel(isoDate, todayStr, tomorrowStr)
              const isToday     = isoDate === todayStr

              // Check for live data overlay
              const liveKey   = `${isoDate}_${m.team1}_${m.team2}`
              const liveData  = data?.liveScores?.[liveKey]
              const isLive    = liveData?.isLive ?? false
              const score1    = liveData?.score1 ?? (isCompleted ? (m as typeof COMPLETED[0]).score1 : undefined)
              const score2    = liveData?.score2 ?? (isCompleted ? (m as typeof COMPLETED[0]).score2 : undefined)
              const result    = isCompleted ? (m as typeof COMPLETED[0]).result : liveData?.status

              const c1 = TEAM_COLOR[m.team1] ?? '#888'
              const c2 = TEAM_COLOR[m.team2] ?? '#888'

              return (
                <div key={m.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{
                    background: isLive ? 'rgba(239,68,68,0.06)' : isToday && !isCompleted ? 'rgba(245,158,11,0.05)' : isCompleted ? 'transparent' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isLive ? 'rgba(239,68,68,0.2)' : isToday && !isCompleted ? 'rgba(245,158,11,0.15)' : isCompleted ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.06)'}`,
                  }}>

                  {/* Date/status pill */}
                  <span className="text-[9px] font-black w-16 flex-shrink-0 text-center px-1.5 py-0.5 rounded-md"
                    style={{
                      background: isCompleted ? 'rgba(255,255,255,0.04)' : isLive ? 'rgba(239,68,68,0.15)' : isToday ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.05)',
                      color: isCompleted ? 'rgba(255,255,255,0.25)' : isLive ? '#f87171' : isToday ? '#f59e0b' : 'rgba(255,255,255,0.45)',
                    }}>
                    {isCompleted ? 'FT' : isLive ? '🔴 LIVE' : label}
                  </span>

                  {/* Teams + scores */}
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className="font-black text-sm leading-none" style={{ color: c1 }}>{m.team1}</span>
                    {score1 && <span className="text-white/35 text-[9px] font-mono truncate">{score1}</span>}
                    <span className="text-white/20 text-[10px] flex-shrink-0">v</span>
                    <span className="font-black text-sm leading-none" style={{ color: c2 }}>{m.team2}</span>
                    {score2 && <span className="text-white/35 text-[9px] font-mono truncate">{score2}</span>}
                  </div>

                  {/* Right: result or time+venue */}
                  <div className="flex-shrink-0 text-right min-w-[60px]">
                    {result ? (
                      <span className="text-[9px] text-white/40 leading-tight">{result}</span>
                    ) : (
                      <div>
                        <p className="text-[10px] font-bold"
                          style={{ color: isToday ? '#f59e0b' : 'rgba(255,255,255,0.45)' }}>
                          {'time' in m ? m.time : ''}
                        </p>
                        <p className="text-[9px] text-white/20 truncate">{'venue' in m ? m.venue : ''}</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Standings tab ── */}
        {tab === 'standings' && standings.length > 0 && (
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="grid px-3 py-1.5 border-b border-white/5"
              style={{ gridTemplateColumns: '16px 1fr 28px 28px 28px 52px 32px' }}>
              {['#','TEAM','P','W','L','NRR','PTS'].map(h => (
                <span key={h} className="text-[9px] font-bold text-white/20 text-center first:text-left last:text-right">{h}</span>
              ))}
            </div>
            {standings.map((row, i) => (
              <div key={row.short}
                className="grid items-center px-3 py-1.5"
                style={{
                  gridTemplateColumns: '16px 1fr 28px 28px 28px 52px 32px',
                  background: i < 4 ? `${row.color}0a` : i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
                  borderBottom: i < standings.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}>
                <span className="text-[10px] text-white/25">{row.pos}</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-sm flex items-center justify-center text-[8px] font-black text-white flex-shrink-0"
                    style={{ background: row.color }}>
                    {row.short.slice(0, 1)}
                  </span>
                  <span className="font-bold text-[11px]" style={{ color: row.color }}>{row.short}</span>
                  {i < 4 && <span className="w-1 h-1 rounded-full bg-green-400/50 flex-shrink-0" />}
                </div>
                <span className="text-[10px] text-white/35 text-center">{row.played}</span>
                <span className="text-[10px] text-green-400/80 text-center font-semibold">{row.w}</span>
                <span className="text-[10px] text-red-400/60 text-center">{row.l}</span>
                <span className={`text-[10px] font-mono text-center ${parseFloat(row.nrr) >= 0 ? 'text-green-400/70' : 'text-red-400/60'}`}>{row.nrr}</span>
                <span className="font-black text-[11px] text-right" style={{ color: row.color }}>{row.pts}</span>
              </div>
            ))}
            <div className="px-3 py-1.5 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400/50" />
                <span className="text-[9px] text-white/20">Top 4 qualify for playoffs</span>
              </div>
              {lastRefresh && (
                <span className="text-[9px] text-white/15">Updated {lastRefresh}</span>
              )}
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="mt-2.5 flex justify-end">
          <a href="https://www.iplt20.com/points-table/men/2026" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-0.5 text-[10px] text-white/20 hover:text-white/50 transition-colors">
            iplt20.com <ChevronRight className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  )
}
