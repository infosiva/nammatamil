'use client'

/**
 * AIElectionSummary — Fetches from /api/election-results (AI-powered)
 * Shows WON vs LEADING split for each alliance. Live, dynamic, not hardcoded.
 */

import { useState, useEffect } from 'react'

const MAJORITY = 118
const TOTAL    = 234

// Group AIADMK+BJP as ADMK Alliance, Others stays separate
const ALLIANCE_GROUPS: Record<string, { label: string; emoji: string; color: string; sub: string }> = {
  TVK:    { label: 'TVK',          emoji: '⭐', color: '#fbbf24', sub: 'Vijay Alliance' },
  DMK:    { label: 'DMK Alliance', emoji: '🌅', color: '#f87171', sub: 'DMK · INC · CPI · VCK · IUML' },
  AIADMK: { label: 'ADMK Alliance',emoji: '🍃', color: '#4ade80', sub: 'ADMK · PMK · DMDK · BJP' },
  Others: { label: 'Others',        emoji: '🏛️', color: '#94a3b8', sub: 'Independents' },
}

interface PartyResult {
  name: string; seatsWon: number; seatsLeading: number; totalTally: number
  voteShare: number; trend: string; hasMajority: boolean
}

interface ApiResponse {
  phase: string; seatsReported: number; totalSeats: number; majorityMark: number
  parties: PartyResult[]; narrative: string; leader: string
  projectedWinner: string | null; source: string; updatedAt: string
}

