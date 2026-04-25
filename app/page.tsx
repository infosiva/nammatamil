import Link from 'next/link'
import { Tv2, Film, Music, Globe, ArrowRight, TrendingUp, Star, Play, Search } from 'lucide-react'
import ContentCard from '@/components/ContentCard'
import AdUnit from '@/components/AdUnit'
import TVKWidget from '@/components/TVKWidget'
import { serials } from '@/data/serials'
import { movies } from '@/data/movies'
import { albums } from '@/data/albums'

const STATS = [
  { label: 'Tamil Serials', value: '500+', icon: Tv2 },
  { label: 'Movies & Dubbed', value: '2000+', icon: Film },
  { label: 'Music Albums', value: '300+', icon: Music },
  { label: 'Languages', value: '5+', icon: Globe },
]

const CATEGORIES = [
  { href: '/serials', label: 'Tamil Serials', icon: Tv2, desc: 'Sun TV, Vijay TV, Zee Tamil & more', color: 'from-orange-500/20 to-amber-500/10 border-orange-500/20 hover:border-orange-400/40' },
  { href: '/movies', label: 'Tamil Movies', icon: Film, desc: 'Blockbusters, classics & award winners', color: 'from-blue-500/20 to-indigo-500/10 border-blue-500/20 hover:border-blue-400/40' },
  { href: '/movies?lang=Tamil+Dubbed', label: 'Tamil Dubbed', icon: Globe, desc: 'Malayalam, Telugu & Hindi dubbed', color: 'from-purple-500/20 to-violet-500/10 border-purple-500/20 hover:border-purple-400/40' },
  { href: '/albums', label: 'Music Albums', icon: Music, desc: 'AR Rahman, Ilaiyaraaja & beyond', color: 'from-pink-500/20 to-rose-500/10 border-pink-500/20 hover:border-pink-400/40' },
]

// Pick featured content
const featuredSerials = serials.slice(0, 6)
const featuredMovies = movies.filter(m => m.language === 'Tamil').slice(0, 6)
const dubbedMovies = movies.filter(m => m.language === 'Tamil Dubbed').slice(0, 4)
const featuredAlbums = albums.slice(0, 4)

