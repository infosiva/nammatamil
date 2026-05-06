'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, ExternalLink } from 'lucide-react'

interface Standing {
  pos: number; short: string; name: string; played: number
  w: number; l: number; pts: number; nrr: string; color: string
}
interface MatchInfo {
  team1: string; team2: string
  result?: string; margin?: string; winner?: string
  venue?: string; dateLabel?: string; live?: boolean; score?: string
}
interface WinProbability {
  team1: string; team2: string
  pct1: number; pct2: number; basis: string
}
interface CricketResponse {
  standings: Standing[]
  lastMatch: MatchInfo | null
  nextMatch: MatchInfo | null
  liveMatch: MatchInfo | null
  winProbability: WinProbability | null
  headlines: string[]
  source: string
  updatedAt: string
  // legacy
  latestResult?: string
  liveScore?: string | null
}

// ── Where to watch IPL 2026 ───────────────────────────────────────────────────
const WATCH_OPTIONS = [
  { name: 'JioCinema',  label: 'Free',       url: 'https://www.jiocinema.com',    color: '#8b5cf6', note: 'Free with ads' },
  { name: 'Hotstar',    label: '₹299/mo',    url: 'https://www.hotstar.com',      color: '#1d4ed8', note: 'Mobile plan' },
  { name: 'Star Sports',label: 'TV',         url: 'https://www.startv.com',       color: '#ef4444', note: 'Cable/DTH' },
  { name: 'Airtel Xstream', label: 'Bundle', url: 'https://www.airtel.in/xstream',color: '#f97316', note: 'With plan' },
]

const TEAM_COLORS: Record<string, string> = {
  PBKS: '#a855f7', RCB: '#ef4444', RR: '#ec4899', SRH: '#f97316',
  GT:   '#6b7280', KKR: '#7c3aed', MI: '#0ea5e9', CSK: '#eab308',
  DC:   '#3b82f6', LSG: '#14b8a6',
}

const REFRESH_MS = 5 * 60 * 1000

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 60)   return 'just now'
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  return `${Math.floor(secs / 3600)}h ago`
}

function TeamBadge({ short, size = 22 }: { short: string; size?: number }) {
  const color = TEAM_COLORS[short] ?? '#6b7280'
  return (
    <div style={{
      width: size, height: size, borderRadius: 5, flexShrink: 0,
      background: color + 'cc', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: size * 0.35, fontWeight: 900, color: '#fff',
    }}>
      {short.slice(0, 2)}
    </div>
  )
}

