/**
 * /api/trailers — Real-time Tamil trailers from YouTube RSS feeds
 * Uses verified channel IDs. 1-hour server cache.
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

// Verified Tamil YouTube channels (tested Apr 2026)
const CHANNELS = [
  { id: 'UCWb3iKyo49p2tXetOUa4iVw', name: 'Sun Pictures',        category: 'movie' as const },
  { id: 'UCciiOyy3uemzbp6_gSMcSwA', name: 'Red Giant Movies',    category: 'movie' as const },
  { id: 'UCA7gwgLgmCZ8DSmdf2bhb8g', name: 'Lyca Productions',    category: 'movie' as const },
  { id: 'UCQmxcMxjYcBM5Pel4qUW2hA', name: 'Sony LIV Tamil',      category: 'movie' as const },
  { id: 'UCMsAo0XUISOL6O1ek_3QWfg', name: 'Vels Film Intl',      category: 'movie' as const },
  { id: 'UCdbalkQDqCcOsYG5c4L8TAw', name: 'Sathyajyothi Films',  category: 'movie' as const },
  { id: 'UCBnxEdpoZwstJqC1yZpOjRA', name: 'Sun TV',              category: 'drama' as const },
  { id: 'UCvrhwpnp2DHYQ1CbXby9ypQ', name: 'Vijay TV',            category: 'drama' as const },
  { id: 'UC_wIGmvdyAQLtl-U2nHV9rg', name: 'Zee Tamil',           category: 'drama' as const },
]

// Require at least one of these keywords to be a trailer
const TRAILER_MUST = [
  'trailer', 'teaser', 'first look', 'promo', 'motion poster',
  'video song', 'lyric video', 'audio launch', 'title announcement',
  'official trailer', 'official teaser', '#trailer', '#teaser', '#firstlook',
]
// Skip regardless
const HARD_SKIP = [
  '#shorts', 'full episode', 'full movie', 'reaction', 'live stream',
  'interview', 'press meet', 'behind the scenes', 'making of',
  'birthday wish', 'wishing', 'fortnite', 'gaming', 'gta',
]

function isTrailerVideo(title: string): boolean {
  const t = title.toLowerCase()
  if (HARD_SKIP.some(k => t.includes(k))) return false
  return TRAILER_MUST.some(k => t.includes(k))
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
    const res = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NammaTamil/2.0; +https://nammatamil.live)' },
        signal: AbortSignal.timeout(6000),
        cache: 'no-store',
      }
    )
    if (!res.ok) return []

    const xml = await res.text()
    const results: Trailer[] = []
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g
    let match: RegExpExecArray | null

    // Last 180 days — wide net
    const cutoff = Date.now() - 180 * 24 * 60 * 60 * 1000

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

      if (!isTrailerVideo(title)) continue

      results.push({
        id: `yt-${videoId}`,
        videoId,
        title,
        channel: channelName,
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        publishedAt,
        category,
      })

      if (results.length >= 6) break
    }

    return results
  } catch {
    return []
  }
}

// Seed trailers — verified video IDs for recent Tamil releases
// These fill the gap when RSS channels don't have recent trailer uploads
const SEED_TRAILERS: Trailer[] = [
  { id: 's1', videoId: 'qeVfT2iLiu0', title: 'Coolie - Official Trailer',         channel: 'Sun Pictures',        thumbnail: 'https://i.ytimg.com/vi/qeVfT2iLiu0/hqdefault.jpg', publishedAt: '2026-04-01', category: 'movie' },
  { id: 's2', videoId: '96kAbj3IF3k', title: 'Thug Life - Official Trailer',      channel: 'Saregama Tamil',       thumbnail: 'https://i.ytimg.com/vi/96kAbj3IF3k/hqdefault.jpg', publishedAt: '2026-03-15', category: 'movie' },
  { id: 's3', videoId: '986VgJ9lLKw', title: 'Retro - Official Trailer',          channel: 'Red Giant Movies',     thumbnail: 'https://i.ytimg.com/vi/986VgJ9lLKw/hqdefault.jpg', publishedAt: '2026-03-01', category: 'movie' },
  { id: 's4', videoId: 'c9zWcnNR2q0', title: 'Good Bad Ugly - Official Trailer',  channel: 'Mythri Movie Makers',  thumbnail: 'https://i.ytimg.com/vi/c9zWcnNR2q0/hqdefault.jpg', publishedAt: '2026-02-15', category: 'movie' },
  { id: 's5', videoId: '5TrJXfquXgE', title: 'Vidaamuyarchi - Official Trailer',  channel: 'Netflix India Tamil',  thumbnail: 'https://i.ytimg.com/vi/5TrJXfquXgE/hqdefault.jpg', publishedAt: '2026-01-20', category: 'movie' },
  { id: 's6', videoId: 'YdYIUVP9RGU', title: 'Veera Dheera Sooran - Trailer',    channel: 'Sony LIV Tamil',       thumbnail: 'https://i.ytimg.com/vi/YdYIUVP9RGU/hqdefault.jpg', publishedAt: '2026-01-10', category: 'movie' },
]

// Server-side cache — 1 hour
let cache: { data: Trailer[]; fetchedAt: number } | null = null
const CACHE_TTL = 60 * 60 * 1000

export async function GET() {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return NextResponse.json(
      { trailers: cache.data, source: 'cached', count: cache.data.length, updatedAt: new Date(cache.fetchedAt).toISOString() },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600' } }
    )
  }

  // Fetch all channels in parallel
  const results = await Promise.allSettled(
    CHANNELS.map(ch => fetchChannelFeed(ch.id, ch.name, ch.category))
  )

  const live: Trailer[] = []
  for (const r of results) {
    if (r.status === 'fulfilled') live.push(...r.value)
  }

  // Deduplicate by videoId
  const seen = new Set<string>()
  const deduped = live
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .filter(t => {
      if (seen.has(t.videoId)) return false
      seen.add(t.videoId)
      return true
    })

  // Merge: live RSS first, then fill from seeds for any not already present
  const seeds = SEED_TRAILERS.filter(s => !seen.has(s.videoId))
  const merged = [...deduped, ...seeds].slice(0, 20)

  cache = { data: merged, fetchedAt: Date.now() }

  return NextResponse.json(
    { trailers: merged, source: deduped.length > 0 ? 'youtube-rss' : 'seed', count: merged.length, updatedAt: new Date().toISOString() },
    { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600' } }
  )
}
