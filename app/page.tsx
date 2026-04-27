import { Explore Now } from 'lucide-react'
import HomeTabLayout from '@/components/HomeTabLayout'
import { serials } from '@/data/serials'
import { movies } from '@/data/movies'
import { albums } from '@/data/albums'

export default function HomePage() {
  return (
    <div className="overflow-x-hidden">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center pt-8 pb-5 px-4 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full bg-gold-500/6 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-48 h-48 rounded-full bg-crimson-600/6 blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center max-w-xl mx-auto">
          <h1 className="text-3xl sm:text-5xl font-black leading-none mb-4">
            <span className="text-gradient">நம்ம</span>
            <span className="text-white"> Tamil</span>
            <span className="text-gold-500">.live</span>
          </h1>

          {/* Search bar */}
          <form action="/search" className="flex items-center gap-2 max-w-sm mx-auto">
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
              Search
            </button>
          </form>
        </div>
      </section>

      {/* ── Ticker ───────────────────────────────────────────────────── */}
      <div className="border-y border-white/5 bg-dark-800/40 py-1.5 overflow-hidden">
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

    </div>
  )
}
