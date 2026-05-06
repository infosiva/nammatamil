'use client'
import { useEffect, useState } from 'react'

interface AdUnitProps {
  size?: 'banner' | 'rectangle'
  className?: string
  network?: string
  format?: string
}

// ── OTT affiliate banners — rotate every 8s ───────────────────────────────────
const OTT_AFFILIATES = [
  {
    name: 'Amazon Prime',
    icon: '🎬',
    text: '30-day free trial',
    sub: 'Tamil movies & serials',
    url: 'https://www.amazon.co.uk/gp/video/primesignup?tag=nammatamil-21',
    color: '#FF9900',
    bg: 'rgba(255,153,0,0.10)',
    border: 'rgba(255,153,0,0.22)',
    cta: 'Try Free →',
  },
  {
    name: 'Disney+ Hotstar',
    icon: '⭐',
    text: 'Watch Tamil content',
    sub: 'Sun TV, Vijay TV & more',
    url: 'https://www.hotstar.com/in',
    color: '#00B8F5',
    bg: 'rgba(0,184,245,0.10)',
    border: 'rgba(0,184,245,0.22)',
    cta: 'Watch Now →',
  },
  {
    name: 'Netflix',
    icon: '🎥',
    text: 'Tamil originals & dubs',
    sub: 'Thousands of Tamil titles',
    url: 'https://www.netflix.com/in/',
    color: '#E50914',
    bg: 'rgba(229,9,20,0.10)',
    border: 'rgba(229,9,20,0.22)',
    cta: 'Start Free →',
  },
]

// ── Sticky Sidebar Ad — desktop only, right side, does NOT block content ─────
export function SidebarAd() {
  const [idx, setIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % OTT_AFFILIATES.length), 9000)
    return () => clearInterval(t)
  }, [])

  if (!visible) return null

  const aff = OTT_AFFILIATES[idx]

  return (
    <div style={{
      position: 'fixed',
      right: 16,
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 40,
      width: 160,
      // Only visible on large screens
      display: 'none',
    }}
      className="sidebar-ad-container"
    >
      <div style={{
        borderRadius: 16,
        background: aff.bg,
        border: `1px solid ${aff.border}`,
        padding: '14px 12px',
        backdropFilter: 'blur(12px)',
        position: 'relative',
      }}>
        {/* Close button */}
        <button
          onClick={() => setVisible(false)}
          style={{
            position: 'absolute', top: 6, right: 6,
            background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%',
            width: 18, height: 18, cursor: 'pointer',
            color: 'rgba(255,255,255,0.4)', fontSize: 10, lineHeight: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          aria-label="Close ad"
        >×</button>

        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Sponsored</div>

        <div style={{ fontSize: 22, marginBottom: 8 }}>{aff.icon}</div>
        <div style={{ fontWeight: 800, fontSize: 12, color: '#fff', marginBottom: 3 }}>{aff.name}</div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>{aff.text}</div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>{aff.sub}</div>

        <a
          href={aff.url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          style={{
            display: 'block', textAlign: 'center',
            padding: '7px 10px', borderRadius: 10,
            background: aff.color,
            color: '#fff', fontWeight: 800, fontSize: 11,
            textDecoration: 'none',
          }}
        >
          {aff.cta}
        </a>
      </div>
    </div>
  )
}

// ── Default AdUnit — now renders the clean affiliate banner, NOT Adsterra ─────
// Adsterra was injecting intrusive full-page ads (Adzilla etc.) in content.
// We only use Adsterra's SocialBar (bottom strip) — not inline ad units.
export default function AdUnit({ size, format, className = '' }: AdUnitProps) {
  // Accept both `size` and `format` props — normalize to size
  const resolvedSize: 'banner' | 'rectangle' =
    (size === 'banner' || format === 'horizontal') ? 'banner' : 'rectangle'
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % OTT_AFFILIATES.length), 8000)
    return () => clearInterval(t)
  }, [])

  const aff = OTT_AFFILIATES[idx]

  if (resolvedSize === 'banner') {
    return (
      <a
        href={aff.url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className={className}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 16px', borderRadius: 12, width: '100%',
          background: aff.bg, border: `1px solid ${aff.border}`,
          textDecoration: 'none', minHeight: 52,
        }}
      >
        <span style={{ fontSize: 20 }}>{aff.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>{aff.name} — {aff.text}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{aff.sub}</div>
        </div>
        <span style={{
          flexShrink: 0, fontSize: 11, fontWeight: 800,
          padding: '6px 12px', borderRadius: 8,
          background: aff.color, color: '#fff',
        }}>{aff.cta}</span>
        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.15)', flexShrink: 0 }}>Ad</span>
      </a>
    )
  }

  // Rectangle — horizontal slim affiliate strip
  return (
    <a
      href={aff.url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={className}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 14px', borderRadius: 12, width: '100%',
        background: aff.bg, border: `1px solid ${aff.border}`,
        textDecoration: 'none',
      }}
    >
      <span style={{ fontSize: 18 }}>{aff.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 12, color: '#fff' }}>{aff.name} — {aff.text}</div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>{aff.sub}</div>
      </div>
      <span style={{
        flexShrink: 0, fontSize: 10, fontWeight: 800,
        padding: '5px 10px', borderRadius: 7,
        background: aff.color, color: '#fff',
      }}>{aff.cta}</span>
      <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.12)', flexShrink: 0 }}>Ad</span>
    </a>
  )
}
