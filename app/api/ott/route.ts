/**
 * /api/ott — Real Tamil OTT content from TMDB watch providers API
 * Uses TMDB /discover + /watch/providers to get actual streaming data.
 * Falls back to curated static list if TMDB unavailable.
 */
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const TMDB_KEY  = process.env.TMDB_API_KEY ?? ''
const TMDB_BASE = 'https://api.themoviedb.org/3'
const IMG_BASE  = 'https://image.tmdb.org/t/p/w342'

// TMDB watch provider IDs for India (region=IN)
const PROVIDER_MAP: Record<number, string> = {
  8:   'Netflix',
  119: 'Amazon Prime',
  122: 'Disney+ Hotstar',
  11:  'Mubi',
  237: 'ZEE5',
  192: 'YouTube',
}

export interface OTTMovie {
  id: string
  slug: string
  title: string
  year: number
  director: string
  cast: string[]
  genre: string[]
  language: string
  description?: string
  streamingOn: string[]
  ottDate?: string
  rating: number
  gradient: string
  thumbnail?: string
  badge?: string
  tamilRelevanceScore?: number
  vibeTag?: string
}

// Gradient palette for cards without posters
const GRADIENTS = [
  'from-red-900 via-red-800 to-orange-700',
  'from-violet-900 via-purple-800 to-indigo-700',
  'from-amber-900 via-orange-800 to-red-700',
  'from-teal-900 via-cyan-800 to-blue-700',
  'from-rose-900 via-pink-800 to-fuchsia-700',
]

function slugify(title: string, year: number) {
  return `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${year}`
}