export default function CricketWidget({ compact = false }: { compact?: boolean }) {
  const [data, setData]             = useState<CricketResponse | null>(null)
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [, setTick]                 = useState(0)

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true)
    else if (!data) setLoading(true)
    try {
      const url = manual ? `/api/cricket?t=${Date.now()}` : '/api/cricket'
      const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(8000) })
      if (res.ok) setData(await res.json())
    } catch { /* keep previous */ }
    finally { setLoading(false); setRefreshing(false) }
  }, [data])

  useEffect(() => {
    load()
    const poll   = setInterval(() => load(), REFRESH_MS)
    const ticker = setInterval(() => setTick(t => t + 1), 30_000)
    return () => { clearInterval(poll); clearInterval(ticker) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const standings  = data?.standings ?? []
  const isLive     = !!data?.liveMatch
  const updatedAgo = data?.updatedAt ? timeAgo(data.updatedAt) : null
  const lastMatch  = data?.lastMatch
  const nextMatch  = data?.nextMatch
  const liveMatch  = data?.liveMatch
  const prob       = data?.winProbability

  // ── COMPACT MODE (hero panel) ────────────────────────────────────────────────
  if (compact) {
    return (
      <div style={{ padding: '14px 16px 12px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ fontSize: 13 }}>🏏</span>
            <span style={{ fontWeight: 900, fontSize: 11, color: 'rgba(255,255,255,0.88)', letterSpacing: '0.06em' }}>IPL 2026</span>
            {isLive && (
              <span style={{ padding: '2px 7px', borderRadius: 99, fontSize: 9, fontWeight: 800, background: 'rgba(74,222,128,0.12)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.25)' }}>
                LIVE
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={() => load(true)} disabled={refreshing} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', padding: 2, lineHeight: 0 }}>
              <RefreshCw style={{ width: 10, height: 10, animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            </button>
            <a href="https://www.cricbuzz.com/cricket-series/9241/indian-premier-league-2026/points-table"
              target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontWeight: 700, textDecoration: 'none' }}>
              Full →
            </a>
          </div>
        </div>

        {/* Live score */}
        {liveMatch && (
          <div style={{ marginBottom: 8, padding: '6px 10px', borderRadius: 8, background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block', animation: 'livePulse 1.8s ease-in-out infinite' }} />
              <span style={{ fontSize: 9, fontWeight: 800, color: '#4ade80', letterSpacing: '0.05em' }}>LIVE NOW</span>
            </div>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.4 }}>{liveMatch.score}</p>
          </div>
        )}

        {/* Last result */}
        {!liveMatch && lastMatch && (
          <div style={{ marginBottom: 8, padding: '7px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
              <span style={{ fontSize: 8, fontWeight: 800, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.06em' }}>LAST RESULT</span>
              {lastMatch.dateLabel && <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.18)' }}>· {lastMatch.dateLabel}</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <TeamBadge short={lastMatch.team1} size={20} />
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>vs</span>
              <TeamBadge short={lastMatch.team2} size={20} />
              <div style={{ flex: 1, minWidth: 0 }}>
                {lastMatch.margin ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: TEAM_COLORS[lastMatch.winner ?? ''] ?? '#f59e0b' }}>{lastMatch.winner}</span>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>won by {lastMatch.margin}</span>
                  </div>
                ) : (
                  <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lastMatch.result}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Next match + probability */}
        {nextMatch && (
          <div style={{ marginBottom: 8, padding: '7px 10px', borderRadius: 8, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.14)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
              <span style={{ fontSize: 8, fontWeight: 800, color: 'rgba(139,92,246,0.8)', letterSpacing: '0.06em' }}>NEXT MATCH</span>
              {nextMatch.dateLabel && <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>· {nextMatch.dateLabel}</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: prob ? 6 : 0 }}>
              <TeamBadge short={nextMatch.team1} size={20} />
              <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.6)' }}>vs</span>
              <TeamBadge short={nextMatch.team2} size={20} />
              <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.75)' }}>
                {nextMatch.team1} <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>vs</span> {nextMatch.team2}
              </span>
            </div>
            {/* Win probability bar */}
            {prob && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 8, fontWeight: 800, color: TEAM_COLORS[prob.team1] ?? '#fff' }}>{prob.team1} {prob.pct1}%</span>
                  <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>win probability</span>
                  <span style={{ fontSize: 8, fontWeight: 800, color: TEAM_COLORS[prob.team2] ?? '#fff' }}>{prob.pct2}% {prob.team2}</span>
                </div>
                <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${prob.pct1}%`, background: `linear-gradient(90deg, ${TEAM_COLORS[prob.team1] ?? '#6366f1'}, ${TEAM_COLORS[prob.team2] ?? '#8b5cf6'})`, borderRadius: 99 }} />
                </div>
                <p style={{ fontSize: 7, color: 'rgba(255,255,255,0.15)', margin: '3px 0 0', textAlign: 'center' }}>{prob.basis}</p>
              </div>
            )}
          </div>
        )}

        {/* Standings */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[...Array(5)].map((_, i) => <div key={i} style={{ height: 22, borderRadius: 5, background: 'rgba(255,255,255,0.05)', animation: 'shimmer 1.5s infinite' }} />)}
          </div>
        ) : (
          <div>
            {/* Column labels */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0 0 4px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: 2 }}>
              <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.15)', width: 14 }}>#</span>
              <span style={{ width: 22, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 8, color: 'rgba(255,255,255,0.15)' }}>Team</span>
              <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.15)', width: 18, textAlign: 'center' }}>P</span>
              <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.15)', width: 36, textAlign: 'right' }}>NRR</span>
              <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.15)', width: 22, textAlign: 'right' }}>Pts</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {standings.map((row, i) => (
                <div key={row.short} style={{
                  display: 'flex', alignItems: 'center', gap: 7, padding: '3px 0',
                  borderRadius: 5, background: i < 4 ? `${row.color}09` : 'transparent',
                  position: 'relative',
                }}>
                  {i < 4 && <div style={{ position: 'absolute', left: -4, top: '15%', bottom: '15%', width: 3, borderRadius: 99, background: row.color, opacity: 0.6 }} />}
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', width: 14, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.pos}</span>
                  <TeamBadge short={row.short} size={22} />
                  <span style={{ flex: 1, fontSize: 11, fontWeight: 700, color: i < 4 ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.32)' }}>{row.short}</span>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', width: 18, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{row.played}</span>
                  <span style={{ fontSize: 9, fontFamily: 'ui-monospace,monospace', width: 36, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: parseFloat(row.nrr) >= 0 ? 'rgba(74,222,128,0.7)' : 'rgba(248,113,113,0.6)' }}>{row.nrr}</span>
                  <span style={{ fontSize: 12, fontWeight: 900, color: i < 4 ? '#f59e0b' : 'rgba(255,255,255,0.3)', width: 22, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.pts}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Where to watch */}
        <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ fontSize: 8, fontWeight: 800, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.06em', marginBottom: 5 }}>WHERE TO WATCH</p>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {WATCH_OPTIONS.map(w => (
              <a key={w.name} href={w.url} target="_blank" rel="noopener noreferrer" style={{
                textDecoration: 'none', padding: '3px 8px', borderRadius: 99,
                background: `${w.color}14`, border: `1px solid ${w.color}33`,
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: w.color }}>{w.name}</span>
                <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>{w.label}</span>
              </a>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.12)' }}>● Top 4 qualify · playoffs</span>
          {updatedAgo && <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.12)' }}>{updatedAgo}</span>}
        </div>

        <style>{`
          @keyframes livePulse {
            0%   { box-shadow: 0 0 0 0 rgba(74,222,128,0.6); }
            70%  { box-shadow: 0 0 0 6px rgba(74,222,128,0); }
            100% { box-shadow: 0 0 0 0 rgba(74,222,128,0); }
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    )
  }

  // ── FULL MODE ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">

      {/* Live score */}
      {liveMatch && (
        <div className="rounded-xl px-3 py-2.5 flex items-start gap-2"
          style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)' }}>
          <span className="w-2 h-2 rounded-full bg-green-400 mt-0.5 flex-shrink-0" style={{ animation: 'livePulse 1.8s ease-in-out infinite' }} />
          <div>
            <p className="text-[9px] font-black text-green-400/80 uppercase tracking-wider mb-0.5">Live Now</p>
            <p className="text-green-300 text-[11px] font-semibold leading-snug">{liveMatch.score}</p>
          </div>
        </div>
      )}

      {/* Last result */}
      {lastMatch && (
        <div className="rounded-xl px-3 py-2.5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[8px] font-black text-white/25 uppercase tracking-widest">Last Result</span>
            {lastMatch.dateLabel && <span className="text-[8px] text-white/15">· {lastMatch.dateLabel}</span>}
          </div>
          <div className="flex items-center gap-2">
            <TeamBadge short={lastMatch.team1} size={24} />
            <span className="text-white/20 text-[10px]">vs</span>
            <TeamBadge short={lastMatch.team2} size={24} />
            <div className="flex-1 min-w-0">
              {lastMatch.margin ? (
                <p className="text-[11px] leading-snug">
                  <span className="font-black" style={{ color: TEAM_COLORS[lastMatch.winner ?? ''] ?? '#f59e0b' }}>{lastMatch.winner}</span>
                  <span className="text-white/40"> won by {lastMatch.margin}</span>
                </p>
              ) : (
                <p className="text-white/50 text-[10px] leading-snug line-clamp-2">{lastMatch.result}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Next match + probability */}
      {nextMatch && (
        <div className="rounded-xl px-3 py-2.5"
          style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: 'rgba(139,92,246,0.8)' }}>Next Match</span>
            {nextMatch.dateLabel && <span className="text-[8px] text-white/20">· {nextMatch.dateLabel}</span>}
            {nextMatch.venue && <span className="text-[8px] text-white/15 truncate">· {nextMatch.venue}</span>}
          </div>
          <div className="flex items-center gap-2 mb-3">
            <TeamBadge short={nextMatch.team1} size={26} />
            <span className="text-sm font-black text-white/70">{nextMatch.team1}</span>
            <span className="text-xs text-white/25 font-bold">vs</span>
            <span className="text-sm font-black text-white/70">{nextMatch.team2}</span>
            <TeamBadge short={nextMatch.team2} size={26} />
          </div>
          {/* Win probability */}
          {prob && (
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[9px] font-black" style={{ color: TEAM_COLORS[prob.team1] ?? '#fff' }}>{prob.team1} {prob.pct1}%</span>
                <span className="text-[8px] text-white/20">win probability</span>
                <span className="text-[9px] font-black" style={{ color: TEAM_COLORS[prob.team2] ?? '#fff' }}>{prob.pct2}% {prob.team2}</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div style={{ height: '100%', width: `${prob.pct1}%`, background: `linear-gradient(90deg, ${TEAM_COLORS[prob.team1] ?? '#6366f1'}, ${TEAM_COLORS[prob.team2] ?? '#8b5cf6'})`, borderRadius: 99 }} />
              </div>
              <p className="text-[8px] text-white/15 text-center mt-1">{prob.basis}</p>
            </div>
          )}
        </div>
      )}

      {/* Points table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-white/70 uppercase tracking-wider">🏏 Standings</span>
          </div>
          <div className="flex items-center gap-2">
            {updatedAgo && <span className="text-[8px] text-white/15">{updatedAgo}</span>}
            <button onClick={() => load(true)} disabled={refreshing} className="text-white/20 hover:text-white/50 transition-colors">
              <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <a href="https://www.cricbuzz.com/cricket-series/9241/indian-premier-league-2026/points-table"
              target="_blank" rel="noopener noreferrer" className="text-white/20 hover:text-white/45 transition-colors">
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 border-b border-white/[0.04]">
          <span className="text-white/15 text-[8px] w-4">#</span>
          <span className="text-white/15 text-[8px] w-6" />
          <span className="flex-1 text-white/15 text-[8px]">Team</span>
          <span className="text-white/15 text-[8px] w-5 text-center">P</span>
          <span className="text-white/15 text-[8px] w-4 text-center">W</span>
          <span className="text-white/15 text-[8px] w-4 text-center">L</span>
          <span className="text-white/15 text-[8px] w-12 text-right">NRR</span>
          <span className="text-white/15 text-[8px] w-7 text-right">Pts</span>
        </div>

        {loading ? (
          <div className="p-3 space-y-2">
            {[...Array(10)].map((_, i) => <div key={i} className="h-7 rounded shimmer" />)}
          </div>
        ) : (
          <div className="divide-y divide-white/[0.03]">
            {standings.map((row, i) => (
              <div key={row.short} className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/[0.02] transition-colors"
                style={{ background: i < 4 ? `${row.color}06` : 'transparent' }}>
                <span className="text-white/20 text-[10px] w-4 tabular-nums">{row.pos}</span>
                <TeamBadge short={row.short} size={24} />
                <div className="flex-1 flex items-center gap-1.5 min-w-0">
                  <span className="font-bold text-[11px]" style={{ color: i < 4 ? row.color : 'rgba(255,255,255,0.4)' }}>{row.short}</span>
                  {i < 4 && <span className="text-[7px] text-green-400/50 font-bold">PO</span>}
                </div>
                <span className="text-white/25 text-[10px] w-5 text-center tabular-nums">{row.played}</span>
                <span className="text-green-400/70 text-[10px] w-4 text-center font-semibold tabular-nums">{row.w}</span>
                <span className="text-red-400/45 text-[10px] w-4 text-center tabular-nums">{row.l}</span>
                <span className={`text-[10px] w-12 text-right font-mono tabular-nums ${parseFloat(row.nrr) >= 0 ? 'text-green-400/60' : 'text-red-400/50'}`}>{row.nrr}</span>
                <span className="font-black text-sm w-7 text-right tabular-nums" style={{ color: i < 4 ? row.color : 'rgba(255,255,255,0.3)' }}>{row.pts}</span>
              </div>
            ))}
          </div>
        )}

        <div className="px-3 py-1.5 border-t border-white/5 flex justify-between">
          <p className="text-white/15 text-[8px]">● Top 4 qualify for playoffs</p>
          <p className="text-white/15 text-[8px]">Cricbuzz</p>
        </div>
      </div>

      {/* Where to watch */}
      <div className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-2">Where to Watch IPL 2026</p>
        <div className="grid grid-cols-2 gap-1.5">
          {WATCH_OPTIONS.map(w => (
            <a key={w.name} href={w.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg no-underline transition-all hover:scale-[1.02]"
              style={{ background: `${w.color}10`, border: `1px solid ${w.color}28` }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: w.color, flexShrink: 0 }} />
              <div className="min-w-0">
                <p className="text-[10px] font-bold truncate" style={{ color: w.color, margin: 0 }}>{w.name}</p>
                <p className="text-[8px] text-white/30 truncate" style={{ margin: 0 }}>{w.note}</p>
              </div>
              <span className="ml-auto text-[9px] font-black" style={{ color: w.color }}>{w.label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Recent headlines */}
      {data?.headlines && data.headlines.length > 0 && (
        <div className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-2">Latest IPL News</p>
          <div className="space-y-1.5">
            {data.headlines.slice(0, 4).map((h, i) => (
              <p key={i} className="text-[10px] text-white/45 leading-snug line-clamp-2"
                style={{ paddingLeft: 10, borderLeft: `2px solid rgba(255,255,255,${i === 0 ? 0.15 : 0.06})` }}>
                {h}
              </p>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes livePulse {
          0%   { box-shadow: 0 0 0 0 rgba(74,222,128,0.6); }
          70%  { box-shadow: 0 0 0 6px rgba(74,222,128,0); }
          100% { box-shadow: 0 0 0 0 rgba(74,222,128,0); }
        }
      `}</style>
    </div>
  )
}
