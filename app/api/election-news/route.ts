/**
 * /api/election-news — Post-Counting Coalition Intelligence
 *
 * May 4, 2026: HUNG ASSEMBLY — TVK 107, DMK 60, AIADMK 47, Others 20
 * Nobody crossed 118. This route powers the real story NOW:
 *   — What coalition talks are happening?
 *   — Who is TVK meeting? What's the deal?
 *   — AI prediction: who will be CM? When?
 *   — Governor's timeline
 *
 * Pipeline:
 *   1. Fetch RSS from TN politics sources (The Hindu, NDTV, Dinamalar, Maalaimalar)
 *   2. Score headlines for coalition / government formation relevance
 *   3. AI (Groq → Gemini → Claude) analyses → coalition prediction + next 48h timeline
 *   4. Return structured JSON with news + AI narrative + prediction
 *
 * Cache: 5 minutes — situation moves fast
 */
import { NextRequest, NextResponse } from 'next/server'
import { aiChat } from '@/lib/ai'
import { rateLimit } from '@/lib/ratelimit'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// ── RSS sources — heavy TN politics coverage ─────────────────────────────────
const FEEDS = [
  { name: 'The Hindu TN',     url: 'https://www.thehindu.com/news/national/tamil-nadu/feeder/default.rss' },
  { name: 'The Hindu Elec',   url: 'https://www.thehindu.com/elections/tamil-nadu/feeder/default.rss' },
  { name: 'NDTV India',       url: 'https://feeds.feedburner.com/ndtvnews-top-stories' },
  { name: 'India Today',      url: 'https://www.indiatoday.in/rss/1206577' },
  { name: 'Dinamalar',        url: 'https://www.dinamalar.com/rss/news_rss.asp' },
  { name: 'Maalaimalar',      url: 'https://www.maalaimalar.com/rss/news.xml' },
  { name: 'OneIndia Tamil',   url: 'https://tamil.oneindia.com/rss/tamil-news-fb.xml' },
  { name: 'Times of India',   url: 'https://timesofindia.indiatimes.com/rssfeeds/296589292.cms' },
  { name: 'Hindustan Times',  url: 'https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml' },
  { name: 'Indian Express TN', url: 'https://indianexpress.com/section/india/feed/' },
]

// Coalition / government formation keywords — scored by tier
const TIER1 = ['hung', 'coalition', 'government formation', 'form government', 'majority',
  'president rule', 'governor invite', 'governor', 'alliance', 'support letter',
  'கூட்டணி', 'ஆட்சி', 'முதலமைச்சர்', 'ராஜ்பவன்']

const TIER2 = ['TVK', 'Vijay', 'Thalapathy', 'Stalin', 'Palaniswami', 'EPS',
  'AIADMK', 'DMK', 'PMK', 'BJP', 'INC', 'Congress', 'VCK',
  'Chief Minister', 'CM', 'MLAs', 'floor test', 'cabinet']

const TIER3 = ['Tamil Nadu election', 'TN election', 'results', 'seats', 'deal',
  'merger', 'defection', 'rebel', 'independent', 'post-poll']

function scoreHeadline(title: string, desc: string): number {
  const text = (title + ' ' + desc).toLowerCase()
  let score = 0
  for (const kw of TIER1) if (text.includes(kw.toLowerCase())) score += 18
  for (const kw of TIER2) if (text.includes(kw.toLowerCase())) score += 8
  for (const kw of TIER3) if (text.includes(kw.toLowerCase())) score += 3
  return score
}

function parseRSS(xml: string, source: string) {
  const items: Array<{ title: string; link: string; pubDate: string; desc: string; source: string; score: number }> = []
  for (const [, block] of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
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
    ).replace(/<[^>]+>/g, '').trim().slice(0, 300)

    if (!title || title.length < 12) continue
    const score = scoreHeadline(title, desc)
    if (score < 3) continue
    items.push({ title, link, pubDate, desc, source, score })
    if (items.length >= 25) break
  }
  return items
}

