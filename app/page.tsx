import { Search } from 'lucide-react'
import HomeTabLayout from '@/components/HomeTabLayout'
import AdUnit from '@/components/AdUnit'
import { serials } from '@/data/serials'
import { movies } from '@/data/movies'
import { albums } from '@/data/albums'

const STATS = [
  { label: 'Movies',  value: '2000+' },
  { label: 'Serials', value: '500+'  },
  { label: 'Albums',  value: '300+'  },
  { label: 'IPL',     value: '🏏'    },
]

export default function HomePage() {
  return (
    <div className="overflow-x-hidden">

      {/* ── Compact Hero ─────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center pt-10 pb-6 px-4 overflow-hidden">
        {/* Subtle accent orbs */}
        <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(220,38,38,0.07)' }} />
        <div className="absolute bottom-0 right-1/4 w-48 h-48 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(245,158,11,0.06)' }} />

        <div className="relative z-10 text-center max-w-2xl mx-auto">
          {/* Tamil tagline */}
          <p className="text-[11px] text-white/30 font-medium tracking-[0.2em] uppercase mb-3">
            தமிழ் பொழுதுபோக்கு உலகம்
          </p>

          <h1 className="text-3xl sm:text-5xl font-black leading-none mb-3">
            <span className="text-gradient">நம்ம</span>
            <span className="text-white"> Tamil</span>
            <span className="text-gold-500">.live</span>
          </h1>

          {/* Search bar */}
          <form action="/search" className="flex items-center gap-2 max-w-sm mx-auto mt-4 mb-5">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                name="q"
                type="text"
                placeholder="Movies, serials, actors…"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl glass border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-gold-500/50 bg-transparent transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-2xl bg-gold-500 text-dark-900 font-bold text-sm hover:bg-gold-400 transition-all flex-shrink-0"
            >
              Start Watching
            </button>
          </form>

          {/* Stats pills */}
          <div className="flex justify-center gap-2">
            {STATS.map(({ label, value }) => (
              <div key={label} className="flex items-center gap-1.5 px-3 py-1 rounded-full glass border border-white/5">
                <span className="text-sm font-black text-gold-400 leading-none">{value}</span>
                <span className="text-[10px] text-white/30">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Ticker ───────────────────────────────────────────────────── */}
      <div className="border-y border-white/5 py-1.5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="ticker-inner">
          {([...movies.slice(0, 8), ...serials.slice(0, 4), ...movies.slice(0, 8), ...serials.slice(0, 4)] as Array<{ id: string; title: string }>).map((item, i) => (
            <span key={i} className="px-5 text-[11px] text-slate-400 whitespace-nowrap">
              <span className="text-gold-500 mr-1.5">•</span>
              {item.title}
            </span>
          ))}
        </div>
      </div>

      {/* ── Tabbed Content ───────────────────────────────────────────── */}
      <HomeTabLayout movies={movies} serials={serials} albums={albums} />

      {/* ── AdSense ──────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <AdUnit format="horizontal" className="min-h-[90px]" />
      </div>
    </div>
  )
}
