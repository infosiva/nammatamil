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
  // ── Tamil-language sources (priority) ──
  { name: 'Dinamalar',       url: 'https://www.dinamalar.com/rss/news_rss.asp',                               lang: 'ta' },
  { name: 'OneIndia Tamil',  url: 'https://tamil.oneindia.com/rss/tamil-news-fb.xml',                         lang: 'ta' },
  { name: 'Vikatan',         url: 'https://www.vikatan.com/rss/news.xml',                                     lang: 'ta' },
  { name: 'Puthiyathalaimurai', url: 'https://www.puthiyathalaimurai.com/feed',                               lang: 'ta' },
  // ── English-language sources (fallback) ──
  { name: 'The Hindu TN',    url: 'https://www.thehindu.com/news/national/tamil-nadu/feeder/default.rss',     lang: 'en' },
  { name: 'The Hindu Elect', url: 'https://www.thehindu.com/elections/tamil-nadu/feeder/default.rss',         lang: 'en' },
  { name: 'India Today',     url: 'https://www.indiatoday.in/rss/1206577',                                    lang: 'en' },
  { name: 'NDTV',            url: 'https://feeds.feedburner.com/ndtvnews-top-stories',                        lang: 'en' },
]

// TVK/Vijay keywords — government formation phase (May 2026)
const HIGH_SCORE  = [
  'TVK', 'Tamilaga Vettri Kazhagam',
  'oath ceremony', 'swearing in', 'sworn in', 'Vijay sworn', 'CM oath',
  'Chief Minister Vijay', 'CM Vijay', 'Vijay CM', 'Thalapathy CM',
  'government formation', 'cabinet', 'ministers', 'Vijay cabinet',
  'Congress backs', 'PMK supports', 'AIADMK split', 'outside support',
  'Nehru Indoor Stadium', 'May 7',
  'முதலமைச்சர் விஜய்', 'விஜய் பதவியேற்பு', 'அமைச்சரவை',
]
const MED_SCORE   = [
  'Vijay', 'Thalapathy', 'TVK government', 'Tamil Nadu government',
  'coalition', 'support', 'alliance', 'hung assembly',
  'PMK', 'Congress', 'AIADMK', 'VCK', 'CPI', 'governor',
  'TN election', 'election 2026', 'majority',
  'விஜய்', 'தலபதி', 'தமிழக அரசு',
]
const LOW_SCORE   = [
  'DMK', 'Stalin', 'Tamil Nadu politics', 'assembly', 'MLA',
  'minister', 'political', 'அரசியல்',
]

function scoreItem(title: string, desc: string): number {
  const text = (title + ' ' + desc).toLowerCase()
  let score = 0
  for (const kw of HIGH_SCORE) if (text.includes(kw.toLowerCase())) score += 10
  for (const kw of MED_SCORE)  if (text.includes(kw.toLowerCase())) score += 4
  for (const kw of LOW_SCORE)  if (text.includes(kw.toLowerCase())) score += 1
  return score
}

function isTamil(text: string): boolean {
  // Unicode range for Tamil script: U+0B80–U+0BFF
  return /[\u0B80-\u0BFF]/.test(text)
}

function parseRSS(xml: string, source: string, feedLang: string) {
  const items: Array<{
    title: string; link: string; pubDate: string; desc: string; source: string; score: number; lang: string
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

    // Detect actual language from content (Tamil Unicode chars = Tamil regardless of feed lang)
    const lang = isTamil(title) ? 'ta' : (isTamil(desc) ? 'ta' : feedLang)

    items.push({ title, link, pubDate, desc, source, score, lang })
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

// ── Static fallback — May 6 2026 (updated: CM oath tomorrow) ────────────────
const STATIC_HEADLINES = [
  { title: 'Thalapathy Vijay to be sworn in as Tamil Nadu CM on May 7 at Nehru Indoor Stadium', source: 'NammaTamil', isHot: true,  lang: 'en', link: '', timeAgo: 'Today' },
  { title: 'TVK wins 108 seats — Congress, PMK, AIADMK breakaway pledge support to cross 118 majority', source: 'NammaTamil', isHot: true,  lang: 'en', link: '', timeAgo: 'Today' },
  { title: 'AIADMK split: 35 of 47 MLAs to support Vijay government formation', source: 'NammaTamil', isHot: true,  lang: 'en', link: '', timeAgo: 'Today' },
  { title: 'PMK (4 seats) and Congress (5 seats) officially back TVK — coalition exceeds majority', source: 'NammaTamil', isHot: false, lang: 'en', link: '', timeAgo: 'Today' },
  { title: 'Tamil Nadu gets first non-DMK/AIADMK CM since 1977 — historic TVK mandate', source: 'NammaTamil', isHot: false, lang: 'en', link: '', timeAgo: 'Today' },
]

// Simple cache
let cache: { data: unknown; fetchedAt: number } | null = null
const CACHE_TTL = 2 * 60 * 1000

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
      return parseRSS(xml, feed.name, feed.lang)
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

  // Sort: Tamil first → then by score → then by recency
  deduped.sort((a, b) => {
    const langA = a.lang === 'ta' ? 0 : 1
    const langB = b.lang === 'ta' ? 0 : 1
    if (langA !== langB) return langA - langB
    if (b.score !== a.score) return b.score - a.score
    const da = new Date(a.pubDate).getTime() || 0
    const db = new Date(b.pubDate).getTime() || 0
    return db - da
  })

  // Take top 5 Tamil + fill remainder with English up to 20
  const tamil   = deduped.filter(i => i.lang === 'ta').slice(0, 20)
  const english = deduped.filter(i => i.lang !== 'ta').slice(0, 20 - tamil.length)
  const merged  = [...tamil, ...english]

  const news = merged.slice(0, 20).map(item => ({
    title:   item.title,
    link:    item.link,
    source:  item.source,
    pubDate: item.pubDate,
    timeAgo: timeAgo(item.pubDate),
    desc:    item.desc,
    score:   item.score,
    isHot:   item.score >= 10,
    lang:    item.lang,
  }))

  // If RSS feeds returned nothing relevant, use static fallback
  const finalNews = news.length > 0 ? news : STATIC_HEADLINES.map((h, i) => ({
    ...h, pubDate: new Date().toISOString(), desc: '', score: 10 - i,
  }))

  const data = {
    news:       finalNews,
    updatedAt:  new Date().toISOString(),
    totalFound: allItems.length,
  }

  cache = { data, fetchedAt: now }
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
}
