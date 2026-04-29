import Link from 'next/link'
import { Search, Tv2, Film, Music, Play, TrendingUp, Radio, Star, ArrowRight } from 'lucide-react'
import HomeTabLayout from '@/components/HomeTabLayout'
import AdUnit from '@/components/AdUnit'
import HeroCinematic from '@/components/HeroCinematic'
import { serials } from '@/data/serials'
import { movies } from '@/data/movies'
import { albums } from '@/data/albums'

export default function HomePage() {
  const ongoingSerials = serials.filter(s => s.status === 'Ongoing')
  const topMovies      = movies.filter(m => m.language === 'Tamil').sort((a, b) => b.rating - a.rating).slice(0, 5)
  const liveSerials    = ongoingSerials.slice(0, 6)

  return (
    <div className="overflow-x-hidden">

      {/* ── HERO SPLIT ─────────────────────────────────────────────────────── */}
      <section className="relative" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>

        {/* Ambient top glow */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[400px]" style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(248,113,113,0.12) 0%, rgba(251,191,36,0.06) 40%, transparent 70%)',
        }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-8">

          {/* Site title + search — compact row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-7">
            <div className="flex-shrink-0">
              <h1 className="font-black leading-none tracking-tighter"
                style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)' }}>
                <span className="text-gradient">நம்ம</span>
                <span className="text-white">Tamil</span>
                <span style={{ color: '#f59e0b', opacity: 0.7 }}>.live</span>
              </h1>
              <p className="text-white/30 text-xs mt-1">Movies · Serials · Albums · Live Updates</p>
            </div>

            {/* Search */}
            <form action="/search" className="flex gap-2 flex-1 max-w-md">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                  style={{ color: 'rgba(255,255,255,0.2)' }} />
                <input name="q" type="text" placeholder="Search movies, serials…"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm text-white outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
              <button type="submit"
                className="px-5 py-2.5 rounded-xl text-sm font-bold flex-shrink-0 transition-all hover:brightness-110"
                style={{ background: 'linear-gradient(135deg,#f59e0b,#f97316)', color: '#000' }}>
                Go
              </button>
            </form>
          </div>

          {/* ── Main two-column split ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

            {/* Left (3/5): Cinematic hero */}
            <div className="lg:col-span-3">
              <HeroCinematic />
            </div>

            {/* Right (2/5): Quick panels */}
            <div className="lg:col-span-2 flex flex-col gap-4">

              {/* Top Movies compact list */}
              <div className="rounded-2xl p-4 flex flex-col gap-3"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-black text-white/60 flex items-center gap-1.5 uppercase tracking-wider">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-400" /> Top Rated
                  </p>
                  <Link href="/movies" className="text-[10px] text-amber-400/60 hover:text-amber-400 flex items-center gap-0.5 transition-colors">
                    All <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="space-y-2">
                  {topMovies.map((m, i) => (
                    <Link key={m.id} href={`/movies/${m.slug}`}
                      className="group flex items-center gap-2.5 hover:bg-white/[0.03] rounded-lg px-1 py-1 -mx-1 transition-colors">
                      <span className="text-white/15 font-black text-sm w-4 text-center flex-shrink-0">{i + 1}</span>
                      <div className={`w-8 h-10 rounded-md bg-gradient-to-br ${m.gradient} flex-shrink-0 relative overflow-hidden`}>
                        <span className="absolute inset-0 flex items-center justify-center text-base opacity-50">🎬</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-bold truncate group-hover:text-amber-200 transition-colors">{m.title}</p>
                        <p className="text-white/30 text-[10px] truncate">{m.year} · {m.genre[0]}</p>
                      </div>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        <span className="text-amber-400 text-[10px] font-black">{m.rating.toFixed(1)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* On Air serials compact */}
              <div className="rounded-2xl p-4 flex flex-col gap-3"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-black text-white/60 flex items-center gap-1.5 uppercase tracking-wider">
                    <Radio className="w-3.5 h-3.5 text-emerald-400" /> On Air Now
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </p>
                  <Link href="/serials" className="text-[10px] text-amber-400/60 hover:text-amber-400 flex items-center gap-0.5 transition-colors">
                    All <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {liveSerials.map(s => (
                    <Link key={s.id} href={`/serials/${s.slug}`}
                      className="group flex items-center gap-2 p-1.5 rounded-lg transition-colors hover:bg-white/[0.04]"
                      style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className={`w-7 h-8 rounded-md bg-gradient-to-br ${s.gradient} flex-shrink-0 relative overflow-hidden`}>
                        <span className="absolute inset-0 flex items-center justify-center text-sm opacity-50">📺</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-[10px] font-bold truncate group-hover:text-amber-200 transition-colors leading-tight">{s.title}</p>
                        <p className="text-white/30 text-[9px] truncate">{s.channel}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ── Quick-nav pills ── */}
      <div style={{ background: 'rgba(6,6,18,0.85)', borderBottom: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(16px)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide py-2.5">
            {[
              { href: '/serials',          icon: Tv2,        label: 'Serials',     color: '#f97316' },
              { href: '/movies',           icon: Film,       label: 'Movies',      color: '#60a5fa' },
              { href: '/albums',           icon: Music,      label: 'Albums',      color: '#f472b6' },
              { href: '/ott-plans',        icon: Play,       label: 'OTT Plans',   color: '#a78bfa' },
              { href: '/tn-election-2026', icon: TrendingUp, label: 'TN Election', color: '#fbbf24' },
            ].map(({ href, icon: Icon, label, color }) => (
              <Link key={href} href={href}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap flex-shrink-0 transition-all hover:brightness-110 hover:-translate-y-0.5"
                style={{ background: color + '18', border: `1px solid ${color}30`, color }}>
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabbed Content ── */}
      <HomeTabLayout movies={movies} serials={serials} albums={albums} />

      {/* ── AdSense ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <AdUnit format="horizontal" className="min-h-[90px]" />
      </div>
    </div>
  )
}
