'use client'

import { useState, useEffect, useCallback } from 'react'
import { Brain, TrendingUp, Users, Zap, Share2, BarChart2, ChevronDown, CheckCircle2, Newspaper } from 'lucide-react'
import Link from 'next/link'
import ElectionResultsLive from '@/components/ElectionResultsLive'
import AdUnit from '@/components/AdUnit'

// ─── Exit Poll Data (April 29, 2026) ─────────────────────────────────────────
// Axis My India is FEATURED — TVK projected winner 98–120 seats
const EXIT_POLLS = [
  {
    agency: 'Axis My India ⭐',
    channel: 'India Today',
    dmk: '92–110',
    aiadmk: '22–32',
    tvk: '98–120',
    others: '2–10',
    dmkMid: 101,
    aiadmkMid: 27,
    tvkMid: 109,
    highlight: 'tvk',
    featured: true,
  },
  {
    agency: 'Matrize',
    channel: 'India TV',
    dmk: '122–132',
    aiadmk: '87–100',
    tvk: '10–12',
    others: '0–6',
    dmkMid: 127,
    aiadmkMid: 94,
    tvkMid: 11,
    highlight: 'dmk',
    featured: false,
  },
  {
    agency: 'P-MARQ',
    channel: 'NewsX',
    dmk: '125–145',
    aiadmk: '65–85',
    tvk: '16–26',
    others: '–',
    dmkMid: 135,
    aiadmkMid: 75,
    tvkMid: 21,
    highlight: 'dmk',
    featured: false,
  },
  {
    agency: 'JVC',
    channel: 'Republic',
    dmk: '75–96',
    aiadmk: '128–147',
    tvk: '8–15',
    others: '–',
    dmkMid: 86,
    aiadmkMid: 138,
    tvkMid: 12,
    highlight: 'aiadmk',
    featured: false,
  },
]

// Featured poll (Axis My India) — TVK leading
const FEATURED_POLL = EXIT_POLLS[0]
const POLL_OF_POLLS = { dmk: '~101', aiadmk: '~82', tvk: '~39', others: '~12' }

// ─── Data ──────────────────────────────────────────────────────────────────────
// ─── Axis My India exit poll numbers (Apr 29 2026) — TVK projected winner ─────
// Leader photos: Wikipedia Commons (CC licensed)
const PARTIES = [
  {
    id: 'tvk',
    name: 'TVK',
    tamil: 'தவக',
    leader: 'Vijay (Thalapathy)',
    leaderTamil: 'விஜய் (தளபதி)',
    role: '🏆 Projected Winner',
    color: '#fbbf24',
    dim: 'rgba(251,191,36,0.10)',
    border: 'rgba(251,191,36,0.35)',
    leaderImg: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Vijay_at_Protest_of_the_Nadigar_Sangam.jpg/330px-Vijay_at_Protest_of_the_Nadigar_Sangam.jpg',
    aiSentiment: 82,
    aiTrend: '+18.4%',
    aiLabel: 'Axis My India: Single largest party · CM preferred 37%',
    voteShare: 35.0,
    ranges: [
      { label: '<50',    pct: 2  },
      { label: '50–80',  pct: 5  },
      { label: '80–97',  pct: 10 },
      { label: '98–120', pct: 68 },
      { label: '120+',   pct: 15 },
    ],
    popularRange: '98–120',
  },
  {
    id: 'dmk',
    name: 'DMK',
    tamil: 'திமுக',
    leader: 'M. K. Stalin',
    leaderTamil: 'மு.க. ஸ்டாலின்',
    role: 'Chief Minister (Incumbent)',
    color: '#f87171',
    dim: 'rgba(248,113,113,0.08)',
    border: 'rgba(248,113,113,0.22)',
    leaderImg: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/The_Chief_Minister_of_Tamil_Nadu%2C_Thiru_MK_Stalin.jpg/330px-The_Chief_Minister_of_Tamil_Nadu%2C_Thiru_MK_Stalin.jpg',
    aiSentiment: 70,
    aiTrend: '-6.8%',
    aiLabel: 'Axis My India: Close second · CM preferred 35%',
    voteShare: 35.0,
    ranges: [
      { label: '<80',     pct: 3  },
      { label: '80–91',   pct: 9  },
      { label: '92–110',  pct: 62 },
      { label: '111–117', pct: 18 },
      { label: '118+',    pct: 8  },
    ],
    popularRange: '92–110',
  },
  {
    id: 'aiadmk',
    name: 'AIADMK',
    tamil: 'அதிமுக',
    leader: 'E. Palaniswami',
    leaderTamil: 'எடப்பாடி பழனிசாமி',
    role: 'Opposition Leader',
    color: '#4ade80',
    dim: 'rgba(74,222,128,0.06)',
    border: 'rgba(74,222,128,0.18)',
    leaderImg: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Palanisamy.jpg/330px-Palanisamy.jpg',
    aiSentiment: 42,
    aiTrend: '-22.1%',
    aiLabel: 'Axis My India: Sharp decline · CM preferred 22%',
    voteShare: 23.0,
    ranges: [
      { label: '<10',   pct: 5  },
      { label: '10–21', pct: 15 },
      { label: '22–32', pct: 62 },
      { label: '33–50', pct: 14 },
      { label: '50+',   pct: 4  },
    ],
    popularRange: '22–32',
  },
]

