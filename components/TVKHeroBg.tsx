'use client'

/**
 * TVKHeroBg — Cinematic hero background.
 * Real Vijay/TVK photo on the right with gold glow overlay.
 */

export default function TVKHeroBg() {
  return (
    <>
      <div style={{
        position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0,
      }}>

        {/* Deep cinematic gradient base */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `
            radial-gradient(ellipse 100% 60% at 50% 0%, rgba(251,191,36,0.20) 0%, transparent 55%),
            radial-gradient(ellipse 50% 40% at 85% 15%, rgba(251,140,36,0.12) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 15% 30%, rgba(220,38,38,0.08) 0%, transparent 50%),
            linear-gradient(180deg, #120300 0%, #08010e 45%, #030008 100%)
          `,
        }} />

        {/* Strong gold spotlight cone from top-centre */}
        <div style={{
          position: 'absolute', top: -300, left: '50%', transform: 'translateX(-50%)',
          width: 900, height: 900,
          background: 'radial-gradient(ellipse, rgba(251,191,36,0.28) 0%, rgba(251,191,36,0.06) 35%, transparent 65%)',
          borderRadius: '50%',
          animation: 'heroPulse 5s ease-in-out infinite',
        }} />

        {/* Right side glow — behind photo */}
        <div style={{
          position: 'absolute', right: 0, top: 0, bottom: 0,
          width: '45%',
          background: 'linear-gradient(90deg, transparent 0%, rgba(251,191,36,0.04) 50%, rgba(251,191,36,0.10) 100%)',
        }} />

        {/* ── REAL VIJAY PHOTO — right side, masked into silhouette ── */}
        <div style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: 'clamp(200px, 38vw, 520px)',
          height: 'clamp(300px, 65vw, 780px)',
          animation: 'heroFigure 7s ease-in-out infinite',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/tvk-vijay.jpg"
            alt="Thalapathy Vijay — TVK"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center top',
              maskImage: 'linear-gradient(to left, rgba(0,0,0,0.85) 30%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0) 100%), linear-gradient(to top, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 20%)',
              WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,0.85) 30%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0) 100%), linear-gradient(to top, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 20%)',
              maskComposite: 'intersect',
              WebkitMaskComposite: 'source-in',
              filter: 'contrast(1.08) brightness(0.88) saturate(0.85)',
            }}
          />
          {/* Gold-tint overlay on photo */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, rgba(251,191,36,0.12) 0%, transparent 60%)',
            mixBlendMode: 'overlay',
          }} />
          {/* Right edge glow */}
          <div style={{
            position: 'absolute', inset: 0,
            boxShadow: 'inset -40px 0 80px rgba(251,191,36,0.18)',
          }} />
        </div>

        {/* "VIJAY" large watermark — behind content, very subtle */}
        <div style={{
          position: 'absolute', top: '12%', left: '3%',
          fontSize: 'clamp(70px, 16vw, 180px)', fontWeight: 900,
          color: 'rgba(251,191,36,0.04)',
          letterSpacing: '0.04em', whiteSpace: 'nowrap',
          userSelect: 'none', lineHeight: 1,
        }}>VIJAY</div>

        {/* Tamil slogan — bottom left */}
        <div style={{
          position: 'absolute', bottom: '5%', left: '2%',
          fontSize: 'clamp(10px, 1.8vw, 16px)', fontWeight: 800,
          color: 'rgba(251,191,36,0.22)',
          letterSpacing: '0.1em',
          userSelect: 'none',
        }}>தமிழகம் வெல்லும்</div>

        {/* Floating ⭐ particles */}
        {STARS.map((s, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${s.x}%`, top: `${s.y}%`,
            fontSize: s.size, opacity: s.opacity,
            animation: `heroFloat ${s.dur}s ease-in-out infinite`,
            animationDelay: `${s.delay}s`,
            color: '#fbbf24',
            textShadow: '0 0 10px rgba(251,191,36,0.8)',
          }}>⭐</div>
        ))}

        {/* Diagonal gold streaks — cinematic */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `repeating-linear-gradient(
            -45deg, transparent, transparent 140px,
            rgba(251,191,36,0.012) 140px, rgba(251,191,36,0.012) 141px
          )`,
        }} />

        {/* Bottom fade to page bg */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 160,
          background: 'linear-gradient(0deg, #030008 0%, transparent 100%)',
        }} />
      </div>

      <style>{`
        @keyframes heroPulse {
          0%, 100% { opacity: 0.8; transform: translateX(-50%) scale(1); }
          50%       { opacity: 1;   transform: translateX(-50%) scale(1.12); }
        }
        @keyframes heroFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33%       { transform: translateY(-14px) rotate(12deg); }
          66%       { transform: translateY(7px) rotate(-8deg); }
        }
        @keyframes heroFigure {
          0%, 100% { transform: translateY(0px); filter: drop-shadow(0 0 40px rgba(251,191,36,0.3)) brightness(0.88) contrast(1.08); }
          50%       { transform: translateY(-8px);  filter: drop-shadow(0 0 60px rgba(251,191,36,0.5)) brightness(0.92) contrast(1.1); }
        }
      `}</style>
    </>
  )
}

const STARS = [
  { x:5,  y:8,  size:10, opacity:0.4,  dur:7,  delay:0   },
  { x:15, y:25, size:7,  opacity:0.25, dur:9,  delay:1.2 },
  { x:25, y:5,  size:13, opacity:0.5,  dur:6,  delay:0.5 },
  { x:35, y:18, size:6,  opacity:0.2,  dur:11, delay:2.1 },
  { x:45, y:30, size:9,  opacity:0.32, dur:8,  delay:0.8 },
  { x:55, y:10, size:15, opacity:0.55, dur:5,  delay:1.5 },
  { x:18, y:42, size:7,  opacity:0.22, dur:10, delay:3.0 },
  { x:28, y:60, size:10, opacity:0.3,  dur:7,  delay:1.0 },
  { x:40, y:50, size:6,  opacity:0.18, dur:12, delay:2.8 },
  { x:8,  y:70, size:8,  opacity:0.2,  dur:9,  delay:4.0 },
]
