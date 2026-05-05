import HomeTabLayout from '@/components/HomeTabLayout'
import TamilMediaNews from '@/components/TamilMediaNews'
import VisitorCounter from '@/components/VisitorCounter'
import TVKHeroBg from '@/components/TVKHeroBg'
import ElectionMiniPanel from '@/components/ElectionMiniPanel'

export default function HomePage() {
  return (
    <div className="overflow-x-hidden">

      {/* ══ TVK HERO ─ Cinematic Vijay background, always present ══════════════ */}
      <div style={{ position: 'relative', borderBottom: '1px solid rgba(251,191,36,0.08)', minHeight: 320 }}>
        <TVKHeroBg />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ position: 'relative', zIndex: 1, paddingTop: 24, paddingBottom: 28 }}>

          {/* Site identity row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{
                fontSize: 'clamp(1.6rem,5vw,2.6rem)', fontWeight: 900, lineHeight: 1,
                background: 'linear-gradient(135deg, #fbbf24 0%, #ffffff 60%, #fbbf24 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                letterSpacing: '-0.02em',
              }}>
                NammaTamil
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 3, fontWeight: 600 }}>
                Tamil · தமிழ் · Entertainment &amp; Politics
              </div>
            </div>
            <VisitorCounter />
          </div>

          {/* ── Election 2026 Mini Panel ── */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 3, height: 14, borderRadius: 99, background: 'linear-gradient(180deg, #ef4444, #fbbf24)' }} />
              <span style={{ fontWeight: 800, fontSize: 12, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                TN Election 2026
              </span>
            </div>
            <ElectionMiniPanel />
          </div>

        </div>
      </div>

      {/* ══ ENTERTAINMENT CONTENT ══════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        <div style={{ marginBottom: 28 }}>
          <TamilMediaNews />
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
            paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div style={{ width: 3, height: 20, borderRadius: 99, background: 'linear-gradient(180deg, #fbbf24, #dc2626)' }} />
            <span style={{ fontWeight: 800, fontSize: 16, color: 'rgba(255,255,255,0.75)' }}>Tamil Entertainment</span>
          </div>
          <HomeTabLayout />
        </div>

      </div>

    </div>
  )
}
