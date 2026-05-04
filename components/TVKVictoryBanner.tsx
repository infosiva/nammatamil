'use client'

/**
 * TVKVictoryBanner — Bold hero banner showing:
 * - TVK WON + seat count + how many ABOVE majority
 * - Alliance totals: TVK | DMK alliance | ADMK alliance
 * - All 234 declared / counting progress
 * Fetches live from ECI, updates every 60s.
 */

import { useState, useEffect, useRef } from 'react'

const ECI_JSON = 'https://results.eci.gov.in/ResultAcGenMay2026/election-json-S22-live.json'
const MAJORITY = 118
const TOTAL    = 234

const ALIAS: Record<string, string> = {
  TVK:'TVK',
  DMK:'DMK', INC:'DMK', CPI:'DMK', 'CPI(M)':'DMK', VCK:'DMK', IUML:'DMK', MDMK:'DMK',
  ADMK:'ADMK', AIADMK:'ADMK', PMK:'ADMK', DMDK:'ADMK', PT:'ADMK',
  BJP:'BJP', AMMKMNKZ:'Others',
}

interface Tally { tvk: number; dmk: number; admk: number; bjp: number; others: number; declared: number }

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
    return {
      tvk: t['TVK'] ?? 0,
      dmk: t['DMK'] ?? 0,
      admk: t['ADMK'] ?? 0,
      bjp: t['BJP'] ?? 0,
      others: t['Others'] ?? 0,
      declared: rows.length,
    }
  } catch { return null }
}

