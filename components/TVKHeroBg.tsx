'use client'

/**
 * TVKHeroBg — Cinematic hero background.
 * TVK flag theme: crimson + gold horizontal stripe.
 * Vijay CM-proposed photo right side.
 * SVG whistle symbol as the brand centrepiece.
 */

export default function TVKHeroBg() {
  return (
    <>
      <div style={{
        position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0,
      }}>

        {/* ── BASE: deep dark page bg — the flag colours sit ON TOP as accents ── */}
        <div style={{
          position: 'absolute', inset: 0,
          background: '#07010f',
        }} />

        {/* ── TVK FLAG STRIPE BANDS — subtle crimson/gold accents, left side only ── */}
        {/* Top crimson band — only covers left half so photo stays clear */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: '45%',
          height: '35%',
          background: 'linear-gradient(180deg, rgba(139,0,0,0.45) 0%, rgba(139,0,0,0.08) 100%)',
        }} />
        {/* Gold centre stripe — left half only */}
        <div style={{
          position: 'absolute', top: '28%', left: 0, right: '50%',
          height: '20%',
          background: 'linear-gradient(180deg, rgba(255,193,7,0.18) 0%, rgba(255,193,7,0.26) 50%, rgba(255,193,7,0.18) 100%)',
        }} />
        {/* Bottom fade — full width but very subtle */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: '30%',
          background: 'linear-gradient(0deg, rgba(139,0,0,0.30) 0%, rgba(139,0,0,0.04) 100%)',
        }} />

        {/* ── GOLD SPOTLIGHT — top centre, like a stage light ── */}
        <div style={{
          position: 'absolute', top: -200, left: '50%', transform: 'translateX(-50%)',
          width: 800, height: 800,
          background: 'radial-gradient(ellipse, rgba(255,193,7,0.22) 0%, rgba(255,193,7,0.05) 35%, transparent 65%)',
          borderRadius: '50%',
          animation: 'heroPulse 6s ease-in-out infinite',
        }} />

        {/* ── LARGE SVG WHISTLE — centrepiece watermark, left-of-centre ── */}
        <div style={{
          position: 'absolute',
          left: '4%',
          top: '50%',
          transform: 'translateY(-50%)',
          opacity: 0.07,
          animation: 'whistleFloat 8s ease-in-out infinite',
        }}>
          <WhistleSVG size={340} color="#FFC107" />
        </div>

        {/* ── SECONDARY WHISTLE — top right corner, very small ── */}
        <div style={{
          position: 'absolute',
          right: '5%',
          top: '6%',
          opacity: 0.12,
        }}>
          <WhistleSVG size={52} color="#FFC107" />
        </div>

        {/* ── VIJAY PHOTO — right side, CM-proposed waving pose ── */}
        <div style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: 'clamp(220px, 42vw, 560px)',
          height: 'clamp(320px, 72vw, 840px)',
          animation: 'heroFigure 8s ease-in-out infinite',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/tvk-vijay.jpg"
            alt="Thalapathy Vijay — TVK · Chief Minister Proposed"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center top',
              /* Single mask — fade left edge into bg, keep rest fully visible */
              maskImage: 'linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 20%, rgba(0,0,0,1) 45%)',
              WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 20%, rgba(0,0,0,1) 45%)',
              filter: 'contrast(1.05) brightness(1.35) saturate(1.0)',
            }}
          />
          {/* Gold-crimson tone overlay — ties photo to flag palette (kept very light) */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(160deg, rgba(139,0,0,0.08) 0%, rgba(255,193,7,0.04) 50%, transparent 80%)',
            mixBlendMode: 'normal',
          }} />
          {/* Right edge glow */}
          <div style={{
            position: 'absolute', inset: 0,
            boxShadow: 'inset -50px 0 100px rgba(255,193,7,0.12)',
          }} />
        </div>

        {/* ── FLAG STRIPE LEFT ACCENT LINE — like the banner edge ── */}
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: 4,
          background: 'linear-gradient(180deg, #8B0000 0%, #FFC107 50%, #8B0000 100%)',
          opacity: 0.6,
        }} />

        {/* ── CRIMSON GLOW from bottom-left ── */}
        <div style={{
          position: 'absolute', bottom: -100, left: -100,
          width: 500, height: 500,
          background: 'radial-gradient(ellipse, rgba(139,0,0,0.22) 0%, transparent 65%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }} />

        {/* ── DIAGONAL GOLD STREAKS — very subtle cinematic scan lines ── */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `repeating-linear-gradient(
            -52deg, transparent, transparent 160px,
            rgba(255,193,7,0.014) 160px, rgba(255,193,7,0.014) 161px
          )`,
        }} />

        {/* ── BOTTOM FADE to page bg ── */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 120,
          background: 'linear-gradient(0deg, #07010f 0%, transparent 100%)',
        }} />

      </div>

      <style>{`
        @keyframes heroPulse {
          0%, 100% { opacity: 0.7; transform: translateX(-50%) scale(1); }
          50%       { opacity: 1;   transform: translateX(-50%) scale(1.1); }
        }
        @keyframes heroFigure {
          0%, 100% { transform: translateY(0px);   filter: drop-shadow(0 0 50px rgba(255,193,7,0.25)) brightness(1.05); }
          50%       { transform: translateY(-10px); filter: drop-shadow(0 0 80px rgba(255,193,7,0.40)) brightness(1.10); }
        }
        @keyframes whistleFloat {
          0%, 100% { transform: translateY(-50%) rotate(-4deg); opacity: 0.07; }
          50%       { transform: translateY(calc(-50% - 12px)) rotate(2deg); opacity: 0.10; }
        }
      `}</style>
    </>
  )
}

