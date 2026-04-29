'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, ChevronRight, TrendingUp, TrendingDown, Minus, Trophy, RefreshCw, Zap } from 'lucide-react'

// ── Switch date ───────────────────────────────────────────────────────────────
const SWITCH_MS     = new Date('2026-05-04T06:00:00+05:30').getTime()
const ELECTION_MS   = new Date('2026-05-04T07:00:00+05:30').getTime()

// Unsplash free photos
const ELECTION_BG = 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1400&q=80&fit=crop'
const IPL_BG      = 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=1400&q=80&fit=crop'

// ── Types ─────────────────────────────────────────────────────────────────────
interface ElectionParty {
  name: string; tamil: string; leader: string; color: string
  sentiment: number; voteShare: number; seats: string
  trend: 'up' | 'down' | 'stable'
}
interface ElectionData {
  parties: ElectionParty[]
  narrative: string; trend: string
  updatedAt: string; source: 'live-ai' | 'static'
}

// ── Countdown ─────────────────────────────────────────────────────────────────
function useCountdown(targetMs: number) {
  const [diff, setDiff] = useState(() => Math.max(0, targetMs - Date.now()))
  useEffect(() => {
    const id = setInterval(() => setDiff(Math.max(0, targetMs - Date.now())), 1000)
    return () => clearInterval(id)
  }, [targetMs])
  const s = Math.floor(diff / 1000)
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60, done: diff === 0 }
}

// ── Trend icon ────────────────────────────────────────────────────────────────
function TrendIcon({ trend, color }: { trend: string; color: string }) {
  if (trend === 'up')   return <TrendingUp   className="w-3 h-3" style={{ color }} />
  if (trend === 'down') return <TrendingDown className="w-3 h-3" style={{ color: '#f87171' }} />
  return <Minus className="w-3 h-3 text-white/20" />
}

// ── Animated party bar ────────────────────────────────────────────────────────
function PartyBar({ party, maxShare, index }: { party: ElectionParty; maxShare: number; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 + index * 0.1, duration: 0.5, ease: 'easeOut' }}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: party.color }} />
          <span className="text-white font-black text-sm">{party.name}</span>
          <span className="text-white/30 text-[10px] hidden sm:inline">{party.leader}</span>
          <TrendIcon trend={party.trend} color={party.color} />
        </div>
        <div className="flex items-center gap-3">
          <span className="font-black text-sm tabular-nums" style={{ color: party.color }}>{party.seats}</span>
          <span className="text-white/30 text-[10px] w-10 text-right tabular-nums">{party.voteShare}%</span>
        </div>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(party.voteShare / maxShare) * 100}%` }}
          transition={{ delay: 0.4 + index * 0.1, duration: 0.8, ease: 'easeOut' }}
          style={{
            background: `linear-gradient(90deg, ${party.color}50, ${party.color})`,
            boxShadow: `0 0 10px ${party.color}50`,
          }}
        />
      </div>
      {/* Sentiment meter */}
      <div className="flex items-center gap-1.5 mt-1">
        <span className="text-white/20 text-[9px]">AI Sentiment</span>
        <div className="flex-1 h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <motion.div
            className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${party.sentiment}%` }}
            transition={{ delay: 0.6 + index * 0.1, duration: 0.6, ease: 'easeOut' }}
            style={{ background: party.color, opacity: 0.5 }}
          />
        </div>
        <span className="text-[9px] font-bold tabular-nums" style={{ color: party.color }}>{party.sentiment}%</span>
      </div>
    </motion.div>
  )
}

