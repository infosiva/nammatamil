'use client'

/**
 * TVKMomentumTicker — Scrolling ticker of TVK achievement facts.
 * Auto-scrolls key stats + inspirational facts about TVK's historic win.
 */

import { useEffect, useRef } from 'react'

const FACTS = [
  '⭐ TVK won 110 seats in its DEBUT election — a first in Indian political history',
  '🏆 TVK crossed the 118-seat majority mark — Tamil Nadu has a new government',
  '🌊 TVK leads in 28+ of 38 districts across Tamil Nadu',
  '📊 TVK won 47% of all declared seats — dominant mandate',
  '🎬 Thalapathy Vijay transitions from silver screen to the political stage successfully',
  '🗳️ All 234 seats declared — Tamil Nadu has spoken clearly',
  '💛 TVK won Chennai 16 of 18 seats — capital city sweep',
  '🌟 First-ever party to win majority in very first state election in India',
  '📍 TVK contested 234 seats and won 110 — a 47% win rate on debut',
  '🤝 TVK governs alone — no coalition dependency for stability',
  '⚡ DMK drops from 133 seats (2021) to 59 — TVK takes the progressive vote',
  '🛡️ ADMK survives with 45 seats — credible opposition remains',
]

export default function TVKMomentumTicker() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let x = 0
    let raf: number
    const speed = 0.5
    const step = () => {
      x -= speed
      if (Math.abs(x) >= el.scrollWidth / 2) x = 0
      el.style.transform = `translateX(${x}px)`
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [])

  // Double the facts so the loop is seamless
  const items = [...FACTS, ...FACTS]

  return (
    <div style={{
      overflow: 'hidden',
      borderRadius: 10,
      background: 'rgba(251,191,36,0.06)',
      border: '1px solid rgba(251,191,36,0.15)',
      padding: '8px 0',
      marginBottom: 14,
      position: 'relative',
    }}>
      {/* Left fade */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 40, zIndex: 2,
        background: 'linear-gradient(90deg, rgba(13,2,0,0.95), transparent)',
        pointerEvents: 'none',
      }} />
      {/* Right fade */}
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: 40, zIndex: 2,
        background: 'linear-gradient(270deg, rgba(13,2,0,0.95), transparent)',
        pointerEvents: 'none',
      }} />

      <div ref={ref} style={{ display: 'flex', whiteSpace: 'nowrap', willChange: 'transform' }}>
        {items.map((fact, i) => (
          <span key={i} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            paddingRight: 40,
            fontSize: 11, fontWeight: 700,
            color: 'rgba(251,191,36,0.85)',
          }}>
            {fact}
            <span style={{ color: 'rgba(251,191,36,0.25)', paddingLeft: 20 }}>·</span>
          </span>
        ))}
      </div>
    </div>
  )
}
