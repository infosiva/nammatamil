'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

const DELAY = 4 // seconds before redirect

// OTT affiliate offers — rotate during countdown
const OTT = [
  {
    name: 'Amazon Prime Video',
    icon: '🎬',
    text: '30-day free trial',
    sub: 'Tamil movies, serials & originals',
    url: 'https://www.amazon.co.uk/gp/video/primesignup?tag=nammatamil-21',
    color: '#FF9900',
    bg: 'rgba(255,153,0,0.12)',
    border: 'rgba(255,153,0,0.28)',
    cta: 'Try Free →',
  },
  {
    name: 'Disney+ Hotstar',
    icon: '⭐',
    text: 'Watch Tamil content',
    sub: 'Sun TV, Vijay TV & IPL live',
    url: 'https://www.hotstar.com/in',
    color: '#00B8F5',
    bg: 'rgba(0,184,245,0.12)',
    border: 'rgba(0,184,245,0.28)',
    cta: 'Watch Now →',
  },
  {
    name: 'Netflix',
    icon: '🎥',
    text: 'Tamil originals & dubs',
    sub: 'Thousands of Tamil titles',
    url: 'https://www.netflix.com/in/',
    color: '#E50914',
    bg: 'rgba(229,9,20,0.12)',
    border: 'rgba(229,9,20,0.28)',
    cta: 'Start Free →',
  },
]

declare global {
  interface Window {
    adsbygoogle: unknown[]
  }
}

export default function GoClient() {
  const params    = useSearchParams()
  const rawUrl    = params.get('url') ?? ''
  const ref       = params.get('ref') ?? 'site'
  const [secs, setSecs] = useState(DELAY)
  const [affIdx, setAffIdx] = useState(() => Math.floor(Math.random() * OTT.length))
  const adRef     = useRef<HTMLDivElement>(null)
  const redirected = useRef(false)

  // Validate URL — must be http/https to an external host
  let destUrl = '#'
  let destHost = ''
  try {
    const u = new URL(rawUrl)
    if (u.protocol === 'http:' || u.protocol === 'https:') {
      destUrl  = u.href
      destHost = u.hostname.replace(/^www\./, '')
    }
  } catch { /* invalid url */ }

  // Countdown + redirect
  useEffect(() => {
    if (!destUrl || destUrl === '#') return
    const t = setInterval(() => {
      setSecs(s => {
        if (s <= 1) {
          clearInterval(t)
          if (!redirected.current) {
            redirected.current = true
            window.location.href = destUrl
          }
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [destUrl])

  // Rotate affiliate every 3s
  useEffect(() => {
    const t = setInterval(() => setAffIdx(i => (i + 1) % OTT.length), 3000)
    return () => clearInterval(t)
  }, [])

  // Push AdSense unit after mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.adsbygoogle = window.adsbygoogle || []
        window.adsbygoogle.push({})
      }
    } catch { /* adsense not loaded */ }
  }, [])

  const aff = OTT[affIdx]
  const pct = ((DELAY - secs) / DELAY) * 100

  return (
    <div style={{
      background: '#07010f', minHeight: '100vh', color: '#f4f4f5',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'flex-start', padding: '24px 16px 48px',
    }}>
      {/* Nav back */}
      <div style={{ width: '100%', maxWidth: 520, marginBottom: 24 }}>
        <Link href="/" style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'none', fontWeight: 600 }}>
          ← NammaTamil
        </Link>
      </div>

      <div style={{ width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Main card ── */}
        <div style={{
          borderRadius: 20,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '28px 24px',
          backdropFilter: 'blur(12px)',
          textAlign: 'center',
        }}>
          {/* Spinner / tick */}
          <div style={{ fontSize: 40, marginBottom: 16 }}>
            {secs > 0 ? '📰' : '✅'}
          </div>

          <div style={{ fontWeight: 900, fontSize: 18, color: '#fff', marginBottom: 8 }}>
            {secs > 0 ? 'Opening article…' : 'Redirecting now'}
          </div>

          {destHost && (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 20 }}>
              Taking you to <span style={{ color: '#fbbf24', fontWeight: 700 }}>{destHost}</span>
              {ref && ref !== 'site' && (
                <span style={{ color: 'rgba(255,255,255,0.2)' }}> · via {ref}</span>
              )}
            </div>
          )}

          {/* Progress bar */}
          <div style={{
            height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.07)',
            overflow: 'hidden', marginBottom: 16,
          }}>
            <div style={{
              height: '100%', borderRadius: 99,
              background: 'linear-gradient(90deg, #fbbf24, #ef4444)',
              width: `${pct}%`,
              transition: 'width 0.9s linear',
            }} />
          </div>

          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>
            {secs > 0 ? `${secs}s` : 'Opening…'}
          </div>

          {/* Skip link */}
          {destUrl !== '#' && secs > 0 && (
            <a
              href={destUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block', marginTop: 16,
                fontSize: 11, color: 'rgba(255,255,255,0.2)',
                textDecoration: 'underline', cursor: 'pointer',
              }}
            >
              Skip →
            </a>
          )}
        </div>

        {/* ── AdSense unit ── */}
        <div style={{
          borderRadius: 16,
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          overflow: 'hidden', minHeight: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div ref={adRef} style={{ width: '100%' }}>
            {/* AdSense responsive unit — slot ID to be set in Vercel dashboard */}
            <ins
              className="adsbygoogle"
              style={{ display: 'block' }}
              data-ad-client="ca-pub-4237294630161176"
              data-ad-slot="auto"
              data-ad-format="auto"
              data-full-width-responsive="true"
            />
          </div>
        </div>

        {/* ── OTT Affiliate banner ── */}
        <a
          href={aff.url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '16px 18px', borderRadius: 16,
            background: aff.bg, border: `1px solid ${aff.border}`,
            textDecoration: 'none', transition: 'opacity 0.3s',
          }}
        >
          <span style={{ fontSize: 28, flexShrink: 0 }}>{aff.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Sponsored</div>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#fff', marginBottom: 2 }}>{aff.name}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{aff.text} · {aff.sub}</div>
          </div>
          <span style={{
            flexShrink: 0, fontSize: 12, fontWeight: 800,
            padding: '8px 14px', borderRadius: 10,
            background: aff.color, color: '#fff',
            whiteSpace: 'nowrap',
          }}>{aff.cta}</span>
        </a>

        {/* ── Fallback direct link ── */}
        {destUrl !== '#' && (
          <div style={{ textAlign: 'center' }}>
            <a
              href={destUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', textDecoration: 'none' }}
            >
              Go directly to article ↗
            </a>
          </div>
        )}

      </div>
    </div>
  )
}
