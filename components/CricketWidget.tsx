'use client'

import { useState, useEffect, useCallback } from 'react'
import { Trophy, RefreshCw, ExternalLink, Zap } from 'lucide-react'

interface Standing {
  pos: number; short: string; name: string; played: number
  w: number; l: number; pts: number; nrr: string; color: string
}
interface CricketResponse {
  standings: Standing[]
  latestResult?: string
  nextMatch?: string
  liveScore?: string | null
  source: string
  updatedAt: string
  headlineCount?: number
}

const REFRESH_MS = 5 * 60 * 1000 // 5 minutes (matches server cache TTL)

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 60)  return 'just now'
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  return `${Math.floor(secs / 3600)}h ago`
}

export default function CricketWidget() {
  const [data, setData]         = useState<CricketResponse | null>(null)
  const [loading, setLoading]   = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [tick, setTick]         = useState(0) // force re-render for time display

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true)
    else if (!data) setLoading(true)
    try {
      // Bust server cache on manual refresh by appending timestamp
      const url = manual ? `/api/cricket?t=${Date.now()}` : '/api/cricket'
      const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(8000) })
      if (res.ok) setData(await res.json())
    } catch { /* keep previous */ }
    finally { setLoading(false); setRefreshing(false) }
  }, [data])

  useEffect(() => {
    load()
    const poll   = setInterval(() => load(), REFRESH_MS)
    const ticker = setInterval(() => setTick(t => t + 1), 30_000) // update "X min ago"
    return () => { clearInterval(poll); clearInterval(ticker) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const standings  = data?.standings ?? []
  const isLive     = data?.source === 'live-cricbuzz'
  const updatedAgo = data?.updatedAt ? timeAgo(data.updatedAt) : null

  return (
    <div className="space-y-3">

      {/* Match context strip */}
      {(data?.liveScore || data?.latestResult) && (
        <div className="rounded-xl px-3 py-2.5 flex items-start gap-2"
          style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.15)' }}>
          {data.liveScore ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse mt-1 flex-shrink-0" />
              <p className="text-green-300 text-[11px] font-semibold leading-snug">{data.liveScore}</p>
            </>
          ) : (
            <>
              <span className="text-white/20 text-[10px] font-bold flex-shrink-0 mt-0.5">RESULT</span>
              <p className="text-white/55 text-[11px] leading-snug">{data.latestResult}</p>
            </>
          )}
        </div>
      )}

      {/* Points Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(34,197,94,0.12)' }}>

        {/* Header */}
        <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-3.5 h-3.5 text-green-400" />
            <span className="text-xs font-black text-white/80 uppercase tracking-wider">IPL 2026</span>
            {isLive ? (
              <span className="flex items-center gap-1 text-[9px] font-bold text-green-400/80 px-1.5 py-0.5 rounded-full"
                style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <Zap className="w-2.5 h-2.5" /> LIVE
              </span>
            ) : (
              <span className="text-[9px] text-white/20">cached</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {updatedAgo && (
              <span className="text-[9px] text-white/20 hidden sm:block">{updatedAgo}</span>
            )}
            <button onClick={() => load(true)} disabled={refreshing}
              className="text-white/25 hover:text-white/60 transition-colors"
              title="Refresh standings">
              <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <a href="https://www.cricbuzz.com/cricket-series/9241/indian-premier-league-2026/points-table"
              target="_blank" rel="noopener noreferrer"
              className="text-white/20 hover:text-white/45 transition-colors" title="View on Cricbuzz">
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Column headers */}
        <div className="flex items-center gap-2 px-3 py-1 border-b border-white/[0.04]">
          <span className="text-white/20 text-[9px] w-4">#</span>
          <span className="text-white/20 text-[9px] w-6" />
          <span className="flex-1 text-white/20 text-[9px]">Team</span>
          <span className="text-white/20 text-[9px] w-5 text-center">P</span>
          <span className="text-white/20 text-[9px] w-4 text-center">W</span>
          <span className="text-white/20 text-[9px] w-4 text-center">L</span>
          <span className="text-white/20 text-[9px] w-14 text-right">NRR</span>
          <span className="text-white/20 text-[9px] w-7 text-right">Pts</span>
        </div>

        {loading ? (
          <div className="p-3 space-y-2">
            {[...Array(10)].map((_, i) => <div key={i} className="h-7 rounded shimmer" />)}
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {standings.map((row, i) => (
              <div key={row.short} className="flex items-center gap-2 px-3 py-1.5 transition-colors hover:bg-white/[0.02]"
                style={{ background: i < 4 ? `${row.color}06` : 'transparent' }}>

                {/* Position */}
                <span className="text-white/20 text-[10px] w-4 tabular-nums">{row.pos}</span>

                {/* Team badge */}
                <div className="w-6 h-6 rounded flex items-center justify-center text-[8px] font-black text-white flex-shrink-0"
                  style={{ background: row.color + 'cc' }}>
                  {row.short.slice(0, 2)}
                </div>

                {/* Team name + playoff indicator */}
                <div className="flex-1 flex items-center gap-1.5 min-w-0">
                  <span className="font-bold text-[11px] truncate" style={{ color: i < 4 ? row.color : 'rgba(255,255,255,0.5)' }}>
                    {row.short}
                  </span>
                  {i < 4 && (
                    <span className="text-[7px] text-green-400/60 font-bold hidden sm:block">PO</span>
                  )}
                </div>

                {/* Stats */}
                <span className="text-white/30 text-[10px] w-5 text-center tabular-nums">{row.played}</span>
                <span className="text-green-400/80 text-[10px] w-4 text-center font-semibold tabular-nums">{row.w}</span>
                <span className="text-red-400/50 text-[10px] w-4 text-center tabular-nums">{row.l}</span>
                <span className={`text-[10px] w-14 text-right font-mono tabular-nums ${parseFloat(row.nrr) >= 0 ? 'text-green-400/60' : 'text-red-400/50'}`}>
                  {row.nrr}
                </span>
                <span className="font-black text-sm w-7 text-right tabular-nums" style={{ color: row.color }}>
                  {row.pts}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="px-3 py-1.5 border-t border-white/5 flex items-center justify-between">
          <p className="text-white/15 text-[9px]">● Top 4 qualify for playoffs</p>
          <p className="text-white/15 text-[9px]">Source: Cricbuzz</p>
        </div>
      </div>

      {/* Next match */}
      {data?.nextMatch && (
        <div className="rounded-xl px-3 py-2.5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-[9px] text-white/25 font-bold uppercase tracking-wider mb-1">Next Match</p>
          <p className="text-white/60 text-[11px] leading-snug">{data.nextMatch}</p>
        </div>
      )}
    </div>
  )
}