// ── Curated fallback — real 2025-26 Tamil OTT releases ───────────────────────
const STATIC_OTT: OTTMovie[] = [
  {
    id: 'ott-coolie', slug: 'coolie-2025', title: 'Coolie', year: 2025,
    director: 'Lokesh Kanagaraj', cast: ['Rajinikanth', 'Nagarjuna', 'Shruti Haasan'],
    genre: ['Action', 'Thriller'], language: 'Tamil',
    description: 'Rajinikanth as a railway coolie turned crime fighter.',
    streamingOn: ['Netflix'], ottDate: '2025-09-01',
    rating: 8.1, gradient: GRADIENTS[0], badge: 'New',
    thumbnail: 'https://image.tmdb.org/t/p/w342/coolie.jpg',
    tamilRelevanceScore: 10, vibeTag: 'Mass Entertainer',
  },
  {
    id: 'ott-amaran', slug: 'amaran-2024', title: 'Amaran', year: 2024,
    director: 'Rajkumar Periasamy', cast: ['Sivakarthikeyan', 'Sai Pallavi'],
    genre: ['War', 'True Story', 'Drama'], language: 'Tamil',
    description: 'Based on the true story of Major Mukund Varadarajan, a decorated Indian army officer.',
    streamingOn: ['Netflix'], ottDate: '2024-12-20',
    rating: 8.4, gradient: GRADIENTS[0], badge: 'Hit',
    tamilRelevanceScore: 10, vibeTag: 'Emotional',
  },
  {
    id: 'ott-vidaamuyarchi', slug: 'vidaamuyarchi-2025', title: 'Vidaamuyarchi', year: 2025,
    director: 'Magizh Thirumeni', cast: ['Ajith Kumar', 'Trisha Krishnan', 'Arjun Sarja'],
    genre: ['Action', 'Thriller'], language: 'Tamil',
    description: 'An action thriller following a man searching for his missing wife.',
    streamingOn: ['Amazon Prime'], ottDate: '2025-03-14',
    rating: 7.2, gradient: GRADIENTS[1],
    tamilRelevanceScore: 9, vibeTag: 'Action Packed',
  },
  {
    id: 'ott-veera-dheera-sooran', slug: 'veera-dheera-sooran-2025', title: 'Veera Dheera Sooran', year: 2025,
    director: 'S. U. Arun Kumar', cast: ['Vikram', 'S. J. Suryah', 'Dushara Vijayan'],
    genre: ['Action', 'Thriller'], language: 'Tamil',
    description: 'A gripping action thriller featuring Vikram in a dual role.',
    streamingOn: ['Amazon Prime'], ottDate: '2025-04-18',
    rating: 7.8, gradient: GRADIENTS[2], badge: 'New',
    tamilRelevanceScore: 9, vibeTag: 'Intense',
  },
  {
    id: 'ott-retro', slug: 'retro-2025', title: 'Retro', year: 2025,
    director: 'Karthik Subbaraj', cast: ['Suriya', 'Pooja Hegde', 'Jayaram'],
    genre: ['Action', 'Romance', 'Drama'], language: 'Tamil',
    description: 'Suriya in a romantic action drama set against a period backdrop.',
    streamingOn: ['Netflix'], ottDate: '2025-06-20',
    rating: 7.5, gradient: GRADIENTS[3],
    tamilRelevanceScore: 9, vibeTag: 'Stylish',
  },
  {
    id: 'ott-thug-life', slug: 'thug-life-2025', title: 'Thug Life', year: 2025,
    director: 'Mani Ratnam', cast: ['Kamal Haasan', 'Trisha Krishnan', 'Silambarasan'],
    genre: ['Action', 'Drama', 'Thriller'], language: 'Tamil',
    description: 'Mani Ratnam\'s ambitious gangster drama starring Kamal Haasan.',
    streamingOn: ['Netflix'], ottDate: '2025-07-25',
    rating: 7.9, gradient: GRADIENTS[0],
    tamilRelevanceScore: 10, vibeTag: 'Epic',
  },
  {
    id: 'ott-maharaja', slug: 'maharaja-2024', title: 'Maharaja', year: 2024,
    director: 'Nithilan Swaminathan', cast: ['Vijay Sethupathi', 'Anurag Kashyap', 'Natty'],
    genre: ['Thriller', 'Action'], language: 'Tamil',
    description: 'A barber seeks justice for his daughter in this gripping revenge thriller.',
    streamingOn: ['Netflix'], ottDate: '2024-07-12',
    rating: 8.1, gradient: GRADIENTS[1],
    tamilRelevanceScore: 9, vibeTag: 'Revenge Thriller',
  },
  {
    id: 'ott-kanguva', slug: 'kanguva-2024', title: 'Kanguva', year: 2024,
    director: 'Siva', cast: ['Suriya', 'Bobby Deol', 'Disha Patani'],
    genre: ['Action', 'Historical', 'Fantasy'], language: 'Tamil',
    description: 'An epic period action film spanning two timelines with Suriya.',
    streamingOn: ['Disney+ Hotstar'], ottDate: '2025-01-03',
    rating: 6.2, gradient: GRADIENTS[4],
    tamilRelevanceScore: 8, vibeTag: 'Spectacle',
  },
  {
    id: 'ott-lucky-baskhar', slug: 'lucky-baskhar-2024', title: 'Lucky Baskhar', year: 2024,
    director: 'Venky Atluri', cast: ['Dulquer Salmaan', 'Meenakshi Chaudhary'],
    genre: ['Drama', 'Thriller'], language: 'Tamil Dubbed',
    description: 'A middle-class man stumbles into a world of crime in this Telugu thriller.',
    streamingOn: ['Amazon Prime'], ottDate: '2024-11-29',
    rating: 7.4, gradient: GRADIENTS[1],
    tamilRelevanceScore: 7, vibeTag: 'Gripping',
  },
  {
    id: 'ott-pushpa2', slug: 'pushpa-2-2024', title: 'Pushpa 2: The Rule', year: 2024,
    director: 'Sukumar', cast: ['Allu Arjun', 'Rashmika Mandanna', 'Fahadh Faasil'],
    genre: ['Action', 'Drama', 'Thriller'], language: 'Tamil Dubbed',
    description: 'Pushpa Raj expands his smuggling empire while facing a powerful police antagonist.',
    streamingOn: ['Amazon Prime'], ottDate: '2025-01-22',
    rating: 7.6, gradient: GRADIENTS[2], badge: 'Blockbuster',
    tamilRelevanceScore: 8, vibeTag: 'Mass Entertainer',
  },
  {
    id: 'ott-good-bad-ugly', slug: 'good-bad-ugly-2025', title: 'Good Bad Ugly', year: 2025,
    director: 'Adhik Ravichandran', cast: ['Ajith Kumar', 'Trisha Krishnan', 'Prashanth'],
    genre: ['Action', 'Comedy'], language: 'Tamil',
    description: 'Ajith Kumar in a stylish action comedy by director Adhik Ravichandran.',
    streamingOn: ['Netflix'], ottDate: '2025-04-10', badge: 'New',
    rating: 7.3, gradient: GRADIENTS[0],
    tamilRelevanceScore: 9, vibeTag: 'Fun Action',
  },
  {
    id: 'ott-raja-saab', slug: 'raja-saab-2025', title: 'The Raja Saab', year: 2025,
    director: 'Maruthi', cast: ['Prabhas', 'Nidhhi Agerwal', 'Malavika Mohanan'],
    genre: ['Horror', 'Comedy', 'Romance'], language: 'Tamil Dubbed',
    description: 'Prabhas in a horror comedy about a haunted mansion.',
    streamingOn: ['Netflix'], ottDate: '2025-04-25', badge: 'New',
    rating: 7.0, gradient: GRADIENTS[4],
    tamilRelevanceScore: 7, vibeTag: 'Horror Comedy',
  },
]

