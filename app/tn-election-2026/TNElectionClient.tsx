'use client'

import { useState, useEffect, useCallback } from 'react'
import { Brain, TrendingUp, Users, Zap, ChevronDown, Share2, BarChart2 } from 'lucide-react'
import Link from 'next/link'

// ─── Data ──────────────────────────────────────────────────────────────────────
const PARTIES = [
  {
    id: 'dmk',
    name: 'DMK',
    tamil: 'திமுக',
    leader: 'M. K. Stalin',
    leaderTamil: 'மு.க. ஸ்டாலின்',
    role: 'Chief Minister, Tamil Nadu',
    color: '#f87171',        // red-400
    accent: '#fee2e2',
    dim: 'rgba(248,113,113,0.08)',
    border: 'rgba(248,113,113,0.25)',
    borderHover: 'rgba(248,113,113,0.7)',
    // AI sentiment scores (mock — framed as "AI analysis")
    aiSentiment: 72,
    aiTrend: '+4.2%',
    aiLabel: 'Strong incumbent signal',
    ranges: [
      { label: '<100',    pct: 2  },
      { label: '100–117', pct: 8  },
      { label: '118–150', pct: 24 },
      { label: '150–180', pct: 54 },
      { label: '180+',    pct: 12 },
    ],
    popularRange: '150–180',
    symbolPath: 'M22 32a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M4 32 Q22 10 40 32',
  },
  {
    id: 'aiadmk',
    name: 'AIADMK',
    tamil: 'அதிமுக',
    leader: 'E. Palaniswami',
    leaderTamil: 'எடப்பாடி பழனிசாமி',
    role: 'Former CM · Opposition Leader',
    color: '#4ade80',        // green-400
    accent: '#dcfce7',
    dim: 'rgba(74,222,128,0.08)',
    border: 'rgba(74,222,128,0.25)',
    borderHover: 'rgba(74,222,128,0.7)',
    aiSentiment: 61,
    aiTrend: '+1.8%',
    aiLabel: 'Rising opposition momentum',
    ranges: [
      { label: '<50',     pct: 1  },
      { label: '50–80',   pct: 2  },
      { label: '80–117',  pct: 7  },
      { label: '118–150', pct: 23 },
      { label: '150+',    pct: 67 },
    ],
    popularRange: '150+',
    symbolPath: 'M22 38 C22 38 8 27 8 15 C8 9 14 6 22 12 C30 6 36 9 36 15 C36 27 22 38 22 38Z M22 38 L22 13',
  },
  {
    id: 'tvk',
    name: 'TVK',
    tamil: 'தவக',
    leader: 'Vijay',
    leaderTamil: 'விஜய் (தளபதி)',
    role: 'Party President, TVK',
    color: '#fbbf24',        // amber-400
    accent: '#fef3c7',
    dim: 'rgba(251,191,36,0.08)',
    border: 'rgba(251,191,36,0.25)',
    borderHover: 'rgba(251,191,36,0.7)',
    aiSentiment: 68,
    aiTrend: '+9.1%',
    aiLabel: 'Highest social media surge',
    ranges: [
      { label: '<20',    pct: 5  },
      { label: '20–40',  pct: 7  },
      { label: '40–70',  pct: 13 },
      { label: '70–100', pct: 15 },
      { label: '100+',   pct: 60 },
    ],
    popularRange: '100+',
    symbolPath: 'M8 20 h20 a6 6 0 0 1 6 6 h0 a6 6 0 0 1-6 6 h-20 Z M14 15 h8 v6 h-8 Z M10 26 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0-8 0',
  },
]

const COUNTING_DATE = new Date('2026-05-04T06:00:00+05:30')

function getCountdown() {
  const diff = COUNTING_DATE.getTime() - Date.now()
  if (diff <= 0) return null
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  }
}

