import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rateLimit'
import type { NewsItem, Category } from '@/lib/news'

// Free Tamil RSS feeds — no API key required
const RSS_SOURCES = [
  { url: 'https://www.dinamalar.com/rss/Tamil_Nadu.xml',    source: 'Dinamalar',    category: 'தமிழகம்'       as Category },
  { url: 'https://www.dinamalar.com/rss/Politics.xml',      source: 'Dinamalar',    category: 'அரசியல்'       as Category },
  { url: 'https://www.dinamalar.com/rss/Cinema.xml',        source: 'Dinamalar',    category: 'சினிமா'        as Category },
  { url: 'https://www.dinamalar.com/rss/Sports.xml',        source: 'Dinamalar',    category: 'விளையாட்டு'    as Category },
  { url: 'https://www.dinamalar.com/rss/World.xml',         source: 'Dinamalar',    category: 'உலகம்'         as Category },
  { url: 'https://www.dinamalar.com/rss/Technology.xml',    source: 'Dinamalar',    category: 'தொழில்நுட்பம்' as Category },
]

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim()
}

function extractImg(content: string): string | undefined {
  const m = content.match(/<img[^>]+src=["']([^"']+)["']/i)
  return m?.[1]
}

async function fetchRSS(src: typeof RSS_SOURCES[0]): Promise<NewsItem[]> {
  try {
    const res = await fetch(src.url, {
      headers: { 'User-Agent': 'NammaTamil/1.0' },
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 600 }, // cache 10 min
    })
    if (!res.ok) return []
    const xml = await res.text()

    const items: NewsItem[] = []
    const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g)

    let idx = 0
    for (const match of itemMatches) {
      if (idx >= 8) break
      const block = match[1]

      const titleRaw = block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)?.[1] ?? ''
      const link     = block.match(/<link>([^<]+)<\/link>/)?.[1]?.trim() ?? '#'
      const pubDate  = block.match(/<pubDate>([^<]+)<\/pubDate>/)?.[1]?.trim() ?? new Date().toISOString()
      const descRaw  = block.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/)?.[1] ?? ''
      const imgUrl   = extractImg(descRaw) ?? extractImg(block)

      const title = stripHtml(titleRaw)
      const summary = stripHtml(descRaw).slice(0, 200)
      if (!title) continue

      items.push({
        id: `${src.source}-${idx}-${Date.now()}`,
        title,
        titleEn: title,
        summary,
        category: src.category,
        source: src.source,
        sourceUrl: link,
        publishedAt: new Date(pubDate).toISOString(),
        imageUrl: imgUrl,
        breaking: idx === 0 && src.category === 'தமிழகம்',
        trending: idx < 3,
      })
      idx++
    }
    return items
  } catch {
    return []
  }
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const { ok } = checkRateLimit(ip, 60)
  if (!ok) return new Response('Rate limit', { status: 429 })

  const category = req.nextUrl.searchParams.get('category')

  const sources = category && category !== 'அனைத்தும்'
    ? RSS_SOURCES.filter(s => s.category === category)
    : RSS_SOURCES

  const results = await Promise.allSettled(sources.map(fetchRSS))
  const all = results
    .flatMap(r => r.status === 'fulfilled' ? r.value : [])
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

  return NextResponse.json({ articles: all, count: all.length, fetchedAt: new Date().toISOString() }, {
    headers: { 'Cache-Control': 's-maxage=600, stale-while-revalidate=60' }
  })
}