function useCountUp(target: number, duration = 1200) {
  const [val, setVal] = useState(0)
  const prev = useRef(0)
  const raf  = useRef<number | null>(null)
  useEffect(() => {
    if (prev.current === target) return
    if (raf.current) cancelAnimationFrame(raf.current)
    const s0 = prev.current, d = target - s0, t0 = performance.now()
    const step = (t: number) => {
      const p = Math.min((t - t0) / duration, 1)
      const e = p < .5 ? 2*p*p : -1+(4-2*p)*p
      setVal(Math.round(s0 + d * e))
      if (p < 1) raf.current = requestAnimationFrame(step)
      else { setVal(target); prev.current = target }
    }
    raf.current = requestAnimationFrame(step)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [target, duration])
  return val
}

function BigNum({ n, color }: { n: number; color: string }) {
  const v = useCountUp(n, 1400)
  return <span style={{ color, fontVariantNumeric: 'tabular-nums' }}>{v}</span>
}

export default function TVKVictoryBanner() {
  const [tally, setTally] = useState<Tally | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchTally().then(setTally)
    const iv = setInterval(() => fetchTally().then(setTally), 60_000)
    return () => clearInterval(iv)
  }, [])

  if (!mounted || !tally) return null

  const { tvk, dmk, admk, bjp, others, declared } = tally
  const remaining  = TOTAL - declared
  const allDone    = remaining === 0
  const tvkAbove   = tvk - MAJORITY          // seats above majority
  const tvkWon     = tvk >= MAJORITY
  const dmkAlliance  = dmk   // DMK+INC+CPI+VCK+IUML already merged via ALIAS
  const admkAlliance = admk  // ADMK+PMK+DMDK already merged

  const countPct = Math.round((declared / TOTAL) * 100)

  return (
    <div style={{
      borderRadius: 20, overflow: 'hidden',
      background: tvkWon
        ? 'linear-gradient(135deg, rgba(251,191,36,0.12) 0%, rgba(0,0,0,0) 60%)'
        : 'rgba(255,255,255,0.02)',
      border: tvkWon ? '1.5px solid rgba(251,191,36,0.25)' : '1px solid rgba(255,255,255,0.08)',
      marginBottom: 14,
    }}>

      {/* ── TOP STRIPE: counting status ── */}
      <div style={{
        background: allDone ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.08)',
        borderBottom: `1px solid ${allDone ? 'rgba(74,222,128,0.15)' : 'rgba(239,68,68,0.12)'}`,
        padding: '6px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {!allDone && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'tvkPulse 1.5s infinite' }} />}
          <span style={{ fontSize: 9, fontWeight: 800, color: allDone ? '#4ade80' : '#ef4444', letterSpacing: '0.08em' }}>
            {allDone ? '✓ ALL 234 SEATS DECLARED' : `COUNTING — ${declared} of ${TOTAL} declared`}
          </span>
        </div>
        <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.35)' }}>
          {countPct}% complete
          {remaining > 0 && ` · ${remaining} pending`}
        </span>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ padding: '18px 16px 14px' }}>

        {/* TVK WIN headline */}
        {tvkWon ? (
          <div style={{ marginBottom: 16 }}>
            <div style={{
              fontSize: 9, fontWeight: 900, color: '#fbbf24', letterSpacing: '0.15em',
              marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ animation: 'tvkSpin 3s linear infinite', display: 'inline-block' }}>⭐</span>
              TVK WINS TAMIL NADU 2026
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 'clamp(52px,15vw,80px)', fontWeight: 900, lineHeight: 0.9, letterSpacing: '-0.02em' }}>
                  <BigNum n={tvk} color="#fbbf24" />
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>seats won</div>
              </div>
              <div style={{ paddingLeft: 16, borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: 'clamp(28px,8vw,44px)', fontWeight: 900, lineHeight: 0.9, color: '#4ade80' }}>
                  +<BigNum n={tvkAbove} color="#4ade80" />
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>above majority</div>
              </div>
              <div style={{ paddingLeft: 16, borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: 'clamp(22px,6vw,32px)', fontWeight: 900, lineHeight: 0.9, color: 'rgba(255,255,255,0.5)' }}>
                  {MAJORITY}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>majority mark</div>
              </div>
            </div>

            {/* Win description */}
            <div style={{
              marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.55,
              maxWidth: 480,
            }}>
              Thalapathy Vijay's TVK won <strong style={{ color: '#fbbf24' }}>{tvk} of {TOTAL} seats</strong> — securing a majority
              with <strong style={{ color: '#4ade80' }}>{tvkAbove} seats to spare</strong>. A historic debut: first party ever
              to win a state majority in its first election.
            </div>
          </div>
        ) : (
          /* Not yet at majority — show progress */
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 9, fontWeight: 900, color: '#fbbf24', letterSpacing: '0.12em', marginBottom: 6 }}>
              ⭐ TVK LEADING
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 'clamp(52px,15vw,80px)', fontWeight: 900, lineHeight: 0.9 }}>
                  <BigNum n={tvk} color="#fbbf24" />
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>seats so far</div>
              </div>
              <div style={{ paddingLeft: 16, borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: 'clamp(28px,8vw,44px)', fontWeight: 900, lineHeight: 0.9, color: '#ef4444' }}>
                  <BigNum n={MAJORITY - tvk} color="#ef4444" />
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>more needed</div>
              </div>
            </div>
          </div>
        )}

        {/* ── ALLIANCE SCOREBOARD ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 8,
        }}>

          {/* TVK */}
          <AllianceCard
            emoji="⭐" name="TVK" sub="Vijay Alliance"
            seats={tvk} color="#fbbf24"
            won={tvkWon} majority={MAJORITY}
            above={tvkAbove}
          />

          {/* DMK Alliance */}
          <AllianceCard
            emoji="🌅" name="DMK Alliance" sub="DMK · INC · VCK · CPI · IUML"
            seats={dmkAlliance} color="#f87171"
            won={false} majority={MAJORITY}
          />

          {/* ADMK Alliance */}
          <AllianceCard
            emoji="🍃" name="ADMK Alliance" sub="ADMK · PMK · DMDK"
            seats={admkAlliance} color="#4ade80"
            won={false} majority={MAJORITY}
          />

          {/* BJP + Others compact */}
          <div style={{
            borderRadius: 12, padding: '10px 12px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontWeight: 700, marginBottom: 6 }}>Others</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {bjp > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 10, color: '#fb923c' }}>🪷 BJP</span>
                  <span style={{ fontSize: 13, fontWeight: 900, color: '#fb923c' }}>{bjp}</span>
                </div>
              )}
              {others > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>🏛️ Ind/Others</span>
                  <span style={{ fontSize: 13, fontWeight: 900, color: '#94a3b8' }}>{others}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── SEAT DISTRIBUTION BAR ── */}
        <div style={{ marginTop: 12 }}>
          <div style={{ height: 10, borderRadius: 99, overflow: 'hidden', display: 'flex', position: 'relative' }}>
            {[
              { seats: tvk,          color: '#fbbf24' },
              { seats: dmkAlliance,  color: '#f87171' },
              { seats: admkAlliance, color: '#4ade80' },
              { seats: bjp + others, color: '#94a3b8' },
              { seats: remaining,    color: 'rgba(255,255,255,0.04)' },
            ].map((s, i) => (
              <div key={i} style={{
                height: '100%',
                width: `${(s.seats / TOTAL) * 100}%`,
                background: s.color,
                transition: 'width 1.5s cubic-bezier(.34,1.56,.64,1)',
              }} />
            ))}
          </div>
          {/* Majority marker */}
          <div style={{ position: 'relative', height: 14 }}>
            <div style={{
              position: 'absolute',
              left: `${(MAJORITY / TOTAL) * 100}%`,
              transform: 'translateX(-50%)',
              fontSize: 8, fontWeight: 900, color: '#fbbf24',
              whiteSpace: 'nowrap',
            }}>
              ★ {MAJORITY} majority
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 2 }}>
            {[
              { label: '⭐ TVK', seats: tvk, color: '#fbbf24' },
              { label: '🌅 DMK+', seats: dmkAlliance, color: '#f87171' },
              { label: '🍃 ADMK+', seats: admkAlliance, color: '#4ade80' },
            ].map(p => (
              <span key={p.label} style={{ fontSize: 9, color: p.color, fontWeight: 700 }}>
                {p.label} {p.seats}
              </span>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes tvkPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.3;transform:scale(1.5)} }
        @keyframes tvkSpin  { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
      `}</style>
    </div>
  )
}

function AllianceCard({
  emoji, name, sub, seats, color, won, majority, above,
}: {
  emoji: string; name: string; sub: string; seats: number
  color: string; won: boolean; majority: number; above?: number
}) {
  const v = useCountUp(seats, 1200)
  const pct = Math.min(100, Math.round((seats / majority) * 100))

  return (
    <div style={{
      borderRadius: 12, padding: '10px 12px',
      background: won ? `${color}12` : 'rgba(255,255,255,0.025)',
      border: won ? `1.5px solid ${color}35` : '1px solid rgba(255,255,255,0.07)',
      boxShadow: won ? `0 0 20px ${color}15` : 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 16 }}>{emoji}</span>
        {won && (
          <span style={{
            fontSize: 7, fontWeight: 900, padding: '2px 6px', borderRadius: 99,
            background: 'rgba(74,222,128,0.15)', color: '#4ade80',
            border: '1px solid rgba(74,222,128,0.3)',
          }}>✓ WON</span>
        )}
      </div>
      <div style={{ fontSize: 11, fontWeight: 900, color, marginBottom: 1 }}>{name}</div>
      <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', marginBottom: 8, lineHeight: 1.3 }}>{sub}</div>

      {/* Big seat number */}
      <div style={{ fontSize: 'clamp(28px,7vw,38px)', fontWeight: 900, color, lineHeight: 1, fontVariantNumeric: 'tabular-nums', marginBottom: 6 }}>
        {v}
      </div>

      {/* +X above majority */}
      {won && above !== undefined && above > 0 && (
        <div style={{ fontSize: 10, color: '#4ade80', fontWeight: 800, marginBottom: 6 }}>
          +{above} above majority
        </div>
      )}

      {/* Progress bar to majority */}
      <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 3 }}>
        <div style={{
          height: '100%', borderRadius: 99,
          width: `${pct}%`,
          background: won ? '#4ade80' : `linear-gradient(90deg,${color}66,${color})`,
          transition: 'width 1.5s ease',
        }} />
      </div>
      <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>
        {won ? `${seats} / ${majority} ✓` : `needs ${majority - seats} more`}
      </div>
    </div>
  )
}
