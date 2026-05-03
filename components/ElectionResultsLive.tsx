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
  source: 'eci-live' | 'ai-parsed' | 'exit-poll-projection' | 'manual-override' | 'cached-stale' | 'static'
  updatedAt: string
  headlines: string[]
  fallbackLevel?: number
}

const REFRESH_MS = 3 * 60 * 1000 // 3 min
const MAJORITY = 118
const TOTAL = 234

function TrendIcon({ trend, color }: { trend: string; color: string }) {
  if (trend === 'up')   return <TrendingUp   style={{ width: 12, height: 12, color }} />
  if (trend === 'down') return <TrendingDown style={{ width: 12, height: 12, color: '#f87171' }} />
  return <Minus style={{ width: 12, height: 12, color: 'rgba(255,255,255,0.2)' }} />
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0' }}>
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8, fontWeight: 700 }}>
        Parliament Arc · {total} Seats
      </div>
      <svg viewBox="0 0 200 100" style={{ width: '100%', maxWidth: 300 }}>
        {segments.map((s, i) => (
          <path key={i} d={s.path} fill={s.color}
            style={s.tally > 0 ? { filter: `drop-shadow(0 0 6px ${s.color}66)` } : {}}
          />
        ))}
        {/* Inner fill */}
        <path d={`M ${cx - inner} ${cy} A ${inner} ${inner} 0 0 1 ${cx + inner} ${cy} Z`} fill="#07010f" />
        {/* Majority dashed line */}
        <line x1={mx1} y1={my1} x2={mx2} y2={my2}
          stroke="rgba(251,191,36,0.8)" strokeWidth="1.5" strokeDasharray="3,2" />
        {/* Center text */}
        <text x={cx} y={cy - 14} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="6.5" fontWeight="700">MAJORITY</text>
        <text x={cx} y={cy - 3} textAnchor="middle" fill="#fbbf24" fontSize="13" fontWeight="900">{majority}</text>
        <text x={cx} y={cy + 7} textAnchor="middle" fill="rgba(255,255,255,0.22)" fontSize="5.5">of {total} seats</text>
        {/* Majority label */}
        <text x={cx + (r + 11) * Math.cos(majRad) + 2} y={cy + (r + 11) * Math.sin(majRad) + 1}
          fill="rgba(251,191,36,0.75)" fontSize="5.5" fontWeight="700">
          {majority}
        </text>
      </svg>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', marginTop: 6 }}>
        {segments.filter(s => s.tally > 0 && s.name).map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
            <span style={{ fontSize: 10, color: s.color, fontWeight: 700 }}>{s.name}</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontVariantNumeric: 'tabular-nums' }}>{s.tally}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Party result row (counting/declared phase) ─────────────────────────────────
