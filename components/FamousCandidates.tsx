'use client'

/**
 * FamousCandidates — Live cards for notable candidates from ECI data.
 * Shows win/lose status, seat name, party badge.
 */

import { useState, useEffect } from 'react'

const ECI_JSON = 'https://results.eci.gov.in/ResultAcGenMay2026/election-json-S22-live.json'

const PARTY_COLORS: Record<string, string> = {
  TVK:'#fbbf24', DMK:'#f87171', ADMK:'#4ade80', BJP:'#fb923c',
  PMK:'#a78bfa', INC:'#38bdf8', VCK:'#34d399', DMDK:'#f59e0b',
  IUML:'#10b981', Others:'#94a3b8',
}
const PARTY_EMOJI: Record<string, string> = {
  TVK:'⭐', DMK:'🌅', ADMK:'🍃', BJP:'🪷', PMK:'🌿',
  INC:'✋', VCK:'✊', DMDK:'🎬', IUML:'🕌', Others:'🏛️',
}
const PARTY_ALIAS: Record<string, string> = {
  TVK:'TVK', DMK:'DMK', ADMK:'ADMK', AIADMK:'ADMK', BJP:'BJP',
  PMK:'PMK', INC:'INC', 'CPI(M)':'Others', CPI:'Others',
  VCK:'VCK', DMDK:'DMDK', IUML:'IUML', AMMKMNKZ:'Others', PT:'Others',
}

// Notable candidates: acNo → display data
const NOTABLE_SEATS: { acNo: number; label: string; name: string; desc: string }[] = [
  { acNo: 4,   label: 'Deputy CM',       name: 'Udhayanidhi Stalin', desc: 'Kolathur, Chennai' },
  { acNo: 53,  label: 'Opposition Leader', name: 'Edappadi Palaniswami', desc: 'Edappadi, Salem' },
  { acNo: 47,  label: "PMK Leader's Daughter", name: 'Sowmiya Anbumani', desc: 'Pennagaram, Dharmapuri' },
  { acNo: 152, label: "Captain's Legacy", name: 'Premallatha Vijayakant', desc: 'Alangulam, Tenkasi' },
  { acNo: 18,  label: 'Cabinet Minister', name: 'Sekarbabu', desc: 'Sholinganallur, Chennai' },
  { acNo: 204, label: 'BJP Leader',       name: 'Nainar Nagenthran', desc: 'Thiruvallur, Tiruvallur' },
]

interface CandidateResult {
  acNo: number
  party: string
  candidate: string
  won: boolean
}

async function fetchResults(): Promise<CandidateResult[]> {
  try {
    const res = await fetch(ECI_JSON, { cache: 'no-store', signal: AbortSignal.timeout(8000) })
    if (!res.ok) return []
    const json = await res.json() as Record<string, { chartData: [string, string, number, string, string][] }>
    const s22 = json['S22']
    if (!s22?.chartData?.length) return []
    const acos = new Set(NOTABLE_SEATS.map(n => n.acNo))
    return s22.chartData
      .filter(([, , acNo]) => acos.has(acNo))
      .map(([raw, , acNo, candidate]) => ({
        acNo,
        party: PARTY_ALIAS[raw] ?? 'Others',
        candidate,
        won: true, // if declared in chartData = winner
      }))
  } catch { return [] }
}

export default function FamousCandidates() {
  const [results, setResults] = useState<CandidateResult[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchResults().then(setResults)
    const iv = setInterval(() => fetchResults().then(setResults), 90_000)
    return () => clearInterval(iv)
  }, [])

  if (!mounted) return null

  const resultMap = new Map(results.map(r => [r.acNo, r]))

  return (
    <div style={{ marginBottom: 4 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10, paddingLeft: 2 }}>
        <span style={{ fontSize: 12 }}>⭐</span>
        <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.06em' }}>NOTABLE CANDIDATES</span>
      </div>

      {/* Horizontal scroll */}
      <div style={{
        display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6,
        scrollbarWidth: 'none',
      }}>
        {NOTABLE_SEATS.map(seat => {
          const live = resultMap.get(seat.acNo)
          const color = live ? (PARTY_COLORS[live.party] ?? '#94a3b8') : '#6b7280'
          const emoji = live ? (PARTY_EMOJI[live.party] ?? '🏛️') : '⏳'
          const declared = !!live

          return (
            <div key={seat.acNo} style={{
              minWidth: 160, maxWidth: 160, borderRadius: 14, padding: '13px 14px',
              background: declared
                ? `linear-gradient(135deg, ${color}16 0%, rgba(0,0,0,0) 70%)`
                : 'rgba(255,255,255,0.025)',
              border: `1px solid ${declared ? color + '35' : 'rgba(255,255,255,0.07)'}`,
              flexShrink: 0,
              transition: 'border-color 0.3s',
            }}>
              {/* Status badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{
                  fontSize: 7, fontWeight: 900, padding: '2px 7px', borderRadius: 99,
                  letterSpacing: '0.08em',
                  background: declared ? `${color}18` : 'rgba(255,255,255,0.06)',
                  color: declared ? color : 'rgba(255,255,255,0.3)',
                  border: `1px solid ${declared ? color + '30' : 'rgba(255,255,255,0.08)'}`,
                }}>
                  {declared ? '✅ WON' : '⏳ COUNTING'}
                </span>
                <span style={{ fontSize: 20 }}>{emoji}</span>
              </div>

              {/* Name */}
              <div style={{ fontSize: 12, fontWeight: 900, color: declared ? color : 'rgba(255,255,255,0.55)', marginBottom: 3, lineHeight: 1.3 }}>
                {seat.name}
              </div>

              {/* Role label */}
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', marginBottom: 6, fontWeight: 700 }}>
                {seat.label}
              </div>

              {/* Constituency */}
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', lineHeight: 1.4 }}>
                {seat.desc}
              </div>

              {/* Party badge if declared */}
              {declared && (
                <div style={{
                  marginTop: 8, fontSize: 10, fontWeight: 900,
                  color: color, padding: '3px 8px', borderRadius: 99,
                  background: `${color}14`, border: `1px solid ${color}25`,
                  display: 'inline-block',
                }}>
                  {live?.party}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <style>{`
        div[style*="overflowX"]::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}
