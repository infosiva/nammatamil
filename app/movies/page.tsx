import { Film, Globe } from 'lucide-react'
import ContentCard from '@/components/ContentCard'
import AdUnit from '@/components/AdUnit'
import { movies } from '@/data/movies'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tamil Movies — Blockbusters, Classics & Tamil Dubbed Films',
  description: 'Complete collection of Tamil movies and Tamil dubbed films — Malayalam, Telugu, Hindi dubbed in Tamil. Cast, ratings, streaming info and more.',
}

export default function MoviesPage() {
  const tamilMovies = movies.filter(m => m.language === 'Tamil')
  const dubbedMalayalam = movies.filter(m => m.language === 'Tamil Dubbed' && m.originalLanguage === 'Malayalam')
  const dubbedTelugu = movies.filter(m => m.language === 'Tamil Dubbed' && m.originalLanguage === 'Telugu')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-xl bg-crimson-600/10 border border-crimson-600/20">
            <Film className="w-6 h-6 text-crimson-500" />
          </div>
          <h1 className="text-4xl font-black text-white">Tamil Movies</h1>
        </div>
        <p className="text-muted max-w-2xl">
          Original Tamil films and Tamil dubbed movies from Malayalam, Telugu, and other languages.
        </p>
      </div>

      <AdUnit format="horizontal" className="mb-10 min-h-[90px]" />

      <section className="mb-16">
        <h2 className="text-2xl font-bold text-white mb-2">Original Tamil Movies</h2>
        <p className="text-muted text-sm mb-6">Blockbusters, award winners, and hidden gems</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {tamilMovies.map((m) => (
            <ContentCard key={m.id} href={`/movies/${m.slug}`} title={m.title} subtitle={m.director} gradient={m.gradient} type="movie" rating={m.rating} badge={m.badge} year={m.year} language={m.language} />
          ))}
        </div>
      </section>

      <AdUnit format="rectangle" className="mb-16 min-h-[250px]" />

      <section className="mb-16">
        <div className="flex items-center gap-2 mb-2">
          <Globe className="w-5 h-5 text-cyan-400" />
          <h2 className="text-2xl font-bold text-white">Tamil Dubbed Malayalam Movies</h2>
        </div>
        <p className="text-muted text-sm mb-6">Mohanlal, Mammootty, Prithviraj & more — in Tamil</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {dubbedMalayalam.map((m) => (
            <ContentCard key={m.id} href={`/movies/${m.slug}`} title={m.title} subtitle={m.director} gradient={m.gradient} type="movie" rating={m.rating} badge={m.badge} year={m.year} language={m.language} />
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-2">
          <Globe className="w-5 h-5 text-purple-400" />
          <h2 className="text-2xl font-bold text-white">Tamil Dubbed Telugu Movies</h2>
        </div>
        <p className="text-muted text-sm mb-6">Baahubali, RRR, Pushpa & more — in Tamil</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {dubbedTelugu.map((m) => (
            <ContentCard key={m.id} href={`/movies/${m.slug}`} title={m.title} subtitle={m.director} gradient={m.gradient} type="movie" rating={m.rating} badge={m.badge} year={m.year} language={m.language} />
          ))}
        </div>
      </section>
    </div>
  )
}
