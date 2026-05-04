'use client'

/**
 * ElectionDashboard — Tamil Nadu Election 2026 Live Results Dashboard
 *
 * Modern ECI-style dashboard showing:
 * - Big stat cards: seats reporting, majority mark, leader
 * - Party tally table: Won | Leading | Total (clearly separated)
 * - Parliament seat bar chart
 * - Auto-refresh every 90s
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
}

const REFRESH_MS = 90 * 1000
const MAJORITY = 118
const TOTAL = 234

// ── Animated number counter ───────────────────────────────────────────────────
function AnimNum({ value, duration = 600 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(value)
  const prev = useRef(value)

  useEffect(() => {
    if (prev.current === value) return
    const start = prev.current
    const diff = value - start
    const startTime = performance.now()
    const step = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1)
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
      setDisplay(Math.round(start + diff * eased))
      if (t < 1) requestAnimationFrame(step)
      else { setDisplay(value); prev.current = value }
    }
    requestAnimationFrame(step)
  }, [value, duration])

  return <>{display}</>
}

// ── Top stat cards ────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, pulse }: { label: string; value: string | number; sub?: string; color?: string; pulse?: boolean }) {
  return (
    <div style={{
      borderRadius: 14, padding: '14px 16px',
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${color ? color + '30' : 'rgba(255,255,255,0.08)'}`,
      flex: 1, minWidth: 0,
    }}>
      <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        {pulse && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />}
        {label}
      </div>
      <div style={{ fontWeight: 900, fontSize: 22, color: color ?? 'rgba(255,255,255,0.85)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 5 }}>{sub}</div>}
    </div>
  )
}

// ── Parliament bar ────────────────────────────────────────────────────────────
function ParliamentBar({ parties }: { parties: PartyResult[] }) {
  const total = parties.reduce((s, p) => s + p.totalTally, 0)
  const scale = total > 0 ? TOTAL / total : 1

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Parliament — {TOTAL} seats
        </span>
        <span style={{ fontSize: 9, color: 'rgba(251,191,36,0.6)', fontWeight: 700 }}>
          ← majority: {MAJORITY}
        </span>
      </div>

      {/* Seat bar */}
      <div style={{ height: 28, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', display: 'flex', position: 'relative' }}>
        {parties.map(p => {
          const pct = (p.totalTally * scale / TOTAL) * 100
          if (pct < 0.3) return null
          return (
            <div key={p.name} style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${p.color}bb, ${p.color})`,
              transition: 'width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
              boxShadow: p.isLeading ? `0 0 10px ${p.color}60` : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {pct > 8 && (
                <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(0,0,0,0.7)', whiteSpace: 'nowrap' }}>
                  {p.name}
                </span>
              )}
            </div>
          )
        })}

        {/* Majority line */}
        <div style={{
          position: 'absolute', top: 0, bottom: 0,
          left: `${(MAJORITY / TOTAL) * 100}%`,
          width: 2,
          background: 'rgba(251,191,36,0.9)',
          boxShadow: '0 0 6px rgba(251,191,36,0.6)',
          zIndex: 2,
        }} />
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 10 }}>
        {parties.filter(p => p.totalTally > 0).map(p => (
          <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: p.color, display: 'inline-block' }} />
            <span style={{ fontSize: 9, color: p.color, fontWeight: 700 }}>{p.name}</span>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontVariantNumeric: 'tabular-nums' }}>{p.totalTally}</span>
          </div>
        ))}
        {parties.every(p => p.totalTally === 0) && (
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>Awaiting results…</span>
        )}
      </div>
    </div>
  )
}

// ── Party tally table row ─────────────────────────────────────────────────────
function PartyRow({ party, maxTally, rank }: { party: PartyResult; maxTally: number; rank: number }) {
  const barPct = maxTally > 0 ? (party.totalTally / maxTally) * 100 : 0

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '2fr 52px 60px 60px',
      alignItems: 'center',
      padding: '10px 14px',
      gap: 8,
      background: party.isLeading ? `${party.color}0d` : rank % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
      borderRadius: 10,
      position: 'relative',
      overflow: 'hidden',
      border: party.isLeading ? `1px solid ${party.color}25` : '1px solid transparent',
      transition: 'background 0.3s',
    }}>
      {/* Progress fill behind */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: `${barPct * 0.6}%`,
        background: `${party.color}06`,
        pointerEvents: 'none',
        transition: 'width 1s ease',
      }} />

      {/* Party name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative', zIndex: 1 }}>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: party.color, display: 'inline-block', flexShrink: 0, boxShadow: party.isLeading ? `0 0 8px ${party.color}` : 'none' }} />
        <div>
          <div style={{ fontWeight: 800, fontSize: 12, color: party.isLeading ? party.color : 'rgba(255,255,255,0.8)' }}>{party.name}</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 1 }}>{party.leader}</div>
        </div>
        {party.isLeading && (
          <span style={{ fontSize: 7, fontWeight: 900, padding: '2px 6px', borderRadius: 99, background: `${party.color}22`, color: party.color, border: `1px solid ${party.color}40`, letterSpacing: '0.06em' }}>
            LEADING
          </span>
        )}
        {party.hasMajority && (
          <span style={{ fontSize: 7, fontWeight: 900, padding: '2px 6px', borderRadius: 99, background: 'rgba(74,222,128,0.15)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.35)', letterSpacing: '0.06em' }}>
            ✓ MAJORITY
          </span>
        )}
      </div>

      {/* Won */}
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ fontWeight: 900, fontSize: 15, color: '#4ade80', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
          <AnimNum value={party.seatsWon} />
        </div>
      </div>

      {/* Leading */}
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ fontWeight: 900, fontSize: 15, color: '#fbbf24', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
          <AnimNum value={party.seatsLeading} />
        </div>
      </div>

      {/* Total */}
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ fontWeight: 900, fontSize: 17, color: party.isLeading ? party.color : 'rgba(255,255,255,0.7)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
          <AnimNum value={party.totalTally} />
        </div>
      </div>
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function ElectionAnimatedStats() {
  const [data, setData] = useState<ElectionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true)
    try {
      const res = await fetch('/api/election-results', { cache: 'no-store', signal: AbortSignal.timeout(10000) })
      if (!res.ok) return
      const d = await res.json()
      setData(d)
      setLastRefresh(Date.now())
    } catch { /* keep prev */ }
    finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, REFRESH_MS)
    return () => clearInterval(id)
  }, [fetchData])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ flex: 1, height: 80, borderRadius: 14, background: 'rgba(255,255,255,0.03)', animation: 'pulse 2s infinite' }} />
          ))}
        </div>
        <div style={{ height: 260, borderRadius: 16, background: 'rgba(255,255,255,0.02)', animation: 'pulse 2s infinite' }} />
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
      </div>
    )
  }

  if (!data) return null

  const parties = data.parties ?? []
  const hasData = parties.some(p => p.totalTally > 0)
  const maxTally = Math.max(...parties.map(p => p.totalTally), 1)
  const leader = parties.find(p => p.isLeading)
  const totalWon = parties.reduce((s, p) => s + p.seatsWon, 0)
  const totalLeading = parties.reduce((s, p) => s + p.seatsLeading, 0)
  const isLive = data.phase === 'counting' || data.phase === 'declared'

  const secAgo = lastRefresh ? Math.floor((Date.now() - lastRefresh) / 1000) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Top stat row ── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <StatCard
          label="Seats Reporting"
          value={`${data.seatsReported} / ${TOTAL}`}
          sub={`${Math.round((data.seatsReported / TOTAL) * 100)}% declared`}
          color={isLive ? '#ef4444' : undefined}
          pulse={isLive}
        />
        <StatCard
          label="Majority Mark"
          value={MAJORITY}
          sub={`of ${TOTAL} total seats`}
          color="#fbbf24"
        />
        <StatCard
          label={leader ? 'Currently Leading' : 'Leader'}
          value={leader ? leader.name : '—'}
          sub={leader ? `${leader.totalTally} seats (${leader.seatsWon}W + ${leader.seatsLeading}L)` : 'Awaiting data'}
          color={leader?.color}
        />
      </div>

      {/* ── Main results panel ── */}
      <div style={{
        borderRadius: 18,
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.07)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '12px 16px',
          background: 'rgba(255,255,255,0.03)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {isLive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'livePulse 1.5s infinite' }} />}
              <span style={{ fontWeight: 900, fontSize: 13, color: isLive ? '#ef4444' : 'rgba(255,255,255,0.6)' }}>
                {data.phase === 'declared' ? 'RESULTS DECLARED' : isLive ? 'LIVE COUNTING' : 'TN ELECTION 2026'}
              </span>
            </div>
            {hasData && (
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>
                {totalWon} won · {totalLeading} leading
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {secAgo !== null && (
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.18)' }}>
                {refreshing ? 'Refreshing…' : secAgo < 60 ? `${secAgo}s ago` : `${Math.floor(secAgo / 60)}m ago`}
              </span>
            )}
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'rgba(255,255,255,0.2)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <span style={{ display: 'inline-block', animation: refreshing ? 'spin 1s linear infinite' : 'none' }}>↻</span>
            </button>
          </div>
        </div>

        {/* Table header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 52px 60px 60px',
          padding: '8px 14px',
          gap: 8,
          background: 'rgba(0,0,0,0.3)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Party</span>
          <span style={{ fontSize: 9, fontWeight: 800, color: '#4ade80', textAlign: 'center', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Won</span>
          <span style={{ fontSize: 9, fontWeight: 800, color: '#fbbf24', textAlign: 'center', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Leading</span>
          <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textAlign: 'center', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Total</span>
        </div>

        {/* Party rows */}
        <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {hasData ? (
            parties.map((p, i) => (
              <PartyRow key={p.name} party={p} maxTally={maxTally} rank={i} />
            ))
          ) : (
            <div style={{ padding: '20px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, marginBottom: 10 }}>📡</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>Fetching live data from ECI…</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)' }}>
                Results will appear here as constituencies report · auto-refreshes every 90s
              </div>
            </div>
          )}
        </div>

        {/* Parliament bar */}
        {hasData && (
          <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <ParliamentBar parties={parties} />
          </div>
        )}

        {/* Source footer */}
        <div style={{
          padding: '8px 16px',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.15)' }}>
            {data.source === 'eci-live' ? '🟢 Live · ECI official'
              : data.source === 'ai-parsed' ? '⚡ AI · news sources'
              : data.source === 'manual-override' ? '🟡 Manual update'
              : data.source === 'cached-stale' ? '⚠️ Stale cache'
              : '⏳ Fetching…'}
          </span>
          {data.narrative && (
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', maxWidth: 280, textAlign: 'right', lineHeight: 1.4 }}>
              {data.narrative}
            </span>
          )}
        </div>
      </div>

      <style>{`
        @keyframes livePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
