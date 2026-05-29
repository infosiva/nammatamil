import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Tamil Nadu Temple Tour Itinerary | AI Planner — NammaTamil',
  description: 'Plan your Tamil Nadu temple tour with AI. Meenakshi Amman, Brihadeeswara, Ranganathaswamy and more — day-by-day itineraries rooted in local knowledge. Free planner.',
}

const TEMPLES = [
  { name: 'Madurai', temple: 'Meenakshi Amman Temple' },
  { name: 'Thanjavur', temple: 'Brihadeeswara Temple' },
  { name: 'Srirangam', temple: 'Ranganathaswamy Temple' },
  { name: 'Rameswaram', temple: 'Ramanathaswamy Temple' },
  { name: 'Chidambaram', temple: 'Nataraja Temple' },
  { name: 'Tiruvannamalai', temple: 'Arunachaleswara Temple' },
]

export default function TempleTourPage() {
  return (
    <main className="min-h-screen relative z-10 px-6 py-20 max-w-3xl mx-auto">
      <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight"
        style={{ fontFamily: "'Georgia', serif" }}>
        Tamil Nadu Temple Tour Itinerary
      </h1>
      <p className="text-white/55 text-lg mb-6 leading-relaxed">
        Tamil Nadu is home to the world&apos;s greatest concentration of living Dravidian temples — towering
        gopurams, granite corridors older than most nations, and rituals performed unbroken for over a
        millennium. A proper temple circuit is not a list of GPS pins. It is a journey through time, theology
        and architecture that rewards slow, curious travel.
      </p>
      <p className="text-white/45 text-base mb-10 leading-relaxed">
        Our AI planner builds temple tour itineraries around local festival calendars, opening hours,
        puja timings and the best complementary experiences nearby — not just which temple to visit, but
        when to arrive, what to notice, and where to eat afterwards. Generate a free day-by-day plan
        for any of the circuits below.
      </p>

      <div className="flex flex-wrap gap-3 mb-10">
        {TEMPLES.map(t => (
          <Link key={t.name} href={`/?dest=${encodeURIComponent(t.name)}`}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all hover:scale-[1.03]"
            style={{ background: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.25)', color: '#fb923c' }}>
            {t.name}
            <span className="text-[10px] text-orange-300/60 font-normal truncate max-w-[110px]">{t.temple}</span>
          </Link>
        ))}
      </div>

      <Link href="/"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-[1.02]"
        style={{ background: 'linear-gradient(135deg, #f97316, #d97706)', boxShadow: '0 8px 30px rgba(249,115,22,0.35)' }}>
        Build my temple tour itinerary →
      </Link>
    </main>
  )
}
