'use client'

import { useState, useEffect, useCallback } from 'react'
import { Star, Zap, ChevronRight, Trophy, Film, Users } from 'lucide-react'

// Election day: Tamil Nadu Assembly Election 2026 - May 4
const ELECTION_DATE = new Date('2026-05-04T06:00:00+05:30')

const VIJAY_FACTS = [
  {
    icon: '🎬',
    title: 'Box Office Legend',
    body: 'Thalapathy Vijay has delivered 10+ ₹100 Cr+ blockbusters — from Thuppakki to Leo, redefining Tamil cinema each time.',
  },
  {
    icon: '🗳️',
    title: 'TVK — People\'s Party',
    body: 'Tamilaga Vettri Kazhagam was founded in 2024. Vijay stepped away from acting to serve the Tamil people directly.',
  },
  {
    icon: '🌟',
    title: 'Thalapathy\'s Legacy',
    body: '"Thalapathy" Vijay\'s on-screen characters always stood for justice, equality, and the voice of the common man.',
  },
  {
    icon: '💪',
    title: 'Record Membership',
    body: 'TVK enrolled over 35 lakh members within months of launch — one of the fastest-growing political movements in Tamil Nadu.',
  },
  {
    icon: '🎶',
    title: 'Music & Masses',
    body: 'From Aalaporan Tamizhan to Vaathi Coming — Vijay\'s songs have become anthems for youth empowerment across Tamil Nadu.',
  },
  {
    icon: '📢',
    title: 'May 4 — Vote TVK',
    body: 'Tamil Nadu Assembly Elections are on May 4, 2026. TVK is fielding candidates for a corruption-free, welfare-first Tamil Nadu.',
  },
  {
    icon: '🏆',
    title: 'National Award Wins',
    body: 'Films featuring or associated with Vijay have swept state and national awards — proving Tamil cinema\'s global reach.',
  },
  {
    icon: '🌏',
    title: 'Global Tamil Pride',
    body: 'Vijay has fans across 50+ countries. TVK has diaspora chapters in UK, USA, Canada, Malaysia, Singapore & UAE.',
  },
]

function useCountdown(target: Date) {
  const calc = useCallback(() => {
    const diff = target.getTime() - Date.now()
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true }
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
      done: false,
    }
  }, [target])

  const [time, setTime] = useState(calc)

  useEffect(() => {
    setTime(calc())
    const id = setInterval(() => setTime(calc()), 1000)
    return () => clearInterval(id)
  }, [calc])

  return time
}

function DigitBlock({ value, label }: { value: number; label: string }) {
  const v = String(value).padStart(2, '0')
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="countdown-digit rounded-xl px-3 py-2 min-w-[52px] text-center">
        <span className="text-2xl sm:text-3xl font-black text-gold-400 tabular-nums leading-none">{v}</span>
      </div>
      <span className="text-muted text-[10px] uppercase tracking-widest font-medium">{label}</span>
    </div>
  )
}

export default function TVKWidget() {
  const time = useCountdown(ELECTION_DATE)

  const [factIdx, setFactIdx] = useState(0)
  const [fading, setFading] = useState(false)

  // Rotate facts every 6 seconds
  useEffect(() => {
    const id = setInterval(() => {
      setFading(true)
      setTimeout(() => {
        setFactIdx(i => (i + 1) % VIJAY_FACTS.length)
        setFading(false)
      }, 300)
    }, 6000)
    return () => clearInterval(id)
  }, [])

  const fact = VIJAY_FACTS[factIdx]

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="rounded-3xl overflow-hidden relative border border-animate tvk-glow">
        {/* Background mesh */}
        <div className="absolute inset-0 bg-gradient-to-br from-dark-800 via-dark-900 to-dark-800" />
        <div className="absolute inset-0 bg-gradient-to-r from-gold-500/5 via-violet-600/8 to-crimson-600/5" />
        {/* Decorative orb */}
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-gold-500/6 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-violet-600/8 blur-3xl" />

        <div className="relative p-6 md:p-8">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-start lg:items-center">

            {/* LEFT — TVK + Countdown */}
            <div className="flex-1 min-w-0">
              {/* Header badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/25 text-gold-400 text-xs font-bold mb-4 uppercase tracking-wider">
                <Zap className="w-3 h-3" />
                TVK — Tamilaga Vettri Kazhagam
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white mb-1 leading-tight">
                Tamil Nadu Elections —{' '}
                <span className="text-gradient">May 4, 2026</span>
              </h2>
              <p className="text-muted text-sm mb-5">
                தமிழகத்தின் மாற்றம் தொடங்குகிறது · Vote TVK · வாக்களிக்க மறவாதீர்கள்
              </p>

              {/* Countdown */}
              {time.done ? (
                <div className="flex items-center gap-2 text-gold-400 font-bold text-lg">
                  <Trophy className="w-5 h-5" />
                  Election Day is here! Go Vote!
                </div>
              ) : (
                <div className="flex items-center gap-3 flex-wrap">
                  <DigitBlock value={time.days} label="days" />
                  <span className="text-gold-500/60 text-2xl font-bold mb-4">:</span>
                  <DigitBlock value={time.hours} label="hours" />
                  <span className="text-gold-500/60 text-2xl font-bold mb-4">:</span>
                  <DigitBlock value={time.minutes} label="mins" />
                  <span className="text-gold-500/60 text-2xl font-bold mb-4">:</span>
                  <DigitBlock value={time.seconds} label="secs" />
                </div>
              )}
            </div>

            {/* DIVIDER */}
            <div className="hidden lg:block w-px self-stretch bg-gradient-to-b from-transparent via-white/10 to-transparent" />

            {/* RIGHT — Rotating Vijay fact */}
            <div className="flex-1 min-w-0">
              <div
                className="vijay-card rounded-2xl p-5 transition-opacity duration-300"
                style={{ opacity: fading ? 0 : 1 }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{fact.icon}</span>
                  <div>
                    <h3 className="text-white font-bold text-sm mb-1">{fact.title}</h3>
                    <p className="text-slate-400 text-xs leading-relaxed">{fact.body}</p>
                  </div>
                </div>
                {/* Dot indicators */}
                <div className="flex gap-1.5 mt-3 justify-end">
                  {VIJAY_FACTS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => { setFading(true); setTimeout(() => { setFactIdx(i); setFading(false) }, 300) }}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${i === factIdx ? 'bg-gold-400 w-4' : 'bg-white/20'}`}
                    />
                  ))}
                </div>
              </div>

              {/* Quick stats row */}
              <div className="grid grid-cols-3 gap-2 mt-3">
                {[
                  { icon: Film, label: '36+', sub: 'Films' },
                  { icon: Users, label: '35L+', sub: 'TVK Members' },
                  { icon: Star, label: '10+', sub: '100Cr Hits' },
                ].map(({ icon: Ic, label, sub }) => (
                  <div key={sub} className="glass rounded-xl p-2.5 text-center border border-white/5">
                    <Ic className="w-3.5 h-3.5 text-gold-400 mx-auto mb-1" />
                    <div className="text-white font-bold text-sm">{label}</div>
                    <div className="text-muted text-[10px]">{sub}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}
