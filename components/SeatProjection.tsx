'use client'

/**
 * SeatProjection — Shows maximum seats each party can still reach.
 * If TVK has 110 and 10 remain, they can reach at most 120.
 * Shows clearly how locked in the win is.
 */

import { useState, useEffect } from 'react'

const ECI_JSON = 'https://results.eci.gov.in/ResultAcGenMay2026/election-json-S22-live.json'
const MAJORITY = 118
const TOTAL    = 234

const ALIAS: Record<string, string> = {
  TVK:'TVK',
  DMK:'DMK', INC:'DMK', CPI:'DMK', 'CPI(M)':'DMK', VCK:'DMK', IUML:'DMK', MDMK:'DMK',
  ADMK:'ADMK', AIADMK:'ADMK', PMK:'ADMK', DMDK:'ADMK', PT:'ADMK', BJP:'ADMK',
  AMMKMNKZ:'Others',
}

interface Tally {
  tvk: number; dmk: number; admk: number; others: number
  declared: number; remaining: number
}

async function fetchTally(): Promise<Tally | null> {
  try {
    const res = await fetch(ECI_JSON, { cache: 'no-store', signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    const json = await res.json() as Record<string, { chartData: [string, string, number, string, string][] }>
    const rows = json['S22']?.chartData
    if (!rows?.length) return null
    const t: Record<string, number> = {}
    for (const [raw] of rows) {
      const k = ALIAS[raw] ?? 'Others'
      t[k] = (t[k] ?? 0) + 1
    }
    const remaining = TOTAL - rows.length
    return {
      tvk: t['TVK'] ?? 0, dmk: t['DMK'] ?? 0, admk: t['ADMK'] ?? 0,
      others: t['Others'] ?? 0,
      declared: rows.length, remaining,
    }
  } catch { return null }
}

export default function SeatProjection() {
  const [tally, setTally] = useState<Tally | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchTally().then(setTally)
    const iv = setInterval(() => fetchTally().then(setTally), 60_000)
    return () => clearInterval(iv)
  }, [])

  if (!mounted || !tally) return null

  const { tvk, dmk, admk, declared, remaining } = tally
  const allDone = remaining === 0

  // Maximum reachable = current + all remaining (if they win every remaining seat)
  const tvkMax  = tvk  + remaining
  const dmkMax  = dmk  + remaining
  const admkMax = admk + remaining

  // TVK win probability logic
  const tvkWon        = tvk >= MAJORITY
  const tvkCanWin     = tvkMax >= MAJORITY
  const dmkCanWin     = dmkMax >= MAJORITY
  const admkCanWin    = admkMax >= MAJORITY
  const tvkClinched   = allDone ? tvkWon : (tvkMax >= MAJORITY && (dmkMax < MAJORITY && admkMax < MAJORITY))

  // Seats TVK needs at minimum (from remaining) to reach majority
  const tvkNeedsFromRemaining = Math.max(0, MAJORITY - tvk)
  const tvkProbPct = tvkWon ? 100
    : !tvkCanWin ? 0
    : remaining > 0 ? Math.round(Math.min(99, ((remaining - tvkNeedsFromRemaining) / remaining) * 100 + 40))
    : 0

  const parties = [
    { label: 'TVK', emoji: '⭐', color: '#fbbf24', seats: tvk, max: tvkMax, canWin: tvkCanWin, won: tvkWon },
    { label: 'DMK+', emoji: '🌅', color: '#f87171', seats: dmk, max: dmkMax, canWin: dmkCanWin, won: false },
    { label: 'ADMK+', emoji: '🍃', color: '#4ade80', seats: admk, max: admkMax, canWin: admkCanWin, won: false },
  ]

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
          <span style={{ fontSize: 14 }}>📊</span>
          <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.07em' }}>
            SEAT PROJECTION
          </span>
        </div>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>
          {allDone ? 'Final count' : `${remaining} seats pending`}
        </span>
      </div>

      {/* TVK Win Probability — hero */}
      {!allDone && (
        <div style={{
          padding: '12px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          background: tvkWon ? 'rgba(251,191,36,0.06)' : 'transparent',
        }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', marginBottom: 6 }}>
            TVK WIN PROBABILITY
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Probability gauge */}
            <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
              <svg width="64" height="64" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
                <circle cx="32" cy="32" r="26" fill="none"
                  stroke={tvkWon ? '#4ade80' : tvkProbPct > 60 ? '#fbbf24' : '#ef4444'}
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={`${(tvkProbPct / 100) * 163.4} 163.4`}
                  strokeDashoffset="40.85"
                  transform="rotate(-90 32 32)"
                  style={{ transition: 'stroke-dasharray 1.5s ease' }}
                />
              </svg>
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 900,
                color: tvkWon ? '#4ade80' : '#fbbf24',
              }}>
                {tvkProbPct}%
              </div>
            </div>

            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: tvkWon ? '#4ade80' : '#fbbf24', lineHeight: 1, marginBottom: 4 }}>
                {tvkWon ? '✓ WON' : tvkProbPct > 75 ? 'Very likely' : tvkProbPct > 50 ? 'Likely' : 'In contention'}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                {tvkWon
                  ? `TVK secured ${tvk} seats — ${tvk - MAJORITY} above majority`
                  : `TVK needs ${tvkNeedsFromRemaining} of ${remaining} remaining seats`
                }
              </div>
              {!tvkWon && tvkCanWin && (
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 3 }}>
                  Max reachable: {tvkMax} seats
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Party projection rows */}
      <div style={{ padding: '10px 14px' }}>
        <div style={{ fontSize: 8, fontWeight: 800, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.08em', marginBottom: 8 }}>
          {allDone ? 'FINAL RESULTS' : 'CURRENT → MAX POSSIBLE'}
        </div>

        {parties.map(p => {
          const barCurrent = (p.seats / TOTAL) * 100
          const barMax     = allDone ? barCurrent : (p.max / TOTAL) * 100
          const majLine    = (MAJORITY / TOTAL) * 100

          return (
            <div key={p.label} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 900, color: p.color }}>
                  {p.emoji} {p.label}
                </span>
                <div style={{ display: 'flex', align: 'center', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 900, color: p.color }}>{p.seats}</span>
                  {!allDone && (
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>→ max {p.max}</span>
                  )}
                  {p.won && (
                    <span style={{ fontSize: 8, fontWeight: 900, padding: '1px 6px', borderRadius: 99,
                      background: 'rgba(74,222,128,0.15)', color: '#4ade80',
                      border: '1px solid rgba(74,222,128,0.3)' }}>✓ WON</span>
                  )}
                  {!p.won && !p.canWin && !allDone && (
                    <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>cannot win</span>
                  )}
                </div>
              </div>

              {/* Track */}
              <div style={{ height: 10, borderRadius: 99, background: 'rgba(255,255,255,0.04)', position: 'relative', overflow: 'visible' }}>
                {/* Max possible range (lighter) */}
                {!allDone && (
                  <div style={{
                    position: 'absolute', top: 0, bottom: 0, borderRadius: 99,
                    left: `${barCurrent}%`,
                    width: `${Math.max(0, barMax - barCurrent)}%`,
                    background: `${p.color}20`,
                    transition: 'width 1.2s ease',
                  }} />
                )}
                {/* Current seats (solid) */}
                <div style={{
                  position: 'absolute', top: 0, bottom: 0, left: 0, borderRadius: 99,
                  width: `${barCurrent}%`,
                  background: p.won
                    ? p.color
                    : `linear-gradient(90deg, ${p.color}66, ${p.color}cc)`,
                  transition: 'width 1.5s ease',
                }} />
                {/* Majority needle */}
                <div style={{
                  position: 'absolute', top: -3, bottom: -3,
                  left: `${majLine}%`,
                  width: 2, background: '#fbbf24',
                  borderRadius: 1,
                }} />
              </div>

              {/* Majority label under needle */}
              <div style={{ position: 'relative', height: 12, marginTop: 1 }}>
                <span style={{
                  position: 'absolute', left: `${majLine}%`, transform: 'translateX(-50%)',
                  fontSize: 7, color: 'rgba(251,191,36,0.5)', fontWeight: 700, whiteSpace: 'nowrap',
                }}>★{MAJORITY}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom insight */}
      {allDone && tvkWon && (
        <div style={{
          padding: '8px 14px 12px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          fontSize: 10, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5,
        }}>
          ⭐ TVK governs with <strong style={{ color: '#fbbf24' }}>{tvk} seats</strong> — {tvk - MAJORITY} more than majority.
          DMK and ADMK form the opposition with {dmk + admk} combined seats.
        </div>
      )}
    </div>
  )
}