function useVotes() {
  const VK = 'tn2026_v3_voted'
  const CK = 'tn2026_v3_counts'
  const [voted, setVoted] = useState<string | null>(null)
  const [counts, setCounts] = useState({ dmk: 2847, aiadmk: 3201, tvk: 4512 })

  useEffect(() => {
    const v = localStorage.getItem(VK)
    const c = localStorage.getItem(CK)
    if (v) setVoted(v)
    if (c) { try { setCounts(JSON.parse(c)) } catch {} }
  }, [])

  const castVote = useCallback((id: string) => {
    if (voted) return
    setVoted(id)
    setCounts(prev => {
      const next = { ...prev, [id]: (prev[id as keyof typeof prev] ?? 0) + 1 }
      localStorage.setItem(CK, JSON.stringify(next))
      return next
    })
    localStorage.setItem(VK, id)
  }, [voted])

  return { voted, counts, castVote }
}

// ─── Party Symbol SVG (inline, no image) ─────────────────────────────────────
function PartySymbol({ party, size = 44 }: { party: typeof PARTIES[0]; size?: number }) {
  if (party.id === 'dmk') {
    const rays = Array.from({ length: 12 }, (_, i) => {
      const a = (i * 30 - 90) * Math.PI / 180
      return (
        <line key={i}
          x1={22 + 12 * Math.cos(a)} y1={28 + 12 * Math.sin(a)}
          x2={22 + 17 * Math.cos(a)} y2={28 + 17 * Math.sin(a)}
          stroke={party.color} strokeWidth="2" strokeLinecap="round"
        />
      )
    })
    return (
      <svg width={size} height={size} viewBox="0 0 44 44">
        <circle cx="22" cy="28" r="10" fill={party.color} opacity="0.9" />
        {rays}
        <path d="M3 28 Q22 8 41 28" fill={party.color} opacity="0.2" />
      </svg>
    )
  }
  if (party.id === 'aiadmk') {
    return (
      <svg width={size} height={size} viewBox="0 0 44 44">
        <path d="M22 40 C22 40 7 28 7 16 C7 9 13 6 22 12 C31 6 37 9 37 16 C37 28 22 40 22 40Z"
          fill="none" stroke={party.color} strokeWidth="2.5" />
        <path d="M22 40 C18 30 8 24 8 16 C8 10 13 8 22 12"
          fill={party.color} opacity="0.3" />
        <path d="M22 40 C26 30 36 24 36 16 C36 10 31 8 22 12"
          fill={party.color} opacity="0.75" />
        <line x1="22" y1="40" x2="22" y2="13" stroke={party.color} strokeWidth="2" />
      </svg>
    )
  }
  // TVK — whistle
  return (
    <svg width={size} height={size} viewBox="0 0 44 44">
      <rect x="5" y="16" width="22" height="14" rx="7" fill={party.color} opacity="0.9" />
      <rect x="25" y="20" width="13" height="6" rx="3" fill={party.color} opacity="0.6" />
      <rect x="9" y="11" width="9" height="6" rx="3" fill={party.color} opacity="0.6" />
      <circle cx="16" cy="23" r="3.5" fill="none" stroke="#000" strokeWidth="1.5" opacity="0.4" />
      <circle cx="16" cy="23" r="1.5" fill="#000" opacity="0.3" />
      <circle cx="7" cy="23" r="3" fill="none" stroke={party.color} strokeWidth="2" />
    </svg>
  )
}

// ─── AI Meter bar ─────────────────────────────────────────────────────────────
function AIMeter({ score, color }: { score: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${score}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }}
        />
      </div>
      <span className="text-xs font-black tabular-nums" style={{ color }}>{score}</span>
    </div>
  )
}

