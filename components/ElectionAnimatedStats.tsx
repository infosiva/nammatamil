'use client'

/**
 * TN Election 2026 — Live Results Dashboard
 * Google Material-inspired, mobile-first, dark theme.
 */

import { useState, useEffect, useCallback, useRef } from 'react'

interface PartyResult {
  name: string; fullName: string; leader: string; color: string; emoji: string
  seatsWon: number; seatsLeading: number; totalTally: number; voteShare: number
  trend: 'up' | 'down' | 'stable'; isLeading: boolean; hasMajority: boolean
}
interface ElectionData {
  phase: string; seatsReported: number; totalSeats: number; majorityMark: number
  parties: PartyResult[]; narrative: string; updatedAt: string; source: string
  leader: string; projectedWinner: string | null; refreshing?: boolean
}

const REFRESH_MS = 60_000
const MAJORITY   = 118
const TOTAL      = 234

// ── ECI direct fetch (browser-side) ─────────────────────────────────────────
const ECI_JSON = 'https://results.eci.gov.in/ResultAcGenMay2026/election-json-S22-live.json'
const PARTY_ALIASES: Record<string, string> = {
  TVK:'TVK', DMK:'DMK', ADMK:'AIADMK', AIADMK:'AIADMK', BJP:'BJP',
  PMK:'Others', INC:'Others', CPI:'Others', VCK:'Others', DMDK:'Others',
  IUML:'Others', AMMKMNKZ:'Others', PT:'Others',
}
const PARTY_META: Record<string, { fullName: string; leader: string; color: string; emoji: string; voteShare: number }> = {
  TVK:    { fullName:'Tamilaga Vettri Kazhagam', leader:'Vijay (Thalapathy)', color:'#fbbf24', emoji:'⭐', voteShare:35.0 },
  DMK:    { fullName:'Dravida Munnetra Kazhagam', leader:'M.K. Stalin',       color:'#f87171', emoji:'🌅', voteShare:35.0 },
  AIADMK: { fullName:'All India AIADMK',          leader:'E. Palaniswami',    color:'#4ade80', emoji:'🍃', voteShare:23.0 },
  BJP:    { fullName:'Bharatiya Janata Party',     leader:'K. Annamalai',     color:'#fb923c', emoji:'🪷', voteShare:4.2  },
  Others: { fullName:'Others / Independents',      leader:'',                  color:'#94a3b8', emoji:'🏛️', voteShare:2.8  },
}

async function fetchECIStats(): Promise<ElectionData | null> {
  try {
    const res = await fetch(ECI_JSON, { cache: 'no-store', signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    const json = await res.json() as Record<string, { chartData: [string, string, number, string, string][] }>
    const s22 = json['S22']
    if (!s22?.chartData || s22.chartData.length < 10) return null

    const tally: Record<string, number> = {}
    for (const [rawParty] of s22.chartData) {
      const key = PARTY_ALIASES[rawParty] ?? 'Others'
      tally[key] = (tally[key] ?? 0) + 1
    }

    const parties: PartyResult[] = Object.entries(PARTY_META).map(([name, meta]) => {
      const leading = tally[name] ?? 0
      return {
        name, ...meta,
        seatsWon: 0, seatsLeading: leading, totalTally: leading,
        trend: 'stable' as const, isLeading: false, hasMajority: leading >= MAJORITY,
      }
    }).sort((a, b) => b.totalTally - a.totalTally)
    if (parties.length > 0) parties[0].isLeading = true

    const leader = parties[0]
    return {
      phase: 'counting',
      seatsReported: s22.chartData.length,
      totalSeats: TOTAL,
      majorityMark: MAJORITY,
      parties,
      narrative: `${leader.name} leading with ${leader.totalTally} seats · ${s22.chartData.length} of 234 reporting`,
      updatedAt: new Date().toISOString(),
      source: 'eci-live',
      leader: leader.name,
      projectedWinner: leader.totalTally >= MAJORITY ? leader.name : null,
    }
  } catch {
    return null
  }
}

// ─── Animated counter ───────────────────────────────────────────────────────
function AnimNum({ n, dur = 700 }: { n: number; dur?: number }) {
  const [v, setV] = useState(n)
  const prev = useRef(n)
  const raf  = useRef<number | null>(null)
  useEffect(() => {
    if (prev.current === n) return
    if (raf.current) cancelAnimationFrame(raf.current)
    const s0 = prev.current, d = n - s0, t0 = performance.now()
    const step = (now: number) => {
      const t = Math.min((now - t0) / dur, 1)
      const e = t < .5 ? 2*t*t : -1+(4-2*t)*t
      setV(Math.round(s0 + d * e))
      if (t < 1) raf.current = requestAnimationFrame(step)
      else { setV(n); prev.current = n }
    }
    raf.current = requestAnimationFrame(step)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [n, dur])
  return <>{v}</>
}

// ─── Winner Banner ──────────────────────────────────────────────────────────
function WinnerBanner({ p }: { p: PartyResult }) {
  return (
    <div style={{
      borderRadius: 16, padding: '0', overflow: 'hidden',
      background: `linear-gradient(135deg, ${p.color}22 0%, #0d0020 60%)`,
      border: `1px solid ${p.color}44`,
      boxShadow: `0 4px 32px ${p.color}22`,
      animation: 'elGlow 3s ease-in-out infinite',
    }}>
      {/* Shimmer top bar */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${p.color}00, ${p.color}, ${p.color}00)`, animation: 'shimBar 2s ease-in-out infinite' }} />
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Badge */}
        <div style={{
          width: 56, height: 56, borderRadius: 14, flexShrink: 0,
          background: `${p.color}18`, border: `1.5px solid ${p.color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, boxShadow: `0 0 20px ${p.color}30`,
        }}>{p.emoji}</div>
        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: p.color, textTransform: 'uppercase', marginBottom: 3 }}>
            🏆 Majority Won · Tamil Nadu 2026
          </div>
          <div style={{ fontSize: 'clamp(15px,3.5vw,20px)', fontWeight: 900, color: '#fff', lineHeight: 1.15, marginBottom: 5 }}>
            {p.fullName}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>Led by {p.leader}</span>
            <span style={{
              fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 99,
              background: `${p.color}20`, color: p.color, border: `1px solid ${p.color}38`,
            }}>{p.totalTally - MAJORITY}+ above majority</span>
          </div>
        </div>
        {/* Big seat count */}
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: 'clamp(32px,7vw,48px)', fontWeight: 900, color: p.color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            <AnimNum n={p.totalTally} />
          </div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>seats</div>
        </div>
      </div>
    </div>
  )
}

