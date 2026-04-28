import { Search } from 'lucide-react'
import HomeTabLayout from '@/components/HomeTabLayout'
import AdUnit from '@/components/AdUnit'
import TamilDashboard from '@/components/TamilDashboard'
import { serials } from '@/data/serials'
import { movies } from '@/data/movies'
import { albums } from '@/data/albums'
import { actors } from '@/data/actors'

export default function HomePage() {
  const tamilMovies  = movies.filter(m => m.language === 'Tamil').length
  const dubbedMovies = movies.filter(m => m.language === 'Tamil Dubbed').length
  const ongoingSerials = serials.filter(s => s.status === 'Ongoing').length

  const STATS = [
    { label: 'Movies',   value: String(tamilMovies + dubbedMovies) },
    { label: 'Serials',  value: String(serials.length)             },
    { label: 'Albums',   value: String(albums.length)              },
    { label: 'Artists',  value: String(actors.length)              },
    { label: 'On Air',   value: String(ongoingSerials)             },
  ]

  return (
    <div className="overflow-x-hidden">

      {/* ── Hero strip ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">

          {/* Left: live stats */}
          <div className="flex-shrink-0">
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-1.5"
              style={{ color: 'rgba(255,255,255,0.2)' }}>
              தமிழ் பொழுதுபோக்கு உலகம்
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {STATS.map(({ label, value }) => (
                <span key={label} className="flex items-center gap-1 text-[11px]"
                  style={{ color: 'rgba(255,255,255,0.3)' }}>
                  <span className="font-black text-sm" style={{ color: '#f59e0b' }}>{value}</span>
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Right: search bar */}
          <form action="/search" className="flex items-center gap-2 w-full sm:max-w-sm sm:ml-auto">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                style={{ color: 'rgba(255,255,255,0.25)' }} />
              <input
                name="q"
                type="text"
                placeholder="Search movies, serials, artists…"
                className="w-full pl-9 pr-4 py-2 rounded-xl text-sm text-white outline-none transition-all focus:ring-1 focus:ring-amber-500/40"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  color: 'white',
                }}
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-sm font-bold flex-shrink-0 transition-all hover:brightness-110"
              style={{ background: '#f59e0b', color: '#000' }}
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* ── Tabbed Content ───────────────────────────────────────────── */}
      <HomeTabLayout movies={movies} serials={serials} albums={albums} />

      {/* ── Tamil Dashboard: News + Weather ─────────────────────────── */}
      <div className="border-t border-white/5">
        <TamilDashboard />
      </div>

      {/* ── AdSense ──────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <AdUnit format="horizontal" className="min-h-[90px]" />
      </div>
    </div>
  )
}
