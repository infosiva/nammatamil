'use client'

/**
 * ElectionResultsLive — Tamil Nadu Election 2026 Counting Day Tracker
 *
 * Shows live seat tallies from /api/election-results on May 4, 2026.
 * Before counting: preview mode with exit poll projections.
 * During counting: live ECI data parsed by AI.
 * After counting: declared results.
 */

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Zap, Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import Link from 'next/link'

interface PartyResult {
  name: string
  fullName: string
  leader: string
  color: string
  emoji: string
  seatsWon: number
  seatsLeading: number
  totalTally: number
  voteShare: number
  trend: 'up' | 'down' | 'stable'
  isLeading: boolean
  hasMajority: boolean
}

interface ElectionResultsResponse {
  phase: 'pre-counting' | 'counting' | 'declared'
  countingStartsAt: string
  seatsReported: number
  totalSeats: number
  majorityMark: number
  parties: PartyResult[]
  narrative: string
  leader: string
  projectedWinner: string | null
  source: 'eci-live' | 'ai-parsed' | 'exit-poll-projection' | 'static'
  updatedAt: string
  headlines: string[]
}

const REFRESH_MS = 3 * 60 * 1000 // 3 min
const MAJORITY = 118
const TOTAL = 234

function TrendIcon({ trend, color }: { trend: string; color: string }) {
  if (trend === 'up')   return <TrendingUp   className="w-3 h-3" style={{ color }} />
  if (trend === 'down') return <TrendingDown className="w-3 h-3 text-red-400" />
  return <Minus className="w-3 h-3 text-white/20" />
}

// ── Semi-circle seat chart ────────────────────────────────────────────────────
function SeatArc({ parties, total, majority }: { parties: PartyResult[]; total: number; majority: number }) {
  const cx = 100, cy = 90, r = 72, inner = 44
  // Semi-circle: left (-180°) to right (0°)
  let angle = -180
  const segments: { path: string; color: string; name: string; tally: number }[] = []

  const totalSeats = parties.reduce((s, p) => s + p.totalTally, 0)
  const scale = totalSeats > 0 ? total / totalSeats : 1

  parties.forEach(p => {
    const scaledTally = p.totalTally * scale
    const sweep = (scaledTally / total) * 180
    if (sweep < 0.5) { angle += sweep; return }

    const startRad = (angle * Math.PI) / 180
    const endRad   = ((angle + sweep) * Math.PI) / 180
    const x1 = cx + r * Math.cos(startRad)
    const y1 = cy + r * Math.sin(startRad)
    const x2 = cx + r * Math.cos(endRad)
    const y2 = cy + r * Math.sin(endRad)
    const ix1 = cx + inner * Math.cos(startRad)
    const iy1 = cy + inner * Math.sin(startRad)
    const ix2 = cx + inner * Math.cos(endRad)
    const iy2 = cy + inner * Math.sin(endRad)
    const large = sweep > 90 ? 1 : 0

    const path = `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} L ${ix2.toFixed(2)} ${iy2.toFixed(2)} A ${inner} ${inner} 0 ${large} 0 ${ix1.toFixed(2)} ${iy1.toFixed(2)} Z`
    segments.push({ path, color: p.color, name: p.name, tally: p.totalTally })
    angle += sweep
  })

  // Fill remainder with dark
  if (angle < 0) {
    const startRad = (angle * Math.PI) / 180
    const endRad   = 0
    const x1 = cx + r * Math.cos(startRad), y1 = cy + r * Math.sin(startRad)
    const x2 = cx + r, y2 = cy
    const ix1 = cx + inner * Math.cos(startRad), iy1 = cy + inner * Math.sin(startRad)
    const ix2 = cx + inner, iy2 = cy
    const large = (0 - angle) > 90 ? 1 : 0
    const path = `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} L ${ix2.toFixed(2)} ${iy2.toFixed(2)} A ${inner} ${inner} 0 ${large} 0 ${ix1.toFixed(2)} ${iy1.toFixed(2)} Z`
    segments.push({ path, color: 'rgba(255,255,255,0.05)', name: '', tally: 0 })
  }

  // Majority line at 118/234 * 180 = ~90.77° from left = ~-89.23° = 90° mark (right side)
  const majAngle = -180 + (majority / total) * 180
  const majRad = (majAngle * Math.PI) / 180
  const mx1 = cx + (inner - 6) * Math.cos(majRad)
  const my1 = cy + (inner - 6) * Math.sin(majRad)
  const mx2 = cx + (r + 8) * Math.cos(majRad)
  const my2 = cy + (r + 8) * Math.sin(majRad)

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 100" className="w-full max-w-[260px]">
        {segments.map((s, i) => (
          <path key={i} d={s.path} fill={s.color}
            style={s.tally > 0 ? { filter: `drop-shadow(0 0 4px ${s.color}55)` } : {}}
          />
        ))}
        {/* Inner fill */}
        <path d={`M ${cx - inner} ${cy} A ${inner} ${inner} 0 0 1 ${cx + inner} ${cy} Z`} fill="#09090b" />
        {/* Majority dashed line */}
        <line x1={mx1} y1={my1} x2={mx2} y2={my2}
          stroke="rgba(251,191,36,0.7)" strokeWidth="1.5" strokeDasharray="3,2" />
        {/* Center text */}
        <text x={cx} y={cy - 12} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="7" fontWeight="700">MAJORITY</text>
        <text x={cx} y={cy - 3} textAnchor="middle" fill="#fbbf24" fontSize="12" fontWeight="900">{majority}</text>
        <text x={cx} y={cy + 7} textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="6">of {total} seats</text>
        {/* Majority label */}
        <text x={cx + (r + 10) * Math.cos(majRad) + 2} y={cy + (r + 10) * Math.sin(majRad) + 1}
          fill="rgba(251,191,36,0.7)" fontSize="5.5" fontWeight="700">
          {majority}
        </text>
      </svg>
    </div>
  )
}

