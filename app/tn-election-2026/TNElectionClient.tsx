'use client'

import { useState, useEffect, useCallback } from 'react'
import { BarChart3, Share2, ChevronDown } from 'lucide-react'
import Link from 'next/link'

// ─── Party data ───────────────────────────────────────────────────────────────
const PARTIES = [
  {
    id: 'dmk',
    name: 'DMK',
    tamil: 'திமுக',
    leader: 'M. K. Stalin',
    leaderShort: 'Stalin',
    leaderTamil: 'மு.க. ஸ்டாலின்',
    role: 'Chief Minister',
    initial: 'S',
    color: '#e53e3e',
    colorDark: '#991b1b',
    colorGlow: 'rgba(229,62,62,0.35)',
    bg: 'radial-gradient(ellipse 80% 100% at 50% 100%, rgba(229,62,62,0.5) 0%, rgba(120,20,20,0.6) 50%, #0a0000 100%)',
    border: 'rgba(229,62,62,0.5)',
    ranges: [
      { label: '< 100',   pct: 2  },
      { label: '100–117', pct: 8  },
      { label: '118–150', pct: 24 },
      { label: '150–180', pct: 54 },
      { label: '180+',    pct: 12 },
    ],
    popularRange: '150–180',
    // Rising sun
    symbol: (size = 48) => `<svg width="${size}" height="${size}" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="30" r="11" fill="#e53e3e"/>
      ${Array.from({length:12},(_,i)=>{const a=(i*30-90)*Math.PI/180;return`<line x1="${24+13*Math.cos(a)}" y1="${30+13*Math.sin(a)}" x2="${24+19*Math.cos(a)}" y2="${30+19*Math.sin(a)}" stroke="#e53e3e" stroke-width="2.5" stroke-linecap="round"/>`}).join('')}
      <path d="M4 30 Q24 6 44 30" fill="#e53e3e" opacity="0.25"/>
    </svg>`,
  },
  {
    id: 'aiadmk',
    name: 'AIADMK',
    tamil: 'அதிமுக',
    leader: 'E. Palaniswami',
    leaderShort: 'Palaniswami',
    leaderTamil: 'எடப்பாடி பழனிசாமி',
    role: 'Opposition Leader',
    initial: 'P',
    color: '#16a34a',
    colorDark: '#14532d',
    colorGlow: 'rgba(22,163,74,0.35)',
    bg: 'radial-gradient(ellipse 80% 100% at 50% 100%, rgba(22,163,74,0.5) 0%, rgba(10,60,20,0.6) 50%, #000a02 100%)',
    border: 'rgba(22,163,74,0.5)',
    ranges: [
      { label: '< 50',    pct: 1  },
      { label: '50–80',   pct: 2  },
      { label: '80–117',  pct: 7  },
      { label: '118–150', pct: 23 },
      { label: '150+',    pct: 67 },
    ],
    popularRange: '150+',
    // Two leaves
    symbol: (size = 48) => `<svg width="${size}" height="${size}" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 42 C24 42 9 30 9 17 C9 9 15 6 24 12 C33 6 39 9 39 17 C39 30 24 42 24 42Z" fill="none" stroke="#16a34a" stroke-width="3"/>
      <path d="M24 42 C20 31 10 25 10 17 C10 10 15 8 24 12" fill="#16a34a" opacity="0.35"/>
      <path d="M24 42 C28 31 38 25 38 17 C38 10 33 8 24 12" fill="#16a34a" opacity="0.75"/>
      <line x1="24" y1="42" x2="24" y2="14" stroke="#16a34a" stroke-width="2"/>
    </svg>`,
  },
  {
    id: 'tvk',
    name: 'TVK',
    tamil: 'தவக',
    leader: 'Vijay',
    leaderShort: 'Vijay',
    leaderTamil: 'விஜய் (தளபதி)',
    role: 'Party President',
    initial: 'V',
    color: '#d97706',
    colorDark: '#78350f',
    colorGlow: 'rgba(217,119,6,0.35)',
    bg: 'radial-gradient(ellipse 80% 100% at 50% 100%, rgba(217,119,6,0.5) 0%, rgba(80,40,0,0.6) 50%, #050300 100%)',
    border: 'rgba(217,119,6,0.5)',
    ranges: [
      { label: '< 20',   pct: 5  },
      { label: '20–40',  pct: 7  },
      { label: '40–70',  pct: 13 },
      { label: '70–100', pct: 15 },
      { label: '100+',   pct: 60 },
    ],
    popularRange: '100+',
    // Whistle
    symbol: (size = 48) => `<svg width="${size}" height="${size}" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="17" width="24" height="16" rx="8" fill="#d97706"/>
      <rect x="28" y="21" width="14" height="8" rx="4" fill="#b45309"/>
      <rect x="10" y="12" width="10" height="6" rx="3" fill="#b45309"/>
      <circle cx="18" cy="25" r="4" fill="none" stroke="#78350f" stroke-width="2"/>
      <circle cx="18" cy="25" r="1.8" fill="#78350f" opacity="0.7"/>
      <circle cx="8" cy="25" r="4" fill="none" stroke="#d97706" stroke-width="2.5"/>
    </svg>`,
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
  const VOTED_KEY  = 'tn2026_voted'
  const COUNTS_KEY = 'tn2026_counts'
  const [voted, setVoted]   = useState<string | null>(null)
  const [counts, setCounts] = useState({ dmk: 342, aiadmk: 421, tvk: 537 })

  useEffect(() => {
    const v = localStorage.getItem(VOTED_KEY)
    const c = localStorage.getItem(COUNTS_KEY)
    if (v) setVoted(v)
    if (c) { try { setCounts(JSON.parse(c)) } catch {} }
  }, [])

  const castVote = useCallback((id: string) => {
    if (voted) return
    setVoted(id)
    setCounts(prev => {
      const next = { ...prev, [id]: (prev[id as keyof typeof prev] ?? 0) + 1 }
      localStorage.setItem(COUNTS_KEY, JSON.stringify(next))
      return next
    })
    localStorage.setItem(VOTED_KEY, id)
  }, [voted])

  return { voted, counts, castVote }
}

// ─── Prediction histogram ─────────────────────────────────────────────────────
function PredictionBar({ party }: { party: typeof PARTIES[0] }) {
  const maxPct = Math.max(...party.ranges.map(r => r.pct))
  return (
    <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${party.color}22` }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div dangerouslySetInnerHTML={{ __html: party.symbol(32) }} />
          <div>
            <span className="font-black text-lg" style={{ color: party.color }}>{party.name}</span>
            <span className="text-white/30 text-xs ml-2">most popular: <span style={{ color: party.color }}>{party.popularRange}</span></span>
          </div>
        </div>
        <span className="text-xs font-black" style={{ color: party.color }}>
          {Math.round(party.ranges.reduce((s,r)=>s+r.pct,0) * 4.8).toLocaleString()} PICKS
        </span>
      </div>
      <div className="flex gap-2 sm:gap-4">
        {party.ranges.map((r, i) => {
          const h = Math.max(6, (r.pct / maxPct) * 100)
          const isTop = r.label === party.popularRange
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full flex items-end" style={{ height: '108px' }}>
                <div className="w-full rounded-t-lg transition-all duration-700 relative overflow-hidden"
                  style={{ height: `${h}px`, background: isTop ? party.color : `${party.color}33` }}>
                  {isTop && <div className="absolute inset-0 opacity-40" style={{
                    background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent)',
                    animation: 'shimmer 2s infinite',
                  }}/>}
                </div>
              </div>
              <div className="text-white/40 text-[9px] text-center leading-tight">{r.label}</div>
              <div className="font-black text-[10px]" style={{ color: isTop ? party.color : 'rgba(255,255,255,0.3)' }}>
                {r.pct}%
              </div>
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
  const [isLive, setIsLive]       = useState(false)
  const [showPredictions, setShowPredictions] = useState(false)
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
    <div style={{ background: '#050404', minHeight: '100vh' }}>

      {/* ══ HERO ══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* Atmospheric BG */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 60% 50% at 20% 60%, rgba(229,62,62,0.12) 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 80% 60%, rgba(217,119,6,0.10) 0%, transparent 55%), radial-gradient(ellipse 40% 40% at 50% 100%, rgba(22,163,74,0.08) 0%, transparent 50%)',
        }}/>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">

          {/* Top bar */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              {isLive
                ? <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black" style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.5)', color: '#ef4444' }}>
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block"/>LIVE
                  </span>
                : <span className="px-3 py-1.5 rounded-full text-xs font-black" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.35)', color: '#f59e0b' }}>
                    2026 ELECTION
                  </span>
              }
              {!isLive && countdown && (
                <span className="text-white/40 text-xs">
                  Counting in <span className="text-amber-400 font-bold tabular-nums">
                    {countdown.d}d {String(countdown.h).padStart(2,'0')}:{String(countdown.m).padStart(2,'0')}:{String(countdown.s).padStart(2,'0')}
                  </span>
                </span>
              )}
            </div>
            <button
              onClick={() => { if(navigator.share) navigator.share({ title: 'TN Elections 2026', url: window.location.href }) }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-white/40 hover:text-white/70 transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <Share2 className="w-3 h-3"/> Share
            </button>
          </div>

          {/* Big headline */}
          <div className="text-center mb-12">
            <p className="text-white/30 text-xs sm:text-sm uppercase tracking-[0.3em] mb-3">
              தமிழ்நாடு சட்டமன்றத் தேர்தல்
            </p>
            <h1 className="font-black text-5xl sm:text-7xl md:text-8xl text-white leading-none tracking-tight">
              TAMIL NADU
            </h1>
            <h2 className="font-black text-5xl sm:text-7xl md:text-8xl leading-none tracking-tight mb-4"
              style={{ background: 'linear-gradient(90deg,#e53e3e 0%,#f59e0b 50%,#16a34a 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
              ELECTIONS 2026
            </h2>
            <p className="text-white/40 font-semibold text-lg sm:text-xl tracking-[0.15em] uppercase">
              Who will lead Tamil Nadu?
            </p>
          </div>

          {/* ── Three leader cards ── */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-3xl mx-auto mb-10">
            {PARTIES.map(party => (
              <button
                key={party.id}
                onClick={() => castVote(party.id)}
                disabled={!!voted}
                className="group relative rounded-2xl sm:rounded-3xl overflow-hidden transition-all duration-300 focus:outline-none"
                style={{
                  aspectRatio: '2/3',
                  background: party.bg,
                  border: `1.5px solid ${voted === party.id ? party.color : party.border}`,
                  boxShadow: voted === party.id
                    ? `0 0 40px ${party.colorGlow}, 0 0 80px ${party.colorGlow.replace('0.35','0.15')}`
                    : `0 4px 30px rgba(0,0,0,0.5)`,
                  transform: voted === party.id ? 'scale(1.04)' : undefined,
                  cursor: voted ? 'default' : 'pointer',
                }}
              >
                {/* Hover glow overlay */}
                {!voted && (
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl sm:rounded-3xl"
                    style={{ boxShadow: `inset 0 0 40px ${party.colorGlow}`, border: `1.5px solid ${party.color}` }}/>
                )}

                {/* Voted check */}
                {voted === party.id && (
                  <div className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center font-black text-sm z-10"
                    style={{ background: party.color, color: '#000' }}>✓</div>
                )}

                {/* Big initial letter */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className="font-black select-none transition-all duration-300 group-hover:scale-110"
                    style={{
                      fontSize: 'clamp(4rem, 12vw, 7rem)',
                      color: party.color,
                      opacity: voted === party.id ? 0.5 : 0.25,
                      textShadow: `0 0 60px ${party.colorGlow}`,
                    }}
                  >
                    {party.initial}
                  </span>
                </div>

                {/* Party symbol — centred */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="transition-transform duration-300 group-hover:scale-110"
                    dangerouslySetInnerHTML={{ __html: party.symbol(56) }}
                  />
                </div>

                {/* Bottom name overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4"
                  style={{ background: `linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)` }}>
                  <p className="font-black text-white text-xs sm:text-sm leading-tight">{party.leader}</p>
                  <p className="text-white/40 text-[9px] sm:text-[10px] mt-0.5">{party.leaderTamil}</p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: party.color }}/>
                    <span className="font-black text-[10px] sm:text-xs" style={{ color: party.color }}>{party.name}</span>
                  </div>
                </div>

                {/* "TAP TO VOTE" hint on hover — only before voted */}
                {!voted && (
                  <div className="absolute top-3 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider"
                      style={{ background: party.color, color: '#000' }}>
                      Tap to vote
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Tagline */}
          <p className="text-center text-white/20 text-[10px] uppercase tracking-[0.3em]">
            Your Vote · Your Voice · Your Tamil Nadu
          </p>
        </div>
      </section>

      {/* ══ VOTE RESULTS ════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-white font-black text-2xl sm:text-3xl">Who will lead Tamil Nadu?</h2>
            <p className="text-white/30 text-xs mt-1">Cast your vote — results update instantly</p>
          </div>
          <div className="text-right">
            <p className="text-white/20 text-[9px] uppercase tracking-widest">Total votes</p>
            <p className="font-black text-2xl sm:text-3xl tabular-nums" style={{ color: '#f59e0b' }}>
              {total.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PARTIES.map(party => {
            const v = counts[party.id as keyof typeof counts] ?? 0
            const pct = total > 0 ? (v / total * 100) : 0
            const isWinning = v === Math.max(...Object.values(counts))
            const isMine = voted === party.id

            return (
              <div
                key={party.id}
                className="rounded-2xl p-5 sm:p-6 flex flex-col gap-4 transition-all duration-500"
                style={{
                  background: isMine
                    ? `linear-gradient(135deg, ${party.color}18 0%, ${party.color}08 100%)`
                    : 'rgba(255,255,255,0.025)',
                  border: `1.5px solid ${isMine ? party.color + '60' : 'rgba(255,255,255,0.07)'}`,
                  boxShadow: isMine ? `0 0 40px ${party.color}15` : 'none',
                }}
              >
                {/* Party + leader */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div dangerouslySetInnerHTML={{ __html: party.symbol(36) }}/>
                    <div>
                      <p className="font-black text-sm sm:text-base" style={{ color: party.color }}>{party.name}</p>
                      <p className="text-white/35 text-[10px]">{party.tamil}</p>
                    </div>
                  </div>
                  {isWinning && (
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: `${party.color}22`, color: party.color, border: `1px solid ${party.color}44` }}>
                      LEADING
                    </span>
                  )}
                </div>

                <div>
                  <p className="text-white font-black text-base sm:text-lg leading-tight">{party.leader}</p>
                  <p className="text-white/30 text-[10px] mt-0.5">{party.role}</p>
                </div>

                {/* Big percentage */}
                <div>
                  <p className="font-black leading-none tabular-nums"
                    style={{ fontSize: 'clamp(2.5rem,6vw,4rem)', color: party.color }}>
                    {pct.toFixed(1)}%
                  </p>
                  <p className="text-white/25 text-xs mt-1">{v.toLocaleString()} votes</p>
                </div>

                {/* Bar */}
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${party.colorDark}, ${party.color})` }}/>
                </div>

                {/* Vote button */}
                <button
                  onClick={() => castVote(party.id)}
                  disabled={!!voted}
                  className="w-full py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all duration-200"
                  style={{
                    background: isMine
                      ? party.color
                      : voted ? 'rgba(255,255,255,0.04)' : `${party.color}18`,
                    border: `1.5px solid ${voted ? 'rgba(255,255,255,0.08)' : party.color + '60'}`,
                    color: isMine ? '#000' : voted ? 'rgba(255,255,255,0.2)' : party.color,
                    cursor: voted ? 'default' : 'pointer',
                    transform: !voted ? undefined : 'none',
                  }}
                >
                  {isMine ? '✓ Voted' : voted ? 'Vote Cast' : 'VOTE'}
                </button>
              </div>
            )
          })}
        </div>

        {voted && (
          <div className="mt-4 text-center">
            <p className="text-white/35 text-sm">
              You voted for <span className="font-bold" style={{ color: PARTIES.find(p=>p.id===voted)?.color }}>
                {PARTIES.find(p=>p.id===voted)?.name}
              </span> · Share this poll with friends
            </p>
          </div>
        )}
      </section>

      {/* ══ SEAT PREDICTIONS ════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Toggle header */}
        <button
          onClick={() => setShowPredictions(p => !p)}
          className="w-full flex items-center justify-between p-5 rounded-2xl mb-3 transition-all hover:bg-white/3"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-amber-400"/>
            <div className="text-left">
              <h3 className="text-white font-black text-lg sm:text-xl">What Everyone Predicts</h3>
              <p className="text-white/30 text-xs">Crowdsourced seat forecasts · 234 total seats</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-amber-400 font-black text-xl tabular-nums">1,143</span>
            <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${showPredictions ? 'rotate-180' : ''}`}/>
          </div>
        </button>

        {showPredictions && (
          <>
            <p className="text-white/20 text-xs mb-4 px-1">
              ⚡ Non-partisan aggregated forecasts. NammaTamil does not endorse any political party.
              Predictions are community estimates, not official poll data.
            </p>

            <div className="space-y-3">
              {PARTIES.map(party => <PredictionBar key={party.id} party={party}/>)}
            </div>

            {/* Other parties */}
            <div className="mt-3 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-white/30 text-[10px] uppercase tracking-widest mb-3">Other Parties (Predicted)</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { name:'BJP',color:'#f97316',seats:'8–15'  },
                  { name:'Congress',color:'#3b82f6',seats:'5–12' },
                  { name:'PMK',color:'#10b981',seats:'4–10' },
                  { name:'Others',color:'#94a3b8',seats:'10–20' },
                ].map(p => (
                  <div key={p.name} className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                    style={{ background:`${p.color}10`, border:`1px solid ${p.color}25` }}>
                    <span className="w-2 h-2 rounded-full" style={{ background:p.color }}/>
                    <span className="text-xs font-bold" style={{ color:p.color }}>{p.name}</span>
                    <span className="text-white/30 text-xs">{p.seats}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <p className="text-center text-white/15 text-xs mt-8 leading-relaxed">
          Live results activate at counting start · May 4, 2026 · 8 AM IST<br/>
          Disclaimer: All predictions are community estimates. This site does not represent any political party.
        </p>

        <div className="flex justify-center gap-3 mt-4">
          <Link href="/" className="px-4 py-2 rounded-xl text-xs font-bold text-white/30 hover:text-white/60 transition-colors"
            style={{ border:'1px solid rgba(255,255,255,0.08)' }}>← Back to NammaTamil</Link>
        </div>
      </section>
    </div>
  )
}
