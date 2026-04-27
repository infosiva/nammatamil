'use client'

import { useState, useEffect, useCallback } from 'react'

// Tamil Nadu Assembly Election polling day — May 4, 2026 at 7 AM IST
const POLLING_DATE = new Date('2026-05-04T07:00:00+05:30')

// TVK manifesto points — rotated randomly, no party URLs or endorsements
const MANIFESTO = [
  { tamil: 'இலவச உயர்கல்வி',          en: 'Free higher education for all' },
  { tamil: 'விவசாயிகளுக்கு கடன் தள்ளுபடி', en: 'Farmer loan waiver' },
  { tamil: 'மாணவர்களுக்கு லேப்டாப்',   en: 'Laptops for every student' },
  { tamil: 'பெண்களுக்கு வேலைவாய்ப்பு',  en: 'Women employment guarantee' },
  { tamil: 'சாலை மேம்பாடு',            en: 'Road infrastructure upgrade' },
  { tamil: 'குடிநீர் திட்டம்',          en: 'Clean drinking water scheme' },
  { tamil: 'இளைஞர் தொழில் பயிற்சி',   en: 'Youth skills training' },
  { tamil: 'மருத்துவம் இலவசம்',         en: 'Free healthcare for all' },
  { tamil: 'ஊழல் ஒழிப்பு',             en: 'Zero tolerance for corruption' },
  { tamil: 'தமிழ் கலை பாதுகாப்பு',     en: 'Preserving Tamil arts & culture' },
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

/** Tamil Nadu Election countdown widget — fixed top-right */
export default function TVKWidget() {
  const time = useCountdown(POLLING_DATE)
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * MANIFESTO.length))
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIdx(() => Math.floor(Math.random() * MANIFESTO.length))
        setVisible(true)
      }, 350)
    }, 4500)
    return () => clearInterval(id)
  }, [])

  const item = MANIFESTO[idx]

  return (
    <div className="fixed top-3 right-3 z-[200]">
      <div
        className="w-52 rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: 'linear-gradient(160deg, #12000a 0%, #1e0010 60%, #0d0005 100%)',
          border: '1px solid rgba(225,29,72,0.4)',
          boxShadow: '0 0 0 1px rgba(225,29,72,0.15), 0 8px 32px rgba(225,29,72,0.25)',
        }}
      >
        {/* TVK flag stripe */}
        <div className="flex h-1 w-full">
          <div className="flex-1 bg-[#e11d48]" />
          <div className="flex-1 bg-black" />
          <div className="flex-1 bg-white" />
        </div>

        <div className="p-3">
          {/* Label */}
          <div className="flex items-center gap-1.5 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e11d48] animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-white/50">
              Polling Day · May 4, 2026
            </span>
          </div>

          {/* Countdown or done state */}
          {time.done ? (
            <div className="text-[#e11d48] font-black text-sm py-1">🗳️ Go Vote Today!</div>
          ) : (
            <div className="grid grid-cols-4 gap-1 mb-2.5">
              {[
                { v: time.days,    l: 'D' },
                { v: time.hours,   l: 'H' },
                { v: time.minutes, l: 'M' },
                { v: time.seconds, l: 'S' },
              ].map(({ v, l }) => (
                <div
                  key={l}
                  className="flex flex-col items-center py-1.5 rounded-lg"
                  style={{ background: 'rgba(225,29,72,0.12)', border: '1px solid rgba(225,29,72,0.2)' }}
                >
                  <span className="text-base font-black text-white tabular-nums leading-none">
                    {String(v).padStart(2, '0')}
                  </span>
                  <span className="text-[8px] text-white/30 mt-0.5 font-bold">{l}</span>
                </div>
              ))}
            </div>
          )}

          {/* Random manifesto rollover */}
          <div
            className="border-t pt-2 transition-all duration-300"
            style={{
              borderColor: 'rgba(225,29,72,0.15)',
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(4px)',
            }}
          >
            <p className="text-xs font-black leading-tight" style={{ color: '#e11d48' }}>
              {item.tamil}
            </p>
            <p className="text-[9px] text-white/25 mt-0.5">{item.en}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
