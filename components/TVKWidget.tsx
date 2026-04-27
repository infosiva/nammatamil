'use client'

import { useState, useEffect } from 'react'

// Vijay tribute quotes — rotated every few seconds
const QUOTES = [
  { tamil: 'தளபதி விஜய்',          en: 'The People\'s Hero' },
  { tamil: 'நம்ம தளபதி',           en: 'Our Captain' },
  { tamil: 'விஜய் — ஒரு நம்பிக்கை', en: 'Vijay — A Hope' },
  { tamil: 'மக்கள் மன்னன்',         en: 'King of the People' },
  { tamil: 'தமிழகத்தின் தலைவன்',   en: 'Leader of Tamil Nadu' },
]

export default function TVKWidget() {
  const [idx, setIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIdx(i => (i + 1) % QUOTES.length)
        setVisible(true)
      }, 350)
    }, 4000)
    return () => clearInterval(id)
  }, [])

  const item = QUOTES[idx]

  return (
    <div className="fixed top-3 right-3 z-[200]">
      <div
        className="w-48 rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: 'linear-gradient(160deg, #0a0010 0%, #1a0020 50%, #0d0005 100%)',
          border: '1px solid rgba(225,29,72,0.35)',
          boxShadow: '0 0 0 1px rgba(225,29,72,0.1), 0 8px 32px rgba(0,0,0,0.6)',
        }}
      >
        {/* TVK flag stripe */}
        <div className="flex h-1 w-full">
          <div className="flex-1 bg-[#e11d48]" />
          <div className="flex-1 bg-black" />
          <div className="flex-1 bg-white" />
        </div>

        {/* Vijay silhouette area */}
        <div
          className="relative h-28 flex items-end justify-center overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(225,29,72,0.05) 0%, rgba(225,29,72,0.15) 100%)',
          }}
        >
          {/* Star burst glow behind Vijay */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'radial-gradient(ellipse at center bottom, rgba(225,29,72,0.25) 0%, transparent 70%)' }}
          />
          {/* Vijay text silhouette — stylised */}
          <div className="relative z-10 text-center pb-2">
            <div
              className="text-4xl font-black leading-none tracking-tight"
              style={{
                color: 'transparent',
                WebkitTextStroke: '1px rgba(225,29,72,0.8)',
                textShadow: '0 0 20px rgba(225,29,72,0.4)',
                fontStyle: 'italic',
              }}
            >
              VIJAY
            </div>
            <div className="text-[8px] tracking-[0.3em] text-white/20 uppercase font-bold mt-0.5">
              தளபதி
            </div>
          </div>
        </div>

        {/* Rolling quote */}
        <div
          className="px-3 pb-3 pt-2 border-t transition-all duration-300"
          style={{
            borderColor: 'rgba(225,29,72,0.15)',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(4px)',
          }}
        >
          <p className="text-[11px] font-black leading-tight text-center" style={{ color: '#e11d48' }}>
            {item.tamil}
          </p>
          <p className="text-[9px] text-white/25 mt-0.5 text-center">{item.en}</p>
        </div>
      </div>
    </div>
  )
}
