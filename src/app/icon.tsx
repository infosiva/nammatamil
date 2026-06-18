import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #991b1b, #dc2626)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* sun motif: radiating lines around a circle — Tamil cultural mark, kept geometric */}
          <circle cx="12" cy="12" r="5" fill="white" />
          <g stroke="white" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="1" x2="12" y2="4" />
            <line x1="12" y1="20" x2="12" y2="23" />
            <line x1="1" y1="12" x2="4" y2="12" />
            <line x1="20" y1="12" x2="23" y2="12" />
            <line x1="4.2" y1="4.2" x2="6.3" y2="6.3" />
            <line x1="17.7" y1="17.7" x2="19.8" y2="19.8" />
            <line x1="4.2" y1="19.8" x2="6.3" y2="17.7" />
            <line x1="17.7" y1="6.3" x2="19.8" y2="4.2" />
          </g>
        </svg>
      </div>
    ),
    { ...size }
  )
}
