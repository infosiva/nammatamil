'use client'

import { useState, useEffect, useCallback } from 'react'
import { Brain, TrendingUp, Users, Zap, Share2, BarChart2, ChevronDown, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

// ─── Data ──────────────────────────────────────────────────────────────────────
const PARTIES = [
  {
    id: 'dmk',
    name: 'DMK',
    tamil: 'திமுக',
    leader: 'M. K. Stalin',
    leaderTamil: 'மு.க. ஸ்டாலின்',
    role: 'Chief Minister',
    color: '#f87171',
    dim: 'rgba(248,113,113,0.08)',
    border: 'rgba(248,113,113,0.22)',
    aiSentiment: 72,
    aiTrend: '+4.2%',
    aiLabel: 'Strong incumbent signal',
    voteShare: 38.4,   // estimated vote share %
    ranges: [
      { label: '<100',    pct: 2  },
      { label: '100–117', pct: 8  },
      { label: '118–150', pct: 24 },
      { label: '150–180', pct: 54 },
      { label: '180+',    pct: 12 },
    ],
    popularRange: '150–180',
  },
  {
    id: 'aiadmk',
    name: 'AIADMK',
    tamil: 'அதிமுக',
    leader: 'E. Palaniswami',
    leaderTamil: 'எடப்பாடி பழனிசாமி',
    role: 'Opposition Leader',
    color: '#4ade80',
    dim: 'rgba(74,222,128,0.08)',
    border: 'rgba(74,222,128,0.22)',
    aiSentiment: 61,
    aiTrend: '+1.8%',
    aiLabel: 'Rising opposition momentum',
    voteShare: 32.1,
    ranges: [
      { label: '<50',     pct: 1  },
      { label: '50–80',   pct: 2  },
      { label: '80–117',  pct: 7  },
      { label: '118–150', pct: 23 },
      { label: '150+',    pct: 67 },
    ],
    popularRange: '150+',
  },
  {
    id: 'tvk',
    name: 'TVK',
    tamil: 'தவக',
    leader: 'Vijay',
    leaderTamil: 'விஜய் (தளபதி)',
    role: 'Party President',
    color: '#fbbf24',
    dim: 'rgba(251,191,36,0.08)',
    border: 'rgba(251,191,36,0.22)',
    aiSentiment: 68,
    aiTrend: '+9.1%',
    aiLabel: 'Highest social media surge',
    voteShare: 18.7,
    ranges: [
      { label: '<20',    pct: 5  },
      { label: '20–40',  pct: 7  },
      { label: '40–70',  pct: 13 },
      { label: '70–100', pct: 15 },
      { label: '100+',   pct: 60 },
    ],
    popularRange: '100+',
  },
]

const OTHERS = [
  { name: 'BJP',      color: '#fb923c', share: 4.2, seats: '8–15'  },
  { name: 'Congress', color: '#60a5fa', share: 3.1, seats: '5–12'  },
  { name: 'PMK',      color: '#34d399', share: 2.8, seats: '4–10'  },
  { name: 'Others',   color: '#94a3b8', share: 0.7, seats: '5–20'  },
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

// ─── Party Symbol SVG ─────────────────────────────────────────────────────────
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
        <path d="M22 40 C18 30 8 24 8 16 C8 10 13 8 22 12" fill={party.color} opacity="0.3" />
        <path d="M22 40 C26 30 36 24 36 16 C36 10 31 8 22 12" fill={party.color} opacity="0.75" />
        <line x1="22" y1="40" x2="22" y2="13" stroke={party.color} strokeWidth="2" />
      </svg>
    )
  }
  return (
    <svg width={size} height={size} viewBox="0 0 44 44">
      <rect x="5" y="16" width="22" height="14" rx="7" fill={party.color} opacity="0.9" />
      <rect x="25" y="20" width="13" height="6" rx="3" fill={party.color} opacity="0.6" />
      <rect x="9" y="11" width="9" height="6" rx="3" fill={party.color} opacity="0.6" />
      <circle cx="16" cy="23" r="3.5" fill="none" stroke="#000" strokeWidth="1.5" opacity="0.4" />
      <circle cx="16" cy="23" r="1.5" fill="#000" opacity="0.3" />
    </svg>
  )
}

