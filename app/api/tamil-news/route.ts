/**
 * /api/tamil-news — trending Tamil news from RSS feeds
 * Sources: Dinamalar, Vikatan, The Hindu Tamil, OneIndia Tamil
 * No API key required — public RSS feeds
 */
import { NextResponse } from 'next/server'

export const revalidate = 900 // cache 15 min

const FEEDS = [
  {
    name: 'Dinamalar',
    color: '#dc2626',
    url: 'https://www.dinamalar.com/rss/news_rss.asp',
  },
  {
    name: 'Vikatan',
    color: '#f97316',
    url: 'https://www.vikatan.com/rss/news.xml',
  },
  {
    name: 'OneIndia Tamil',
    color: '#3b82f6',
    url: 'https://tamil.oneindia.com/rss/tamil-news-fb.xml',
  },
  {
    name: 'The Hindu Tamil',
    color: '#16a34a',
    url: 'https://www.thehindu.com/news/national/tamil-nadu/feeder/default.rss',
  },
]

function parseRSS(xml: string, source: string, color: string) {
  const items: { title: string; link: string; pubDate: string; source: string; color: string }[] = []
  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g)
  for (const [, block] of itemMatches) {
    const title = block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1]
      ?? block.match(/<title>(.*?)<\/title>/)?.[1]
      ?? ''
    const link = block.match(/<link>(.*?)<\/link>/)?.[1]
      ?? block.match(/<guid>(.*?)<\/guid>/)?.[1]
      ?? ''
    const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? ''
    if (title.trim()) {
      items.push({ title: title.trim(), link: link.trim(), pubDate, source, color })
    }
    if (items.length >= 5) break
  }
  return items
}

function timeAgo(pubDate: string): string {
  try {
    const d = new Date(pubDate)
    const diff = Date.now() - d.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  } catch {
    return ''
  }
}

export async function GET() {
  const results = await Promise.allSettled(
    FEEDS.map(async feed => {
      const res = await fetch(feed.url, {
        signal: AbortSignal.timeout(6000),
        headers: { 'User-Agent': 'NammaTamil/1.0 (RSS reader; nammatamil.live)' },
        next: { revalidate: 900 },
      })
      if (!res.ok) throw new Error(`${feed.name} ${res.status}`)
      const xml = await res.text()
      return parseRSS(xml, feed.name, feed.color)
    })
  )

  const allNews = results
    .flatMap((r, i) => r.status === 'fulfilled' ? r.value : [])
    .map(item => ({ ...item, timeAgo: timeAgo(item.pubDate) }))

  // Interleave sources so it's not all from one outlet
  const bySource: Record<string, typeof allNews> = {}
  for (const item of allNews) {
    if (!bySource[item.source]) bySource[item.source] = []
    bySource[item.source].push(item)
  }
  const interleaved: typeof allNews = []
  const maxLen = Math.max(...Object.values(bySource).map(a => a.length))
  for (let i = 0; i < maxLen; i++) {
    for (const arr of Object.values(bySource)) {
      if (arr[i]) interleaved.push(arr[i])
    }
  }

  return NextResponse.json({
    news: interleaved.slice(0, 20),
    sources: FEEDS.map(f => f.name),
    updatedAt: new Date().toISOString(),
  })
}
