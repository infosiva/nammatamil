'use client'

/**
 * VoteMarginHighlights — Shows:
 * - Key VIPs who won/lost
 * - Biggest margins (landslide wins)
 * - Closest races (nail-biter results)
 *
 * Data from ECI constituency-level JSON files.
 * Structure: https://results.eci.gov.in/ResultAcGenMay2026/ConstituencywiseS221.json
 * Each file has: { "": { "Results": [{ cand_name, party_name, total_votes, status }] } }
 */

import { useState, useEffect } from 'react'

// ECI base URL for constituency-level data
const ECI_BASE = 'https://results.eci.gov.in/ResultAcGenMay2026'

const ALIAS: Record<string, string> = {
  TVK: 'TVK', TAMILAGA: 'TVK',
  DMK: 'DMK', INC: 'DMK', CPI: 'DMK', VCK: 'DMK', IUML: 'DMK', MDMK: 'DMK',
  ADMK: 'ADMK', AIADMK: 'ADMK', PMK: 'ADMK', DMDK: 'ADMK', BJP: 'ADMK', PT: 'ADMK',
}

const PARTY_COLOR: Record<string, string> = {
  TVK: '#fbbf24', DMK: '#f87171', ADMK: '#4ade80', Others: '#94a3b8',
}

// Notable candidates with their AC numbers
const NOTABLE: Record<number, { name: string; role: string; party: string }> = {
  10:  { name: 'Udhayanidhi Stalin', role: 'Deputy CM candidate', party: 'DMK' },
  53:  { name: 'Edappadi Palaniswami', role: 'Opp. Leader', party: 'ADMK' },
  4:   { name: 'M.K. Stalin', role: 'CM (Kolathur)', party: 'DMK' },
  47:  { name: 'Sowmiya Anbumani', role: 'PMK (Pennagaram)', party: 'ADMK' },
}

interface CandResult {
  name: string; party: string; alliance: string; votes: number; status: string
}

interface ACResult {
  acNo: number; acName: string; district: string
  winner: CandResult; runnerUp: CandResult
  margin: number; totalVotes: number
}

function partyToAlliance(party: string): string {
  const p = party.toUpperCase().replace(/[^A-Z()]/g, '')
  return ALIAS[p] ?? 'Others'
}

// Fetch a single constituency result
async function fetchAC(acNo: number, acName: string, district: string): Promise<ACResult | null> {
  try {
    const url = `${ECI_BASE}/ConstituencywiseS22${acNo}.json`
    const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null
    const json = await res.json() as Record<string, { Results?: { cand_name: string; party_name: string; total_votes: string; status: string }[] }>

    const key = Object.keys(json)[0]
    const results = json[key]?.Results
    if (!results?.length) return null

    const sorted = results
      .map(r => ({
        name: r.cand_name,
        party: r.party_name,
        alliance: partyToAlliance(r.party_name),
        votes: parseInt(r.total_votes?.replace(/,/g, '') ?? '0', 10) || 0,
        status: r.status ?? '',
      }))
      .sort((a, b) => b.votes - a.votes)

    if (sorted.length < 2) return null

    const [winner, runnerUp] = sorted
    const margin = winner.votes - runnerUp.votes
    const totalVotes = sorted.reduce((s, c) => s + c.votes, 0)

    return { acNo, acName, district, winner, runnerUp, margin, totalVotes }
  } catch { return null }
}

// Seats to fetch for VIP + margin highlights
const FETCH_SEATS: { acNo: number; acName: string; district: string }[] = [
  { acNo: 10,  acName: 'Chepauk-Thiruvallikeni', district: 'Chennai' },
  { acNo: 53,  acName: 'Edappadi',               district: 'Salem' },
  { acNo: 4,   acName: 'Kolathur',               district: 'Chennai' },
  { acNo: 47,  acName: 'Pennagaram',             district: 'Dharmapuri' },
  { acNo: 108, acName: 'Krishnarayapuram',       district: 'Karur' },
  { acNo: 152, acName: 'Alangulam',              district: 'Tenkasi' },
  { acNo: 92,  acName: 'Coimbatore North',       district: 'Coimbatore' },
  { acNo: 1,   acName: 'Thiruvottiyur',          district: 'Chennai' },
]

