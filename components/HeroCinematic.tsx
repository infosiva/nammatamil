'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, ChevronRight, TrendingUp, TrendingDown, Minus, Trophy, RefreshCw, Zap } from 'lucide-react'

// ── Switch date ───────────────────────────────────────────────────────────────
const SWITCH_MS   = new Date('2026-05-04T06:00:00+05:30').getTime()
const ELECTION_MS = new Date('2026-05-04T07:00:00+05:30').getTime()

// ── Rolling background images — crowd/campaign/political rally scenes ─────────
// Free Unsplash images: large crowds, rally scenes, political gatherings
const CAMPAIGN_IMAGES = [
  // Massive crowd rally
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=75&fit=crop',
  // Political stage with crowd
  'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1200&q=75&fit=crop',
  // Stadium crowd — TVK scale events
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=75&fit=crop',
  // Crowd with flags/banners
  'https://images.unsplash.com/photo-1518492104633-130d0cc84637?w=1200&q=75&fit=crop',
  // Rally crowd energy
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&q=75&fit=crop',
]

const IPL_BG = 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=1200&q=75&fit=crop'

// ── Types ─────────────────────────────────────────────────────────────────────
interface ElectionParty {
  name: string; tamil: string; leader: string; color: string
  sentiment: number; voteShare: number; seats: string
  trend: 'up' | 'down' | 'stable'
}
interface ElectionData {
  parties: ElectionParty[]; narrative: string; trend: string
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
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: party.color }} />
          <span className="text-white font-black text-xs">{party.name}</span>
          <TrendIcon trend={party.trend} color={party.color} />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-black text-xs tabular-nums" style={{ color: party.color }}>{party.seats}</span>
          <span className="text-white/30 text-[10px] w-9 text-right tabular-nums">{party.voteShare}%</span>
        </div>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <motion.div className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(party.voteShare / maxShare) * 100}%` }}
          transition={{ delay: 0.4 + index * 0.1, duration: 0.8, ease: 'easeOut' }}
          style={{ background: `linear-gradient(90deg, ${party.color}50, ${party.color})`, boxShadow: `0 0 8px ${party.color}50` }}
        />
      </div>
      {/* Sentiment micro-bar */}
      <div className="flex items-center gap-1 mt-0.5">
        <span className="text-white/15 text-[9px]">Sentiment</span>
        <div className="flex-1 h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <motion.div className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${party.sentiment}%` }}
            transition={{ delay: 0.6 + index * 0.1, duration: 0.6 }}
            style={{ background: party.color, opacity: 0.45 }} />
        </div>
        <span className="text-[9px] font-bold tabular-nums" style={{ color: party.color, opacity: 0.7 }}>{party.sentiment}%</span>
      </div>
    </motion.div>
  )
}

