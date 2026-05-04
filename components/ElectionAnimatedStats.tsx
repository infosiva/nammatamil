'use client'

/**
 * ElectionDashboard — Tamil Nadu Election 2026 Live Results Dashboard
 *
 * Features:
 * - Winner banner when any party crosses 118
 * - Large parliament arc / seat bar visualization
 * - Party tally with Won | Leading | Total | Vote% columns
 * - Majority tracker bar per party
 * - Auto-refresh every 90s with live indicator
 * - Animated number counters
 */

import { useState, useEffect, useCallback, useRef } from 'react'

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

interface ElectionData {
  phase: string
  seatsReported: number
  totalSeats: number
  majorityMark: number
  parties: PartyResult[]
  narrative: string
  updatedAt: string
  source: string
  leader: string
  projectedWinner: string | null
  refreshing?: boolean
}

const REFRESH_MS = 60 * 1000   // refresh every 60s on counting day
const MAJORITY = 118
const TOTAL = 234

// ── Animated number counter ───────────────────────────────────────────────────
function AnimNum({ value, duration = 800 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(value)
  const prev = useRef(value)
  const raf  = useRef<number | null>(null)

  useEffect(() => {
    if (prev.current === value) return
    if (raf.current) cancelAnimationFrame(raf.current)
    const start = prev.current
    const diff  = value - start
    const t0    = performance.now()
    const step  = (now: number) => {
      const t = Math.min((now - t0) / duration, 1)
      const e = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
      setDisplay(Math.round(start + diff * e))
      if (t < 1) { raf.current = requestAnimationFrame(step) }
      else { setDisplay(value); prev.current = value }
    }
    raf.current = requestAnimationFrame(step)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [value, duration])

  return <>{display}</>
}

// ── Winner banner ─────────────────────────────────────────────────────────────
function WinnerBanner({ party }: { party: PartyResult }) {
  return (
    <div style={{
      borderRadius: 16,
      padding: '16px',
      background: `linear-gradient(135deg, ${party.color}18, ${party.color}08)`,
      border: `1.5px solid ${party.color}50`,
      boxShadow: `0 0 32px ${party.color}20`,
      position: 'relative', overflow: 'hidden',
      animation: 'winnerGlow 2.5s ease-in-out infinite',
    }}>
      {/* Floating dots */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute', width: 4, height: 4, borderRadius: '50%',
            background: party.color, opacity: 0.2,
            left: `${8 + i * 16}%`, top: `${25 + (i % 2) * 40}%`,
            animation: `float ${1.8 + i * 0.4}s ease-in-out infinite alternate`,
          }} />
        ))}
      </div>

      {/* Top line */}
      <div style={{ fontSize: 9, fontWeight: 800, color: party.color, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        🏆 MAJORITY WON — TAMIL NADU ASSEMBLY 2026
      </div>

      {/* Main content row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
          background: `${party.color}18`, border: `2px solid ${party.color}45`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
        }}>
          {party.emoji}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 'clamp(16px, 4vw, 22px)', fontWeight: 900, color: '#fff', lineHeight: 1.2, marginBottom: 4 }}>
            {party.fullName}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
            Led by {party.leader}
          </div>
          <span style={{
            display: 'inline-block', fontSize: 10, fontWeight: 900, padding: '3px 10px', borderRadius: 99,
            background: `${party.color}22`, color: party.color, border: `1px solid ${party.color}40`,
          }}>
            {party.totalTally - MAJORITY}+ seats above majority
          </span>
        </div>

        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: 'clamp(36px, 8vw, 52px)', fontWeight: 900, color: party.color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            <AnimNum value={party.totalTally} />
          </div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>seats</div>
        </div>
      </div>
    </div>
  )
}

// ── Top stat cards ────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, pulse }: {
  label: string; value: string | number; sub?: string; color?: string; pulse?: boolean
}) {
  return (
    <div style={{
      borderRadius: 14, padding: '14px 16px',
      background: color ? `${color}0c` : 'rgba(255,255,255,0.03)',
      border: `1px solid ${color ? color + '28' : 'rgba(255,255,255,0.08)'}`,
      flex: 1, minWidth: 0,
      transition: 'border-color 0.5s',
    }}>
      <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
        {pulse && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'inline-block', flexShrink: 0, animation: 'livePulse 1.5s infinite' }} />}
        {label}
      </div>
      <div style={{ fontWeight: 900, fontSize: 'clamp(18px, 4vw, 26px)', color: color ?? 'rgba(255,255,255,0.9)', fontVariantNumeric: 'tabular-nums', lineHeight: 1, wordBreak: 'break-all' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.22)', marginTop: 6, lineHeight: 1.4 }}>{sub}</div>}
    </div>
  )
}

// ── Majority progress bar per party ──────────────────────────────────────────
function MajorityBar({ party }: { party: PartyResult }) {
  const pct = Math.min((party.totalTally / MAJORITY) * 100, 100)
  return (
    <div style={{ flex: 1, minWidth: 80 }}>
      <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 99,
          width: `${pct}%`,
          background: party.hasMajority ? '#4ade80' : party.color,
          transition: 'width 1.2s cubic-bezier(0.34,1.56,0.64,1)',
          boxShadow: party.hasMajority ? '0 0 6px rgba(74,222,128,0.6)' : 'none',
        }} />
      </div>
      <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', marginTop: 3, textAlign: 'right' }}>
        {party.totalTally}/{MAJORITY}
      </div>
    </div>
  )
}

// ── Parliament bar ────────────────────────────────────────────────────────────
function ParliamentBar({ parties }: { parties: PartyResult[] }) {
  const totalReported = parties.reduce((s, p) => s + p.totalTally, 0)
  const scale = totalReported > 0 ? Math.min(TOTAL / totalReported, 1) : 1

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Parliament — {TOTAL} seats
        </span>
        <span style={{ fontSize: 10, color: 'rgba(251,191,36,0.7)', fontWeight: 700 }}>
          Majority: {MAJORITY} seats
        </span>
      </div>

      {/* Big seat bar */}
      <div style={{ height: 36, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', display: 'flex', position: 'relative' }}>
        {parties.map(p => {
          const pct = (p.totalTally * scale / TOTAL) * 100
          if (pct < 0.5) return null
          return (
            <div key={p.name} style={{
              width: `${pct}%`,
              background: p.isLeading
                ? `linear-gradient(90deg, ${p.color}cc, ${p.color})`
                : `linear-gradient(90deg, ${p.color}66, ${p.color}88)`,
              transition: 'width 1.4s cubic-bezier(0.34,1.56,0.64,1)',
              boxShadow: p.isLeading ? `0 0 16px ${p.color}50` : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {pct > 7 && (
                <span style={{ fontSize: 10, fontWeight: 900, color: 'rgba(0,0,0,0.75)', whiteSpace: 'nowrap', letterSpacing: '0.02em' }}>
                  {p.name} {p.totalTally}
                </span>
              )}
            </div>
          )
        })}

        {/* Majority line at 118/234 */}
        <div style={{
          position: 'absolute', top: 0, bottom: 0,
          left: `${(MAJORITY / TOTAL) * 100}%`,
          width: 2,
          background: 'rgba(251,191,36,0.95)',
          boxShadow: '0 0 8px rgba(251,191,36,0.8), 0 0 2px rgba(251,191,36,1)',
          zIndex: 2,
        }} />
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 12, alignItems: 'center' }}>
        {parties.filter(p => p.totalTally > 0).map(p => (
          <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: p.color, display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: p.color, fontWeight: 800 }}>{p.name}</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontVariantNumeric: 'tabular-nums' }}>{p.totalTally}</span>
          </div>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 9, color: 'rgba(251,191,36,0.5)', fontWeight: 700 }}>
          ↑ {MAJORITY} = majority line
        </span>
      </div>
    </div>
  )
}

