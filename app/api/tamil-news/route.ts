/**
 * /api/tamil-news — real-time Tamil entertainment news from RSS feeds
 * Sources: Filmibeat Tamil, Vikatan Cinema, Behindwoods, OneIndia Tamil Cinema
 * No API key required — public RSS feeds
 * Cache: 10 minutes (entertainment news moves fast)
 */
import { NextResponse } from 'next/server'

export const revalidate = 600 // 10 min

const FEEDS = [
  {
    name: 'The Hindu Movies',
    color: '#16a34a',
    url: 'https://www.thehindu.com/entertainment/movies/feeder/default.rss',
  },
  {
    name: 'The Hindu Tamil Nadu',
    color: '#16a34a',
    url: 'https://www.thehindu.com/news/national/tamil-nadu/feeder/default.rss',
  },
  {
    name: 'Indian Express',
    color: '#3b82f6',
    url: 'https://indianexpress.com/section/entertainment/feed/',
  },
  {
    name: 'Times of India',
    color: '#f97316',
    url: 'https://timesofindia.indiatimes.com/rssfeeds/1081479906.cms',
  },
]

// Tamil movie poster fallbacks by keyword
const KEYWORD_POSTERS: Array<{ keywords: string[]; poster: string; category: string }> = [
  { keywords: ['coolie', 'rajinikanth', 'superstar'], poster: 'https://image.tmdb.org/t/p/w500/kr36awqmziEI5mfUElsHB0pj9zP.jpg', category: 'Movies' },
  { keywords: ['thug life', 'kamal', 'kamalhaasan'], poster: 'https://image.tmdb.org/t/p/w500/DmBbUtbA3T9sdVXDgIJ8bsIDw0.jpg', category: 'Movies' },
  { keywords: ['retro', 'suriya', 'karthik subbaraj'], poster: 'https://image.tmdb.org/t/p/w500/pJPK57REXsaLydpOPgHwWAQMdqz.jpg', category: 'Movies' },
  { keywords: ['vidaamuyarchi', 'ajith'], poster: 'https://image.tmdb.org/t/p/w500/yx7AYFLoupzBfdfEAlDFuOiei2A.jpg', category: 'Movies' },
  { keywords: ['empuraan', 'mohanlal', 'lucifer 2'], poster: 'https://image.tmdb.org/t/p/w500/dfaZipN3Aw5BK85nEvfr2FNg4EW.jpg', category: 'Movies' },
  { keywords: ['amaran', 'sivakarthikeyan', 'sai pallavi'], poster: 'https://image.tmdb.org/t/p/w500/eCB06m1KUGilEOlIzb40nkQhVY0.jpg', category: 'Movies' },
  { keywords: ['maharaja', 'vijay sethupathi'], poster: 'https://image.tmdb.org/t/p/w500/s0m4TM1XRAftQStgKpw024RvkJo.jpg', category: 'Movies' },
  { keywords: ['vettaiyan'], poster: 'https://image.tmdb.org/t/p/w500/yEEyhQaW7cEb0IDJstoMBmEtPND.jpg', category: 'Movies' },
  { keywords: ['leo', 'lokesh', 'lcu'], poster: 'https://image.tmdb.org/t/p/w500/t1oAdt8JjUs4sHEBvE8fKtjV7er.jpg', category: 'Movies' },
  { keywords: ['vikram', 'fahadh', 'faasil'], poster: 'https://image.tmdb.org/t/p/w500/774UV1aCURb4s4JfEFg3IEMu5Zj.jpg', category: 'Movies' },
  { keywords: ['thangalaan', 'pa ranjith', 'pa. ranjith'], poster: 'https://image.tmdb.org/t/p/w500/dAci50FwevkdWIUzQWpdz7kSKHe.jpg', category: 'Movies' },
  { keywords: ['kanguva', 'suriya', 'siva'], poster: 'https://image.tmdb.org/t/p/w500/lycbTFBXqFN1kMdPEsnAFutKEEy.jpg', category: 'Movies' },
  { keywords: ['pushpa', 'allu arjun'], poster: 'https://image.tmdb.org/t/p/w500/bhxZj3y59cK7JtGdV285dhDRaMe.jpg', category: 'Movies' },
  { keywords: ['rrr', 'rajamouli', 'ram charan', 'jr ntr'], poster: 'https://image.tmdb.org/t/p/w500/u0XUBNQWlOvrh0Gd97ARGpIkL0.jpg', category: 'Movies' },
  { keywords: ['marco', 'unni mukundan'], poster: 'https://image.tmdb.org/t/p/w500/kdzZb1VEK47lKh7GtjE4NALfDI6.jpg', category: 'Movies' },
  { keywords: ['aavesham', 'fahadh faasil'], poster: 'https://image.tmdb.org/t/p/w500/k5RWPaNjgRcNvGoawYaQHQwyctI.jpg', category: 'Movies' },
  { keywords: ['thalapathy', 'vijay'], poster: 'https://image.tmdb.org/t/p/w500/t1oAdt8JjUs4sHEBvE8fKtjV7er.jpg', category: 'Movies' },
  { keywords: ['dhanush'], poster: 'https://image.tmdb.org/t/p/w500/z5SxDcVWa9nokynVqBHb2IKk78J.jpg', category: 'Movies' },
  { keywords: ['ar rahman', 'a.r. rahman', 'music', 'album', 'song', 'singer'], poster: 'https://image.tmdb.org/t/p/w500/5uimlxPCgAei8JfQUDFEUQLoyyh.jpg', category: 'Music' },
  { keywords: ['netflix', 'amazon prime', 'hotstar', 'ott', 'streaming', 'release date'], poster: 'https://image.tmdb.org/t/p/w500/a47JQFl9L7VDa79tEvnTOJe0rPa.jpg', category: 'OTT' },
  { keywords: ['sun tv', 'vijay tv', 'serial', 'serials', 'episode'], poster: 'https://image.tmdb.org/t/p/w500/hIoZgUixXD13M3cecGyYcQ7y7Ot.jpg', category: 'Serials' },
  { keywords: ['box office', 'crore', 'collection', 'blockbuster', 'hit'], poster: 'https://image.tmdb.org/t/p/w500/eCB06m1KUGilEOlIzb40nkQhVY0.jpg', category: 'Box Office' },
  { keywords: ['award', 'filmfare', 'national award', 'cannes'], poster: 'https://image.tmdb.org/t/p/w500/ehybiOtBUtrMkmtB39zQEtq1Jie.jpg', category: 'Awards' },
]