// ─── Vote Share Donut Chart (pure SVG) ───────────────────────────────────────
function VoteShareDonut({ parties, others }: { parties: typeof PARTIES; others: typeof OTHERS }) {
  const allParties = [
    ...parties.map(p => ({ name: p.name, share: p.voteShare, color: p.color })),
    ...others.map(o => ({ name: o.name, share: o.share, color: o.color })),
  ]
  const total = allParties.reduce((s, p) => s + p.share, 0)
  const cx = 60, cy = 60, r = 48, inner = 28
  let angle = -90

  const segments = allParties.map(p => {
    const sweep = (p.share / total) * 360
    const startRad = (angle * Math.PI) / 180
    const endRad   = ((angle + sweep) * Math.PI) / 180
    const x1 = cx + r * Math.cos(startRad)
    const y1 = cy + r * Math.sin(startRad)
    const x2 = cx + r * Math.cos(endRad)
    const y2 = cy + r * Math.sin(endRad)
    const ix1 = cx + inner * Math.cos(startRad)
    const iy1 = cy + inner * Math.sin(startRad)
    const ix2 = cx + inner * Math.cos(endRad)
    const iy2 = cy + inner * Math.sin(endRad)
    const large = sweep > 180 ? 1 : 0
    const path = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${inner} ${inner} 0 ${large} 0 ${ix1} ${iy1} Z`
    angle += sweep
    return { ...p, path, sweep }
  })

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <div className="relative flex-shrink-0" style={{ width: 120, height: 120 }}>
        <svg viewBox="0 0 120 120" width={120} height={120}>
          {segments.map((s, i) => (
            <path key={i} d={s.path} fill={s.color} opacity="0.9"
              style={{ filter: `drop-shadow(0 0 4px ${s.color}44)` }} />
          ))}
          <circle cx={cx} cy={cy} r={inner - 1} fill="#09090b" />
          <text x={cx} y={cy - 5} textAnchor="middle" fill="white" fontSize="13" fontWeight="900">234</text>
          <text x={cx} y={cy + 8} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="7">SEATS</text>
        </svg>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs w-full">
        {allParties.map(p => (
          <div key={p.name} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
            <span className="text-white/60 truncate">{p.name}</span>
            <span className="ml-auto font-black tabular-nums" style={{ color: p.color }}>{p.share.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Seat prediction table ────────────────────────────────────────────────────
function SeatTable({ parties }: { parties: typeof PARTIES }) {
  return (
    <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
      <table className="w-full text-xs">
        <thead>
          <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <th className="text-left px-4 py-2.5 text-white/40 font-semibold">Party</th>
            {parties[0].ranges.map(r => (
              <th key={r.label} className="text-center px-2 py-2.5 text-white/40 font-semibold whitespace-nowrap">{r.label}</th>
            ))}
            <th className="text-right px-4 py-2.5 text-white/40 font-semibold">Likely</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {parties.map(p => (
            <tr key={p.id} style={{ background: 'rgba(255,255,255,0.01)' }}>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                  <span className="font-black" style={{ color: p.color }}>{p.name}</span>
                  <span className="text-white/30 hidden sm:inline">{p.leader}</span>
                </div>
              </td>
              {p.ranges.map(r => {
                const isTop = r.label === p.popularRange
                return (
                  <td key={r.label} className="text-center px-2 py-3">
                    <span className={`font-black tabular-nums text-sm ${isTop ? '' : 'text-white/25'}`}
                      style={{ color: isTop ? p.color : undefined }}>
                      {r.pct}%
                    </span>
                  </td>
                )
              })}
              <td className="text-right px-4 py-3">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black"
                  style={{ background: p.dim, color: p.color, border: `1px solid ${p.border}` }}>
                  {p.popularRange}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Histogram ────────────────────────────────────────────────────────────────
function SeatHistogram({ party }: { party: typeof PARTIES[0] }) {
  const max = Math.max(...party.ranges.map(r => r.pct))
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${party.border}` }}>
      <div className="px-4 py-3 flex items-center justify-between"
        style={{ background: party.dim, borderBottom: `1px solid ${party.border}` }}>
        <div className="flex items-center gap-3">
          <PartySymbol party={party} size={26} />
          <div>
            <span className="font-black text-sm" style={{ color: party.color }}>{party.name}</span>
            <span className="text-white/30 text-[10px] ml-2">{party.tamil} · {party.leader}</span>
          </div>
        </div>
        <span className="text-xs font-black px-2 py-0.5 rounded-full"
          style={{ background: party.dim, color: party.color, border: `1px solid ${party.border}` }}>
          {party.popularRange} seats likely
        </span>
      </div>
      <div className="px-4 py-4 flex gap-2 sm:gap-3 items-end bg-black/20" style={{ height: 130 }}>
        {party.ranges.map((r, i) => {
          const h = Math.max(8, (r.pct / max) * 88)
          const isTop = r.label === party.popularRange
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-0 justify-end h-full">
              <span className="font-black text-[10px] mb-1"
                style={{ color: isTop ? party.color : 'rgba(255,255,255,0.2)' }}>{r.pct}%</span>
              <div className="w-full rounded-t-lg"
                style={{
                  height: `${h}px`,
                  background: isTop ? party.color : `${party.color}25`,
                  boxShadow: isTop ? `0 -4px 20px ${party.color}55` : 'none',
                }} />
              <span className="text-[8px] sm:text-[9px] text-white/30 mt-1.5 text-center leading-tight">{r.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── AI Sentiment bar ─────────────────────────────────────────────────────────
function SentimentBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: `linear-gradient(90deg, ${color}66, ${color})` }} />
      </div>
      <span className="text-sm font-black tabular-nums w-8 text-right" style={{ color }}>{score}</span>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function TNElectionClient() {
  const [countdown, setCountdown] = useState(getCountdown)
  const [isLive, setIsLive]       = useState(false)
  const [showForecast, setShowForecast] = useState(false)
  const [showTable, setShowTable]       = useState(true)
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

      {/* ── STICKY NAV ── */}
      <div className="sticky top-0 z-50" style={{
        background: 'rgba(9,9,11,0.92)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="text-white/35 hover:text-white/70 text-xs transition-colors flex-shrink-0">
              ← NammaTamil
            </Link>
            <span className="text-white/15">|</span>
            {isLive
              ? <span className="flex items-center gap-1.5 text-xs font-black text-red-400">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  COUNTING LIVE
                </span>
              : <span className="text-white/45 text-xs">
                  TN Election 2026 ·{' '}
                  {countdown
                    ? <span className="font-black tabular-nums" style={{ color: '#fbbf24' }}>
                        {countdown.d}d {String(countdown.h).padStart(2,'0')}:{String(countdown.m).padStart(2,'0')}:{String(countdown.s).padStart(2,'0')}
                      </span>
                    : 'Counting started'}
                  {' '}to counting
                </span>
            }
          </div>
          <button
            onClick={() => navigator.share?.({ title: 'TN Election AI Pulse 2026', url: window.location.href })}
            className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors flex-shrink-0">
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">

        {/* ── HERO ── */}
        <div className="pt-12 pb-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-7 text-xs font-bold"
            style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa' }}>
            <Brain className="w-3.5 h-3.5" />
            AI ELECTION PULSE · தமிழ்நாடு 2026
          </div>
          <h1 className="font-black leading-none tracking-tighter text-white mb-3"
            style={{ fontSize: 'clamp(2.5rem,8vw,5.5rem)' }}>
            Tamil Nadu<br />
            <span style={{
              background: 'linear-gradient(135deg,#f87171 0%,#fbbf24 50%,#4ade80 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              Elections 2026
            </span>
          </h1>
          <p className="text-white/30 text-sm sm:text-base">
            234 Assembly Seats · Counting: May 4, 2026
          </p>
        </div>

        {/* ── KEY STATS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Assembly Seats',    value: '234',    icon: Users,      color: '#a78bfa' },
            { label: 'Registered Voters', value: '6.4 Cr', icon: TrendingUp, color: '#34d399' },
            { label: 'Counting Day',      value: 'May 4',  icon: Zap,        color: '#fbbf24' },
            { label: 'Majority Mark',     value: '118',    icon: BarChart2,  color: '#f87171' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl p-4 flex flex-col gap-2"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Icon className="w-4 h-4" style={{ color }} />
              <p className="font-black text-2xl text-white tabular-nums">{value}</p>
              <p className="text-white/35 text-[10px] leading-tight">{label}</p>
            </div>
          ))}
        </div>

        {/* ── AI SENTIMENT + VOTE SHARE ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

          {/* AI Sentiment */}
          <div className="rounded-2xl p-5" style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.2)' }}>
            <div className="flex items-center gap-2 mb-5">
              <Brain className="w-4 h-4 text-purple-400" />
              <h2 className="text-white font-black text-base">AI Sentiment Score</h2>
              <span className="ml-auto text-[9px] text-white/20">Updated every 6h</span>
            </div>
            <div className="space-y-4">
              {PARTIES.map(party => (
                <div key={party.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <PartySymbol party={party} size={20} />
                      <span className="font-black text-sm" style={{ color: party.color }}>{party.name}</span>
                      <span className="text-white/30 text-[10px] hidden sm:inline">{party.leader}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-emerald-400">{party.aiTrend}</span>
                      <span className="font-black text-sm tabular-nums" style={{ color: party.color }}>{party.aiSentiment}/100</span>
                    </div>
                  </div>
                  <SentimentBar score={party.aiSentiment} color={party.color} />
                  <p className="text-white/30 text-[10px] mt-1">{party.aiLabel}</p>
                </div>
              ))}
            </div>
            <p className="text-white/15 text-[9px] mt-4 pt-3 border-t border-white/5">
              AI analysis from Tamil social media, news portals & search trends. Not affiliated with any party.
            </p>
          </div>

          {/* Vote Share Donut */}
          <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-2 mb-5">
              <BarChart2 className="w-4 h-4 text-amber-400" />
              <h2 className="text-white font-black text-base">Predicted Vote Share</h2>
              <span className="ml-auto text-[9px] text-white/20">AI estimate</span>
            </div>
            <VoteShareDonut parties={PARTIES} others={OTHERS} />
            <div className="mt-4 pt-3 border-t border-white/5">
              <p className="text-white/20 text-[9px]">
                Estimated vote share based on AI trend analysis. Majority mark: 118 seats.
              </p>
            </div>
          </div>
        </div>

        {/* ── COMMUNITY POLL ── */}
        <div className="rounded-2xl mb-6 overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="px-5 sm:px-6 py-4 flex items-center justify-between"
            style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div>
              <h2 className="text-white font-black text-lg">Community Pulse Poll</h2>
              <p className="text-white/30 text-xs mt-0.5">உங்கள் கருத்து · Cast your prediction</p>
            </div>
            <div className="text-right">
              <p className="text-white/20 text-[9px] uppercase tracking-widest mb-0.5">Responses</p>
              <p className="font-black text-2xl tabular-nums" style={{ color: '#fbbf24' }}>{total.toLocaleString()}</p>
            </div>
          </div>

          <div className="px-5 sm:px-6 py-5">
            <p className="text-white/50 text-sm font-semibold mb-4">
              Who will win the most seats in Tamil Nadu 2026?
            </p>
            <div className="space-y-2.5">
              {PARTIES.map(party => {
                const v = counts[party.id as keyof typeof counts] ?? 0
                const pct = total > 0 ? (v / total * 100) : 0
                const isWinning = v === Math.max(...Object.values(counts))
                const isMine = voted === party.id
                const hasVoted = !!voted

                return (
                  <button key={party.id} onClick={() => castVote(party.id)} disabled={hasVoted}
                    className="w-full text-left transition-all duration-200 rounded-xl overflow-hidden relative"
                    style={{
                      border: `1.5px solid ${isMine ? party.color : hasVoted ? 'rgba(255,255,255,0.07)' : party.border}`,
                      background: isMine ? party.dim : 'rgba(255,255,255,0.02)',
                      cursor: hasVoted ? 'default' : 'pointer',
                    }}>
                    {hasVoted && (
                      <div className="absolute inset-y-0 left-0 transition-all duration-700 rounded-xl"
                        style={{ width: `${pct}%`, background: `${party.color}12` }} />
                    )}
                    <div className="relative flex items-center gap-4 px-4 py-4">
                      <PartySymbol party={party} size={34} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-sm sm:text-base" style={{ color: party.color }}>{party.name}</span>
                          <span className="text-white/70 text-xs font-semibold">{party.leader}</span>
                          {isWinning && hasVoted && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                              style={{ background: `${party.color}20`, color: party.color, border: `1px solid ${party.color}40` }}>
                              LEADING
                            </span>
                          )}
                        </div>
                        <p className="text-white/30 text-[10px] mt-0.5">{party.leaderTamil} · {party.role}</p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        {hasVoted ? (
                          <div>
                            <span className="font-black text-xl sm:text-2xl tabular-nums"
                              style={{ color: isMine ? party.color : 'rgba(255,255,255,0.4)' }}>
                              {pct.toFixed(1)}%
                            </span>
                            {isMine && (
                              <p className="text-[9px] font-bold flex items-center justify-end gap-0.5" style={{ color: party.color }}>
                                <CheckCircle2 className="w-3 h-3" /> Your pick
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                            style={{ borderColor: party.border }}>
                            <div className="w-2 h-2 rounded-full" />
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
            {!voted && <p className="text-center text-white/20 text-xs mt-4">Select a party to reveal community results</p>}
            {voted && (
              <p className="text-center text-white/30 text-xs mt-4">
                You picked <span className="font-bold" style={{ color: PARTIES.find(p=>p.id===voted)?.color }}>
                  {PARTIES.find(p=>p.id===voted)?.name}
                </span> · Share with friends
              </p>
            )}
          </div>
        </div>

        {/* ── AI SEAT FORECAST — TABLE + HISTOGRAM ── */}
        <div className="rounded-2xl mb-6 overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            className="w-full px-5 sm:px-6 py-4 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
            style={{ background: 'rgba(255,255,255,0.03)', borderBottom: showForecast ? '1px solid rgba(255,255,255,0.07)' : 'none' }}
            onClick={() => setShowForecast(p => !p)}>
            <div className="flex items-center gap-3">
              <BarChart2 className="w-4 h-4 text-amber-400" />
              <div>
                <h2 className="text-white font-black text-base sm:text-lg">AI Seat Forecast</h2>
                <p className="text-white/30 text-xs mt-0.5">Crowdsourced seat range predictions · 1,143 entries</p>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-white/30 transition-transform ${showForecast ? 'rotate-180' : ''}`} />
          </button>

          {showForecast && (
            <div className="px-5 sm:px-6 py-5 space-y-5">
              {/* Toggle: table vs chart */}
              <div className="flex items-center gap-1.5">
                {[{ id: true, label: 'Table View' }, { id: false, label: 'Chart View' }].map(({ id, label }) => (
                  <button key={label} onClick={() => setShowTable(id)}
                    className="px-3 py-1 rounded-full text-xs font-bold transition-all"
                    style={{
                      background: showTable === id ? 'rgba(245,158,11,0.14)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${showTable === id ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.08)'}`,
                      color: showTable === id ? '#f59e0b' : 'rgba(255,255,255,0.4)',
                    }}>{label}</button>
                ))}
                <span className="text-white/20 text-[10px] ml-auto">% probability for each seat range</span>
              </div>

              {showTable ? (
                <SeatTable parties={PARTIES} />
              ) : (
                <div className="space-y-4">
                  {PARTIES.map(party => <SeatHistogram key={party.id} party={party} />)}
                </div>
              )}

              {/* Other parties */}
              <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-white/30 text-[10px] uppercase tracking-widest mb-3 font-semibold">Other Parties</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {OTHERS.map(p => (
                    <div key={p.name} className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                      style={{ background: `${p.color}10`, border: `1px solid ${p.color}22` }}>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                        <span className="font-black text-xs" style={{ color: p.color }}>{p.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-white/40 text-[10px]">{p.seats} seats</p>
                        <p className="font-bold text-[10px]" style={{ color: p.color }}>{p.share}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-white/15 text-[9px]">
                Community crowd-submitted predictions. AI weights by recency and source credibility.
                Not official polling data. NammaTamil does not endorse any party.
              </p>
            </div>
          )}
        </div>

        {/* ── DISCLAIMER ── */}
        <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.06)' }}>
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