function PartyRowLive({ party }: { party: PartyResult }) {
  const barPct = Math.min((party.totalTally / MAJORITY) * 100, 100)

  return (
    <div style={{
      borderRadius: 16, padding: '14px 16px',
      position: 'relative', overflow: 'hidden',
      background: party.isLeading
        ? `linear-gradient(135deg, ${party.color}12 0%, ${party.color}05 100%)`
        : 'rgba(255,255,255,0.025)',
      border: `1px solid ${party.isLeading ? party.color + '40' : 'rgba(255,255,255,0.07)'}`,
      boxShadow: party.isLeading ? `0 0 20px ${party.color}15` : 'none',
      transition: 'all 0.3s',
    }}>
      {/* Background fill bar */}
      <div style={{
        position: 'absolute', inset: 0, left: 0,
        width: `${barPct}%`,
        background: `${party.color}09`,
        borderRadius: 14,
        transition: 'width 1s ease',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Emoji */}
        <span style={{ fontSize: 22, flexShrink: 0 }}>{party.emoji}</span>

        {/* Party info + bar */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontWeight: 900, fontSize: 15, color: party.color }}>{party.name}</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{party.leader}</span>
            {party.isLeading && (
              <span style={{
                fontSize: 8, fontWeight: 900, padding: '2px 7px', borderRadius: 99,
                background: `${party.color}25`, color: party.color, border: `1px solid ${party.color}45`,
                letterSpacing: '0.08em',
              }}>LEADING</span>
            )}
            {party.hasMajority && (
              <span style={{
                fontSize: 8, fontWeight: 900, padding: '2px 7px', borderRadius: 99,
                background: 'rgba(251,191,36,0.2)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.4)',
                letterSpacing: '0.08em',
              }}>✓ MAJORITY</span>
            )}
          </div>

          {/* Progress bar to majority */}
          <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', position: 'relative' }}>
            <div style={{
              height: '100%', borderRadius: 99,
              width: `${barPct}%`,
              background: `linear-gradient(90deg, ${party.color}50, ${party.color})`,
              transition: 'width 0.8s ease',
            }} />
            {/* Majority tick */}
            <div style={{
              position: 'absolute', top: 0, bottom: 0, left: '100%',
              width: 1.5, background: 'rgba(251,191,36,0.5)',
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>0</span>
            <span style={{ fontSize: 9, color: 'rgba(251,191,36,0.5)', fontWeight: 700 }}>118 ← majority</span>
          </div>
        </div>

        {/* Tally numbers */}
        <div style={{ flexShrink: 0, textAlign: 'right', minWidth: 60 }}>
          <div style={{
            fontWeight: 900, fontSize: 28, fontVariantNumeric: 'tabular-nums', lineHeight: 1,
            color: party.isLeading ? party.color : 'rgba(255,255,255,0.65)',
          }}>
            {party.totalTally}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginTop: 3 }}>
            {party.seatsWon > 0 && (
              <span style={{ fontSize: 9, fontWeight: 700, color: '#4ade80' }}>{party.seatsWon}W</span>
            )}
            {party.seatsLeading > 0 && (
              <span style={{ fontSize: 9, fontWeight: 700, color: '#fbbf24' }}>{party.seatsLeading}L</span>
            )}
          </div>
        </div>

        {/* Trend */}
        <div style={{ flexShrink: 0 }}>
          <TrendIcon trend={party.trend} color={party.color} />
        </div>
      </div>
    </div>
  )
}

