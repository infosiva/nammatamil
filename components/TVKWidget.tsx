'use client'

import { useState, useEffect, useCallback } from 'react'

// TVK colors: Red #e11d48, Black #0a0a0a, White — party flag palette
// Election day: Tamil Nadu Assembly Election — May 4, 2026
const ELECTION_DATE = new Date('2026-05-04T06:00:00+05:30')

const VIBES = [
  { tamil: 'வெற்றி நிச்சயம்!', en: 'Victory is certain!' },
  { tamil: 'மாற்றம் வருகிறது!', en: 'Change is coming!' },
  { tamil: 'தமிழகம் விழிக்கிறது!', en: 'Tamil Nadu awakens!' },
  { tamil: 'ஊழல் ஒழிக்கப்படும்!', en: 'Corruption will end!' },
  { tamil: 'இளைஞர் சக்தி!', en: 'Power of the youth!' },
  { tamil: 'தலைப்பதி வருகிறார்!', en: 'Thalapathy is coming!' },
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

function Digit({ n, label }: { n: number; label: string }) {
  const [prev, setPrev] = useState(n)
  const [flip, setFlip] = useState(false)
  useEffect(() => {
    if (n !== prev) {
      setFlip(true)
      const t = setTimeout(() => { setPrev(n); setFlip(false) }, 300)
      return () => clearTimeout(t)
    }
  }, [n, prev])
  const v = String(n).padStart(2, '0')
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-16 sm:w-20 h-14 sm:h-16 perspective-500">
        {/* top half */}
        <div className="absolute inset-x-0 top-0 h-1/2 rounded-t-lg bg-gradient-to-b from-[#1a0008] to-[#2d0010] border border-[#e11d48]/30 overflow-hidden flex items-end justify-center pb-0.5">
          <span className={`text-3xl sm:text-4xl font-black text-white tabular-nums leading-none transition-transform duration-300 ${flip ? '-translate-y-4 opacity-0' : 'translate-y-0 opacity-100'}`}>{v}</span>
        </div>
        {/* bottom half */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 rounded-b-lg bg-gradient-to-b from-[#200010] to-[#0a0005] border border-[#e11d48]/20 border-t-0 overflow-hidden flex items-start justify-center pt-0.5">
          <span className="text-3xl sm:text-4xl font-black text-white/90 tabular-nums leading-none">{v}</span>
        </div>
        {/* centre fold line */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-px h-px bg-black/60 z-10" />
      </div>
      <span className="text-[10px] uppercase tracking-[0.15em] text-[#e11d48]/80 font-semibold">{label}</span>
    </div>
  )
}

export default function TVKWidget() {
  const time = useCountdown(ELECTION_DATE)
  const [vibeIdx, setVibeIdx] = useState(0)
  const [vibeVisible, setVibeVisible] = useState(true)

  useEffect(() => {
    const id = setInterval(() => {
      setVibeVisible(false)
      setTimeout(() => {
        setVibeIdx(i => (i + 1) % VIBES.length)
        setVibeVisible(true)
      }, 400)
    }, 4000)
    return () => clearInterval(id)
  }, [])

  const vibe = VIBES[vibeIdx]

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Outer wrapper with TVK red border glow */}
      <div className="relative rounded-3xl overflow-hidden" style={{ boxShadow: '0 0 0 1px rgba(225,29,72,0.35), 0 0 40px rgba(225,29,72,0.12), 0 0 80px rgba(225,29,72,0.06)' }}>

        {/* ── Background layers ── */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0d0005 0%, #110008 40%, #0a0003 100%)' }} />
        {/* Diagonal red sweep */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(225,29,72,0.18) 0%, transparent 45%)' }} />
        {/* Right side gold warmth */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to left, rgba(245,158,11,0.06) 0%, transparent 50%)' }} />
        {/* Radial glow behind "Vijay" side */}
        <div className="absolute right-0 top-0 w-2/3 h-full" style={{ background: 'radial-gradient(ellipse 80% 100% at 80% 50%, rgba(225,29,72,0.1) 0%, transparent 70%)' }} />
        {/* Subtle grid lines */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="relative z-10 flex flex-col lg:flex-row">

          {/* ══ LEFT PANEL — Countdown ══ */}
          <div className="flex-1 p-6 sm:p-8 lg:p-10 flex flex-col justify-between gap-6">

            {/* Party badge */}
            <div className="flex items-center gap-3">
              {/* TVK flag colour strip */}
              <div className="flex h-8 rounded overflow-hidden border border-white/10">
                <div className="w-3 bg-[#e11d48]" />
                <div className="w-3 bg-black" />
                <div className="w-3 bg-white" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#e11d48]">தமிழக வெற்றி கழகம்</div>
                <div className="text-white font-black text-sm leading-tight">Tamilaga Vettri Kazhagam</div>
              </div>
            </div>

            {/* Headline */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e11d48]/15 border border-[#e11d48]/30 text-[#e11d48] text-[10px] font-bold uppercase tracking-widest mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#e11d48] animate-pulse" />
                Tamil Nadu Elections · May 4, 2026
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-1">
                Vote <span style={{ color: '#e11d48' }}>TVK</span>
              </h2>
              <p className="text-white/50 text-sm">
                வாக்களிக்க மறவாதீர்கள் — Cast your vote on May&nbsp;4
              </p>
            </div>

            {/* Countdown */}
            {time.done ? (
              <div className="flex items-center gap-2 text-[#e11d48] font-black text-2xl">
                🗳️ Election Day — Go Vote!
              </div>
            ) : (
              <div>
                <p className="text-white/35 text-[10px] uppercase tracking-widest mb-3 font-medium">Countdown to polling day</p>
                <div className="flex items-end gap-2 sm:gap-3">
                  <Digit n={time.days} label="Days" />
                  <span className="text-[#e11d48]/50 text-3xl font-black mb-6 leading-none">:</span>
                  <Digit n={time.hours} label="Hours" />
                  <span className="text-[#e11d48]/50 text-3xl font-black mb-6 leading-none">:</span>
                  <Digit n={time.minutes} label="Mins" />
                  <span className="text-[#e11d48]/50 text-3xl font-black mb-6 leading-none">:</span>
                  <Digit n={time.seconds} label="Secs" />
                </div>
              </div>
            )}

            {/* Rotating vibe */}
            <div className="h-12 flex flex-col justify-center">
              <p
                className="text-xl sm:text-2xl font-black transition-all duration-400"
                style={{
                  opacity: vibeVisible ? 1 : 0,
                  transform: vibeVisible ? 'translateY(0)' : 'translateY(8px)',
                  color: '#e11d48',
                }}
              >
                {vibe.tamil}
              </p>
              <p
                className="text-white/40 text-xs font-medium transition-all duration-400"
                style={{ opacity: vibeVisible ? 1 : 0 }}
              >
                {vibe.en}
              </p>
            </div>
          </div>

          {/* ══ RIGHT PANEL — Vijay Avatar + Promises ══ */}
          <div className="lg:w-[420px] relative flex flex-col">

            {/* Red top bar on desktop */}
            <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#e11d48]/30 to-transparent" />

            {/* Vijay visual area */}
            <div className="relative flex items-center justify-center p-6 sm:p-8 lg:pt-10 overflow-hidden">
              {/* Big silhouette circle */}
              <div className="relative">
                {/* Outer ring pulse */}
                <div className="absolute -inset-4 rounded-full border border-[#e11d48]/20 animate-ping" style={{ animationDuration: '3s' }} />
                <div className="absolute -inset-2 rounded-full border border-[#e11d48]/30" />
                {/* Avatar circle */}
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full relative overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #2d0010 0%, #1a0008 50%, #0d0005 100%)', border: '2px solid rgba(225,29,72,0.4)' }}>
                  {/* Stylised "V" monogram for Vijay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-6xl sm:text-7xl font-black select-none" style={{ color: '#e11d48', textShadow: '0 0 30px rgba(225,29,72,0.5)' }}>V</span>
                  </div>
                  {/* Shine overlay */}
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 60%)' }} />
                </div>
                {/* Name tag */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-0.5 rounded-full text-[10px] font-black tracking-wider text-white"
                  style={{ background: '#e11d48', boxShadow: '0 2px 12px rgba(225,29,72,0.5)' }}>
                  THALAPATHY VIJAY
                </div>
              </div>
            </div>

            {/* Promises / manifesto pills */}
            <div className="p-5 sm:p-6 pt-6 grid grid-cols-2 gap-2 flex-1">
              {[
                { icon: '🏛️', text: 'Corruption-free governance' },
                { icon: '🎓', text: 'Education for all' },
                { icon: '💼', text: 'Youth employment first' },
                { icon: '🌾', text: 'Farmers welfare' },
                { icon: '🏥', text: 'Free healthcare' },
                { icon: '⚡', text: 'Power for every home' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-2 px-2.5 py-2 rounded-xl"
                  style={{ background: 'rgba(225,29,72,0.07)', border: '1px solid rgba(225,29,72,0.15)' }}>
                  <span className="text-base flex-shrink-0">{icon}</span>
                  <span className="text-white/70 text-[10px] leading-tight font-medium">{text}</span>
                </div>
              ))}
            </div>

            {/* CTA row */}
            <div className="px-5 sm:px-6 pb-6 flex gap-2">
              <a
                href="https://tvk.org.in"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center py-2.5 rounded-xl text-white text-xs font-black uppercase tracking-widest transition-all hover:brightness-110 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #e11d48, #9f1239)', boxShadow: '0 4px 20px rgba(225,29,72,0.35)' }}
              >
                Visit TVK.org.in
              </a>
              <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="text-white/40 text-[10px] font-medium">Seats</span>
                <span className="text-white font-black text-sm">234</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom strip — horizontal manifesto ticker ── */}
        <div className="border-t overflow-hidden py-2" style={{ borderColor: 'rgba(225,29,72,0.2)', background: 'rgba(225,29,72,0.06)' }}>
          <div className="tvk-ticker-inner text-[11px] font-bold uppercase tracking-widest">
            {[
              '🗳️ Vote TVK on May 4',
              '🌟 Thalapathy Vijay for Tamil Nadu',
              '✊ வெற்றி நிச்சயம்',
              '🏆 Tamilaga Vettri Kazhagam',
              '🌾 Farmers First',
              '🎓 Education For All',
              '💼 Youth Employment',
              '⚡ Free Power',
              '🏥 Free Healthcare',
              '🗳️ Vote TVK on May 4',
              '🌟 Thalapathy Vijay for Tamil Nadu',
              '✊ வெற்றி நிச்சயம்',
              '🏆 Tamilaga Vettri Kazhagam',
              '🌾 Farmers First',
              '🎓 Education For All',
              '💼 Youth Employment',
              '⚡ Free Power',
              '🏥 Free Healthcare',
            ].map((item, i) => (
              <span key={i} className="px-8 whitespace-nowrap" style={{ color: 'rgba(225,29,72,0.8)' }}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
