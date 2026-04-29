'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Brain, ChevronRight, Zap, Trophy, BarChart2 } from 'lucide-react'

// ── Switch date: hero changes from Election → IPL after May 4 2026 ────────────
const SWITCH_DATE   = new Date('2026-05-04T06:00:00+05:30')
const ELECTION_DATE = new Date('2026-05-04T07:00:00+05:30') // polls open

// ── Unsplash photo IDs (free, no auth needed for display) ────────────────────
// Election: Tamil Nadu assembly / crowd / dusk skyline
const ELECTION_BG = 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1400&q=80&fit=crop'
// IPL: cricket stadium at night under floodlights
const IPL_BG      = 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=1400&q=80&fit=crop'

// ── Election data ─────────────────────────────────────────────────────────────
const PARTIES = [
  { name: 'DMK',    tamil: 'திமுக',  leader: 'M.K. Stalin',     color: '#f87171', bg: 'rgba(248,113,113,0.12)', voteShare: 38.4, seats: '148–172' },
  { name: 'AIADMK', tamil: 'அதிமுக', leader: 'E. Palaniswami', color: '#4ade80', bg: 'rgba(74,222,128,0.12)',  voteShare: 32.1, seats: '55–82'  },
  { name: 'TVK',    tamil: 'தவக',    leader: 'Vijay',            color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', voteShare: 18.7, seats: '14–28'  },
]

// ── IPL top-4 (static, updated with live data on the IPL banner) ──────────────
const IPL_TOP4 = [
  { short: 'PBKS', full: 'Punjab Kings',                color: '#a855f7', pts: 13, played: 8 },
  { short: 'RCB',  full: 'Royal Challengers Bengaluru', color: '#ef4444', pts: 12, played: 8 },
  { short: 'RR',   full: 'Rajasthan Royals',            color: '#ec4899', pts: 12, played: 9 },
  { short: 'SRH',  full: 'Sunrisers Hyderabad',         color: '#f97316', pts: 10, played: 8 },
]

// ── Countdown hook ────────────────────────────────────────────────────────────
function useCountdown(target: Date) {
  const [diff, setDiff] = useState(() => Math.max(0, target.getTime() - Date.now()))
  useEffect(() => {
    const id = setInterval(() => setDiff(Math.max(0, target.getTime() - Date.now())), 1000)
    return () => clearInterval(id)
  }, [target])
  const s = Math.floor(diff / 1000)
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
    done: diff === 0,
  }
}

