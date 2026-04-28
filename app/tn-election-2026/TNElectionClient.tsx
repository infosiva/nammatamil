'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { BarChart3, ChevronRight } from 'lucide-react'
import Link from 'next/link'

// ── Party config ──────────────────────────────────────────────────────────────
const PARTIES = [
  {
    id: 'dmk',
    name: 'DMK',
    tamil: 'திமுக',
    leader: 'M. K. Stalin',
    leaderTamil: 'மு.க. ஸ்டாலின்',
    role: 'Chief Minister, Tamil Nadu',
    color: '#dc2626',
    colorLight: 'rgba(220,38,38,0.15)',
    border: 'rgba(220,38,38,0.4)',
    flagBg: 'linear-gradient(160deg, rgba(220,38,38,0.35) 0%, rgba(220,38,38,0.05) 100%)',
    // Wikimedia Commons — public domain government photo
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/M._K._Stalin_in_2023.jpg/400px-M._K._Stalin_in_2023.jpg',
    ranges: [
      { label: '< 100',   pct: 2  },
      { label: '100–117', pct: 8  },
      { label: '118–150', pct: 24 },
      { label: '150–180', pct: 54 },
      { label: '180+',    pct: 12 },
    ],
    popularRange: '150–180',
    symbolSvg: `<svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><circle cx="22" cy="28" r="10" fill="#dc2626"/>${Array.from({length:12},(_,i)=>{const a=(i*30-90)*Math.PI/180;return`<line x1="${22+12*Math.cos(a)}" y1="${28+12*Math.sin(a)}" x2="${22+17*Math.cos(a)}" y2="${28+17*Math.sin(a)}" stroke="#dc2626" stroke-width="2.2" stroke-linecap="round"/>`}).join('')}<path d="M4 28 Q22 6 40 28" fill="#dc2626" opacity="0.28"/></svg>`,
  },
  {
    id: 'aiadmk',
    name: 'AIADMK',
    tamil: 'அதிமுக',
    leader: 'E. Palaniswami',
    leaderTamil: 'எடப்பாடி பழனிசாமி',
    role: 'Former CM · Opposition Leader',
    color: '#16a34a',
    colorLight: 'rgba(22,163,74,0.15)',
    border: 'rgba(22,163,74,0.4)',
    flagBg: 'linear-gradient(160deg, rgba(22,163,74,0.35) 0%, rgba(22,163,74,0.05) 100%)',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Edappadi_K._Palaniswami_%28cropped%29.jpg/400px-Edappadi_K._Palaniswami_%28cropped%29.jpg',
    ranges: [
      { label: '< 50',    pct: 1  },
      { label: '50–80',   pct: 2  },
      { label: '80–117',  pct: 7  },
      { label: '118–150', pct: 23 },
      { label: '150+',    pct: 67 },
    ],
    popularRange: '150+',
    symbolSvg: `<svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><path d="M22 38 C22 38 8 27 8 15 C8 8 14 5 22 11 C30 5 36 8 36 15 C36 27 22 38 22 38Z" fill="none" stroke="#16a34a" stroke-width="2.8"/><path d="M22 38 C18 29 9 24 9 15 C9 9 14 7 22 11" fill="#16a34a" opacity="0.38"/><path d="M22 38 C26 29 35 24 35 15 C35 9 30 7 22 11" fill="#16a34a" opacity="0.75"/><line x1="22" y1="38" x2="22" y2="13" stroke="#16a34a" stroke-width="1.8"/></svg>`,
  },
  {
    id: 'tvk',
    name: 'TVK',
    tamil: 'தவக',
    leader: 'Vijay',
    leaderTamil: 'விஜய் (தளபதி)',
    role: 'Party President, TVK',
    color: '#f59e0b',
    colorLight: 'rgba(245,158,11,0.15)',
    border: 'rgba(245,158,11,0.4)',
    flagBg: 'linear-gradient(160deg, rgba(245,158,11,0.30) 0%, rgba(245,158,11,0.05) 100%)',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Vijay_at_the_audio_launch_of_Varisu_%28cropped%29.jpg/400px-Vijay_at_the_audio_launch_of_Varisu_%28cropped%29.jpg',
    ranges: [
      { label: '< 20',   pct: 5  },
      { label: '20–40',  pct: 7  },
      { label: '40–70',  pct: 13 },
      { label: '70–100', pct: 15 },
      { label: '100+',   pct: 60 },
    ],
    popularRange: '100+',
    symbolSvg: `<svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="16" width="22" height="14" rx="7" fill="#f59e0b"/><rect x="26" y="19.5" width="12" height="7" rx="3.5" fill="#d97706"/><rect x="10" y="12" width="8" height="5" rx="2.5" fill="#d97706"/><circle cx="17" cy="23" r="3.5" fill="none" stroke="#92400e" stroke-width="1.8"/><circle cx="17" cy="23" r="1.4" fill="#92400e" opacity="0.7"/><circle cx="7.5" cy="23" r="3.2" fill="none" stroke="#f59e0b" stroke-width="2.2"/></svg>`,
  },
]

