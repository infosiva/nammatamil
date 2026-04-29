/**
 * /api/albums — Live Tamil music albums from TMDB + JioSaavn
 * Fetches Tamil movie soundtracks from TMDB
 * Falls back to static data if TMDB_API_KEY not set
 * Cache: 6 hours
 */
import { NextResponse } from 'next/server'
import { albums as STATIC_ALBUMS } from '@/data/albums'

export const revalidate = 21600 // 6 hours

const TMDB_KEY = process.env.TMDB_API_KEY ?? ''
const TMDB_BASE = 'https://api.themoviedb.org/3'

const GRADIENTS = [
  'from-rose-700 via-pink-600 to-red-500',
  'from-amber-700 via-orange-600 to-red-500',
  'from-teal-600 via-cyan-500 to-sky-400',
  'from-violet-700 via-purple-600 to-fuchsia-500',
  'from-indigo-700 via-blue-600 to-violet-500',
  'from-green-700 via-emerald-600 to-teal-500',
  'from-yellow-700 via-amber-600 to-orange-500',
  'from-slate-700 via-gray-600 to-zinc-500',
]

// Try JioSaavn public API for Tamil new releases
async function fetchSaavnAlbums() {
  try {
    const res = await fetch(
      'https://saavnapi-nine.vercel.app/result/?query=tamil+new+songs+2025&category=album',
      { signal: AbortSignal.timeout(4000), cache: 'no-store' }
    )
    if (!res.ok) return null
    const data = await res.json()
    if (!Array.isArray(data) || !data.length) return null

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.slice(0, 12).map((a: any, i: number) => ({
      id: `saavn-${a.albumid ?? i}`,
      slug: String(a.album ?? a.song ?? 'album').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
      title: String(a.album ?? a.song ?? 'Tamil Album'),
      artist: String(a.primary_artists ?? a.singers ?? 'Tamil Artist'),
      year: new Date().getFullYear(),
      movieName: a.movie ?? undefined,
      songs: a.song ? [String(a.song)] : [],
      description: `${a.album ?? 'Tamil Album'} — ${a.primary_artists ?? 'Tamil Artists'}`,
      genre: ['Film Soundtrack', 'Tamil'],
      gradient: GRADIENTS[i % GRADIENTS.length],
      badge: 'New Release',
    }))
  } catch { return null }
}

async function fetchTMDBAlbums() {
  if (!TMDB_KEY) return null
  try {
    // Fetch recent Tamil movies — use their soundtracks as albums
    const url = `${TMDB_BASE}/discover/movie?api_key=${TMDB_KEY}&with_original_language=ta&sort_by=release_date.desc&vote_count.gte=5&page=1`
    const res = await fetch(url, { signal: AbortSignal.timeout(5000), cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    if (!data?.results?.length) return null

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.results.slice(0, 15).map((m: any, i: number) => ({
      id: `tmdb-album-${m.id}`,
      slug: `${m.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}-ost`,
      title: `${m.title} (OST)`,
      artist: 'Tamil Music',
      year: new Date(m.release_date).getFullYear(),
      movieName: m.title,
      songs: [],
      description: `Original soundtrack for the Tamil film ${m.title}.`,
      genre: ['Film Soundtrack', 'Tamil'],
      gradient: GRADIENTS[i % GRADIENTS.length],
      badge: `${new Date(m.release_date).getFullYear()}`,
    }))
  } catch { return null }
}

export async function GET() {
  // Try Saavn first (has actual album data), then TMDB, then static
  const [saavn, tmdb] = await Promise.all([fetchSaavnAlbums(), fetchTMDBAlbums()])
  const live = saavn ?? tmdb
  return NextResponse.json({
    albums: live ?? STATIC_ALBUMS,
    source: saavn ? 'saavn' : tmdb ? 'tmdb' : 'static',
    updatedAt: new Date().toISOString(),
  })
}
