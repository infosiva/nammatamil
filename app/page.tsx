import HeroCinematic from '@/components/HeroCinematic'
import HomeTabLayout from '@/components/HomeTabLayout'
import TrailersSection from '@/components/TrailersSection'
import AdUnit from '@/components/AdUnit'
import TamilCalendar from '@/components/TamilCalendar'
import OTTThisWeek from '@/components/OTTThisWeek'

export default function HomePage() {
  return (
    <div className="overflow-x-hidden">

      {/* ══ MAIN: two-column split — no extra headers ════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col xl:flex-row gap-4 items-start">

          {/* Left — live hero + sidebar widgets */}
          <div className="w-full xl:w-[360px] flex-shrink-0 xl:sticky xl:top-[70px] space-y-4">
            <HeroCinematic />
            <TamilCalendar />
            <OTTThisWeek />
          </div>

          {/* Right — trailers strip + tabbed content browser */}
          <div className="flex-1 min-w-0 space-y-2">
            <TrailersSection />
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
