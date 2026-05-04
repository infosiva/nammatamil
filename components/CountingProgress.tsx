'use client'

/**
 * CountingProgress — Shows counting status:
 * - Seats declared vs remaining
 * - Estimated votes counted (from voter turnout data)
 * - Rounds info context
 *
 * TN 2026 total registered voters: ~6.17 crore
 * Estimated turnout ~70% → ~4.32 crore votes cast
 * 234 seats → average ~1.85 lakh votes per seat
 */

import { useState, useEffect } from 'react'

const ECI_JSON    = 'https://results.eci.gov.in/ResultAcGenMay2026/election-json-S22-live.json'
const TOTAL_SEATS = 234
// TN 2026 official voter stats
const TOTAL_VOTERS    = 61_700_000  // 6.17 crore registered voters
const TURNOUT_PCT     = 71          // ~71% estimated turnout TN 2026
const VOTES_CAST      = Math.round(TOTAL_VOTERS * (TURNOUT_PCT / 100))  // ~4.38 crore
const AVG_PER_SEAT    = Math.round(VOTES_CAST / TOTAL_SEATS)            // ~1.87 lakh per seat
// Counting rounds: each seat takes ~14-20 rounds of counting
const ROUNDS_PER_SEAT = 17 // average

function fmt(n: number) {
  if (n >= 10_000_000) return `${(n / 10_000_000).toFixed(2)} Cr`
  if (n >= 100_000)    return `${(n / 100_000).toFixed(1)} L`
  return n.toLocaleString()
}

export default function CountingProgress() {
  const [declared, setDeclared]   = useState(0)
  const [mounted, setMounted]     = useState(false)

  useEffect(() => {
    setMounted(true)
    async function load() {
      try {
        const res  = await fetch(ECI_JSON, { cache: 'no-store', signal: AbortSignal.timeout(8000) })
        const json = await res.json() as Record<string, { chartData: unknown[] }>
        setDeclared(json['S22']?.chartData?.length ?? 0)
      } catch { /* ignore */ }
    }
    load()
    const iv = setInterval(load, 60_000)
    return () => clearInterval(iv)
  }, [])

  if (!mounted) return null

  const remaining      = TOTAL_SEATS - declared
  const allDone        = remaining === 0
  const seatsPct       = Math.round((declared / TOTAL_SEATS) * 100)
  // Estimated votes counted based on declared seats
  const votesCountedEst = Math.round(declared * AVG_PER_SEAT)
  const votesRemEst     = VOTES_CAST - votesCountedEst
  // Estimated total rounds completed
  const roundsDone      = declared * ROUNDS_PER_SEAT
  const roundsTotal     = TOTAL_SEATS * ROUNDS_PER_SEAT

  return (
    <div style={{
      borderRadius: 16,
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.07)',
      overflow: 'hidden',
      marginBottom: 14,
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          {!allDone && <span style={{
            width: 6, height: 6, borderRadius: '50%', background: '#ef4444',
            display: 'inline-block', animation: 'cpPulse 1.5s infinite',
          }} />}
          <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.07em' }}>
            COUNTING PROGRESS
          </span>
        </div>
        <span style={{
          fontSize: 9, fontWeight: 900,
          color: allDone ? '#4ade80' : '#ef4444',
        }}>
          {allDone ? '✓ ALL COUNTED' : 'LIVE'}
        </span>
      </div>

      <div style={{ padding: '12px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>

        {/* Seats declared */}
        <StatBox
          label="Seats Declared"
          value={`${declared} / ${TOTAL_SEATS}`}
          sub={`${remaining > 0 ? `${remaining} remaining` : 'All done'}`}
          color={allDone ? '#4ade80' : '#fbbf24'}
          bar={seatsPct}
          barColor={allDone ? '#4ade80' : '#fbbf24'}
        />

        {/* Votes counted estimate */}
        <StatBox
          label="Votes Counted (est.)"
          value={fmt(votesCountedEst)}
          sub={allDone ? `of ${fmt(VOTES_CAST)} total` : `${fmt(votesRemEst)} remaining`}
          color="#a78bfa"
          bar={seatsPct}
          barColor="#a78bfa"
        />

        {/* Counting rounds */}
        <StatBox
          label="Counting Rounds Done"
          value={`~${fmt(roundsDone)}`}
          sub={`of ~${fmt(roundsTotal)} total rounds`}
          color="#38bdf8"
          bar={seatsPct}
          barColor="#38bdf8"
        />

        {/* Voter turnout */}
        <StatBox
          label="Voter Turnout (TN 2026)"
          value={`${TURNOUT_PCT}%`}
          sub={`${fmt(VOTES_CAST)} of ${fmt(TOTAL_VOTERS)}`}
          color="#f87171"
          bar={TURNOUT_PCT}
          barColor="#f87171"
        />
      </div>

      {/* Context note */}
      <div style={{
        padding: '8px 14px 12px',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        fontSize: 9, color: 'rgba(255,255,255,0.2)', lineHeight: 1.5,
      }}>
        ℹ️ TN 2026: 6.17 Cr registered voters · ~71% turnout · 234 constituencies · ~17 counting rounds per seat.
        Votes counted is estimated from declared seats × average votes per constituency (~{fmt(AVG_PER_SEAT)}).
      </div>

      <style>{`@keyframes cpPulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  )
}

function StatBox({ label, value, sub, color, bar, barColor }: {
  label: string; value: string; sub: string; color: string; bar: number; barColor: string
}) {
  return (
    <div style={{
      borderRadius: 12,
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(255,255,255,0.06)',
      padding: '10px 12px',
    }}>
      <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 900, color, lineHeight: 1, marginBottom: 3, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', marginBottom: 6 }}>{sub}</div>
      <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 99,
          width: `${bar}%`,
          background: barColor,
          transition: 'width 1.2s ease',
        }} />
      </div>
    </div>
  )
}
