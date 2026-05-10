'use client'
/* RoamPlan — Warm travel-magazine background: sunset gradients + floating clouds + map dots */
export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden>
      {/* Deep ocean → sunset amber base gradient */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(160deg, #0c1a2e 0%, #0f2540 25%, #1a1a0a 55%, #2d1608 80%, #3d1c08 100%)',
      }} />

      {/* Sunset glow upper-right */}
      <div style={{
        position: 'absolute', top: '-10%', right: '-5%',
        width: '700px', height: '600px',
        background: 'radial-gradient(ellipse, rgba(251,146,60,0.18) 0%, rgba(239,68,68,0.10) 40%, transparent 70%)',
        filter: 'blur(80px)',
      }} />

      {/* Deep ocean teal lower-left */}
      <div style={{
        position: 'absolute', bottom: '-5%', left: '-5%',
        width: '600px', height: '500px',
        background: 'radial-gradient(ellipse, rgba(20,184,166,0.14) 0%, rgba(6,182,212,0.08) 50%, transparent 70%)',
        filter: 'blur(90px)',
      }} />

      {/* Coral mid-glow */}
      <div style={{
        position: 'absolute', top: '40%', left: '40%',
        width: '400px', height: '400px',
        background: 'radial-gradient(ellipse, rgba(249,115,22,0.10) 0%, transparent 70%)',
        filter: 'blur(70px)',
        animation: 'ambientPulse 8s ease-in-out infinite',
      }} />

      {/* Animated flight arcs — warm amber trails */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="warmTrail1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0" />
            <stop offset="50%" stopColor="#fb923c" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="warmTrail2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#14b8a6" stopOpacity="0" />
            <stop offset="50%" stopColor="#2dd4bf" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="warmTrail3" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0" />
            <stop offset="50%" stopColor="#fcd34d" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Arc 1 — mid sweep */}
        <path d="M -100 320 Q 450 60 1000 280" stroke="url(#warmTrail1)" strokeWidth="1.5" fill="none" strokeDasharray="8 14" opacity="0.6">
          <animate attributeName="stroke-dashoffset" from="0" to="-220" dur="9s" repeatCount="indefinite" />
        </path>
        {/* Arc 2 — lower sweep */}
        <path d="M -60 520 Q 520 240 1100 440" stroke="url(#warmTrail2)" strokeWidth="1" fill="none" strokeDasharray="6 16" opacity="0.4">
          <animate attributeName="stroke-dashoffset" from="0" to="-220" dur="13s" repeatCount="indefinite" />
        </path>
        {/* Arc 3 — upper sweep */}
        <path d="M 180 -10 Q 620 160 1050 90" stroke="url(#warmTrail3)" strokeWidth="1" fill="none" strokeDasharray="4 18" opacity="0.28">
          <animate attributeName="stroke-dashoffset" from="0" to="-220" dur="17s" repeatCount="indefinite" />
        </path>
      </svg>

      {/* Floating clouds */}
      {[
        { top: '12%', left: '-8%', w: 280, op: 0.07, dur: '28s', delay: '0s' },
        { top: '28%', left: '60%', w: 220, op: 0.06, dur: '35s', delay: '-8s' },
        { top: '55%', left: '20%', w: 180, op: 0.05, dur: '42s', delay: '-14s' },
        { top: '70%', left: '75%', w: 160, op: 0.04, dur: '30s', delay: '-5s' },
      ].map((c, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: c.top, left: c.left,
          width: c.w, height: c.w * 0.45,
          opacity: c.op,
          background: 'radial-gradient(ellipse 60% 50% at 30% 50%, rgba(255,200,120,0.9), rgba(255,160,80,0.5) 50%, transparent)',
          borderRadius: '50%',
          filter: 'blur(18px)',
          animation: `cloudDrift ${c.dur} linear infinite`,
          animationDelay: c.delay,
        }} />
      ))}

      {/* Map dot grid — warm amber */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle, rgba(251,146,60,0.20) 1px, transparent 1px)',
        backgroundSize: '44px 44px',
        maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 75%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 75%)',
        opacity: 0.28,
      }} />

      {/* Floating location pins */}
      {[
        { x: '14%',  y: '22%', delay: '0s',   size: 18, op: 0.45 },
        { x: '70%',  y: '16%', delay: '1.8s', size: 14, op: 0.35 },
        { x: '42%',  y: '58%', delay: '3.2s', size: 12, op: 0.28 },
        { x: '82%',  y: '48%', delay: '2.1s', size: 16, op: 0.40 },
        { x: '26%',  y: '72%', delay: '4.5s', size: 11, op: 0.22 },
      ].map((pin, i) => (
        <div key={i} style={{
          position: 'absolute', left: pin.x, top: pin.y,
          opacity: pin.op, fontSize: pin.size,
          animation: `float ${4 + i * 0.8}s ease-in-out infinite`,
          animationDelay: pin.delay,
        }}>📍</div>
      ))}

      <style>{`
        @keyframes cloudDrift {
          from { transform: translateX(0px) }
          to   { transform: translateX(120vw) }
        }
        @keyframes ambientPulse {
          0%, 100% { opacity: 0.7; transform: scale(1) }
          50%       { opacity: 1;   transform: scale(1.15) }
        }
      `}</style>
    </div>
  )
}
