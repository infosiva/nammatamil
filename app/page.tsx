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
      <div style={{ position: 'relative', borderBottom: '1px solid rgba(251,191,36,0.08)', minHeight: 280 }}>
        <TVKHeroBg />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          style={{ position: 'relative', zIndex: 1, paddingTop: 22, paddingBottom: 24 }}>

          {/* Site identity */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
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

          {/* ── Hero: LiveNow panel full-width, cricket compact below ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Live now — TVK coalition/politics headlines — full width */}
            <LiveNowPanel />

            {/* IPL standings — compact strip below */}
            <div style={{
              borderRadius: 10,
              background: 'rgba(10,2,18,0.7)',
              border: '1px solid rgba(255,255,255,0.06)',
              overflow: 'hidden',
              backdropFilter: 'blur(8px)',
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