type TMDBMovie = {
  id: number; title: string; release_date: string
  vote_average: number; overview: string; poster_path: string | null
  genre_ids: number[]
}

function toOTTMovie(m: TMDBMovie, streamingOn: string[], idx: number): OTTMovie {
  const year = parseInt(m.release_date?.split('-')[0] ?? '2025')
  return {
    id: `tmdb-${m.id}`,
    slug: slugify(m.title, year),
    title: m.title,
    year,
    director: '', cast: [], genre: [],
    language: 'Tamil',
    description: m.overview,
    streamingOn,
    ottDate: m.release_date,
    rating: Math.round(m.vote_average * 10) / 10,
    gradient: GRADIENTS[idx % GRADIENTS.length],
    thumbnail: m.poster_path ? `${IMG_BASE}${m.poster_path}` : undefined,
    tamilRelevanceScore: 9,
  }
}

// ── Fetch Tamil movies currently on OTT (Netflix, Prime, Hotstar etc) ─────────
async function fetchOTTMovies(): Promise<OTTMovie[]> {
  if (!TMDB_KEY) return []
  try {
    const url = `${TMDB_BASE}/discover/movie?api_key=${TMDB_KEY}&with_original_language=ta&watch_region=IN&with_watch_monetization_types=flatrate&sort_by=release_date.desc&primary_release_date.gte=2024-06-01&vote_count.gte=5&page=1`
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) })
    if (!res.ok) return []
    const data = await res.json() as { results: TMDBMovie[] }

    const movies: OTTMovie[] = []
    await Promise.allSettled(
      data.results.slice(0, 15).map(async (m) => {
        try {
          const wpRes = await fetch(`${TMDB_BASE}/movie/${m.id}/watch/providers?api_key=${TMDB_KEY}`, { signal: AbortSignal.timeout(4000) })
          if (!wpRes.ok) return
          const wp = await wpRes.json() as { results?: { IN?: { flatrate?: { provider_id: number; provider_name: string }[] } } }
          const providers = wp.results?.IN?.flatrate ?? []
          const streamingOn = providers.map(p => PROVIDER_MAP[p.provider_id] ?? p.provider_name).filter(Boolean)
          if (streamingOn.length === 0) return
          movies.push(toOTTMovie(m, streamingOn, movies.length))
        } catch { /* skip */ }
      })
    )
    return movies
  } catch { return [] }
}

// ── Fetch Tamil theatrical releases (last 45 days) ────────────────────────────
async function fetchTheatricalMovies(): Promise<OTTMovie[]> {
  if (!TMDB_KEY) return []
  try {
    const today = new Date()
    const from = new Date(today)
    from.setDate(from.getDate() - 45)
    const fmt = (d: Date) => d.toISOString().split('T')[0]
    const url = `${TMDB_BASE}/discover/movie?api_key=${TMDB_KEY}&with_original_language=ta&sort_by=release_date.desc&primary_release_date.gte=${fmt(from)}&primary_release_date.lte=${fmt(today)}&vote_count.gte=1&page=1&region=IN`
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) })
    if (!res.ok) return []
    const data = await res.json() as { results: TMDBMovie[] }
    return data.results.slice(0, 10).map((m, i) => toOTTMovie(m, [], i))
  } catch { return [] }
}

export async function GET() {
  const [ottMovies, theatrical] = await Promise.all([
    TMDB_KEY ? fetchOTTMovies() : Promise.resolve([]),
    TMDB_KEY ? fetchTheatricalMovies() : Promise.resolve([]),
  ])

  const movies = ottMovies.length >= 4 ? ottMovies : STATIC_OTT
  const source = ottMovies.length >= 4 ? 'tmdb' : 'static'

  movies.sort((a, b) => {
    if (a.ottDate === 'Coming Soon') return 1
    if (b.ottDate === 'Coming Soon') return -1
    return new Date(b.ottDate ?? 0).getTime() - new Date(a.ottDate ?? 0).getTime()
  })

  return NextResponse.json(
    { source, count: movies.length, movies, theatrical },
    { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=900' } }
  )
}