const OTHER_PARTIES = [
  { name: 'BJP',      color: '#f97316', seats: '8–15'  },
  { name: 'Congress', color: '#3b82f6', seats: '5–12'  },
  { name: 'PMK',      color: '#10b981', seats: '4–10'  },
  { name: 'Others',   color: '#94a3b8', seats: '10–20' },
]

const TOTAL_SEATS = 234
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

function useLocalVotes() {
  const KEY = 'tn_election_vote_2026'
  const COUNTS_KEY = 'tn_election_counts_2026'
  const [voted, setVoted] = useState<string | null>(null)
  const [counts, setCounts] = useState({ dmk: 342, aiadmk: 421, tvk: 537 })

  useEffect(() => {
    const v = localStorage.getItem(KEY)
    const c = localStorage.getItem(COUNTS_KEY)
    if (v) setVoted(v)
    if (c) setCounts(JSON.parse(c))
  }, [])

  const castVote = useCallback((partyId: string) => {
    if (voted) return
    setVoted(partyId)
    setCounts(prev => {
      const next = { ...prev, [partyId]: (prev[partyId as keyof typeof prev] ?? 0) + 1 }
      localStorage.setItem(COUNTS_KEY, JSON.stringify(next))
      return next
    })
    localStorage.setItem(KEY, partyId)
  }, [voted])

  return { voted, counts, castVote }
}

