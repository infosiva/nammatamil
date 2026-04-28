'use client'

import { useState, useEffect, useCallback } from 'react'

// May 4 2026 polling starts at 8:00 AM IST
const POLLING_DATE = new Date('2026-05-04T08:00:00+05:30')

// TVK Manifesto points — rotated randomly
const MANIFESTO = [
  { tamil: 'இலவச உயர்கல்வி',              en: 'Free higher education' },
  { tamil: 'விவசாயிகளுக்கு கடன் தள்ளுபடி', en: 'Farmer loan waiver' },
  { tamil: 'பெண்கள் பாதுகாப்பு',           en: 'Women\'s safety first' },
  { tamil: 'வேலைவாய்ப்பு உறுதி',           en: 'Employment guarantee' },
  { tamil: 'குடிநீர் உரிமை',               en: 'Right to clean water' },
  { tamil: 'ஊழல் ஒழிப்பு',                en: 'Zero corruption' },
  { tamil: 'சுகாதார காப்பீடு',             en: 'Universal health cover' },
  { tamil: 'இலவச பேருந்து பயணம்',          en: 'Free bus travel' },
  { tamil: 'தொழிலாளர் உரிமைகள்',          en: 'Workers\' rights' },
  { tamil: 'கல்வி சீர்திருத்தம்',          en: 'Education reform' },
]

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function getTimeLeft() {
  const now = Date.now()
  const diff = POLLING_DATE.getTime() - now
  if (diff <= 0) return null
  const d = Math.floor(diff / 86_400_000)
  const h = Math.floor((diff % 86_400_000) / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  const s = Math.floor((diff % 60_000) / 1_000)
  return { d, h, m, s }
}

export default function TVKWidget() {
  const [time, setTime] = useState(getTimeLeft)
  const [mIdx, setMIdx] = useState(() => Math.floor(Math.random() * MANIFESTO.length))
  const [mVisible, setMVisible] = useState(true)

  // 1-second countdown
  useEffect(() => {
    const id = setInterval(() => setTime(getTimeLeft()), 1000)
    return () => clearInterval(id)
  }, [])

  // Rotate manifesto every 4 s
  useEffect(() => {
    const id = setInterval(() => {
      setMVisible(false)
      setTimeout(() => {
        setMIdx(() => Math.floor(Math.random() * MANIFESTO.length))
        setMVisible(true)
      }, 300)
    }, 4000)
    return () => clearInterval(id)
  }, [])

  const item = MANIFESTO[mIdx]

  return (
    <div className="fixed top-3 right-3 z-[200] select-none">
      <div
        className="w-52 rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: '#0c0c0c',
          border: '1px solid rgba(220,38,38,0.4)',
          boxShadow: '0 0 0 1px rgba(220,38,38,0.08), 0 12px 40px rgba(0,0,0,0.7)',
        }}
      >
        {/* TVK flag stripe — red | black | white */}
        <div className="flex h-1.5 w-full">
          <div className="flex-1" style={{ background: '#dc2626' }} />
          <div className="flex-1 bg-black" />
          <div className="flex-1 bg-white" />
        </div>

        {/* Header — TVK logo + title */}
        <div
          className="flex items-center gap-2 px-3 pt-2.5 pb-2"
          style={{ borderBottom: '1px solid rgba(220,38,38,0.15)' }}
        >
          {/* TVK emblem — stylised torch/sun icon */}
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
              boxShadow: '0 0 8px rgba(220,38,38,0.5)',
            }}
          >
            {/* Rising sun / torch SVG */}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="9" r="3.5" fill="white" opacity="0.9" />
              <rect x="7.3" y="1" width="1.4" height="3" rx="0.7" fill="white" opacity="0.8" />
              <rect x="7.3" y="12" width="1.4" height="3" rx="0.7" fill="white" opacity="0.5" />
              <rect x="1" y="8.3" width="3" height="1.4" rx="0.7" fill="white" opacity="0.8" />
              <rect x="12" y="8.3" width="3" height="1.4" rx="0.7" fill="white" opacity="0.5" />
              <rect x="3" y="3" width="1.4" height="3" rx="0.7" fill="white" opacity="0.6" transform="rotate(45 3 3)" />
              <rect x="11.6" y="3" width="1.4" height="3" rx="0.7" fill="white" opacity="0.6" transform="rotate(-45 12.6 3)" />
            </svg>
          </div>
          <div>
            <div className="text-[10px] font-black tracking-wider uppercase" style={{ color: '#dc2626' }}>TVK</div>
            <div className="text-[8px] text-white/30 leading-tight">தமிழக வெற்றி கழகம்</div>
          </div>
        </div>

        {/* Countdown section */}
        <div className="px-3 py-2.5">
          <p className="text-[9px] text-white/40 uppercase tracking-widest text-center mb-2 font-semibold">
            வாக்குப்பதிவு நாள் — May 4, 8AM
          </p>

          {time ? (
            <div className="grid grid-cols-4 gap-1 mb-1">
              {[
                { val: time.d, label: 'நாள்' },
                { val: time.h, label: 'மணி' },
                { val: time.m, label: 'நிமி' },
                { val: time.s, label: 'விநா' },
              ].map(({ val, label }) => (
                <div key={label} className="flex flex-col items-center">
                  <div
                    className="w-full text-center text-base font-black rounded-lg py-1 leading-none"
                    style={{
                      background: 'rgba(220,38,38,0.12)',
                      border: '1px solid rgba(220,38,38,0.25)',
                      color: '#f87171',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {pad(val)}
                  </div>
                  <span className="text-[8px] text-white/25 mt-0.5">{label}</span>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="text-center py-2 rounded-lg text-[11px] font-black"
              style={{ background: 'rgba(220,38,38,0.15)', color: '#f87171' }}
            >
              🗳️ இன்று வாக்களிக்கும் நாள்!
            </div>
          )}
        </div>

        {/* Manifesto rolling ticker */}
        <div
          className="px-3 pb-2.5 pt-1"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div
            className="transition-all duration-300 text-center"
            style={{ opacity: mVisible ? 1 : 0, transform: mVisible ? 'translateY(0)' : 'translateY(4px)' }}
          >
            <p className="text-[10px] font-bold leading-snug" style={{ color: '#fca5a5' }}>
              {item.tamil}
            </p>
            <p className="text-[8px] text-white/25 mt-0.5">{item.en}</p>
          </div>
        </div>

        {/* Bottom flag stripe */}
        <div className="flex h-1 w-full">
          <div className="flex-1" style={{ background: '#dc2626' }} />
          <div className="flex-1 bg-black" />
          <div className="flex-1 bg-white" />
        </div>
      </div>
    </div>
  )
}
