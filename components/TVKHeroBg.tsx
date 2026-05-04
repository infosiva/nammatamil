'use client'

/**
 * TVKHeroBg — Cinematic hero background.
 * Bold gold Vijay silhouette on the right, strong gradient backdrop.
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
            radial-gradient(ellipse 100% 60% at 50% 0%, rgba(251,191,36,0.25) 0%, transparent 55%),
            radial-gradient(ellipse 50% 40% at 85% 15%, rgba(251,140,36,0.15) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 15% 30%, rgba(220,38,38,0.10) 0%, transparent 50%),
            linear-gradient(180deg, #120300 0%, #08010e 45%, #030008 100%)
          `,
        }} />

        {/* Strong gold spotlight cone from top */}
        <div style={{
          position: 'absolute', top: -300, left: '50%', transform: 'translateX(-50%)',
          width: 900, height: 900,
          background: 'radial-gradient(ellipse, rgba(251,191,36,0.35) 0%, rgba(251,191,36,0.08) 35%, transparent 65%)',
          borderRadius: '50%',
          animation: 'heroPulse 5s ease-in-out infinite',
        }} />

        {/* Right side glow behind silhouette */}
        <div style={{
          position: 'absolute', right: 0, top: 0, bottom: 0,
          width: '40%',
          background: 'linear-gradient(90deg, transparent 0%, rgba(251,191,36,0.06) 60%, rgba(251,191,36,0.12) 100%)',
        }} />

        {/* ── VIJAY SILHOUETTE ── bold, visible, right side ── */}
        <div style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: 'clamp(220px, 35vw, 500px)',
          height: 'clamp(340px, 70vw, 800px)',
          opacity: 0.55,
          filter: 'drop-shadow(0 0 40px rgba(251,191,36,0.4)) drop-shadow(0 0 80px rgba(251,191,36,0.2))',
          animation: 'heroFigure 7s ease-in-out infinite',
        }}>
          <svg viewBox="0 0 260 520" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="figGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity="1" />
                <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#d97706" stopOpacity="0.7" />
              </linearGradient>
            </defs>
            {/* Head */}
            <ellipse cx="130" cy="55" rx="38" ry="44" fill="url(#figGrad)" />
            {/* Hair / top silhouette detail */}
            <ellipse cx="130" cy="18" rx="32" ry="14" fill="url(#figGrad)" />
            {/* Neck */}
            <rect x="118" y="94" width="24" height="22" rx="6" fill="url(#figGrad)" />
            {/* Torso */}
            <path d="M62 118 Q90 105 130 112 Q170 105 198 118 L206 260 Q170 272 130 270 Q90 272 54 260 Z" fill="url(#figGrad)" />
            {/* Left arm — raised high (victory pose) */}
            <path d="M66 120 Q40 95 24 55 Q16 38 26 26 Q36 14 48 28 Q64 52 82 88 L84 122 Z" fill="url(#figGrad)" />
            {/* Raised fist left */}
            <rect x="18" y="14" width="34" height="28" rx="10" fill="url(#figGrad)" />
            {/* Thumb on fist */}
            <rect x="10" y="20" width="12" height="16" rx="6" fill="url(#figGrad)" />
            {/* Right arm — slight out pose */}
            <path d="M196 120 Q224 150 228 220 Q228 230 216 230 L208 228 Q208 162 186 130 Z" fill="url(#figGrad)" />
            {/* Right hand */}
            <ellipse cx="222" cy="234" rx="14" ry="10" fill="url(#figGrad)" />
            {/* Legs */}
            <path d="M86 268 L72 430 L96 432 L108 320 L130 316 L152 320 L164 432 L188 430 L174 268 Z" fill="url(#figGrad)" />
            {/* Left foot */}
            <ellipse cx="84" cy="438" rx="24" ry="11" fill="url(#figGrad)" />
            {/* Right foot */}
            <ellipse cx="176" cy="438" rx="24" ry="11" fill="url(#figGrad)" />
          </svg>
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
            rgba(251,191,36,0.015) 140px, rgba(251,191,36,0.015) 141px
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
          0%, 100% { transform: translateY(0px); filter: drop-shadow(0 0 40px rgba(251,191,36,0.4)) drop-shadow(0 0 80px rgba(251,191,36,0.2)); }
          50%       { transform: translateY(-10px); filter: drop-shadow(0 0 60px rgba(251,191,36,0.6)) drop-shadow(0 0 100px rgba(251,191,36,0.3)); }
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
