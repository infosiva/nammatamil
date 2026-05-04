/**
 * /api/nammatvk-videos — Latest videos from NammaTVK YouTube channel
 *
 * Uses YouTube public RSS feed (no API key needed).
 * NammaTVK channel: @NammaTVK (UCFyeng5nb_HTtg1WxHl5pFA)
 * Cache: 10 min server-side, auto-refreshes on client every 5 min.
 */
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const NAMMATVK_CHANNEL_ID = 'UCFyeng5nb_HTtg1WxHl5pFA'

// Fallback seed: curated recent NammaTVK videos (updated manually when needed)
const SEED_VIDEOS: NammaTVKVideo[] = [
  {
    videoId: 'placeholder1',
    title: 'TVK Election Campaign — Final Rally Highlights',
    publishedAt: '2026-04-30T10:00:00+05:30',
    timeAgo: '4 days ago',
    thumbnail: `https://i.ytimg.com/vi/placeholder1/hqdefault.jpg`,
  },
  {
    videoId: 'placeholder2',
    title: 'Thalapathy Vijay Press Conference — TN Election 2026',
    publishedAt: '2026-04-28T14:00:00+05:30',
    timeAgo: '6 days ago',
    thumbnail: `https://i.ytimg.com/vi/placeholder2/hqdefault.jpg`,
  },
]

export interface NammaTVKVideo {
  videoId: string
  title: string
  publishedAt: string
  timeAgo: string
  thumbnail: string
  description?: string
}

function decodeXml(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\n/g, ' ')
    .trim()
}

function timeAgo(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return 'Recently'
    const diff = Date.now() - d.getTime()
    const mins = Math.floor(diff / 60_000)
    if (mins < 2) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 30) return `${days}d ago`
    return `${Math.floor(days / 30)}mo ago`
  } catch {
    return 'Recently'
  }
}

async function fetchRSSVideos(): Promise<NammaTVKVideo[]> {
  const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${NAMMATVK_CHANNEL_ID}`
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; NammaTamil/2.0; +https://nammatamil.live)',
      Accept: 'application/atom+xml, application/xml, text/xml',
    },
    signal: AbortSignal.timeout(8000),
    cache: 'no-store',
  })

  if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`)
  const xml = await res.text()

  const videos: NammaTVKVideo[] = []
  const entryRe = /<entry>([\s\S]*?)<\/entry>/g
  let match: RegExpExecArray | null

  while ((match = entryRe.exec(xml)) !== null) {
    const block = match[1]

    const videoIdM = block.match(/<yt:videoId>(.*?)<\/yt:videoId>/)
    const titleM   = block.match(/<title>([\s\S]*?)<\/title>/)
    const publishM = block.match(/<published>(.*?)<\/published>/)
    const descM    = block.match(/<media:description>([\s\S]*?)<\/media:description>/)

    if (!videoIdM || !titleM || !publishM) continue

    const videoId     = videoIdM[1].trim()
    const title       = decodeXml(titleM[1])
    const publishedAt = publishM[1].trim()
    const description = descM ? decodeXml(descM[1]).slice(0, 200) : undefined

    videos.push({
      videoId,
      title,
      publishedAt,
      timeAgo: timeAgo(publishedAt),
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      description,
    })

    if (videos.length >= 12) break
  }

  return videos
}

// ── Cache ─────────────────────────────────────────────────────────────────────
let cache: { data: NammaTVKVideo[]; fetchedAt: number; source: string } | null = null
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes

export async function GET() {
  const now = Date.now()

  if (cache && now - cache.fetchedAt < CACHE_TTL) {
    return NextResponse.json(
      { videos: cache.data, source: cache.source, count: cache.data.length, updatedAt: new Date(cache.fetchedAt).toISOString(), cached: true },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  }

  let videos: NammaTVKVideo[] = []
  let source = 'seed'

  try {
    videos = await fetchRSSVideos()
    source = 'youtube-rss'
  } catch {
    // RSS blocked or unavailable — return seed if cache expired
    if (cache) {
      // Return stale cache rather than seeds
      return NextResponse.json(
        { videos: cache.data, source: 'stale-cache', count: cache.data.length, updatedAt: new Date(cache.fetchedAt).toISOString(), cached: true },
        { headers: { 'Cache-Control': 'no-store' } }
      )
    }
    videos = SEED_VIDEOS
    source = 'seed'
  }

  cache = { data: videos, fetchedAt: now, source }

  return NextResponse.json(
    { videos, source, count: videos.length, updatedAt: new Date().toISOString() },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
