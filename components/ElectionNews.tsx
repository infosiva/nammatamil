'use client'

/**
 * ElectionNews — Major headlines from TN Election 2026.
 * Curated key stories — facts, records, milestones.
 */

import { useState } from 'react'

const NEWS: {
  tag: string
  tagColor: string
  emoji: string
  headline: string
  detail: string
  source: string
  time: string
}[] = [
  {
    tag: 'HISTORIC',
    tagColor: '#fbbf24',
    emoji: '🏆',
    headline: 'TVK wins majority in debut election — first in Indian history',
    detail: 'Thalapathy Vijay\'s Tamilaga Vettri Kazhagam won 110 seats in its very first state assembly election — the only party in Indian political history to win a state majority on debut.',
    source: 'ECI Results',
    time: 'May 4, 2026',
  },
  {
    tag: 'VERDICT',
    tagColor: '#4ade80',
    emoji: '🗳️',
    headline: 'All 234 seats declared — TN has given a clear mandate',
    detail: 'Counting concluded with all 234 Tamil Nadu assembly constituencies returning results. TVK: 110, DMK Alliance: 71, ADMK Alliance: 51, BJP: 1, Others: 1.',
    source: 'ECI',
    time: 'May 4, 2026',
  },
  {
    tag: 'COLLAPSE',
    tagColor: '#f87171',
    emoji: '📉',
    headline: 'DMK crashes from 133 seats (2021) to 59 — TVK takes the progressive vote',
    detail: 'The ruling DMK, which had 133 seats in 2021, was reduced to 59 seats as TVK absorbed a large chunk of the progressive, urban, and youth vote across Tamil Nadu.',
    source: 'Analysis',
    time: 'May 4, 2026',
  },
  {
    tag: 'SURVIVED',
    tagColor: '#4ade80',
    emoji: '🍃',
    headline: 'Edappadi Palaniswami wins his Edappadi seat — ADMK holds 51',
    detail: 'ADMK chief E. Palaniswami retained his home constituency of Edappadi in Salem district despite the massive TVK wave. ADMK + PMK + DMDK together secured 51 seats.',
    source: 'ECI',
    time: 'May 4, 2026',
  },
  {
    tag: 'BJP',
    tagColor: '#fb923c',
    emoji: '🪷',
    headline: 'BJP wins just 1 seat — Nainar Nagenthran loses in Vellore',
    detail: 'BJP managed only 1 seat in Tamil Nadu, while state president Nainar Nagenthran lost in Vellore South. BJP\'s influence remains minimal in the state.',
    source: 'ECI',
    time: 'May 4, 2026',
  },
  {
    tag: 'CAPITAL',
    tagColor: '#fbbf24',
    emoji: '🏙️',
    headline: 'Chennai sweeps to TVK — 16 of 18 seats go gold',
    detail: 'The state capital gave an overwhelming verdict for TVK, winning 16 of 18 Chennai constituencies. Only one DMK and one ADMK seat survived the wave in the city.',
    source: 'ECI District Results',
    time: 'May 4, 2026',
  },
  {
    tag: 'DEBUT',
    tagColor: '#fbbf24',
    emoji: '⭐',
    headline: 'Vijay transitions from cinema to governance — CM-designate',
    detail: 'Tamil cinema superstar Thalapathy Vijay, who announced TVK in 2024, will now lead Tamil Nadu as Chief Minister. His party crossed majority with 110 seats from 234.',
    source: 'Political Desk',
    time: 'May 4, 2026',
  },
  {
    tag: 'MAJORITY',
    tagColor: '#fbbf24',
    emoji: '📊',
    headline: 'TVK wins with +8 buffer above majority — stable government assured',
    detail: 'With 110 seats against the 118-seat majority mark in a 234-seat assembly, TVK governs alone without needing any coalition support. A stable, comfortable majority.',
    source: 'Analysis',
    time: 'May 4, 2026',
  },
]

export default function ElectionNews() {
  const [expanded, setExpanded] = useState<number | null>(null)
  const [showAll, setShowAll]   = useState(false)

  const visible = showAll ? NEWS : NEWS.slice(0, 5)

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
          <span style={{ fontSize: 14 }}>📰</span>
          <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.07em' }}>
            ELECTION KEY STORIES
          </span>
        </div>
        <span style={{
          fontSize: 8, fontWeight: 900, padding: '2px 8px', borderRadius: 99,
          background: 'rgba(74,222,128,0.1)', color: '#4ade80',
          border: '1px solid rgba(74,222,128,0.2)',
        }}>
          ✓ FINAL
        </span>
      </div>

      {/* News items */}
      <div>
        {visible.map((item, i) => (
          <div
            key={i}
            onClick={() => setExpanded(expanded === i ? null : i)}
            style={{
              padding: '10px 14px',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              cursor: 'pointer',
              background: expanded === i ? 'rgba(255,255,255,0.02)' : 'transparent',
              transition: 'background 0.2s',
            }}
          >
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{item.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Tag + time */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{
                    fontSize: 7, fontWeight: 900, padding: '1px 6px', borderRadius: 99,
                    background: `${item.tagColor}15`, color: item.tagColor,
                    border: `1px solid ${item.tagColor}30`, letterSpacing: '0.08em',
                  }}>
                    {item.tag}
                  </span>
                  <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>{item.time}</span>
                </div>

                {/* Headline */}
                <div style={{
                  fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.8)',
                  lineHeight: 1.4, marginBottom: expanded === i ? 8 : 0,
                }}>
                  {item.headline}
                </div>

                {/* Expanded detail */}
                {expanded === i && (
                  <div style={{
                    fontSize: 10, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6,
                    borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 8,
                  }}>
                    {item.detail}
                    <div style={{ marginTop: 6, fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>
                      Source: {item.source}
                    </div>
                  </div>
                )}
              </div>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', flexShrink: 0, marginTop: 4 }}>
                {expanded === i ? '▲' : '▼'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Show more */}
      {NEWS.length > 5 && (
        <button
          onClick={() => setShowAll(v => !v)}
          style={{
            width: '100%', padding: '9px', background: 'none', border: 'none',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            color: 'rgba(255,255,255,0.3)', fontSize: 10, cursor: 'pointer',
            fontFamily: 'inherit', fontWeight: 700,
          }}
        >
          {showAll ? '↑ Show fewer stories' : `↓ Show all ${NEWS.length} stories`}
        </button>
      )}
    </div>
  )
}