function timeAgo(pubDate: string): string {
  try {
    const diff = Date.now() - new Date(pubDate).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 2) return 'Just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  } catch { return 'Today' }
}

// ── AI Coalition Intelligence ─────────────────────────────────────────────────
interface CoalitionAnalysis {
  summary: string           // Current situation in 2 sentences
  scenario: string          // Most likely government formation path
  tvkPath: string           // TVK's path to CM
  dmkPath: string           // DMK's path
  prediction: string        // Who will be CM and by when — AI's best call
  timeline: string          // Next 48h key events to watch
  likelihood: {
    tvk_led: number         // % chance TVK forms govt
    dmk_led: number         // % chance DMK leads
    presidents_rule: number // % chance President's rule imposed
  }
  keyDeal: string           // Most important deal right now
  riskFactor: string        // What could derail the most likely scenario
  urgency: 'low' | 'medium' | 'high' | 'breaking'
  breakingAlert: string | null
}

const FALLBACK_ANALYSIS: CoalitionAnalysis = {
  summary: 'Tamil Nadu has a hung assembly. TVK leads with 107 seats — 11 short of the 118 majority. DMK at 60, AIADMK at 47. Coalition talks are underway.',
  scenario: 'TVK is the single largest party. Governor must invite TVK first to prove majority on the floor of the assembly within 14 days.',
  tvkPath: 'TVK (107) + PMK (4) + INC (5) + 5 friendly independents = 121 seats. This is the most viable path.',
  dmkPath: 'DMK (60) + AIADMK (47) = 107 — still short of 118 and historically these two are arch rivals. Very unlikely.',
  prediction: 'Vijay (TVK) is most likely to be sworn in as Tamil Nadu CM within 7–10 days. PMK and INC support is the key variable.',
  timeline: 'Next 48h: Governor calls TVK first → TVK submits support letters → Floor test scheduled. Watch PMK announcement.',
  likelihood: { tvk_led: 65, dmk_led: 15, presidents_rule: 20 },
  keyDeal: 'TVK-PMK talks are the most critical. PMK (4 seats) with ministerial berths can push TVK past 118.',
  riskFactor: 'If 5+ independents demand cash or cabinet posts TVK cannot afford, President\'s Rule becomes more likely.',
  urgency: 'high',
  breakingAlert: 'Hung assembly: TVK 107 · DMK 60 · AIADMK 47 · Coalition talks live',
}

let aiCache: { analysis: CoalitionAnalysis; fetchedAt: number } | null = null
let newsCache: { items: ReturnType<typeof parseRSS>; fetchedAt: number } | null = null
const NEWS_TTL = 5  * 60 * 1000  // 5 min
const AI_TTL   = 12 * 60 * 1000  // 12 min

