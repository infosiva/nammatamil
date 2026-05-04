'use client'

/**
 * ElectionSpotlight — TV-drama rotating spotlight.
 * Cycles through parties every 3s with a dramatic "WHO IS WINNING" reveal.
 * Fetches ECI live data directly from browser.
 */

import { useState, useEffect, useRef } from 'react'

const ECI_JSON = 'https://results.eci.gov.in/ResultAcGenMay2026/election-json-S22-live.json'
const MAJORITY = 118
const TOTAL    = 234

const PARTY_ALIASES: Record<string, string> = {
  TVK:'TVK', DMK:'DMK', ADMK:'AIADMK', AIADMK:'AIADMK', BJP:'BJP',
  PMK:'Others', INC:'Others', CPI:'Others', VCK:'Others', DMDK:'Others',
  IUML:'Others', AMMKMNKZ:'Others', PT:'Others',
}

const PARTY_META: Record<string, { color: string; leader: string; emoji: string; desc: string }> = {
  TVK:    { color: '#fbbf24', leader: 'Thalapathy Vijay', emoji: '⭐', desc: 'Historic debut — sweeping Tamil Nadu' },
  AIADMK: { color: '#4ade80', leader: 'E. Palaniswami',   emoji: '🍃', desc: 'Opposition — fighting to hold ground' },
  DMK:    { color: '#f87171', leader: 'M.K. Stalin',      emoji: '🌅', desc: 'Ruling party — facing the verdict' },
  BJP:    { color: '#fb923c', leader: 'K. Annamalai',     emoji: '🪷', desc: 'National party — battling for footing' },
  Others: { color: '#94a3b8', leader: '',                  emoji: '🏛️', desc: 'Independents & smaller parties' },
}

interface Party { name: string; seats: number; color: string; leader: string; emoji: string; desc: string }

async function fetchParties(): Promise<Party[]> {
  try {
    const res = await fetch(ECI_JSON, { cache: 'no-store', signal: AbortSignal.timeout(8000) })
    if (!res.ok) return []
    const json = await res.json() as Record<string, { chartData: [string, string, number, string, string][] }>
    const s22 = json['S22']
    if (!s22?.chartData?.length) return []
    const tally: Record<string, number> = {}
    for (const [raw] of s22.chartData) {
      const k = PARTY_ALIASES[raw] ?? 'Others'
      tally[k] = (tally[k] ?? 0) + 1
    }
    return Object.entries(PARTY_META)
      .map(([name, meta]) => ({ name, seats: tally[name] ?? 0, ...meta }))
      .filter(p => p.seats > 0)
      .sort((a, b) => b.seats - a.seats)
  } catch { return [] }
}

// Animated count-up
function AnimNum({ n }: { n: number }) {
  const [v, setV] = useState(0)
  const prev = useRef(0)
  const raf  = useRef<number | null>(null)
  useEffect(() => {
    if (prev.current === n) return
    if (raf.current) cancelAnimationFrame(raf.current)
    const s0 = prev.current, d = n - s0, t0 = performance.now(), dur = 600
    const step = (now: number) => {
      const t = Math.min((now - t0) / dur, 1)
      const e = t < .5 ? 2*t*t : -1+(4-2*t)*t
      setV(Math.round(s0 + d * e))
      if (t < 1) raf.current = requestAnimationFrame(step)
      else { setV(n); prev.current = n }
    }
    raf.current = requestAnimationFrame(step)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [n])
  return <>{v}</>
}

// Circular progress arc
function Arc({ pct, color, size = 120 }: { pct: number; color: string; size?: number }) {
  const r = (size - 16) / 2
  const circ = 2 * Math.PI * r
  const dash = pct * circ
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={10}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(.34,1.56,.64,1)', filter: `drop-shadow(0 0 8px ${color})` }}
      />
      {/* Majority marker */}
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="#fbbf24" strokeWidth={3} strokeOpacity={0.6}
        strokeDasharray={`2 ${circ - 2}`}
        strokeDashoffset={-(MAJORITY / TOTAL) * circ}
      />
    </svg>
  )
}

