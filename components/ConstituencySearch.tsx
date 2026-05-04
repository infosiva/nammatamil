'use client'

/**
 * ConstituencySearch — Search by candidate name or party.
 * Pulls live from ECI — 100% accurate data, no static name map needed.
 */

import { useState, useEffect, useRef, useCallback } from 'react'

const ECI_JSON = 'https://results.eci.gov.in/ResultAcGenMay2026/election-json-S22-live.json'

const PARTY_ALIAS: Record<string, string> = {
  TVK:'TVK', DMK:'DMK', ADMK:'ADMK', AIADMK:'ADMK',
  PMK:'PMK', INC:'INC', 'CPI(M)':'CPI(M)', CPI:'CPI',
  VCK:'VCK', DMDK:'DMDK', IUML:'IUML', AMMKMNKZ:'AMMK', BJP:'BJP', PT:'PT',
}
const ALLIANCE: Record<string, string> = {
  TVK:'TVK', DMK:'DMK Alliance', INC:'DMK Alliance', 'CPI(M)':'DMK Alliance',
  CPI:'DMK Alliance', VCK:'DMK Alliance', IUML:'DMK Alliance',
  ADMK:'ADMK Alliance', PMK:'ADMK Alliance', DMDK:'ADMK Alliance', PT:'ADMK Alliance',
  BJP:'BJP', AMMK:'Others',
}
const PARTY_COLORS: Record<string, string> = {
  TVK:'#fbbf24', DMK:'#f87171', ADMK:'#4ade80', BJP:'#fb923c',
  PMK:'#a78bfa', INC:'#38bdf8', 'CPI(M)':'#fb7185', CPI:'#fb7185',
  VCK:'#34d399', DMDK:'#f59e0b', IUML:'#10b981', AMMK:'#94a3b8', Others:'#94a3b8',
}
const PARTY_EMOJI: Record<string, string> = {
  TVK:'⭐', DMK:'🌅', ADMK:'🍃', BJP:'🪷', PMK:'🌿', INC:'✋',
  'CPI(M)':'✊', CPI:'✊', VCK:'✊', DMDK:'🎬', IUML:'🕌', AMMK:'🏛️', Others:'🏛️',
}
const ALLIANCE_COLOR: Record<string, string> = {
  'TVK':'#fbbf24', 'DMK Alliance':'#f87171', 'ADMK Alliance':'#4ade80',
  'BJP':'#fb923c', 'Others':'#94a3b8',
}

interface Seat {
  acNo: number
  party: string   // raw ECI party
  alias: string   // normalised
  alliance: string
  candidate: string
  color: string
  emoji: string
}

// Hardcoded notable searches so users can find famous names quickly
const QUICK_SEARCHES = [
  { label: 'Udhayanidhi', query: 'Udhayanidhi' },
  { label: 'Edappadi EPS', query: 'Edappadi' },
  { label: 'Sekarbabu', query: 'Sekarbabu' },
  { label: 'Sowmiya Anbumani', query: 'Sowmiya' },
  { label: 'TVK winners', query: 'TVK' },
  { label: 'DMK winners', query: 'DMK' },
]

