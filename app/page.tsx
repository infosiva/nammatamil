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

      {/* ── Slim Hero / Search Bar ───────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Left: tagline */}
          <div className="flex-shrink-0">
            <p className="text-[10px] text-white/30 uppercase tracking-widest">தமிழ் பொழுதுபோக்கு உலகம்</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              {STATS.map(({ label, value }) => (
                <span key={label} className="text-[10px] text-white/25">
                  <span className="text-gold-400 font-bold">{value}</span> {label}
                  <span className="mx-1 text-white/10">·</span>
                </span>
              ))}
            </div>
          </div>
          {/* Right: search */}
          <form action="/search" className="flex items-center gap-2 w-full sm:max-w-md sm:ml-auto">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              <input
                name="q"
                type="text"
                placeholder="Search movies, serials, actors…"
                className="w-full pl-9 pr-4 py-2 rounded-xl glass border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-gold-500/50 bg-transparent transition-all"
              />
            </div>
            <button type="submit" className="px-4 py-2 rounded-xl bg-gold-500 text-dark-900 font-bold text-sm hover:bg-gold-400 transition-all flex-shrink-0">
              Search
            </button>
          </form>
        </div>
      </section>

      {/* ── Tabbed Content ───────────────────────────────────────────── */}
      <HomeTabLayout movies={movies} serials={serials} albums={albums} />

      {/* ── AdSense ──────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <AdUnit format="horizontal" className="min-h-[90px]" />
      </div>
    </div>
  )
}
