'use client'

/**
 * ElectionScoreboard — Bold top-of-page scoreboard.
 * Shows: seats counted / remaining, who has majority, all party tallies.
 * Designed to be the first thing a user sees — like a cricket scorecard.
 */

import { useState, useEffect, useRef } from 'react'

const ECI_JSON = 'https://results.eci.gov.in/ResultAcGenMay2026/election-json-S22-live.json'
const MAJORITY = 118
const TOTAL    = 234

const PARTY_ALIASES: Record<string, string> = {
  TVK:'TVK', DMK:'DMK', ADMK:'AIADMK', AIADMK:'AIADMK', BJP:'BJP',
  PMK:'Others', INC:'Others', CPI:'Others', 'CPI(M)':'Others', VCK:'Others',
  DMDK:'Others', IUML:'Others', AMMKMNKZ:'Others', PT:'Others',
}

const PARTY_META: Record<string, { color: string; leader: string; emoji: string; shortName: string }> = {
  TVK:    { color: '#fbbf24', leader: 'Thalapathy Vijay',  emoji: '⭐', shortName: 'TVK'  },
  AIADMK: { color: '#4ade80', leader: 'E. Palaniswami',    emoji: '🍃', shortName: 'ADMK' },
  DMK:    { color: '#f87171', leader: 'M.K. Stalin',       emoji: '🌅', shortName: 'DMK'  },
  BJP:    { color: '#fb923c', leader: 'K. Annamalai',      emoji: '🪷', shortName: 'BJP'  },
  Others: { color: '#94a3b8', leader: '',                   emoji: '🏛️', shortName: 'Others' },
}

interface Party { name: string; seats: number; color: string; leader: string; emoji: string; shortName: string }
interface Score  { parties: Party[]; declared: number; remaining: number; winner: Party | null }

async function fetchScore(): Promise<Score | null> {
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

    const parties: Party[] = Object.entries(PARTY_META)
      .map(([name, meta]) => ({ name, seats: tally[name] ?? 0, ...meta }))
      .filter(p => p.seats > 0)
      .sort((a, b) => b.seats - a.seats)

    const declared  = s22.chartData.length
    const remaining = TOTAL - declared
    const winner    = parties.find(p => p.seats >= MAJORITY) ?? null

    return { parties, declared, remaining, winner }
  } catch { return null }
}

