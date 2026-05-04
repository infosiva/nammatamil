'use client'

/**
 * ElectionAnimatedStats
 *
 * Two animated panels:
 * 1. 3D rotating tally cube  — ECI-style Party | Lead | Won table
 *    that auto-flips between summary view and per-status breakdown
 * 2. Vote Race Bar — animated horizontal race showing how fast each
 *    party is accumulating leads (who's quicker)
 */

import { useState, useEffect, useCallback } from 'react'

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
  parties: PartyResult[]
  narrative: string
  updatedAt: string
}

const REFRESH_MS = 90 * 1000

// ── 3D Rotating Tally Table ───────────────────────────────────────────────────
function TallyCube({ parties, phase }: { parties: PartyResult[]; phase: string }) {
  const [face, setFace] = useState(0)  // 0=front (summary), 1=back (detailed)
  const [flipping, setFlipping] = useState(false)

  useEffect(() => {
    const id = setInterval(() => {
      setFlipping(true)
      setTimeout(() => {
        setFace(f => (f + 1) % 2)
        setFlipping(false)
      }, 400)
    }, 4000)
    return () => clearInterval(id)
  }, [])

  const top5 = parties.slice(0, 5)
  const isLive = phase === 'counting' || phase === 'declared'

  return (
    <div style={{ perspective: '800px', width: '100%' }}>
      <div style={{
        position: 'relative',
        transformStyle: 'preserve-3d',
        transition: flipping ? 'transform 0.4s ease-in-out' : 'none',
        transform: flipping ? 'rotateY(90deg)' : 'rotateY(0deg)',
        borderRadius: 16,
        overflow: 'hidden',
        background: 'rgba(0,80,70,0.15)',
        border: '1px solid rgba(0,200,150,0.25)',
      }}>
        {/* Table header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 60px 60px 60px',
          padding: '10px 14px',
          background: 'rgba(0,120,100,0.3)',
          borderBottom: '1px solid rgba(0,200,150,0.2)',
          gap: 4,
        }}>
          <span style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Party</span>
          <span style={{ fontSize: 10, fontWeight: 900, color: '#fbbf24', textAlign: 'center', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Lead</span>
          <span style={{ fontSize: 10, fontWeight: 900, color: '#4ade80', textAlign: 'center', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Won</span>
          <span style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.4)', textAlign: 'center', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Total</span>
        </div>

        {/* Table rows */}
        {top5.map((p, i) => (
          <div
            key={p.name}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 60px 60px 60px',
              padding: '9px 14px',
              gap: 4,
              background: p.isLeading
                ? `${p.color}12`
                : i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              animation: face === 1 ? `slideIn 0.3s ease ${i * 0.06}s both` : 'none',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block', flexShrink: 0, boxShadow: `0 0 6px ${p.color}80` }} />
              <span style={{ fontWeight: 800, fontSize: 12, color: p.isLeading ? p.color : 'rgba(255,255,255,0.75)' }}>{p.name}</span>
              {p.isLeading && (
                <span style={{ fontSize: 7, fontWeight: 900, padding: '1px 5px', borderRadius: 99, background: `${p.color}22`, color: p.color, border: `1px solid ${p.color}40` }}>▲</span>
              )}
            </div>
            <span style={{ fontSize: 14, fontWeight: 900, color: '#fbbf24', textAlign: 'center', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
              {isLive ? p.seatsLeading : '—'}
            </span>
            <span style={{ fontSize: 14, fontWeight: 900, color: '#4ade80', textAlign: 'center', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
              {isLive ? p.seatsWon : '—'}
            </span>
            <span style={{ fontSize: 13, fontWeight: 900, color: p.color, textAlign: 'center', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
              {p.totalTally}
            </span>
          </div>
        ))}

        {/* Footer */}
        <div style={{
          padding: '7px 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(255,255,255,0.02)',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>
            {isLive ? 'Live ECI data' : 'Exit poll projections'}
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            {[0, 1].map(i => (
              <span key={i} style={{ width: 14, height: 4, borderRadius: 99, background: face === i ? 'rgba(251,191,36,0.8)' : 'rgba(255,255,255,0.1)' }} />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}

// ── Vote Race Bar ─────────────────────────────────────────────────────────────
function VoteRace({ parties, seatsReported }: { parties: PartyResult[]; seatsReported: number }) {
  const [animPct, setAnimPct] = useState<Record<string, number>>({})
  const [tick, setTick] = useState(0)

  const maxTally = Math.max(...parties.map(p => p.totalTally), 1)

  // Animate bars on mount and data change
  useEffect(() => {
    setAnimPct({})
    const timeout = setTimeout(() => {
      const pcts: Record<string, number> = {}
      for (const p of parties) pcts[p.name] = (p.totalTally / Math.max(maxTally, 1)) * 100
      setAnimPct(pcts)
    }, 100)
    return () => clearTimeout(timeout)
  }, [parties.map(p => p.totalTally).join(',')]) // eslint-disable-line react-hooks/exhaustive-deps

  // Pulse tick for live feel
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 2000)
    return () => clearInterval(id)
  }, [])

  // Speed indicator: seats / time ≈ synthetic "rate"
  const rates: Record<string, number> = {}
  if (seatsReported > 0) {
    for (const p of parties) rates[p.name] = p.totalTally / seatsReported
  }
  const maxRate = Math.max(...Object.values(rates), 0.01)

  void tick  // drives re-render for pulse

  return (
    <div style={{
      borderRadius: 16,
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.08)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '11px 16px',
        background: 'rgba(255,255,255,0.03)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14 }}>🏁</span>
          <span style={{ fontWeight: 900, fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>Vote Race</span>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>— who's quicker</span>
        </div>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontVariantNumeric: 'tabular-nums' }}>
          {seatsReported} seats reported
        </span>
      </div>

      {/* Race bars */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {parties.filter(p => p.totalTally > 0 || p.name !== 'Others').map((p, i) => {
          const pct     = animPct[p.name] ?? 0
          const rate    = rates[p.name] ?? 0
          const relRate = maxRate > 0 ? (rate / maxRate) * 100 : 0
          const speed   = relRate > 80 ? 'fast' : relRate > 50 ? 'steady' : 'slow'
          const speedColor = speed === 'fast' ? '#4ade80' : speed === 'steady' ? '#fbbf24' : '#94a3b8'

          return (
            <div key={p.name} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {/* Label row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 900, fontSize: 12, color: p.color }}>{p.name}</span>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>{p.leader}</span>
                  {seatsReported > 0 && (
                    <span style={{
                      fontSize: 8, fontWeight: 800, padding: '1px 6px', borderRadius: 99,
                      background: `${speedColor}18`, color: speedColor,
                      border: `1px solid ${speedColor}35`,
                      display: 'flex', alignItems: 'center', gap: 3,
                    }}>
                      {speed === 'fast' ? '⚡' : speed === 'steady' ? '→' : '·'} {speed}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 900, fontSize: 14, color: p.isLeading ? p.color : 'rgba(255,255,255,0.55)', fontVariantNumeric: 'tabular-nums' }}>
                    {p.totalTally}
                  </span>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>seats</span>
                </div>
              </div>

              {/* Race bar */}
              <div style={{ position: 'relative', height: 20, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                {/* Bar fill */}
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0,
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${p.color}60, ${p.color})`,
                  borderRadius: 99,
                  transition: 'width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  boxShadow: p.isLeading ? `0 0 12px ${p.color}60` : 'none',
                }} />

                {/* Animated leading edge pulse (only for leading party) */}
                {p.isLeading && pct > 5 && (
                  <div style={{
                    position: 'absolute', top: 0, bottom: 0,
                    left: `calc(${pct}% - 6px)`,
                    width: 12,
                    background: `radial-gradient(circle, ${p.color}ff 0%, transparent 70%)`,
                    animation: 'racePulse 1.5s ease-in-out infinite',
                    borderRadius: '50%',
                  }} />
                )}

                {/* Majority mark at 118/234 */}
                <div style={{
                  position: 'absolute', top: 0, bottom: 0,
                  left: `${(118 / Math.max(maxTally, 234)) * 100}%`,
                  width: 1.5,
                  background: 'rgba(251,191,36,0.6)',
                  boxShadow: '0 0 4px rgba(251,191,36,0.4)',
                }} />

                {/* Seat tally text inside bar */}
                {pct > 15 && (
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', paddingLeft: 12,
                    fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.7)',
                  }}>
                    {p.seatsWon > 0 && <span style={{ color: '#4ade80' }}>{p.seatsWon}W&nbsp;</span>}
                    {p.seatsLeading > 0 && <span style={{ color: '#fbbf24' }}>{p.seatsLeading}L</span>}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* Majority legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 2 }}>
          <div style={{ width: 1.5, height: 12, background: 'rgba(251,191,36,0.6)', boxShadow: '0 0 4px rgba(251,191,36,0.4)' }} />
          <span style={{ fontSize: 9, color: 'rgba(251,191,36,0.5)', fontWeight: 700 }}>118 seats = majority</span>
          <span style={{ marginLeft: 'auto', fontSize: 9, color: 'rgba(255,255,255,0.15)' }}>
            🏁 = declared · ⚡ = fastest gaining
          </span>
        </div>
      </div>

      <style>{`
        @keyframes racePulse {
          0%, 100% { opacity: 1; transform: scaleX(1); }
          50%       { opacity: 0.4; transform: scaleX(2); }
        }
      `}</style>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function ElectionAnimatedStats() {
  const [data, setData] = useState<ElectionData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/election-results', { cache: 'no-store', signal: AbortSignal.timeout(10000) })
      if (!res.ok) return
      const d = await res.json()
      setData(d)
    } catch { /* keep prev */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, REFRESH_MS)
    return () => clearInterval(id)
  }, [fetchData])

  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {[0, 1].map(i => (
          <div key={i} style={{ height: 240, borderRadius: 16, background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
        ))}
        <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
      </div>
    )
  }

  if (!data) return null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
      {/* 3D Rotating Tally Table */}
      <TallyCube parties={data.parties} phase={data.phase} />

      {/* Vote Race */}
      <VoteRace parties={data.parties} seatsReported={data.seatsReported} />
    </div>
  )
}
