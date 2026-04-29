'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { ArrowRight, Users, TrendingUp, Star, Zap, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

// ── Slide data ────────────────────────────────────────────────────────────────
const SLIDES = [
  {
    id: 1,
    tag: 'FIRST ELECTION',
    tagColor: '#fbbf24',
    headline: 'தவகவின் முதல் தேர்தல்',
    sub: "Thalapathy Vijay's Tamilaga Vettri Kazhagam enters Tamil Nadu politics for the first time in 2026",
    stat: '1ST',
    statLabel: 'Election ever',
    bg: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1400&q=80&fit=crop',
    accent: '#fbbf24',
    icon: Star,
  },
  {
    id: 2,
    tag: 'CROWD POWER',
    tagColor: '#f87171',
    headline: 'கோடிக்கணக்கான ஆதரவு',
    sub: 'Massive 1.2 crore+ members joined TVK within months — the fastest-growing political party in Tamil Nadu history',
    stat: '1.2Cr+',
    statLabel: 'Members nationwide',
    bg: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1400&q=80&fit=crop',
    accent: '#f87171',
    icon: Users,
  },
  {
    id: 3,
    tag: 'RISING FORCE',
    tagColor: '#34d399',
    headline: 'புதிய அரசியல் சக்தி',
    sub: 'AI-powered sentiment analysis places TVK at 18.7% vote share — poised to be a decisive kingmaker in TN 2026',
    stat: '18.7%',
    statLabel: 'Projected vote share',
    bg: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1400&q=80&fit=crop',
    accent: '#34d399',
    icon: TrendingUp,
  },
  {
    id: 4,
    tag: 'YOUTH WAVE',
    tagColor: '#a78bfa',
    headline: 'இளைஞர்களின் குரல்',
    sub: 'From blockbuster hero to political leader — millions of young voters are rallying behind Vijay\'s vision for Tamil Nadu',
    stat: '62%',
    statLabel: 'Youth supporter base',
    bg: 'https://images.unsplash.com/photo-1518492104633-130d0cc84637?w=1400&q=80&fit=crop',
    accent: '#a78bfa',
    icon: Zap,
  },
]

// ── Counter animation hook ────────────────────────────────────────────────────
function useCountUp(target: number, inView: boolean, duration = 1200) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!inView) return
    const start = Date.now()
    const tick = () => {
      const progress = Math.min((Date.now() - start) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(ease * target))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [inView, target, duration])
  return value
}

