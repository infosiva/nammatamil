'use client'

import { useState, useEffect, useCallback } from 'react'

// Polling day: April 23, 2026 — Tamil Nadu Assembly Elections
const ELECTION_DATE = new Date('2026-04-23T07:00:00+05:30')

const VIBES = [
  { tamil: 'வெற்றி நிச்சயம்!',    en: 'Victory is certain!' },
  { tamil: 'மாற்றம் வருகிறது!',  en: 'Change is coming!' },
  { tamil: 'தமிழகம் விழிக்கிறது!', en: 'Tamil Nadu awakens!' },
  { tamil: 'தலைப்பதி வருகிறார்!', en: 'Thalapathy is coming!' },
  { tamil: 'ஊழல் ஒழிக்கப்படும்!', en: 'Corruption will end!' },
  { tamil: 'இளைஞர் சக்தி!',      en: 'Power of the youth!' },
]

function useCountdown(target: Date) {
  const calc = useCallback(() => {
    const diff = target.getTime() - Date.now()
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true }
    return {
      days:    Math.floor(diff / 86400000),
      hours:   Math.floor((diff % 86400000) / 3600000),
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

/** Compact floating countdown widget — fixed top-right corner */
export default function TVKWidget() {
  const time = useCountdown(ELECTION_DATE)
  const [vibeIdx, setVibeIdx] = useState(0)
  const [visible, setVisible] = useState(true)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false)
      setTimeout(() => { setVibeIdx(i => (i + 1) % VIBES.length); setVisible(true) }, 350)
    }, 4000)
    return () => clearInterval(id)
  }, [])

  const vibe = VIBES[vibeIdx]

  return (
    // Fixed to top-right, above header z-index
    <div className="fixed top-4 right-4 z-[200] flex flex-col items-end gap-2">

      {/* ── Collapsed pill / toggle ── */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-[11px] font-black uppercase tracking-wider shadow-lg transition-all hover:scale-105 active:scale-95 select-none"
        style={{
          background: 'linear-gradient(135deg,#9f1239,#e11d48)',
          boxShadow: '0 0 0 1px rgba(225,29,72,0.4), 0 4px 16px rgba(225,29,72,0.35)',
        }}
      >
        {/* Pulsing dot */}
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse flex-shrink-0" />
        <span>TVK</span>
        {!time.done && (
          <span className="opacity-80 font-mono">
            {String(time.days).padStart(2,'0')}d {String(time.hours).padStart(2,'0')}h
          </span>
        )}
        <span className="text-white/60 text-[10px]">{open ? '▲' : '▼'}</span>
      </button>

      {/* ── Expanded panel ── */}
      {open && (
        <div
          className="w-64 rounded-2xl overflow-hidden shadow-2xl"
          style={{
            background: 'linear-gradient(135deg,#0d0005 0%,#1a0008 100%)',
            border: '1px solid rgba(225,29,72,0.35)',
            boxShadow: '0 0 0 1px rgba(225,29,72,0.2), 0 8px 40px rgba(225,29,72,0.2)',
          }}
        >
          {/* Red top bar */}
          <div style={{ background: 'linear-gradient(90deg,#9f1239,#e11d48,#9f1239)' }} className="h-1 w-full" />

          <div className="p-4">
            {/* Party label */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-5 rounded overflow-hidden">
                <div className="w-2 bg-[#e11d48]" />
                <div className="w-2 bg-black" />
                <div className="w-2 bg-white" />
              </div>
              <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">
                Tamilaga Vettri Kazhagam
              </span>
            </div>

            {/* Date headline */}
            <div className="text-[11px] font-bold text-white/50 mb-1 uppercase tracking-widest">
              Polling Day — Apr 23, 2026
            </div>

            {/* Countdown digits */}
            {time.done ? (
              <div className="text-[#e11d48] font-black text-base">🗳️ Go Vote Today!</div>
            ) : (
              <div className="flex gap-2 mb-3">
                {[
                  { v: time.days,    l: 'Days' },
                  { v: time.hours,   l: 'Hrs' },
                  { v: time.minutes, l: 'Min' },
                  { v: time.seconds, l: 'Sec' },
                ].map(({ v, l }) => (
                  <div key={l} className="flex-1 text-center rounded-lg py-1.5"
                    style={{ background: 'rgba(225,29,72,0.1)', border: '1px solid rgba(225,29,72,0.2)' }}>
                    <div className="text-lg font-black text-white tabular-nums leading-none">
                      {String(v).padStart(2,'0')}
                    </div>
                    <div className="text-[8px] text-white/40 uppercase tracking-wider mt-0.5">{l}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Rotating vibe */}
            <div className="h-8 flex flex-col justify-center border-t border-white/5 pt-2">
              <p
                className="text-sm font-black transition-all duration-350"
                style={{ color: '#e11d48', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(4px)' }}
              >
                {vibe.tamil}
              </p>
              <p className="text-[9px] text-white/30" style={{ opacity: visible ? 1 : 0 }}>
                {vibe.en}
              </p>
            </div>

            {/* Manifesto mini pills */}
            <div className="grid grid-cols-2 gap-1 mt-3">
              {['🏛️ Corruption-free','🎓 Education for all','💼 Youth jobs','🌾 Farmers first'].map(p => (
                <div key={p} className="text-[9px] text-white/50 px-2 py-1 rounded-lg flex items-center gap-1"
                  style={{ background: 'rgba(225,29,72,0.07)', border: '1px solid rgba(225,29,72,0.12)' }}>
                  {p}
                </div>
              ))}
            </div>

            {/* CTA */}
            <a
              href="https://tvk.org.in"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center w-full py-2 rounded-xl text-[11px] font-black text-white uppercase tracking-wider transition-all hover:brightness-110"
              style={{ background: 'linear-gradient(135deg,#9f1239,#e11d48)', boxShadow: '0 2px 12px rgba(225,29,72,0.3)' }}
            >
              Visit TVK.org.in →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