const OTHERS = [
  { name: 'BJP',      color: '#fb923c', share: 4.2, seats: '8–15'  },
  { name: 'Congress', color: '#60a5fa', share: 3.1, seats: '5–12'  },
  { name: 'PMK',      color: '#34d399', share: 2.8, seats: '4–10'  },
  { name: 'Others',   color: '#94a3b8', share: 0.7, seats: '5–20'  },
]

// Counting starts 8:00 AM IST May 4 2026
const COUNTING_DATE = new Date('2026-05-04T08:00:00+05:30')

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

// ─── Party Symbol SVG — faithful to official ECI symbols ─────────────────────
//
// DMK    official symbol: RISING SUN — red/orange sun with rays rising from horizon
// AIADMK official symbol: TWO LEAVES — two green leaves side by side on a stem
// TVK    official symbol: WHISTLE — Tamilaga Vettri Kazhagam's ECI-registered symbol
//
function PartySymbol({ party, size = 44 }: { party: typeof PARTIES[0]; size?: number }) {

  if (party.id === 'dmk') {
    // DMK Rising Sun — official symbol (red/orange sun half-risen above horizon)
    // The DMK flag shows a rising sun with alternating short/long rays
    const cx = 22, sunY = 22, r = 10
    const rays = Array.from({ length: 12 }, (_, i) => {
      const angle  = (i * 30 - 90) * Math.PI / 180
      const isLong = i % 2 === 0
      const r1 = r + 2, r2 = r + (isLong ? 9 : 5)
      return (
        <line key={i}
          x1={cx + r1 * Math.cos(angle)} y1={sunY + r1 * Math.sin(angle)}
          x2={cx + r2 * Math.cos(angle)} y2={sunY + r2 * Math.sin(angle)}
          stroke={party.color} strokeWidth={isLong ? '2.2' : '1.5'} strokeLinecap="round"
        />
      )
    })
    return (
      <svg width={size} height={size} viewBox="0 0 44 44">
        {/* Sea / horizon base */}
        <path d="M2 30 Q11 27 22 30 Q33 33 42 30 L42 40 Q33 37 22 40 Q11 43 2 40Z"
          fill={party.color} opacity="0.2" />
        <line x1="2" y1="30" x2="42" y2="30" stroke={party.color} strokeWidth="1.8" opacity="0.7" />
        {/* Clipping: only show top half of sun above horizon */}
        <defs>
          <clipPath id={`sun-clip-${size}`}>
            <rect x="0" y="0" width="44" height="30" />
          </clipPath>
        </defs>
        {/* Sun disc */}
        <circle cx={cx} cy={sunY} r={r} fill={party.color}
          clipPath={`url(#sun-clip-${size})`} />
        {/* Rays (above horizon only) */}
        <g clipPath={`url(#sun-clip-${size})`}>{rays}</g>
        {/* Glow */}
        <circle cx={cx} cy={sunY} r={r + 1} fill="none" stroke={party.color} strokeWidth="0.5" opacity="0.3"
          clipPath={`url(#sun-clip-${size})`} />
      </svg>
    )
  }

  if (party.id === 'aiadmk') {
    // AIADMK Two Leaves — official symbol
    // Two broad oval leaves side by side with stems joining at bottom
    return (
      <svg width={size} height={size} viewBox="0 0 44 44">
        {/* Left leaf — tilted left */}
        <path d="M21 38 C21 38 8 30 8 16 C8 8 13 5 18 9 C20 11 21 15 21 38Z"
          fill={party.color} opacity="0.92" />
        {/* Left leaf mid-vein */}
        <path d="M21 38 C19 28 12 18 10 10" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
        {/* Left leaf highlight */}
        <ellipse cx="14" cy="19" rx="3" ry="7" fill="white" opacity="0.1"
          transform="rotate(-25,14,19)" />

        {/* Right leaf — tilted right */}
        <path d="M23 38 C23 38 36 30 36 16 C36 8 31 5 26 9 C24 11 23 15 23 38Z"
          fill={party.color} opacity="0.78" />
        {/* Right leaf mid-vein */}
        <path d="M23 38 C25 28 32 18 34 10" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />

        {/* Stem joining both leaves */}
        <path d="M21 38 Q22 41 22 43" fill="none" stroke={party.color} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M23 38 Q22 41 22 43" fill="none" stroke={party.color} strokeWidth="2.5" strokeLinecap="round" />

        {/* Glow outline */}
        <path d="M21 38 C21 38 8 30 8 16 C8 8 13 5 18 9 C20 11 21 15 21 38Z"
          fill="none" stroke={party.color} strokeWidth="0.5" opacity="0.4" />
        <path d="M23 38 C23 38 36 30 36 16 C36 8 31 5 26 9 C24 11 23 15 23 38Z"
          fill="none" stroke={party.color} strokeWidth="0.5" opacity="0.4" />
      </svg>
    )
  }

  // TVK — Whistle (official ECI-registered symbol for Tamilaga Vettri Kazhagam)
  return (
    <svg width={size} height={size} viewBox="0 0 44 44">
      {/* Whistle body — rounded rectangular chamber */}
      <rect x="6" y="17" width="22" height="12" rx="6" fill={party.color} opacity="0.9" />
      {/* Mouthpiece — narrow tube extending right */}
      <rect x="26" y="20" width="12" height="6" rx="3" fill={party.color} opacity="0.75" />
      {/* Air hole on top */}
      <rect x="13" y="14" width="7" height="4" rx="2" fill={party.color} opacity="0.85" />
      {/* Pea visible through hole */}
      <circle cx="16.5" cy="16" r="1.5" fill="white" opacity="0.3" />
      {/* Highlight on body */}
      <rect x="8" y="18.5" width="18" height="3" rx="1.5" fill="white" opacity="0.12" />
      {/* Ring/loop at left end */}
      <circle cx="8" cy="23" r="3.5" fill="none" stroke={party.color} strokeWidth="2.2" opacity="0.7" />
      <circle cx="8" cy="23" r="1.5" fill={party.color} opacity="0.3" />
      {/* Glow */}
      <rect x="6" y="17" width="22" height="12" rx="6" fill="none" stroke={party.color} strokeWidth="0.8" opacity="0.35" />
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

// ─── Party Snapshot Card (with leader photo) ──────────────────────────────────
function PartyCard({ party, exitSeats, isWinner }: { party: typeof PARTIES[0]; exitSeats: string; isWinner: boolean }) {
  return (
    <div style={{
      flex: '0 0 auto',
      width: 210,
      borderRadius: 22,
      overflow: 'hidden',
      background: isWinner
        ? `linear-gradient(160deg, ${party.color}20 0%, ${party.color}06 100%)`
        : `linear-gradient(160deg, ${party.color}0c 0%, ${party.color}03 100%)`,
      border: `${isWinner ? '2px' : '1px'} solid ${party.color}${isWinner ? '55' : '25'}`,
      position: 'relative',
      boxShadow: isWinner ? `0 8px 40px ${party.color}18` : 'none',
    }}>
      {/* Glow blob */}
      <div style={{
        position: 'absolute', top: -40, right: -40, width: 130, height: 130,
        borderRadius: '50%', background: party.color, opacity: isWinner ? 0.1 : 0.05, filter: 'blur(35px)',
        pointerEvents: 'none',
      }} />

      {/* Leader photo strip */}
      <div style={{
        position: 'relative', height: 130, overflow: 'hidden',
        background: `linear-gradient(180deg, ${party.color}15 0%, rgba(0,0,0,0.5) 100%)`,
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={party.leaderImg}
          alt={party.leader}
          style={{
            width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top',
            filter: 'grayscale(15%) contrast(1.05)',
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)',
          }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        {/* Color overlay at bottom */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
          background: `linear-gradient(to top, ${party.color}20, transparent)`,
        }} />
        {/* Party symbol + name overlay */}
        <div style={{
          position: 'absolute', bottom: 8, left: 12,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <PartySymbol party={party} size={28} />
          <div>
            <div style={{ fontWeight: 900, fontSize: 15, color: party.color, lineHeight: 1 }}>{party.name}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>{party.tamil}</div>
          </div>
        </div>
        {isWinner && (
          <div style={{
            position: 'absolute', top: 8, right: 8,
            fontSize: 9, fontWeight: 900, letterSpacing: '0.07em',
            color: party.color,
            background: 'rgba(7,1,15,0.75)',
            border: `1px solid ${party.color}50`,
            borderRadius: 99, padding: '3px 8px',
            backdropFilter: 'blur(8px)',
          }}>
            👑 PROJECTED
          </div>
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 1, fontWeight: 600 }}>{party.leader}</div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.22)', marginBottom: 12 }}>{party.role}</div>

        {/* Big seat number */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 12 }}>
          <div style={{ fontSize: 44, fontWeight: 900, lineHeight: 1, color: party.color, fontVariantNumeric: 'tabular-nums' }}>
            {exitSeats}
          </div>
          <div style={{ paddingBottom: 4 }}>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>seats</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>exit poll</div>
          </div>
        </div>

        {/* Sentiment bar */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>AI Sentiment</span>
            <span style={{ fontSize: 11, fontWeight: 900, color: party.color }}>{party.aiSentiment}/100</span>
          </div>
          <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 99,
              width: `${party.aiSentiment}%`,
              background: `linear-gradient(90deg, ${party.color}50, ${party.color})`,
            }} />
          </div>
        </div>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 10, fontWeight: 700,
          color: party.aiTrend.startsWith('+') ? '#4ade80' : '#f87171',
        }}>
          <span>{party.aiTrend.startsWith('+') ? '▲' : '▼'}</span>
          <span>{party.aiTrend}</span>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontWeight: 400, marginLeft: 2 }}>vs baseline</span>
        </div>
      </div>
    </div>
  )
}

