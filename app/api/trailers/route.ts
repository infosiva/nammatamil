/**
 * /api/trailers — Real-time Tamil trailers from YouTube RSS feeds
 * Fetches the latest videos from major Tamil production channels.
 * No API key needed. 1-hour server cache.
 */
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export interface Trailer {
  id: string
  videoId: string
  title: string
  channel: string
  thumbnail: string
  publishedAt: string
  category: 'movie' | 'drama' | 'album' | 'ott'
}

// Tamil YouTube channels — production houses + major OTT/TV channels
const CHANNELS = [
  { id: 'UCyPn-7OLF4H_WQKQ_SJGMmA', name: 'Sun Pictures',           category: 'movie'  as const },
  { id: 'UC-4SnEQMlEMBaZ_JuQnixFw', name: 'Red Giant Movies',        category: 'movie'  as const },
  { id: 'UCGKkRDGVfOY6iJv-mFZIkSA', name: 'Lyca Productions',        category: 'movie'  as const },
  { id: 'UC8FBwz59TDv_FUYG8FfMgdg', name: 'Vels Film International', category: 'movie'  as const },
  { id: 'UCyILFGMFSXTPjy8sUZHrLSQ', name: 'KE Productions',          category: 'movie'  as const },
  { id: 'UCmMwK3jn4PGb3nEMlLcfFaA', name: 'Sathyajyothi Films',      category: 'movie'  as const },
  { id: 'UCFkMDqMxKfMsZ-YL3lBHWxA', name: 'Sony LIV Tamil',          category: 'movie'  as const },
  { id: 'UCzhe0GlQQpL8rN7eBLdHqFA', name: 'Sun TV',                  category: 'drama'  as const },
  { id: 'UC-8QAzbLcRglXeN_MY9JpkQ', name: 'Vijay TV',                category: 'drama'  as const },
  { id: 'UCqrm3Ml8OVAM3HBvEu5aUkw', name: 'Zee Tamil',               category: 'drama'  as const },
]

// Skip clearly non-trailer content (very loose filter — grab most things)
const HARD_SKIP = [
  'full episode', 'full movie', 'making of', 'behind the scenes',
  'press meet', 'interview', 'reaction video', 'live stream',
]
// Prefer content that looks like trailers/teasers/promos
const PREFER_KEYWORDS = [
  'trailer', 'teaser', 'first look', 'promo', 'motion poster',
  'official', 'video song', 'lyric', 'launch', 'announcement',
  'release', 'poster', '- trailer', '| trailer',
]

function scoreVideo(title: string): number {
  const t = title.toLowerCase()
  if (HARD_SKIP.some(k => t.includes(k))) return -1 // skip
  let score = 0
  for (const k of PREFER_KEYWORDS) {
    if (t.includes(k)) score += 2
  }
  return score // 0 = neutral (include anyway), >0 = preferred
}

function decodeXml(s: string): string {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
}

async function fetchChannelFeed(
  channelId: string, channelName: string, category: Trailer['category']
): Promise<Trailer[]> {
  try {
    const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NammaTamil/2.0)',
        'Accept': 'application/atom+xml,application/xml,text/xml',
      },
      signal: AbortSignal.timeout(6000),
      cache: 'no-store',
    })
    if (!res.ok) return []

    const xml = await res.text()
    const results: Trailer[] = []
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g
    let match: RegExpExecArray | null

    // Last 60 days
    const cutoff = Date.now() - 60 * 24 * 60 * 60 * 1000

    while ((match = entryRegex.exec(xml)) !== null) {
      const block = match[1]
      const videoIdM = block.match(/<yt:videoId>(.*?)<\/yt:videoId>/)
      const titleM   = block.match(/<title>(.*?)<\/title>/)
      const publishM = block.match(/<published>(.*?)<\/published>/)
      if (!videoIdM || !titleM || !publishM) continue

      const publishedAt = publishM[1]
      if (new Date(publishedAt).getTime() < cutoff) continue

      const videoId = videoIdM[1].trim()
      const title   = decodeXml(titleM[1].trim())

      const score = scoreVideo(title)
      if (score < 0) continue // hard skip

      results.push({
        id:          `yt-${videoId}`,
        videoId,
        title,
        channel:     channelName,
        thumbnail:   `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        publishedAt,
        category,
      })

      if (results.length >= 5) break
    }

    return results
  } catch {
    return []
  }
}

// Server-side cache — 1 hour TTL
let cache: { data: Trailer[]; fetchedAt: number } | null = null
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

export async function GET() {
  // Serve from cache if fresh
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return NextResponse.json(
      { trailers: cache.data, source: 'youtube-rss-cached', count: cache.data.length, updatedAt: new Date(cache.fetchedAt).toISOString() },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600' } }
    )
  }

  // Fetch all channels in parallel
  const results = await Promise.allSettled(
    CHANNELS.map(ch => fetchChannelFeed(ch.id, ch.name, ch.category))
  )

  const all: Trailer[] = []
  for (const r of results) {
    if (r.status === 'fulfilled') all.push(...r.value)
  }

  // Deduplicate, sort by newest first
  const seen = new Set<string>()
  const deduped = all
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .filter(t => {
      if (seen.has(t.videoId)) return false
      seen.add(t.videoId)
      return true
    })
    .slice(0, 20) // max 20

  if (deduped.length >= 4) {
    cache = { data: deduped, fetchedAt: Date.now() }
    return NextResponse.json(
      { trailers: deduped, source: 'youtube-rss', count: deduped.length, updatedAt: new Date().toISOString() },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600' } }
    )
  }

  // RSS fetch failed or returned too few — return what we got with a note
  // No hardcoded static fallback — return empty so UI shows a proper state
  return NextResponse.json(
    { trailers: deduped, source: 'youtube-rss-partial', count: deduped.length, updatedAt: new Date().toISOString() },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' } }
  )
}
