import Link from 'next/link'
import { Search, Tv2, Film, Music, ArrowRight, Star, Play, TrendingUp, Radio } from 'lucide-react'
import HomeTabLayout from '@/components/HomeTabLayout'
import AdUnit from '@/components/AdUnit'
import { serials } from '@/data/serials'
import { movies } from '@/data/movies'
import { albums } from '@/data/albums'

export default function HomePage() {
  const tamilMovies    = movies.filter(m => m.language === 'Tamil').length
  const dubbedMovies   = movies.filter(m => m.language === 'Tamil Dubbed').length
  const ongoingSerials = serials.filter(s => s.status === 'Ongoing').length
  const topMovies      = movies.filter(m => m.language === 'Tamil').sort((a, b) => b.rating - a.rating).slice(0, 6)
  const liveSerials    = serials.filter(s => s.status === 'Ongoing').slice(0, 5)

  return (
    <div className="overflow-x-hidden">

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {/* top glow */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[500px]" style={{
          background: 'radial-gradient(ellipse 90% 70% at 50% -5%, rgba(245,158,11,0.15) 0%, rgba(99,102,241,0.06) 40%, transparent 70%)',
        }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">

          {/* ── Tagline badge ── */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.22)', color: '#f59e0b' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {ongoingSerials} Serials On Air · Real-time Tamil Entertainment
            </div>
          </div>

          {/* ── Main heading ── */}
          <div className="text-center mb-8">
            <h1 className="font-black leading-none tracking-tighter mb-4" style={{ fontSize: 'clamp(2.8rem, 8vw, 6rem)' }}>
              <span className="text-gradient">நம்ம</span>
              <span className="text-white">Tamil</span>
              <span style={{ color: '#f59e0b', opacity: 0.75 }}>.live</span>
            </h1>
            <p className="text-base sm:text-lg max-w-md mx-auto" style={{ color: 'rgba(255,255,255,0.38)' }}>
              Movies · Serials · Albums · OTT — Your complete Tamil entertainment universe
            </p>
          </div>

          {/* ── Search ── */}
          <form action="/search" className="flex items-center gap-2 max-w-lg mx-auto mb-10">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                style={{ color: 'rgba(255,255,255,0.2)' }} />
              <input name="q" type="text"
                placeholder="Search movies, serials, artists…"
                className="w-full pl-11 pr-4 py-3 rounded-2xl text-sm text-white outline-none focus:ring-2 focus:ring-amber-500/30 transition-all"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.11)' }}
              />
            </div>
            <button type="submit"
              className="px-6 py-3 rounded-2xl text-sm font-bold flex-shrink-0 transition-all hover:brightness-110 hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg,#f59e0b,#f97316)', color: '#000' }}>
              Search
            </button>
          </form>

          {/* ── Stats row ── */}
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mb-10">
            {[
              { label: 'Tamil Movies',  value: String(tamilMovies),              icon: Film,       color: '#60a5fa' },
              { label: 'Dubbed Movies', value: String(dubbedMovies),             icon: Film,       color: '#a78bfa' },
              { label: 'Serials',       value: String(serials.length),           icon: Tv2,        color: '#fb923c' },
              { label: 'Albums',        value: String(albums.length),            icon: Music,      color: '#f472b6' },
              { label: 'On Air Now',    value: String(ongoingSerials),           icon: Radio,      color: '#34d399' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
                <Icon className="w-3.5 h-3.5" style={{ color }} />
                <span className="font-black text-base" style={{ color }}>{value}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>

          {/* ── Top picks split: movies left, serials right ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

            {/* Movies shelf — 3 cols */}
            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  <TrendingUp className="w-3.5 h-3.5 text-blue-400" /> Top Rated Movies
                </p>
                <Link href="/movies" className="text-[11px] font-semibold flex items-center gap-1 hover:text-amber-400 transition-colors"
                  style={{ color: 'rgba(245,158,11,0.6)' }}>
                  All <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
                {topMovies.map(m => (
                  <Link key={m.id} href={`/movies/${m.slug}`}
                    className="group flex-shrink-0 w-[130px] sm:w-[144px]">
                    <div className="rounded-xl overflow-hidden card-hover"
                      style={{ background: '#0d0d1c', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div className={`h-[180px] bg-gradient-to-br ${m.gradient} relative overflow-hidden`}>
                        {/* Grid texture */}
                        <div className="absolute inset-0 opacity-10"
                          style={{
                            backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)',
                            backgroundSize: '18px 18px',
                          }} />
                        {/* Floating blobs */}
                        <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/10" />
                        {/* Large emoji watermark */}
                        <span className="absolute -bottom-1 -right-1 text-[52px] opacity-15 leading-none select-none">🎬</span>
                        {/* Top row */}
                        <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded text-white/60"
                            style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}>{m.year}</span>
                          {m.badge && (
                            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-amber-400 text-black">{m.badge}</span>
                          )}
                        </div>
                        {/* Genre */}
                        {m.genre?.[0] && (
                          <div className="absolute bottom-10 left-2 px-1.5 py-0.5 rounded text-[9px] font-semibold text-white/60"
                            style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}>
                            {m.genre[0]}
                          </div>
                        )}
                        {/* Title overlay */}
                        <div className="absolute inset-x-0 bottom-0 pt-8 pb-2 px-2"
                          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)' }}>
                          <p className="text-white font-black text-[11px] leading-tight line-clamp-2 group-hover:text-amber-200 transition-colors">{m.title}</p>
                        </div>
                      </div>
                      <div className="px-2 py-1.5 flex items-center justify-between border-t border-white/[0.05]">
                        <span className="text-white/30 text-[10px] truncate max-w-[70px]">{m.director.split(' ').pop()}</span>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                          <span className="text-amber-400 text-[10px] font-black">{m.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Serials shelf — 2 cols */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  <Radio className="w-3.5 h-3.5 text-emerald-400" /> On Air Now
                </p>
                <Link href="/serials" className="text-[11px] font-semibold flex items-center gap-1 hover:text-amber-400 transition-colors"
                  style={{ color: 'rgba(245,158,11,0.6)' }}>
                  All <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="flex flex-col gap-2">
                {liveSerials.map(s => (
                  <Link key={s.id} href={`/serials/${s.slug}`}
                    className="group flex items-center gap-3 p-2 rounded-xl transition-all news-card-hover"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    {/* Mini poster with gradient + emoji */}
                    <div className={`relative w-12 h-14 rounded-lg bg-gradient-to-br ${s.gradient} flex-shrink-0 overflow-hidden`}>
                      <div className="absolute inset-0 opacity-10"
                        style={{
                          backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
                          backgroundSize: '8px 8px',
                        }} />
                      <span className="absolute inset-0 flex items-center justify-center text-xl opacity-60">📺</span>
                      <span className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-xs truncate group-hover:text-amber-200 transition-colors">{s.title}</p>
                      <p className="text-[10px] truncate mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{s.channel}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-0.5">
                          <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-emerald-400 text-[9px] font-bold">On Air</span>
                        </span>
                        <div className="flex items-center gap-0.5">
                          <Star className="w-2 h-2 fill-amber-400 text-amber-400" />
                          <span className="text-amber-400 text-[9px] font-bold">{s.rating}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Quick-nav pills ── */}
      <div style={{ background: 'rgba(6,6,18,0.8)', borderBottom: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)' }}>
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