// ── Party result row ──────────────────────────────────────────────────────────
function PartyRow({ party, phase }: { party: PartyResult; phase: string }) {
  const barPct = Math.min((party.totalTally / MAJORITY) * 100, 100)

  return (
    <div className="flex items-center gap-3 py-3 px-4 rounded-xl relative overflow-hidden transition-all"
      style={{
        background: party.isLeading ? `${party.color}0f` : 'rgba(255,255,255,0.025)',
        border: `1px solid ${party.isLeading ? party.color + '35' : 'rgba(255,255,255,0.07)'}`,
      }}>

      {/* fill bar background */}
      <div className="absolute inset-y-0 left-0 rounded-xl opacity-10 transition-all duration-1000"
        style={{ width: `${barPct}%`, background: party.color }} />

      {/* emoji / symbol */}
      <span className="text-lg flex-shrink-0 relative z-10">{party.emoji}</span>

      {/* party info */}
      <div className="flex-1 min-w-0 relative z-10">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-black text-sm" style={{ color: party.color }}>{party.name}</span>
          <span className="text-white/30 text-[9px] truncate hidden sm:inline">{party.leader}</span>
          {party.isLeading && (
            <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0"
              style={{ background: `${party.color}25`, color: party.color, border: `1px solid ${party.color}45` }}>
              LEADING
            </span>
          )}
          {party.hasMajority && (
            <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0 text-amber-400"
              style={{ background: 'rgba(251,191,36,0.2)', border: '1px solid rgba(251,191,36,0.4)' }}>
              ✓ MAJORITY
            </span>
          )}
        </div>
        {/* Progress bar toward majority */}
        <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${barPct}%`, background: `linear-gradient(90deg, ${party.color}60, ${party.color})` }} />
        </div>
        {/* Majority mark */}
        <div className="relative h-0" style={{ marginLeft: '0%' }}>
          <div className="absolute h-2 w-px bg-amber-400/40 -top-1"
            style={{ left: '100%', transform: 'translateX(-1px)' }} />
        </div>
      </div>

      {/* Tally numbers */}
      <div className="flex-shrink-0 text-right relative z-10">
        {phase === 'pre-counting' ? (
          <div>
            <span className="font-black text-xl tabular-nums" style={{ color: party.color }}>{party.totalTally}</span>
            <p className="text-white/20 text-[9px]">projected</p>
          </div>
        ) : (
          <div>
            <span className="font-black text-xl tabular-nums" style={{ color: party.isLeading ? party.color : 'rgba(255,255,255,0.7)' }}>
              {party.totalTally}
            </span>
            <div className="flex items-center justify-end gap-1 mt-0.5">
              {party.seatsWon > 0 && (
                <span className="text-[9px] font-bold text-green-400">{party.seatsWon}W</span>
              )}
              {party.seatsLeading > 0 && (
                <span className="text-[9px] font-bold text-amber-400">{party.seatsLeading}L</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Trend icon */}
      <div className="flex-shrink-0 relative z-10">
        <TrendIcon trend={party.trend} color={party.color} />
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ElectionResultsLive({ compact = false }: { compact?: boolean }) {
  const [data, setData]         = useState<ElectionResultsResponse | null>(null)
  const [loading, setLoading]   = useState(true)
  const [refreshing, setRefresh] = useState(false)
  const [tick, setTick]         = useState(0)

  const fetchData = useCallback(async (manual = false) => {
    if (manual) setRefresh(true)
    try {
      const res = await fetch('/api/election-results', { cache: 'no-store', signal: AbortSignal.timeout(10000) })
      if (res.ok) setData(await res.json())
    } catch { /* keep previous */ }
    finally { setLoading(false); setRefresh(false) }
  }, [])

  useEffect(() => {
    fetchData()
    const dataId = setInterval(() => fetchData(), REFRESH_MS)
    const tickId = setInterval(() => setTick(t => t + 1), 1000)
    return () => { clearInterval(dataId); clearInterval(tickId) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const phase      = data?.phase ?? 'pre-counting'
  const parties    = data?.parties ?? []
  const leader     = data?.leader ?? ''
  const winner     = data?.projectedWinner
  const seatsRep   = data?.seatsReported ?? 0
  const isLive     = phase === 'counting'
  const isDeclared = phase === 'declared'
  const isPreCount = phase === 'pre-counting'

  // Time since last update
  const secAgo = data?.updatedAt
    ? Math.floor((Date.now() - new Date(data.updatedAt).getTime()) / 1000)
    : null

  const phaseLabel = isDeclared ? 'RESULTS DECLARED'
    : isLive ? 'LIVE COUNTING'
    : 'EXIT POLL PREVIEW'

  const phaseColor = isDeclared ? '#4ade80'
    : isLive ? '#ef4444'
    : '#fbbf24'

  return (
    <div className="rounded-2xl overflow-hidden" style={{
      background: 'linear-gradient(160deg, #09030f 0%, #0f0520 60%, #07010f 100%)',
      border: `1px solid ${phaseColor}30`,
    }}>

      {/* ── Header ── */}
      <div className="px-4 py-3 flex items-center justify-between gap-2 flex-wrap"
        style={{ background: `${phaseColor}0d`, borderBottom: `1px solid ${phaseColor}20` }}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black"
            style={{ background: `${phaseColor}20`, border: `1px solid ${phaseColor}50`, color: phaseColor }}>
            {(isLive || isDeclared) && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: phaseColor }} />}
            {phaseLabel}
          </span>
          <span className="text-white/50 text-xs font-bold">TN Election 2026</span>
          {isLive && seatsRep > 0 && (
            <span className="text-white/30 text-[10px]">{seatsRep} / {TOTAL} seats reporting</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {secAgo !== null && (
            <span className="text-white/20 text-[9px]">
              {secAgo < 60 ? `${secAgo}s ago` : `${Math.floor(secAgo / 60)}m ago`}
            </span>
          )}
          <button onClick={() => fetchData(true)} disabled={refreshing}
            className="text-white/25 hover:text-white/60 transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">

        {/* ── Winner / projected winner banner ── */}
        {winner && (
          <div className="rounded-xl px-4 py-3 flex items-center gap-3"
            style={{
              background: 'linear-gradient(135deg, rgba(251,191,36,0.18), rgba(245,158,11,0.08))',
              border: '2px solid rgba(251,191,36,0.5)',
            }}>
            <Trophy className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div>
              <p className="text-amber-400 font-black text-sm">
                {isDeclared ? `${winner} WINS!` : `${winner} heading to majority`}
              </p>
              <p className="text-white/40 text-[10px]">
                {isDeclared ? 'Results declared · Tamil Nadu Assembly Election 2026' : 'On track for 118+ seats'}
              </p>
            </div>
          </div>
        )}

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className="space-y-2">
            {[1,2,3,4].map(i => <div key={i} className="h-14 rounded-xl shimmer" />)}
          </div>
        )}

        {/* ── Party rows ── */}
        {!loading && parties.length > 0 && (
          <div className="space-y-2">
            {parties.map(p => (
              <PartyRow key={p.name} party={p} phase={phase} />
            ))}
          </div>
        )}

        {/* ── Semi-circle chart ── */}
        {!loading && parties.length > 0 && (
          <SeatArc parties={parties} total={TOTAL} majority={MAJORITY} />
        )}

        {/* ── Narrative ── */}
        {data?.narrative && (
          <div className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-white/60 text-xs leading-relaxed">{data.narrative}</p>
          </div>
        )}

        {/* ── Seats progress bar (during counting) ── */}
        {isLive && seatsRep > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-white/30 text-[10px] font-semibold uppercase tracking-wide">Seats Reported</span>
              <span className="text-white/50 text-xs font-black">{seatsRep} / {TOTAL}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${(seatsRep / TOTAL) * 100}%`, background: 'linear-gradient(90deg, #f87171, #fbbf24)' }} />
            </div>
          </div>
        )}

        {/* ── Pre-counting countdown ── */}
        {isPreCount && data?.countingStartsAt && (
          <CountingCountdown countingStartsAt={data.countingStartsAt} />
        )}

        {/* ── Headlines (during/after counting) ── */}
        {(isLive || isDeclared) && data?.headlines && data.headlines.length > 0 && !compact && (
          <div className="space-y-1.5">
            <p className="text-white/20 text-[9px] uppercase tracking-widest font-semibold">Live Headlines</p>
            {data.headlines.slice(0, 3).map((h, i) => (
              <div key={i} className="px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-white/55 text-[11px] leading-snug">{h}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Source attribution ── */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            {data?.source === 'eci-live' && (
              <>
                <Zap className="w-2.5 h-2.5 text-green-400/50" />
                <span className="text-white/20 text-[9px]">Live from ECI · AI parsed</span>
              </>
            )}
            {data?.source === 'ai-parsed' && (
              <>
                <Zap className="w-2.5 h-2.5 text-amber-400/50" />
                <span className="text-white/20 text-[9px]">AI from news headlines</span>
              </>
            )}
            {data?.source === 'exit-poll-projection' && (
              <span className="text-white/15 text-[9px]">Exit poll projections · Axis My India</span>
            )}
          </div>
          {!compact && (
            <Link href="/tn-election-2026"
              className="text-white/25 hover:text-white/50 text-[9px] transition-colors">
              Full analysis →
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Counting countdown ────────────────────────────────────────────────────────
function CountingCountdown({ countingStartsAt }: { countingStartsAt: string }) {
  const [diff, setDiff] = useState(() => Math.max(0, new Date(countingStartsAt).getTime() - Date.now()))

  useEffect(() => {
    const id = setInterval(() => setDiff(Math.max(0, new Date(countingStartsAt).getTime() - Date.now())), 1000)
    return () => clearInterval(id)
  }, [countingStartsAt])

  if (diff === 0) return null

  const s = Math.floor(diff / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60

  return (
    <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.2)' }}>
      <p className="text-amber-400/60 text-[9px] uppercase tracking-widest font-semibold mb-2">Counting begins in</p>
      <div className="flex items-center justify-center gap-3">
        {d > 0 && (
          <div className="text-center">
            <p className="font-black text-2xl tabular-nums text-amber-400">{d}</p>
            <p className="text-white/25 text-[9px]">days</p>
          </div>
        )}
        <div className="text-center">
          <p className="font-black text-2xl tabular-nums text-amber-400">{String(h).padStart(2,'0')}</p>
          <p className="text-white/25 text-[9px]">hrs</p>
        </div>
        <div className="text-white/20 font-black text-xl -mt-2">:</div>
        <div className="text-center">
          <p className="font-black text-2xl tabular-nums text-amber-400">{String(m).padStart(2,'0')}</p>
          <p className="text-white/25 text-[9px]">min</p>
        </div>
        <div className="text-white/20 font-black text-xl -mt-2">:</div>
        <div className="text-center">
          <p className="font-black text-2xl tabular-nums text-white/50">{String(sec).padStart(2,'0')}</p>
          <p className="text-white/25 text-[9px]">sec</p>
        </div>
      </div>
      <p className="text-white/20 text-[9px] mt-2">May 4, 2026 · 8:00 AM IST</p>
    </div>
  )
}