// ── Party tally table row ─────────────────────────────────────────────────────
function PartyRow({ party, maxTally, rank }: { party: PartyResult; maxTally: number; rank: number }) {
  const barPct = maxTally > 0 ? (party.totalTally / maxTally) * 100 : 0

  return (
    <div className="party-row" style={{
      display: 'grid',
      gridTemplateColumns: '1fr 52px 62px 62px',
      alignItems: 'center',
      padding: '10px 12px',
      gap: 6,
      background: party.isLeading ? `${party.color}0e` : rank % 2 === 0 ? 'rgba(255,255,255,0.012)' : 'transparent',
      borderRadius: 12,
      position: 'relative',
      overflow: 'hidden',
      border: party.isLeading ? `1px solid ${party.color}28` : '1px solid transparent',
      transition: 'background 0.3s',
    }}>
      {/* Progress bar behind */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: `${barPct * 0.55}%`,
        background: `${party.color}05`,
        pointerEvents: 'none',
        transition: 'width 1.2s ease',
      }} />

      {/* Party info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative', zIndex: 1, minWidth: 0 }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          background: `${party.color}16`,
          border: `1.5px solid ${party.color}35`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13,
          boxShadow: party.isLeading ? `0 0 8px ${party.color}40` : 'none',
        }}>
          {party.emoji}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 900, fontSize: 13, color: party.isLeading ? party.color : 'rgba(255,255,255,0.85)' }}>
              {party.name}
            </span>
            {party.isLeading && (
              <span style={{ fontSize: 7, fontWeight: 900, padding: '2px 5px', borderRadius: 99, background: `${party.color}22`, color: party.color, border: `1px solid ${party.color}40`, letterSpacing: '0.06em', flexShrink: 0 }}>
                LEADING
              </span>
            )}
            {party.hasMajority && (
              <span style={{ fontSize: 7, fontWeight: 900, padding: '2px 5px', borderRadius: 99, background: 'rgba(74,222,128,0.15)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.35)', letterSpacing: '0.06em', flexShrink: 0 }}>
                ✓ MAJ
              </span>
            )}
          </div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.22)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {party.voteShare > 0 ? `${party.voteShare.toFixed(1)}% vote share` : party.leader}
          </div>
        </div>
      </div>

      {/* Won */}
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ fontWeight: 900, fontSize: 16, color: '#4ade80', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
          <AnimNum value={party.seatsWon} />
        </div>
        <div style={{ fontSize: 8, color: 'rgba(74,222,128,0.4)', marginTop: 2 }}>WON</div>
      </div>

      {/* Leading */}
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ fontWeight: 900, fontSize: 16, color: '#fbbf24', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
          <AnimNum value={party.seatsLeading} />
        </div>
        <div style={{ fontSize: 8, color: 'rgba(251,191,36,0.4)', marginTop: 2 }}>LEADING</div>
      </div>

      {/* Total */}
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ fontWeight: 900, fontSize: 20, color: party.isLeading ? party.color : 'rgba(255,255,255,0.75)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
          <AnimNum value={party.totalTally} />
        </div>
        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', marginTop: 2 }}>TOTAL</div>
      </div>
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function ElectionAnimatedStats() {
  const [data, setData]           = useState<ElectionData | null>(null)
  const [loading, setLoading]     = useState(true)
  const [lastRefresh, setLast]    = useState(0)
  const [refreshing, setRefresh]  = useState(false)
  const [secAgo, setSecAgo]       = useState(0)

  const fetchData = useCallback(async (manual = false) => {
    if (manual) setRefresh(true)
    try {
      const res = await fetch('/api/election-results', { cache: 'no-store', signal: AbortSignal.timeout(12000) })
      if (!res.ok) return
      const d = await res.json()
      setData(d)
      setLast(Date.now())
      setSecAgo(0)
    } catch { /* keep prev */ }
    finally { setLoading(false); setRefresh(false) }
  }, [])

  useEffect(() => {
    fetchData()
    const poll  = setInterval(fetchData, REFRESH_MS)
    const clock = setInterval(() => setSecAgo(s => s + 1), 1000)
    return () => { clearInterval(poll); clearInterval(clock) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ flex: 1, height: 90, borderRadius: 16, background: 'rgba(255,255,255,0.03)', animation: 'shimmer 1.5s infinite' }} />
          ))}
        </div>
        <div style={{ height: 280, borderRadius: 18, background: 'rgba(255,255,255,0.02)', animation: 'shimmer 1.5s infinite' }} />
        <style>{`@keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
      </div>
    )
  }

  if (!data) return null

  const parties       = data.parties ?? []
  const hasData       = parties.some(p => p.totalTally > 0)
  const maxTally      = Math.max(...parties.map(p => p.totalTally), 1)
  const leader        = parties.find(p => p.isLeading)
  const winner        = parties.find(p => p.hasMajority)
  const totalWon      = parties.reduce((s, p) => s + p.seatsWon, 0)
  const totalLeading  = parties.reduce((s, p) => s + p.seatsLeading, 0)
  const isLive        = data.phase === 'counting' || data.phase === 'declared'
  const reportingPct  = Math.round((data.seatsReported / TOTAL) * 100)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Winner banner (shows when any party has majority) ── */}
      {winner && hasData && <WinnerBanner party={winner} />}

      {/* ── Top stat row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <StatCard
          label="Seats Reporting"
          value={`${data.seatsReported}/${TOTAL}`}
          sub={`${reportingPct}% counted`}
          color={isLive ? '#ef4444' : undefined}
          pulse={isLive}
        />
        <StatCard
          label="Majority"
          value={`${MAJORITY}`}
          sub={`of ${TOTAL} seats`}
          color="#fbbf24"
        />
        {leader && (
          <StatCard
            label={winner ? 'Winner' : 'Leading'}
            value={leader.name}
            sub={`${leader.totalTally} seats`}
            color={leader.color}
          />
        )}
      </div>

      {/* ── Main results panel ── */}
      <div style={{
        borderRadius: 20,
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.08)',
        overflow: 'hidden',
      }}>
        {/* Panel header */}
        <div style={{
          padding: '13px 18px',
          background: 'rgba(255,255,255,0.03)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {isLive && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'livePulse 1.5s infinite' }} />
                <span style={{ fontWeight: 900, fontSize: 13, color: '#ef4444', letterSpacing: '0.04em' }}>
                  {data.phase === 'declared' ? 'RESULTS DECLARED' : 'LIVE COUNTING'}
                </span>
              </div>
            )}
            {!isLive && (
              <span style={{ fontWeight: 900, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                TN ELECTION 2026
              </span>
            )}
            {hasData && (
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', padding: '2px 8px', borderRadius: 99, background: 'rgba(255,255,255,0.05)' }}>
                {totalWon} declared · {totalLeading} leading
              </span>
            )}
            {(data.source === 'cached-stale' || data.refreshing) && (
              <span style={{
                fontSize: 8, fontWeight: 800, padding: '2px 7px', borderRadius: 99,
                background: 'rgba(251,191,36,0.12)', color: '#fbbf24',
                border: '1px solid rgba(251,191,36,0.28)', letterSpacing: '0.05em',
                animation: 'updatingPulse 2s ease-in-out infinite',
              }}>
                Updating…
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.18)' }}>
              {refreshing
                ? 'Refreshing…'
                : lastRefresh
                  ? `Next in ${Math.max(0, 60 - secAgo)}s`
                  : 'auto-refresh 60s'}
            </span>
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 5, color: 'rgba(255,255,255,0.25)', fontSize: 14, display: 'flex', alignItems: 'center' }}
              title="Refresh now"
            >
              <span style={{ display: 'inline-block', animation: refreshing ? 'spin 1s linear infinite' : 'none' }}>↻</span>
            </button>
          </div>
        </div>

        {/* Table column headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 52px 62px 62px',
          padding: '7px 12px',
          gap: 6,
          background: 'rgba(0,0,0,0.25)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Party</span>
          <span style={{ fontSize: 9, fontWeight: 800, color: '#4ade80', textAlign: 'center', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Won</span>
          <span style={{ fontSize: 9, fontWeight: 800, color: '#fbbf24', textAlign: 'center', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Leading</span>
          <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textAlign: 'center', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Total</span>
        </div>

        {/* Party rows */}
        <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
          {hasData ? (
            parties.map((p, i) => (
              <PartyRow key={p.name} party={p} maxTally={maxTally} rank={i} />
            ))
          ) : (
            <div style={{ padding: '28px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 26, marginBottom: 12 }}>📡</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>Connecting to ECI results feed…</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)' }}>
                Counting begins 8:00 AM IST · auto-refreshes every 90s
              </div>
            </div>
          )}
        </div>

        {/* Majority progress bars */}
        {hasData && (
          <div style={{ padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
              Progress to Majority ({MAJORITY} seats)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {parties.filter(p => p.totalTally > 0).map(p => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: p.color, width: 52, flexShrink: 0 }}>{p.name}</span>
                  <MajorityBar party={p} />
                  {p.hasMajority && (
                    <span style={{ fontSize: 9, fontWeight: 900, color: '#4ade80', flexShrink: 0 }}>✓</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Parliament seat bar */}
        {hasData && (
          <div style={{ padding: '16px 18px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <ParliamentBar parties={parties} />
          </div>
        )}

        {/* Footer */}
        <div style={{
          padding: '10px 18px',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
        }}>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.18)' }}>
            {data.source === 'eci-live'        ? '🟢 Live · ECI official data'
              : data.source === 'ai-parsed'    ? '⚡ AI · parsed from news sources'
              : data.source === 'manual-override' ? '🟡 Manual data update'
              : data.source === 'cached-stale' ? '🟠 Snapshot data · refreshing'
              : '⏳ Fetching live data…'}
          </span>
          {data.narrative && (
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.22)', maxWidth: 340, textAlign: 'right', lineHeight: 1.5, fontStyle: 'italic' }}>
              {data.narrative}
            </span>
          )}
        </div>
      </div>

      <style>{`
        @keyframes livePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.4)} }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes winnerGlow { 0%,100%{box-shadow:0 0 40px rgba(251,191,36,0.15)} 50%{box-shadow:0 0 60px rgba(251,191,36,0.3)} }
        @keyframes float { 0%{transform:translateY(0)} 100%{transform:translateY(-8px)} }
        @keyframes updatingPulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>
    </div>
  )
}
