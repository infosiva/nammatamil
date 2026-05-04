'use client'

/**
 * ElectionTopHero — Full-width animated hero at the very top of the page.
 * Shows a racing bar chart of party seats, live from ECI JSON.
 * Fetches directly from browser (ECI blocks server IPs).
 */

import { useState, useEffect, useRef } from 'react'

const ECI_JSON = 'https://results.eci.gov.in/ResultAcGenMay2026/election-json-S22-live.json'
const MAJORITY = 118
const TOTAL    = 234

const PARTY_ALIASES: Record<string, string> = {
  TVK:'TVK', DMK:'DMK', ADMK:'AIADMK', AIADMK:'AIADMK', BJP:'BJP',
  PMK:'Others', INC:'Others', CPI:'Others', 'CPI(M)':'Others', VCK:'Others', DMDK:'Others',
  IUML:'Others', AMMKMNKZ:'Others', PT:'Others',
}

const PARTY_META: Record<string, { color: string; leader: string; emoji: string }> = {
  TVK:    { color: '#fbbf24', leader: 'Vijay',          emoji: '⭐' },
  AIADMK: { color: '#4ade80', leader: 'Palaniswami',    emoji: '🍃' },
  DMK:    { color: '#f87171', leader: 'M.K. Stalin',    emoji: '🌅' },
  BJP:    { color: '#fb923c', leader: 'Annamalai',      emoji: '🪷' },
  Others: { color: '#94a3b8', leader: '',               emoji: '🏛️' },
}

interface Party { name: string; seats: number; color: string; leader: string; emoji: string }

