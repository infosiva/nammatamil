'use client'

import { useEffect, useState } from 'react'

interface AdUnitProps {
  slot?: string
  format?: 'auto' | 'rectangle' | 'horizontal'
  className?: string
  /** Which network to prefer. 'auto' tries AdSense first, falls back to PropellerAds */
  network?: 'adsense' | 'propeller' | 'affiliate' | 'auto'
}

const PUB_ID = 'ca-pub-4237294630161176'

// PropellerAds zone IDs for nammatamil.live
// Sign up at propellerads.com → get real zone IDs and replace these
const PROPELLER_ZONE_BANNER = '9491703'  // replace with your zone ID after signup

// OTT affiliate links — earn commission when users sign up
const OTT_AFFILIATES = [
  {
    name: 'Amazon Prime',
    logo: '🎬',
    text: '30-day free trial',
    sub: 'Tamil movies & serials',
    url: 'https://www.amazon.co.uk/gp/video/primesignup?tag=nammatamil-21',
    color: 'from-[#00A8E1]/20 to-[#FF9900]/10',
    border: 'border-[#FF9900]/20',
  },
  {
    name: 'Disney+ Hotstar',
    logo: '⭐',
    text: 'Watch Tamil content',
    sub: 'Sun TV, Vijay TV & more',
    url: 'https://www.hotstar.com/in',
    color: 'from-[#0F3FA6]/20 to-[#00B8F5]/10',
    border: 'border-[#00B8F5]/20',
  },
  {
    name: 'Netflix',
    logo: '🎥',
    text: 'Tamil originals & dubs',
    sub: 'Free first month',
    url: 'https://www.netflix.com/in/',
    color: 'from-[#E50914]/20 to-[#831010]/10',
    border: 'border-[#E50914]/20',
  },
]

function AffiliateUnit({ className = '' }: { className?: string }) {
  const [idx, setIdx] = useState(0)

  // Rotate through affiliates every 8 seconds
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % OTT_AFFILIATES.length), 8000)
    return () => clearInterval(t)
  }, [])

  const aff = OTT_AFFILIATES[idx]

  return (
    <a
      href={aff.url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={`flex items-center gap-3 p-3 rounded-xl border bg-gradient-to-r ${aff.color} ${aff.border} hover:opacity-80 transition-opacity ${className}`}
    >
      <span className="text-2xl shrink-0">{aff.logo}</span>
      <div className="flex-1 min-w-0">
        <div className="text-white/80 text-xs font-bold">{aff.name}</div>
        <div className="text-white/50 text-[11px] truncate">{aff.text} · {aff.sub}</div>
      </div>
      <div className="shrink-0 text-[10px] text-white/30 uppercase tracking-wide border border-white/10 rounded px-1.5 py-0.5">
        Sponsored
      </div>
    </a>
  )
}

function PropellerUnit({ className = '' }: { className?: string }) {
  useEffect(() => {
    // PropellerAds banner script — replace zone ID after account signup
    const s = document.createElement('script')
    s.async = true
    s.src = `https://a.magsrv.com/ad-provider.js`
    s.setAttribute('data-admpid', PROPELLER_ZONE_BANNER)
    document.head.appendChild(s)
    return () => { try { document.head.removeChild(s) } catch {} }
  }, [])

  return (
    <div className={`overflow-hidden rounded-xl ${className}`}>
      <div className="text-[9px] text-white/15 text-center pt-1 uppercase tracking-widest">Ad</div>
      <div id={`propeller-${PROPELLER_ZONE_BANNER}`} />
    </div>
  )
}

function AdSenseUnit({ slot, format, className }: { slot: string; format: string; className?: string }) {
  useEffect(() => {
    try {
      // @ts-expect-error adsbygoogle untyped
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {}
  }, [])

  return (
    <div className={`overflow-hidden rounded-xl glass border border-white/5 ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={PUB_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  )
}

export default function AdUnit({
  slot = 'nammatamil-live-rectangle',
  format = 'auto',
  className = '',
  network = 'auto',
}: AdUnitProps) {
  if (network === 'affiliate') {
    return <AffiliateUnit className={className} />
  }

  if (network === 'propeller') {
    return <PropellerUnit className={className} />
  }

  if (network === 'adsense') {
    return <AdSenseUnit slot={slot} format={format} className={className} />
  }

  // 'auto' mode: show affiliate banner (earns immediately, no approval needed)
  // Once AdSense is approved, switch to 'adsense' network prop
  return <AffiliateUnit className={className} />
}