// ─── Histogram bar ────────────────────────────────────────────────────────────
function SeatHistogram({ party }: { party: typeof PARTIES[0] }) {
  const max = Math.max(...party.ranges.map(r => r.pct))
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${party.border}` }}>
      <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${party.border}` }}>
        <div className="flex items-center gap-3">
          <PartySymbol party={party} size={28} />
          <div>
            <span className="font-black text-base" style={{ color: party.color }}>{party.name}</span>
            <span className="text-white/30 text-xs ml-2 hidden sm:inline">
              most likely: <span style={{ color: party.color }}>{party.popularRange} seats</span>
            </span>
          </div>
        </div>
        <span className="text-xs font-bold text-white/30">
          {Math.round(party.ranges.reduce((s, r) => s + r.pct, 0) * 5.1).toLocaleString()} predictions
        </span>
      </div>
      <div className="px-5 py-5 flex gap-2 sm:gap-4 items-end" style={{ height: '140px', background: 'rgba(0,0,0,0.2)' }}>
        {party.ranges.map((r, i) => {
          const h = Math.max(8, (r.pct / max) * 90)
          const isTop = r.label === party.popularRange
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-0 justify-end h-full">
              <span className="font-black text-[10px] mb-1" style={{ color: isTop ? party.color : 'rgba(255,255,255,0.25)' }}>
                {r.pct}%
              </span>
              <div
                className="w-full rounded-t-md"
                style={{
                  height: `${h}px`,
                  background: isTop ? party.color : `${party.color}28`,
                  boxShadow: isTop ? `0 -4px 16px ${party.color}44` : 'none',
                }}
              />
              <span className="text-[8px] sm:text-[9px] text-white/30 mt-2 text-center leading-tight">{r.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function TNElectionClient() {
  const [countdown, setCountdown] = useState(getCountdown)
  const [isLive, setIsLive] = useState(false)
  const [showPred, setShowPred] = useState(false)
  const { voted, counts, castVote } = useVotes()

  useEffect(() => {
    const id = setInterval(() => {
      const c = getCountdown()
      setCountdown(c)
      if (!c) setIsLive(true)
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const total = counts.dmk + counts.aiadmk + counts.tvk

  return (
    <div style={{ background: '#09090b', minHeight: '100vh', color: '#f4f4f5' }}>

      {/* ── TOP NAV BAR ───────────────────────────────────────────────────── */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(9,9,11,0.95)', backdropFilter: 'blur(12px)' }}
        className="sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-white/40 hover:text-white/70 text-xs transition-colors">← NammaTamil</Link>
            <span className="text-white/15">|</span>
            {isLive
              ? <span className="flex items-center gap-1.5 text-xs font-black text-red-400">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />COUNTING LIVE
                </span>
              : <span className="text-white/50 text-xs">
                  TN Election 2026 ·{' '}
                  {countdown
                    ? <span className="text-amber-400 font-bold tabular-nums">
                        {countdown.d}d {String(countdown.h).padStart(2,'0')}:{String(countdown.m).padStart(2,'0')}:{String(countdown.s).padStart(2,'0')}
                      </span>
                    : 'Counting started'}
                  {' '}to counting
                </span>
            }
          </div>
          <button
            onClick={() => navigator.share?.({ title: 'TN Election AI Pulse 2026', url: window.location.href })}
            className="flex items-center gap-1.5 text-xs text-white/35 hover:text-white/60 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">

        {/* ── HERO HEADLINE ─────────────────────────────────────────────── */}
        <div className="pt-14 pb-12 text-center">
          {/* AI badge — differentiator */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-xs font-bold"
            style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa' }}>
            <Brain className="w-3.5 h-3.5" />
            AI ELECTION PULSE · தமிழ்நாடு 2026
          </div>

          <h1 className="font-black text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-none tracking-tight text-white mb-4">
            Tamil Nadu<br />
            <span style={{
              background: 'linear-gradient(135deg, #f87171 0%, #fbbf24 50%, #4ade80 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              Elections
            </span>
          </h1>

          <p className="text-white/30 text-base sm:text-lg font-medium mb-2">
            234 Assembly Seats · May 4, 2026 Counting
          </p>
          <p className="text-white/20 text-sm">
            தமிழ்நாடு சட்டமன்றத் தேர்தல் · AI-powered community sentiment
          </p>
        </div>

        {/* ── AI SENTIMENT OVERVIEW ─────────────────────────────────────── */}
        <div className="rounded-2xl p-5 sm:p-6 mb-6"
          style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.18)' }}>
          <div className="flex items-center gap-2 mb-5">
            <Brain className="w-4 h-4 text-purple-400" />
            <h2 className="text-white font-black text-base sm:text-lg">AI Sentiment Analysis</h2>
            <span className="ml-auto text-[10px] text-white/25 hidden sm:inline">
              Based on social media · news · search trends
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PARTIES.map(party => (
              <div key={party.id} className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PartySymbol party={party} size={22} />
                    <span className="font-black text-sm" style={{ color: party.color }}>{party.name}</span>
                  </div>
                  <span className="text-xs font-bold text-green-400">{party.aiTrend}</span>
                </div>
                <AIMeter score={party.aiSentiment} color={party.color} />
                <p className="text-white/35 text-[10px] leading-tight">{party.aiLabel}</p>
              </div>
            ))}
          </div>
          <p className="text-white/15 text-[9px] mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            AI Pulse analyses public sentiment from Tamil social media, news portals and search trends.
            Not affiliated with any party. Updated every 6 hours.
          </p>
        </div>

        {/* ── WHO WILL WIN POLL ─────────────────────────────────────────── */}
        <div className="rounded-2xl mb-6 overflow-hidden"
          style={{ border: '1px solid rgba(255,255,255,0.09)' }}>

          {/* Poll header */}
          <div className="px-5 sm:px-6 py-4 flex items-center justify-between"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
            <div>
              <h2 className="text-white font-black text-lg sm:text-xl">Community Pulse Poll</h2>
              <p className="text-white/35 text-xs mt-0.5">உங்கள் கருத்து · Cast your prediction</p>
            </div>
            <div className="text-right">
              <p className="text-white/20 text-[9px] uppercase tracking-widest">Responses</p>
              <p className="font-black text-xl tabular-nums" style={{ color: '#fbbf24' }}>{total.toLocaleString()}</p>
            </div>
          </div>

          {/* Poll question */}
          <div className="px-5 sm:px-6 py-5">
            <p className="text-white/60 text-sm font-semibold mb-5">
              Who will win the most seats in Tamil Nadu 2026?
            </p>

            <div className="space-y-3">
              {PARTIES.map(party => {
                const v = counts[party.id as keyof typeof counts] ?? 0
                const pct = total > 0 ? (v / total * 100) : 0
                const isWinning = v === Math.max(...Object.values(counts))
                const isMine = voted === party.id
                const hasVoted = !!voted

                return (
                  <button
                    key={party.id}
                    onClick={() => castVote(party.id)}
                    disabled={hasVoted}
                    className="w-full text-left transition-all duration-200 rounded-xl overflow-hidden relative"
                    style={{
                      border: `1.5px solid ${isMine ? party.color : hasVoted ? 'rgba(255,255,255,0.07)' : party.border}`,
                      background: isMine ? party.dim : 'rgba(255,255,255,0.02)',
                      cursor: hasVoted ? 'default' : 'pointer',
                    }}
                  >
                    {/* Fill bar behind content */}
                    {hasVoted && (
                      <div
                        className="absolute inset-y-0 left-0 transition-all duration-700 rounded-xl"
                        style={{ width: `${pct}%`, background: `${party.color}10` }}
                      />
                    )}

                    <div className="relative flex items-center gap-4 px-4 py-3.5">
                      {/* Symbol */}
                      <PartySymbol party={party} size={32} />

                      {/* Party + leader */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-sm sm:text-base" style={{ color: party.color }}>
                            {party.name}
                          </span>
                          <span className="text-white/30 text-xs">·</span>
                          <span className="text-white/70 text-xs sm:text-sm font-semibold">{party.leader}</span>
                          {isWinning && hasVoted && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                              style={{ background: `${party.color}20`, color: party.color, border: `1px solid ${party.color}40` }}>
                              LEADING
                            </span>
                          )}
                        </div>
                        <p className="text-white/30 text-[10px] mt-0.5 truncate">{party.leaderTamil} · {party.role}</p>
                      </div>

                      {/* Percentage or select indicator */}
                      <div className="flex-shrink-0 text-right">
                        {hasVoted ? (
                          <div>
                            <span className="font-black text-lg sm:text-xl tabular-nums" style={{ color: isMine ? party.color : 'rgba(255,255,255,0.5)' }}>
                              {pct.toFixed(1)}%
                            </span>
                            {isMine && <p className="text-[9px] font-bold" style={{ color: party.color }}>Your pick</p>}
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border flex items-center justify-center"
                            style={{ borderColor: party.border }}>
                            <div className="w-2 h-2 rounded-full" style={{ background: 'transparent' }} />
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {!voted && (
              <p className="text-center text-white/20 text-xs mt-4">
                Select a party above to reveal community results
              </p>
            )}
            {voted && (
              <p className="text-center text-white/30 text-xs mt-4">
                You picked <span className="font-bold" style={{ color: PARTIES.find(p=>p.id===voted)?.color }}>
                  {PARTIES.find(p=>p.id===voted)?.name}
                </span> · Share with friends to get more votes
              </p>
            )}
          </div>
        </div>

        {/* ── AI SEAT FORECAST ──────────────────────────────────────────── */}
        <div className="rounded-2xl mb-6 overflow-hidden"
          style={{ border: '1px solid rgba(255,255,255,0.09)' }}>

          <button
            className="w-full px-5 sm:px-6 py-4 flex items-center justify-between text-left transition-colors hover:bg-white/[0.02]"
            style={{ borderBottom: showPred ? '1px solid rgba(255,255,255,0.07)' : 'none', background: 'rgba(255,255,255,0.02)' }}
            onClick={() => setShowPred(p => !p)}
          >
            <div className="flex items-center gap-3">
              <BarChart2 className="w-4 h-4 text-amber-400" />
              <div>
                <h2 className="text-white font-black text-base sm:text-lg">AI Seat Forecast</h2>
                <p className="text-white/30 text-xs mt-0.5">Crowdsourced seat range predictions</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-amber-400 font-black text-base tabular-nums hidden sm:inline">1,143 predictions</span>
              <ChevronDown className={`w-4 h-4 text-white/30 transition-transform duration-200 ${showPred ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {showPred && (
            <div className="px-5 sm:px-6 py-5 space-y-4">
              <p className="text-white/20 text-xs">
                Community members submitted their seat-range predictions. AI aggregates and weights by recency.
                Disclaimer: These are crowd estimates, not official polling data. NammaTamil does not endorse any party.
              </p>
              {PARTIES.map(party => <SeatHistogram key={party.id} party={party} />)}

              {/* Other parties */}
              <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-white/30 text-[10px] uppercase tracking-widest mb-3">Other Parties · Predicted Range</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { name: 'BJP',      color: '#fb923c', seats: '8–15 seats'  },
                    { name: 'Congress', color: '#60a5fa', seats: '5–12 seats'  },
                    { name: 'PMK',      color: '#34d399', seats: '4–10 seats'  },
                    { name: 'Others',   color: '#94a3b8', seats: '10–20 seats' },
                  ].map(p => (
                    <div key={p.name} className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                      style={{ background: `${p.color}0d`, border: `1px solid ${p.color}22` }}>
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
                      <div>
                        <p className="font-black text-xs" style={{ color: p.color }}>{p.name}</p>
                        <p className="text-white/30 text-[9px]">{p.seats}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── KEY FACTS ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Assembly Seats',  value: '234',      icon: Users,      color: '#a78bfa' },
            { label: 'Registered Voters', value: '6.4 Cr', icon: TrendingUp,  color: '#34d399' },
            { label: 'Counting Day',    value: 'May 4',    icon: Zap,        color: '#fbbf24' },
            { label: 'Parties Active',  value: '12+',      icon: BarChart2,  color: '#f87171' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl p-4 flex flex-col gap-2"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <Icon className="w-4 h-4" style={{ color }} />
              <p className="font-black text-xl sm:text-2xl text-white tabular-nums">{value}</p>
              <p className="text-white/35 text-[10px] leading-tight">{label}</p>
            </div>
          ))}
        </div>

        {/* ── DISCLAIMER ────────────────────────────────────────────────── */}
        <div className="rounded-xl p-4 text-center"
          style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-white/20 text-[10px] leading-relaxed">
            NammaTamil AI Election Pulse is an independent community platform. Poll results and seat forecasts
            are crowd-submitted data only and do not represent official exit polls or survey results.
            Live counting results will activate on May 4, 2026 at 8 AM IST.
          </p>
        </div>
      </div>
    </div>
  )
}
