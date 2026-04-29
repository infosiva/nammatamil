/**
 * /api/trailers
 * Fetches latest Tamil movie/drama trailers from YouTube Data API v3
 * Falls back to curated static list if no API key or quota exceeded.
 *
 * Cache: 6 hours — trailers don't change often
 */
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 21600 // 6 hours

const YT_KEY = process.env.YOUTUBE_API_KEY ?? ''

export interface Trailer {
  id: string
  videoId: string
  title: string
  channel: string
  thumbnail: string
  publishedAt: string
  category: 'movie' | 'drama' | 'album' | 'ott'
  views?: string
}

// ── Static fallback — recent high-profile Tamil trailers ──────────────────────
const STATIC_TRAILERS: Trailer[] = [
  {
    id: 't1', videoId: 'eYjxZ_v2kAc',
    title: 'Coolie Official Trailer', channel: 'Sun Pictures',
    thumbnail: 'https://img.youtube.com/vi/eYjxZ_v2kAc/mqdefault.jpg',
    publishedAt: '2025-08-15', category: 'movie',
  },
  {
    id: 't2', videoId: 'kbH5cxbBwFA',
    title: 'Retro Official Teaser', channel: 'Red Giant Movies',
    thumbnail: 'https://img.youtube.com/vi/kbH5cxbBwFA/mqdefault.jpg',
    publishedAt: '2025-09-10', category: 'movie',
  },
  {
    id: 't3', videoId: 'Y5Lm0XYbHBk',
    title: 'Thug Life Official Trailer', channel: 'Madras Talkies',
    thumbnail: 'https://img.youtube.com/vi/Y5Lm0XYbHBk/mqdefault.jpg',
    publishedAt: '2025-06-20', category: 'movie',
  },
  {
    id: 't4', videoId: 'pSGolnlTMzs',
    title: 'Singham Again Tamil Trailer', channel: 'Reliance Entertainment',
    thumbnail: 'https://img.youtube.com/vi/pSGolnlTMzs/mqdefault.jpg',
    publishedAt: '2024-10-31', category: 'movie',
  },
  {
    id: 't5', videoId: '_WUNH5cFHfw',
    title: 'Amaran Official Trailer', channel: 'Sony LIV',
    thumbnail: 'https://img.youtube.com/vi/_WUNH5cFHfw/mqdefault.jpg',
    publishedAt: '2024-10-15', category: 'movie',
  },
  {
    id: 't6', videoId: 'lm0ZVDMhgBs',
    title: 'Vidaamuyarchi Official Teaser', channel: 'Lyca Productions',
    thumbnail: 'https://img.youtube.com/vi/lm0ZVDMhgBs/mqdefault.jpg',
    publishedAt: '2024-11-01', category: 'movie',
  },
  {
    id: 't7', videoId: 'BqFMQJqPqjg',
    title: 'Kanguva Official Trailer', channel: 'UV Creations',
    thumbnail: 'https://img.youtube.com/vi/BqFMQJqPqjg/mqdefault.jpg',
    publishedAt: '2024-09-01', category: 'movie',
  },
  {
    id: 't8', videoId: 'r5jlIRbz3iI',
    title: 'Prabhas - The Raja Saab Teaser', channel: 'People Media Factory',
    thumbnail: 'https://img.youtube.com/vi/r5jlIRbz3iI/mqdefault.jpg',
    publishedAt: '2025-04-10', category: 'movie',
  },
  {
    id: 't9', videoId: 'YdYIUVP9RGU',
    title: 'Veera Dheera Sooran Trailer', channel: 'Sony LIV',
    thumbnail: 'https://img.youtube.com/vi/YdYIUVP9RGU/mqdefault.jpg',
    publishedAt: '2025-03-01', category: 'movie',
  },
  {
    id: 't10', videoId: 'zVFkaqCzqzI',
    title: 'Naam Iruvar Oru Kudumbu Promo', channel: 'Vijay TV',
    thumbnail: 'https://img.youtube.com/vi/zVFkaqCzqzI/mqdefault.jpg',
    publishedAt: '2025-01-06', category: 'drama',
  },
]

// ── YouTube Data API v3 — search for recent Tamil trailers ────────────────────
async function fetchFromYouTube(): Promise<Trailer[]> {
  if (!YT_KEY) return []

  const queries = [
    'Tamil movie trailer 2025 official',
    'Tamil movie teaser 2026 official',
    'Tamil serial promo 2025',
  ]

  const allItems: Trailer[] = []

  await Promise.allSettled(queries.map(async (q, qi) => {
    try {
      const url = new URL('https://www.googleapis.com/youtube/v3/search')
      url.searchParams.set('part', 'snippet')
      url.searchParams.set('q', q)
      url.searchParams.set('type', 'video')
      url.searchParams.set('order', 'date')
      url.searchParams.set('maxResults', '6')
      url.searchParams.set('videoCategoryId', '1') // Film & Animation
      url.searchParams.set('relevanceLanguage', 'ta')
      url.searchParams.set('key', YT_KEY)

      const res = await fetch(url.toString(), { signal: AbortSignal.timeout(5000) })
      if (!res.ok) return
      const data = await res.json() as { items?: { id: { videoId: string }; snippet: { title: string; channelTitle: string; thumbnails: { medium: { url: string } }; publishedAt: string } }[] }

      for (const item of data.items ?? []) {
        allItems.push({
          id: `yt-${item.id.videoId}`,
          videoId: item.id.videoId,
          title: item.snippet.title,
          channel: item.snippet.channelTitle,
          thumbnail: item.snippet.thumbnails.medium?.url ?? `https://img.youtube.com/vi/${item.id.videoId}/mqdefault.jpg`,
          publishedAt: item.snippet.publishedAt,
          category: qi === 2 ? 'drama' : 'movie',
        })
      }
    } catch { /* skip failed queries */ }
  }))

  // Deduplicate by videoId
  const seen = new Set<string>()
  return allItems.filter(t => {
    if (seen.has(t.videoId)) return false
    seen.add(t.videoId)
    return true
  }).slice(0, 18)
}

export async function GET() {
  let trailers: Trailer[] = []
  let source = 'static'

  if (YT_KEY) {
    try {
      const live = await fetchFromYouTube()
      if (live.length >= 3) {
        trailers = live
        source = 'youtube'
      }
    } catch { /* fall through */ }
  }

  if (trailers.length === 0) {
    trailers = STATIC_TRAILERS
  }

  return NextResponse.json({ trailers, source, updatedAt: new Date().toISOString() }, {
    headers: { 'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=3600' },
  })
}