// ── Countdown block ───────────────────────────────────────────────────────────
function CountdownBlock({ target }: { target: Date }) {
  const { d, h, m, s, done } = useCountdown(target)
  if (done) return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl"
      style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)' }}>
      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
      <span className="text-amber-400 font-black text-sm">Election Day — May 4!</span>
    </div>
  )
  return (
    <div>
      <p className="text-white/30 text-[9px] uppercase tracking-widest mb-1.5">Election Day Countdown</p>
      <div className="flex items-center gap-1.5">
        {[{ v: d, l: 'Days' }, { v: h, l: 'Hrs' }, { v: m, l: 'Min' }, { v: s, l: 'Sec' }].map(({ v, l }) => (
          <div key={l} className="flex flex-col items-center px-2.5 py-1.5 rounded-xl min-w-[44px]"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span className="text-white font-black text-xl leading-none tabular-nums">{String(v).padStart(2,'0')}</span>
            <span className="text-white/30 text-[9px] mt-0.5">{l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Election Hero ─────────────────────────────────────────────────────────────
function ElectionHero() {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl sm:rounded-3xl" style={{ minHeight: 420 }}>

      {/* Background photo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={ELECTION_BG} alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: 'brightness(0.28) saturate(0.8)' }} />

      {/* Gradient overlays for text readability */}
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, rgba(6,4,20,0.85) 0%, rgba(6,4,20,0.4) 60%, rgba(6,4,20,0.7) 100%)' }} />
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(to top, rgba(6,4,20,0.98) 0%, transparent 50%)' }} />

      {/* Colour tint from party colours */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 20% 40%, rgba(248,113,113,0.18) 0%, transparent 60%)' }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 80% 20%, rgba(74,222,128,0.12) 0%, transparent 60%)' }} />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-between p-5 sm:p-8" style={{ minHeight: 420 }}>

        {/* Top badge */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', backdropFilter: 'blur(8px)' }}>
            <Brain className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-400 text-[10px] font-black tracking-widest uppercase">AI Prediction</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          </div>
          <span className="text-white/25 text-[10px] hidden sm:block">234 seats · Majority: 118</span>
        </div>

        {/* Main content grid */}
        <div className="flex flex-col sm:flex-row gap-6 mt-4">

          {/* Left: title + party bars */}
          <div className="flex-1">
            <p className="text-white/40 text-xs mb-1 tracking-wide">Tamil Nadu Assembly Election</p>
            <h2 className="font-black leading-none tracking-tighter text-white mb-1"
              style={{ fontSize: 'clamp(1.8rem, 5vw, 3.2rem)', textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>
              தேர்தல் 2026
            </h2>
            <p className="text-white/50 text-sm mb-5">AI-powered seat forecast · Updated daily</p>

            {/* Party bars */}
            <div className="space-y-3 max-w-sm">
              {PARTIES.map(p => (
                <div key={p.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                      <span className="text-white font-black text-sm">{p.name}</span>
                      <span className="text-white/30 text-[10px] hidden sm:inline">{p.leader}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-sm" style={{ color: p.color }}>{p.seats}</span>
                      <span className="text-white/25 text-[10px] w-10 text-right">{p.voteShare}%</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div className="h-full rounded-full"
                      style={{
                        width: `${(p.voteShare / 40) * 100}%`,
                        background: `linear-gradient(90deg, ${p.color}60, ${p.color})`,
                        boxShadow: `0 0 8px ${p.color}60`,
                      }} />
                  </div>
                </div>
              ))}
              <p className="text-white/15 text-[9px] flex items-center gap-1 pt-1">
                <Zap className="w-2.5 h-2.5 text-amber-400/40" />
                AI model · Not affiliated with any political party
              </p>
            </div>
          </div>

          {/* Right: countdown + CTA */}
          <div className="flex flex-col justify-end gap-4 sm:items-end">
            <CountdownBlock target={ELECTION_DATE} />

            {/* Sentiment pills */}
            <div className="flex flex-wrap gap-1.5 sm:justify-end">
              {[
                { label: 'DMK Sentiment', val: '72%', color: '#f87171' },
                { label: 'TVK Surge',     val: '+9.1%', color: '#fbbf24' },
              ].map(pill => (
                <div key={pill.label} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(6px)' }}>
                  <BarChart2 className="w-3 h-3" style={{ color: pill.color }} />
                  <span className="text-white/60">{pill.label}</span>
                  <span style={{ color: pill.color }}>{pill.val}</span>
                </div>
              ))}
            </div>

            <Link href="/tn-election-2026"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all hover:brightness-110 hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #f87171, #fbbf24)', color: '#000', boxShadow: '0 4px 20px rgba(248,113,113,0.35)' }}>
              Full Analysis
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── IPL Playoffs Hero ─────────────────────────────────────────────────────────
function IPLPlayoffsHero() {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl sm:rounded-3xl" style={{ minHeight: 420 }}>

      {/* Background photo — cricket stadium */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={IPL_BG} alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: 'brightness(0.25) saturate(0.7)' }} />

      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, rgba(4,10,0,0.9) 0%, rgba(4,10,0,0.4) 60%, rgba(4,10,0,0.8) 100%)' }} />
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(to top, rgba(4,10,0,0.98) 0%, transparent 55%)' }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 20% 50%, rgba(34,197,94,0.2) 0%, transparent 60%)' }} />

      <div className="relative h-full flex flex-col justify-between p-5 sm:p-8" style={{ minHeight: 420 }}>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full w-fit"
          style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', backdropFilter: 'blur(8px)' }}>
          <Trophy className="w-3.5 h-3.5 text-green-400" />
          <span className="text-green-400 text-[10px] font-black tracking-widest uppercase">IPL 2026 · Playoffs Race</span>
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        </div>

        <div className="mt-4">
          <p className="text-white/40 text-xs mb-1">Points Table · Top 4</p>
          <h2 className="font-black leading-none tracking-tighter text-white mb-5"
            style={{ fontSize: 'clamp(1.8rem, 5vw, 3.2rem)', textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>
            Qualifier Race
          </h2>

          <div className="space-y-2.5 max-w-sm">
            {IPL_TOP4.map((t, i) => (
              <div key={t.short} className="flex items-center gap-3">
                <span className="text-white/20 font-black w-5 text-sm">{i + 1}</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
                  style={{ background: t.color }}>
                  {t.short.slice(0, 2)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-black text-sm" style={{ color: t.color }}>{t.short}</span>
                    <span className="font-black text-sm text-white">{t.pts} <span className="text-white/30 font-normal text-[10px]">pts</span></span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div className="h-full rounded-full"
                      style={{ width: `${(t.pts / 26) * 100}%`, background: t.color, boxShadow: `0 0 6px ${t.color}80` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-white/20 text-[10px] mt-3 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400/50" />
            Top 4 qualify · Qualifier 1 & Eliminator — May 20 2026
          </p>
        </div>

        <div className="flex gap-3 mt-4">
          <Link href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all hover:brightness-110 hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#000', boxShadow: '0 4px 20px rgba(34,197,94,0.35)' }}>
            Full Points Table <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function HeroCinematic() {
  const [showIPL, setShowIPL] = useState(false)

  useEffect(() => {
    setShowIPL(Date.now() >= SWITCH_DATE.getTime())
  }, [])

  return showIPL ? <IPLPlayoffsHero /> : <ElectionHero />
}