export default function ConstituencySearch() {
  const [seats, setSeats]       = useState<Seat[]>([])
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState<Seat[]>([])
  const [selected, setSelected] = useState<Seat | null>(null)
  const [copied, setCopied]     = useState(false)
  const [mounted, setMounted]   = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
    fetch(ECI_JSON, { cache: 'no-store', signal: AbortSignal.timeout(8000) })
      .then(r => r.json())
      .then((json: Record<string, { chartData: [string, string, number, string, string][] }>) => {
        const s22 = json['S22']
        if (!s22?.chartData) return
        const loaded: Seat[] = s22.chartData.map(([raw, , acNo, candidate]) => {
          const alias   = PARTY_ALIAS[raw] ?? raw
          const alliance = ALLIANCE[alias] ?? 'Others'
          const color   = PARTY_COLORS[alias] ?? '#94a3b8'
          const emoji   = PARTY_EMOJI[alias] ?? '🏛️'
          return { acNo, party: raw, alias, alliance, candidate, color, emoji }
        }).sort((a, b) => a.acNo - b.acNo)
        setSeats(loaded)
      })
      .catch(() => {})
  }, [])

  const search = useCallback((q: string) => {
    setQuery(q)
    setSelected(null)
    if (!q.trim()) { setResults([]); return }
    const lq = q.toLowerCase()
    const matches = seats.filter(s =>
      s.candidate.toLowerCase().includes(lq) ||
      s.alias.toLowerCase().includes(lq) ||
      s.party.toLowerCase().includes(lq) ||
      s.alliance.toLowerCase().includes(lq) ||
      String(s.acNo) === lq.trim()
    ).slice(0, 8)
    setResults(matches)
    if (matches.length === 1) setSelected(matches[0])
  }, [seats])

  const copyShare = (seat: Seat) => {
    const cand = toTitle(seat.candidate)
    const text = `🗳️ AC #${seat.acNo} — TN Election 2026\n✅ Winner: ${seat.emoji} ${seat.alias} — ${cand}\n\nFull results: https://nammatamil.live`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  if (!mounted) return null

  return (
    <div style={{
      borderRadius: 18, overflow: 'hidden',
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(255,255,255,0.08)',
      marginBottom: 14,
    }}>
      {/* Header */}
      <div style={{ padding: '14px 16px 10px' }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
          🔍 Search candidate or party
        </div>
        <div style={{ position: 'relative' }}>
          <input
            ref={inputRef}
            value={query}
            onChange={e => search(e.target.value)}
            placeholder="Candidate name, party (TVK / DMK / ADMK) or AC number…"
            style={{
              width: '100%', padding: '11px 40px 11px 14px', borderRadius: 12, boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.9)', fontSize: 13, fontFamily: 'inherit', outline: 'none',
            }}
            onFocus={e => { e.target.style.borderColor = 'rgba(251,191,36,0.4)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)' }}
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]); setSelected(null); inputRef.current?.focus() }}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: 16, padding: '0 4px' }}>
              ✕
            </button>
          )}
        </div>

        {/* Quick searches */}
        {!query && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            {QUICK_SEARCHES.map(s => (
              <button key={s.label} onClick={() => search(s.query)} style={{
                fontSize: 10, padding: '4px 10px', borderRadius: 99, cursor: 'pointer',
                background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)',
                color: 'rgba(251,191,36,0.7)', fontFamily: 'inherit',
              }}>{s.label}</button>
            ))}
          </div>
        )}
      </div>

      {/* Results list */}
      {results.length > 1 && !selected && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', maxHeight: 300, overflowY: 'auto' }}>
          {results.map(seat => (
            <button key={seat.acNo} onClick={() => setSelected(seat)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: '1px solid rgba(255,255,255,0.04)', textAlign: 'left',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{seat.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: seat.color }}>
                  {toTitle(seat.candidate)}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
                  AC #{seat.acNo} · {seat.alliance}
                </div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 900, color: seat.color, flexShrink: 0 }}>{seat.alias}</span>
            </button>
          ))}
        </div>
      )}

      {/* Full result card */}
      {selected && (
        <div style={{
          margin: '0 12px 14px', borderRadius: 14,
          background: `linear-gradient(135deg, ${selected.color}18 0%, rgba(0,0,0,0) 70%)`,
          border: `1.5px solid ${selected.color}40`,
          overflow: 'hidden', animation: 'csSlide 0.25s ease',
        }}>
          <div style={{ height: 3, background: `linear-gradient(90deg,${selected.color}00,${selected.color},${selected.color}00)` }} />
          <div style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em', marginBottom: 4 }}>
                  AC #{selected.acNo} · {selected.alliance}
                </div>
                <div style={{ fontSize: 'clamp(15px,4vw,20px)', fontWeight: 900, color: 'rgba(255,255,255,0.92)', lineHeight: 1.2 }}>
                  {toTitle(selected.candidate)}
                </div>
              </div>
              <span style={{ fontSize: 32, flexShrink: 0 }}>{selected.emoji}</span>
            </div>

            <div style={{ padding: '10px 14px', borderRadius: 10, background: `${selected.color}12`, border: `1px solid ${selected.color}30`, marginBottom: 12 }}>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 4 }}>✅ WINNER — TN 2026</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: selected.color }}>{selected.alias}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>
                Alliance: {selected.alliance}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => copyShare(selected)} style={{
                flex: 1, padding: '9px 12px', borderRadius: 9, cursor: 'pointer',
                background: copied ? 'rgba(74,222,128,0.12)' : 'rgba(251,191,36,0.1)',
                border: copied ? '1px solid rgba(74,222,128,0.3)' : '1px solid rgba(251,191,36,0.25)',
                color: copied ? '#4ade80' : '#fbbf24',
                fontSize: 11, fontWeight: 800, fontFamily: 'inherit', transition: 'all 0.2s',
              }}>
                {copied ? '✓ Copied!' : '📲 Share on WhatsApp'}
              </button>
              <button onClick={() => { setSelected(null); setQuery(''); setResults([]) }} style={{
                padding: '9px 12px', borderRadius: 9, cursor: 'pointer',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'inherit',
              }}>
                Search again
              </button>
            </div>
          </div>
        </div>
      )}

      {query && results.length === 0 && seats.length > 0 && (
        <div style={{ padding: '16px', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>
          No results for &quot;{query}&quot; — try a candidate name or party like TVK, DMK, ADMK
        </div>
      )}

      <style>{`@keyframes csSlide{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  )
}

function toTitle(s: string) {
  return s.split(' ').map(w => w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : '').join(' ')
}
