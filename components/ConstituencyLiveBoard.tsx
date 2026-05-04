'use client'

/**
 * ConstituencyLiveBoard — Tamil Nadu 2026 live per-constituency results
 *
 * Displays all 234 seats in a filterable grid.
 * Auto-refreshes every 90 seconds during counting.
 * Color-coded by leading party. Animated updates.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, RefreshCw, MapPin, Zap, ChevronDown } from 'lucide-react'

interface ConstituencyResult {
  id: number
  name: string
  district: string
  leadingParty: string | null
  leadingCandidate: string | null
  margin: number | null
  votesLeading: number | null
  status: 'pending' | 'leading' | 'won'
  updatedAt: string
}

interface ConstituenciesResponse {
  constituencies: ConstituencyResult[]
  totalReporting: number
  totalSeats: number
  updatedAt: string
  source: string
  fallbackLevel: number
  cached?: boolean
}

const PARTY_COLORS: Record<string, string> = {
  TVK:    '#fbbf24',
  DMK:    '#f87171',
  AIADMK: '#4ade80',
  BJP:    '#fb923c',
  Others: '#94a3b8',
}

const PARTY_BG: Record<string, string> = {
  TVK:    'rgba(251,191,36,0.10)',
  DMK:    'rgba(248,113,113,0.10)',
  AIADMK: 'rgba(74,222,128,0.10)',
  BJP:    'rgba(251,146,60,0.10)',
  Others: 'rgba(148,163,184,0.08)',
}

const REFRESH_MS = 90 * 1000  // 90 seconds

const ALL_DISTRICTS = 'All Districts'

function formatMargin(n: number | null): string {
  if (n === null) return ''
  if (n >= 1000) return `+${(n / 1000).toFixed(1)}K`
  return `+${n}`
}

// ── Single constituency card ──────────────────────────────────────────────────
function ConstCard({
  c,
  flash,
}: {
  c: ConstituencyResult
  flash: boolean
}) {
  const color  = c.leadingParty ? PARTY_COLORS[c.leadingParty] ?? '#94a3b8' : 'rgba(255,255,255,0.12)'
  const bg     = c.leadingParty ? PARTY_BG[c.leadingParty]    ?? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)'
  const isWon  = c.status === 'won'
  const isPend = c.status === 'pending'

  return (
    <div
      style={{
        borderRadius: 14,
        padding: '12px 14px',
        background: isPend ? 'rgba(255,255,255,0.02)' : bg,
        border: `1px solid ${isPend ? 'rgba(255,255,255,0.06)' : color + '40'}`,
        boxShadow: flash ? `0 0 18px ${color}35` : 'none',
        transition: 'all 0.4s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Flash overlay on update */}
      {flash && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `${color}15`,
          borderRadius: 14,
          animation: 'fadeOut 1.2s ease forwards',
          pointerEvents: 'none',
        }} />
      )}

      {/* Won badge */}
      {isWon && (
        <div style={{
          position: 'absolute', top: 8, right: 8,
          fontSize: 8, fontWeight: 900, padding: '2px 6px', borderRadius: 99,
          background: `${color}25`, color, border: `1px solid ${color}50`,
          letterSpacing: '0.08em',
        }}>WON</div>
      )}

      {/* Constituency name */}
      <div style={{ fontSize: 11, fontWeight: 800, color: isPend ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.9)', marginBottom: 2, paddingRight: isWon ? 36 : 0 }}>
        {c.name}
      </div>
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.22)', marginBottom: 8 }}>
        {c.district}
      </div>

      {isPend ? (
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)', fontWeight: 600 }}>
          Counting pending…
        </div>
      ) : (
        <>
          {/* Party pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            <span style={{
              fontSize: 10, fontWeight: 900, padding: '2px 9px', borderRadius: 99,
              background: `${color}22`, color, border: `1px solid ${color}40`,
            }}>
              {c.leadingParty}
            </span>
            {c.margin !== null && (
              <span style={{ fontSize: 10, fontWeight: 700, color }}>
                {formatMargin(c.margin)}
              </span>
            )}
          </div>
          {/* Candidate name */}
          {c.leadingCandidate && (
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {c.leadingCandidate}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Party summary strip ───────────────────────────────────────────────────────
function PartySummary({ constituencies }: { constituencies: ConstituencyResult[] }) {
  const counts: Record<string, number> = {}
  for (const c of constituencies) {
    if (c.leadingParty) counts[c.leadingParty] = (counts[c.leadingParty] ?? 0) + 1
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  const total  = constituencies.filter(c => c.leadingParty).length

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {sorted.map(([party, count]) => {
        const color = PARTY_COLORS[party] ?? '#94a3b8'
        const pct   = total > 0 ? Math.round((count / 234) * 100) : 0
        return (
          <div key={party} style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '6px 14px', borderRadius: 99,
            background: `${color}12`, border: `1px solid ${color}35`,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{ fontWeight: 900, fontSize: 13, color }}>{party}</span>
            <span style={{ fontWeight: 900, fontSize: 16, color, fontVariantNumeric: 'tabular-nums' }}>{count}</span>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{pct}%</span>
          </div>
        )
      })}
      {total > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', padding: '6px 12px', borderRadius: 99, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>{total} / 234 reporting</span>
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ConstituencyLiveBoard() {
  const [data, setData]           = useState<ConstituenciesResponse | null>(null)
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch]       = useState('')
  const [district, setDistrict]   = useState(ALL_DISTRICTS)
  const [partyFilter, setPartyFilter] = useState('All')
  const [flashIds, setFlashIds]   = useState<Set<number>>(new Set())
  const [secondsAgo, setSecondsAgo] = useState(0)
  const prevDataRef               = useRef<Map<number, string>>(new Map())

  const fetchData = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true)
    try {
      const res = await fetch('/api/election-results/constituencies', {
        cache: 'no-store',
        signal: AbortSignal.timeout(12000),
      })
      if (!res.ok) return
      const next: ConstituenciesResponse = await res.json()

      // Find seats that changed since last fetch
      const newFlash = new Set<number>()
      const prevMap = prevDataRef.current
      for (const c of next.constituencies) {
        const prevParty = prevMap.get(c.id)
        if (c.leadingParty && prevParty !== c.leadingParty) newFlash.add(c.id)
      }
      // Update prevMap
      for (const c of next.constituencies) {
        if (c.leadingParty) prevDataRef.current.set(c.id, c.leadingParty)
      }

      setData(next)
      if (newFlash.size > 0) {
        setFlashIds(newFlash)
        setTimeout(() => setFlashIds(new Set()), 1500)
      }
      setSecondsAgo(0)
    } catch { /* keep previous */ }
    finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => {
    fetchData()
    const dataId = setInterval(() => fetchData(), REFRESH_MS)
    const tickId = setInterval(() => setSecondsAgo(s => s + 1), 1000)
    return () => { clearInterval(dataId); clearInterval(tickId) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const constituencies = data?.constituencies ?? []

  // Build district list from data
  const districts = [ALL_DISTRICTS, ...Array.from(new Set(constituencies.map(c => c.district))).sort()]
  const parties   = ['All', 'TVK', 'DMK', 'AIADMK', 'BJP', 'Others', 'Pending']

  // Filter
  const filtered = constituencies.filter(c => {
    const q = search.toLowerCase()
    if (q && !c.name.toLowerCase().includes(q) && !c.district.toLowerCase().includes(q) && !(c.leadingCandidate ?? '').toLowerCase().includes(q)) return false
    if (district !== ALL_DISTRICTS && c.district !== district) return false
    if (partyFilter === 'Pending' && c.status !== 'pending') return false
    if (partyFilter !== 'All' && partyFilter !== 'Pending' && c.leadingParty !== partyFilter) return false
    return true
  })

  const totalReporting = data?.totalReporting ?? 0
  const source         = data?.source ?? 'pending'
  const isLive         = source === 'eci-live' || source === 'ai-parsed'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Header ── */}
      <div style={{
        borderRadius: 20, overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(220,38,38,0.05) 100%)',
        border: '1px solid rgba(251,191,36,0.2)',
      }}>
        {/* Top bar */}
        <div style={{
          padding: '14px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(251,191,36,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '5px 14px', borderRadius: 99,
              background: isLive ? 'rgba(239,68,68,0.15)' : 'rgba(251,191,36,0.1)',
              border: `1px solid ${isLive ? 'rgba(239,68,68,0.4)' : 'rgba(251,191,36,0.3)'}`,
            }}>
              {isLive && (
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
              )}
              <span style={{ fontSize: 10, fontWeight: 900, color: isLive ? '#ef4444' : '#fbbf24', letterSpacing: '0.08em' }}>
                {isLive ? 'LIVE COUNTING' : 'TN ELECTION 2026'}
              </span>
            </div>
            <span style={{ fontWeight: 800, fontSize: 15, color: 'rgba(255,255,255,0.85)' }}>
              Constituency Results
            </span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
              234 seats · TN Assembly
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>
              {refreshing ? 'Refreshing…' : secondsAgo < 60 ? `${secondsAgo}s ago` : `${Math.floor(secondsAgo / 60)}m ago`}
            </span>
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'rgba(255,255,255,0.3)' }}
            >
              <RefreshCw style={{ width: 15, height: 15, animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            </button>
          </div>
        </div>

        {/* Party summary */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          {loading ? (
            <div style={{ height: 36, borderRadius: 99, background: 'rgba(255,255,255,0.05)', animation: 'shimmer 1.5s infinite', backgroundSize: '200% 100%' }} />
          ) : (
            <PartySummary constituencies={constituencies} />
          )}
        </div>

        {/* Progress bar */}
        {!loading && (
          <div style={{ padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Seats Reporting
              </span>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {totalReporting} / 234
              </span>
            </div>
            <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 99,
                width: `${(totalReporting / 234) * 100}%`,
                background: 'linear-gradient(90deg, #fbbf24, #ef4444)',
                transition: 'width 1s ease',
              }} />
            </div>
            <div style={{ marginTop: 5, fontSize: 8, color: 'rgba(255,255,255,0.18)' }}>
              Auto-updates every 90 seconds · {source === 'eci-live' ? 'ECI official' : source === 'ai-parsed' ? 'AI news parse' : source === 'pending' ? 'Counting not started' : source}
            </div>
          </div>
        )}

        {/* ── Filters ── */}
        <div style={{ padding: '12px 20px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
            <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: 'rgba(255,255,255,0.25)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search constituency or candidate…"
              style={{
                width: '100%', padding: '8px 12px 8px 30px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, color: 'rgba(255,255,255,0.8)', fontSize: 12, outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* District dropdown */}
          <div style={{ position: 'relative' }}>
            <select
              value={district}
              onChange={e => setDistrict(e.target.value)}
              style={{
                padding: '8px 32px 8px 12px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, color: 'rgba(255,255,255,0.7)', fontSize: 12, outline: 'none',
                appearance: 'none', cursor: 'pointer', minWidth: 120,
              }}
            >
              {districts.map(d => <option key={d} value={d} style={{ background: '#1a0a2e' }}>{d}</option>)}
            </select>
            <ChevronDown style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
          </div>

          {/* Party filter pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {parties.map(p => {
              const color = p !== 'All' && p !== 'Pending' ? PARTY_COLORS[p] ?? '#94a3b8' : '#94a3b8'
              const active = partyFilter === p
              return (
                <button
                  key={p}
                  onClick={() => setPartyFilter(p)}
                  style={{
                    padding: '5px 11px', borderRadius: 99, fontSize: 10, fontWeight: 800, cursor: 'pointer', border: 'none',
                    background: active ? `${color}25` : 'rgba(255,255,255,0.05)',
                    color: active ? color : 'rgba(255,255,255,0.35)',
                    outline: active ? `1px solid ${color}50` : '1px solid transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  {p}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Result count ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 4 }}>
        <MapPin style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.25)' }} />
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
          {filtered.length} of 234 constituencies
          {search && ` · "${search}"`}
          {district !== ALL_DISTRICTS && ` · ${district}`}
          {partyFilter !== 'All' && ` · ${partyFilter}`}
        </span>
        {flashIds.size > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#fbbf24', fontWeight: 700 }}>
            <Zap style={{ width: 11, height: 11 }} />
            {flashIds.size} updated
          </span>
        )}
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 10,
        }}>
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} style={{
              height: 90, borderRadius: 14,
              background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
            }} />
          ))}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
          gap: 10,
        }}>
          {filtered.map(c => (
            <ConstCard
              key={c.id}
              c={c}
              flash={flashIds.has(c.id)}
            />
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
              No constituencies match your filters.
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes fadeOut {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        select option { background: #1a0a2e; }
      `}</style>
    </div>
  )
}
