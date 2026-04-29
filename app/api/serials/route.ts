/**
 * /api/serials — Live Tamil TV serials from TMDB
 * Fetches Tamil language TV shows sorted by popularity/air date
 * Falls back to static data if TMDB_API_KEY not set or request fails
 * Cache: 6 hours (serials don't change as fast as movies)
 */
import { NextResponse } from 'next/server'
import { serials as STATIC_SERIALS } from '@/data/serials'

export const revalidate = 21600 // 6 hours

const TMDB_KEY = process.env.TMDB_API_KEY ?? ''
const TMDB_BASE = 'https://api.themoviedb.org/3'

const CHANNEL_GRADIENTS: Record<string, string> = {
  'Sun TV':       'from-orange-600 via-red-500 to-amber-500',
  'Vijay TV':     'from-amber-600 via-orange-500 to-yellow-400',
  'Zee Tamil':    'from-purple-600 via-violet-500 to-indigo-400',
  'Star Vijay':   'from-red-600 via-rose-500 to-pink-400',
  'Colors Tamil': 'from-pink-600 via-fuchsia-500 to-purple-400',
}
const DEFAULT_GRADIENT = 'from-blue-600 via-indigo-500 to-violet-400'

async function fetchTMDBSerials() {
  if (!TMDB_KEY) return null
  try {
    const url = `${TMDB_BASE}/discover/tv?api_key=${TMDB_KEY}&with_original_language=ta&sort_by=popularity.desc&page=1`
    const res = await fetch(url, { signal: AbortSignal.timeout(5000), cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    if (!data?.results?.length) return null

    const CHANNELS = ['Sun TV', 'Vijay TV', 'Zee Tamil', 'Star Vijay', 'Colors Tamil']

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.results.slice(0, 20).map((s: any, i: number) => {
      const channel = CHANNELS[i % CHANNELS.length]
      return {
        id: `tmdb-tv-${s.id}`,
        slug: `${s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}`,
        title: s.name,
        channel,
        genre: ['Drama'],
        status: s.status === 'Ended' ? 'Completed' : 'Ongoing' as 'Ongoing' | 'Completed',
        startYear: s.first_air_date ? new Date(s.first_air_date).getFullYear() : 2020,
        description: s.overview || 'A Tamil TV serial.',
        language: 'Tamil' as const,
        cast: [] as string[],
        tags: ['tamil', 'serial'],
        rating: Math.round(s.vote_average * 10) / 10,
        gradient: CHANNEL_GRADIENTS[channel] ?? DEFAULT_GRADIENT,
        thumbnail: s.poster_path ? `https://image.tmdb.org/t/p/w300${s.poster_path}` : `/api/serial-thumb?title=${encodeURIComponent(s.name)}&channel=${encodeURIComponent(channel)}`,
      }
    })
  } catch { return null }
}

export async function GET() {
  const live = await fetchTMDBSerials()
  return NextResponse.json({
    serials: live ?? STATIC_SERIALS,
    source: live ? 'tmdb' : 'static',
    updatedAt: new Date().toISOString(),
  })
}
