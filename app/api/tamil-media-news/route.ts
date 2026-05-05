/**
 * /api/tamil-media-news — Live Tamil Media News Feed
 *
 * Priority order:
 *   PRIMARY  — Tamil-language sources (Dinamalar, Maalaimalar, OneIndia Tamil,
 *               Vikatan, Puthiya Thalaimurai) — scored +20 source bonus
 *   SECONDARY — English sources (The Hindu TN, NDTV, India Today)
 *
 * Pipeline:
 *   1. Fetch RSS from all sources in parallel (5s timeout each)
 *   2. Extract image URLs from media:content / enclosure / <img> in description
 *   3. Categorize: politics / cinema / sports by keyword
 *   4. Sort: by (source bonus + recency) — Tamil sources float to top
 *   5. Deduplicate by title similarity
 *   6. Return top 60 items as { news, updatedAt, count }
 *
 * Cache: 5 minutes server-side
 */
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// ── RSS sources — Tamil-language FIRST ──────────────────────────────────────
const FEEDS: Array<{ name: string; url: string; tamil: boolean; logoColor: string }> = [
  // ── PRIMARY: Tamil-language sources ──
  { name: 'Dinamalar',          url: 'https://www.dinamalar.com/rss/news_rss.asp',              tamil: true,  logoColor: '#e11d48' },
  { name: 'Maalaimalar',        url: 'https://www.maalaimalar.com/rss/news.xml',                tamil: true,  logoColor: '#7c3aed' },
  { name: 'OneIndia Tamil',     url: 'https://tamil.oneindia.com/rss/tamil-news-fb.xml',        tamil: true,  logoColor: '#0891b2' },
  { name: 'Vikatan',            url: 'https://www.vikatan.com/rss/news.xml',                    tamil: true,  logoColor: '#d97706' },
  { name: 'Puthiya Thalaimurai', url: 'https://www.puthiyathalaimurai.com/rss.xml',             tamil: true,  logoColor: '#dc2626' },
  { name: 'Sun News',           url: 'https://www.sunnews.in/feed/',                            tamil: true,  logoColor: '#f59e0b' },
  { name: 'Polimer News',       url: 'https://www.polimernews.com/rss.xml',                     tamil: true,  logoColor: '#16a34a' },
  // ── SECONDARY: English sources covering TN ──
  { name: 'The Hindu Tamil',    url: 'https://www.thehindu.com/news/national/tamil-nadu/feeder/default.rss', tamil: false, logoColor: '#1d4ed8' },
  { name: 'NDTV India',         url: 'https://feeds.feedburner.com/ndtvnews-south-mids',        tamil: false, logoColor: '#dc2626' },
  { name: 'India Today',        url: 'https://www.indiatoday.in/rss/1206577',                   tamil: false, logoColor: '#d97706' },
]

// ── Category keywords ────────────────────────────────────────────────────────
const POLITICS_KW = [
  'அரசியல்', 'கூட்டணி', 'ஆட்சி', 'முதலமைச்சர்', 'ராஜ்பவன்', 'தேர்தல்',
  'tvk', 'vijay', 'dmk', 'aiadmk', 'bjp', 'pmk', 'congress',
  'election', 'coalition', 'government', 'minister', 'chief minister',
  'assembly', 'parliament', 'vote', 'political', 'party', 'mla',
  'governor', 'cm', 'பாஜக', 'திமுக', 'அதிமுக',
]

const CINEMA_KW = [
  'திரைப்படம்', 'சினிமா', 'நடிகர்', 'நடிகை', 'இயக்குனர்', 'இசை',
  'movie', 'film', 'actor', 'actress', 'director', 'cinema', 'trailer',
  'release', 'ott', 'serial', 'series', 'tv show', 'music', 'song',
  'kollywood', 'rajinikanth', 'kamal', 'dhanush', 'ajith', 'suriya',
  'thalapathy', 'vikram', 'sivakarthikeyan',
]

const SPORTS_KW = [
  'விளையாட்டு', 'கிரிக்கெட்', 'கால்பந்து',
  'cricket', 'ipl', 'football', 'sports', 'match', 'tournament',
  'championship', 'player', 'team', 'score', 'wicket', 'goal',
  'chennai super kings', 'csk',
]

function categorize(title: string, desc: string): 'politics' | 'cinema' | 'sports' | 'general' {
  const text = (title + ' ' + desc).toLowerCase()
  const politicsScore = POLITICS_KW.filter(kw => text.includes(kw.toLowerCase())).length
  const cinemaScore   = CINEMA_KW.filter(kw => text.includes(kw.toLowerCase())).length
  const sportsScore   = SPORTS_KW.filter(kw => text.includes(kw.toLowerCase())).length
  const max = Math.max(politicsScore, cinemaScore, sportsScore)
  if (max === 0) return 'general'
  if (politicsScore === max) return 'politics'
  if (cinemaScore   === max) return 'cinema'
  return 'sports'
}