// ── Election Hero ─────────────────────────────────────────────────────────────
function ElectionHero() {
  const [data, setData]           = useState<ElectionData | null>(null)
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { d, h, m, s, done }     = useCountdown(ELECTION_MS)

  const fetch_ = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true)
    try {
      const res  = await fetch('/api/election-prediction')
      const json = await res.json() as ElectionData
      setData(json)
    } catch { /* keep previous */ }
    finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => { fetch_() }, [fetch_])

  const parties    = data?.parties ?? []
  const maxShare   = Math.max(...parties.map(p => p.voteShare), 40)
  const isLiveAI   = data?.source === 'live-ai'
  const updatedMin = data?.updatedAt
    ? new Date(new Date(data.updatedAt).getTime() + 5.5*3600000)
        .toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : ''

  return (
    <div className="relative w-full overflow-hidden rounded-2xl sm:rounded-3xl" style={{ minHeight: 420 }}>

      {/* BG photo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={ELECTION_BG} alt="" aria-hidden
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: 'brightness(0.22) saturate(0.7)' }} />

      {/* Gradient layers */}
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, rgba(6,4,20,0.92) 0%, rgba(6,4,20,0.45) 55%, rgba(6,4,20,0.75) 100%)' }} />
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(to top, rgba(6,4,20,0.98) 0%, transparent 55%)' }} />
      {/* Party colour ambience */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 15% 45%, rgba(248,113,113,0.2) 0%, transparent 55%)' }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 50% 40% at 85% 20%, rgba(74,222,128,0.12) 0%, transparent 55%)' }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 50% 40% at 60% 80%, rgba(251,191,36,0.1) 0%, transparent 55%)' }} />

      {/* Content */}
      <div className="relative flex flex-col gap-5 p-5 sm:p-7" style={{ minHeight: 420 }}>

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.28)', backdropFilter: 'blur(8px)' }}>
            <Brain className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-400 text-[10px] font-black tracking-widest uppercase">AI Prediction · Live</span>
            <span className={`w-1.5 h-1.5 rounded-full ${isLiveAI ? 'bg-amber-400 animate-pulse' : 'bg-white/20'}`} />
          </motion.div>

          <div className="flex items-center gap-2">
            {updatedMin && (
              <span className="text-white/20 text-[9px] hidden sm:inline">
                {isLiveAI ? '🔴' : '📡'} {updatedMin}
              </span>
            )}
            <button onClick={() => fetch_(true)} disabled={refreshing}
              className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
              <RefreshCw className={`w-3 h-3 text-white/25 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* ── Main grid ── */}
        <div className="flex flex-col sm:flex-row gap-6 flex-1">

          {/* Left: title + bars */}
          <div className="flex-1 min-w-0">
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
              <p className="text-white/35 text-xs mb-0.5 tracking-wide">Tamil Nadu Assembly Election 2026</p>
              <h2 className="font-black leading-none tracking-tighter text-white mb-1"
                style={{ fontSize: 'clamp(1.7rem, 4.5vw, 3rem)', textShadow: '0 2px 30px rgba(0,0,0,0.6)' }}>
                தேர்தல் Forecast
              </h2>

              {/* AI narrative */}
              <AnimatePresence mode="wait">
                {data?.narrative && (
                  <motion.p
                    key={data.narrative}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="text-white/40 text-xs mb-5 flex items-start gap-1.5 max-w-sm">
                    <Zap className="w-3 h-3 text-amber-400/60 flex-shrink-0 mt-0.5" />
                    {data.narrative}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Party bars */}
            {loading ? (
              <div className="space-y-4">
                {[0,1,2].map(i => (
                  <div key={i} className="space-y-1.5">
                    <div className="shimmer h-4 w-48 rounded" />
                    <div className="shimmer h-2 rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {parties.map((p, i) => (
                  <PartyBar key={p.name} party={p} maxShare={maxShare} index={i} />
                ))}
              </div>
            )}

            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
              className="text-white/15 text-[9px] mt-3 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white/15" />
              Majority: 118 of 234 seats · AI model analyses live news · Not affiliated with any party
            </motion.p>
          </div>

          {/* Right: countdown + CTA */}
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.15 }}
            className="flex flex-col justify-between gap-5 sm:w-52 flex-shrink-0">

            {/* Countdown */}
            {!done ? (
              <div>
                <p className="text-white/25 text-[9px] uppercase tracking-widest mb-2">Election Day Countdown</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {[{ v: d, l: 'Days' }, { v: h, l: 'Hrs' }, { v: m, l: 'Min' }, { v: s, l: 'Sec' }].map(({ v, l }, i) => (
                    <motion.div key={l}
                      initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3 + i * 0.05, duration: 0.3 }}
                      className="flex flex-col items-center py-2 px-1 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}>
                      <span className="text-white font-black text-xl leading-none tabular-nums">{String(v).padStart(2,'0')}</span>
                      <span className="text-white/25 text-[8px] mt-1">{l}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)' }}>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-amber-400 font-black text-sm">Election Day — May 4!</span>
              </div>
            )}

            {/* Sentiment summary */}
            {data && (
              <div className="space-y-1.5">
                <p className="text-white/20 text-[9px] uppercase tracking-widest">Today&apos;s Signal</p>
                {parties.slice(0, 3).map(p => (
                  <div key={p.name} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg"
                    style={{ background: `${p.color}0d`, border: `1px solid ${p.color}20` }}>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
                      <span className="text-white/70 text-[10px] font-bold">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendIcon trend={p.trend} color={p.color} />
                      <span className="text-[10px] font-black tabular-nums" style={{ color: p.color }}>{p.sentiment}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* CTA */}
            <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
              <Link href="/tn-election-2026"
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl font-black text-sm"
                style={{
                  background: 'linear-gradient(135deg, #f87171, #fbbf24)',
                  color: '#000',
                  boxShadow: '0 4px 24px rgba(248,113,113,0.4)',
                }}>
                <TrendingUp className="w-4 h-4" />
                Full Analysis
                <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

// ── IPL Playoffs Hero (post May 4) ────────────────────────────────────────────
const IPL_TOP4 = [
  { short: 'PBKS', color: '#a855f7', pts: 13, played: 8 },
  { short: 'RCB',  color: '#ef4444', pts: 12, played: 8 },
  { short: 'RR',   color: '#ec4899', pts: 12, played: 9 },
  { short: 'SRH',  color: '#f97316', pts: 10, played: 8 },
]

function IPLPlayoffsHero() {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl sm:rounded-3xl" style={{ minHeight: 420 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={IPL_BG} alt="" aria-hidden
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: 'brightness(0.22) saturate(0.6)' }} />
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, rgba(4,10,0,0.92) 0%, rgba(4,10,0,0.4) 60%, rgba(4,10,0,0.8) 100%)' }} />
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(to top, rgba(4,10,0,0.98) 0%, transparent 55%)' }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 20% 50%, rgba(34,197,94,0.2) 0%, transparent 60%)' }} />

      <div className="relative flex flex-col gap-5 p-5 sm:p-7" style={{ minHeight: 420 }}>
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full w-fit"
          style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.28)', backdropFilter: 'blur(8px)' }}>
          <Trophy className="w-3.5 h-3.5 text-green-400" />
          <span className="text-green-400 text-[10px] font-black tracking-widest uppercase">IPL 2026 · Playoffs Race</span>
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <p className="text-white/35 text-xs mb-0.5">Points Table · Top 4 Contenders</p>
          <h2 className="font-black leading-none tracking-tighter text-white mb-5"
            style={{ fontSize: 'clamp(1.7rem, 4.5vw, 3rem)', textShadow: '0 2px 30px rgba(0,0,0,0.6)' }}>
            Qualifier Race 2026
          </h2>

          <div className="space-y-3 max-w-sm">
            {IPL_TOP4.map((t, i) => (
              <motion.div key={t.short}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                className="flex items-center gap-3">
                <span className="text-white/20 font-black text-sm w-5">{i + 1}</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
                  style={{ background: t.color }}>
                  {t.short.slice(0, 2)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-black text-sm" style={{ color: t.color }}>{t.short}</span>
                    <span className="font-black text-sm text-white">{t.pts}
                      <span className="text-white/25 font-normal text-[10px] ml-1">pts</span>
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                    <motion.div className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(t.pts / 26) * 100}%` }}
                      transition={{ delay: 0.4 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                      style={{ background: t.color, boxShadow: `0 0 8px ${t.color}80` }} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <p className="text-white/20 text-[10px] mt-4 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400/40" />
            Top 4 qualify · Qualifier 1 & Eliminator — May 20 2026
          </p>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} className="w-fit">
          <Link href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm"
            style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#000', boxShadow: '0 4px 20px rgba(34,197,94,0.4)' }}>
            Full Points Table <ChevronRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function HeroCinematic() {
  const [showIPL, setShowIPL] = useState(false)
  useEffect(() => { setShowIPL(Date.now() >= SWITCH_MS) }, [])
  return showIPL ? <IPLPlayoffsHero /> : <ElectionHero />
}