function AnimNum({ n, big }: { n: number; big?: boolean }) {
  const [v, setV] = useState(0)
  const prev = useRef(0)
  const raf  = useRef<number | null>(null)
  useEffect(() => {
    if (prev.current === n) return
    if (raf.current) cancelAnimationFrame(raf.current)
    const s0 = prev.current, d = n - s0, t0 = performance.now(), dur = big ? 1200 : 700
    const step = (t: number) => {
      const p = Math.min((t - t0) / dur, 1)
      const e = p < .5 ? 2*p*p : -1+(4-2*p)*p
      setV(Math.round(s0 + d * e))
      if (p < 1) raf.current = requestAnimationFrame(step)
      else { setV(n); prev.current = n }
    }
    raf.current = requestAnimationFrame(step)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [n, big])
  return <>{v}</>
}

export default function ElectionScoreboard() {
  const [score, setScore]   = useState<Score | null>(null)
  const [mounted, setMounted] = useState(false)
  const [pulse, setPulse]   = useState(false)

  useEffect(() => {
    setMounted(true)
    const load = async () => {
      const s = await fetchScore()
      if (s) { setScore(s); setPulse(true); setTimeout(() => setPulse(false), 600) }
    }
    load()
    const iv = setInterval(load, 60_000)
    return () => clearInterval(iv)
  }, [])

  if (!mounted || !score) {
    // Skeleton
    return (
      <div style={{ background: 'linear-gradient(180deg,#1a0005 0%,#0a000f 100%)', padding: '0 0 4px' }}>
        {/* ticker skeleton */}
        <div style={{ height: 28, background: 'rgba(239,68,68,0.8)', display: 'flex', alignItems: 'center', paddingLeft: 16 }}>
          <div style={{ width: 200, height: 10, borderRadius: 4, background: 'rgba(255,255,255,0.3)', animation: 'sbShimmer 1.4s infinite' }} />
        </div>
        <div className="max-w-7xl mx-auto px-4" style={{ paddingTop: 16, paddingBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: 8 }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ height: 80, borderRadius: 14, background: 'rgba(255,255,255,0.04)', animation: 'sbShimmer 1.4s infinite', animationDelay: `${i*0.1}s` }} />
            ))}
          </div>
        </div>
        <style>{`@keyframes sbShimmer{0%,100%{opacity:0.5}50%{opacity:1}}`}</style>
      </div>
    )
  }

  const { parties, declared, remaining, winner } = score
  const leader = parties[0]
  const countPct = Math.round((declared / TOTAL) * 100)
  const allDone  = remaining === 0

  return (
    <div style={{
      background: winner
        ? `linear-gradient(180deg, ${winner.color}18 0%, #0a000f 70%)`
        : 'linear-gradient(180deg,#1a0005 0%,#0a000f 100%)',
      transition: 'background 1s ease',
    }}>

      {/* ── TOP TICKER ── */}
      <div style={{
        background: winner ? `linear-gradient(90deg,${winner.color}dd,${winner.color}99)` : 'rgba(239,68,68,0.88)',
        padding: '6px 0', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 20,
        transition: 'background 0.8s ease',
      }}>
        <span style={{
          whiteSpace: 'nowrap', flexShrink: 0, padding: '0 14px',
          fontSize: 10, fontWeight: 900, color: winner ? '#000' : 'white', letterSpacing: '0.12em',
          borderRight: `1px solid ${winner ? '#00000040' : 'rgba(255,255,255,0.3)'}`,
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: winner ? '#000' : 'white', display: 'inline-block', animation: 'sbDot 1.5s infinite' }} />
          {winner ? 'RESULT' : 'LIVE'}
        </span>
        <div style={{ overflow: 'hidden', flex: 1 }}>
          <div style={{ display: 'flex', gap: 64, animation: 'sbTicker 30s linear infinite', whiteSpace: 'nowrap' }}>
            {[
              winner ? `🏆 ${winner.name} WINS Tamil Nadu 2026 — ${winner.seats} seats · Government secured` : `🗳️ TN Election 2026 · Results declared across all ${declared} constituencies`,
              `${leader.emoji} ${leader.name} leads with ${leader.seats} seats · Majority mark: ${MAJORITY}`,
              allDone ? 'All 234 constituencies have declared results' : `${remaining} seats still counting`,
              'Tamil Nadu 2026 — TVK debut · DMK vs AIADMK verdict',
              winner ? `🏆 ${winner.name} WINS Tamil Nadu 2026 — ${winner.seats} seats · Government secured` : `🗳️ TN Election 2026 · Results declared across all ${declared} constituencies`,
              `${leader.emoji} ${leader.name} leads with ${leader.seats} seats · Majority mark: ${MAJORITY}`,
              allDone ? 'All 234 constituencies have declared results' : `${remaining} seats still counting`,
              'Tamil Nadu 2026 — TVK debut · DMK vs AIADMK verdict',
            ].map((t, i) => (
              <span key={i} style={{ fontSize: 10, color: winner ? '#000' : 'white', fontWeight: 700, opacity: 0.95 }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN SCOREBOARD ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ paddingTop: 18, paddingBottom: 14 }}>

        {/* Title + counts row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 'clamp(15px,3.5vw,22px)', fontWeight: 900, color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
              TN Election 2026 — Live Results
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', marginTop: 3 }}>
              Tamil Nadu Assembly Elections · 234 Constituencies · May 4, 2026
            </div>
          </div>

          {/* Counted / Remaining badges */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <div style={{
              textAlign: 'center', padding: '8px 14px', borderRadius: 12,
              background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.28)',
            }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#4ade80', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                <AnimNum n={declared} big />
              </div>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', marginTop: 2, fontWeight: 700 }}>✓ DECLARED</div>
            </div>
            <div style={{
              textAlign: 'center', padding: '8px 14px', borderRadius: 12,
              background: remaining === 0 ? 'rgba(74,222,128,0.07)' : 'rgba(239,68,68,0.1)',
              border: remaining === 0 ? '1px solid rgba(74,222,128,0.2)' : '1px solid rgba(239,68,68,0.25)',
            }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: remaining === 0 ? '#4ade80' : '#ef4444', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                <AnimNum n={remaining} big />
              </div>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', marginTop: 2, fontWeight: 700 }}>
                {remaining === 0 ? '🎉 ALL DONE' : '⏳ REMAINING'}
              </div>
            </div>
          </div>
        </div>

        {/* ── WINNER BANNER ── */}
        {winner && (
          <div style={{
            borderRadius: 16, padding: '14px 18px', marginBottom: 14,
            background: `linear-gradient(135deg,${winner.color}20 0%,${winner.color}08 100%)`,
            border: `1.5px solid ${winner.color}50`,
            boxShadow: `0 0 32px ${winner.color}18`,
            display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
            animation: 'sbWin 3s ease-in-out infinite',
          }}>
            <span style={{ fontSize: 36 }}>🏆</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 9, fontWeight: 900, color: winner.color, letterSpacing: '0.12em', marginBottom: 3 }}>
                MAJORITY SECURED — TAMIL NADU 2026 WINNER
              </div>
              <div style={{ fontSize: 'clamp(18px,4vw,26px)', fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>
                {winner.name} · {winner.leader}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>
                {winner.seats} seats · {winner.seats - MAJORITY} above the {MAJORITY}-seat majority mark
              </div>
            </div>
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: 'clamp(40px,10vw,60px)', fontWeight: 900, color: winner.color, lineHeight: 1, fontVariantNumeric: 'tabular-nums', animation: pulse ? 'sbPulseNum 0.4s ease' : 'none' }}>
                <AnimNum n={winner.seats} big />
              </div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)' }}>of {TOTAL} seats</div>
            </div>
          </div>
        )}

        {/* ── PARTY SCORE CARDS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 8, marginBottom: 14 }}>
          {parties.map((p, rank) => {
            const hasMaj   = p.seats >= MAJORITY
            const pctOfMaj = Math.min(100, Math.round((p.seats / MAJORITY) * 100))
            const isLeader = rank === 0

            return (
              <div key={p.name} style={{
                borderRadius: 14, padding: '12px 14px',
                background: hasMaj ? `${p.color}16` : isLeader ? `${p.color}0d` : 'rgba(255,255,255,0.025)',
                border: hasMaj ? `1.5px solid ${p.color}50` : isLeader ? `1px solid ${p.color}30` : '1px solid rgba(255,255,255,0.07)',
                boxShadow: hasMaj ? `0 0 20px ${p.color}22` : 'none',
                animation: hasMaj ? 'sbWin 3s ease-in-out infinite' : 'none',
              }}>
                {/* Party header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 16 }}>{p.emoji}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 900, color: p.color, lineHeight: 1 }}>{p.shortName}</div>
                      <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.22)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 80 }}>{p.leader}</div>
                    </div>
                  </div>
                  {hasMaj && (
                    <span style={{ fontSize: 7, fontWeight: 900, padding: '2px 6px', borderRadius: 99, background: 'rgba(74,222,128,0.15)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)', whiteSpace: 'nowrap' }}>
                      ✓ WON
                    </span>
                  )}
                  {isLeader && !hasMaj && (
                    <span style={{ fontSize: 7, fontWeight: 900, padding: '2px 6px', borderRadius: 99, background: `${p.color}18`, color: p.color, border: `1px solid ${p.color}30`, whiteSpace: 'nowrap' }}>
                      LEADS
                    </span>
                  )}
                </div>

                {/* BIG seat number */}
                <div style={{ fontSize: 'clamp(32px,7vw,44px)', fontWeight: 900, color: p.color, lineHeight: 1, fontVariantNumeric: 'tabular-nums', marginBottom: 8 }}>
                  <AnimNum n={p.seats} big />
                </div>

                {/* Progress to majority */}
                <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', marginBottom: 4 }}>
                  <div style={{
                    height: '100%', borderRadius: 99,
                    width: `${pctOfMaj}%`,
                    background: hasMaj ? 'linear-gradient(90deg,#4ade80,#22c55e)' : `linear-gradient(90deg,${p.color}88,${p.color})`,
                    transition: 'width 1.2s cubic-bezier(.34,1.56,.64,1)',
                    boxShadow: `0 0 6px ${p.color}55`,
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.2)' }}>
                    {hasMaj ? `+${p.seats - MAJORITY} above majority` : `needs ${MAJORITY - p.seats} more`}
                  </span>
                  <span style={{ fontSize: 7, color: `${p.color}88`, fontWeight: 700 }}>{pctOfMaj}% to {MAJORITY}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── SEAT BAR CHART ── bold horizontal visual, majority marker ── */}
        <div style={{
          borderRadius: 16, padding: '14px 16px',
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {!allDone && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'sbDot 1.5s infinite' }} />}
              <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em' }}>
                {allDone ? '✓ ALL SEATS DECLARED' : 'SEAT COUNT — LIVE'}
              </span>
            </div>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', fontWeight: 700 }}>
              {declared}/{TOTAL} counted · {countPct}%
            </span>
          </div>

          {/* ── MAIN FAT BAR ── */}
          <div style={{ position: 'relative', marginBottom: 6 }}>
            {/* Bar itself */}
            <div style={{ height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.04)', overflow: 'hidden', display: 'flex' }}>
              {parties.map(p => {
                const pct = (p.seats / TOTAL) * 100
                return (
                  <div key={p.name} style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: `linear-gradient(90deg,${p.color}bb,${p.color})`,
                    transition: 'width 1.4s cubic-bezier(.34,1.56,.64,1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                    position: 'relative',
                  }}>
                    {/* Show seat count label inside segment if wide enough */}
                    {pct > 8 && (
                      <span style={{ fontSize: 12, fontWeight: 900, color: '#000', opacity: 0.7, whiteSpace: 'nowrap' }}>
                        {p.seats}
                      </span>
                    )}
                  </div>
                )
              })}
              {/* Uncounted grey portion */}
              {remaining > 0 && (
                <div style={{ height: '100%', flex: 1, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', paddingLeft: 8 }}>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.18)', fontWeight: 700 }}>
                    {remaining} left
                  </span>
                </div>
              )}
            </div>

            {/* Majority needle */}
            <div style={{
              position: 'absolute', top: -8, bottom: -8,
              left: `${(MAJORITY / TOTAL) * 100}%`,
              width: 2, background: '#fbbf24',
              boxShadow: '0 0 10px rgba(251,191,36,1)',
              zIndex: 10,
            }}>
              {/* Needle top label */}
              <div style={{
                position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)',
                fontSize: 7, fontWeight: 900, color: '#fbbf24', whiteSpace: 'nowrap',
                letterSpacing: '0.04em',
              }}>
                {MAJORITY} ★
              </div>
            </div>
          </div>

          {/* ── PER-PARTY ROWS (compact bar chart) ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 14 }}>
            {parties.map(p => {
              const pct     = (p.seats / TOTAL) * 100
              const toMaj   = MAJORITY - p.seats
              const hasMaj  = p.seats >= MAJORITY
              const nearMaj = !hasMaj && toMaj <= 20 // within 20 seats

              return (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* Party label */}
                  <div style={{ width: 36, textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ fontSize: 10, fontWeight: 900, color: p.color }}>{p.shortName}</span>
                  </div>

                  {/* Bar track */}
                  <div style={{ flex: 1, height: 18, borderRadius: 6, background: 'rgba(255,255,255,0.04)', overflow: 'hidden', position: 'relative' }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: hasMaj
                        ? `linear-gradient(90deg,${p.color}99,${p.color})`
                        : `linear-gradient(90deg,${p.color}66,${p.color}aa)`,
                      borderRadius: 6,
                      transition: 'width 1.4s cubic-bezier(.34,1.56,.64,1)',
                      boxShadow: hasMaj ? `0 0 8px ${p.color}66` : 'none',
                      display: 'flex', alignItems: 'center', paddingLeft: 6,
                    }}>
                      {pct > 5 && (
                        <span style={{ fontSize: 9, fontWeight: 900, color: '#000', opacity: 0.65 }}>{p.seats}</span>
                      )}
                    </div>
                    {/* Majority marker on row */}
                    <div style={{
                      position: 'absolute', top: 0, bottom: 0,
                      left: `${(MAJORITY / TOTAL) * 100}%`,
                      width: 1.5, background: 'rgba(251,191,36,0.6)',
                    }} />
                  </div>

                  {/* Seat count + status */}
                  <div style={{ width: 80, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 900, color: p.color, fontVariantNumeric: 'tabular-nums', minWidth: 28 }}>
                      <AnimNum n={p.seats} />
                    </span>
                    {hasMaj && (
                      <span style={{ fontSize: 7, fontWeight: 900, color: '#4ade80', background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 99, padding: '1px 5px', whiteSpace: 'nowrap' }}>
                        ✓ WON
                      </span>
                    )}
                    {nearMaj && !hasMaj && (
                      <span style={{ fontSize: 7, fontWeight: 900, color: '#fbbf24', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 99, padding: '1px 5px', whiteSpace: 'nowrap', animation: 'sbDot 1.5s infinite' }}>
                        -{toMaj}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, flexWrap: 'wrap', gap: 4 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {parties.map(p => (
                <span key={p.name} style={{ fontSize: 8, color: p.color, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: p.color, display: 'inline-block' }} />
                  {p.emoji} {p.shortName}
                </span>
              ))}
              {remaining > 0 && (
                <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: 'rgba(255,255,255,0.08)', display: 'inline-block' }} />
                  Not declared
                </span>
              )}
            </div>
            <span style={{ fontSize: 8, color: 'rgba(251,191,36,0.7)', fontWeight: 700 }}>
              ★ {MAJORITY} majority mark
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes sbTicker  { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes sbDot     { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.3;transform:scale(1.5)} }
        @keyframes sbWin     { 0%,100%{box-shadow:0 0 20px rgba(251,191,36,.1)} 50%{box-shadow:0 0 40px rgba(251,191,36,.3)} }
        @keyframes sbShimmer { 0%,100%{opacity:0.5} 50%{opacity:1} }
        @keyframes sbPulseNum{ 0%{transform:scale(1)} 50%{transform:scale(1.08)} 100%{transform:scale(1)} }
      `}</style>
    </div>
  )
}