/* ── Faithful TVK whistle SVG (ECI-registered symbol) ── */
function WhistleSVG({ size = 120, color = '#FFC107' }: { size?: number; color?: string }) {
  return (
    <svg
      width={size} height={size * 0.78}
      viewBox="0 0 200 156"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Whistle body — large oval/sphere */}
      <ellipse cx="72" cy="90" rx="58" ry="58" fill={color} opacity="0.9" />
      <ellipse cx="72" cy="90" rx="58" ry="58" fill="none" stroke={color} strokeWidth="3.5" opacity="0.6" />
      {/* Inner sphere highlight */}
      <ellipse cx="72" cy="90" rx="38" ry="38" fill="none" stroke={color} strokeWidth="1.5" opacity="0.25" />
      <ellipse cx="58" cy="76" rx="16" ry="10" fill={color} opacity="0.15" />

      {/* Mouthpiece stem */}
      <rect x="124" y="72" width="70" height="28" rx="8" fill={color} opacity="0.85" />
      <rect x="124" y="72" width="70" height="28" rx="8" fill="none" stroke={color} strokeWidth="2" opacity="0.5" />

      {/* Mouthpiece tip notch */}
      <rect x="186" y="76" width="10" height="20" rx="3" fill={color} opacity="0.6" />

      {/* Top flange / chamber */}
      <rect x="126" y="58" width="42" height="18" rx="5" fill={color} opacity="0.7" />
      <rect x="126" y="58" width="42" height="18" rx="5" fill="none" stroke={color} strokeWidth="1.5" opacity="0.4" />

      {/* Junction between body and stem */}
      <path d="M 124 72 Q 112 72 108 82 Q 112 98 124 100" fill={color} opacity="0.6" />

      {/* Small ring/loop at bottom of sphere */}
      <circle cx="72" cy="148" r="7" fill="none" stroke={color} strokeWidth="3.5" opacity="0.7" />
      <line x1="72" y1="148" x2="72" y2="148" stroke={color} strokeWidth="2" opacity="0.5" />
      {/* Chain link */}
      <line x1="72" y1="141" x2="72" y2="148" stroke={color} strokeWidth="2.5" opacity="0.5" />

      {/* Sound hole at front */}
      <ellipse cx="72" cy="90" rx="12" ry="12" fill="none" stroke={color} strokeWidth="2" opacity="0.18" />
    </svg>
  )
}