export default function ElectionSpotlight() {
  const [parties, setParties] = useState<Party[]>([])
  const [idx, setIdx]         = useState(0)
  const [phase, setPhase]     = useState<'enter' | 'show' | 'exit'>('enter')
  const [mounted, setMounted] = useState(false)
  const INTERVAL = 3500

  useEffect(() => {
    setMounted(true)
    fetchParties().then(p => { if (p.length) setParties(p) })
    const iv = setInterval(() => fetchParties().then(p => { if (p.length) setParties(p) }), 60_000)
    return () => clearInterval(iv)
  }, [])

  // Rotate through parties
  useEffect(() => {
    if (parties.length < 2) return
    const t = setInterval(() => {
      setPhase('exit')
      setTimeout(() => {
        setIdx(i => (i + 1) % parties.length)
        setPhase('enter')
        setTimeout(() => setPhase('show'), 50)
      }, 350)
    }, INTERVAL)
    return () => clearInterval(t)
  }, [parties.length])

  useEffect(() => {
    if (parties.length) setPhase('show')
  }, [parties.length])

  if (!mounted || parties.length === 0) return null

  const p      = parties[idx]
  const pct    = p.seats / TOTAL
  const majPct = MAJORITY / TOTAL
  const needed = Math.max(0, MAJORITY - p.seats)
  const hasMaj = p.seats >= MAJORITY
  const winner = parties.find(x => x.seats >= MAJORITY)

  const slideY = phase === 'enter' ? 18 : phase === 'exit' ? -18 : 0
  const opacity = phase === 'show' ? 1 : 0

  return (
    <div style={{
      borderRadius: 18,
      background: `linear-gradient(135deg, ${p.color}10 0%, rgba(0,0,0,0) 60%)`,
      border: `1px solid ${p.color}25`,
      padding: '18px 20px',
      position: 'relative', overflow: 'hidden',
      transition: 'background 0.5s ease, border-color 0.5s ease',
    }}>

      {/* Background glow orb */}
      <div style={{
        position: 'absolute', top: -40, right: -40, width: 160, height: 160,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${p.color}18 0%, transparent 70%)`,
        pointerEvents: 'none',
        transition: 'background 0.5s ease',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'spPulse 1.5s infinite' }} />
          <span style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            {winner ? '🏆 Final Result' : 'Who is winning?'}
          </span>
        </div>
        {/* Dot indicators */}
        <div style={{ display: 'flex', gap: 5 }}>
          {parties.map((_, i) => (
            <button key={i} onClick={() => { setPhase('exit'); setTimeout(() => { setIdx(i); setPhase('enter'); setTimeout(() => setPhase('show'), 50) }, 300) }}
              style={{
                width: i === idx ? 18 : 6, height: 6, borderRadius: 99, border: 'none',
                background: i === idx ? parties[i].color : 'rgba(255,255,255,0.15)',
                cursor: 'pointer', padding: 0, transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
      </div>

      {/* Main spotlight content */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 18,
        transform: `translateY(${slideY}px)`,
        opacity,
        transition: 'transform 0.35s cubic-bezier(.34,1.56,.64,1), opacity 0.3s ease',
      }}>
        {/* Arc + emoji */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Arc pct={pct} color={p.color} size={110} />
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 28, lineHeight: 1 }}>{p.emoji}</div>
            <div style={{ fontSize: 8, fontWeight: 700, color: p.color, marginTop: 2, letterSpacing: '0.04em' }}>
              {Math.round(pct * 100)}%
            </div>
          </div>
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Rank badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <span style={{
              fontSize: 9, fontWeight: 900, padding: '2px 8px', borderRadius: 99,
              background: hasMaj ? 'rgba(74,222,128,0.15)' : `${p.color}18`,
              color: hasMaj ? '#4ade80' : p.color,
              border: `1px solid ${hasMaj ? 'rgba(74,222,128,0.35)' : p.color + '30'}`,
              letterSpacing: '0.06em',
            }}>
              {hasMaj ? '✓ MAJORITY WON' : `#${idx + 1} POSITION`}
            </span>
          </div>

          {/* Party name */}
          <div style={{ fontSize: 'clamp(20px,5vw,28px)', fontWeight: 900, color: p.color, lineHeight: 1.1, marginBottom: 3 }}>
            {p.name}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 10 }}>
            {p.leader && `${p.leader} · `}{p.desc}
          </div>

          {/* Seat count + status */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 'clamp(36px,9vw,52px)', fontWeight: 900, color: p.color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              <AnimNum n={p.seats} />
            </span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
              {hasMaj
                ? `seats · ${p.seats - MAJORITY} above majority`
                : `seats · needs ${needed} more`
              }
            </span>
          </div>

          {/* Progress bar to majority */}
          <div style={{ marginTop: 10, position: 'relative', height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.07)' }}>
            <div style={{
              height: '100%', borderRadius: 99,
              width: `${Math.min(100, (p.seats / MAJORITY) * 100)}%`,
              background: hasMaj
                ? 'linear-gradient(90deg, #4ade80, #22c55e)'
                : `linear-gradient(90deg, ${p.color}88, ${p.color})`,
              transition: 'width 0.8s cubic-bezier(.34,1.56,.64,1)',
              boxShadow: `0 0 8px ${hasMaj ? '#4ade8060' : p.color + '50'}`,
            }} />
            {/* Majority tick */}
            <div style={{
              position: 'absolute', top: -3, bottom: -3,
              left: `${Math.min(100, majPct * 100)}%`,
              width: 2, background: '#fbbf24',
              boxShadow: '0 0 5px rgba(251,191,36,0.8)',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.18)' }}>0</span>
            <span style={{ fontSize: 7, color: 'rgba(251,191,36,0.5)', fontWeight: 700 }}>{MAJORITY} majority</span>
            <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.18)' }}>{TOTAL}</span>
          </div>
        </div>
      </div>

      {/* Auto-advance timer bar */}
      <div style={{ marginTop: 14, height: 2, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 99,
          background: `linear-gradient(90deg, ${p.color}66, ${p.color})`,
          animation: `spTimer ${INTERVAL}ms linear infinite`,
        }} />
      </div>

      <style>{`
        @keyframes spPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.5)} }
        @keyframes spTimer { 0%{width:0%} 100%{width:100%} }
      `}</style>
    </div>
  )
}