export default function AIElectionSummary() {
  const [data, setData]     = useState<ApiResponse | null>(null)
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
    async function load() {
      try {
        const res = await fetch('/api/election-results', { cache: 'no-store' })
        if (res.ok) {
          const json = await res.json() as ApiResponse
          setData(json)
        }
      } catch { /* ignore */ } finally {
        setLoading(false)
      }
    }
    load()
    const iv = setInterval(load, 90_000)
    return () => clearInterval(iv)
  }, [])

  if (!mounted) return null

  // Group AIADMK + BJP together for display
  const alliances = data ? (() => {
    const partyMap: Record<string, { won: number; leading: number }> = {}
    for (const p of (data.parties ?? [])) {
      const key = p.name === 'BJP' ? 'AIADMK' : p.name
      if (!partyMap[key]) partyMap[key] = { won: 0, leading: 0 }
      partyMap[key].won     += p.seatsWon
      partyMap[key].leading += p.seatsLeading
    }
    return Object.entries(ALLIANCE_GROUPS).map(([key, meta]) => ({
      ...meta,
      key,
      won:     partyMap[key]?.won     ?? 0,
      leading: partyMap[key]?.leading ?? 0,
      total:   (partyMap[key]?.won ?? 0) + (partyMap[key]?.leading ?? 0),
    })).filter(a => a.total > 0).sort((a, b) => b.total - a.total)
  })() : []

  const allDone    = data ? data.seatsReported >= TOTAL : false
  const updatedAt  = data ? new Date(data.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''

  return (
    <div style={{
      borderRadius: 16,
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.08)',
      overflow: 'hidden',
      marginBottom: 14,
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(251,191,36,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 14 }}>🤖</span>
          <div>
            <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.07em' }}>
              LIVE TALLY — WON &amp; LEADING
            </span>
            <span style={{
              marginLeft: 7, fontSize: 7, fontWeight: 800, padding: '1px 6px', borderRadius: 99,
              background: 'rgba(251,191,36,0.1)', color: '#fbbf24',
              border: '1px solid rgba(251,191,36,0.2)',
            }}>AI-POWERED</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {loading && !data
            ? <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>Loading…</span>
            : <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>Updated {updatedAt}</span>
          }
          {data?.source && (
            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.15)' }}>
              {data.source === 'eci-live' ? '📡 ECI live' : data.source === 'ai-parsed' ? '🤖 AI parsed' : data.source}
            </div>
          )}
        </div>
      </div>

      {/* AI Narrative */}
      {data?.narrative && (
        <div style={{
          padding: '8px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5,
          fontStyle: 'italic',
        }}>
          {data.narrative}
        </div>
      )}

      {/* Alliance rows with WON / LEADING */}
      <div style={{ padding: '10px 0' }}>
        {alliances.length === 0 && loading && (
          <div style={{ padding: '14px', textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
            Fetching live results…
          </div>
        )}
        {alliances.map(a => {
          const hasMaj    = a.total >= MAJORITY
          const toMaj     = MAJORITY - a.total
          const barTotal  = Math.min(100, (a.total  / TOTAL) * 100)
          const barWon    = Math.min(barTotal, (a.won / TOTAL) * 100)
          const barLead   = barTotal - barWon
          const majPct    = (MAJORITY / TOTAL) * 100

          return (
            <div key={a.key} style={{
              padding: '10px 14px',
              borderBottom: '1px solid rgba(255,255,255,0.03)',
            }}>
              {/* Name + total */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 18 }}>{a.emoji}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 900, color: a.color }}>{a.label}</div>
                    <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>{a.sub}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 26, fontWeight: 900, color: a.color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                    {a.total}
                  </div>
                  {hasMaj && (
                    <div style={{ fontSize: 8, fontWeight: 900, color: '#4ade80' }}>✓ MAJORITY WON</div>
                  )}
                  {!hasMaj && !allDone && (
                    <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>needs {toMaj} more</div>
                  )}
                </div>
              </div>

              {/* WON + LEADING split labels */}
              <div style={{ display: 'flex', gap: 14, marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: a.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>
                    WON: <span style={{ color: a.color }}>{a.won}</span>
                  </span>
                </div>
                {a.leading > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: a.color + '55', border: `1px solid ${a.color}`, flexShrink: 0 }} />
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>
                      LEADING: <span style={{ color: a.color + 'aa' }}>{a.leading}</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Segmented bar: solid WON + striped LEADING */}
              <div style={{ height: 14, borderRadius: 6, background: 'rgba(255,255,255,0.04)', position: 'relative', overflow: 'visible' }}>
                {/* WON (solid) */}
                <div style={{
                  position: 'absolute', top: 0, bottom: 0, left: 0, borderRadius: 6,
                  width: `${barWon}%`,
                  background: hasMaj ? a.color : `linear-gradient(90deg,${a.color}99,${a.color})`,
                  transition: 'width 1.5s ease',
                }} />
                {/* LEADING (striped) */}
                {barLead > 0 && (
                  <div style={{
                    position: 'absolute', top: 0, bottom: 0,
                    left: `${barWon}%`, width: `${barLead}%`,
                    background: `repeating-linear-gradient(45deg,${a.color}44,${a.color}44 3px,${a.color}18 3px,${a.color}18 6px)`,
                    borderRadius: `0 6px 6px 0`,
                    transition: 'width 1.5s ease',
                  }} />
                )}
                {/* Majority needle */}
                <div style={{
                  position: 'absolute', top: -4, bottom: -4,
                  left: `${majPct}%`, width: 2,
                  background: '#fbbf24',
                  boxShadow: '0 0 6px rgba(251,191,36,0.8)',
                  borderRadius: 2, zIndex: 5,
                }} />
              </div>
              {/* Majority label only for first row */}
              {a.key === alliances[0]?.key && (
                <div style={{ position: 'relative', height: 12, marginTop: 1 }}>
                  <span style={{
                    position: 'absolute', left: `${majPct}%`, transform: 'translateX(-50%)',
                    fontSize: 7, color: 'rgba(251,191,36,0.6)', fontWeight: 800, whiteSpace: 'nowrap',
                  }}>★ {MAJORITY} majority</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Counting status footer */}
      <div style={{
        padding: '8px 14px',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontWeight: 700 }}>
          {data ? `${data.seatsReported} / ${data.totalSeats} results out` : 'Fetching…'}
        </span>
        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>
          Solid = WON · Striped = Leading
        </span>
      </div>
    </div>
  )
}
