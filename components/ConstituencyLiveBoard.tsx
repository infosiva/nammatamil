'use client'

/**
 * ConstituencyLiveBoard — Tamil Nadu 2026 live per-constituency results
 *
 * Filterable grid of all 234 seats.
 * Auto-refreshes every 90 seconds during counting.
 * Color-coded by leading party. Flash animation on updates.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, Zap, ChevronDown } from 'lucide-react'

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

const REFRESH_MS = 90 * 1000

function formatMargin(n: number | null): string {
  if (n === null) return ''
  if (n >= 1000) return `+${(n / 1000).toFixed(1)}K`
  return `+${n}`
}

// ── Single constituency card ──────────────────────────────────────────────────
function ConstCard({ c, flash }: { c: ConstituencyResult; flash: boolean }) {
  const color  = c.leadingParty ? PARTY_COLORS[c.leadingParty] ?? '#94a3b8' : 'rgba(255,255,255,0.10)'
  const isPend = c.status === 'pending'
  const isWon  = c.status === 'won'

  return (
    <div style={{
      borderRadius: 12,
      padding: '11px 13px',
      background: isPend
        ? 'rgba(255,255,255,0.02)'
        : `${color}0e`,
      border: `1px solid ${isPend ? 'rgba(255,255,255,0.05)' : color + '38'}`,
      boxShadow: flash ? `0 0 16px ${color}30` : 'none',
      transition: 'box-shadow 0.4s ease',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Flash overlay */}
      {flash && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `${color}12`,
          animation: 'cFadeOut 1.4s ease forwards',
          pointerEvents: 'none',
        }} />
      )}

      {/* Won badge */}
      {isWon && (
        <div style={{
          position: 'absolute', top: 7, right: 7,
          fontSize: 7, fontWeight: 900, padding: '2px 5px', borderRadius: 99,
          background: `${color}22`, color, border: `1px solid ${color}45`,
        }}>WON</div>
      )}

      <div style={{ fontSize: 11, fontWeight: 800, color: isPend ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.88)', marginBottom: 1, paddingRight: isWon ? 34 : 0, lineHeight: 1.3 }}>
        {c.name}
      </div>
      <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', marginBottom: 7 }}>
        {c.district}
      </div>

      {isPend ? (
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.15)' }}>Pending…</div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 9, fontWeight: 900, padding: '2px 8px', borderRadius: 99,
            background: `${color}1e`, color, border: `1px solid ${color}38`,
          }}>
            {c.leadingParty}
          </span>
          {c.margin !== null && (
            <span style={{ fontSize: 9, fontWeight: 700, color, opacity: 0.85 }}>
              {formatMargin(c.margin)}
            </span>
          )}
          {c.leadingCandidate && (
            <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.28)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
              {c.leadingCandidate.split(' ').slice(0, 2).join(' ')}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// ── Party tally pills ─────────────────────────────────────────────────────────
function PartyPills({ constituencies }: { constituencies: ConstituencyResult[] }) {
  const counts: Record<string, { leading: number; won: number }> = {}
  for (const c of constituencies) {
    if (!c.leadingParty) continue
    if (!counts[c.leadingParty]) counts[c.leadingParty] = { leading: 0, won: 0 }
    if (c.status === 'won') counts[c.leadingParty].won++
    else counts[c.leadingParty].leading++
  }
  const sorted = Object.entries(counts).sort((a, b) => (b[1].won + b[1].leading) - (a[1].won + a[1].leading))
  if (sorted.length === 0) return null

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      {sorted.map(([party, { leading, won }]) => {
        const color = PARTY_COLORS[party] ?? '#94a3b8'
        return (
          <div key={party} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 12px', borderRadius: 99,
            background: `${color}10`, border: `1px solid ${color}30`,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{ fontWeight: 900, fontSize: 12, color }}>{party}</span>
            <span style={{ fontWeight: 900, fontSize: 14, color, fontVariantNumeric: 'tabular-nums' }}>{won + leading}</span>
            {won > 0 && <span style={{ fontSize: 8, color: '#4ade80', fontWeight: 700 }}>{won}W</span>}
            {leading > 0 && <span style={{ fontSize: 8, color: '#fbbf24', fontWeight: 700 }}>{leading}L</span>}
          </div>
        )
      })}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ConstituencyLiveBoard() {
  const [data, setData]               = useState<ConstituenciesResponse | null>(null)
  const [loading, setLoading]         = useState(true)
  const [refreshing, setRefreshing]   = useState(false)
  const [search, setSearch]           = useState('')
  const [district, setDistrict]       = useState('All Districts')
  const [partyFilter, setPartyFilter] = useState('All')
  const [flashIds, setFlashIds]       = useState<Set<number>>(new Set())
  const [secAgo, setSecAgo]           = useState(0)
  const prevRef                       = useRef<Map<number, string>>(new Map())

  const fetchData = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true)
    try {
      const res = await fetch('/api/election-results/constituencies', {
        cache: 'no-store',
        signal: AbortSignal.timeout(12000),
      })
      if (!res.ok) return
      const next: ConstituenciesResponse = await res.json()
      const flash = new Set<number>()
      for (const c of next.constituencies) {
        const prev = prevRef.current.get(c.id)
        if (c.leadingParty && prev !== c.leadingParty) flash.add(c.id)
        if (c.leadingParty) prevRef.current.set(c.id, c.leadingParty)
      }
      setData(next)
      if (flash.size > 0) {
        setFlashIds(flash)
        setTimeout(() => setFlashIds(new Set()), 1500)
      }
      setSecAgo(0)
    } catch { /* keep prev */ }
    finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => {
    fetchData()
    const d = setInterval(fetchData, REFRESH_MS)
    const t = setInterval(() => setSecAgo(s => s + 1), 1000)
    return () => { clearInterval(d); clearInterval(t) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const constituencies = data?.constituencies ?? []
  const totalReporting = data?.totalReporting ?? 0
  const source         = data?.source ?? ''

  // District list
  const districts = ['All Districts', ...Array.from(new Set(constituencies.map(c => c.district))).sort()]
  const PARTIES   = ['All', 'TVK', 'DMK', 'AIADMK', 'BJP', 'Others', 'Pending']

  const filtered = constituencies.filter(c => {
    const q = search.toLowerCase()
    if (q && !c.name.toLowerCase().includes(q) && !c.district.toLowerCase().includes(q) && !(c.leadingCandidate ?? '').toLowerCase().includes(q)) return false
    if (district !== 'All Districts' && c.district !== district) return false
    if (partyFilter === 'Pending' && c.status !== 'pending') return false
    if (partyFilter !== 'All' && partyFilter !== 'Pending' && c.leadingParty !== partyFilter) return false
    return true
  })

  const hasActive = partyFilter !== 'All' || district !== 'All Districts' || search

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ── Party summary pills ── */}
      {!loading && <PartyPills constituencies={constituencies} />}

      {/* ── Progress bar ── */}
      {!loading && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Seats Reporting
            </span>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>
              {totalReporting} / 234
              {refreshing ? ' · Refreshing…' : secAgo > 0 ? ` · ${secAgo < 60 ? `${secAgo}s ago` : `${Math.floor(secAgo / 60)}m ago`}` : ''}
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
          <div style={{ marginTop: 4, fontSize: 8, color: 'rgba(255,255,255,0.15)' }}>
            {source === 'eci-live' ? '🟢 ECI official data' : source === 'ai-parsed' ? '⚡ AI news parse' : '⏳ Awaiting count'} · auto-updates every 90s
          </div>
        </div>
      )}

      {/* ── Filter bar ── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 160 }}>
          <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, color: 'rgba(255,255,255,0.2)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search constituency…"
            style={{
              width: '100%', padding: '7px 10px 7px 28px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 9, color: 'rgba(255,255,255,0.8)', fontSize: 11, outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* District dropdown */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <select
            value={district}
            onChange={e => setDistrict(e.target.value)}
            style={{
              padding: '7px 28px 7px 10px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 9, color: 'rgba(255,255,255,0.65)', fontSize: 11, outline: 'none',
              appearance: 'none', cursor: 'pointer', minWidth: 110,
            }}
          >
            {districts.map(d => <option key={d} value={d} style={{ background: '#1a0a2e' }}>{d}</option>)}
          </select>
          <ChevronDown style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 11, height: 11, color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
        </div>

        {/* Party filter pills */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {PARTIES.map(p => {
            const color  = p !== 'All' && p !== 'Pending' ? PARTY_COLORS[p] ?? '#94a3b8' : 'rgba(255,255,255,0.4)'
            const active = partyFilter === p
            return (
              <button key={p} onClick={() => setPartyFilter(p)} style={{
                padding: '5px 10px', borderRadius: 99, fontSize: 10, fontWeight: 800, cursor: 'pointer', border: 'none',
                background: active ? `${color}22` : 'rgba(255,255,255,0.04)',
                color: active ? color : 'rgba(255,255,255,0.3)',
                outline: active ? `1px solid ${color}45` : '1px solid transparent',
                transition: 'all 0.15s',
              }}>
                {p}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Count + flash indicator ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>
          {hasActive ? `${filtered.length} of 234` : '234 constituencies'}
          {search && ` matching "${search}"`}
        </span>
        {flashIds.size > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#fbbf24', fontWeight: 700 }}>
            <Zap style={{ width: 10, height: 10 }} />
            {flashIds.size} updated
          </span>
        )}
      </div>

      {/* ── Card grid ── */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 9 }}>
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} style={{
              height: 80, borderRadius: 12,
              background: 'rgba(255,255,255,0.03)',
              animation: 'cShimmer 1.5s infinite',
            }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 9 }}>
          {filtered.map(c => (
            <ConstCard key={c.id} c={c} flash={flashIds.has(c.id)} />
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '36px 20px', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
              No constituencies match your filters.
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes cFadeOut { 0%{opacity:1} 100%{opacity:0} }
        @keyframes cShimmer { 0%,100%{opacity:0.5} 50%{opacity:1} }
      `}</style>
    </div>
  )
}
