/**
 * /api/tvk-news — Real-time TVK / Vijay / TN Election 2026 news
 *
 * Scrapes multiple RSS feeds and filters for TVK-relevant content.
 * Returns ranked news items, most TVK-relevant first.
 * Cache: 5 min (news moves fast around election time)
 */
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const FEEDS = [
  { name: 'The Hindu TN',   url: 'https://www.thehindu.com/news/national/tamil-nadu/feeder/default.rss' },
  { name: 'The Hindu',      url: 'https://www.thehindu.com/elections/tamil-nadu/feeder/default.rss' },
  { name: 'Dinamalar',      url: 'https://www.dinamalar.com/rss/news_rss.asp' },
  { name: 'OneIndia Tamil', url: 'https://tamil.oneindia.com/rss/tamil-news-fb.xml' },
  { name: 'India Today',    url: 'https://www.indiatoday.in/rss/1206577' },
  { name: 'NDTV',           url: 'https://feeds.feedburner.com/ndtvnews-top-stories' },
]

// TVK/Vijay relevance keywords — tiered scoring
const HIGH_SCORE  = ['TVK', 'Tamilaga Vettri Kazhagam', 'Vijay wins', 'Thalapathy wins', 'TVK wins', 'TVK leads']
const MED_SCORE   = ['Vijay', 'Thalapathy', 'election 2026', 'TN election', 'Tamil Nadu election', 'exit poll', 'counting', 'results']
const LOW_SCORE   = ['DMK', 'AIADMK', 'Stalin', 'Tamil Nadu politics', 'assembly', 'constituency', 'voting']

function scoreItem(title: string, desc: string): number {
  const text = (title + ' ' + desc).toLowerCase()
  let score = 0
  for (const kw of HIGH_SCORE) if (text.includes(kw.toLowerCase())) score += 10
  for (const kw of MED_SCORE)  if (text.includes(kw.toLowerCase())) score += 4
  for (const kw of LOW_SCORE)  if (text.includes(kw.toLowerCase())) score += 1
  return score
}

function parseRSS(xml: string, source: string) {
  const items: Array<{
    title: string; link: string; pubDate: string; desc: string; source: string; score: number
  }> = []

  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g)
  for (const [, block] of itemMatches) {
    const title = (
      block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1] ??
      block.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? ''
    ).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim()

    const link = (
      block.match(/<link>(https?:[^<]+)<\/link>/)?.[1] ??
      block.match(/<guid[^>]*>(https?:[^<]+)<\/guid>/)?.[1] ?? ''
    ).trim()

    const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? ''

    const desc = (
      block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1] ??
      block.match(/<description>([\s\S]*?)<\/description>/)?.[1] ?? ''
    ).replace(/<[^>]+>/g, '').trim().slice(0, 200)

    if (!title || title.length < 10) continue

    const score = scoreItem(title, desc)
    if (score === 0) continue // skip totally irrelevant items

    items.push({ title, link, pubDate, desc, source, score })
    if (items.length >= 15) break
  }
  return items
}

function timeAgo(pubDate: string): string {
  try {
    const d = new Date(pubDate)
    if (isNaN(d.getTime())) return 'Today'
    const diff = Date.now() - d.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 2)  return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  } catch { return 'Today' }
}

// Simple cache
let cache: { data: unknown; fetchedAt: number } | null = null
const CACHE_TTL = 5 * 60 * 1000

export async function GET() {
  const now = Date.now()
  if (cache && now - cache.fetchedAt < CACHE_TTL) {
    return NextResponse.json({ ...cache.data as object, cached: true }, { headers: { 'Cache-Control': 'no-store' } })
  }

  const results = await Promise.allSettled(
    FEEDS.map(async feed => {
      const res = await fetch(feed.url, {
        signal: AbortSignal.timeout(5000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; NammaTVK/1.0; +https://nammatamil.live)',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        },
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(`${feed.name}: ${res.status}`)
      const xml = await res.text()
      return parseRSS(xml, feed.name)
    })
  )

  const allItems = results.flatMap(r => r.status === 'fulfilled' ? r.value : [])

  // De-dupe by title similarity and sort by score desc, then recency
  const seen = new Set<string>()
  const deduped = allItems.filter(item => {
    const key = item.title.toLowerCase().slice(0, 60)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  deduped.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    const da = new Date(a.pubDate).getTime() || 0
    const db = new Date(b.pubDate).getTime() || 0
    return db - da
  })

  const news = deduped.slice(0, 20).map(item => ({
    title:   item.title,
    link:    item.link,
    source:  item.source,
    pubDate: item.pubDate,
    timeAgo: timeAgo(item.pubDate),
    desc:    item.desc,
    score:   item.score,
    isHot:   item.score >= 10,
  }))

  const data = {
    news,
    updatedAt:  new Date().toISOString(),
    totalFound: allItems.length,
  }

  cache = { data, fetchedAt: now }
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
}
