import HomeTabLayout from '@/components/HomeTabLayout'
import TamilMediaNews from '@/components/TamilMediaNews'
import VisitorCounter from '@/components/VisitorCounter'
import TVKHeroBg from '@/components/TVKHeroBg'
import LiveNowPanel from '@/components/LiveNowPanel'
import CricketWidget from '@/components/CricketWidget'

export default function HomePage() {
  return (
    <div className="overflow-x-hidden">

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <div style={{ position: 'relative', borderBottom: '1px solid rgba(245,158,11,0.08)', minHeight: 280 }}>
        <TVKHeroBg />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          style={{ position: 'relative', zIndex: 1, paddingTop: 24, paddingBottom: 28 }}>

          {/* Site identity */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{
                fontSize: 'clamp(1.6rem,5vw,2.6rem)', fontWeight: 900, lineHeight: 1,
                background: 'linear-gradient(135deg, #f59e0b 0%, #ffffff 55%, #f59e0b 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                letterSpacing: '-0.02em',
              }}>
                NammaTamil
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.30)', marginTop: 4, fontWeight: 600, letterSpacing: '0.06em' }}>
                TAMIL · தமிழ் · ENTERTAINMENT &amp; POLITICS
              </div>
            </div>
            <VisitorCounter />
          </div>

          {/* ── Hero: 2-col on md+, stacked on mobile ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,340px)', gap: 12, alignItems: 'start' }}
            className="hero-grid">
            {/* Left: Live headlines */}
            <LiveNowPanel />

            {/* Right: IPL standings */}
            <div style={{
              borderRadius: 12,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              overflow: 'hidden',
              backdropFilter: 'blur(12px)',
            }}>
              <CricketWidget compact />
            </div>
          </div>

        </div>
      </div>

      {/* ══ MAIN CONTENT ══════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Tamil Media News — skip top 5 already shown in hero LiveNowPanel */}
        <div style={{ marginBottom: 32 }}>
          <TamilMediaNews skipFirst={5} />
        </div>

        {/* Entertainment tabs */}
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
