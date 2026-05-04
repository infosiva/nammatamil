'use client'

/**
 * TVKHeroBg — CSS-only cinematic background for the election dashboard.
 * Gold star particles, radial glows, Vijay's ⭐ TVK brand aesthetic.
 * No images needed — pure CSS art.
 */

export default function TVKHeroBg() {
  return (
    <>
      {/* Fixed background layer */}
      <div style={{
        position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0,
      }}>

        {/* Deep cinematic gradient base */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `
            radial-gradient(ellipse 80% 50% at 50% -10%, rgba(251,191,36,0.18) 0%, transparent 60%),
            radial-gradient(ellipse 40% 30% at 80% 20%, rgba(251,191,36,0.08) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 20% 30%, rgba(220,38,38,0.06) 0%, transparent 50%),
            linear-gradient(180deg, #0d0200 0%, #07010f 40%, #030008 100%)
          `,
        }} />

        {/* Gold spotlight from top centre — like a stage light on Vijay */}
        <div style={{
          position: 'absolute', top: -200, left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 600,
          background: 'radial-gradient(ellipse, rgba(251,191,36,0.22) 0%, rgba(251,191,36,0.05) 40%, transparent 70%)',
          borderRadius: '50%',
          animation: 'heroPulse 4s ease-in-out infinite',
        }} />

        {/* Secondary warm glow right */}
        <div style={{
          position: 'absolute', top: 80, right: -100,
          width: 400, height: 400,
          background: 'radial-gradient(ellipse, rgba(251,140,36,0.1) 0%, transparent 70%)',
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

        {/* Diagonal light streaks — cinematic effect */}
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

        {/* Bottom fade to page background */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 120,
          background: 'linear-gradient(0deg, #07010f 0%, transparent 100%)',
        }} />
      </div>

      <style>{`
        @keyframes heroPulse {
          0%, 100% { opacity: 0.7; transform: translateX(-50%) scale(1); }
          50%       { opacity: 1;   transform: translateX(-50%) scale(1.15); }
        }
        @keyframes heroFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg);   opacity: var(--op, 0.4); }
          33%       { transform: translateY(-12px) rotate(15deg); opacity: calc(var(--op, 0.4) * 1.4); }
          66%       { transform: translateY(6px) rotate(-10deg);  opacity: calc(var(--op, 0.4) * 0.7); }
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