function fmtVotes(n: number): string {
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`
  if (n >= 1000)   return `${(n / 1000).toFixed(1)}K`
  return `${n}`
}

export default function VoteMarginHighlights() {
  const [results, setResults] = useState<ACResult[]>([])
  const [mounted, setMounted] = useState(false)
  const [tab, setTab]         = useState<'vip' | 'biggest' | 'closest'>('vip')

  useEffect(() => {
    setMounted(true)
    Promise.all(
      FETCH_SEATS.map(s => fetchAC(s.acNo, s.acName, s.district))
    ).then(res => setResults(res.filter((r): r is ACResult => r !== null)))
  }, [])

  if (!mounted || results.length === 0) return null

  const sorted = [...results].sort((a, b) => b.margin - a.margin)
  const biggest = sorted.slice(0, 5)
  const closest = sorted.slice(-5).reverse()
  const vip     = results.filter(r => NOTABLE[r.acNo])

  const display = tab === 'vip' ? vip : tab === 'biggest' ? biggest : closest

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
          <span style={{ fontSize: 14 }}>🏅</span>
          <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.07em' }}>
            VOTE MARGINS &amp; VIP RESULTS
          </span>
        </div>
        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>Live ECI data</span>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        {([
          { id: 'vip',     label: '⭐ VIPs' },
          { id: 'biggest', label: '📈 Biggest wins' },
          { id: 'closest', label: '🔥 Closest races' },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '8px 4px',
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 9, fontWeight: tab === t.id ? 900 : 600,
            color: tab === t.id ? '#fbbf24' : 'rgba(255,255,255,0.3)',
            borderBottom: tab === t.id ? '2px solid #fbbf24' : '2px solid transparent',
            fontFamily: 'inherit', letterSpacing: '0.04em',
            transition: 'color 0.2s',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Results */}
      <div>
        {display.length === 0 && (
          <div style={{ padding: 20, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
            Loading constituency data…
          </div>
        )}

        {display.map((r, i) => {
          const winColor  = PARTY_COLOR[r.winner.alliance] ?? '#94a3b8'
          const loseColor = PARTY_COLOR[r.runnerUp.alliance] ?? '#94a3b8'
          const notable   = NOTABLE[r.acNo]
          const marginPct = r.totalVotes > 0 ? ((r.margin / r.totalVotes) * 100).toFixed(1) : '?'
          const isTight   = r.margin < 5000

          return (
            <div key={r.acNo} style={{
              padding: '12px 14px',
              borderBottom: '1px solid rgba(255,255,255,0.03)',
              background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
            }}>
              {/* AC name + district */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.25)' }}>#{i + 1}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>{r.acName}</span>
                <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)' }}>{r.district}</span>
                {isTight && (
                  <span style={{
                    fontSize: 7, fontWeight: 900, padding: '1px 5px', borderRadius: 99,
                    background: 'rgba(239,68,68,0.15)', color: '#ef4444',
                    border: '1px solid rgba(239,68,68,0.3)',
                  }}>🔥 TIGHT</span>
                )}
                {notable && (
                  <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>{notable.role}</span>
                )}
              </div>

              {/* Winner row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 10, color: '#4ade80' }}>✓</span>
                  <span style={{ fontSize: 12, fontWeight: 900, color: winColor }}>{r.winner.name}</span>
                  <span style={{
                    fontSize: 7, padding: '1px 5px', borderRadius: 4,
                    background: `${winColor}20`, color: winColor, fontWeight: 700,
                  }}>{r.winner.alliance}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 900, color: winColor, fontVariantNumeric: 'tabular-nums' }}>
                  {fmtVotes(r.winner.votes)}
                </span>
              </div>

              {/* Runner-up row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>✗</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)' }}>{r.runnerUp.name}</span>
                  <span style={{
                    fontSize: 7, padding: '1px 5px', borderRadius: 4,
                    background: `${loseColor}15`, color: loseColor, fontWeight: 700, opacity: 0.7,
                  }}>{r.runnerUp.alliance}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.35)', fontVariantNumeric: 'tabular-nums' }}>
                  {fmtVotes(r.runnerUp.votes)}
                </span>
              </div>

              {/* Margin bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 99,
                    width: `${Math.min(100, parseFloat(marginPct) * 2)}%`,
                    background: isTight ? '#ef4444' : winColor,
                    transition: 'width 1s ease',
                  }} />
                </div>
                <span style={{ fontSize: 9, fontWeight: 800, color: isTight ? '#ef4444' : 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  margin: {fmtVotes(r.margin)} ({marginPct}%)
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{
        padding: '7px 14px',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        fontSize: 8, color: 'rgba(255,255,255,0.15)',
      }}>
        Data from ECI official constituency-wise results · Votes from final declared tally
      </div>
    </div>
  )
}
