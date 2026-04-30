/**
 * /api/trailers — Real-time Tamil trailers
 * Strategy:
 *   1. YouTube Data API v3 search for fresh Tamil trailers (with real view counts)
 *   2. RSS feeds from verified Tamil channels (fallback / supplement)
 *   3. Seed trailers fill gaps if both above yield < threshold
 * Cache: 1 hour server-side
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
  viewCount?: number      // real YouTube view count (if API key available)
  viewLabel?: string      // formatted: "2.3M views"
  trending?: boolean      // true if views > 1M in < 30 days
}

// ── YouTube Data API ──────────────────────────────────────────────────────────
const YT_API_KEY = process.env.YOUTUBE_API_KEY ?? ''

// Search queries to find trending Tamil trailers
const YT_SEARCH_QUERIES = [
  'tamil trailer 2026 official',
  'tamil teaser 2026 official',
  'tamil first look 2026',
]

interface YTSearchItem {
  id: { videoId: string }
  snippet: {
    title: string
    channelTitle: string
    publishedAt: string
    thumbnails: { high?: { url: string }; medium?: { url: string }; default?: { url: string } }
  }
}

interface YTVideoStats {
  id: string
  statistics: { viewCount?: string; likeCount?: string }
}

async function fetchYouTubeSearch(query: string): Promise<YTSearchItem[]> {
  if (!YT_API_KEY) return []
  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/search')
    url.searchParams.set('part', 'snippet')
    url.searchParams.set('q', query)
    url.searchParams.set('type', 'video')
    url.searchParams.set('videoCategoryId', '1') // Film & Animation
    url.searchParams.set('order', 'viewCount')
    url.searchParams.set('regionCode', 'IN')
    url.searchParams.set('relevanceLanguage', 'ta')
    url.searchParams.set('maxResults', '10')
    url.searchParams.set('publishedAfter', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
    url.searchParams.set('key', YT_API_KEY)

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(6000), cache: 'no-store' })
    if (!res.ok) return []
    const data = await res.json()
    return (data.items ?? []) as YTSearchItem[]
  } catch {
    return []
  }
}

async function fetchVideoStats(videoIds: string[]): Promise<Map<string, number>> {
  if (!YT_API_KEY || videoIds.length === 0) return new Map()
  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/videos')
    url.searchParams.set('part', 'statistics')
    url.searchParams.set('id', videoIds.join(','))
    url.searchParams.set('key', YT_API_KEY)

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(6000), cache: 'no-store' })
    if (!res.ok) return new Map()
    const data = await res.json()
    const map = new Map<string, number>()
    for (const item of (data.items ?? []) as YTVideoStats[]) {
      const views = parseInt(item.statistics?.viewCount ?? '0', 10)
      if (!isNaN(views)) map.set(item.id, views)
    }
    return map
  } catch {
    return new Map()
  }
}

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M views`
  if (n >= 1_000)     return `${Math.round(n / 1_000)}K views`
  return `${n} views`
}

function isTrendingByViews(viewCount: number, publishedAt: string): boolean {
  const daysOld = (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24)
  // Trending = more than 500K views in first 30 days, or 1M+ total
  return viewCount >= 1_000_000 || (daysOld <= 30 && viewCount >= 500_000)
}

// ── YouTube RSS channel feeds ─────────────────────────────────────────────────
// Verified Tamil YouTube channels (tested Apr 2026)
// strict=true channels require stronger trailer signals (no generic 'promo')
const CHANNELS = [
  { id: 'UCWb3iKyo49p2tXetOUa4iVw', name: 'Sun Pictures',        category: 'movie' as const, strict: false },
  { id: 'UCciiOyy3uemzbp6_gSMcSwA', name: 'Red Giant Movies',    category: 'movie' as const, strict: false },
  { id: 'UCA7gwgLgmCZ8DSmdf2bhb8g', name: 'Lyca Productions',    category: 'movie' as const, strict: false },
  { id: 'UCQmxcMxjYcBM5Pel4qUW2hA', name: 'Sony LIV Tamil',      category: 'movie' as const, strict: false },
  { id: 'UCMsAo0XUISOL6O1ek_3QWfg', name: 'Vels Film Intl',      category: 'movie' as const, strict: false },
  { id: 'UCdbalkQDqCcOsYG5c4L8TAw', name: 'Sathyajyothi Films',  category: 'movie' as const, strict: false },
  { id: 'UCBnxEdpoZwstJqC1yZpOjRA', name: 'Sun TV',              category: 'drama' as const, strict: true  },
  { id: 'UCvrhwpnp2DHYQ1CbXby9ypQ', name: 'Vijay TV',            category: 'drama' as const, strict: true  },
  { id: 'UC_wIGmvdyAQLtl-U2nHV9rg', name: 'Zee Tamil',           category: 'drama' as const, strict: true  },
]

// Movie channels: match any of these
const MOVIE_TRAILER_KW = [
  'trailer', 'teaser', 'first look', 'promo', 'motion poster',
  'video song', 'lyric video', 'audio launch', 'title announcement',
  'official trailer', 'official teaser', '#trailer', '#teaser', '#firstlook',
]
// Drama/serial channels: must be a new show launch, NOT episode promos
const DRAMA_TRAILER_KW = [
  'trailer', 'teaser', 'first look', 'title announcement', 'new serial',
  'launch', 'official trailer', 'official teaser', 'grand finale',
  'season', 'new show',
]
const HARD_SKIP = [
  '#shorts', 'full episode', 'full movie', 'reaction', 'live stream',
  'interview', 'press meet', 'behind the scenes', 'making of',
  'birthday wish', 'wishing', 'gaming', 'gta',
  'episode promo', '| epi', 'ep-', '| episode', 'next week in',
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  'jan ', 'feb ', 'mar ', 'apr ', 'may ', 'jun ', 'jul ', 'aug ', 'sep ', 'oct ', 'nov ', 'dec ',
]

function isTrailerVideo(title: string, strict: boolean): boolean {
  const t = title.toLowerCase()
  if (HARD_SKIP.some(k => t.includes(k))) return false
  const kws = strict ? DRAMA_TRAILER_KW : MOVIE_TRAILER_KW
  return kws.some(k => t.includes(k))
}

function decodeXml(s: string): string {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
}

async function fetchChannelFeed(
  channelId: string, channelName: string, category: Trailer['category'], strict = false
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

      if (!isTrailerVideo(title, strict)) continue

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
  { id: 's2', videoId: '96kAbj3IF3k', title: 'Thug Life - Official Trailer',      channel: 'Saregama Tamil',      thumbnail: 'https://i.ytimg.com/vi/96kAbj3IF3k/hqdefault.jpg', publishedAt: '2026-03-15', category: 'movie' },
  { id: 's3', videoId: '986VgJ9lLKw', title: 'Retro - Official Trailer',          channel: 'Red Giant Movies',    thumbnail: 'https://i.ytimg.com/vi/986VgJ9lLKw/hqdefault.jpg', publishedAt: '2026-03-01', category: 'movie' },
  { id: 's4', videoId: 'c9zWcnNR2q0', title: 'Good Bad Ugly - Official Trailer',  channel: 'Mythri Movie Makers', thumbnail: 'https://i.ytimg.com/vi/c9zWcnNR2q0/hqdefault.jpg', publishedAt: '2026-02-15', category: 'movie' },
  { id: 's5', videoId: '5TrJXfquXgE', title: 'Vidaamuyarchi - Official Trailer',  channel: 'Netflix India Tamil', thumbnail: 'https://i.ytimg.com/vi/5TrJXfquXgE/hqdefault.jpg', publishedAt: '2026-01-20', category: 'movie' },
  { id: 's6', videoId: 'YdYIUVP9RGU', title: 'Veera Dheera Sooran - Trailer',    channel: 'Sony LIV Tamil',      thumbnail: 'https://i.ytimg.com/vi/YdYIUVP9RGU/hqdefault.jpg', publishedAt: '2026-01-10', category: 'movie' },
]

// ── YouTube API search → Trailers ─────────────────────────────────────────────
const TITLE_DRAMA_KW = ['serial', 'drama', 'sun tv', 'vijay tv', 'zee tamil', 'star vijay']

async function fetchYouTubeApiTrailers(): Promise<Trailer[]> {
  if (!YT_API_KEY) return []

  // Run all search queries in parallel
  const allItems = await Promise.all(YT_SEARCH_QUERIES.map(fetchYouTubeSearch))
  const flat = allItems.flat()

  // Deduplicate by videoId
  const seen = new Set<string>()
  const unique: YTSearchItem[] = []
  for (const item of flat) {
    const vid = item.id?.videoId
    if (vid && !seen.has(vid)) {
      seen.add(vid)
      unique.push(item)
    }
  }

  // Filter for genuine trailers
  const filtered = unique.filter(item => {
    const t = item.snippet.title.toLowerCase()
    if (HARD_SKIP.some(k => t.includes(k))) return false
    return MOVIE_TRAILER_KW.some(k => t.includes(k))
  })

  if (filtered.length === 0) return []

  // Fetch real view counts for all found videos
  const videoIds = filtered.map(item => item.id.videoId)
  const statsMap = await fetchVideoStats(videoIds)

  // Build Trailer objects with view counts
  return filtered.slice(0, 12).map(item => {
    const videoId = item.id.videoId
    const title = item.snippet.title
    const viewCount = statsMap.get(videoId)
    const tLower = title.toLowerCase()
    const category: Trailer['category'] = TITLE_DRAMA_KW.some(k => tLower.includes(k)) ? 'drama' : 'movie'

    return {
      id: `ytapi-${videoId}`,
      videoId,
      title,
      channel: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails?.high?.url
        ?? item.snippet.thumbnails?.medium?.url
        ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      publishedAt: item.snippet.publishedAt,
      category,
      viewCount,
      viewLabel: viewCount !== undefined ? formatViews(viewCount) : undefined,
      trending: viewCount !== undefined ? isTrendingByViews(viewCount, item.snippet.publishedAt) : undefined,
    }
  })
}

// ── Server-side cache ─────────────────────────────────────────────────────────
let cache: { data: Trailer[]; fetchedAt: number } | null = null
const CACHE_TTL = 60 * 60 * 1000

export async function GET() {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return NextResponse.json(
      { trailers: cache.data, source: 'cached', count: cache.data.length, updatedAt: new Date(cache.fetchedAt).toISOString() },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600' } }
    )
  }

  // Fetch YouTube API trailers + RSS feeds in parallel
  const [ytApiTrailers, ...rssResults] = await Promise.allSettled([
    fetchYouTubeApiTrailers(),
    ...CHANNELS.map(ch => fetchChannelFeed(ch.id, ch.name, ch.category, ch.strict)),
  ])

  const apiTrailers = ytApiTrailers.status === 'fulfilled' ? ytApiTrailers.value : []

  const rssTrailers: Trailer[] = []
  for (const r of rssResults) {
    if (r.status === 'fulfilled') rssTrailers.push(...r.value)
  }

  // Deduplicate: API trailers first (they have view counts), then RSS
  const seen = new Set<string>()
  const deduped: Trailer[] = []

  for (const t of apiTrailers) {
    if (!seen.has(t.videoId)) { seen.add(t.videoId); deduped.push(t) }
  }
  for (const t of rssTrailers) {
    if (!seen.has(t.videoId)) { seen.add(t.videoId); deduped.push(t) }
  }

  // Sort: trending first, then by date
  deduped.sort((a, b) => {
    if (a.trending && !b.trending) return -1
    if (!a.trending && b.trending) return 1
    if (a.viewCount !== undefined && b.viewCount !== undefined) return b.viewCount - a.viewCount
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  })

  // Fill with seeds if needed
  const seeds = SEED_TRAILERS.filter(s => !seen.has(s.videoId))
  const merged = [...deduped, ...seeds].slice(0, 20)

  const source = apiTrailers.length > 0 ? 'youtube-api' : deduped.length > 0 ? 'youtube-rss' : 'seed'

  cache = { data: merged, fetchedAt: Date.now() }

  return NextResponse.json(
    { trailers: merged, source, count: merged.length, hasViewCounts: apiTrailers.length > 0, updatedAt: new Date().toISOString() },
    { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600' } }
  )
}