// ─── Key Facts Strip ───────────────────────────────────────────────────────────
function KeyFactsStrip() {
  const facts = [
    { icon: '🏛️', label: 'Assembly Seats', value: '234' },
    { icon: '🗳️', label: 'Registered Voters', value: '6.4 Cr' },
    { icon: '📅', label: 'Counting Day', value: 'May 4, 8 AM' },
    { icon: '⚖️', label: 'Majority Mark', value: '118 seats' },
  ]
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 10, marginBottom: 28,
    }} className="sm:grid-cols-4">
      {facts.map(f => (
        <div key={f.label} style={{
          borderRadius: 16, padding: '16px 14px',
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ fontSize: 20, marginBottom: 6 }}>{f.icon}</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{f.value}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>{f.label}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Exit Poll Cards ───────────────────────────────────────────────────────────
function ExitPollSection() {
  const partyColors: Record<string, string> = { dmk: '#f87171', aiadmk: '#4ade80', tvk: '#fbbf24' }

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Newspaper style={{ width: 16, height: 16, color: '#ef4444' }} />
        <h2 style={{ fontWeight: 900, fontSize: 18, color: '#fff' }}>Exit Poll Results 2026</h2>
        <span style={{
          fontSize: 9, fontWeight: 900, letterSpacing: '0.08em', color: '#ef4444',
          background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
          borderRadius: 99, padding: '2px 8px', marginLeft: 4,
        }}>வெளியேறும் வாக்கெடுப்பு</span>
      </div>

      {/* Scrollable poll cards */}
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
        {EXIT_POLLS.map(poll => {
          const isFeatured = poll.featured
          const winColor = partyColors[poll.highlight as keyof typeof partyColors]
          return (
            <div key={poll.agency} style={{
              flex: '0 0 auto',
              width: isFeatured ? 260 : 210,
              borderRadius: 18,
              padding: '18px 16px',
              background: isFeatured
                ? `linear-gradient(145deg, rgba(251,191,36,0.14) 0%, rgba(245,158,11,0.05) 100%)`
                : 'rgba(255,255,255,0.025)',
              border: isFeatured ? '2px solid rgba(251,191,36,0.45)' : '1px solid rgba(255,255,255,0.08)',
            }}>
              {isFeatured && (
                <div style={{ fontSize: 9, fontWeight: 900, color: '#fbbf24', letterSpacing: '0.1em', marginBottom: 8 }}>
                  ⭐ FEATURED POLL
                </div>
              )}
              <div style={{ fontWeight: 900, fontSize: 13, color: '#fff', marginBottom: 2 }}>{poll.agency}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 14 }}>{poll.channel}</div>

              {/* Seat numbers */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                {(['tvk', 'dmk', 'aiadmk'] as const).map(key => {
                  const val = key === 'dmk' ? poll.dmk : key === 'aiadmk' ? poll.aiadmk : poll.tvk
                  const isWin = poll.highlight === key
                  const col = partyColors[key]
                  return (
                    <div key={key} style={{
                      flex: 1, textAlign: 'center', padding: '8px 4px',
                      borderRadius: 10,
                      background: isWin ? `${col}18` : `${col}07`,
                      border: `${isWin ? '2px' : '1px'} solid ${col}${isWin ? '45' : '18'}`,
                    }}>
                      <div style={{ fontWeight: 900, fontSize: 15, color: col, fontVariantNumeric: 'tabular-nums' }}>{val}</div>
                      <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', marginTop: 2, textTransform: 'uppercase' }}>
                        {key === 'dmk' ? 'DMK+' : key === 'aiadmk' ? 'ADMK+' : 'TVK'}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Visual bar */}
              <div style={{ display: 'flex', height: 6, borderRadius: 99, overflow: 'hidden', gap: 1 }}>
                {(['tvk', 'dmk', 'aiadmk'] as const).map(key => {
                  const mid = key === 'tvk' ? poll.tvkMid : key === 'dmk' ? poll.dmkMid : poll.aiadmkMid
                  const isWin = poll.highlight === key
                  return (
                    <div key={key} style={{
                      width: `${(mid / 234) * 100}%`,
                      background: partyColors[key],
                      opacity: isWin ? 1 : 0.4,
                      borderRadius: 99,
                    }} />
                  )
                })}
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)' }} />
              </div>

              {isFeatured && (
                <div style={{
                  marginTop: 12, padding: '8px 10px', borderRadius: 10,
                  background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)',
                }}>
                  <div style={{ fontSize: 10, color: '#fbbf24', fontWeight: 700 }}>TVK projected winner</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Vijay preferred CM at 37%</div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Poll of Polls */}
      <div style={{
        marginTop: 14, borderRadius: 16, padding: '16px',
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12, fontWeight: 700 }}>
          Poll of Polls — All 4 Agencies Average
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {([
            { party: 'TVK', seats: POLL_OF_POLLS.tvk, color: '#fbbf24' },
            { party: 'DMK+', seats: POLL_OF_POLLS.dmk, color: '#f87171' },
            { party: 'AIADMK+', seats: POLL_OF_POLLS.aiadmk, color: '#4ade80' },
            { party: 'Others', seats: POLL_OF_POLLS.others, color: '#94a3b8' },
          ]).map(item => (
            <div key={item.party} style={{
              flex: 1, textAlign: 'center', padding: '10px 6px', borderRadius: 12,
              background: `${item.color}0d`, border: `1px solid ${item.color}22`,
            }}>
              <div style={{ fontWeight: 900, fontSize: 20, color: item.color, fontVariantNumeric: 'tabular-nums' }}>{item.seats}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{item.party}</div>
            </div>
          ))}
        </div>
      </div>

      <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.15)', marginTop: 10 }}>
        Exit poll data from Matrize/India TV, P-MARQ/NewsX, Axis My India/India Today, JVC/Republic (April 29, 2026).
        Exit polls are estimates. NammaTamil does not endorse any party or agency.
      </p>
    </div>
  )
}

// ─── Community Poll ────────────────────────────────────────────────────────────
function CommunityPollSection({ voted, counts, castVote, total }: {
  voted: string | null
  counts: { dmk: number; aiadmk: number; tvk: number }
  castVote: (id: string) => void
  total: number
}) {
  return (
    <div style={{
      borderRadius: 20, marginBottom: 28, overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.09)',
      background: 'rgba(255,255,255,0.015)',
    }}>
      <div style={{
        padding: '18px 20px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(255,255,255,0.02)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      }}>
        <div>
          <h2 style={{ fontWeight: 900, fontSize: 18, color: '#fff' }}>Community Pulse Poll</h2>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>உங்கள் கருத்து · Cast your prediction</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Votes</div>
          <div style={{ fontWeight: 900, fontSize: 24, color: '#fbbf24', fontVariantNumeric: 'tabular-nums' }}>{total.toLocaleString()}</div>
        </div>
      </div>

      <div style={{ padding: '18px 20px' }}>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: 600, marginBottom: 16 }}>
          Who will win the most seats in Tamil Nadu 2026?
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {PARTIES.map(party => {
            const v = counts[party.id as keyof typeof counts] ?? 0
            const pct = total > 0 ? (v / total * 100) : 0
            const isWinning = v === Math.max(...Object.values(counts))
            const isMine = voted === party.id
            const hasVoted = !!voted

            return (
              <button key={party.id} onClick={() => castVote(party.id)} disabled={hasVoted}
                style={{
                  width: '100%', textAlign: 'left',
                  borderRadius: 16, overflow: 'hidden', position: 'relative',
                  border: `${isMine ? '2px' : '1px'} solid ${isMine ? party.color : hasVoted ? 'rgba(255,255,255,0.07)' : party.border}`,
                  background: isMine ? party.dim : 'rgba(255,255,255,0.025)',
                  cursor: hasVoted ? 'default' : 'pointer',
                  transition: 'all 0.2s',
                  padding: 0,
                }}>
                {/* Animated fill bar */}
                {hasVoted && (
                  <div style={{
                    position: 'absolute', inset: 0, left: 0,
                    width: `${pct}%`, background: `${party.color}14`,
                    borderRadius: 14, transition: 'width 0.7s ease',
                    pointerEvents: 'none',
                  }} />
                )}

                <div style={{
                  position: 'relative', zIndex: 1,
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 16px',
                }}>
                  {/* Leader thumbnail */}
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                    overflow: 'hidden', border: `2px solid ${isMine ? party.color : party.border}`,
                    background: party.dim,
                    boxShadow: isMine ? `0 0 12px ${party.color}55` : 'none',
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={party.leaderImg}
                      alt={party.leader}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
                      onError={(e) => {
                        const el = e.target as HTMLImageElement
                        el.style.display = 'none'
                        const parent = el.parentElement
                        if (parent) { const sym = document.createElement('div'); sym.style.display = 'flex'; sym.style.alignItems = 'center'; sym.style.justifyContent = 'center'; sym.style.height = '100%'; parent.appendChild(sym) }
                      }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 900, fontSize: 15, color: party.color }}>{party.name}</span>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{party.leader}</span>
                      {isWinning && hasVoted && (
                        <span style={{
                          fontSize: 9, fontWeight: 900, padding: '2px 7px', borderRadius: 99,
                          background: `${party.color}22`, color: party.color, border: `1px solid ${party.color}40`,
                        }}>
                          LEADING
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                      {party.leaderTamil} · {party.role}
                    </p>
                    {/* Big fill bar on vote */}
                    {hasVoted && (
                      <div style={{ marginTop: 8, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', width: '100%' }}>
                        <div style={{
                          height: '100%', borderRadius: 99,
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, ${party.color}60, ${party.color})`,
                          transition: 'width 0.7s ease',
                        }} />
                      </div>
                    )}
                  </div>
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    {hasVoted ? (
                      <div>
                        <div style={{
                          fontWeight: 900, fontSize: 22, fontVariantNumeric: 'tabular-nums',
                          color: isMine ? party.color : 'rgba(255,255,255,0.35)',
                        }}>
                          {pct.toFixed(1)}%
                        </div>
                        {isMine && (
                          <div style={{ fontSize: 9, fontWeight: 700, color: party.color, display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end', marginTop: 2 }}>
                            <CheckCircle2 style={{ width: 10, height: 10 }} /> Your pick
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%',
                        border: `2px solid ${party.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%' }} />
                      </div>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {!voted && (
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 11, marginTop: 14 }}>
            Select a party to reveal community results
          </p>
        )}
        {voted && (
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 14 }}>
            You picked{' '}
            <span style={{ fontWeight: 700, color: PARTIES.find(p => p.id === voted)?.color }}>
              {PARTIES.find(p => p.id === voted)?.name}
            </span>
            {' '}· Share with friends
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Email Capture ────────────────────────────────────────────────────────────
function EmailCapture() {
  const [email, setEmail]     = useState('')
  const [status, setStatus]   = useState<'idle' | 'ok' | 'err'>('idle')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.includes('@')) { setStatus('err'); return }
    setLoading(true)
    try {
      // Store in localStorage for now — swap for Mailchimp/Resend API later
      const existing = JSON.parse(localStorage.getItem('nt_election_emails') ?? '[]')
      if (!existing.includes(email)) {
        localStorage.setItem('nt_election_emails', JSON.stringify([...existing, email]))
      }
      setStatus('ok')
    } catch {
      setStatus('err')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      borderRadius: 20, marginBottom: 28,
      padding: '20px 20px',
      background: 'rgba(251,191,36,0.05)',
      border: '1px solid rgba(251,191,36,0.18)',
    }}>
      {status === 'ok' ? (
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <div style={{ fontSize: 22, marginBottom: 6 }}>✅</div>
          <div style={{ fontWeight: 800, fontSize: 14, color: '#fbbf24' }}>You&apos;re on the list!</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>We&apos;ll notify you when final results are declared.</div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 18 }}>📬</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#fff' }}>Get the final result alert</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>One email when TN 2026 winner is declared — no spam.</div>
            </div>
          </div>
          <form onSubmit={submit} style={{ display: 'flex', gap: 8 }}>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setStatus('idle') }}
              placeholder="your@email.com"
              required
              style={{
                flex: 1, background: 'rgba(255,255,255,0.06)',
                border: `1px solid ${status === 'err' ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: 10, padding: '9px 12px',
                color: '#fff', fontSize: 13, outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '9px 16px', borderRadius: 10, fontWeight: 800, fontSize: 12,
                background: 'linear-gradient(135deg, rgba(251,191,36,0.9), rgba(245,158,11,0.8))',
                color: '#07010f', border: 'none', cursor: loading ? 'default' : 'pointer',
                opacity: loading ? 0.6 : 1, whiteSpace: 'nowrap',
              }}
            >
              {loading ? '…' : 'Notify me'}
            </button>
          </form>
          {status === 'err' && (
            <p style={{ fontSize: 10, color: '#ef4444', marginTop: 6 }}>Please enter a valid email address.</p>
          )}
        </>
      )}
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
    <div style={{ background: '#07010f', minHeight: '100vh', color: '#f4f4f5' }}>

      {/* ── STICKY NAV ── */}
      <div className="sticky top-0 z-50" style={{
        background: 'rgba(7,1,15,0.92)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div className="max-w-5xl mx-auto" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, textDecoration: 'none', flexShrink: 0, transition: 'color 0.2s' }}>
              ← NammaTamil
            </Link>
            <span style={{ color: 'rgba(255,255,255,0.12)' }}>|</span>
            {isLive ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 900, color: '#ef4444' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'ping 1s infinite' }} />
                COUNTING LIVE
              </span>
            ) : (
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
                TN Election 2026 ·{' '}
                {countdown ? (
                  <span style={{ fontWeight: 900, fontVariantNumeric: 'tabular-nums', color: '#fbbf24' }}>
                    {countdown.d > 0 ? `${countdown.d}d ` : ''}
                    {String(countdown.h).padStart(2, '0')}:{String(countdown.m).padStart(2, '0')}:{String(countdown.s).padStart(2, '0')}
                  </span>
                ) : 'Counting started'}
                {' '}to counting
              </span>
            )}
          </div>
          <button
            onClick={() => navigator.share?.({ title: 'TN Election AI Pulse 2026', url: window.location.href })}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer' }}>
            <Share2 style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto" style={{ padding: '0 20px 80px' }}>

        {/* ── CINEMATIC HERO ── */}
        <div style={{
          position: 'relative', overflow: 'hidden',
          borderRadius: '0 0 32px 32px',
          marginBottom: 32,
          padding: '48px 24px 40px',
          textAlign: 'center',
        }}>
          {/* Animated gradient background */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 0,
            background: 'linear-gradient(160deg, rgba(255,153,51,0.18) 0%, rgba(255,255,255,0.04) 40%, rgba(19,136,8,0.14) 100%)',
          }} />
          {/* Radial glow centre */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            width: 500, height: 300,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(251,191,36,0.12) 0%, transparent 70%)',
            pointerEvents: 'none', zIndex: 0,
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 16px', borderRadius: 99, marginBottom: 20,
              background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.35)',
              color: '#a78bfa', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
            }}>
              <Brain style={{ width: 14, height: 14 }} />
              AI ELECTION PULSE · தமிழ்நாடு 2026
            </div>

            {/* Big Tamil headline */}
            <div style={{
              fontSize: 'clamp(2.4rem,8vw,4.8rem)', fontWeight: 900, lineHeight: 1.05,
              color: '#fff', marginBottom: 8, letterSpacing: '-0.02em',
            }}>
              தேர்தல் 2026
            </div>
            <div style={{
              fontSize: 'clamp(1.2rem,4vw,2.2rem)', fontWeight: 900, lineHeight: 1.1,
              marginBottom: 16, letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, #ff9933 0%, #ffffff 40%, #138808 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              Tamil Nadu Election Results
            </div>

            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 28 }}>
              234 Assembly Seats · 6.4 Crore Voters · Counting: May 4, 2026 at 8:00 AM IST
            </p>

            {/* Hero Countdown / LIVE badge */}
            {isLive ? (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '12px 28px', borderRadius: 99,
                background: 'rgba(239,68,68,0.15)', border: '2px solid rgba(239,68,68,0.5)',
                color: '#ef4444', fontWeight: 900, fontSize: 18, letterSpacing: '0.06em',
              }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'ping 1s infinite' }} />
                🔴 LIVE COUNTING
              </div>
            ) : countdown ? (
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>
                  COUNTING BEGINS IN
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 6 }}>
                  {countdown.d > 0 && (
                    <>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 900, fontVariantNumeric: 'tabular-nums', fontSize: 'clamp(2.8rem,10vw,5.5rem)', color: '#fff', lineHeight: 1 }}>
                          {String(countdown.d).padStart(2, '0')}
                        </div>
                        <div style={{ fontSize: 9, color: 'rgba(255,153,51,0.7)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 4 }}>Days</div>
                      </div>
                      <div style={{ color: 'rgba(251,191,36,0.4)', fontWeight: 900, fontSize: '3rem', marginBottom: 14 }}>:</div>
                    </>
                  )}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 900, fontVariantNumeric: 'tabular-nums', fontSize: 'clamp(2.8rem,10vw,5.5rem)', color: '#fbbf24', lineHeight: 1 }}>
                      {String(countdown.h).padStart(2, '0')}
                    </div>
                    <div style={{ fontSize: 9, color: 'rgba(251,191,36,0.6)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 4 }}>Hrs</div>
                  </div>
                  <div style={{ color: 'rgba(251,191,36,0.4)', fontWeight: 900, fontSize: '3rem', marginBottom: 14 }}>:</div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 900, fontVariantNumeric: 'tabular-nums', fontSize: 'clamp(2.8rem,10vw,5.5rem)', color: '#fbbf24', lineHeight: 1 }}>
                      {String(countdown.m).padStart(2, '0')}
                    </div>
                    <div style={{ fontSize: 9, color: 'rgba(251,191,36,0.6)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 4 }}>Min</div>
                  </div>
                  <div style={{ color: 'rgba(251,191,36,0.4)', fontWeight: 900, fontSize: '3rem', marginBottom: 14 }}>:</div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 900, fontVariantNumeric: 'tabular-nums', fontSize: 'clamp(2.8rem,10vw,5.5rem)', color: 'rgba(255,255,255,0.35)', lineHeight: 1 }}>
                      {String(countdown.s).padStart(2, '0')}
                    </div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 4 }}>Sec</div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 20, fontWeight: 900, color: '#fbbf24' }}>Counting has begun!</div>
            )}
          </div>
        </div>

        {/* ── ELECTION RESULTS LIVE (always shown) ── */}
        <div style={{ marginBottom: 28 }}>
          <ElectionResultsLive />
        </div>

        {/* ── AD UNIT — after live results ── */}
        <AdUnit format="horizontal" className="mb-7 min-h-[90px]" />

        {/* ── KEY FACTS STRIP ── */}
        <KeyFactsStrip />

        {/* ── PARTY SNAPSHOT CARDS ── */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontWeight: 900, fontSize: 18, color: '#fff', marginBottom: 14 }}>Party Snapshot</h2>
          {/* Mobile: horizontal scroll; Desktop: 3 col */}
          <div className="hidden sm:grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {PARTIES.map(p => (
              <div key={p.id} style={{ display: 'flex' }}>
                <PartyCard
                  party={p}
                  exitSeats={p.id === 'tvk' ? FEATURED_POLL.tvk : p.id === 'dmk' ? FEATURED_POLL.dmk : FEATURED_POLL.aiadmk}
                  isWinner={p.id === 'tvk'}
                />
              </div>
            ))}
          </div>
          <div className="sm:hidden" style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
            {PARTIES.map(p => (
              <PartyCard
                key={p.id}
                party={p}
                exitSeats={p.id === 'tvk' ? FEATURED_POLL.tvk : p.id === 'dmk' ? FEATURED_POLL.dmk : FEATURED_POLL.aiadmk}
                isWinner={p.id === 'tvk'}
              />
            ))}
          </div>
        </div>

        {/* ── EXIT POLLS ── */}
        <ExitPollSection />

        {/* ── AI SENTIMENT + VOTE SHARE ── */}
        <div style={{ display: 'grid', gap: 14, marginBottom: 28 }} className="grid-cols-1 lg:grid-cols-2">

          {/* AI Sentiment */}
          <div style={{ borderRadius: 20, padding: '20px', background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <Brain style={{ width: 16, height: 16, color: '#a78bfa' }} />
              <h2 style={{ fontWeight: 900, fontSize: 17, color: '#fff' }}>AI Sentiment Score</h2>
              <span style={{ marginLeft: 'auto', fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>Updated every 6h</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {PARTIES.map(party => (
                <div key={party.id}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <PartySymbol party={party} size={20} />
                      <span style={{ fontWeight: 900, fontSize: 14, color: party.color }}>{party.name}</span>
                      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>{party.leader}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: party.aiTrend.startsWith('+') ? '#4ade80' : '#f87171' }}>
                        {party.aiTrend}
                      </span>
                      <span style={{ fontWeight: 900, fontSize: 14, color: party.color, fontVariantNumeric: 'tabular-nums' }}>
                        {party.aiSentiment}/100
                      </span>
                    </div>
                  </div>
                  <SentimentBar score={party.aiSentiment} color={party.color} />
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{party.aiLabel}</p>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.15)', marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              AI analysis from Tamil social media, news portals & search trends. Not affiliated with any party.
            </p>
          </div>

          {/* Vote Share Donut */}
          <div style={{ borderRadius: 20, padding: '20px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <BarChart2 style={{ width: 16, height: 16, color: '#fbbf24' }} />
              <h2 style={{ fontWeight: 900, fontSize: 17, color: '#fff' }}>Predicted Vote Share</h2>
              <span style={{ marginLeft: 'auto', fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>AI estimate</span>
            </div>
            <VoteShareDonut parties={PARTIES} others={OTHERS} />
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>
                Estimated vote share based on AI trend analysis. Majority mark: 118 seats.
              </p>
            </div>
          </div>
        </div>

        {/* ── COMMUNITY POLL ── */}
        <CommunityPollSection voted={voted} counts={counts} castVote={castVote} total={total} />

        {/* ── EMAIL CAPTURE ── */}
        <EmailCapture />

        {/* ── AD UNIT — between poll and forecast ── */}
        <AdUnit format="horizontal" className="mb-7 min-h-[90px]" />

        {/* ── AI SEAT FORECAST — TABLE + HISTOGRAM ── */}
        <div style={{ borderRadius: 20, marginBottom: 28, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            style={{
              width: '100%', padding: '18px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'rgba(255,255,255,0.025)',
              borderBottom: showForecast ? '1px solid rgba(255,255,255,0.07)' : 'none',
              border: 'none', cursor: 'pointer',
            }}
            onClick={() => setShowForecast(p => !p)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <BarChart2 style={{ width: 16, height: 16, color: '#fbbf24' }} />
              <div style={{ textAlign: 'left' }}>
                <h2 style={{ fontWeight: 900, fontSize: 17, color: '#fff' }}>AI Seat Forecast</h2>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Crowdsourced seat range predictions · 1,143 entries</p>
              </div>
            </div>
            <ChevronDown style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.3)', transform: showForecast ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {showForecast && (
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
                {([{ id: true, label: 'Table View' }, { id: false, label: 'Chart View' }] as const).map(({ id, label }) => (
                  <button key={label} onClick={() => setShowTable(id)}
                    style={{
                      padding: '4px 14px', borderRadius: 99, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      background: showTable === id ? 'rgba(245,158,11,0.14)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${showTable === id ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.08)'}`,
                      color: showTable === id ? '#f59e0b' : 'rgba(255,255,255,0.4)',
                    }}>{label}</button>
                ))}
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>% probability per seat range</span>
              </div>

              {showTable ? (
                <SeatTable parties={PARTIES} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {PARTIES.map(party => <SeatHistogram key={party.id} party={party} />)}
                </div>
              )}

              {/* Other parties */}
              <div style={{ borderRadius: 16, padding: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', marginTop: 16 }}>
                <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12, fontWeight: 700 }}>Other Parties</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }} className="sm:grid-cols-4">
                  {OTHERS.map(p => (
                    <div key={p.name} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 12px', borderRadius: 12,
                      background: `${p.color}10`, border: `1px solid ${p.color}22`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
                        <span style={{ fontWeight: 900, fontSize: 12, color: p.color }}>{p.name}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{p.seats} seats</p>
                        <p style={{ fontWeight: 700, fontSize: 10, color: p.color }}>{p.share}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.15)', marginTop: 14 }}>
                Community crowd-submitted predictions. AI weights by recency and source credibility.
                Not official polling data. NammaTamil does not endorse any party.
              </p>
            </div>
          )}
        </div>

        {/* ── DISCLAIMER ── */}
        <div style={{ borderRadius: 16, padding: '16px', textAlign: 'center', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', lineHeight: 1.7 }}>
            NammaTamil AI Election Pulse is an independent community platform. Poll results and seat forecasts
            are crowd-submitted data only and do not represent official exit polls or survey results.
            Live counting results will activate on May 4, 2026 at 8 AM IST.
          </p>
        </div>
      </div>
    </div>
  )
}