async function getCoalitionAnalysis(headlines: string[]): Promise<CoalitionAnalysis> {
  const now = Date.now()
  if (aiCache && now - aiCache.fetchedAt < AI_TTL) return aiCache.analysis

  if (headlines.length === 0) return FALLBACK_ANALYSIS

  const prompt = `You are a senior Tamil Nadu political analyst writing for NammaTamil.live on May 2026.

OFFICIAL FINAL RESULTS (ECI declared, May 4, 2026):
- TVK (Thalapathy Vijay, first-time party): 107 seats
- DMK (MK Stalin, incumbent CM): 60 seats
- AIADMK (E. Palaniswami / EPS): 47 seats
- BJP: 1 seat
- PMK: 4 seats
- INC (Congress): 5 seats
- VCK / others / independents: ~12 seats
- TOTAL: 234 seats | MAJORITY: 118 seats

SITUATION: HUNG ASSEMBLY. Counting is OVER. Now it's all about government formation.

LATEST NEWS HEADLINES (live, from The Hindu / NDTV / Dinamalar):
${headlines.slice(0, 18).map((h, i) => `${i + 1}. ${h}`).join('\n')}

Based on these headlines and your expert knowledge of TN politics, provide a coalition intelligence brief.
Respond ONLY with valid compact JSON — no markdown fences:
{
  "summary": "<2 sentences: today's political situation>",
  "scenario": "<most likely path to government formation based on news>",
  "tvkPath": "<how TVK reaches 118: specific parties + seat math>",
  "dmkPath": "<how DMK could reach 118, or why they can't>",
  "prediction": "<AI best prediction: who will be CM and approximately when>",
  "timeline": "<next 48–72h key events to watch>",
  "likelihood": { "tvk_led": <0-100>, "dmk_led": <0-100>, "presidents_rule": <0-100> },
  "keyDeal": "<single most important coalition deal to watch right now>",
  "riskFactor": "<what could derail the most likely scenario>",
  "urgency": "<low|medium|high|breaking>",
  "breakingAlert": "<null or one ultra-concise breaking update from headlines, max 85 chars>"
}`

  try {
    const raw = await aiChat([{ role: 'user', content: prompt }], 'Tamil Nadu political analyst. Return only valid compact JSON. Be specific and data-driven.', 600, 'fast')
    const cleaned = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(cleaned) as CoalitionAnalysis
    // Sanity check likelihoods sum to ~100
    const sum = (parsed.likelihood?.tvk_led ?? 0) + (parsed.likelihood?.dmk_led ?? 0) + (parsed.likelihood?.presidents_rule ?? 0)
    if (sum < 80 || sum > 120) parsed.likelihood = FALLBACK_ANALYSIS.likelihood
    aiCache = { analysis: parsed, fetchedAt: now }
    return parsed
  } catch {
    return FALLBACK_ANALYSIS
  }
}

export async function GET(req: NextRequest) {
  // Rate limit: 30 req/IP/min — cached responses are cheap but AI calls aren't
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'anon'
  if (!rateLimit(`election-news:${ip}`, 30, 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
  const now = Date.now()

  // Fetch news
  let allItems: ReturnType<typeof parseRSS> = []
  if (newsCache && now - newsCache.fetchedAt < NEWS_TTL) {
    allItems = newsCache.items
  } else {
    const results = await Promise.allSettled(
      FEEDS.map(async f => {
        const res = await fetch(f.url, {
          signal: AbortSignal.timeout(5000), cache: 'no-store',
          headers: { 'User-Agent': 'Mozilla/5.0 NammaTamil/1.0', 'Accept': 'application/rss+xml, text/xml, */*' },
        })
        if (!res.ok) throw new Error(`${f.name} ${res.status}`)
        return parseRSS(await res.text(), f.name)
      })
    )
    allItems = results.flatMap(r => r.status === 'fulfilled' ? r.value : [])

    // De-dupe by normalised title prefix
    const seen = new Set<string>()
    allItems = allItems.filter(it => {
      const k = it.title.toLowerCase().slice(0, 60)
      if (seen.has(k)) return false
      seen.add(k); return true
    }).sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return (new Date(b.pubDate).getTime() || 0) - (new Date(a.pubDate).getTime() || 0)
    })

    newsCache = { items: allItems, fetchedAt: now }
  }

  const headlines = allItems.slice(0, 20).map(it => it.title)
  const analysis = await getCoalitionAnalysis(headlines)

  const news = allItems.slice(0, 15).map(it => ({
    title:   it.title,
    link:    it.link,
    source:  it.source,
    pubDate: it.pubDate,
    timeAgo: timeAgo(it.pubDate),
    desc:    it.desc.slice(0, 180),
    score:   it.score,
    isHot:   it.score >= 20,
  }))

  // Static final seat data
  const seats = {
    TVK:    { won: 107, leading: 0, total: 107 },
    DMK:    { won: 60,  leading: 0, total: 60  },
    AIADMK: { won: 47,  leading: 0, total: 47  },
    BJP:    { won: 1,   leading: 0, total: 1   },
    Others: { won: 19,  leading: 0, total: 19  },
    total: 234, majority: 118, reported: 234,
  }

  return NextResponse.json({
    news,
    analysis,
    seats,
    phase: 'post-counting-coalition',
    updatedAt: new Date().toISOString(),
  }, { headers: { 'Cache-Control': 'no-store' } })
}
