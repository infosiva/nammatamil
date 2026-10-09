// Live "trending in Tamil Nadu" from Google Trends daily RSS (geo IN-TN). Empty on failure.
const URL_ = process.env.TRENDS_URL ?? 'https://trends.google.com/trending/rss?geo=IN-TN'

export interface Trend { term: string; traffic: string }

export async function getTrending(limit = 10): Promise<Trend[]> {
  try {
    const res = await fetch(URL_, {
      headers: { 'User-Agent': 'Mozilla/5.0 NammaTamil' },
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 300 },
    })
    if (!res.ok) return []
    const xml = await res.text()
    const out: Trend[] = []
    for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
      const term = m[1].match(/<title>([^<]+)<\/title>/)?.[1]?.replace(/&amp;/g, '&').trim()
      if (term) out.push({ term, traffic: m[1].match(/<ht:approx_traffic>([^<]+)</)?.[1] ?? '' })
      if (out.length >= limit) break
    }
    return out
  } catch { return [] }
}
