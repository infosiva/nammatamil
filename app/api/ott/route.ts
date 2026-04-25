/**
 * /api/ott — proxies the VPS crawler API with ISR-style caching
 * Falls back to static movie data if crawler is unreachable
 */

import { NextResponse } from 'next/server'
import { movies } from '@/data/movies'

const CRAWLER_URL = process.env.CRAWLER_API_URL ?? 'http://31.97.56.148:3096'
// Revalidate every 6 hours
export const revalidate = 21600

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const platform = searchParams.get('platform') ?? 'All'
  const genre    = searchParams.get('genre') ?? 'All'
  const q        = searchParams.get('q') ?? ''

  // Try live crawler API first
  try {
    const params = new URLSearchParams()
    if (platform !== 'All') params.set('platform', platform)
    if (genre !== 'All')    params.set('genre', genre)
    if (q)                  params.set('q', q)

    const res = await fetch(`${CRAWLER_URL}/api/movies?${params}`, {
      next: { revalidate: 21600 }, // Next.js ISR cache
      signal: AbortSignal.timeout(3000), // 3s timeout
    })

    if (res.ok) {
      const data = await res.json()
      return NextResponse.json({ source: 'crawler', ...data })
    }
  } catch {
    // Crawler unreachable — fall through to static data
  }

  // Fallback: filter static movies data
  let filtered = movies.filter(m => m.ottDate)

  if (platform !== 'All') {
    filtered = filtered.filter(m => m.streamingOn.includes(platform))
  }
  if (genre !== 'All') {
    filtered = filtered.filter(m => m.genre?.some(g => g.toLowerCase().includes(genre.toLowerCase())))
  }
  if (q) {
    const query = q.toLowerCase()
    filtered = filtered.filter(m =>
      m.title.toLowerCase().includes(query) ||
      m.director.toLowerCase().includes(query) ||
      m.cast.some(c => c.toLowerCase().includes(query)) ||
      m.genre.some(g => g.toLowerCase().includes(query))
    )
  }

  // Sort: Coming Soon first, then by ottDate desc
  filtered.sort((a, b) => {
    if (a.ottDate === 'Coming Soon') return -1
    if (b.ottDate === 'Coming Soon') return 1
    return new Date(b.ottDate ?? 0).getTime() - new Date(a.ottDate ?? 0).getTime()
  })

  return NextResponse.json({ source: 'static', count: filtered.length, movies: filtered })
}
