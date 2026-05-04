/**
 * /api/election-news — Hung Parliament Live News + AI Coalition Analysis
 *
 * May 4, 2026: No party crossed 118. Tamil Nadu is heading to a hung assembly.
 * This route:
 *   1. Fetches breaking news from RSS feeds (The Hindu, NDTV, Dinamalar, etc.)
 *   2. Filters for hung-parliament / coalition / government-formation news
 *   3. Passes top headlines to AI → generates live coalition analysis + narrative
 *   4. Returns structured JSON ready for the live dashboard
 *
 * Cache: 5 minutes (fast-moving situation)
 */
import { NextResponse } from 'next/server'
import { generateWithAI } from '@/lib/ai'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// ── RSS feeds — politics-heavy sources ───────────────────────────────────────
const FEEDS = [
  { name: 'The Hindu TN',    url: 'https://www.thehindu.com/news/national/tamil-nadu/feeder/default.rss' },
  { name: 'The Hindu Elec',  url: 'https://www.thehindu.com/elections/tamil-nadu/feeder/default.rss' },
  { name: 'NDTV Top',        url: 'https://feeds.feedburner.com/ndtvnews-top-stories' },
  { name: 'India Today',     url: 'https://www.indiatoday.in/rss/1206577' },
  { name: 'Dinamalar',       url: 'https://www.dinamalar.com/rss/news_rss.asp' },
  { name: 'OneIndia Tamil',  url: 'https://tamil.oneindia.com/rss/tamil-news-fb.xml' },
  { name: 'Times of India',  url: 'https://timesofindia.indiatimes.com/rssfeeds/296589292.cms' },
  { name: 'Hindustan Times', url: 'https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml' },
]

// Keywords that signal hung-parliament / coalition / TN political breaking news
const BREAKING_KEYWORDS = [
  'hung', 'coalition', 'alliance', 'government formation', 'support',
  'TVK', 'DMK', 'AIADMK', 'BJP', 'Stalin', 'Vijay', 'Palaniswami', 'Thalapathy',
  'Tamil Nadu election', 'TN election', 'counting', 'results', 'seats',
  'majority', 'Chief Minister', 'CM', 'governor', 'president rule',
  'post-poll', 'post poll', 'deal', 'merger', 'rebel', 'defection',
  'தேர்தல்', 'கூட்டணி', 'அரசு', 'முதலமைச்சர்',
]

function scoreHeadline(title: string, desc: string): number {
  const text = (title + ' ' + desc).toLowerCase()
  let score = 0

  // Tier 1 — hung parliament specific
  for (const kw of ['hung', 'coalition', 'government formation', 'majority', 'president rule', 'கூட்டணி']) {
    if (text.includes(kw.toLowerCase())) score += 15
  }
  // Tier 2 — party / leader specific
  for (const kw of ['TVK', 'Vijay', 'Thalapathy', 'Stalin', 'Palaniswami', 'AIADMK', 'DMK']) {
    if (text.includes(kw.toLowerCase())) score += 8
  }
  // Tier 3 — election context
  for (const kw of ['Tamil Nadu election', 'TN election', 'counting', 'results', 'seats', 'CM', 'Chief Minister']) {
    if (text.includes(kw.toLowerCase())) score += 3
  }
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
    ).replace(/<[^>]+>/g, '').trim().slice(0, 250)

    if (!title || title.length < 12) continue
    const score = scoreHeadline(title, desc)
    if (score < 3) continue
    items.push({ title, link, pubDate, desc, source, score })
    if (items.length >= 20) break
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

// ── AI coalition analysis ─────────────────────────────────────────────────────
interface CoalitionAnalysis {
  summary: string          // 1-2 sentence current status
  scenario: string         // most likely govt formation scenario
  tvkPath: string          // TVK's path to CM
  dmkPath: string          // DMK's path
  likelihood: {
    tvk_led: number        // % chance TVK forms govt
    dmk_led: number        // % chance DMK forms govt
    presidents_rule: number
  }
  keyDeal: string          // most important potential deal right now
  urgency: 'low' | 'medium' | 'high' | 'breaking'
  breakingAlert: string | null  // null or one-line breaking headline
}

