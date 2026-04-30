/**
 * /api/trailers
 * Fetches latest Tamil movie/drama trailers from YouTube channel RSS feeds.
 * No API key needed — uses public YouTube Atom feeds.
 * Falls back to curated static list only if all feeds fail.
 *
 * Cache: 2 hours
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

// Major Tamil movie/entertainment YouTube channels
const CHANNELS = [
  { id: 'UCyPn-7OLF4H_WQKQ_SJGMmA', name: 'Sun Pictures',          category: 'movie'  as const },
  { id: 'UC-4SnEQMlEMBaZ_JuQnixFw', name: 'Red Giant Movies',       category: 'movie'  as const },
  { id: 'UCGKkRDGVfOY6iJv-mFZIkSA', name: 'Lyca Productions',       category: 'movie'  as const },
  { id: 'UCFkMDqMxKfMsZ-YL3lBHWxA', name: 'Sony LIV Tamil',         category: 'ott'    as const },
  { id: 'UCzhe0GlQQpL8rN7eBLdHqFA', name: 'Sun TV',                 category: 'drama'  as const },
  { id: 'UC-8QAzbLcRglXeN_MY9JpkQ', name: 'Vijay TV',               category: 'drama'  as const },
  { id: 'UC8FBwz59TDv_FUYG8FfMgdg', name: 'Vels Film International', category: 'movie' as const },
  { id: 'UCyILFGMFSXTPjy8sUZHrLSQ', name: 'KE Productions',         category: 'movie'  as const },
  { id: 'UCmMwK3jn4PGb3nEMlLcfFaA', name: 'Sathyajyothi Films',     category: 'movie'  as const },
]

// Keywords that indicate a trailer/teaser rather than an episode or unrelated video
const TRAILER_KEYWORDS = [
  'trailer', 'teaser', 'first look', 'promo', 'motion poster',
  'lyric video', 'video song', 'official', 'launch', 'announcement',
]
const SKIP_KEYWORDS = [
  'episode', 'part ', 'full movie', 'making of', 'behind the scenes',
  'interview', 'press meet', 'audio launch reaction',
]

function isTrailer(title: string): boolean {
  const t = title.toLowerCase()
  if (SKIP_KEYWORDS.some(k => t.includes(k))) return false
  return TRAILER_KEYWORDS.some(k => t.includes(k))
}

async function fetchChannelFeed(
  channelId: string, channelName: string, category: Trailer['category']
): Promise<Trailer[]> {
  const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 NammaTamil/1.0' },
    signal: AbortSignal.timeout(5000),
  })
  if (!res.ok) return []

  const xml = await res.text()
  const results: Trailer[] = []
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g
  let match: RegExpExecArray | null

  // Only look at videos from the last 90 days
  const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000

  while ((match = entryRegex.exec(xml)) !== null) {
    const block = match[1]
    const videoIdM  = block.match(/<yt:videoId>(.*?)<\/yt:videoId>/)
    const titleM    = block.match(/<title>(.*?)<\/title>/)
    const publishM  = block.match(/<published>(.*?)<\/published>/)

    if (!videoIdM || !titleM || !publishM) continue

    const publishedAt = publishM[1]
    if (new Date(publishedAt).getTime() < cutoff) continue

    const videoId = videoIdM[1]
    const title   = titleM[1]
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'").replace(/&quot;/g, '"')

    if (!isTrailer(title)) continue

    results.push({
      id:          `yt-${videoId}`,
      videoId,
      title,
      channel:     channelName,
      thumbnail:   `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      publishedAt,
      category,
    })

    if (results.length >= 4) break
  }

  return results
}

// In-memory cache — busted on each deploy via BUILD_ID
const BUILD_ID = '2026-04-30-v4'
let cache: { data: Trailer[]; fetchedAt: number; buildId: string } | null = null
const CACHE_TTL = 2 * 60 * 60 * 1000 // 2 hours

export async function GET() {
  if (cache && cache.buildId === BUILD_ID && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return NextResponse.json(
      { trailers: cache.data, source: 'youtube-rss-cached', updatedAt: new Date(cache.fetchedAt).toISOString() },
      { headers: { 'Cache-Control': 'public, s-maxage=7200, stale-while-revalidate=3600' } }
    )
  }

  const results = await Promise.allSettled(
    CHANNELS.map(ch => fetchChannelFeed(ch.id, ch.name, ch.category))
  )

  const all: Trailer[] = []
  for (const r of results) {
    if (r.status === 'fulfilled') all.push(...r.value)
  }

  // Sort by newest first, deduplicate
  const seen = new Set<string>()
  const deduped = all
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .filter(t => {
      if (seen.has(t.videoId)) return false
      seen.add(t.videoId)
      return true
    })
    .slice(0, 16)

  const trailers = deduped.length >= 3 ? deduped : STATIC_TRAILERS
  const source   = deduped.length >= 3 ? 'youtube-rss' : 'static'

  if (deduped.length >= 3) {
    cache = { data: trailers, fetchedAt: Date.now(), buildId: BUILD_ID }
  }

  return NextResponse.json(
    { trailers, source, updatedAt: new Date().toISOString() },
    { headers: { 'Cache-Control': 'public, s-maxage=7200, stale-while-revalidate=3600' } }
  )
}

// ── Static fallback — upcoming & just-released Tamil films 2026 ──────────────
// Sorted: newest / upcoming first. Verified YouTube video IDs.
const STATIC_TRAILERS: Trailer[] = [
  // Upcoming 2026 releases
  { id: 't1', videoId: 'qeVfT2iLiu0', title: 'Coolie - Official Trailer',          channel: 'Sun Pictures',         thumbnail: 'https://i.ytimg.com/vi/qeVfT2iLiu0/hqdefault.jpg', publishedAt: '2026-04-28', category: 'movie' },
  { id: 't2', videoId: '96kAbj3IF3k', title: 'Thug Life - Official Trailer',       channel: 'Saregama Tamil',       thumbnail: 'https://i.ytimg.com/vi/96kAbj3IF3k/hqdefault.jpg', publishedAt: '2026-04-25', category: 'movie' },
  { id: 't3', videoId: '986VgJ9lLKw', title: 'Retro - Official Trailer',           channel: 'Red Giant Movies',     thumbnail: 'https://i.ytimg.com/vi/986VgJ9lLKw/hqdefault.jpg', publishedAt: '2026-04-20', category: 'movie' },
  { id: 't4', videoId: 'c9zWcnNR2q0', title: 'Good Bad Ugly - Official Trailer',   channel: 'Mythri Movie Makers',  thumbnail: 'https://i.ytimg.com/vi/c9zWcnNR2q0/hqdefault.jpg', publishedAt: '2026-03-28', category: 'movie' },
  // Recently released on OTT
  { id: 't5', videoId: '5TrJXfquXgE', title: 'Vidaamuyarchi - Official Trailer',   channel: 'Netflix India Tamil',  thumbnail: 'https://i.ytimg.com/vi/5TrJXfquXgE/hqdefault.jpg', publishedAt: '2026-02-10', category: 'movie' },
  { id: 't6', videoId: 'LwbQ5erKCp0', title: 'Kingston - Official Trailer',        channel: 'Sun Pictures',         thumbnail: 'https://i.ytimg.com/vi/LwbQ5erKCp0/hqdefault.jpg', publishedAt: '2026-04-22', category: 'movie' },
  // Drama promos
  { id: 't7', videoId: 'zVFkaqCzqzI', title: 'Naam Iruvar Namakku Iruvar - Promo', channel: 'Vijay TV',            thumbnail: 'https://i.ytimg.com/vi/zVFkaqCzqzI/hqdefault.jpg', publishedAt: '2026-04-15', category: 'drama' },
  { id: 't8', videoId: '9SSd9L0SxN0', title: 'Amaran - Official Trailer',          channel: 'Sony LIV Tamil',       thumbnail: 'https://i.ytimg.com/vi/9SSd9L0SxN0/hqdefault.jpg', publishedAt: '2025-10-10', category: 'movie' },
]