export default function HomePage() {
  return (
    <div className="overflow-x-hidden">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="hero-bg hero-particles relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        {/* Animated orbs */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-gold-500/8 blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-crimson-600/8 blur-3xl animate-float" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-1/2 w-60 h-60 rounded-full bg-violet-600/10 blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />

        {/* TVK support ribbon */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
          <div className="glass-gold rounded-xl px-3 py-2 border border-gold-500/30 text-center">
            <div className="text-gold-400 text-[10px] font-bold uppercase tracking-widest">We Support</div>
            <div className="text-white text-xs font-black">TVK · Vijay 2026</div>
          </div>
        </div>

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto animate-fade-up">
          {/* Tamil script accent */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-gold border border-gold-500/20 text-gold-400 text-sm font-medium mb-5">
            <span className="text-base">🎬</span>
            தமிழ் பொழுதுபோக்கு உலகம்
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-none mb-5">
            <span className="text-gradient">நம்ம</span>
            <br />
            <span className="text-white">Tamil</span>
            <span className="text-gold-500">.live</span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            Your complete Tamil entertainment universe — serials, movies, dubbed films, and iconic music albums.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-wrap gap-3 justify-center mb-7">
            <Link
              href="/serials"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-gold-500 to-gold-600 text-dark-900 font-bold text-sm hover:from-gold-400 hover:to-gold-500 transition-all glow-gold hover:scale-105"
            >
              <Play className="w-4 h-4" />
              Explore Serials
            </Link>
            <Link
              href="/movies"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl glass border border-white/10 text-white font-semibold text-sm hover:bg-white/10 transition-all"
            >
              <Film className="w-4 h-4" />
              Browse Movies
            </Link>
          </div>

          {/* Hero search bar */}
          <form action="/search" className="flex items-center gap-2 max-w-lg mx-auto mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
              <input
                name="q"
                type="text"
                placeholder="Search serials, movies, albums..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl glass border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/30 bg-transparent transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-3 rounded-2xl bg-gold-500 text-dark-900 font-bold text-sm hover:bg-gold-400 transition-all flex-shrink-0"
            >
              Search
            </button>
          </form>

          {/* Stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
            {STATS.map(({ label, value, icon: Icon }) => (
              <div key={label} className="glass rounded-xl p-3 flex flex-col items-center gap-1 border border-white/5">
                <Icon className="w-4 h-4 text-gold-400 mb-0.5" />
                <span className="text-xl font-black text-gradient">{value}</span>
                <span className="text-muted text-xs text-center">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-dark-900 to-transparent" />
      </section>

      {/* ── Ticker ────────────────────────────────────────────────────── */}
      <div className="border-y border-subtle bg-dark-800/50 py-2.5 overflow-hidden">
        <div className="ticker-inner">
          {([...movies.slice(0, 10), ...serials.slice(0, 5), ...movies.slice(0, 10), ...serials.slice(0, 5)] as Array<{ id: string; title: string }>).map((item, i) => (
            <span key={i} className="px-8 text-sm text-slate-400 whitespace-nowrap">
              <span className="text-gold-500 mr-2">•</span>
              {item.title}
            </span>
          ))}
        </div>
      </div>

      {/* ── TVK Election Widget ───────────────────────────────────────── */}
      <div className="pt-10 pb-2">
        <TVKWidget />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-14">

        {/* ── Category Cards ───────────────────────────────────────────── */}
        <section>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {CATEGORIES.map(({ href, label, icon: Icon, desc, color }) => (
              <Link key={href} href={href} className="group">
                <div className={`rounded-2xl p-5 border bg-gradient-to-br ${color} transition-all duration-300 group-hover:scale-105`}>
                  <Icon className="w-7 h-7 text-white mb-2.5 group-hover:text-gold-300 transition-colors" />
                  <h3 className="text-white font-bold text-sm mb-1">{label}</h3>
                  <p className="text-muted text-xs hidden sm:block">{desc}</p>
                  <div className="mt-3 flex items-center gap-1 text-gold-400 text-xs font-medium">
                    Browse <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── AdSense ──────────────────────────────────────────────────── */}
        <AdUnit format="horizontal" className="min-h-[90px]" />

        {/* ── Popular Serials ──────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="section-title flex items-center gap-2 !text-xl md:!text-2xl">
                <Tv2 className="w-5 h-5 text-gold-400" />
                Popular Tamil Serials
              </h2>
              <p className="text-muted text-xs mt-0.5">Sun TV · Vijay TV · Star Vijay · Zee Tamil</p>
            </div>
            <Link href="/serials" className="text-gold-400 text-xs font-medium hover:text-gold-300 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {featuredSerials.map((s) => (
              <ContentCard
                key={s.id}
                href={`/serials/${s.slug}`}
                title={s.title}
                subtitle={s.channel}
                gradient={s.gradient}
                type="serial"
                rating={s.rating}
                language={s.language}
                channel={s.channel}
                status={s.status}
                tags={s.tags}
                compact
              />
            ))}
          </div>
        </section>

        {/* ── Trending Movies ──────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="section-title flex items-center gap-2 !text-xl md:!text-2xl">
                <TrendingUp className="w-5 h-5 text-crimson-500" />
                Must-Watch Tamil Movies
              </h2>
              <p className="text-muted text-xs mt-0.5">Blockbusters · Award winners · Classics</p>
            </div>
            <Link href="/movies" className="text-gold-400 text-xs font-medium hover:text-gold-300 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {featuredMovies.map((m) => (
              <ContentCard
                key={m.id}
                href={`/movies/${m.slug}`}
                title={m.title}
                subtitle={m.director}
                gradient={m.gradient}
                type="movie"
                rating={m.rating}
                badge={m.badge}
                year={m.year}
                language={m.language}
                compact
              />
            ))}
          </div>
        </section>

        {/* ── AdSense mid-page ─────────────────────────────────────────── */}
        <AdUnit format="rectangle" className="min-h-[250px]" />

        {/* ── Tamil Dubbed Gems ─────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="section-title flex items-center gap-2 !text-xl md:!text-2xl">
                <Globe className="w-5 h-5 text-cyan-400" />
                Tamil Dubbed Gems
              </h2>
              <p className="text-muted text-xs mt-0.5">Malayalam · Telugu · Hindi — now in Tamil</p>
            </div>
            <Link href="/movies?lang=Tamil+Dubbed" className="text-gold-400 text-xs font-medium hover:text-gold-300 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {dubbedMovies.map((m) => (
              <ContentCard
                key={m.id}
                href={`/movies/${m.slug}`}
                title={m.title}
                subtitle={`${m.director} · ${m.originalLanguage}`}
                gradient={m.gradient}
                type="movie"
                rating={m.rating}
                badge={m.badge}
                year={m.year}
                language={m.language}
              />
            ))}
          </div>
        </section>

        {/* ── Music Albums ─────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="section-title flex items-center gap-2 !text-xl md:!text-2xl">
                <Music className="w-5 h-5 text-pink-400" />
                Iconic Tamil Albums
              </h2>
              <p className="text-muted text-xs mt-0.5">AR Rahman · Ilaiyaraaja · GV Prakash & more</p>
            </div>
            <Link href="/albums" className="text-gold-400 text-xs font-medium hover:text-gold-300 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {featuredAlbums.map((a) => (
              <ContentCard
                key={a.id}
                href={`/albums/${a.slug}`}
                title={a.title}
                subtitle={a.artist}
                gradient={a.gradient}
                type="album"
                badge={a.badge}
                year={a.year}
                tags={a.genre}
              />
            ))}
          </div>
        </section>

        {/* ── Top Rated Banner ─────────────────────────────────────────── */}
        <section className="rounded-3xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-dark-800 via-dark-700 to-dark-800" />
          <div className="absolute inset-0 bg-gradient-to-r from-gold-500/5 to-crimson-600/5" />
          <div className="relative p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Star className="w-4 h-4 text-gold-400 fill-gold-400" />
                <span className="text-gold-400 font-semibold text-xs">Top Rated</span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white mb-1.5">
                Jai Bhim & 96 — must watch Tamil cinema
              </h2>
              <p className="text-muted text-xs max-w-lg">
                Two completely different films — one a powerful legal drama, one an achingly beautiful love story — both rated among the best Tamil films ever made.
              </p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <Link href="/movies/jai-bhim" className="px-5 py-2.5 rounded-xl bg-gold-500 text-dark-900 font-bold text-sm hover:bg-gold-400 transition-colors">
                Jai Bhim
              </Link>
              <Link href="/movies/96-2018" className="px-5 py-2.5 rounded-xl glass border border-white/10 text-white font-semibold text-sm hover:bg-white/10 transition-colors">
                96
              </Link>
            </div>
          </div>
        </section>

        {/* ── Bottom AdSense ───────────────────────────────────────────── */}
        <AdUnit format="horizontal" className="min-h-[90px]" />

      </div>
    </div>
  )
}