const FALLBACK_ANALYSIS: CoalitionAnalysis = {
  summary: 'Tamil Nadu has a hung assembly. TVK leads with 107 seats, DMK at 60, AIADMK at 47. No party has the 118-seat majority.',
  scenario: 'TVK is the single largest party and will likely be invited first by the Governor to form government. Needs 11 more seats.',
  tvkPath: 'TVK (107) needs ~11 seats. PMK (4), INC (5) + independents (5) can get them to 121.',
  dmkPath: 'DMK (60) + AIADMK (47) = 107 — still short of majority and historically opposed.',
  likelihood: { tvk_led: 62, dmk_led: 18, presidents_rule: 20 },
  keyDeal: 'TVK-PMK alliance talks are the most likely deal to watch. PMK has 4 seats and constituency weight.',
  urgency: 'high',
  breakingAlert: 'Hung assembly confirmed: TVK 107 | DMK 60 | AIADMK 47 · No party crosses 118',
}

let aiCache: { analysis: CoalitionAnalysis; fetchedAt: number } | null = null
let newsCache: { items: ReturnType<typeof parseRSS>; fetchedAt: number } | null = null
let seatsCache: { splits: SeatsLive; fetchedAt: number } | null = null
const NEWS_TTL  = 5  * 60 * 1000   // 5 min
const AI_TTL    = 10 * 60 * 1000  // 10 min
const SEATS_TTL = 2  * 60 * 1000   // 2 min — refresh split often

// Live seat splits from ECI partywise HTML
interface SeatsLive {
  TVK:    { won: number; leading: number; total: number }
  DMK:    { won: number; leading: number; total: number }
  AIADMK: { won: number; leading: number; total: number }
  BJP:    { won: number; leading: number; total: number }
  Others: { won: number; leading: number; total: number }
  total: number; majority: number; reported: number
}

const SEATS_FALLBACK: SeatsLive = {
  TVK:    { won: 107, leading: 0, total: 107 },
  DMK:    { won: 60,  leading: 0, total: 60  },
  AIADMK: { won: 47,  leading: 0, total: 47  },
  BJP:    { won: 1,   leading: 0, total: 1   },
  Others: { won: 19,  leading: 0, total: 19  },
  total: 234, majority: 118, reported: 234,
}

async function fetchLiveSeatSplits(): Promise<SeatsLive> {
  const now = Date.now()
  if (seatsCache && now - seatsCache.fetchedAt < SEATS_TTL) return seatsCache.splits

  const ECI_HTML = 'https://results.eci.gov.in/ResultAcGenMay2026/partywiseresult-S22.htm'
  const partyAliases: Record<string, string> = {
    TVK: 'TVK', ADMK: 'AIADMK', AIADMK: 'AIADMK', DMK: 'DMK',
    BJP: 'BJP', PMK: 'Others', INC: 'Others', CPI: 'Others', 'CPI(M)': 'Others',
    VCK: 'Others', DMDK: 'Others', IUML: 'Others', AMMKMNKZ: 'Others', PT: 'Others',
  }
  const urlsToTry = [
    ECI_HTML,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(ECI_HTML)}`,
    `https://corsproxy.io/?${encodeURIComponent(ECI_HTML)}`,
  ]

  for (const url of urlsToTry) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(8000), cache: 'no-store',
        headers: { 'User-Agent': 'Mozilla/5.0 NammaTamil/1.0', ...(url === ECI_HTML ? { Referer: 'https://results.eci.gov.in/' } : {}) },
      })
      if (!res.ok) continue
      const html = await res.text()
      if (html.length < 1000) continue

      const clean = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
      const totals: Record<string, { won: number; leading: number }> = {}
      const pattern = /\b(TVK|ADMK|AIADMK|DMK|BJP|PMK|INC|CPI(?:\(M\))?|VCK|DMDK|PT|IUML|AMMKMNKZ)\b[^0-9]{0,30}?(\d+)\s+(\d+)\s+(\d+)/g
      let m: RegExpExecArray | null
      while ((m = pattern.exec(clean)) !== null) {
        const abbr = m[1], won = parseInt(m[2], 10), lead = parseInt(m[3], 10), tot = parseInt(m[4], 10)
        if (Math.abs(won + lead - tot) > 2) continue
        const key = partyAliases[abbr] ?? 'Others'
        if (!totals[key]) totals[key] = { won: 0, leading: 0 }
        totals[key].won += won; totals[key].leading += lead
      }

      const hasData = Object.values(totals).some(v => v.won + v.leading > 0)
      if (!hasData) continue

      const make = (k: string) => ({
        won:     totals[k]?.won     ?? 0,
        leading: totals[k]?.leading ?? 0,
        total:  (totals[k]?.won ?? 0) + (totals[k]?.leading ?? 0),
      })
      const splits: SeatsLive = {
        TVK: make('TVK'), DMK: make('DMK'), AIADMK: make('AIADMK'), BJP: make('BJP'), Others: make('Others'),
        total: 234, majority: 118,
        reported: Object.values(totals).reduce((s, v) => s + v.won + v.leading, 0),
      }
      seatsCache = { splits, fetchedAt: now }
      return splits
    } catch { continue }
  }

  return seatsCache?.splits ?? SEATS_FALLBACK
}