function extractImage(block: string): string | null {
  // media:content url="..."
  const media = block.match(/media:content[^>]+url=["']([^"']+)["']/i)?.[1]
  if (media) return media

  // enclosure url="..." type="image/..."
  const enclosure = block.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]+type=["']image[^"']*["']/i)?.[1]
    ?? block.match(/<enclosure[^>]+type=["']image[^"']*["'][^>]+url=["']([^"']+)["']/i)?.[1]
  if (enclosure) return enclosure

  // <img src="..."> in description CDATA
  const img = block.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1]
  if (img && img.startsWith('http')) return img

  return null
}

function timeAgo(dateStr: string): string {
  try {
    const ms = Date.now() - new Date(dateStr).getTime()
    if (ms < 0) return 'just now'
    const min = Math.floor(ms / 60000)
    if (min < 1)  return 'just now'
    if (min < 60) return `${min}m ago`
    const hr = Math.floor(min / 60)
    if (hr < 24)  return `${hr}h ago`
    return `${Math.floor(hr / 24)}d ago`
  } catch { return '' }
}

function cleanHtml(s: string): string {
  return s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ').trim()
}

interface RawItem {
  title: string
  link: string
  pubDate: string
  desc: string
  imageUrl: string | null
  source: string
  sourceLogo: string
  tamilSource: boolean
}

function parseRSS(xml: string, source: string, logoColor: string, tamil: boolean): RawItem[] {
  const items: RawItem[] = []
  for (const [, block] of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const title = cleanHtml(
      block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1] ??
      block.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? ''
    )

    const link = (
      block.match(/<link>(https?:[^<\s]+)<\/link>/)?.[1] ??
      block.match(/<link><!\[CDATA\[(https?:[^<]+)\]\]><\/link>/)?.[1] ??
      block.match(/<guid[^>]*>(https?:[^<]+)<\/guid>/)?.[1] ?? ''
    ).trim()

    const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? ''

    const desc = cleanHtml(
      block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1] ??
      block.match(/<description>([\s\S]*?)<\/description>/)?.[1] ?? ''
    ).slice(0, 250)

    const imageUrl = extractImage(block)

    if (!title || title.length < 8) continue

    items.push({ title, link, pubDate, desc, imageUrl, source, sourceLogo: logoColor, tamilSource: tamil })
  }
  return items
}

// ── In-memory cache ──────────────────────────────────────────────────────────
let cache: { data: object; at: number } | null = null
const CACHE_TTL = 5 * 60 * 1000 // 5 min

async function fetchFeed(feed: typeof FEEDS[0]): Promise<RawItem[]> {
  try {
    const res = await fetch(feed.url, {
      signal: AbortSignal.timeout(6000),
      headers: { 'User-Agent': 'NammaTamil RSS Reader/1.0' },
    })
    if (!res.ok) return []
    const xml = await res.text()
    return parseRSS(xml, feed.name, feed.logoColor, feed.tamil)
  } catch { return [] }
}

// Simple dedup: remove items where title is >85% similar to an earlier title
function dedup(items: RawItem[]): RawItem[] {
  const seen: string[] = []
  return items.filter(item => {
    const norm = item.title.toLowerCase().replace(/[^a-z0-9\u0b80-\u0bff]/g, '').slice(0, 60)
    if (seen.some(s => {
      const overlap = [...norm].filter((c, i) => s[i] === c).length
      return overlap / Math.max(norm.length, s.length, 1) > 0.8
    })) return false
    seen.push(norm)
    return true
  })
}

export async function GET() {
  // Serve from cache if fresh
  if (cache && Date.now() - cache.at < CACHE_TTL) {
    return NextResponse.json(cache.data, { headers: { 'X-Cache': 'HIT' } })
  }

  // Fetch all feeds in parallel
  const results = await Promise.allSettled(FEEDS.map(fetchFeed))
  const allItems: RawItem[] = results.flatMap(r => r.status === 'fulfilled' ? r.value : [])

  // Sort: Tamil sources first (+30 boost), then by recency
  const now = Date.now()
  const sorted = allItems
    .map(item => {
      const age = now - (item.pubDate ? new Date(item.pubDate).getTime() : 0)
      const ageHours = Math.max(0, age / 3600000)
      // Score: tamil bonus + recency (fresher = higher)
      const score = (item.tamilSource ? 30 : 0) + Math.max(0, 72 - ageHours)
      return { item, score }
    })
    .sort((a, b) => b.score - a.score)
    .map(x => x.item)

  // Dedup, then take top 60
  const unique = dedup(sorted).slice(0, 60)

  const news = unique.map(item => ({
    title:      item.title,
    link:       item.link,
    source:     item.source,
    sourceLogo: item.sourceLogo,
    pubDate:    item.pubDate,
    timeAgo:    timeAgo(item.pubDate),
    desc:       item.desc,
    imageUrl:   item.imageUrl,
    category:   categorize(item.title, item.desc),
  }))

  const data = { news, updatedAt: new Date().toISOString(), count: news.length }
  cache = { data, at: Date.now() }

  return NextResponse.json(data)
}
