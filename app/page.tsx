import Link from 'next/link'
import { Search, TrendingUp, Tv2, Film, Music, ArrowRight, Star, Play } from 'lucide-react'
import HomeTabLayout from '@/components/HomeTabLayout'
import AdUnit from '@/components/AdUnit'
import { serials } from '@/data/serials'
import { movies } from '@/data/movies'
import { albums } from '@/data/albums'

export default function HomePage() {
  const tamilMovies   = movies.filter(m => m.language === 'Tamil').length
  const dubbedMovies  = movies.filter(m => m.language === 'Tamil Dubbed').length
  const ongoingSerials = serials.filter(s => s.status === 'Ongoing').length
  const topSerial     = serials.find(s => s.status === 'Ongoing') ?? serials[0]
  const topMovies     = movies.filter(m => m.language === 'Tamil').sort((a, b) => b.rating - a.rating).slice(0, 5)

  return (
    <div className="overflow-x-hidden">

      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #0d0820 0%, #080810 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {/* ambient top glow */}
        <div className="pointer-events-none absolute inset-0" style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(245,158,11,0.13) 0%, transparent 65%)',
        }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">

          {/* tagline + heading */}
          <div className="text-center mb-7">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold mb-4"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              தமிழ் பொழுதுபோக்கு உலகம்
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">
              <span className="text-gradient">நம்ம</span>
              <span className="text-white">Tamil</span>
              <span style={{ color: '#f59e0b', opacity: 0.8 }}>.live</span>
            </h1>

            <p className="text-sm max-w-sm mx-auto" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Movies · Serials · Albums · OTT — all in one place
            </p>
          </div>

          {/* stats row */}
          <div className="flex justify-center flex-wrap gap-x-6 gap-y-2 mb-7">
            {[
              { label: 'Movies',   value: String(tamilMovies + dubbedMovies), icon: Film    },
              { label: 'Serials',  value: String(serials.length),             icon: Tv2     },
              { label: 'Albums',   value: String(albums.length),              icon: Music   },
              { label: 'On Air',   value: String(ongoingSerials),             icon: TrendingUp },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center gap-1.5 text-[12px]"
                style={{ color: 'rgba(255,255,255,0.4)' }}>
                <Icon className="w-3 h-3" style={{ color: '#f59e0b' }} />
                <span className="font-black text-sm" style={{ color: '#f59e0b' }}>{value}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>

          {/* search */}
          <form action="/search" className="flex items-center gap-2 max-w-md mx-auto mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                style={{ color: 'rgba(255,255,255,0.25)' }} />
              <input
                name="q"
                type="text"
                placeholder="Search movies, serials, artists…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white outline-none focus:ring-1 focus:ring-amber-500/40"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white',
                }}
              />
            </div>
            <button type="submit"
              className="px-5 py-2.5 rounded-xl text-sm font-bold flex-shrink-0 hover:brightness-110 transition-all"
              style={{ background: '#f59e0b', color: '#000' }}>
              Search
            </button>
          </form>

          {/* top picks horizontal strip */}
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase mb-3 text-center"
              style={{ color: 'rgba(255,255,255,0.2)' }}>Top Picks Right Now</p>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
              {/* Featured serial card */}
              <Link href={`/serials/${topSerial.slug}`}
                className="flex-shrink-0 w-40 sm:w-48 group">
                <div className="rounded-xl overflow-hidden"
                  style={{ background: '#0d0d18', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className={`h-24 bg-gradient-to-br ${topSerial.gradient} relative`}>
                    <div className="absolute inset-0 flex items-end p-2 bg-gradient-to-t from-black/70 to-transparent">
                      <span className="text-white font-bold text-xs truncate">{topSerial.title}</span>
                    </div>
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white"
                      style={{ background: 'rgba(16,185,129,0.8)' }}>● Live</div>
                  </div>
                  <div className="px-2 py-1.5 flex items-center justify-between">
                    <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{topSerial.channel}</span>
                    <div className="flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      <span className="text-amber-400 text-[10px] font-bold">{topSerial.rating}</span>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Top movies strip */}
              {topMovies.map(m => (
                <Link key={m.id} href={`/movies/${m.slug}`}
                  className="flex-shrink-0 w-28 sm:w-32 group">
                  <div className="rounded-xl overflow-hidden"
                    style={{ background: '#0d0d18', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className={`h-24 bg-gradient-to-br ${m.gradient} relative`}>
                      <div className="absolute inset-0 flex items-end p-2 bg-gradient-to-t from-black/70 to-transparent">
                        <span className="text-white font-bold text-[11px] line-clamp-2 leading-tight">{m.title}</span>
                      </div>
                      {m.badge && (
                        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                          style={{ background: '#f59e0b', color: '#000' }}>{m.badge}</div>
                      )}
                    </div>
                    <div className="px-2 py-1.5 flex items-center justify-between">
                      <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{m.year}</span>
                      <div className="flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        <span className="text-amber-400 text-[10px] font-bold">{m.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}

              {/* View all CTA */}
              <Link href="/movies"
                className="flex-shrink-0 w-20 flex items-center justify-center rounded-xl text-xs font-semibold"
                style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                <div className="text-center">
                  <ArrowRight className="w-4 h-4 mx-auto mb-1" />
                  <span className="text-[10px]">All<br/>Movies</span>
                </div>
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ── Quick nav pills ── */}
      <div style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide py-2">
            {[
              { href: '/serials',   icon: Tv2,   label: 'Serials',  color: '#f97316' },
              { href: '/movies',    icon: Film,  label: 'Movies',   color: '#3b82f6' },
              { href: '/albums',    icon: Music, label: 'Albums',   color: '#ec4899' },
              { href: '/ott-plans', icon: Play,  label: 'OTT Plans', color: '#8b5cf6' },
            ].map(({ href, icon: Icon, label, color }) => (
              <Link key={href} href={href}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all hover:brightness-110"
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <AdUnit format="horizontal" className="min-h-[90px]" />
      </div>
    </div>
  )
}