async function getCoalitionAnalysis(headlines: string[]): Promise<CoalitionAnalysis> {
  const now = Date.now()
  if (aiCache && now - aiCache.fetchedAt < AI_TTL) return aiCache.analysis

  if (headlines.length === 0) return FALLBACK_ANALYSIS

  const prompt = `You are a Tamil Nadu political analyst. It is May 4, 2026 — Tamil Nadu election results day.

FINAL SEAT COUNT (ECI official):
- TVK (Thalapathy Vijay): 107 seats
- DMK (MK Stalin, incumbent CM): 60 seats
- AIADMK (Palaniswami): 47 seats
- BJP: 1 seat
- Others (PMK, INC, CPI, VCK, DMDK etc.): 19 seats
- TOTAL: 234 seats | MAJORITY: 118 seats

SITUATION: HUNG ASSEMBLY. No party has majority.

LATEST NEWS HEADLINES:
${headlines.slice(0, 15).map((h, i) => `${i + 1}. ${h}`).join('\n')}

Analyse the government formation situation. Respond ONLY with valid JSON — no markdown:
{
  "summary": "<2 sentences: current political situation>",
  "scenario": "<most likely government formation scenario based on news>",
  "tvkPath": "<how TVK can reach 118: which parties, how many seats>",
  "dmkPath": "<how DMK can reach 118: which parties, what's blocking them>",
  "likelihood": { "tvk_led": <0-100>, "dmk_led": <0-100>, "presidents_rule": <0-100> },
  "keyDeal": "<the single most important coalition deal being discussed right now>",
  "urgency": "<low|medium|high|breaking>",
  "breakingAlert": "<null or one ultra-concise breaking update from the headlines, max 80 chars>"
}`

  try {
    const raw = await generateWithAI(prompt, {
      mode: 'fast', maxTokens: 500,
      systemPrompt: 'Tamil Nadu political analyst. Return only valid compact JSON.',
      noCache: true,
    })
    const cleaned = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(cleaned) as CoalitionAnalysis
    aiCache = { analysis: parsed, fetchedAt: now }
    return parsed
  } catch {
    return FALLBACK_ANALYSIS
  }
}

export async function GET() {
  const now = Date.now()

  // Check news cache
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

    // De-dupe + sort
    const seen = new Set<string>()
    allItems = allItems.filter(it => {
      const k = it.title.toLowerCase().slice(0, 55)
      if (seen.has(k)) return false
      seen.add(k); return true
    }).sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return (new Date(b.pubDate).getTime() || 0) - (new Date(a.pubDate).getTime() || 0)
    })

    newsCache = { items: allItems, fetchedAt: now }
  }

  const headlines = allItems.slice(0, 20).map(it => it.title)
  const [analysis, seats] = await Promise.all([
    getCoalitionAnalysis(headlines),
    fetchLiveSeatSplits(),
  ])

  const news = allItems.slice(0, 15).map(it => ({
    title:   it.title,
    link:    it.link,
    source:  it.source,
    pubDate: it.pubDate,
    timeAgo: timeAgo(it.pubDate),
    desc:    it.desc,
    score:   it.score,
    isHot:   it.score >= 15,
  }))

  return NextResponse.json({
    news,
    analysis,
    seats,
    phase: 'hung',
    updatedAt: new Date().toISOString(),
  }, { headers: { 'Cache-Control': 'no-store' } })
}