const CATEGORY_COLORS: Record<string, string> = {
  Movies: '#60a5fa',
  Music: '#f472b6',
  OTT: '#a78bfa',
  Serials: '#f97316',
  'Box Office': '#4ade80',
  Awards: '#fbbf24',
  News: '#94a3b8',
}

function classifyNews(title: string): { poster: string; category: string } {
  const lower = title.toLowerCase()
  for (const { keywords, poster, category } of KEYWORD_POSTERS) {
    if (keywords.some(k => lower.includes(k))) {
      return { poster, category }
    }
  }
  // Default: generic Tamil cinema poster based on hash
  const defaults = [
    { poster: 'https://image.tmdb.org/t/p/w500/pJPK57REXsaLydpOPgHwWAQMdqz.jpg', category: 'Movies' },
    { poster: 'https://image.tmdb.org/t/p/w500/s0m4TM1XRAftQStgKpw024RvkJo.jpg', category: 'Movies' },
    { poster: 'https://image.tmdb.org/t/p/w500/774UV1aCURb4s4JfEFg3IEMu5Zj.jpg', category: 'Movies' },
    { poster: 'https://image.tmdb.org/t/p/w500/t1oAdt8JjUs4sHEBvE8fKtjV7er.jpg', category: 'Movies' },
  ]
  return defaults[title.length % defaults.length]
}

