import HeroCinematic from '@/components/HeroCinematic'
import HomeTabLayout from '@/components/HomeTabLayout'
import AdUnit from '@/components/AdUnit'
import TamilCalendar from '@/components/TamilCalendar'
import OTTThisWeek from '@/components/OTTThisWeek'
import ElectionHomeBanner from '@/components/ElectionHomeBanner'

export default function HomePage() {
  return (
    <div className="overflow-x-hidden">

      {/* ══ ELECTION BANNER — full width above everything ════════════════════ */}
      <ElectionHomeBanner />

      {/* ══ MAIN: two-column split — no extra headers ════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col xl:flex-row gap-4 items-start">

          {/* Left — live hero + sidebar widgets */}
          <div className="w-full xl:w-[360px] flex-shrink-0 xl:sticky xl:top-[70px] space-y-4">
            <HeroCinematic />
            <TamilCalendar />
            <OTTThisWeek />
          </div>

          {/* Right — tabbed content browser (Movies, Serials, Trailers, News, Cricket, Albums, OTT) */}
          <div className="flex-1 min-w-0">
            <HomeTabLayout />
          </div>

        </div>
      </div>

      {/* AdSense */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <AdUnit format="horizontal" className="min-h-[90px]" />
      </div>
    </div>
  )
}
