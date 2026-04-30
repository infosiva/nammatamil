import { NextResponse } from 'next/server'

// YouTube channel IDs for major Tamil TV channels
const CHANNEL_MAP: Record<string, { id: string; color: string }> = {
  'Sun TV':       { id: 'UCzhe0GlQQpL8rN7eBLdHqFA', color: '#f97316' },
  'Vijay TV':     { id: 'UC-8QAzbLcRglXeN_MY9JpkQ', color: '#3b82f6' },
  'Star Vijay':   { id: 'UC-8QAzbLcRglXeN_MY9JpkQ', color: '#8b5cf6' },
  'Zee Tamil':    { id: 'UCuHOFRgL3kIqE_IjSCHdHwA', color: '#7c3aed' },
  'Colors Tamil': { id: 'UCEj3RtyvGp7oNnjzJnsFXsA', color: '#ec4899' },
}

// All channels list (for the general feed)
const ALL_CHANNELS = Object.entries(CHANNEL_MAP)
  .filter((v, i, arr) => arr.findIndex(x => x[1].id === v[1].id) === i) // dedupe by ID
  .map(([name, { id, color }]) => ({ name, id, color }))

export interface Episode {
  id: string
  title: string
  videoId: string
  channelName: string
  channelColor: string
  publishedAt: string
  thumbnail: string
}

// In-memory cache per channel
const channelCache = new Map<string, { data: Episode[]; fetchedAt: number }>()
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

async function fetchChannelFeed(channelId: string, channelName: string, color: string): Promise<Episode[]> {
  const cached = channelCache.get(channelId)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) return cached.data

  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
  const res = await fetch(feedUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 NammaTamil/1.0' },
    signal: AbortSignal.timeout(5000),
  })
  if (!res.ok) return channelCache.get(channelId)?.data ?? []

  const xml = await res.text()
  const entries: Episode[] = []
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g
  let match: RegExpExecArray | null

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000

  while ((match = entryRegex.exec(xml)) !== null) {
    const block = match[1]
    const videoIdMatch = block.match(/<yt:videoId>(.*?)<\/yt:videoId>/)
    const titleMatch   = block.match(/<title>(.*?)<\/title>/)
    const publishMatch = block.match(/<published>(.*?)<\/published>/)

    if (!videoIdMatch || !titleMatch || !publishMatch) continue

    const publishedAt = publishMatch[1]
    if (new Date(publishedAt).getTime() < sevenDaysAgo) continue

    const videoId = videoIdMatch[1]
    const title   = titleMatch[1]
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'").replace(/&quot;/g, '"')

    entries.push({
      id: videoId,
      title,
      videoId,
      channelName,
      channelColor: color,
      publishedAt,
      thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
    })
  }

  channelCache.set(channelId, { data: entries, fetchedAt: Date.now() })
  return entries
}

// Score a video title against a serial name — returns 0..1
function matchScore(videoTitle: string, serialTitle: string): number {
  const vt = videoTitle.toLowerCase()
  const st = serialTitle.toLowerCase()

  // Exact serial name in title
  if (vt.includes(st)) return 1.0

  // All words of serial name present
  const words = st.split(/\s+/).filter(w => w.length > 2)
  const matchedWords = words.filter(w => vt.includes(w))
  if (words.length > 0 && matchedWords.length === words.length) return 0.9

  // Majority of words match
  if (words.length > 0 && matchedWords.length / words.length >= 0.6) return 0.6

  return 0
}

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const serialTitle   = searchParams.get('serial')   // e.g. "Pandian Stores"
  const channelName   = searchParams.get('channel')  // e.g. "Vijay TV"
  const limitParam    = searchParams.get('limit')
  const limit = Math.min(parseInt(limitParam ?? '6', 10), 12)

  // ── Per-serial mode ──────────────────────────────────────────────────────
  if (serialTitle && channelName) {
    const ch = CHANNEL_MAP[channelName] ?? CHANNEL_MAP['Sun TV']
    const allVideos = await fetchChannelFeed(ch.id, channelName, ch.color)

    const scored = allVideos
      .map(ep => ({ ep, score: matchScore(ep.title, serialTitle) }))
      .filter(x => x.score > 0)
      .sort((a, b) => {
        // Sort by: score desc, then publishedAt desc
        if (b.score !== a.score) return b.score - a.score
        return new Date(b.ep.publishedAt).getTime() - new Date(a.ep.publishedAt).getTime()
      })
      .slice(0, limit)
      .map(x => x.ep)

    return NextResponse.json({
      episodes: scored,
      serialTitle,
      channelName,
      source: scored.length > 0 ? 'youtube-rss' : 'no-match',
    }, { headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600' } })
  }

  // ── General feed mode (home page) ────────────────────────────────────────
  try {
    const results = await Promise.allSettled(
      ALL_CHANNELS.map(ch => fetchChannelFeed(ch.id, ch.name, ch.color))
    )

    const episodes: Episode[] = []
    for (const r of results) {
      if (r.status === 'fulfilled') episodes.push(...r.value.slice(0, 3))
    }

    episodes.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    const top = episodes.slice(0, limit)

    return NextResponse.json({
      episodes: top.length > 0 ? top : FALLBACK_EPISODES,
      source: top.length > 0 ? 'youtube-rss' : 'fallback',
    }, { headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600' } })
  } catch {
    return NextResponse.json({ episodes: FALLBACK_EPISODES, source: 'fallback' })
  }
}

// Static fallback in case YouTube feeds are unavailable
const FALLBACK_EPISODES: Episode[] = [
  { id: 'fb1', title: 'Pandian Stores Latest Episode',    videoId: 'PLFMg3Wg8v7g', channelName: 'Vijay TV',     channelColor: '#3b82f6', publishedAt: new Date().toISOString(), thumbnail: 'https://img.youtube.com/vi/PLFMg3Wg8v7g/mqdefault.jpg' },
  { id: 'fb2', title: 'Baakiyalakshmi Latest Episode',    videoId: '5-GkuN8QT6E',  channelName: 'Vijay TV',     channelColor: '#3b82f6', publishedAt: new Date().toISOString(), thumbnail: 'https://img.youtube.com/vi/5-GkuN8QT6E/mqdefault.jpg'  },
  { id: 'fb3', title: 'Naam Iruvar Oru Kudumbu Episode',  videoId: 'fFDolUh5mXw',  channelName: 'Sun TV',       channelColor: '#f97316', publishedAt: new Date().toISOString(), thumbnail: 'https://img.youtube.com/vi/fFDolUh5mXw/mqdefault.jpg'  },
  { id: 'fb4', title: 'Annamalai Latest Episode',         videoId: 'dY8K5PdZBQk',  channelName: 'Sun TV',       channelColor: '#f97316', publishedAt: new Date().toISOString(), thumbnail: 'https://img.youtube.com/vi/dY8K5PdZBQk/mqdefault.jpg'  },
]
