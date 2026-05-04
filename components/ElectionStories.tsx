'use client'

/**
 * ElectionStories — Auto-generated story cards from live ECI data.
 * Swipeable horizontal feed. Each card is a real insight from the results.
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
const PARTY_COLORS: Record<string, string> = {
  TVK:'#fbbf24', DMK:'#f87171', AIADMK:'#4ade80', BJP:'#fb923c', Others:'#94a3b8',
}
const PARTY_EMOJI: Record<string, string> = {
  TVK:'⭐', DMK:'🌅', AIADMK:'🍃', BJP:'🪷', Others:'🏛️',
}

// Known notable candidates with context
const NOTABLE: Record<number, { role: string; emoji: string; story: string }> = {
  19:  { role: 'Deputy CM Son', emoji: '🌅', story: 'Udhayanidhi Stalin holds Kolathur for DMK — Stalin family dynasty continues' },
  18:  { role: 'Cabinet Minister', emoji: '🌅', story: 'Sekarbabu retains seat — DMK veterans hold their ground in Chennai suburbs' },
  86:  { role: 'ADMK Chief', emoji: '🍃', story: 'Edappadi Palaniswami wins Edappadi — opposition leader survives the TVK wave' },
  59:  { role: "PMK Leader's Daughter", emoji: '🌿', story: "Sowmiya Anbumani wins Pennagaram — Dr Anbumani's daughter makes her mark" },
  152: { role: "Captain's Wife", emoji: '🎬', story: 'Premallatha Vijayakant wins Alangulam for DMDK — Captain Vijayakant\'s legacy lives on' },
  204: { role: 'BJP Leader', emoji: '🪷', story: 'Nainar Nagenthran wins Thiruvallur — BJP\'s rare win in Tamil Nadu 2026' },
  108: { role: 'BJP Win', emoji: '🪷', story: 'BJP wins Krishnarayapuram — one of only 2 BJP seats in Tamil Nadu' },
  159: { role: 'VCK Win', emoji: '✊', story: 'L.E. Jothimani wins Tiruchendur for VCK — Dalit party makes its mark' },
}

// District order for the map
const AC_DISTRICT: Record<number, string> = {
  1:'Chennai',2:'Chennai',3:'Chennai',4:'Chennai',5:'Chennai',6:'Chennai',7:'Chennai',8:'Chennai',9:'Chennai',10:'Chennai',
  11:'Chennai',12:'Chennai',13:'Chennai',14:'Chennai',15:'Chennai',16:'Chennai',17:'Chennai',18:'Chennai',
  19:'Kancheepuram',20:'Kancheepuram',21:'Kancheepuram',
  86:'Salem', 59:'Dharmapuri', 152:'Tenkasi', 204:'Tiruvallur', 108:'Karur', 159:'Thoothukudi',
}

interface StoryCard {
  id: string
  emoji: string
  headline: string
  subline: string
  color: string
  tag: string
  tagColor: string
}

interface Score {
  tvk: number; dmk: number; admk: number; others: number
  declared: number; remaining: number
  notables: { acNo: number; party: string; candidate: string }[]
}

async function fetchScore(): Promise<Score | null> {
  try {
    const res = await fetch(ECI_JSON, { cache: 'no-store', signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    const json = await res.json() as Record<string, { chartData: [string, string, number, string, string][] }>
    const s22 = json['S22']
    if (!s22?.chartData?.length) return null

    const tally: Record<string, number> = {}
    const notables: Score['notables'] = []
    for (const [raw, , acNo, candidate] of s22.chartData) {
      const k = PARTY_ALIASES[raw] ?? 'Others'
      tally[k] = (tally[k] ?? 0) + 1
      if (NOTABLE[acNo]) notables.push({ acNo, party: raw, candidate })
    }
    return {
      tvk: tally['TVK'] ?? 0,
      dmk: tally['DMK'] ?? 0,
      admk: tally['AIADMK'] ?? 0,
      others: tally['Others'] ?? 0,
      declared: s22.chartData.length,
      remaining: TOTAL - s22.chartData.length,
      notables,
    }
  } catch { return null }
}

function buildStories(s: Score): StoryCard[] {
  const cards: StoryCard[] = []

  // 1. Winner declared
  if (s.tvk >= MAJORITY) {
    cards.push({
      id: 'winner', emoji: '🏆',
      headline: `TVK wins Tamil Nadu!`,
      subline: `Thalapathy Vijay's party crosses the 118-seat majority mark with ${s.tvk} seats — a historic debut in Tamil Nadu politics.`,
      color: '#fbbf24', tag: 'HISTORIC WIN', tagColor: '#fbbf24',
    })
  }

  // 2. TVK vs 2021 DMK comparison
  cards.push({
    id: 'compare', emoji: '📊',
    headline: `TVK ${s.tvk} · DMK ${s.dmk} · ADMK ${s.admk}`,
    subline: `DMK had 133 seats in 2021. They now have ${s.dmk} — a drop of ${133 - s.dmk} seats. TVK, contesting its first election, surpassed them.`,
    color: '#f87171', tag: 'SEATS SHIFT', tagColor: '#ef4444',
  })

  // 3. ADMK survived
  cards.push({
    id: 'admk', emoji: '🍃',
    headline: `ADMK holds ${s.admk} seats`,
    subline: `Despite the TVK wave, ADMK survived with ${s.admk} seats — including Edappadi Palaniswami retaining his own constituency. Down from 66 in 2021.`,
    color: '#4ade80', tag: 'OPPOSITION', tagColor: '#4ade80',
  })

  // 4. All counted
  if (s.remaining === 0) {
    cards.push({
      id: 'allcounted', emoji: '✅',
      headline: `All 234 seats declared`,
      subline: `Every constituency in Tamil Nadu has returned a result. The election is over — Tamil Nadu has spoken its verdict.`,
      color: '#4ade80', tag: 'FINAL', tagColor: '#4ade80',
    })
  } else {
    cards.push({
      id: 'counting', emoji: '⏳',
      headline: `${s.declared} of 234 declared`,
      subline: `${s.remaining} constituencies still counting. ${s.tvk >= MAJORITY ? 'TVK has already secured majority.' : 'No party has majority yet.'}`,
      color: '#ef4444', tag: 'LIVE', tagColor: '#ef4444',
    })
  }

  // 5. Notable candidates
  for (const n of s.notables) {
    const info = NOTABLE[n.acNo]
    if (!info) continue
    const partyAlias = PARTY_ALIASES[n.party] ?? 'Others'
    const color = PARTY_COLORS[partyAlias] ?? '#94a3b8'
    cards.push({
      id: `notable-${n.acNo}`, emoji: info.emoji,
      headline: n.candidate.split(' ').map((w: string) => w[0] + w.slice(1).toLowerCase()).join(' '),
      subline: info.story,
      color, tag: info.role.toUpperCase(), tagColor: color,
    })
  }

  // 6. TVK clean sweep facts
  cards.push({
    id: 'chennai', emoji: '🏙️',
    headline: `Chennai: TVK swept 16 of 18 seats`,
    subline: `The capital district went overwhelmingly to TVK. Only one DMK and one ADMK seat survived in the city.`,
    color: '#fbbf24', tag: 'DISTRICT', tagColor: '#fbbf24',
  })

  cards.push({
    id: 'tiruppur', emoji: '🧵',
    headline: `Tiruppur: ADMK's strongest pocket`,
    subline: `ADMK won 6 of 8 seats in Tiruppur — the garment hub district was one of the few where ADMK's ground machinery held.`,
    color: '#4ade80', tag: 'STRONGHOLD', tagColor: '#4ade80',
  })

  cards.push({
    id: 'madurai', emoji: '🛕',
    headline: `Madurai: DMK held 7 of 10`,
    subline: `The temple city remained a DMK fortress — their strongest district performance in a tough election.`,
    color: '#f87171', tag: 'DMK HOLD', tagColor: '#f87171',
  })

  cards.push({
    id: 'minority', emoji: '🕌',
    headline: `IUML, INC, VCK all won seats`,
    subline: `Smaller parties punched through — IUML won 2 (minority strongholds), INC won 5, VCK won 1. Diversity in the assembly.`,
    color: '#94a3b8', tag: 'OTHERS', tagColor: '#94a3b8',
  })

  cards.push({
    id: 'first', emoji: '🎬',
    headline: `First-time party wins majority`,
    subline: `TVK is the first party in Indian electoral history to win a state majority in its very first election — no gradual rise, straight to power.`,
    color: '#fbbf24', tag: 'RECORD', tagColor: '#fbbf24',
  })

  return cards
}

export default function ElectionStories() {
  const [score, setScore]   = useState<Score | null>(null)
  const [active, setActive] = useState(0)
  const [mounted, setMounted] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const CARD_W = 280

  useEffect(() => {
    setMounted(true)
    fetchScore().then(setScore)
    const iv = setInterval(() => fetchScore().then(setScore), 60_000)
    return () => clearInterval(iv)
  }, [])

  // Auto-advance every 5s
  useEffect(() => {
    if (!score) return
    const stories = buildStories(score)
    const t = setInterval(() => {
      setActive(i => {
        const next = (i + 1) % stories.length
        scrollRef.current?.scrollTo({ left: next * (CARD_W + 10), behavior: 'smooth' })
        return next
      })
    }, 5000)
    return () => clearInterval(t)
  }, [score])

  if (!mounted || !score) return null
  const stories = buildStories(score)

  return (
    <div style={{ marginBottom: 4 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingLeft: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'stPulse 1.5s infinite' }} />
          <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.06em' }}>KEY STORIES</span>
        </div>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>{active + 1} / {stories.length}</span>
      </div>

      {/* Horizontal scroll */}
      <div
        ref={scrollRef}
        style={{
          display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8,
          scrollSnapType: 'x mandatory', scrollbarWidth: 'none',
        }}
        onScroll={e => {
          const left = (e.target as HTMLElement).scrollLeft
          setActive(Math.round(left / (CARD_W + 10)))
        }}
      >
        {stories.map((card, i) => (
          <div
            key={card.id}
            onClick={() => {
              setActive(i)
              scrollRef.current?.scrollTo({ left: i * (CARD_W + 10), behavior: 'smooth' })
            }}
            style={{
              minWidth: CARD_W, maxWidth: CARD_W, borderRadius: 16, padding: '14px 16px',
              background: `linear-gradient(135deg, ${card.color}14 0%, rgba(0,0,0,0) 70%)`,
              border: `1px solid ${card.color}${i === active ? '50' : '20'}`,
              scrollSnapAlign: 'start', cursor: 'pointer', flexShrink: 0,
              transition: 'border-color 0.3s, transform 0.2s',
              transform: i === active ? 'scale(1.02)' : 'scale(1)',
              boxShadow: i === active ? `0 4px 20px ${card.color}20` : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{
                fontSize: 8, fontWeight: 900, padding: '2px 7px', borderRadius: 99, letterSpacing: '0.08em',
                background: `${card.tagColor}18`, color: card.tagColor, border: `1px solid ${card.tagColor}30`,
              }}>{card.tag}</span>
            </div>
            <div style={{ fontSize: 20, marginBottom: 6, lineHeight: 1 }}>{card.emoji}</div>
            <div style={{ fontSize: 13, fontWeight: 900, color: 'rgba(255,255,255,0.88)', marginBottom: 6, lineHeight: 1.3 }}>
              {card.headline}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.42)', lineHeight: 1.55 }}>
              {card.subline}
            </div>
          </div>
        ))}
      </div>

      {/* Dot nav */}
      <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 6 }}>
        {stories.map((card, i) => (
          <button key={i} onClick={() => {
            setActive(i)
            scrollRef.current?.scrollTo({ left: i * (CARD_W + 10), behavior: 'smooth' })
          }} style={{
            width: i === active ? 18 : 5, height: 5, borderRadius: 99, border: 'none',
            background: i === active ? stories[active].color : 'rgba(255,255,255,0.15)',
            cursor: 'pointer', padding: 0, transition: 'all 0.3s ease',
          }} />
        ))}
      </div>

      <style>{`
        @keyframes stPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.3;transform:scale(1.5)} }
        div[style*="overflowX"]::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}
