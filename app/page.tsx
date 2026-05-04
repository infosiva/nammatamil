import HomeTabLayout from '@/components/HomeTabLayout'
import AdUnit from '@/components/AdUnit'
import ElectionResultsLive from '@/components/ElectionResultsLive'
import ConstituencyLiveBoard from '@/components/ConstituencyLiveBoard'
import ElectionAnimatedStats from '@/components/ElectionAnimatedStats'

export default function HomePage() {
  return (
    <div className="overflow-x-hidden">

      {/* ══ ELECTION HERO — full width, party tally compact at top ══════════════ */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(251,191,36,0.04) 0%, transparent 100%)',
        borderBottom: '1px solid rgba(251,191,36,0.10)',
        paddingBottom: 0,
      }}>
        {/* ── Headline ticker ── */}
        <div style={{
          background: 'rgba(239,68,68,0.9)',
          padding: '6px 0',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          gap: 24,
        }}>
          <span style={{
            whiteSpace: 'nowrap',
            flexShrink: 0,
            padding: '0 20px',
            fontSize: 11,
            fontWeight: 900,
            color: 'white',
            letterSpacing: '0.12em',
            borderRight: '1px solid rgba(255,255,255,0.3)',
          }}>
            🔴 LIVE
          </span>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{
              display: 'flex',
              gap: 60,
              animation: 'ticker 30s linear infinite',
              whiteSpace: 'nowrap',
            }}>
              {[
                'Tamil Nadu Assembly Election 2026 — Counting Day',
                'May 4, 2026 · Results being declared across 234 constituencies',
                'TVK vs DMK vs AIADMK — Who will form the government?',
                'Majority mark: 118 seats · 234 total seats',
                'Live constituency-by-constituency updates below ↓',
              ].map((t, i) => (
                <span key={i} style={{ fontSize: 11, color: 'white', fontWeight: 700, opacity: 0.9 }}>{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Party tally strip — compact horizontal ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <ElectionResultsLive compact />
        </div>
      </div>

      {/* ══ MAIN CONTENT ════════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ── Animated stats: 3D tally table + vote race ── */}
        <div style={{ marginBottom: 24 }}>
          <ElectionAnimatedStats />
        </div>

        {/* ── Full-width constituency board ── */}
        <ConstituencyLiveBoard />

        {/* ── Ad unit between election and content ── */}
        <div style={{ marginTop: 32, marginBottom: 32 }}>
          <AdUnit format="horizontal" className="min-h-[90px]" />
        </div>

        {/* ── Entertainment content below ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
            paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div style={{
              width: 3, height: 20, borderRadius: 99,
              background: 'linear-gradient(180deg, #fbbf24, #dc2626)',
            }} />
            <span style={{ fontWeight: 800, fontSize: 16, color: 'rgba(255,255,255,0.75)' }}>
              Tamil Entertainment
            </span>
          </div>
          <HomeTabLayout />
        </div>

      </div>

      {/* ── Bottom AdSense ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <AdUnit format="horizontal" className="min-h-[90px]" />
      </div>

      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