// ── Party row pre-counting (exit poll styled) ─────────────────────────────────
function PartyRowPreCount({ party }: { party: PartyResult }) {
  const barPct = Math.min((party.totalTally / MAJORITY) * 100, 100)
  const isTop = party.totalTally >= 100

  return (
    <div style={{
      borderRadius: 16, padding: '14px 16px',
      position: 'relative', overflow: 'hidden',
      background: isTop
        ? `linear-gradient(135deg, ${party.color}14 0%, ${party.color}05 100%)`
        : 'rgba(255,255,255,0.02)',
      border: `1px solid ${isTop ? party.color + '35' : 'rgba(255,255,255,0.07)'}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>{party.emoji}</span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontWeight: 900, fontSize: 14, color: party.color }}>{party.name}</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{party.leader}</span>
            {isTop && (
              <span style={{
                fontSize: 8, fontWeight: 900, padding: '1px 6px', borderRadius: 99,
                background: `${party.color}22`, color: party.color, border: `1px solid ${party.color}40`,
              }}>EXPECTED</span>
            )}
          </div>
          {/* Animated gradient bar */}
          <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 99,
              width: `${barPct}%`,
              background: `linear-gradient(90deg, ${party.color}50, ${party.color}dd)`,
              transition: 'width 1.2s ease',
            }} />
          </div>
        </div>

        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          <div style={{
            fontWeight: 900, fontSize: 26, fontVariantNumeric: 'tabular-nums', lineHeight: 1,
            color: party.color, opacity: 0.9,
          }}>
            {party.totalTally}
          </div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>projected</div>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ElectionResultsLive({ compact = false }: { compact?: boolean }) {
  const [data, setData]          = useState<ElectionResultsResponse | null>(null)
  const [loading, setLoading]    = useState(true)
  const [refreshing, setRefresh] = useState(false)
  const [tick, setTick]          = useState(0)

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

  // void tick to prevent unused warning — it drives re-render for secAgo
  void tick

  return (
    <div style={{
      borderRadius: 24, overflow: 'hidden',
      background: 'linear-gradient(160deg, rgba(7,1,15,0.98) 0%, rgba(15,5,32,0.95) 60%, rgba(7,1,15,0.98) 100%)',
      border: `1px solid ${phaseColor}28`,
      boxShadow: isLive ? `0 0 40px ${phaseColor}12` : 'none',
    }}>

      {/* ── Header bar ── */}
      <div style={{
        padding: '12px 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
        background: `${phaseColor}0d`,
        borderBottom: `1px solid ${phaseColor}1e`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 99,
            background: `${phaseColor}20`, border: `1px solid ${phaseColor}55`,
            color: phaseColor, fontSize: 10, fontWeight: 900, letterSpacing: '0.08em',
          }}>
            {(isLive || isDeclared) && (
              <span style={{
                width: 6, height: 6, borderRadius: '50%', background: phaseColor,
                display: 'inline-block', animation: 'pulse 1.5s infinite',
              }} />
            )}
            {phaseLabel}
          </span>
          <span style={{ fontWeight: 700, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>TN Election 2026</span>
          {isLive && seatsRep > 0 && (
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{seatsRep} / {TOTAL} seats reporting</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {secAgo !== null && !isPreCount && (
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>
              {refreshing ? 'Refreshing…' : secAgo < 60 ? `${secAgo}s ago` : `${Math.floor(secAgo / 60)}m ago`}
            </span>
          )}
          <button onClick={() => fetchData(true)} disabled={refreshing}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'rgba(255,255,255,0.25)' }}>
            <RefreshCw style={{ width: 14, height: 14, animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Pre-counting: Exit poll preview ── */}
        {isPreCount && (
          <div>
            <div style={{
              borderRadius: 14, padding: '10px 14px', marginBottom: 14,
              background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.22)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <Zap style={{ width: 14, height: 14, color: '#fbbf24' }} />
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24' }}>
                  Exit Poll Preview · Live results activate May 4 at 8 AM IST
                </span>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>
                  Showing Axis My India projections — official count pending
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Winner / projected winner banner ── */}
        {winner && (
          <div style={{
            borderRadius: 16, padding: '14px 18px',
            display: 'flex', alignItems: 'center', gap: 12,
            background: isDeclared
              ? 'linear-gradient(135deg, rgba(74,222,128,0.18), rgba(34,197,94,0.08))'
              : 'linear-gradient(135deg, rgba(251,191,36,0.18), rgba(245,158,11,0.08))',
            border: isDeclared ? '2px solid rgba(74,222,128,0.5)' : '2px solid rgba(251,191,36,0.5)',
          }}>
            <Trophy style={{ width: 22, height: 22, color: isDeclared ? '#4ade80' : '#fbbf24', flexShrink: 0 }} />
            <div>
              <p style={{ fontWeight: 900, fontSize: 16, color: isDeclared ? '#4ade80' : '#fbbf24' }}>
                {isDeclared ? `🎉 ${winner} WINS!` : `${winner} heading to majority`}
              </p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                {isDeclared ? 'Results declared · Tamil Nadu Assembly Election 2026' : 'On track for 118+ seats'}
              </p>
            </div>
          </div>
        )}

        {/* ── Loading skeleton ── */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{
                height: 72, borderRadius: 16,
                background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
              }} />
            ))}
          </div>
        )}

        {/* ── Party rows ── */}
        {!loading && parties.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {parties.map(p =>
              isPreCount
                ? <PartyRowPreCount key={p.name} party={p} />
                : <PartyRowLive key={p.name} party={p} />
            )}
          </div>
        )}

        {/* ── Semi-circle parliament arc ── */}
        {!loading && parties.length > 0 && (
          <div style={{
            borderRadius: 16, padding: '14px 10px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <SeatArc parties={parties} total={TOTAL} majority={MAJORITY} />
          </div>
        )}

        {/* ── Seats reported progress (during counting) ── */}
        {isLive && seatsRep > 0 && (
          <div style={{ borderRadius: 14, padding: '12px 14px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Seats Reported
              </span>
              <span style={{ fontWeight: 900, fontSize: 12, color: 'rgba(255,255,255,0.6)', fontVariantNumeric: 'tabular-nums' }}>
                {seatsRep} / {TOTAL}
              </span>
            </div>
            <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 99,
                width: `${(seatsRep / TOTAL) * 100}%`,
                background: 'linear-gradient(90deg, #f87171, #fbbf24, #4ade80)',
                transition: 'width 0.8s ease',
              }} />
            </div>
            <div style={{ marginTop: 6, fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>
              {Math.round((seatsRep / TOTAL) * 100)}% of results declared · Auto-refreshes every 3 min
            </div>
          </div>
        )}

        {/* ── Narrative ── */}
        {data?.narrative && (
          <div style={{
            borderRadius: 14, padding: '12px 14px',
            background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.65 }}>{data.narrative}</p>
          </div>
        )}

        {/* ── Pre-counting countdown ── */}
        {isPreCount && data?.countingStartsAt && (
          <CountingCountdown countingStartsAt={data.countingStartsAt} />
        )}

        {/* ── Live headlines ── */}
        {(isLive || isDeclared) && data?.headlines && data.headlines.length > 0 && !compact && (
          <div>
            <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 8 }}>
              Live Headlines
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {data.headlines.slice(0, 3).map((h, i) => (
                <div key={i} style={{
                  padding: '9px 12px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                }}>
                  <span style={{ fontSize: 10, color: '#ef4444', flexShrink: 0, marginTop: 1 }}>●</span>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{h}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Stale cache warning ── */}
        {data?.source === 'cached-stale' && (
          <div style={{
            borderRadius: 10, padding: '8px 12px',
            background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Zap style={{ width: 11, height: 11, color: '#fbbf24', flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: 'rgba(251,191,36,0.8)', fontWeight: 600 }}>
              Live source temporarily unavailable — showing last known data. Retrying…
            </span>
          </div>
        )}

        {/* ── Source + link ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {data?.source === 'eci-live' && (
              <>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>Live · ECI official data</span>
              </>
            )}
            {data?.source === 'manual-override' && (
              <>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fbbf24', display: 'inline-block' }} />
                <span style={{ fontSize: 9, color: 'rgba(251,191,36,0.5)' }}>Manual update</span>
              </>
            )}
            {data?.source === 'ai-parsed' && (
              <>
                <Zap style={{ width: 10, height: 10, color: 'rgba(251,191,36,0.5)' }} />
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>AI · news headlines</span>
              </>
            )}
            {(data?.source === 'exit-poll-projection' || data?.source === 'cached-stale') && (
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.15)' }}>
                {data.source === 'cached-stale' ? 'Last known · retrying' : 'Exit poll · Axis My India'}
              </span>
            )}
          </div>
          {!compact && (
            <Link href="/tn-election-2026"
              style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', textDecoration: 'none' }}>
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

  const totalSec = Math.floor(diff / 1000)
  const d = Math.floor(totalSec / 86400)
  const h = Math.floor((totalSec % 86400) / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const sec = totalSec % 60

  const slots = [
    ...(d > 0 ? [{ val: d, label: 'days' }] : []),
    { val: h, label: 'hrs' },
    { val: m, label: 'min' },
    { val: sec, label: 'sec' },
  ]

  return (
    <div style={{
      borderRadius: 16, padding: '16px', textAlign: 'center',
      background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)',
    }}>
      <p style={{ fontSize: 9, color: 'rgba(251,191,36,0.6)', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 12 }}>
        Counting begins in
      </p>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 4 }}>
        {slots.map((slot, i) => (
          <div key={slot.label} style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontWeight: 900, fontSize: 28, fontVariantNumeric: 'tabular-nums',
                color: slot.label === 'sec' ? 'rgba(255,255,255,0.45)' : '#fbbf24',
                lineHeight: 1,
              }}>
                {String(slot.val).padStart(2, '0')}
              </div>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', marginTop: 3 }}>{slot.label}</div>
            </div>
            {i < slots.length - 1 && (
              <div style={{ color: 'rgba(251,191,36,0.35)', fontWeight: 900, fontSize: '1.4rem', marginBottom: 12 }}>:</div>
            )}
          </div>
        ))}
      </div>
      <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 10 }}>May 4, 2026 · 8:00 AM IST</p>
    </div>
  )
}
