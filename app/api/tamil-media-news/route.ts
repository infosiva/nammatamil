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
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/ratelimit'

export const dynamic = 'force-dynamic'
export const revalidate = 120 // 2 min Vercel CDN cache

// ── RSS sources — Tamil-language FIRST (URLs verified 2026-05-10) ───────────
const FEEDS: Array<{ name: string; url: string; tamil: boolean; logoColor: string; tvk?: boolean }> = [
  // ── TIER 1: TVK / Vijay politics (highest priority) ──
  { name: 'NammaTVK',            url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCFyeng5nb_HTtg1WxHl5pFA', tamil: true,  logoColor: '#f59e0b', tvk: true },
  { name: 'Puthiya Thalaimurai', url: 'https://www.puthiyathalaimurai.com/feed/',                            tamil: true,  logoColor: '#dc2626', tvk: false },
  { name: 'Polimer News',        url: 'https://www.polimernews.com/feed/',                                   tamil: true,  logoColor: '#16a34a', tvk: false },
  // ── TIER 2: Primary Tamil news ──
  { name: 'Vikatan',             url: 'https://www.vikatan.com/feed',                                        tamil: true,  logoColor: '#d97706' },
  { name: 'Maalaimalar',         url: 'https://www.maalaimalar.com/feed',                                    tamil: true,  logoColor: '#7c3aed' },
  { name: 'OneIndia Tamil',      url: 'https://tamil.oneindia.com/rss/tamil-news-fb.xml',                    tamil: true,  logoColor: '#0891b2' },
  { name: 'Dinamalar',           url: 'https://www.dinamalar.com/rss.asp',                                   tamil: true,  logoColor: '#e11d48' },
  { name: 'Kalaignar News',      url: 'https://kalaignarnews.com/feed/',                                     tamil: true,  logoColor: '#ef4444' },
  { name: 'Sun News',            url: 'https://www.sunnews.in/feed/',                                        tamil: true,  logoColor: '#f59e0b' },
  { name: 'Thanthi TV',          url: 'https://www.thanthitv.com/feed/',                                     tamil: true,  logoColor: '#f97316' },
  // ── TIER 3: English sources covering TN ──
  { name: 'The Hindu Tamil',     url: 'https://www.thehindu.com/news/national/tamil-nadu/feeder/default.rss', tamil: false, logoColor: '#1d4ed8' },
  { name: 'NDTV India',          url: 'https://feeds.feedburner.com/ndtvnews-south-mids',                    tamil: false, logoColor: '#dc2626' },
  { name: 'India Today',         url: 'https://www.indiatoday.in/rss/1206577',                               tamil: false, logoColor: '#d97706' },
  // ── TIER 4: Sports / IPL ──
  { name: 'CricBuzz',            url: 'https://www.cricbuzz.com/rss/cricket-news',                           tamil: false, logoColor: '#16a34a' },
  { name: 'ESPN Cricinfo',       url: 'https://www.espncricinfo.com/rss/content/story/feeds/0.xml',           tamil: false, logoColor: '#e11d48' },
]

// ── Category keywords ────────────────────────────────────────────────────────
// TVK / Vijay election keywords — top priority (Vijay contesting TN 2026 election)
const TVK_KW = [
  'tvk', 'tamilaga vettri kazhagam', 'thalapathy vijay', 'விஜய்', 'வெற்றி கழகம்',
  'vijay party', 'vijay politics', 'tvk meeting', 'tvk conference', 'tvk news',
  'கழக', 'தாளபதி', 'விஜய் கட்சி', 'vijay cm', 'vijay election', 'vijay 2026',
  'tvk 2026', 'vijay chief minister', 'thalapathy cm', 'விஜய் தேர்தல்',
  'tvk rally', 'vijay rally', 'vijay manifesto', 'tvk manifesto',
  'vijay கட்சி', 'நம்ம விஜய்', 'தாளபதி விஜய் அரசியல்',
]

const POLITICS_KW = [
  'அரசியல்', 'கூட்டணி', 'ஆட்சி', 'முதலமைச்சர்', 'ராஜ்பவன்', 'தேர்தல்',
  'tvk', 'vijay', 'dmk', 'aiadmk', 'bjp', 'pmk', 'congress',
  'election', 'coalition', 'government', 'minister', 'chief minister',
  'assembly', 'parliament', 'vote', 'political', 'party', 'mla',
  'governor', 'cm', 'பாஜக', 'திமுக', 'அதிமுக', 'ஸ்டாலின்', 'stalin',
  'edappadi', 'palaniswami', 'annamalai', 'seeman', 'naam tamilar',
]

const CINEMA_KW = [
  // Tamil
  'திரைப்படம்', 'சினிமா', 'நடிகர்', 'நடிகை', 'இயக்குனர்', 'இசை',
  'படம்', 'படத்தில்', 'படத்தின்', 'கோலிவுட்', 'தமிழ் படம்',
  'ஓடிடி', 'வெளியீடு', 'இயக்குனர்', 'தயாரிப்பு', 'விழா',
  'நடித்த', 'நடிக்கிறார்', 'ரிலீஸ்', 'தியேட்டர்', 'போஸ்டர்',
  // English
  'movie', 'film', 'actor', 'actress', 'director', 'cinema', 'trailer',
  'release', 'ott', 'serial', 'series', 'tv show', 'music', 'song',
  'kollywood', 'rajinikanth', 'kamal', 'dhanush', 'ajith', 'suriya',
  'thalapathy', 'vikram', 'sivakarthikeyan', 'nayanthara', 'trisha',
  'samantha', 'pooja hegde', 'rashmika', 'atlee', 'shankar', 'lokesh',
  'box office', 'first look', 'teaser', 'audio launch', 'album',
  'vijay tv', 'sun tv', 'zee tamil', 'star vijay', 'kalaignar tv',
]

const SPORTS_KW = [
  // Tamil
  'விளையாட்டு', 'கிரிக்கெட்', 'கால்பந்து', 'டென்னிஸ்', 'ஹாக்கி',
  'வீரர்', 'வெற்றி', 'தோல்வி', 'போட்டி', 'டூர்னமென்ட்',
  // English
  'cricket', 'ipl', 'football', 'sports', 'match', 'tournament',
  'championship', 'player', 'team', 'score', 'wicket', 'goal',
  'chennai super kings', 'csk', 'ms dhoni', 'rohit', 'virat',
  'fifa', 'olympics', 'kabaddi', 'badminton', 'tennis', 'hockey',
  'batting', 'bowling', 'innings', 'over', 'run', 'boundary', 'six',
]

function isTVK(title: string, desc: string): boolean {
  const text = (title + ' ' + desc).toLowerCase()
  return TVK_KW.some(kw => text.includes(kw.toLowerCase()))
}

function categorize(title: string, desc: string): 'tvk' | 'politics' | 'cinema' | 'sports' | 'general' {
  const text = (title + ' ' + desc).toLowerCase()
  if (isTVK(title, desc)) return 'tvk'
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
  // 1. media:content url="..." (Vikatan, Polimer, OneIndia)
  const media = block.match(/media:content[^>]+url=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i)?.[1]
    ?? block.match(/media:content[^>]+url=["']([^"']{20,})["']/i)?.[1]
  if (media && media.startsWith('http')) return media

  // 2. media:thumbnail url="..." (Vikatan CDN thumbnails)
  const thumb = block.match(/media:thumbnail[^>]+url=["']([^"']+)["']/i)?.[1]
  if (thumb && thumb.startsWith('http')) return thumb

  // 3. enclosure url="..." type="image/..."
  const enclosure = block.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]+type=["']image[^"']*["']/i)?.[1]
    ?? block.match(/<enclosure[^>]+type=["']image[^"']*["'][^>]+url=["']([^"']+)["']/i)?.[1]
  if (enclosure) return enclosure

  // 4. content:encoded — extract first <img src> from article HTML (Maalaimalar, WordPress feeds)
  const encoded = block.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/i)?.[1]
    ?? block.match(/<content:encoded>([\s\S]*?)<\/content:encoded>/i)?.[1]
  if (encoded) {
    const img = encoded.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1]
    if (img && img.startsWith('http')) return img
  }

  // 5. <img src="..."> in description CDATA
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
  return s
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&[a-zA-Z]+;/g, ' ')
    .trim()
}

