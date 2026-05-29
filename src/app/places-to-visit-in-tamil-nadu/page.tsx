import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Best Places to Visit in Tamil Nadu | Local Guide — NammaTamil',
  description: 'Discover the best places to visit in Tamil Nadu — from Meenakshi temple in Madurai to misty Ooty hills. AI-curated local guide for temples, hill stations and hidden villages.',
}

const PLACES = [
  { name: 'Madurai', tag: 'Temple City' },
  { name: 'Ooty', tag: 'Hill Station' },
  { name: 'Rameswaram', tag: 'Sacred Pilgrimage' },
  { name: 'Kanyakumari', tag: 'Southernmost Tip' },
  { name: 'Kodaikanal', tag: 'Offbeat Hills' },
  { name: 'Mahabalipuram', tag: 'Shore Temples' },
]

export default function PlacesPage() {
  return (
    <main className="min-h-screen relative z-10 px-6 py-20 max-w-3xl mx-auto">
      <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight"
        style={{ fontFamily: "'Georgia', serif" }}>
        Best Places to Visit in Tamil Nadu
      </h1>
      <p className="text-white/55 text-lg mb-6 leading-relaxed">
        Tamil Nadu is one of India&apos;s most culturally rich states — 2,000 years of Dravidian civilisation
        packed into coastlines, ancient temple towns and mist-covered hill stations. This local guide cuts
        through the package-tour noise and tells you what actually matters, district by district.
      </p>
      <p className="text-white/45 text-base mb-10 leading-relaxed">
        Unlike booking portals that filter by &quot;star rating&quot;, this guide is built around cultural seasons,
        local knowledge, and AI-generated day-by-day itineraries that match your pace — not a bus schedule.
        Whether you&apos;re a first-time visitor or returning for a deeper dive, Tamil Nadu always has another
        layer to reveal.
      </p>

      <div className="flex flex-wrap gap-3 mb-10">
        {PLACES.map(p => (
          <Link key={p.name} href={`/?dest=${encodeURIComponent(p.name)}`}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all hover:scale-[1.03]"
            style={{ background: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.25)', color: '#fb923c' }}>
            {p.name}
            <span className="text-[10px] text-orange-300/60 font-normal">{p.tag}</span>
          </Link>
        ))}
      </div>

      <Link href="/"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-[1.02]"
        style={{ background: 'linear-gradient(135deg, #f97316, #d97706)', boxShadow: '0 8px 30px rgba(249,115,22,0.35)' }}>
        Plan my Tamil Nadu trip free →
      </Link>
    </main>
  )
}
