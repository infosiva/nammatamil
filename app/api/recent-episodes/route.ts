import { NextResponse } from 'next/server'

// YouTube channel IDs for major Tamil TV channels
const CHANNELS = [
  { id: 'UCzhe0GlQQpL8rN7eBLdHqFA', name: 'Sun TV',       color: '#dc2626' },
  { id: 'UC-8QAzbLcRglXeN_MY9JpkQ', name: 'Vijay TV',     color: '#f97316' },
  { id: 'UCuHOFRgL3kIqE_IjSCHdHwA', name: 'Zee Tamil',    color: '#7c3aed' },
  { id: 'UCEj3RtyvGp7oNnjzJnsFXsA', name: 'Colors Tamil', color: '#ec4899' },
]

interface Episode {
  id: string
  title: string
  videoId: string
  channelName: string
  channelColor: string
  publishedAt: string
  thumbnail: string
}

// In-memory cache: { data, fetchedAt }
let cache: { data: Episode[]; fetchedAt: number } | null = null
const CACHE_TTL = 6 * 60 * 60 * 1000 // 6 hours

async function fetchChannelFeed(channelId: string, channelName: string, color: string): Promise<Episode[]> {
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
  const res = await fetch(feedUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 NammaTamil/1.0' },
    next: { revalidate: 21600 }, // Next.js cache 6h
  })
  if (!res.ok) return []

  const xml = await res.text()

  // Parse <entry> blocks from Atom feed
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
    const publishedMs = new Date(publishedAt).getTime()
    if (publishedMs < sevenDaysAgo) continue // only last 7 days

    const videoId = videoIdMatch[1]
    const title   = titleMatch[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')

    entries.push({
      id: videoId,
      title,
      videoId,
      channelName,
      channelColor: color,
      publishedAt,
      thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
    })

    if (entries.length >= 3) break // max 3 per channel
  }

  return entries
}

export async function GET() {
  // Serve from cache if fresh
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return NextResponse.json({ episodes: cache.data, cached: true })
  }

  try {
    const results = await Promise.allSettled(
      CHANNELS.map(ch => fetchChannelFeed(ch.id, ch.name, ch.color))
    )

    const episodes: Episode[] = []
    for (const r of results) {
      if (r.status === 'fulfilled') episodes.push(...r.value)
    }

    // Sort by published date descending, keep top 12
    episodes.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    const top = episodes.slice(0, 12)

    // If we got results, update cache
    if (top.length > 0) {
      cache = { data: top, fetchedAt: Date.now() }
    }

    // Fallback to cache even if stale when fetch returns nothing
    const data = top.length > 0 ? top : (cache?.data ?? FALLBACK_EPISODES)

    return NextResponse.json({ episodes: data, cached: false })
  } catch {
    // Return stale cache or fallback on error
    return NextResponse.json({ episodes: cache?.data ?? FALLBACK_EPISODES, cached: true, error: 'fetch_failed' })
  }
}

// Static fallback in case YouTube feeds are unavailable
const FALLBACK_EPISODES: Episode[] = [
  { id: 'fb1', title: 'Pandian Stores Latest Episode',    videoId: 'PLFMg3Wg8v7g', channelName: 'Vijay TV',     channelColor: '#f97316', publishedAt: new Date().toISOString(), thumbnail: 'https://img.youtube.com/vi/PLFMg3Wg8v7g/mqdefault.jpg' },
  { id: 'fb2', title: 'Baakiyalakshmi Latest Episode',    videoId: '5-GkuN8QT6E',  channelName: 'Vijay TV',     channelColor: '#f97316', publishedAt: new Date().toISOString(), thumbnail: 'https://img.youtube.com/vi/5-GkuN8QT6E/mqdefault.jpg'  },
  { id: 'fb3', title: 'Raja Rani S2 Latest Episode',      videoId: 'fFDolUh5mXw',  channelName: 'Zee Tamil',    channelColor: '#7c3aed', publishedAt: new Date().toISOString(), thumbnail: 'https://img.youtube.com/vi/fFDolUh5mXw/mqdefault.jpg'  },
  { id: 'fb4', title: 'Chithi Latest Episode',            videoId: 'dY8K5PdZBQk',  channelName: 'Sun TV',       channelColor: '#dc2626', publishedAt: new Date().toISOString(), thumbnail: 'https://img.youtube.com/vi/dY8K5PdZBQk/mqdefault.jpg'  },
  { id: 'fb5', title: 'Anandham Latest Episode',          videoId: 'mHSoNLpHKBI',  channelName: 'Sun TV',       channelColor: '#dc2626', publishedAt: new Date().toISOString(), thumbnail: 'https://img.youtube.com/vi/mHSoNLpHKBI/mqdefault.jpg'  },
  { id: 'fb6', title: 'Rettai Roja Latest Episode',       videoId: '2V9UiWnSi1c',  channelName: 'Colors Tamil', channelColor: '#ec4899', publishedAt: new Date().toISOString(), thumbnail: 'https://img.youtube.com/vi/2V9UiWnSi1c/mqdefault.jpg'  },
]
