/**
 * /api/movies — Live Tamil movies from TMDB
 * Fetches recent Tamil movies sorted by release date
 * Falls back to static data if TMDB_API_KEY not set or request fails
 * Cache: 1 hour
 */
import { NextResponse } from 'next/server'
import { movies as STATIC_MOVIES } from '@/data/movies'

export const revalidate = 3600

const TMDB_KEY = process.env.TMDB_API_KEY ?? ''
const TMDB_BASE = 'https://api.themoviedb.org/3'

const GRADIENTS = [
  'from-amber-700 via-orange-600 to-red-600',
  'from-blue-700 via-indigo-600 to-purple-600',
  'from-green-700 via-teal-600 to-cyan-600',
  'from-rose-700 via-pink-600 to-fuchsia-600',
  'from-slate-700 via-gray-600 to-zinc-500',
  'from-yellow-700 via-amber-600 to-orange-500',
]

async function fetchTMDBMovies() {
  if (!TMDB_KEY) return null
  try {
    const url = `${TMDB_BASE}/discover/movie?api_key=${TMDB_KEY}&with_original_language=ta&sort_by=release_date.desc&vote_count.gte=5&page=1`
    const res = await fetch(url, { signal: AbortSignal.timeout(5000), cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    if (!data?.results?.length) return null

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.results.slice(0, 24).map((m: any, i: number) => ({
      id: `tmdb-${m.id}`,
      slug: `${m.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}-${new Date(m.release_date).getFullYear()}`,
      title: m.title,
      year: new Date(m.release_date).getFullYear(),
      director: '',
      cast: [] as string[],
      genre: [] as string[],
      language: 'Tamil' as const,
      description: m.overview || 'A Tamil film.',
      streamingOn: [] as string[],
      rating: Math.round(m.vote_average * 10) / 10,
      gradient: GRADIENTS[i % GRADIENTS.length],
      thumbnail: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : undefined,
      ottDate: m.release_date,
    }))
  } catch { return null }
}

export async function GET() {
  const live = await fetchTMDBMovies()
  return NextResponse.json({
    movies: live ?? STATIC_MOVIES,
    source: live ? 'tmdb' : 'static',
    updatedAt: new Date().toISOString(),
  })
}