function PredictionBar({ party }: { party: typeof PARTIES[0] }) {
  const picks = Math.round(party.ranges.reduce((s, r) => s + r.pct, 0) * 4.8)
  const maxPct = Math.max(...party.ranges.map(r => r.pct))

  return (
    <div className="rounded-2xl p-4 sm:p-5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7" dangerouslySetInnerHTML={{ __html: party.symbolSvg }} />
          <span className="font-black text-base sm:text-lg" style={{ color: party.color }}>{party.name}</span>
          <span className="text-white/35 text-xs hidden sm:inline">
            most popular: <span style={{ color: party.color }}>{party.popularRange}</span>
          </span>
        </div>
        <span className="text-xs font-black" style={{ color: party.color }}>{picks.toLocaleString()} PICKS</span>
      </div>
      <div className="flex gap-1.5 sm:gap-3">
        {party.ranges.map((range, i) => {
          const barH = Math.max(8, (range.pct / maxPct) * 88)
          const isPopular = range.label === party.popularRange
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex items-end" style={{ height: '96px' }}>
                <div
                  className="w-full rounded-t transition-all duration-700"
                  style={{
                    height: `${barH}px`,
                    background: isPopular ? party.color : `${party.color}44`,
                    boxShadow: isPopular ? `0 0 14px ${party.color}50` : 'none',
                  }}
                />
              </div>
              <div className="text-white/40 text-[8px] sm:text-[9px] text-center leading-tight">{range.label}</div>
              <div className="font-bold text-[9px] sm:text-[10px]" style={{ color: isPopular ? party.color : 'rgba(255,255,255,0.35)' }}>
                {range.pct}%
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function TNElectionClient() {
  const [countdown, setCountdown] = useState(getCountdown)
  const [isLive, setIsLive] = useState(false)
  const [imgError, setImgError] = useState<Record<string, boolean>>({})
  const { voted, counts, castVote } = useLocalVotes()

  useEffect(() => {
    const id = setInterval(() => {
      const c = getCountdown()
      setCountdown(c)
      if (!c) setIsLive(true)
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const totalVotes = counts.dmk + counts.aiadmk + counts.tvk

  return (
    <div className="min-h-screen" style={{ background: '#060501' }}>

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden min-h-[520px] sm:min-h-[620px]">
        {/* Full-bleed atmospheric background */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 80% 70% at 50% -10%, rgba(220,38,38,0.18) 0%, transparent 55%), radial-gradient(ellipse 50% 60% at 15% 80%, rgba(22,163,74,0.12) 0%, transparent 50%), radial-gradient(ellipse 50% 60% at 85% 80%, rgba(245,158,11,0.12) 0%, transparent 50%), #060501',
        }} />
        {/* Subtle grid texture */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">

          {/* Top nav pills */}
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            {isLive ? (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black"
                style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.5)', color: '#ef4444' }}>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
                COUNTING LIVE
              </span>
            ) : (
              <span className="px-3 py-1.5 rounded-full text-xs font-black"
                style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', color: '#f59e0b' }}>
                2026 ELECTION
              </span>
            )}
            <Link href="#predictions" className="px-3 py-1.5 rounded-full text-xs font-semibold text-white/50 hover:text-white/80 transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              Seat Predictions
            </Link>
            <Link href="#vote" className="px-3 py-1.5 rounded-full text-xs font-semibold text-white/50 hover:text-white/80 transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              Cast Your Vote
            </Link>
          </div>

          {/* Countdown row */}
          {!isLive && countdown && (
            <div className="flex items-center gap-2 sm:gap-4 mb-6">
              <span className="text-white/30 text-xs uppercase tracking-widest">Counting starts</span>
              {[{val:countdown.d,l:'d'},{val:countdown.h,l:'h'},{val:countdown.m,l:'m'},{val:countdown.s,l:'s'}].map(({val,l})=>(
                <span key={l} className="text-amber-400 font-black text-sm sm:text-base tabular-nums">
                  {String(val).padStart(2,'0')}<span className="text-white/25 text-xs font-normal">{l}</span>
                </span>
              ))}
            </div>
          )}

          {/* Main title */}
          <h1 className="font-black text-4xl sm:text-6xl md:text-7xl text-white leading-none tracking-tight mb-2">
            TAMIL NADU<br />
            <span style={{ background: 'linear-gradient(90deg,#f59e0b,#fbbf24)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
              ELECTIONS 2026
            </span>
          </h1>
          <p className="text-white/50 font-bold text-lg sm:text-2xl tracking-widest mb-10 uppercase">
            Who will lead Tamil Nadu?
          </p>

          {/* ── Leader portraits ── */}
          <div className="grid grid-cols-3 gap-3 sm:gap-5 lg:gap-8">
            {PARTIES.map((party) => (
              <div key={party.id} className="group flex flex-col">
                {/* Portrait card */}
                <div
                  className="relative rounded-2xl sm:rounded-3xl overflow-hidden"
                  style={{
                    aspectRatio: '2/3',
                    maxHeight: '380px',
                    background: party.flagBg,
                    border: `1px solid ${party.border}`,
                    boxShadow: `0 8px 40px ${party.color}20, 0 0 0 1px ${party.color}15`,
                  }}
                >
                  {/* Party colour stripe */}
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ background: party.color }} />

                  {/* Leader photo */}
                  {!imgError[party.id] ? (
                    <Image
                      src={party.photo}
                      alt={party.leader}
                      fill
                      className="object-cover object-top"
                      sizes="(max-width: 640px) 33vw, (max-width: 1024px) 280px, 320px"
                      onError={() => setImgError(prev => ({ ...prev, [party.id]: true }))}
                      unoptimized
                    />
                  ) : (
                    // Fallback: large initial letter
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-black text-7xl sm:text-8xl opacity-20" style={{ color: party.color }}>
                        {party.leader.split(' ').pop()![0]}
                      </span>
                    </div>
                  )}

                  {/* Bottom gradient overlay */}
                  <div className="absolute bottom-0 left-0 right-0 h-2/5"
                    style={{ background: `linear-gradient(to top, ${party.color}60 0%, transparent 100%)` }} />

                  {/* Party symbol + name overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 text-center">
                    <div className="flex justify-center mb-1">
                      <div
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: `1px solid ${party.color}50` }}
                        dangerouslySetInnerHTML={{ __html: party.symbolSvg }}
                      />
                    </div>
                  </div>
                </div>

                {/* Name below card */}
                <div className="mt-3 text-center">
                  <p className="font-black text-white text-sm sm:text-base md:text-lg leading-tight">{party.leader}</p>
                  <p className="text-white/35 text-[10px] sm:text-xs mt-0.5">{party.leaderTamil}</p>
                  <div className="flex items-center justify-center gap-1.5 mt-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: party.color }} />
                    <span className="font-black text-xs sm:text-sm" style={{ color: party.color }}>{party.name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tagline */}
          <p className="text-center text-white/20 text-xs uppercase tracking-[0.25em] mt-8 pb-10">
            Your Vote · Your Voice · Your Tamil Nadu · உங்கள் வாக்கு உங்கள் குரல்
          </p>
        </div>
      </section>

      {/* ══ VOTE POLL ═════════════════════════════════════════════════════════ */}
      <section id="vote" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-white font-black text-2xl sm:text-3xl">Who will lead Tamil Nadu?</h2>
            <p className="text-white/35 text-xs mt-1">Cast your prediction — results update live</p>
          </div>
          <div className="text-right">
            <p className="text-white/20 text-[9px] uppercase tracking-widest">Total votes</p>
            <p className="font-black text-2xl tabular-nums" style={{ color: '#f59e0b' }}>{totalVotes.toLocaleString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {PARTIES.map(party => {
            const voteCount = counts[party.id as keyof typeof counts] ?? 0
            const pct = totalVotes > 0 ? ((voteCount / totalVotes) * 100).toFixed(1) : '0.0'
            const isWinning = voteCount === Math.max(...Object.values(counts))
            const hasVoted = !!voted
            const myVote = voted === party.id

            return (
              <div
                key={party.id}
                className="rounded-2xl p-4 sm:p-5 flex flex-col gap-3 transition-all duration-300"
                style={{
                  background: myVote ? party.colorLight : 'rgba(255,255,255,0.03)',
                  border: `1.5px solid ${myVote ? party.color + '80' : 'rgba(255,255,255,0.07)'}`,
                  boxShadow: myVote ? `0 0 32px ${party.color}18` : 'none',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8" dangerouslySetInnerHTML={{ __html: party.symbolSvg }} />
                    <div>
                      <p className="font-black text-sm leading-tight" style={{ color: party.color }}>{party.name}</p>
                      <p className="text-white/35 text-[9px]">{party.tamil}</p>
                    </div>
                  </div>
                  {isWinning && !hasVoted && (
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full"
                      style={{ background: `${party.color}20`, color: party.color, border: `1px solid ${party.color}40` }}>
                      LEADING
                    </span>
                  )}
                </div>

                <div>
                  <p className="text-white font-black text-base leading-tight">{party.leader}</p>
                  <p className="text-white/35 text-[10px]">{party.role}</p>
                </div>

                <div>
                  <p className="font-black text-4xl leading-none" style={{ color: party.color }}>{pct}%</p>
                  <p className="text-white/25 text-[10px] mt-0.5">{voteCount.toLocaleString()} votes</p>
                </div>

                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: party.color }} />
                </div>

                <button
                  onClick={() => castVote(party.id)}
                  disabled={hasVoted}
                  className="w-full py-2.5 rounded-xl font-black text-sm uppercase tracking-wider transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: myVote ? party.color : hasVoted ? 'rgba(255,255,255,0.04)' : party.colorLight,
                    border: `1px solid ${hasVoted ? 'rgba(255,255,255,0.08)' : party.border}`,
                    color: myVote ? '#000' : hasVoted ? 'rgba(255,255,255,0.2)' : party.color,
                    cursor: hasVoted ? 'default' : 'pointer',
                  }}
                >
                  {myVote ? '✓ Voted' : hasVoted ? 'Voted' : 'Vote'}
                </button>
              </div>
            )
          })}
        </div>

        {voted && (
          <p className="text-center text-white/30 text-xs mt-3">
            You voted for <span className="font-bold" style={{ color: PARTIES.find(p=>p.id===voted)?.color }}>
              {PARTIES.find(p=>p.id===voted)?.name}
            </span>. Share this page!
          </p>
        )}
      </section>

      {/* ══ SEAT PREDICTIONS ══════════════════════════════════════════════════ */}
      <section id="predictions" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-end justify-between mb-2">
          <div>
            <h2 className="text-white font-black text-2xl sm:text-3xl flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-amber-400" />
              What Everyone Predicts
            </h2>
            <p className="text-white/35 text-xs mt-1">Crowdsourced seat forecasts · {TOTAL_SEATS} total seats</p>
          </div>
          <span className="font-black text-xl text-amber-400 tabular-nums">1,143</span>
        </div>
        <p className="text-white/20 text-xs mb-5">
          ⚡ Non-partisan aggregated forecast. NammaTamil does not endorse any political party.
        </p>

        <div className="space-y-3">
          {PARTIES.map(party => <PredictionBar key={party.id} party={party} />)}
        </div>

        <div className="mt-4 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-white/35 text-[10px] uppercase tracking-widest mb-3">Other Parties</p>
          <div className="flex flex-wrap gap-2">
            {OTHER_PARTIES.map(p => (
              <div key={p.name} className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                style={{ background: `${p.color}10`, border: `1px solid ${p.color}28` }}>
                <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                <span className="text-xs font-bold" style={{ color: p.color }}>{p.name}</span>
                <span className="text-white/35 text-xs">{p.seats} seats</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-white/15 text-xs mt-6 leading-relaxed">
          Live results activate at counting start · May 4, 8 AM IST<br />
          Disclaimer: Seat predictions are crowdsourced estimates, not official forecasts.
        </p>
      </section>

      {/* ══ FOOTER LINKS ══════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-wrap gap-2 justify-end">
        <Link href="/" className="px-3 py-1.5 rounded-xl text-xs font-bold text-white/40 hover:text-white/70 transition-colors"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          ← Home
        </Link>
        <Link href="/serials" className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white/40 hover:text-white/70 transition-colors"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          Serials <ChevronRight className="w-3 h-3" />
        </Link>
        <Link href="/movies" className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white/40 hover:text-white/70 transition-colors"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          Movies <ChevronRight className="w-3 h-3" />
        </Link>
      </section>
    </div>
  )
}