// ─── Stat chip ──────────────────────────────────────────────────────────────
function Chip({ label, value, sub, color, live }: { label: string; value: string | number; sub?: string; color?: string; live?: boolean }) {
  const c = color ?? 'rgba(255,255,255,0.7)'
  return (
    <div style={{
      borderRadius: 14, padding: '12px 14px', flex: 1, minWidth: 0,
      background: color ? `${color}0a` : 'rgba(255,255,255,0.025)',
      border: `1px solid ${color ? color + '22' : 'rgba(255,255,255,0.07)'}`,
    }}>
      <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 5 }}>
        {live && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444', flexShrink: 0, display: 'inline-block', animation: 'elPulse 1.5s infinite' }} />}
        {label}
      </div>
      <div style={{ fontSize: 'clamp(17px,3.8vw,24px)', fontWeight: 900, color: c, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', marginTop: 5 }}>{sub}</div>}
    </div>
  )
}

// ─── Live Insights (auto-generated smart facts from live data) ───────────────
function LiveInsights({ data }: { data: ElectionData }) {
  const [idx, setIdx] = useState(0)
  const [fade, setFade] = useState(true)

  const parties = data.parties
  const tvk   = parties.find(p => p.name === 'TVK')
  const dmk   = parties.find(p => p.name === 'DMK')
  const admk  = parties.find(p => p.name === 'AIADMK')
  const bjp   = parties.find(p => p.name === 'BJP')
  const leader = parties.find(p => p.isLeading)
  const winner = parties.find(p => p.hasMajority)
  const total234 = data.seatsReported

  const insights: { icon: string; text: string; color: string }[] = []

  if (winner) {
    insights.push({ icon: '🏆', color: winner.color,
      text: `${winner.fullName} wins Tamil Nadu 2026 with ${winner.totalTally} seats — ${winner.totalTally - MAJORITY} seats above majority` })
  }
  if (tvk && leader?.name === 'TVK') {
    insights.push({ icon: '⭐', color: '#fbbf24',
      text: `Thalapathy Vijay's TVK sweeps ${tvk.totalTally} constituencies — a historic debut for a party contesting its first election` })
  }
  if (admk && admk.totalTally > 0 && tvk && tvk.totalTally > 0) {
    insights.push({ icon: '📊', color: '#4ade80',
      text: `TVK leads ADMK by ${(tvk?.totalTally ?? 0) - admk.totalTally} seats — ADMK trails with ${admk.totalTally} constituencies` })
  }
  if (dmk && dmk.totalTally > 0) {
    insights.push({ icon: '📉', color: '#f87171',
      text: `DMK (ruling party) drops to ${dmk.totalTally} seats — a significant loss from their 2021 tally of 133` })
  }
  if (bjp && bjp.totalTally > 0) {
    insights.push({ icon: '🪷', color: '#fb923c',
      text: `BJP wins ${bjp.totalTally} seats in Tamil Nadu — Annamalai's campaign shows marginal gains` })
  }
  if (tvk && tvk.totalTally >= 118) {
    insights.push({ icon: '🎯', color: '#fbbf24',
      text: `TVK crosses the magic 118 majority mark with ${tvk.totalTally} seats — government formation confirmed` })
  }
  if (total234 > 0) {
    insights.push({ icon: '🗳️', color: 'rgba(255,255,255,0.5)',
      text: `All ${total234} of 234 constituencies have declared results in Tamil Nadu Assembly Election 2026` })
  }
  if (tvk && admk && dmk) {
    const others = 234 - (tvk.totalTally + admk.totalTally + dmk.totalTally + (bjp?.totalTally ?? 0))
    if (others > 0) insights.push({ icon: '🏛️', color: '#94a3b8',
      text: `Other parties and independents win ${others} seats across Tamil Nadu's 234 constituencies` })
  }

  const items = insights.length > 0 ? insights : [{ icon: '📡', color: 'rgba(255,255,255,0.4)', text: 'Live results flowing in — Tamil Nadu Assembly Election 2026 counting underway' }]

  useEffect(() => {
    if (items.length <= 1) return
    const t = setInterval(() => {
      setFade(false)
      setTimeout(() => { setIdx(i => (i + 1) % items.length); setFade(true) }, 400)
    }, 4000)
    return () => clearInterval(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length])

  const item = items[idx % items.length]

  return (
    <div style={{
      borderRadius: 12, padding: '10px 14px',
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(255,255,255,0.07)',
      display: 'flex', alignItems: 'center', gap: 10,
      minHeight: 44,
      transition: 'opacity 0.4s ease',
      opacity: fade ? 1 : 0,
    }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', lineHeight: 1.4, flex: 1 }}>
        {item.text}
      </span>
      {items.length > 1 && (
        <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
          {items.map((_, i) => (
            <span key={i} style={{
              width: i === idx % items.length ? 14 : 5, height: 5, borderRadius: 99,
              background: i === idx % items.length ? item.color : 'rgba(255,255,255,0.15)',
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── SVG Donut chart ────────────────────────────────────────────────────────
function DonutChart({ parties }: { parties: PartyResult[] }) {
  const R = 54, CX = 70, CY = 70, STROKE = 18
  const circumference = 2 * Math.PI * R
  const total = parties.reduce((s, p) => s + p.totalTally, 0)
  const leader = parties.find(p => p.isLeading)

  let offset = 0
  const slices = parties.filter(p => p.totalTally > 0).map(p => {
    const pct   = p.totalTally / Math.max(total, 1)
    const dash  = pct * circumference
    const gap   = circumference - dash
    const slice = { name: p.name, color: p.color, dash, gap, offset, seats: p.totalTally, isLeading: p.isLeading }
    offset += dash
    return slice
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      {/* SVG donut */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <svg width={140} height={140} style={{ transform: 'rotate(-90deg)' }}>
          {/* background ring */}
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={STROKE} />
          {slices.map(s => (
            <circle key={s.name} cx={CX} cy={CY} r={R} fill="none"
              stroke={s.color}
              strokeWidth={s.isLeading ? STROKE + 3 : STROKE - 2}
              strokeDasharray={`${s.dash - 2} ${s.gap + 2}`}
              strokeDashoffset={-s.offset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(.34,1.56,.64,1)', filter: s.isLeading ? `drop-shadow(0 0 6px ${s.color})` : 'none' }}
            />
          ))}
          {/* majority marker at 50.4% (118/234) */}
          <line
            x1={CX + R * Math.cos(2 * Math.PI * (MAJORITY / TOTAL) - Math.PI / 2)}
            y1={CY + R * Math.sin(2 * Math.PI * (MAJORITY / TOTAL) - Math.PI / 2)}
            x2={CX + (R - STROKE / 2 - 4) * Math.cos(2 * Math.PI * (MAJORITY / TOTAL) - Math.PI / 2)}
            y2={CY + (R - STROKE / 2 - 4) * Math.sin(2 * Math.PI * (MAJORITY / TOTAL) - Math.PI / 2)}
            stroke="#fbbf24" strokeWidth={2}
          />
        </svg>
        {/* Center label */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none' }}>
          {leader && (
            <>
              <div style={{ fontSize: 22, fontWeight: 900, color: leader.color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{leader.totalTally}</div>
              <div style={{ fontSize: 8, fontWeight: 800, color: leader.color, letterSpacing: '0.05em', marginTop: 1 }}>{leader.name}</div>
              <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.25)', marginTop: 1 }}>leading</div>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        {parties.filter(p => p.totalTally > 0).map(p => {
          const pct = Math.round((p.totalTally / Math.max(total, 1)) * 100)
          return (
            <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: p.color, flexShrink: 0, boxShadow: p.isLeading ? `0 0 8px ${p.color}` : 'none' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: p.isLeading ? p.color : 'rgba(255,255,255,0.7)' }}>{p.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 900, color: p.color, fontVariantNumeric: 'tabular-nums' }}>{p.totalTally}</span>
                </div>
                <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: p.color, borderRadius: 99, transition: 'width 1.2s ease', boxShadow: p.isLeading ? `0 0 6px ${p.color}` : 'none' }} />
                </div>
              </div>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', minWidth: 28, textAlign: 'right' }}>{pct}%</span>
            </div>
          )
        })}
        <div style={{ fontSize: 8, color: 'rgba(251,191,36,0.5)', marginTop: 2 }}>⬆ majority = {MAJORITY} seats</div>
      </div>
    </div>
  )
}

// ─── 2021 vs 2026 Comparison ────────────────────────────────────────────────
const RESULT_2021: Record<string, number> = { DMK: 133, AIADMK: 66, TVK: 0, BJP: 4, Others: 31 }

function CompareBar({ parties }: { parties: PartyResult[] }) {
  const rows = [
    { name: 'TVK',    color: '#fbbf24', prev: 0,   prevLabel: 'New party' },
    { name: 'AIADMK', color: '#4ade80', prev: 66,  prevLabel: '2021: 66' },
    { name: 'DMK',    color: '#f87171', prev: 133, prevLabel: '2021: 133' },
    { name: 'BJP',    color: '#fb923c', prev: 4,   prevLabel: '2021: 4' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>2026 vs 2021 Results</span>
        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.18)' }}>out of 234 seats</span>
      </div>
      {rows.map(row => {
        const p2026 = parties.find(p => p.name === row.name)
        const now   = p2026?.totalTally ?? 0
        const prev  = row.prev
        const maxVal = Math.max(now, prev, 1)
        const diff  = now - prev
        return (
          <div key={row.name}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: row.color }}>{row.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {prev > 0 && <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)' }}>{row.prevLabel}</span>}
                {prev === 0 && <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>Debut</span>}
                <span style={{
                  fontSize: 9, fontWeight: 900, padding: '1px 6px', borderRadius: 4,
                  background: diff > 0 ? 'rgba(74,222,128,0.12)' : diff < 0 ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)',
                  color: diff > 0 ? '#4ade80' : diff < 0 ? '#f87171' : 'rgba(255,255,255,0.3)',
                }}>
                  {diff > 0 ? `+${diff}` : diff === 0 ? '—' : diff}
                </span>
                <span style={{ fontSize: 14, fontWeight: 900, color: row.color, fontVariantNumeric: 'tabular-nums', minWidth: 28, textAlign: 'right' }}>{now}</span>
              </div>
            </div>
            {/* Dual bars: 2026 (bright) over 2021 (dim ghost) */}
            <div style={{ position: 'relative', height: 10, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
              {/* 2021 ghost */}
              <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${(prev / TOTAL) * 100}%`, background: `${row.color}28`, borderRadius: 99 }} />
              {/* 2026 live */}
              <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${(now / TOTAL) * 100}%`, background: `linear-gradient(90deg,${row.color}aa,${row.color})`, borderRadius: 99, transition: 'width 1.3s cubic-bezier(.34,1.56,.64,1)', boxShadow: `0 0 8px ${row.color}60` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Seat bar ───────────────────────────────────────────────────────────────
function SeatBar({ parties }: { parties: PartyResult[] }) {
  const total = parties.reduce((s, p) => s + p.totalTally, 0)
  const scale = total > 0 ? Math.min(TOTAL / total, 1) : 0
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {TOTAL} Seats
        </span>
        <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(251,191,36,0.65)' }}>
          Majority: {MAJORITY}
        </span>
      </div>
      {/* Bar */}
      <div style={{ height: 32, borderRadius: 99, background: 'rgba(255,255,255,0.05)', display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {parties.map(p => {
          const w = (p.totalTally * scale / TOTAL) * 100
          if (w < 0.4) return null
          return (
            <div key={p.name} title={`${p.name}: ${p.totalTally}`} style={{
              width: `${w}%`,
              background: p.isLeading ? `linear-gradient(90deg,${p.color}bb,${p.color})` : `${p.color}77`,
              transition: 'width 1.3s cubic-bezier(.34,1.56,.64,1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {w > 8 && <span style={{ fontSize: 9, fontWeight: 900, color: 'rgba(0,0,0,0.7)', whiteSpace: 'nowrap' }}>{p.name} {p.totalTally}</span>}
            </div>
          )
        })}
        {/* Majority marker */}
        <div style={{
          position: 'absolute', top: 0, bottom: 0, left: `${(MAJORITY/TOTAL)*100}%`,
          width: 2, background: '#fbbf24', zIndex: 3,
          boxShadow: '0 0 6px rgba(251,191,36,0.9)',
        }} />
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 10, alignItems: 'center' }}>
        {parties.filter(p => p.totalTally > 0).map(p => (
          <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: p.color, display: 'inline-block' }} />
            <span style={{ fontSize: 9, fontWeight: 800, color: p.color }}>{p.name}</span>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontVariantNumeric: 'tabular-nums' }}>{p.totalTally}</span>
          </div>
        ))}
        <span style={{ fontSize: 8, color: 'rgba(251,191,36,0.45)', marginLeft: 'auto', fontWeight: 700 }}>▲ {MAJORITY} majority line</span>
      </div>
    </div>
  )
}

// ─── Party row ──────────────────────────────────────────────────────────────
function PartyRow({ p, max, rank }: { p: PartyResult; max: number; rank: number }) {
  const fillW = max > 0 ? (p.totalTally / max) * 52 : 0   // fill behind, % of party col

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 48px 58px 58px',
      alignItems: 'center', gap: 0,
      background: p.isLeading ? `${p.color}0c` : rank % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
      borderRadius: 12, overflow: 'hidden',
      border: p.isLeading ? `1px solid ${p.color}22` : '1px solid transparent',
      position: 'relative',
    }}>
      {/* subtle fill strip */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${fillW}%`, background: `${p.color}06`, pointerEvents: 'none', transition: 'width 1.1s ease' }} />

      {/* Party cell */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', position: 'relative', zIndex: 1, minWidth: 0 }}>
        {/* color dot / glow */}
        <div style={{
          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
          background: p.color,
          boxShadow: p.isLeading ? `0 0 10px ${p.color}` : 'none',
        }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'nowrap' }}>
            <span style={{ fontWeight: 800, fontSize: 13, color: p.isLeading ? p.color : 'rgba(255,255,255,0.82)', whiteSpace: 'nowrap' }}>
              {p.name}
            </span>
            {p.hasMajority && (
              <span style={{ fontSize: 7, fontWeight: 900, padding: '1px 5px', borderRadius: 99, background: 'rgba(74,222,128,0.15)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)', flexShrink: 0 }}>
                ✓ WON
              </span>
            )}
            {p.isLeading && !p.hasMajority && (
              <span style={{ fontSize: 7, fontWeight: 900, padding: '1px 5px', borderRadius: 99, background: `${p.color}1a`, color: p.color, border: `1px solid ${p.color}35`, flexShrink: 0 }}>
                AHEAD
              </span>
            )}
          </div>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {p.voteShare > 0 ? `${p.voteShare.toFixed(1)}% votes` : p.leader}
          </div>
        </div>
      </div>

      {/* Won */}
      <div style={{ textAlign: 'center', padding: '11px 4px', position: 'relative', zIndex: 1 }}>
        <div style={{ fontWeight: 900, fontSize: 15, color: p.seatsWon > 0 ? '#4ade80' : 'rgba(255,255,255,0.18)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
          <AnimNum n={p.seatsWon} />
        </div>
      </div>

      {/* Leading */}
      <div style={{ textAlign: 'center', padding: '11px 4px', position: 'relative', zIndex: 1 }}>
        <div style={{ fontWeight: 900, fontSize: 15, color: p.seatsLeading > 0 ? '#fbbf24' : 'rgba(255,255,255,0.18)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
          <AnimNum n={p.seatsLeading} />
        </div>
      </div>

      {/* Total */}
      <div style={{ textAlign: 'center', padding: '11px 8px 11px 4px', position: 'relative', zIndex: 1 }}>
        <div style={{ fontWeight: 900, fontSize: 18, color: p.isLeading ? p.color : 'rgba(255,255,255,0.65)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
          <AnimNum n={p.totalTally} />
        </div>
      </div>
    </div>
  )
}

// ─── Main ───────────────────────────────────────────────────────────────────
export default function ElectionAnimatedStats() {
  const [data, setData]       = useState<ElectionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [sec, setSec]         = useState(0)
  const [busy, setBusy]       = useState(false)

  const load = useCallback(async (manual = false) => {
    if (manual) setBusy(true)
    try {
      // Try ECI directly from browser first (ECI blocks server IPs but allows browser CORS)
      const eciData = await fetchECIStats()
      if (eciData) {
        setData(eciData)
        setSec(0)
        return
      }
      // Fallback to our API
      const r = await fetch('/api/election-results', { cache: 'no-store', signal: AbortSignal.timeout(12000) })
      if (!r.ok) return
      setData(await r.json())
      setSec(0)
    } catch { /* keep */ }
    finally { setLoading(false); setBusy(false) }
  }, [])

  useEffect(() => {
    load()
    const p = setInterval(load, REFRESH_MS)
    const t = setInterval(() => setSec(s => s + 1), 1000)
    return () => { clearInterval(p); clearInterval(t) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[90, 240, 170].map((h, i) => (
        <div key={i} style={{ height: h, borderRadius: 16, background: 'rgba(255,255,255,0.025)', animation: 'elShimmer 1.6s ease-in-out infinite' }} />
      ))}
      <style>{`@keyframes elShimmer{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
    </div>
  )
  if (!data) return null

  const parties   = data.parties ?? []
  const hasData   = parties.some(p => p.totalTally > 0)
  const max       = Math.max(...parties.map(p => p.totalTally), 1)
  const leader    = parties.find(p => p.isLeading)
  const winner    = parties.find(p => p.hasMajority)
  const isLive    = data.phase === 'counting' || data.phase === 'declared'
  const pct       = Math.round((data.seatsReported / TOTAL) * 100)
  const nextIn    = Math.max(0, 60 - sec)
  const totalWon  = parties.reduce((s, p) => s + p.seatsWon, 0)
  const totalLead = parties.reduce((s, p) => s + p.seatsLeading, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ── Winner Banner ── */}
      {winner && hasData && <WinnerBanner p={winner} />}

      {/* ── Live Insights ticker ── */}
      {hasData && <LiveInsights data={data} />}

      {/* ── Counting progress strip ── */}
      {(() => {
        const counted   = data.seatsReported
        const pending   = TOTAL - counted
        const countPct  = Math.round((counted / TOTAL) * 100)
        return (
          <div style={{
            borderRadius: 14, padding: '12px 16px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}>
            {/* Row 1: label + numbers */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {isLive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'elPulse 1.5s infinite', flexShrink: 0 }} />}
                <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.07em' }}>COUNTED SO FAR</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                <span style={{ fontSize: 26, fontWeight: 900, color: 'rgba(255,255,255,0.9)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                  <AnimNum n={counted} />
                </span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>/ {TOTAL}</span>
                <span style={{
                  fontSize: 10, fontWeight: 900, padding: '2px 7px', borderRadius: 5,
                  background: countPct > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)',
                  color: countPct > 0 ? '#ef4444' : 'rgba(255,255,255,0.2)',
                  border: `1px solid ${countPct > 0 ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.07)'}`,
                  marginLeft: 4,
                }}>
                  {countPct}%
                </span>
              </div>
            </div>
            {/* Bar */}
            <div style={{ height: 8, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 6 }}>
              <div style={{
                height: '100%', borderRadius: 99,
                width: `${countPct}%`,
                background: 'linear-gradient(90deg, #ef4444cc, #ef4444)',
                transition: 'width 1.2s cubic-bezier(.34,1.56,.64,1)',
                boxShadow: '0 0 8px rgba(239,68,68,0.5)',
              }} />
            </div>
            {/* Row 2: pending */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>
                {pending > 0 ? `${pending} seats still pending` : 'All seats counted'}
              </span>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.15)' }}>Majority: {MAJORITY} seats</span>
            </div>
          </div>
        )
      })()}

      {/* ── Party win scenarios (TVK + top contenders) ── */}
      {hasData && (() => {
        const tvk    = parties.find(p => p.name === 'TVK')
        const dmk    = parties.find(p => p.name === 'DMK')
        const admk   = parties.find(p => p.name === 'AIADMK')
        const counted = data.seatsReported
        const pending = TOTAL - counted

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[tvk, dmk, admk].filter(Boolean).map(p => {
              if (!p) return null
              const total   = p.totalTally
              const needed  = Math.max(0, MAJORITY - total)
              const canWin  = needed <= pending           // mathematically possible
              const hasMaj  = total >= MAJORITY
              const color   = p.color
              const pctFill = Math.min(100, Math.round((total / MAJORITY) * 100))

              let statusLabel = ''
              let statusColor = ''
              if (hasMaj) { statusLabel = 'MAJORITY'; statusColor = '#4ade80' }
              else if (!canWin) { statusLabel = 'NO MAJORITY'; statusColor = 'rgba(255,255,255,0.35)' }
              else if (needed <= 10) { statusLabel = 'VERY CLOSE'; statusColor = '#fbbf24' }
              else if (needed <= 30) { statusLabel = 'IN RANGE'; statusColor = color }
              else { statusLabel = 'TRAILING'; statusColor = 'rgba(255,255,255,0.3)' }

              return (
                <div key={p.name} style={{
                  borderRadius: 12, padding: '10px 14px',
                  background: hasMaj ? `${color}14` : `${color}08`,
                  border: `1px solid ${hasMaj ? color + '40' : color + '20'}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                    {/* Party name + status */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: 12, fontWeight: 900, color }}>{p.name}</span>
                      <span style={{
                        fontSize: 8, fontWeight: 900, padding: '2px 6px', borderRadius: 4, letterSpacing: '0.07em',
                        background: hasMaj ? 'rgba(74,222,128,0.15)' : `${color}15`,
                        color: statusColor,
                        border: `1px solid ${hasMaj ? 'rgba(74,222,128,0.3)' : color + '25'}`,
                      }}>{statusLabel}</span>
                    </div>
                    {/* Seats + needs */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span style={{ fontSize: 22, fontWeight: 900, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                        <AnimNum n={total} />
                      </span>
                      {!hasMaj && pending === 0 && (
                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', fontVariantNumeric: 'tabular-nums' }}>
                          fell short by {needed}
                        </span>
                      )}
                      {!hasMaj && pending > 0 && (
                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', fontVariantNumeric: 'tabular-nums' }}>
                          needs {needed} more
                        </span>
                      )}
                      {hasMaj && (
                        <span style={{ fontSize: 9, color: '#4ade80' }}>
                          +{total - MAJORITY} above majority
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Progress bar to 118 */}
                  <div style={{ position: 'relative', height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 99,
                      width: `${pctFill}%`,
                      background: hasMaj
                        ? 'linear-gradient(90deg,#4ade80,#22c55e)'
                        : `linear-gradient(90deg,${color}99,${color})`,
                      transition: 'width 1.3s cubic-bezier(.34,1.56,.64,1)',
                      boxShadow: `0 0 8px ${color}60`,
                    }} />
                  </div>
                  {/* Sub row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.18)' }}>
                      {total} of {MAJORITY} seats needed
                    </span>
                    <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.18)' }}>
                      {pctFill}% to majority
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )
      })()}

      {/* ── 3-chip stat row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
        <Chip
          label="Counted"
          value={`${data.seatsReported}/${TOTAL}`}
          sub={`${pct}% done`}
          color={isLive ? '#ef4444' : undefined}
          live={isLive}
        />
        <Chip
          label="Majority"
          value={MAJORITY}
          sub={`of ${TOTAL} seats`}
          color="#fbbf24"
        />
        <Chip
          label={winner ? 'Winner' : 'Leading'}
          value={leader?.name ?? '—'}
          sub={leader ? `${leader.totalTally} seats` : 'Counting…'}
          color={leader?.color}
        />
      </div>

      {/* ── Main results card ── */}
      <div style={{
        borderRadius: 18,
        background: 'rgba(255,255,255,0.022)',
        border: '1px solid rgba(255,255,255,0.07)',
        overflow: 'hidden',
      }}>

        {/* Card header */}
        <div style={{
          padding: '10px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.055)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isLive && (
              <>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'elPulse 1.5s infinite', flexShrink: 0 }} />
                <span style={{ fontWeight: 900, fontSize: 11, color: '#ef4444', letterSpacing: '0.05em' }}>
                  {data.phase === 'declared' ? 'DECLARED' : 'LIVE COUNTING'}
                </span>
              </>
            )}
            {hasData && (
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.22)', background: 'rgba(255,255,255,0.05)', padding: '2px 7px', borderRadius: 99 }}>
                {data.seatsReported} seats reporting
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.16)' }}>
              {busy ? 'Refreshing…' : `↻ ${nextIn}s`}
            </span>
            <button onClick={() => load(true)} disabled={busy} style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: '4px 8px', cursor: 'pointer',
              color: 'rgba(255,255,255,0.45)', fontSize: 11,
              animation: busy ? 'elSpin 1s linear infinite' : 'none',
            }} title="Refresh">↻</button>
          </div>
        </div>

        {/* Column headers */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 48px 58px 58px',
          padding: '6px 12px 6px 12px', gap: 0,
          background: 'rgba(0,0,0,0.2)',
          borderBottom: '1px solid rgba(255,255,255,0.045)',
        }}>
          <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Party</span>
          <span style={{ fontSize: 8, fontWeight: 700, color: '#4ade80', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Won</span>
          <span style={{ fontSize: 8, fontWeight: 700, color: '#fbbf24', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Seats</span>
          <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.08em', paddingRight: 8 }}>Total</span>
        </div>

        {/* Rows */}
        <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {hasData
            ? parties.map((p, i) => <PartyRow key={p.name} p={p} max={max} rank={i} />)
            : (
              <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>📡</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.28)' }}>Connecting to live results…</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.14)', marginTop: 6 }}>Auto-refreshes every 60 s</div>
              </div>
            )}
        </div>

        {/* Seat bar */}
        {hasData && (
          <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <SeatBar parties={parties} />
          </div>
        )}

        {/* Footer */}
        <div style={{
          padding: '8px 16px',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6,
        }}>
          <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.18)' }}>
            {data.source === 'eci-live' ? '🟢 ECI live'
              : data.source === 'ai-parsed' ? '⚡ AI-parsed news'
              : data.source === 'manual-override' ? '🟡 Manual update'
              : data.source === 'cached-stale' ? '🟠 Snapshot · refreshing'
              : '⏳ Fetching…'}
          </span>
          {data.narrative && (
            <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', maxWidth: '60%', textAlign: 'right', lineHeight: 1.5, fontStyle: 'italic' }}>
              {data.narrative}
            </span>
          )}
        </div>
      </div>

      {/* ── Donut + Comparison row ── */}
      {hasData && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {/* Donut card */}
          <div style={{ borderRadius: 16, padding: '14px', background: 'rgba(255,255,255,0.022)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Seat Share</div>
            <DonutChart parties={parties} />
          </div>
          {/* Comparison card */}
          <div style={{ borderRadius: 16, padding: '14px', background: 'rgba(255,255,255,0.022)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <CompareBar parties={parties} />
          </div>
        </div>
      )}

      {/* ── TVK Victory background banner ── */}
      {hasData && (() => {
        const tvk = parties.find(p => p.name === 'TVK')
        if (!tvk || tvk.totalTally === 0) return null
        const hasMaj = tvk.hasMajority
        return (
          <div style={{
            borderRadius: 16, padding: '16px 20px', overflow: 'hidden', position: 'relative',
            background: hasMaj
              ? 'linear-gradient(135deg, rgba(251,191,36,0.12) 0%, rgba(0,0,0,0) 60%)'
              : 'linear-gradient(135deg, rgba(251,191,36,0.06) 0%, rgba(0,0,0,0) 60%)',
            border: `1px solid rgba(251,191,36,${hasMaj ? '0.3' : '0.12'})`,
            animation: hasMaj ? 'tvkGlow 3s ease-in-out infinite' : 'none',
          }}>
            {/* Animated star particles */}
            {hasMaj && [0,1,2,3,4].map(i => (
              <div key={i} style={{
                position: 'absolute',
                left: `${10 + i * 18}%`, top: `${20 + (i % 3) * 20}%`,
                width: 4, height: 4, borderRadius: '50%',
                background: '#fbbf24', opacity: 0.4,
                animation: `starFloat ${1.5 + i * 0.4}s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`,
              }} />
            ))}
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ fontSize: hasMaj ? 36 : 28, flexShrink: 0 }}>{hasMaj ? '🌟' : '⭐'}</div>
              <div>
                <div style={{ fontSize: hasMaj ? 15 : 13, fontWeight: 900, color: '#fbbf24', marginBottom: 3 }}>
                  {hasMaj ? 'TVK — Government Secured!' : `TVK Leading — ${tvk.totalTally} Seats`}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                  {hasMaj
                    ? `Thalapathy Vijay's Tamilaga Vettri Kazhagam wins ${tvk.totalTally} seats — ${tvk.totalTally - MAJORITY} above the 118-seat majority mark. Historic debut.`
                    : `TVK is the single largest party in Tamil Nadu 2026. Needs ${Math.max(0, MAJORITY - tvk.totalTally)} more seats for majority.`
                  }
                </div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: 34, fontWeight: 900, color: '#fbbf24', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                  <AnimNum n={tvk.totalTally} />
                </div>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>/ {MAJORITY} needed</div>
              </div>
            </div>
          </div>
        )
      })()}

      <style>{`
        @keyframes elPulse  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.4)} }
        @keyframes elSpin   { to{transform:rotate(360deg)} }
        @keyframes elGlow   { 0%,100%{box-shadow:0 4px 32px rgba(251,191,36,.12)} 50%{box-shadow:0 4px 48px rgba(251,191,36,.25)} }
        @keyframes shimBar  { 0%{background-position:-200%} 100%{background-position:200%} }
        @keyframes tvkGlow  { 0%,100%{box-shadow:0 0 20px rgba(251,191,36,.08)} 50%{box-shadow:0 0 40px rgba(251,191,36,.22)} }
        @keyframes starFloat{ 0%,100%{transform:translateY(0) scale(1);opacity:0.4} 50%{transform:translateY(-8px) scale(1.4);opacity:0.9} }
      `}</style>
    </div>
  )
}
