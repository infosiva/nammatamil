'use client'

/**
 * ElectionResultsPanel — TN Election 2026 declared results
 * Fetches from /api/election-results. Auto-refreshes every 15 min.
 * Shows seat bar, party tallies, narrative. Links to /tn-election-2026.
 */

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { RefreshCw } from 'lucide-react'

interface PartyResult {
  name: string
  color: string
  emoji: string
  seatsWon: number
  seatsLeading: number
  totalTally: number
  hasMajority: boolean
  isLeading: boolean
}

interface ElectionData {
  phase: 'pre-counting' | 'counting' | 'declared'
  seatsReported: number
  totalSeats: number
  majorityMark: number
  parties: PartyResult[]
  narrative: string
  projectedWinner: string | null
  source: string
  updatedAt: string
}

const REFRESH_MS = 15 * 60 * 1000

export default function ElectionResultsPanel() {
  const [data, setData] = useState<ElectionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [secAgo, setSecAgo] = useState(0)

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true)
    try {
      const url = manual ? `/api/election-results?t=${Date.now()}` : '/api/election-results'
      const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(10000) })
      if (res.ok) {
        setData(await res.json())
        setSecAgo(0)
      }
    } catch { /* keep previous */ }
    finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => {
    load()
    const poll  = setInterval(() => load(), REFRESH_MS)
    const tick  = setInterval(() => setSecAgo(s => s + 1), 1000)
    return () => { clearInterval(poll); clearInterval(tick) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const parties = data?.parties ?? []
  const top3 = parties.slice(0, 3)
  // winner = majority holder, or projected winner, or simply party leading in most seats
  const winner = parties.find(p => p.hasMajority)
    ?? (data?.projectedWinner ? parties.find(p => p.name === data.projectedWinner) : null)
    ?? parties.find(p => p.isLeading)
  const TOTAL = data?.totalSeats ?? 234
  const MAJORITY = data?.majorityMark ?? 118
  const isDeclared = data?.phase === 'declared'
  const isCounting = data?.phase === 'counting'

  const freshLabel = secAgo < 5 ? 'just now' : secAgo < 60 ? `${secAgo}s ago` : `${Math.floor(secAgo / 60)}m ago`

  return (
    <Link href="/tn-election-2026" style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{
        borderRadius: 14,
        background: 'rgba(10,2,18,0.85)',
        border: `1px solid ${winner ? 'rgba(251,191,36,0.35)' : 'rgba(139,0,0,0.4)'}`,
        overflow: 'hidden',
        position: 'relative',
        backdropFilter: 'blur(8px)',
        transition: 'border-color 0.2s',
      }}>
        {/* Left accent */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'linear-gradient(180deg, #8B0000 0%, #FFC107 50%, #8B0000 100%)' }} />

        <div style={{ padding: '12px 14px 11px', paddingLeft: 18, position: 'relative', zIndex: 1 }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: 13 }}>🗳️</span>
              <span style={{ fontWeight: 800, fontSize: 12, color: '#FFC107', letterSpacing: '0.02em' }}>TN Election 2026</span>
              <span style={{
                padding: '1px 7px', borderRadius: 99, fontSize: 9, fontWeight: 900,
                background: isDeclared ? 'rgba(74,222,128,0.15)' : isCounting ? 'rgba(239,68,68,0.15)' : 'rgba(255,193,7,0.1)',
                color: isDeclared ? '#4ade80' : isCounting ? '#f87171' : '#fbbf24',
                border: `1px solid ${isDeclared ? 'rgba(74,222,128,0.3)' : isCounting ? 'rgba(239,68,68,0.3)' : 'rgba(255,193,7,0.2)'}`,
              }}>
                {isDeclared ? 'DECLARED' : isCounting ? 'LIVE' : 'RESULTS'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {!loading && (
                <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>
                  {refreshing ? 'updating…' : freshLabel}
                </span>
              )}
              <button
                onClick={e => { e.preventDefault(); load(true) }}
                disabled={refreshing}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'rgba(255,255,255,0.25)' }}
              >
                <RefreshCw style={{ width: 9, height: 9, animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              </button>
              <span style={{ fontSize: 9, color: '#FFC107', fontWeight: 700 }}>Full results →</span>
            </div>
          </div>

          {/* Seat bar */}
          {!loading && parties.length > 0 && (
            <div style={{ marginBottom: 7 }}>
              <div style={{ height: 7, borderRadius: 99, overflow: 'hidden', display: 'flex', gap: 1 }}>
                {parties.map((p, i) => (
                  <div key={p.name} style={{
                    width: `${(p.totalTally / TOTAL) * 100}%`,
                    background: p.color,
                    opacity: i === parties.length - 1 ? 0.3 : 0.85,
                    borderRadius: i === 0 ? '99px 0 0 99px' : i === parties.length - 1 ? '0 99px 99px 0' : 0,
                    minWidth: p.totalTally > 0 ? 2 : 0,
                  }} />
                ))}
              </div>
              {/* Majority marker */}
              <div style={{ position: 'relative', height: 10 }}>
                <div style={{ position: 'absolute', top: 0, left: `${(MAJORITY / TOTAL) * 100}%`, width: 1.5, height: 9, background: 'rgba(255,255,255,0.4)' }} />
                <span style={{ position: 'absolute', top: 1, left: `calc(${(MAJORITY / TOTAL) * 100}% + 3px)`, fontSize: 8, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>
                  {MAJORITY} maj
                </span>
              </div>
            </div>
          )}

          {/* Party chips */}
          {loading ? (
            <div style={{ display: 'flex', gap: 8 }}>
              {[100, 70, 55].map((w, i) => (
                <div key={i} style={{ height: 28, width: w, borderRadius: 8, background: 'rgba(255,255,255,0.06)', animation: 'shimmer 1.5s infinite' }} />
              ))}
            </div>
          ) : parties.length === 0 ? (
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', padding: '4px 0' }}>
              Fetching results from ECI…
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'nowrap' }}>
              {top3.map(p => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 10 }}>{p.emoji}</span>
                  <span style={{ fontWeight: 900, fontSize: 11, color: p.color }}>{p.name}</span>
                  <span style={{ fontWeight: 900, fontSize: 19, color: p.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{p.totalTally}</span>
                  {p.hasMajority && <span style={{ fontSize: 9, color: '#4ade80', fontWeight: 800 }}>✓</span>}
                </div>
              ))}
              <span style={{ marginLeft: 'auto', fontSize: 9, color: 'rgba(255,255,255,0.25)', whiteSpace: 'nowrap' }}>
                {data?.seatsReported ?? 0}/{TOTAL} seats
              </span>
            </div>
          )}

          {/* Narrative */}
          {!loading && data?.narrative && (
            <div style={{ marginTop: 8, padding: '6px 9px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.4, fontWeight: 600 }}>
                {data.narrative}
              </p>
            </div>
          )}

        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Link>
  )
}
