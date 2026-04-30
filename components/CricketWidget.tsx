'use client'

import { useState, useEffect, useCallback } from 'react'
import { Trophy, RefreshCw, ExternalLink } from 'lucide-react'

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

const REFRESH_MS = 2 * 60 * 1000 // 2 minutes

export default function CricketWidget() {
  const [data, setData]       = useState<CricketResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetch_ = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true)
    else if (!data) setLoading(true)
    try {
      const res = await fetch('/api/cricket', { cache: 'no-store', signal: AbortSignal.timeout(8000) })
      if (res.ok) setData(await res.json())
    } catch { /* keep previous */ }
    finally { setLoading(false); setRefreshing(false) }
  }, [data])

  useEffect(() => {
    fetch_()
    const id = setInterval(() => fetch_(), REFRESH_MS)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const standings = data?.standings ?? []
  const isLiveAI  = data?.source === 'live-ai'

  return (
    <div className="space-y-4">

      {/* Points Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(34,197,94,0.15)' }}>
        <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between">
          <span className="text-xs font-black text-white/70 flex items-center gap-2 uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5 text-green-400" /> Points Table
          </span>
          <a href="https://www.iplt20.com/points-table/men/2026" target="_blank" rel="noopener noreferrer"
            className="text-[10px] text-white/25 hover:text-white/50 flex items-center gap-1">
            iplt20.com <ExternalLink className="w-2.5 h-2.5" />
          </a>
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

        {loading ? (
          <div className="p-3 space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-8 rounded shimmer" />)}</div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {standings.map((row, i) => (
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
        )}

        <div className="px-4 py-1.5 border-t border-white/5">
          <p className="text-white/20 text-[9px]">● Top 4 qualify for playoffs · IPL 2026</p>
        </div>
      </div>
    </div>
  )
}
