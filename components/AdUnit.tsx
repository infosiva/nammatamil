'use client'
import { useEffect, useRef, useState } from 'react'

interface AdUnitProps {
  size?: 'banner' | 'rectangle'
  className?: string
}

// ── Adsterra keys for nammatamil.live (approved 2026-05-04) ──────────────────
const ADSTERRA_KEY_RECT   = 'aa69afb2f2b7de0d5087c6d5a38b63a6'  // 300×250
const ADSTERRA_KEY_BANNER = '7785fb36450d23c29552e70fe221bf34'  // 728×90
const ADSTERRA_SOCIAL_BAR = '63acc4552ee58ba7e10602221b112388'  // Social Bar

// ── OTT affiliate banners — rotate every 8s ───────────────────────────────────
const OTT_AFFILIATES = [
  {
    name: 'Amazon Prime',
    icon: '🎬',
    text: '30-day free trial',
    sub: 'Tamil movies & serials',
    url: 'https://www.amazon.co.uk/gp/video/primesignup?tag=nammatamil-21',
    color: 'from-[#00A8E1]/20 to-[#FF9900]/10',
    border: 'border-[#FF9900]/20',
    cta: 'Try Free →',
  },
  {
    name: 'Disney+ Hotstar',
    icon: '⭐',
    text: 'Watch Tamil content',
    sub: 'Sun TV, Vijay TV & more',
    url: 'https://www.hotstar.com/in',
    color: 'from-[#0F3FA6]/20 to-[#00B8F5]/10',
    border: 'border-[#00B8F5]/20',
    cta: 'Watch Now →',
  },
  {
    name: 'Netflix',
    icon: '🎥',
    text: 'Tamil originals & dubs',
    sub: 'Free first month',
    url: 'https://www.netflix.com/in/',
    color: 'from-[#E50914]/20 to-[#831010]/10',
    border: 'border-[#E50914]/20',
    cta: 'Start Free →',
  },
]

// Social Bar — sticky bottom bar, injected once into body
export function SocialBar() {
  const loaded = useRef(false)
  useEffect(() => {
    if (loaded.current) return
    loaded.current = true
    const s = document.createElement('script')
    s.async = true
    s.setAttribute('data-cfasync', 'false')
    s.src = `//pl29337006.profitablecpmratenetwork.com/63/ac/c4/63acc4552ee58ba7e10602221b112388.js`
    document.body.appendChild(s)
  }, [])
  return null
}

function AffiliateUnit({ size }: { size: 'banner' | 'rectangle' }) {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % OTT_AFFILIATES.length), 8000)
    return () => clearInterval(t)
  }, [])
  const aff = OTT_AFFILIATES[idx]
  if (size === 'banner') {
    return (
      <a href={aff.url} target="_blank" rel="noopener noreferrer sponsored"
        className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-gradient-to-r ${aff.color} border ${aff.border} hover:opacity-90 transition-opacity`}
        style={{ minHeight: 60 }}>
        <span className="text-2xl">{aff.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="text-white font-semibold text-sm truncate">{aff.name} — {aff.text}</div>
          <div className="text-white/50 text-xs truncate">{aff.sub}</div>
        </div>
        <span className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg bg-white/10 text-white">{aff.cta}</span>
      </a>
    )
  }
  return (
    <a href={aff.url} target="_blank" rel="noopener noreferrer sponsored"
      className={`flex flex-col gap-2 w-full px-4 py-4 rounded-xl bg-gradient-to-br ${aff.color} border ${aff.border} hover:opacity-90 transition-opacity`}
      style={{ minHeight: 180 }}>
      <span className="text-3xl">{aff.icon}</span>
      <div className="text-white font-bold text-base">{aff.name}</div>
      <div className="text-white/60 text-sm">{aff.text}</div>
      <div className="text-white/40 text-xs">{aff.sub}</div>
      <span className="mt-auto self-start text-xs font-bold px-3 py-1.5 rounded-lg bg-white/10 text-white">{aff.cta}</span>
    </a>
  )
}

export default function AdUnit({ size = 'rectangle', className = '' }: AdUnitProps) {
  const key    = size === 'banner' ? ADSTERRA_KEY_BANNER : ADSTERRA_KEY_RECT
  const width  = size === 'banner' ? 728 : 300
  const height = size === 'banner' ? 90  : 250
  const ref    = useRef<HTMLDivElement>(null)
  const loaded = useRef(false)

  useEffect(() => {
    if (loaded.current || !ref.current) return
    loaded.current = true
    const s = document.createElement('script')
    s.type = 'text/javascript'
    s.setAttribute('data-cfasync', 'false')
    s.text = `(function(){var o={key:'${key}',format:'iframe',height:${height},width:${width},params:{}};var d=document.createElement('script');d.type='text/javascript';d.setAttribute('data-cfasync','false');d.src='//www.highperformanceformat.com/${key}/invoke.js';var c=document.currentScript||document.scripts[document.scripts.length-1];c.parentNode.insertBefore(d,c.nextSibling);window.atOptions=o;})();`
    ref.current.appendChild(s)
  }, [key, height, width])

  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      <div className="text-[9px] text-white/10 text-center mb-0.5 uppercase tracking-widest">Sponsored</div>
      <div ref={ref} style={{ width, maxWidth: '100%', minHeight: height }} />
    </div>
  )
}
