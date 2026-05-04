import HomeTabLayout from '@/components/HomeTabLayout'
import AdUnit from '@/components/AdUnit'
import ElectionAnimatedStats from '@/components/ElectionAnimatedStats'
import ConstituencyLiveBoard from '@/components/ConstituencyLiveBoard'
import NammaTVKVideos from '@/components/NammaTVKVideos'
import VisitorCounter from '@/components/VisitorCounter'

export default function HomePage() {
  return (
    <div className="overflow-x-hidden">

      {/* ══ ELECTION DASHBOARD ══════════════════════════════════════════════════ */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(239,68,68,0.06) 0%, transparent 60%)',
        borderBottom: '1px solid rgba(239,68,68,0.08)',
      }}>
        {/* ── Live ticker ── */}
        <div style={{
          background: 'rgba(239,68,68,0.88)',
          padding: '5px 0',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          gap: 24,
        }}>
          <span style={{
            whiteSpace: 'nowrap',
            flexShrink: 0,
            padding: '0 16px',
            fontSize: 10,
            fontWeight: 900,
            color: 'white',
            letterSpacing: '0.12em',
            borderRight: '1px solid rgba(255,255,255,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'white', display: 'inline-block', animation: 'dotPulse 1.5s infinite' }} />
            LIVE
          </span>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{
              display: 'flex',
              gap: 60,
              animation: 'ticker 32s linear infinite',
              whiteSpace: 'nowrap',
            }}>
              {[
                'Tamil Nadu Assembly Election 2026 — Counting Day',
                'May 4, 2026 · Results declared across 234 constituencies',
                'TVK vs DMK vs AIADMK — Who will form the government?',
                'Majority mark: 118 seats · 234 total seats',
                'Live constituency-by-constituency updates below ↓',
                // Duplicate for seamless loop
                'Tamil Nadu Assembly Election 2026 — Counting Day',
                'May 4, 2026 · Results declared across 234 constituencies',
                'TVK vs DMK vs AIADMK — Who will form the government?',
                'Majority mark: 118 seats · 234 total seats',
                'Live constituency-by-constituency updates below ↓',
              ].map((t, i) => (
                <span key={i} style={{ fontSize: 10, color: 'white', fontWeight: 700, opacity: 0.95 }}>{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Dashboard header ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-0">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 900, fontSize: 18, color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.01em' }}>
                TN Election 2026 — Live Results
              </span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                Tamil Nadu Assembly Elections · 234 Constituencies · May 4, 2026
              </span>
            </div>
            <VisitorCounter />
          </div>

          {/* ── Main stats dashboard ── */}
          <ElectionAnimatedStats />

          {/* ── Full constituency board ── */}
          <div style={{ marginTop: 20, marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 3, height: 18, borderRadius: 99, background: 'linear-gradient(180deg, #ef4444, #fbbf24)' }} />
              <span style={{ fontWeight: 800, fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>Constituency Results</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>All 234 seats</span>
            </div>
            <ConstituencyLiveBoard />
          </div>
        </div>
      </div>

      {/* ══ ENTERTAINMENT CONTENT ══════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ── Ad between election and content ── */}
        <div style={{ marginBottom: 28 }}>
          <AdUnit format="horizontal" className="min-h-[90px]" />
        </div>

        {/* ── NammaTVK Latest Videos ── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
            paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div style={{
              width: 3, height: 20, borderRadius: 99,
              background: 'linear-gradient(180deg, #fbbf24, #ff0000)',
            }} />
            <span style={{ fontWeight: 800, fontSize: 16, color: 'rgba(255,255,255,0.75)' }}>
              NammaTVK — Latest Videos
            </span>
          </div>
          <NammaTVKVideos />
        </div>

        {/* ── Entertainment section ── */}
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
        @keyframes dotPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(1.4); }
        }
      `}</style>
    </div>
  )
}