async function fetchParties(): Promise<Party[] | null> {
  try {
    const res = await fetch(ECI_JSON, { cache: 'no-store', signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    const json = await res.json() as Record<string, { chartData: [string, string, number, string, string][] }>
    const s22 = json['S22']
    if (!s22?.chartData?.length) return null
    const tally: Record<string, number> = {}
    for (const [raw] of s22.chartData) {
      const k = PARTY_ALIASES[raw] ?? 'Others'
      tally[k] = (tally[k] ?? 0) + 1
    }
    return Object.entries(PARTY_META)
      .map(([name, meta]) => ({ name, seats: tally[name] ?? 0, ...meta }))
      .filter(p => p.seats > 0)
      .sort((a, b) => b.seats - a.seats)
  } catch { return null }
}

// Animated count-up number
function AnimNum({ n }: { n: number }) {
  const [v, setV]   = useState(0)
  const prevRef     = useRef(0)
  const rafRef      = useRef<number | null>(null)
  useEffect(() => {
    if (prevRef.current === n) return
    const s0 = prevRef.current, d = n - s0, t0 = performance.now(), dur = 900
    const step = (now: number) => {
      const t = Math.min((now - t0) / dur, 1)
      const e = t < .5 ? 2*t*t : -1+(4-2*t)*t
      setV(Math.round(s0 + d * e))
      if (t < 1) rafRef.current = requestAnimationFrame(step)
      else { setV(n); prevRef.current = n }
    }
    rafRef.current = requestAnimationFrame(step)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [n])
  return <>{v}</>
}

export default function ElectionTopHero() {
  const [parties, setParties] = useState<Party[] | null>(null)
  const [mounted, setMounted] = useState(false)
  const [tick, setTick]       = useState(0)  // for bar animation trigger

  useEffect(() => {
    setMounted(true)
    const load = async () => {
      const data = await fetchParties()
      if (data) { setParties(data); setTick(t => t + 1) }
    }
    load()
    const iv = setInterval(load, 60_000)
    return () => clearInterval(iv)
  }, [])

  const leader = parties?.[0]
  const winner = parties?.find(p => p.seats >= MAJORITY)
  const maxSeats = parties ? Math.max(...parties.map(p => p.seats), 1) : 1

  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(180deg, #1a0000 0%, #0d0010 40%, transparent 100%)',
      borderBottom: '1px solid rgba(239,68,68,0.15)',
    }}>

      {/* ── Animated background grid ── */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04,
        backgroundImage: 'linear-gradient(rgba(251,191,36,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(251,191,36,0.5) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        animation: 'gridDrift 20s linear infinite',
      }} />

      {/* ── Glow orbs ── */}
      {leader && (
        <>
          <div style={{ position: 'absolute', top: -60, left: '10%', width: 300, height: 300, borderRadius: '50%', background: `radial-gradient(circle, ${leader.color}18 0%, transparent 70%)`, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -80, right: '5%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(239,68,68,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        </>
      )}

      {/* ── LIVE ticker strip ── */}
      <div style={{
        background: winner
          ? `linear-gradient(90deg, rgba(74,222,128,0.9), rgba(34,197,94,0.85))`
          : 'rgba(239,68,68,0.88)',
        padding: '5px 0', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 24,
      }}>
        <span style={{
          whiteSpace: 'nowrap', flexShrink: 0, padding: '0 16px',
          fontSize: 10, fontWeight: 900, color: 'white', letterSpacing: '0.12em',
          borderRight: '1px solid rgba(255,255,255,0.3)',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'white', display: 'inline-block', animation: 'dotPulse 1.5s infinite' }} />
          {winner ? 'RESULT' : 'LIVE'}
        </span>
        <div style={{ overflow: 'hidden', flex: 1 }}>
          <div style={{ display: 'flex', gap: 60, animation: 'ticker 32s linear infinite', whiteSpace: 'nowrap' }}>
            {[
              winner
                ? `🏆 ${winner.name} wins Tamil Nadu 2026 with ${winner.seats} seats — Government secured!`
                : `Tamil Nadu Assembly Election 2026 — Results declared across all 234 constituencies`,
              leader ? `${leader.emoji} ${leader.name} leads with ${leader.seats} seats · Majority mark: ${MAJORITY}` : 'Counting complete across 234 seats',
              'TVK vs AIADMK vs DMK — Tamil Nadu historic verdict',
              `Total seats: ${TOTAL} · Majority: ${MAJORITY} seats needed`,
              'Live constituency-by-constituency results below ↓',
              // duplicate for seamless loop
              winner
                ? `🏆 ${winner.name} wins Tamil Nadu 2026 with ${winner.seats} seats — Government secured!`
                : `Tamil Nadu Assembly Election 2026 — Results declared across all 234 constituencies`,
              leader ? `${leader.emoji} ${leader.name} leads with ${leader.seats} seats · Majority mark: ${MAJORITY}` : 'Counting complete across 234 seats',
              'TVK vs AIADMK vs DMK — Tamil Nadu historic verdict',
              `Total seats: ${TOTAL} · Majority: ${MAJORITY} seats needed`,
              'Live constituency-by-constituency results below ↓',
            ].map((t, i) => (
              <span key={i} style={{ fontSize: 10, color: 'white', fontWeight: 700, opacity: 0.95 }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Hero content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ paddingTop: 20, paddingBottom: 20 }}>

        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              {winner ? (
                <span style={{ fontSize: 9, fontWeight: 900, padding: '2px 8px', borderRadius: 99, background: 'rgba(74,222,128,0.15)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)', letterSpacing: '0.1em' }}>
                  ✓ RESULT DECLARED
                </span>
              ) : (
                <span style={{ fontSize: 9, fontWeight: 900, padding: '2px 8px', borderRadius: 99, background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'dotPulse 1.5s infinite' }} />
                  LIVE COUNTING
                </span>
              )}
            </div>
            <h1 style={{ fontSize: 'clamp(18px,4vw,28px)', fontWeight: 900, color: 'rgba(255,255,255,0.92)', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              TN Election 2026 — Live Results
            </h1>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
              Tamil Nadu Assembly Elections · 234 Constituencies · May 4, 2026
            </p>
          </div>

          {/* Big winner badge */}
          {winner && (
            <div style={{
              padding: '10px 18px', borderRadius: 14, flexShrink: 0,
              background: `linear-gradient(135deg, ${winner.color}22, ${winner.color}08)`,
              border: `1px solid ${winner.color}44`,
              textAlign: 'center', animation: 'heroGlow 2.5s ease-in-out infinite',
            }}>
              <div style={{ fontSize: 22 }}>{winner.emoji}</div>
              <div style={{ fontSize: 11, fontWeight: 900, color: winner.color, letterSpacing: '0.05em' }}>{winner.name}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>wins TN 2026</div>
            </div>
          )}
        </div>

        {/* ── Racing bar chart ── */}
        {mounted && parties && parties.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {parties.map((p, rank) => {
              const barPct   = (p.seats / TOTAL) * 100
              const majPct   = (MAJORITY / TOTAL) * 100
              const hasMaj   = p.seats >= MAJORITY
              const isLeader = rank === 0

              return (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {/* Rank */}
                  <span style={{ fontSize: 10, fontWeight: 900, color: isLeader ? p.color : 'rgba(255,255,255,0.2)', minWidth: 14, textAlign: 'right', flexShrink: 0 }}>
                    {rank + 1}
                  </span>

                  {/* Party label */}
                  <div style={{ minWidth: 52, flexShrink: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 900, color: isLeader ? p.color : 'rgba(255,255,255,0.75)', lineHeight: 1 }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.22)', marginTop: 1 }}>{p.leader}</div>
                  </div>

                  {/* Bar track */}
                  <div style={{ flex: 1, position: 'relative', height: isLeader ? 28 : 20, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'visible' }}>
                    {/* Majority marker */}
                    <div style={{
                      position: 'absolute', top: -4, bottom: -4, left: `${majPct}%`,
                      width: 2, background: '#fbbf2488', zIndex: 3,
                      boxShadow: '0 0 6px rgba(251,191,36,0.6)',
                    }} />
                    {/* Bar fill */}
                    <div style={{
                      position: 'absolute', top: 0, left: 0, bottom: 0,
                      width: `${barPct}%`,
                      borderRadius: 99, zIndex: 2,
                      background: hasMaj
                        ? `linear-gradient(90deg, ${p.color}cc, ${p.color})`
                        : isLeader
                        ? `linear-gradient(90deg, ${p.color}88, ${p.color}cc)`
                        : `${p.color}55`,
                      boxShadow: isLeader ? `0 0 12px ${p.color}55` : 'none',
                      transition: `width 1.4s cubic-bezier(.34,1.56,.64,1)`,
                      animation: hasMaj ? `barPulse 2s ease-in-out infinite` : 'none',
                    }} />
                    {/* Seat label inside bar */}
                    {barPct > 12 && (
                      <span style={{
                        position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                        fontSize: isLeader ? 12 : 10, fontWeight: 900,
                        color: 'rgba(0,0,0,0.75)', zIndex: 4, lineHeight: 1,
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        <AnimNum n={p.seats} />
                      </span>
                    )}
                  </div>

                  {/* Seat count outside bar */}
                  <div style={{ minWidth: 36, textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ fontSize: isLeader ? 18 : 14, fontWeight: 900, color: isLeader ? p.color : 'rgba(255,255,255,0.6)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                      <AnimNum n={p.seats} />
                    </span>
                    {hasMaj && <span style={{ fontSize: 8, color: '#4ade80', display: 'block', lineHeight: 1, marginTop: 1 }}>✓ maj</span>}
                  </div>
                </div>
              )
            })}

            {/* Majority line label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, paddingLeft: 76 }}>
              <div style={{ flex: 1, position: 'relative', height: 1 }}>
                <div style={{ position: 'absolute', left: `${(MAJORITY / TOTAL) * 100}%`, transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 1, height: 8, background: '#fbbf2488' }} />
                  <span style={{ fontSize: 8, color: 'rgba(251,191,36,0.5)', whiteSpace: 'nowrap', fontWeight: 700 }}>118 majority</span>
                </div>
              </div>
              <div style={{ minWidth: 36 }} />
            </div>
          </div>
        ) : (
          /* Loading skeleton */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[80, 55, 40, 20, 15].map((w, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 14, height: 10, borderRadius: 4, background: 'rgba(255,255,255,0.05)' }} />
                <div style={{ width: 52, height: 20, borderRadius: 6, background: 'rgba(255,255,255,0.05)', animation: 'heroShimmer 1.6s ease-in-out infinite', animationDelay: `${i * 0.15}s` }} />
                <div style={{ flex: 1, height: i === 0 ? 28 : 20, borderRadius: 99, background: 'rgba(255,255,255,0.05)', animation: 'heroShimmer 1.6s ease-in-out infinite', animationDelay: `${i * 0.15}s` }} />
                <div style={{ width: 36, height: 20, borderRadius: 6, background: 'rgba(255,255,255,0.05)' }} />
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes ticker       { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes dotPulse     { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.4)} }
        @keyframes gridDrift    { 0%{background-position:0 0} 100%{background-position:40px 40px} }
        @keyframes heroGlow     { 0%,100%{box-shadow:0 0 20px rgba(251,191,36,.1)} 50%{box-shadow:0 0 40px rgba(251,191,36,.3)} }
        @keyframes barPulse     { 0%,100%{opacity:1} 50%{opacity:.85} }
        @keyframes heroShimmer  { 0%,100%{opacity:0.4} 50%{opacity:0.8} }
      `}</style>
    </div>
  )
}