// Category/source-aware fallback images (Wikipedia + public domain)
const FALLBACK_BY_CATEGORY: Record<string, string[]> = {
  cinema: [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Tamil_cine.jpg/800px-Tamil_cine.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Kollywood.jpg/800px-Kollywood.jpg',
  ],
  sports: [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/CSK_logo.png/800px-CSK_logo.png',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/CricketBall.jpg/800px-CricketBall.jpg',
  ],
  politics: [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Flag_of_Tamil_Nadu.svg/800px-Flag_of_Tamil_Nadu.svg.png',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Tamil_Nadu_Legislative_Assembly.jpg/800px-Tamil_Nadu_Legislative_Assembly.jpg',
  ],
}
const FALLBACK_DEFAULT = [
  'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Tamil_Nadu_state_Highway_Network_Map.jpg/800px-Tamil_Nadu_state_Highway_Network_Map.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Tamil_country.jpg/800px-Tamil_country.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Tamil_language_inscription.jpg/800px-Tamil_language_inscription.jpg',
]

function fallbackImage(_source: string, category: string, seed: number): string | null {
  const pool = FALLBACK_BY_CATEGORY[category] ?? FALLBACK_DEFAULT
  return pool[seed % pool.length]
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
  tvkSource: boolean
}

function parseRSS(xml: string, source: string, logoColor: string, tamil: boolean, tvkSource = false): RawItem[] {
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

    items.push({ title, link, pubDate, desc, imageUrl, source, sourceLogo: logoColor, tamilSource: tamil, tvkSource })
  }
  return items
}