// ── Rolling background ────────────────────────────────────────────────────────
function RollingBg() {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setIdx(i => (i + 1) % CAMPAIGN_IMAGES.length), 4000)
    return () => clearInterval(id)
  }, [])
  return (
    <>
      {CAMPAIGN_IMAGES.map((src, i) => (
        <motion.div key={src}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${src})`, filter: 'brightness(0.18) saturate(0.5)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: i === idx ? 1 : 0 }}
          transition={{ duration: 1.2 }}
        />
      ))}
      {/* Image caption — which campaign moment */}
      <div className="absolute bottom-0 right-0 px-2 py-1 m-2 rounded-md text-[8px] text-white/20"
        style={{ background: 'rgba(0,0,0,0.3)' }}>
        {['TVK Rally · Coimbatore', 'TVK Mega Rally · Chennai', 'Stadium Campaign · 2025', 'Youth March · TN', 'Record Crowd · TVK'][idx]}
      </div>
    </>
  )
}

// ── Election Hero ─────────────────────────────────────────────────────────────
function ElectionHero() {
  const [data, setData]             = useState<ElectionData | null>(null)
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { d, h, m, s, done }       = useCountdown(ELECTION_MS)

  const fetch_ = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true)
    try {
      const json = await fetch('/api/election-prediction').then(r => r.json()) as ElectionData
      setData(json)
    } catch { /* keep previous */ }
    finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => { fetch_() }, [fetch_])

  const parties  = data?.parties ?? []
  const maxShare = Math.max(...parties.map(p => p.voteShare), 40)
  const isLiveAI = data?.source === 'live-ai'
  const updatedMin = data?.updatedAt
    ? new Date(new Date(data.updatedAt).getTime() + 5.5 * 3600000)
        .toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : ''

  return (
    <div className="relative w-full overflow-hidden rounded-2xl" style={{ minHeight: 520 }}>

      {/* Rolling campaign background */}
      <RollingBg />

      {/* Gradient overlays */}
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(160deg, rgba(6,4,20,0.93) 0%, rgba(6,4,20,0.5) 50%, rgba(6,4,20,0.8) 100%)' }} />
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(to top, rgba(6,4,20,0.99) 0%, transparent 50%)' }} />
      {/* TVK gold ambience bottom-left */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 0% 100%, rgba(251,191,36,0.14) 0%, transparent 55%)' }} />
      {/* Party colour ambiences */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 90% 20%, rgba(248,113,113,0.12) 0%, transparent 55%)' }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 50% 40% at 10% 30%, rgba(74,222,128,0.08) 0%, transparent 55%)' }} />

      {/* Content */}
      <div className="relative flex flex-col p-5 gap-4" style={{ minHeight: 520 }}>

        {/* Top bar */}
        <div className="flex items-center justify-between">
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', backdropFilter: 'blur(8px)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            <span className="text-red-400 text-[10px] font-black tracking-wider uppercase">Exit Polls Out</span>
          </motion.div>
          <div className="flex items-center gap-1.5">
            {updatedMin && <span className="text-white/15 text-[9px]">{isLiveAI ? '🔴' : '📡'} {updatedMin}</span>}
            <button onClick={() => fetch_(true)} disabled={refreshing}
              className="p-1 rounded-lg hover:bg-white/5 transition-colors">
              <RefreshCw className={`w-3 h-3 text-white/20 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <p className="text-white/30 text-[10px] tracking-wide mb-0.5">Tamil Nadu Assembly Election 2026</p>
          <h2 className="font-black leading-none tracking-tighter text-white"
            style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', textShadow: '0 2px 20px rgba(0,0,0,0.8)' }}>
            தேர்தல் 2026
          </h2>
          <p className="text-white/35 text-[10px] mt-0.5">Exit Poll results · Apr 29 · 4 agencies · Results May 4</p>
        </motion.div>

        {/* Party bars */}
        {loading ? (
          <div className="space-y-3">
            {[0,1,2].map(i => (
              <div key={i} className="space-y-1">
                <div className="shimmer h-3 w-36 rounded" />
                <div className="shimmer h-1.5 rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {parties.map((p, i) => (
              <PartyBar key={p.name} party={p} maxShare={maxShare} index={i} />
            ))}
          </div>
        )}

        {/* AI narrative */}
        <AnimatePresence mode="wait">
          {data?.narrative && (
            <motion.div key={data.narrative} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-start gap-1.5 px-3 py-2 rounded-xl"
              style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.12)' }}>
              <Zap className="w-3 h-3 text-amber-400/50 flex-shrink-0 mt-0.5" />
              <p className="text-white/40 text-[11px] leading-relaxed">{data.narrative}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Countdown */}
        {!done ? (
          <div>
            <p className="text-white/20 text-[9px] uppercase tracking-widest mb-1.5">Counting begins in</p>
            <div className="grid grid-cols-4 gap-1.5">
              {[{ v: d, l: 'Days' }, { v: h, l: 'Hrs' }, { v: m, l: 'Min' }, { v: s, l: 'Sec' }].map(({ v, l }) => (
                <div key={l} className="flex flex-col items-center py-2 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <span className="text-white font-black text-lg leading-none tabular-nums">{String(v).padStart(2,'0')}</span>
                  <span className="text-white/20 text-[8px] mt-0.5">{l}</span>
                </div>
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

        {/* Spacer + CTA pinned to bottom */}
        <div className="flex-1" />

        <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }}>
          <Link href="/tn-election-2026"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-black text-sm"
            style={{
              background: 'linear-gradient(135deg, #f87171, #fbbf24)',
              color: '#000',
              boxShadow: '0 4px 24px rgba(248,113,113,0.35)',
            }}>
            <TrendingUp className="w-4 h-4" />
            Full Analysis
            <ChevronRight className="w-4 h-4" />
          </Link>
        </motion.div>

        <p className="text-white/12 text-[8px] text-center">
          118 seats majority · AI analyses live news · Not affiliated with any party
        </p>
      </div>
    </div>
  )
}

// ── IPL Playoffs Hero ─────────────────────────────────────────────────────────
const IPL_TOP4 = [
  { short: 'PBKS', color: '#a855f7', pts: 13 },
  { short: 'RCB',  color: '#ef4444', pts: 12 },
  { short: 'RR',   color: '#ec4899', pts: 12 },
  { short: 'SRH',  color: '#f97316', pts: 10 },
]

function IPLPlayoffsHero() {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl" style={{ minHeight: 520 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={IPL_BG} alt="" aria-hidden
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: 'brightness(0.2) saturate(0.6)' }} />
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg,rgba(4,10,0,0.93) 0%,rgba(4,10,0,0.4) 55%,rgba(4,10,0,0.8) 100%)' }} />
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(to top,rgba(4,10,0,0.99) 0%,transparent 55%)' }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 20% 50%,rgba(34,197,94,0.18) 0%,transparent 60%)' }} />

      <div className="relative flex flex-col p-5 gap-4" style={{ minHeight: 520 }}>
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full w-fit"
          style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.28)' }}>
          <Trophy className="w-3 h-3 text-green-400" />
          <span className="text-green-400 text-[10px] font-black uppercase tracking-wider">IPL 2026 · Playoffs Race</span>
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <p className="text-white/30 text-[10px] mb-0.5">Points Table · Top Contenders</p>
          <h2 className="font-black leading-none tracking-tighter text-white"
            style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)' }}>
            Qualifier Race 2026
          </h2>
        </motion.div>

        <div className="space-y-3 flex-1">
          {IPL_TOP4.map((t, i) => (
            <motion.div key={t.short}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
              className="flex items-center gap-3">
              <span className="text-white/20 font-black text-xs w-4">{i + 1}</span>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-black text-white flex-shrink-0"
                style={{ background: t.color }}>
                {t.short.slice(0, 2)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black text-xs" style={{ color: t.color }}>{t.short}</span>
                  <span className="font-black text-xs text-white">{t.pts} <span className="text-white/25 font-normal text-[9px]">pts</span></span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                  <motion.div className="h-full rounded-full"
                    initial={{ width: 0 }} animate={{ width: `${(t.pts / 26) * 100}%` }}
                    transition={{ delay: 0.4 + i * 0.1, duration: 0.8 }}
                    style={{ background: t.color, boxShadow: `0 0 6px ${t.color}80` }} />
                </div>
              </div>
            </motion.div>
          ))}
          <p className="text-white/20 text-[9px] flex items-center gap-1.5 pt-1">
            <span className="w-1 h-1 rounded-full bg-green-400/40" /> Top 4 qualify · Qualifier 1 — May 20 2026
          </p>
        </div>

        <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }}>
          <Link href="/"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-black text-sm"
            style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#000', boxShadow: '0 4px 20px rgba(34,197,94,0.35)' }}>
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