function extractImageFromRSS(block: string): string | null {
  // Try <media:content url="..."> (The Hindu, TOI use this)
  const media = block.match(/media:content[^>]+url=["']([^"']+)["']/i)?.[1]
  if (media && /^https?:/.test(media)) return media

  // Try <media:thumbnail url="...">
  const thumb = block.match(/media:thumbnail[^>]+url=["']([^"']+)["']/i)?.[1]
  if (thumb && /^https?:/.test(thumb)) return thumb

  // Try <enclosure url="...">
  const enc = block.match(/<enclosure[^>]+url=["']([^"']+)["']/i)?.[1]
  if (enc && /\.(jpg|jpeg|png|webp)/i.test(enc)) return enc

  // Try <img src="..."> inside description/content CDATA
  const inDesc = block.match(/<img[^>]+src=["'](https?:[^"']+\.(jpg|jpeg|png|webp)(\?[^"']*)?)["']/i)?.[1]
  if (inDesc) return inDesc

  return null
}

function parseRSS(xml: string, source: string, color: string) {
  const items: Array<{
    id: string; title: string; link: string; pubDate: string
    source: string; color: string; thumbnail: string; category: string; categoryColor: string
  }> = []

  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g)
  for (const [, block] of itemMatches) {
    const title = (
      block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1] ??
      block.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? ''
    ).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim()

    const link = (
      block.match(/<link>(https?:[^<]+)<\/link>/)?.[1] ??
      block.match(/<guid[^>]*>(https?:[^<]+)<\/guid>/)?.[1] ?? ''
    ).trim()

    const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? ''

    if (!title) continue

    // Extract image from RSS, fall back to keyword-matched poster
    const rssImage = extractImageFromRSS(block)
    const { poster: keywordPoster, category } = classifyNews(title)
    const thumbnail = rssImage ?? keywordPoster

    items.push({
      id: `${source}-${items.length}-${Date.now()}`,
      title,
      link,
      pubDate,
      source,
      color,
      thumbnail,
      category,
      categoryColor: CATEGORY_COLORS[category] ?? '#94a3b8',
    })

    if (items.length >= 6) break
  }
  return items
}

function timeAgo(pubDate: string): string {
  try {
    const d = new Date(pubDate)
    if (isNaN(d.getTime())) return 'Today'
    const diff = Date.now() - d.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 2) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  } catch {
    return 'Today'
  }
}

export async function GET() {
  const results = await Promise.allSettled(
    FEEDS.map(async feed => {
      const res = await fetch(feed.url, {
        signal: AbortSignal.timeout(5000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; NammaTamil/1.0; +https://nammatamil.live)',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        },
        next: { revalidate: 600 },
      })
      if (!res.ok) throw new Error(`${feed.name}: ${res.status}`)
      const xml = await res.text()
      return parseRSS(xml, feed.name, feed.color)
    })
  )

  const successful = results.filter(r => r.status === 'fulfilled').length

  const allNews = results.flatMap(r => r.status === 'fulfilled' ? r.value : [])

  // Interleave sources for variety
  const bySource: Record<string, typeof allNews> = {}
  for (const item of allNews) {
    if (!bySource[item.source]) bySource[item.source] = []
    bySource[item.source].push(item)
  }
  const interleaved: typeof allNews = []
  const maxLen = Math.max(0, ...Object.values(bySource).map(a => a.length))
  for (let i = 0; i < maxLen; i++) {
    for (const arr of Object.values(bySource)) {
      if (arr[i]) interleaved.push(arr[i])
    }
  }

  const news = interleaved.slice(0, 20).map(item => ({
    ...item,
    timeAgo: timeAgo(item.pubDate),
  }))

  return NextResponse.json({
    news,
    sources: FEEDS.map(f => f.name),
    successfulFeeds: successful,
    updatedAt: new Date().toISOString(),
  })
}
