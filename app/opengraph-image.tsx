import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'NammaTamil.tv — Tamil Entertainment Hub'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #04040f 0%, #0d0d1f 50%, #04040f 100%)',
          position: 'relative',
        }}
      >
        {/* Gold glow */}
        <div
          style={{
            position: 'absolute',
            top: -100,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 800,
            height: 400,
            background: 'radial-gradient(ellipse, rgba(245,158,11,0.18) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />
        {/* Logo icon */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 40,
            marginBottom: 24,
            boxShadow: '0 0 40px rgba(245,158,11,0.4)',
          }}
        >
          📺
        </div>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 16 }}>
          <span
            style={{
              fontSize: 72,
              fontWeight: 900,
              background: 'linear-gradient(135deg, #fbbf24, #f59e0b, #ef4444)',
              backgroundClip: 'text',
              color: 'transparent',
              letterSpacing: '-2px',
            }}
          >
            நம்ம
          </span>
          <span style={{ fontSize: 72, fontWeight: 900, color: '#ffffff', letterSpacing: '-2px' }}>
            Tamil
          </span>
          <span style={{ fontSize: 36, fontWeight: 700, color: '#f59e0b', opacity: 0.7 }}>
            .live
          </span>
        </div>
        {/* Tagline */}
        <p
          style={{
            fontSize: 26,
            color: 'rgba(255,255,255,0.55)',
            textAlign: 'center',
            maxWidth: 700,
            lineHeight: 1.4,
          }}
        >
          Tamil Serials · Movies · Music · OTT · News
        </p>
        {/* Bottom strip */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: 'linear-gradient(90deg, #f59e0b, #ef4444, #f59e0b)',
          }}
        />
      </div>
    ),
    { ...size }
  )
}