// ── In-memory cache (fresh + stale) ─────────────────────────────────────────
let cache: { data: object; at: number } | null = null
const CACHE_TTL   = 5 * 60 * 1000  // 5 min — serve fresh
const STALE_TTL   = 30 * 60 * 1000 // 30 min — serve stale rather than fail

async function fetchFeed(feed: typeof FEEDS[0]): Promise<RawItem[]> {
  try {
    const res = await fetch(feed.url, {
      signal: AbortSignal.timeout(3000),
      headers: { 'User-Agent': 'NammaTamil RSS Reader/1.0' },
    })
    if (!res.ok) return []
    const xml = await res.text()
    return parseRSS(xml, feed.name, feed.logoColor, feed.tamil, !!feed.tvk)
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

export async function GET(req: NextRequest) {
  // Rate limit: 20 req/IP/min
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'anon'
  if (!rateLimit(`tamil-news:${ip}`, 20, 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  // Serve from cache if fresh
  if (cache && Date.now() - cache.at < CACHE_TTL) {
    return NextResponse.json(cache.data, { headers: { 'X-Cache': 'HIT' } })
  }

  // Serve stale cache while revalidating (prevents 404 on cold starts)
  const staleCache = cache && Date.now() - cache.at < STALE_TTL ? cache : null

  // Fetch all feeds in parallel — use Promise.race with overall 8s guard
  const fetchAll = Promise.allSettled(FEEDS.map(fetchFeed))
  const timeout  = new Promise<typeof FEEDS[0][]>((_, rej) => setTimeout(() => rej(new Error('timeout')), 8000))

  let allItems: RawItem[] = []
  try {
    const results = await Promise.race([fetchAll, timeout]) as Awaited<typeof fetchAll>
    allItems = results.flatMap(r => r.status === 'fulfilled' ? r.value : [])
  } catch {
    // All feeds timed out — serve stale if available
    if (staleCache) {
      return NextResponse.json(staleCache.data, { headers: { 'X-Cache': 'STALE' } })
    }
    return NextResponse.json({ news: [], updatedAt: new Date().toISOString(), count: 0 })
  }

  // If nothing came back, fall back to stale
  if (allItems.length === 0 && staleCache) {
    return NextResponse.json(staleCache.data, { headers: { 'X-Cache': 'STALE' } })
  }

  // Sort: TVK first (+60), Tamil sources (+30), then by recency
  const now = Date.now()
  const sorted = allItems
    .map(item => {
      const age = now - (item.pubDate ? new Date(item.pubDate).getTime() : 0)
      const ageHours = Math.max(0, age / 3600000)
      const tvkBonus    = isTVK(item.title, item.desc) ? 60 : 0
      const tamilBonus  = item.tamilSource ? 30 : 0
      const score = tvkBonus + tamilBonus + Math.max(0, 72 - ageHours)
      return { item, score }
    })
    .sort((a, b) => b.score - a.score)
    .map(x => x.item)

  // Dedup, then take top 60
  const unique = dedup(sorted).slice(0, 60)

  const IMG_PROXY = 'http://31.97.56.148:3096/img-proxy?url='

  const news = unique.map((item, idx) => {
    const category = categorize(item.title, item.desc)
    const rawImg = item.imageUrl ?? fallbackImage(item.source, category, idx)
    const imageUrl = rawImg ? IMG_PROXY + encodeURIComponent(rawImg) : rawImg
    return {
      title:      item.title,
      link:       item.link,
      source:     item.source,
      sourceLogo: item.sourceLogo,
      pubDate:    item.pubDate,
      timeAgo:    timeAgo(item.pubDate),
      desc:       item.desc,
      imageUrl,
      category,
    }
  })

  const data = { news, updatedAt: new Date().toISOString(), count: news.length }
  cache = { data, at: Date.now() }

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 's-maxage=120, stale-while-revalidate=30',
      'X-Sources': [...new Set(news.map(n => n.source))].join(', '),
    },
  })
}
