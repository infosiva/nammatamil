import HomeTabLayout from '@/components/HomeTabLayout'
import TamilMediaNews from '@/components/TamilMediaNews'
import VisitorCounter from '@/components/VisitorCounter'
import TVKHeroBg from '@/components/TVKHeroBg'
import LiveNowPanel from '@/components/LiveNowPanel'
import CricketWidget from '@/components/CricketWidget'
import TVKWidget from '@/components/TVKWidget'
import AdUnit from '@/components/AdUnit'

export default function HomePage() {
  return (
    <div className="overflow-x-hidden">

      {/* ══ HERO ════════════════════════════════════════════════════════════ */}
      <section className="relative border-b border-white/[0.06]">
        <TVKHeroBg />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8">

          {/* Identity row */}
          <div className="flex items-end justify-between mb-6">
            <div>
              <h1 className="text-gradient font-black tracking-tight"
                style={{ fontSize: 'clamp(1.8rem,5vw,2.8rem)', lineHeight: 1 }}>
                NammaTamil
              </h1>
              <p className="text-white/30 text-[11px] font-semibold tracking-widest mt-1.5 uppercase">
                Tamil · தமிழ் · Entertainment &amp; Politics
              </p>
            </div>
            <VisitorCounter />
          </div>

          {/* 2-col hero grid */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-3 items-start hero-grid">
            <LiveNowPanel />
            <div className="glass rounded-xl overflow-hidden">
              <CricketWidget compact />
            </div>
          </div>
        </div>
      </section>

      {/* ══ SINGLE NON-INTRUSIVE AD — below hero, above content ════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5">
        <AdUnit size="banner" />
      </div>

      {/* ══ MAIN CONTENT ════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">

        {/* Tamil Media News */}
        <TamilMediaNews skipFirst={5} />

        {/* TV Schedule widget — contextual, only on home */}
        <TVKWidget />

        {/* Entertainment tabs */}
        <div>
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/[0.07]">
            <span className="w-0.5 h-5 rounded-full bg-gradient-to-b from-amber-400 to-red-600 shrink-0" />
            <h2 className="font-extrabold text-base text-white/75 tracking-tight">Tamil Entertainment</h2>
          </div>
          <HomeTabLayout />
        </div>

      </div>

    </div>
  )
}
