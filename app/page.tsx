import HomeTabLayout from '@/components/HomeTabLayout'
import TamilMediaNews from '@/components/TamilMediaNews'
import VisitorCounter from '@/components/VisitorCounter'
import CricketWidget from '@/components/CricketWidget'
import AdUnit from '@/components/AdUnit'

export default function HomePage() {
  return (
    <div className="overflow-x-hidden">

      {/* ══ TOP BAR — identity + live stats ════════════════════════════════ */}
      <div className="border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full"
              style={{
                background: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.25)',
                color: '#f87171',
              }}
            >
              <span
                style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: '#ef4444',
                  boxShadow: '0 0 0 0 rgba(239,68,68,0.7)',
                  animation: 'ping 1.5s ease-in-out infinite',
                  display: 'inline-block',
                }}
              />
              Live
            </span>
            <h1
              className="font-black tracking-tight hidden sm:block"
              style={{
                fontSize: 'clamp(0.85rem, 2vw, 1rem)',
                background: 'linear-gradient(135deg, #fbbf24, #ef4444)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Tamil News · சமீபத்திய செய்திகள்
            </h1>
          </div>
          <VisitorCounter />
        </div>
      </div>

      {/* ══ MAIN — 3-col editorial grid (news left | news right | sidebar) ══ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">

          {/* ── LEFT: News feed (full width on mobile, 2/3 on desktop) ── */}
          <div className="min-w-0">
            <TamilMediaNews skipFirst={0} />
          </div>

          {/* ── RIGHT: Sidebar widgets ── */}
          <div className="flex flex-col gap-5 lg:sticky lg:top-[72px]">

            {/* Cricket / IPL live widget */}
            <div
              style={{
                borderRadius: 16,
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.07)',
                background: 'rgba(255,255,255,0.025)',
              }}
            >
              <div
                style={{
                  padding: '10px 14px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 800, color: '#4ade80', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  🏏 IPL Live
                </span>
              </div>
              <CricketWidget compact />
            </div>

            {/* Ad unit */}
            <AdUnit size="square" />
          </div>
        </div>
      </div>

      {/* ══ DIVIDER — Entertainment section ════════════════════════════════ */}
      <div className="border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-3">
            <span
              className="w-0.5 h-5 rounded-full shrink-0"
              style={{ background: 'linear-gradient(to bottom, #fbbf24, #ef4444)' }}
            />
            <h2
              className="font-extrabold text-base tracking-tight"
              style={{ color: 'rgba(255,255,255,0.7)' }}
            >
              Tamil Entertainment
            </h2>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.25)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Movies · Serials · Albums · OTT
            </span>
          </div>
        </div>
      </div>

      {/* ══ ENTERTAINMENT TABS ══════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <HomeTabLayout />
      </div>

      {/* ══ FOOTER AD ═══════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <AdUnit size="banner" />
      </div>

    </div>
  )
}