// ── Sentiment pill (live fetch) ───────────────────────────────────────────────
function LiveSentiment() {
  const [sentiment, setSentiment] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/election-prediction')
      .then(r => r.json())
      .then(d => {
        const tvk = d.parties?.find((p: { name: string; sentiment: number }) => p.name === 'TVK')
        if (tvk) setSentiment(tvk.sentiment)
      })
      .catch(() => {})
  }, [])

  if (sentiment === null) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.6 }}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
      style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)' }}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
      <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">Live AI</span>
      <span className="text-[11px] font-black text-white">{sentiment}/100</span>
    </motion.div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function TVKSpotlight() {
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inView = useInView(containerRef, { once: true, margin: '-80px' })
  const memberCount = useCountUp(120, inView, 1500) // counts to 120 → displayed as "1.2 Cr"

  // Auto-advance every 5 seconds
  useEffect(() => {
    const id = setInterval(() => {
      setDirection(1)
      setCurrent(c => (c + 1) % SLIDES.length)
    }, 5000)
    return () => clearInterval(id)
  }, [])

  const go = (dir: 1 | -1) => {
    setDirection(dir)
    setCurrent(c => (c + SLIDES.length + dir) % SLIDES.length)
  }

  const slide = SLIDES[current]
  const Icon = slide.icon

  return (
    <section ref={containerRef} className="relative overflow-hidden" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>

      {/* ── Background image ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id + '-bg'}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${slide.bg})`, filter: 'brightness(0.18) saturate(0.5)' }}
        />
      </AnimatePresence>

      {/* Gradient overlays */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(to right, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.3) 100%)',
      }} />
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse 50% 70% at 0% 50%, ${slide.accent}18 0%, transparent 60%)`,
      }} />

      {/* Accent top line */}
      <motion.div
        key={slide.id + '-line'}
        className="absolute top-0 left-0 h-[3px]"
        initial={{ width: 0 }}
        animate={{ width: '100%' }}
        transition={{ duration: 5, ease: 'linear' }}
        style={{ background: `linear-gradient(90deg, ${slide.accent}, transparent)` }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

          {/* ── Left: Text content ── */}
          <div>
            {/* Label row */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <motion.span
                key={slide.id + '-tag'}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-[10px] font-black tracking-widest px-2.5 py-1 rounded-full uppercase"
                style={{ background: slide.accent + '20', border: `1px solid ${slide.accent}40`, color: slide.accent }}
              >
                {slide.tag}
              </motion.span>
              <LiveSentiment />
              <span className="text-[10px] font-black tracking-widest px-2.5 py-1 rounded-full uppercase"
                style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', color: 'rgba(251,191,36,0.6)' }}>
                TVK · TN 2026
              </span>
            </div>

            {/* Tamil headline */}
            <AnimatePresence mode="wait">
              <motion.h2
                key={slide.id + '-h'}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="font-black leading-tight mb-2"
                style={{ fontSize: 'clamp(1.6rem, 4vw, 2.6rem)', color: slide.accent }}
              >
                {slide.headline}
              </motion.h2>
            </AnimatePresence>

            {/* English sub */}
            <AnimatePresence mode="wait">
              <motion.p
                key={slide.id + '-sub'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="text-white/55 text-sm leading-relaxed mb-6 max-w-lg"
              >
                {slide.sub}
              </motion.p>
            </AnimatePresence>

            {/* CTA buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              <Link href="/tn-election-2026"
                className="group flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all hover:brightness-110 hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', color: '#000' }}
              >
                Election Predictions
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link href="/tn-election-2026#tvk"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white/60 hover:text-white transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                TVK Profile
              </Link>
            </div>
          </div>

          {/* ── Right: Stat + dots ── */}
          <div className="flex flex-col items-start lg:items-end gap-6">

            {/* Big animated stat */}
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id + '-stat'}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="text-right"
              >
                <div className="flex items-center gap-3 justify-end mb-1">
                  <div className="p-2.5 rounded-xl" style={{ background: slide.accent + '20', border: `1px solid ${slide.accent}30` }}>
                    <Icon className="w-5 h-5" style={{ color: slide.accent }} />
                  </div>
                  <p className="font-black" style={{ fontSize: 'clamp(2.4rem, 7vw, 4rem)', color: slide.accent, lineHeight: 1 }}>
                    {slide.id === 2
                      ? `${memberCount > 0 ? (memberCount / 100).toFixed(1) : '1.2'}Cr`
                      : slide.stat}
                  </p>
                </div>
                <p className="text-white/35 text-sm font-semibold">{slide.statLabel}</p>
              </motion.div>
            </AnimatePresence>

            {/* Mini progress bars for all stats */}
            <div className="w-full max-w-xs space-y-2">
              {[
                { label: 'Member growth', value: 92, color: '#fbbf24' },
                { label: 'Youth support',  value: 62, color: '#a78bfa' },
                { label: 'Social buzz',    value: 78, color: '#34d399' },
                { label: 'Vote estimate',  value: 19, color: '#f87171' },
              ].map((bar, i) => (
                <div key={bar.label} className="flex items-center gap-2">
                  <span className="text-[10px] text-white/30 w-24 flex-shrink-0 text-right">{bar.label}</span>
                  <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: bar.color }}
                      initial={{ width: 0 }}
                      animate={inView ? { width: `${bar.value}%` } : { width: 0 }}
                      transition={{ duration: 0.9, delay: 0.3 + i * 0.1, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="text-[10px] font-black w-7 flex-shrink-0" style={{ color: bar.color }}>{bar.value}%</span>
                </div>
              ))}
            </div>

            {/* Slide controls */}
            <div className="flex items-center gap-3">
              <button onClick={() => go(-1)}
                className="p-1.5 rounded-full transition-colors hover:bg-white/10"
                style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
                <ChevronLeft className="w-4 h-4 text-white/40" />
              </button>
              <div className="flex gap-1.5">
                {SLIDES.map((s, i) => (
                  <button key={s.id} onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i) }}
                    className="transition-all rounded-full"
                    style={{
                      width: i === current ? 20 : 6,
                      height: 6,
                      background: i === current ? slide.accent : 'rgba(255,255,255,0.2)',
                    }}
                  />
                ))}
              </div>
              <button onClick={() => go(1)}
                className="p-1.5 rounded-full transition-colors hover:bg-white/10"
                style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
                <ChevronRight className="w-4 h-4 text-white/40" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Slide indicator strip */}
      <div className="absolute bottom-0 left-0 right-0 flex">
        {SLIDES.map((s, i) => (
          <div key={s.id} className="flex-1 h-[2px] transition-colors"
            style={{ background: i === current ? s.accent : 'rgba(255,255,255,0.06)' }} />
        ))}
      </div>
    </section>
  )
}
