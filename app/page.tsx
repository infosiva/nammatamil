import HomeTabLayout from '@/components/HomeTabLayout'
import AdUnit from '@/components/AdUnit'
import ElectionAnimatedStats from '@/components/ElectionAnimatedStats'
import ConstituencyLiveBoard from '@/components/ConstituencyLiveBoard'
import NammaTVKVideos from '@/components/NammaTVKVideos'
import VisitorCounter from '@/components/VisitorCounter'
import ElectionScoreboard from '@/components/ElectionScoreboard'
import ElectionSpotlight from '@/components/ElectionSpotlight'
import ElectionReactions from '@/components/ElectionReactions'
import DistrictHeatmap from '@/components/DistrictHeatmap'
import ElectionStories from '@/components/ElectionStories'
import ConstituencySearch from '@/components/ConstituencySearch'
import FamousCandidates from '@/components/FamousCandidates'
import TVKVictoryBanner from '@/components/TVKVictoryBanner'
import TVKHeroBg from '@/components/TVKHeroBg'
import TVKDistrictSweep from '@/components/TVKDistrictSweep'
import TVKMomentumTicker from '@/components/TVKMomentumTicker'
import SeatProjection from '@/components/SeatProjection'
import ElectionNews from '@/components/ElectionNews'
import CountingProgress from '@/components/CountingProgress'
import AIElectionSummary from '@/components/AIElectionSummary'
import VoteMarginHighlights from '@/components/VoteMarginHighlights'

export default function HomePage() {
  return (
    <div className="overflow-x-hidden">

      {/* ══ ELECTION DASHBOARD ══════════════════════════════════════════════════ */}
      <div style={{ position: 'relative', borderBottom: '1px solid rgba(251,191,36,0.1)' }}>
        <TVKHeroBg />

        {/* ── Scoreboard: ticker + declared/remaining + party cards ── */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <ElectionScoreboard />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-0" style={{ position: 'relative', zIndex: 1 }}>

          {/* Visitor counter */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <VisitorCounter />
          </div>

          {/* ── Gold scrolling ticker ── */}
          <TVKMomentumTicker />

          {/* ── HERO: TVK Victory + AI tally side by side on desktop ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }} className="election-two-col">
            <TVKVictoryBanner />
            <AIElectionSummary />
          </div>

          {/* ── ROW 2: Seat projection + Counting progress ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }} className="election-two-col">
            <SeatProjection />
            <CountingProgress />
          </div>

          {/* ── Constituency Search ── */}
          <div style={{ marginBottom: 14 }}>
            <ConstituencySearch />
          </div>

          {/* ── Famous candidates ── */}
          <div style={{ marginBottom: 14 }}>
            <FamousCandidates />
          </div>

          {/* ── Vote Margins + Election News ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }} className="election-two-col">
            <VoteMarginHighlights />
            <ElectionNews />
          </div>

          {/* ── Story cards + Spotlight ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }} className="election-two-col">
            <ElectionStories />
            <ElectionSpotlight />
          </div>

          {/* ── Reactions ── */}
          <div style={{ marginBottom: 14 }}>
            <ElectionReactions />
          </div>

          {/* ── Animated stats ── */}
          <div style={{ marginBottom: 14 }}>
            <ElectionAnimatedStats />
          </div>

          {/* ── TVK district sweep + Heatmap ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }} className="election-two-col">
            <TVKDistrictSweep />
            <DistrictHeatmap />
          </div>

          {/* ── Full constituency board ── */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 3, height: 18, borderRadius: 99, background: 'linear-gradient(180deg, #ef4444, #fbbf24)' }} />
              <span style={{ fontWeight: 800, fontSize: 14, color: 'rgba(255,255,255,0.75)' }}>All Constituency Results</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>234 seats</span>
            </div>
            <ConstituencyLiveBoard />
          </div>
        </div>
      </div>

      {/* ══ ENTERTAINMENT CONTENT ══════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        <div style={{ marginBottom: 28 }}>
          <AdUnit format="horizontal" className="min-h-[90px]" />
        </div>

        <div style={{ marginBottom: 28 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
            paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div style={{ width: 3, height: 20, borderRadius: 99, background: 'linear-gradient(180deg, #fbbf24, #ff0000)' }} />
            <span style={{ fontWeight: 800, fontSize: 16, color: 'rgba(255,255,255,0.75)' }}>NammaTVK — Latest Videos</span>
          </div>
          <NammaTVKVideos />
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <AdUnit format="horizontal" className="min-h-[90px]" />
      </div>

      <style>{`
        @media (max-width: 640px) {
          .election-two-col { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
