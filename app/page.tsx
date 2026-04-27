import Link from 'next/link'
import { Play, Film, Search } from 'lucide-react'
import HomeTabLayout from '@/components/HomeTabLayout'
import AdUnit from '@/components/AdUnit'
import { serials } from '@/data/serials'
import { movies } from '@/data/movies'
import { albums } from '@/data/albums'

const STATS = [
  { label: 'Tamil Movies', value: '2000+' },
  { label: 'Serials', value: '500+' },
  { label: 'Music Albums', value: '300+' },
  { label: 'IPL 2025', value: '🏏 Live' },
]

export default function HomePage() {
  return (
    <div className="overflow-x-hidden">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="hero-bg hero-particles relative flex items-center justify-center overflow-hidden py-16 min-h-[55vh]">
        {/* Animated orbs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-gold-500/8 blur-3xl animate-float pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-crimson-600/8 blur-3xl animate-float pointer-events-none" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-1/2 w-56 h-56 rounded-full bg-violet-600/10 blur-3xl animate-float pointer-events-none" style={{ animationDelay: '1.5s' }} />

<div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          {/* Tamil badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-gold border border-gold-500/20 text-gold-400 text-sm font-medium mb-4">
            <span>🎬</span>
            தமிழ் பொழுதுபோக்கு உலகம்
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black leading-none mb-4">
            <span className="text-gradient">நம்ம</span>
            <span className="text-white"> Tamil</span>
            <span className="text-gold-500">.live</span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto mb-6 leading-relaxed">
            Movies · Serials · OTT · IPL Cricket · Tamil Videos — all in one place
          </p>

          {/* Hero search */}
          <form action="/search" className="flex items-center gap-2 max-w-md mx-auto mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                name="q"
                type="text"
                placeholder="Search movies, serials, actors..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl glass border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-gold-500/50 bg-transparent transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-3 rounded-2xl bg-gold-500 text-dark-900 font-bold text-sm hover:bg-gold-400 transition-all flex-shrink-0"
            >
              Search
            </button>
          </form>

          {/* Stats strip */}
          <div className="flex flex-wrap justify-center gap-3">
            {STATS.map(({ label, value }) => (
              <div key={label} className="glass rounded-xl px-4 py-2 flex flex-col items-center border border-white/5">
                <span className="text-lg font-black text-gradient leading-none">{value}</span>
                <span className="text-muted text-[10px] mt-0.5">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-dark-900 to-transparent pointer-events-none" />
      </section>

      {/* ── Ticker ────────────────────────────────────────────────────── */}
      <div className="border-y border-subtle bg-dark-800/50 py-2 overflow-hidden">
        <div className="ticker-inner">
          {([...movies.slice(0, 8), ...serials.slice(0, 4), ...movies.slice(0, 8), ...serials.slice(0, 4)] as Array<{ id: string; title: string }>).map((item, i) => (
            <span key={i} className="px-6 text-xs text-slate-400 whitespace-nowrap">
              <span className="text-gold-500 mr-2">•</span>
              {item.title}
            </span>
          ))}
        </div>
      </div>

      {/* ── Tabbed Content ─────────────────────────────────────────────── */}
      <HomeTabLayout movies={movies} serials={serials} albums={albums} />

      {/* ── Bottom AdSense ───────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <AdUnit format="horizontal" className="min-h-[90px]" />
      </div>
    </div>
  )
}
