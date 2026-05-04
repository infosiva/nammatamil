'use client'

/**
 * TVKHeroBg — Cinematic hero background with Vijay silhouette + gold particle fx.
 * Uses a CSS/SVG silhouette of a figure raising their fist (TVK campaign pose)
 * overlaid on a deep gold-crimson radial gradient backdrop.
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
            radial-gradient(ellipse 80% 50% at 50% -10%, rgba(251,191,36,0.22) 0%, transparent 60%),
            radial-gradient(ellipse 40% 30% at 80% 20%, rgba(251,191,36,0.10) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 20% 30%, rgba(220,38,38,0.08) 0%, transparent 50%),
            linear-gradient(180deg, #0d0200 0%, #07010f 40%, #030008 100%)
          `,
        }} />

        {/* Gold spotlight from top centre — stage light */}
        <div style={{
          position: 'absolute', top: -200, left: '50%', transform: 'translateX(-50%)',
          width: 700, height: 700,
          background: 'radial-gradient(ellipse, rgba(251,191,36,0.28) 0%, rgba(251,191,36,0.06) 40%, transparent 70%)',
          borderRadius: '50%',
          animation: 'heroPulse 4s ease-in-out infinite',
        }} />

        {/* Vijay hero silhouette — right side, semi-transparent gold fill */}
        <div style={{
          position: 'absolute', right: '2%', bottom: 0,
          width: 'clamp(180px, 28vw, 420px)',
          height: 'clamp(280px, 55vw, 680px)',
          opacity: 0.13,
          animation: 'heroFigure 6s ease-in-out infinite',
        }}>
          <svg viewBox="0 0 240 480" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" fill="#fbbf24">
            {/* Head */}
            <ellipse cx="120" cy="52" rx="34" ry="40" />
            {/* Neck */}
            <rect x="110" y="88" width="20" height="18" rx="6" />
            {/* Shoulders / torso */}
            <path d="M60 110 Q80 100 120 106 Q160 100 180 110 L188 240 Q160 250 120 248 Q80 250 52 240 Z" />
            {/* Left arm — raised fist (campaign pose) */}
            <path d="M60 112 Q30 90 18 50 Q14 38 22 30 Q30 22 38 34 Q50 55 70 80 L75 112 Z" />
            {/* Raised fist */}
            <rect x="14" y="20" width="28" height="24" rx="8" />
            {/* Right arm — down */}
            <path d="M180 112 Q210 140 214 200 L196 202 Q192 150 170 120 Z" />
            {/* Legs */}
            <path d="M80 248 L68 400 L88 402 L100 300 L120 298 L140 300 L152 402 L172 400 L160 248 Z" />
            {/* Feet */}
            <ellipse cx="78" cy="408" rx="22" ry="10" />
            <ellipse cx="162" cy="408" rx="22" ry="10" />
          </svg>
        </div>

        {/* "VIJAY" large watermark text — very faint */}
        <div style={{
          position: 'absolute', top: '18%', left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 'clamp(80px, 18vw, 200px)', fontWeight: 900,
          color: 'rgba(251,191,36,0.035)',
          letterSpacing: '0.05em', whiteSpace: 'nowrap',
          userSelect: 'none',
          lineHeight: 1,
        }}>VIJAY</div>

        {/* TVK slogan */}
        <div style={{
          position: 'absolute', bottom: '8%', right: '4%',
          fontSize: 'clamp(9px, 1.5vw, 14px)', fontWeight: 900,
          color: 'rgba(251,191,36,0.18)',
          letterSpacing: '0.15em',
          userSelect: 'none',
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
        }}>தமிழகம் வெல்லும்</div>

        {/* Secondary glow right */}
        <div style={{
          position: 'absolute', top: 80, right: -100,
          width: 400, height: 400,
          background: 'radial-gradient(ellipse, rgba(251,140,36,0.12) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'heroPulse 6s ease-in-out infinite reverse',
        }} />

        {/* Floating star particles */}
        {STARS.map((s, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${s.x}%`, top: `${s.y}%`,
            fontSize: s.size, opacity: s.opacity,
            animation: `heroFloat ${s.dur}s ease-in-out infinite`,
            animationDelay: `${s.delay}s`,
            color: '#fbbf24',
            textShadow: '0 0 8px rgba(251,191,36,0.6)',
          }}>⭐</div>
        ))}

        {/* Diagonal light streaks */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `
            repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 120px,
              rgba(251,191,36,0.012) 120px,
              rgba(251,191,36,0.012) 121px
            )
          `,
        }} />

        {/* Bottom fade */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 140,
          background: 'linear-gradient(0deg, #07010f 0%, transparent 100%)',
        }} />
      </div>

      <style>{`
        @keyframes heroPulse {
          0%, 100% { opacity: 0.7; transform: translateX(-50%) scale(1); }
          50%       { opacity: 1;   transform: translateX(-50%) scale(1.15); }
        }
        @keyframes heroFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg);   }
          33%       { transform: translateY(-12px) rotate(15deg); }
          66%       { transform: translateY(6px) rotate(-10deg);  }
        }
        @keyframes heroFigure {
          0%, 100% { transform: scaleX(1) translateY(0px); }
          50%       { transform: scaleX(1) translateY(-8px); }
        }
      `}</style>
    </>
  )
}

// Pre-generated star positions (deterministic — no Math.random on server)
const STARS = [
  { x:5,  y:8,  size:10, opacity:0.35, dur:7,  delay:0   },
  { x:15, y:25, size:7,  opacity:0.2,  dur:9,  delay:1.2 },
  { x:25, y:5,  size:12, opacity:0.45, dur:6,  delay:0.5 },
  { x:35, y:18, size:6,  opacity:0.18, dur:11, delay:2.1 },
  { x:45, y:30, size:8,  opacity:0.28, dur:8,  delay:0.8 },
  { x:55, y:10, size:14, opacity:0.5,  dur:5,  delay:1.5 },
  { x:65, y:22, size:7,  opacity:0.22, dur:10, delay:3.0 },
  { x:72, y:6,  size:10, opacity:0.38, dur:7,  delay:0.3 },
  { x:80, y:35, size:6,  opacity:0.15, dur:12, delay:1.8 },
  { x:88, y:12, size:11, opacity:0.42, dur:6,  delay:2.5 },
  { x:92, y:28, size:8,  opacity:0.25, dur:9,  delay:0.7 },
  { x:10, y:45, size:6,  opacity:0.15, dur:13, delay:4.0 },
  { x:30, y:55, size:9,  opacity:0.3,  dur:7,  delay:1.0 },
  { x:50, y:50, size:5,  opacity:0.12, dur:15, delay:2.8 },
  { x:70, y:48, size:7,  opacity:0.2,  dur:8,  delay:3.5 },
  { x:85, y:60, size:6,  opacity:0.14, dur:11, delay:0.9 },
  { x:20, y:70, size:8,  opacity:0.18, dur:9,  delay:5.0 },
  { x:60, y:65, size:5,  opacity:0.1,  dur:14, delay:2.2 },
]
