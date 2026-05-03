/**
 * /api/election-results — Tamil Nadu Assembly Election 2026 Live Counting
 *
 * Phases:
 *   BEFORE May 4 08:00 IST  → returns exit poll projections as "expected" data
 *   May 4 08:00–18:00 IST   → scrapes ECI results page + AI parses → live counts
 *   AFTER  May 4 18:00 IST  → final declared results
 *
 * Data source: results.eci.gov.in (HTML scrape → Groq AI parse)
 * Cache: 3 min during counting, 30 min otherwise
 */
import { NextResponse } from 'next/server'
import { generateWithAI } from '@/lib/ai'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// ── Tamil Nadu Election constants ────────────────────────────────────────────
const TOTAL_SEATS    = 234
const MAJORITY_SEATS = 118

// IST offset
const IST = 5.5 * 60 * 60 * 1000
const COUNTING_START = new Date('2026-05-04T08:00:00+05:30').getTime()
const COUNTING_END   = new Date('2026-05-04T20:00:00+05:30').getTime()

// ── Party config ─────────────────────────────────────────────────────────────
const PARTIES = {
  TVK:    { name: 'TVK',    fullName: 'Tamilaga Vettri Kazhagam', leader: 'Vijay (Thalapathy)', color: '#fbbf24', emoji: '⭐' },
  DMK:    { name: 'DMK',    fullName: 'Dravida Munnetra Kazhagam',  leader: 'M.K. Stalin',         color: '#f87171', emoji: '🌅' },
  AIADMK: { name: 'AIADMK', fullName: 'All India AIADMK',           leader: 'E. Palaniswami',      color: '#4ade80', emoji: '🍃' },
  BJP:    { name: 'BJP',    fullName: 'Bharatiya Janata Party',      leader: 'K. Annamalai',        color: '#fb923c', emoji: '🪷' },
  Others: { name: 'Others', fullName: 'Others / Independents',       leader: '',                    color: '#94a3b8', emoji: '🏛️' },
}

// ── Exit poll projections — used BEFORE counting starts ──────────────────────
// Based on Axis My India (TVK-favoured) as featured poll
const EXIT_PROJECTIONS = {
  TVK:    { seatsLow: 98,  seatsHigh: 120, midpoint: 109, voteShare: 35.0 },
  DMK:    { seatsLow: 92,  seatsHigh: 110, midpoint: 101, voteShare: 35.0 },
  AIADMK: { seatsLow: 22,  seatsHigh: 32,  midpoint: 27,  voteShare: 23.0 },
  BJP:    { seatsLow: 4,   seatsHigh: 10,  midpoint: 7,   voteShare: 4.2  },
  Others: { seatsLow: 2,   seatsHigh: 8,   midpoint: 5,   voteShare: 2.8  },
}

export interface PartyResult {
  name:        string
  fullName:    string
  leader:      string
  color:       string
  emoji:       string
  seatsWon:    number
  seatsLeading: number
  totalTally:  number   // won + leading
  voteShare:   number
  trend:       'up' | 'down' | 'stable'
  isLeading:   boolean
  hasMajority: boolean
}

export interface ElectionResultsResponse {
  phase:           'pre-counting' | 'counting' | 'declared'
  countingStartsAt: string
  seatsReported:   number
  totalSeats:      number
  majorityMark:    number
  parties:         PartyResult[]
  narrative:       string
  leader:          string   // party name currently leading
  projectedWinner: string | null
  source:          'eci-live' | 'ai-parsed' | 'exit-poll-projection' | 'static'
  updatedAt:       string
  headlines:       string[]
}

// ── Scrape ECI results page ──────────────────────────────────────────────────
// ECI URL patterns for Tamil Nadu (S22). These are confirmed patterns based on
// ECI's past election portals. The exact subdomain activates on counting day.
async function scrapeECIResults(): Promise<string> {
  const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-IN,en;q=0.9,ta;q=0.8',
    'Referer': 'https://results.eci.gov.in/',
  }
  // Try multiple URL patterns — ECI activates subdirectories on counting day
  // S22 = Tamil Nadu state code (confirmed via ECI voters portal)
  const urls = [
    // Primary: party-wise tally page (most structured data)
    'https://results.eci.gov.in/ResultAcGenMay2026/partywiseresult-S22.htm',
    // Alternate naming patterns ECI has used historically
    'https://results.eci.gov.in/AcResultGenMay2026/partywiseresult-S22.htm',
    'https://results.eci.gov.in/ResultAcGen2026/partywiseresult-S22.htm',
    // TN Chief Electoral Officer portal
    'https://elections.tn.gov.in/ElectionResults/results.html',
    // ECI homepage — will have links/counts on counting day
    'https://results.eci.gov.in/',
    'https://results.eci.gov.in/ResultAcGenMay2026/index.htm',
  ]

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(7000),
        headers: HEADERS,
        cache: 'no-store',
      })
      if (!res.ok) continue
      const html = await res.text()
      if (html.length > 300) {
        // Strip scripts/styles, keep data-bearing HTML
        const cleaned = html
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
        if (cleaned.length > 200) return cleaned.slice(0, 6000)
      }
    } catch { continue }
  }
  return ''
}

// ── Fetch latest results headlines from news RSS ─────────────────────────────
async function fetchResultsHeadlines(): Promise<string[]> {
  const feeds = [
    // English — Tamil Nadu election coverage
    'https://www.thehindu.com/elections/feeder/default.rss',
    'https://www.thehindu.com/news/national/tamil-nadu/feeder/default.rss',
    'https://feeds.feedburner.com/ndtvnews-india-news',         // NDTV India
    'https://timesofindia.indiatimes.com/rssfeeds/296589292.cms', // ToI elections
    // Tamil language
    'https://www.dinamalar.com/rss_feed.asp',
    'https://www.dailythanthi.com/rss/category/tamilnadu',
    'https://tamil.oneindia.com/rss/tamil-news-fb.xml',
    'https://www.vikatan.com/rss/news.xml',
  ]
  const headlines: string[] = []
  await Promise.allSettled(feeds.map(async url => {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(5000),
        headers: {
          'User-Agent': 'Mozilla/5.0 NammaTamil/1.0',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        },
      })
      if (!res.ok) return
      const xml = await res.text()
      const matches = xml.matchAll(/<title[^>]*>([\s\S]*?)<\/title>/g)
      for (const m of matches) {
        const t = m[1]
          .replace(/<!\[CDATA\[|\]\]>/g, '')
          .replace(/<[^>]+>/g, '')
          .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
          .trim()
        if (
          t.length > 20 &&
          /election|result|win|lead|count|seat|majority|தேர்தல்|வெற்றி|TVK|DMK|AIADMK|Vijay|Stalin|Palaniswami|BJP|Congress/i.test(t)
        ) {
          headlines.push(t)
        }
      }
    } catch { /* skip */ }
  }))
  return [...new Set(headlines)].slice(0, 20)
}

// ── AI parse ECI HTML + headlines → structured results ───────────────────────
async function parseResultsWithAI(html: string, headlines: string[]): Promise<Partial<ElectionResultsResponse>> {
  const context = [
    html ? `ECI Results page (partial HTML):\n${html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 3000)}` : '',
    headlines.length ? `News headlines:\n${headlines.map((h, i) => `${i+1}. ${h}`).join('\n')}` : '',
  ].filter(Boolean).join('\n\n')

  const prompt = `You are a Tamil Nadu election results analyst. It is May 4, 2026 — counting day.

From this data, extract live seat tallies for the Tamil Nadu Assembly Election 2026 (234 total seats, 118 for majority):

${context}

Respond ONLY with valid JSON (no markdown):
{
  "seatsReported": <number of seats where results declared so far>,
  "parties": [
    { "name": "TVK",    "seatsWon": 0, "seatsLeading": 0, "voteShare": 35.0 },
    { "name": "DMK",    "seatsWon": 0, "seatsLeading": 0, "voteShare": 35.0 },
    { "name": "AIADMK", "seatsWon": 0, "seatsLeading": 0, "voteShare": 23.0 },
    { "name": "BJP",    "seatsWon": 0, "seatsLeading": 0, "voteShare": 4.2  },
    { "name": "Others", "seatsWon": 0, "seatsLeading": 0, "voteShare": 2.8  }
  ],
  "leader": "<party name currently ahead>",
  "narrative": "<one sentence describing the current counting trend, max 120 chars>",
  "projectedWinner": "<party name if clearly heading to majority, null if too close>"
}`

  try {
    const raw = await generateWithAI(prompt, {
      mode: 'fast', maxTokens: 400,
      systemPrompt: 'Election results analyst. Return only valid JSON.',
      noCache: true,
    })
    const cleaned = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
    return JSON.parse(cleaned)
  } catch {
    return {}
  }
}

// ── In-memory cache ───────────────────────────────────────────────────────────
let cache: { data: ElectionResultsResponse; fetchedAt: number } | null = null

function getCacheTTL(now: number): number {
  if (now >= COUNTING_START && now <= COUNTING_END) return 3 * 60 * 1000  // 3 min live
  return 30 * 60 * 1000  // 30 min pre/post counting
}

// ── Build pre-counting response (exit poll projections) ─────────────────────
function buildPreCountingResponse(): ElectionResultsResponse {
  const parties: PartyResult[] = Object.entries(PARTIES).map(([key, party]) => {
    const proj = EXIT_PROJECTIONS[key as keyof typeof EXIT_PROJECTIONS]
    return {
      ...party,
      seatsWon:     0,
      seatsLeading: proj.midpoint, // show exit poll midpoint as "projected"
      totalTally:   proj.midpoint,
      voteShare:    proj.voteShare,
      trend:        (key === 'TVK' ? 'up' : key === 'AIADMK' ? 'down' : 'stable') as 'up' | 'down' | 'stable',
      isLeading:    key === 'TVK',
      hasMajority:  proj.midpoint >= MAJORITY_SEATS,
    }
  }).sort((a, b) => b.totalTally - a.totalTally)

  return {
    phase:            'pre-counting',
    countingStartsAt: new Date(COUNTING_START).toISOString(),
    seatsReported:    0,
    totalSeats:       TOTAL_SEATS,
    majorityMark:     MAJORITY_SEATS,
    parties,
    narrative:        'Exit polls close — Axis My India projects TVK as winner with 98–120 seats',
    leader:           'TVK',
    projectedWinner:  null, // won't know until counting
    source:           'exit-poll-projection',
    updatedAt:        new Date().toISOString(),
    headlines:        [],
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function GET() {
  const now = Date.now()
  const ttl = getCacheTTL(now)

  if (cache && now - cache.fetchedAt < ttl) {
    return NextResponse.json({ ...cache.data, cached: true }, { headers: { 'Cache-Control': 'no-store' } })
  }

  // PRE-COUNTING: show exit poll projections
  if (now < COUNTING_START) {
    const data = buildPreCountingResponse()
    cache = { data, fetchedAt: now }
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
  }

  // COUNTING DAY: fetch ECI + headlines, parse with AI
  const [html, headlines] = await Promise.all([
    scrapeECIResults(),
    fetchResultsHeadlines(),
  ])

  const aiParsed = await parseResultsWithAI(html, headlines)

  // Merge AI results with party config
  const partiesRaw = (aiParsed.parties ?? []) as { name: string; seatsWon: number; seatsLeading: number; voteShare: number }[]
  const parties: PartyResult[] = Object.entries(PARTIES).map(([key, party]) => {
    const ai = partiesRaw.find(p => p.name === key)
    const won     = Number(ai?.seatsWon     ?? 0)
    const leading = Number(ai?.seatsLeading ?? 0)
    const tally   = won + leading
    return {
      ...party,
      seatsWon:     won,
      seatsLeading: leading,
      totalTally:   tally,
      voteShare:    Number(ai?.voteShare ?? EXIT_PROJECTIONS[key as keyof typeof EXIT_PROJECTIONS]?.voteShare ?? 0),
      trend:        'stable' as const,
      isLeading:    false,
      hasMajority:  tally >= MAJORITY_SEATS,
    }
  }).sort((a, b) => b.totalTally - a.totalTally)

  // Mark leader
  if (parties.length > 0) parties[0].isLeading = true

  // Infer trends
  parties.forEach(p => {
    const proj = EXIT_PROJECTIONS[p.name as keyof typeof EXIT_PROJECTIONS]
    if (!proj) return
    p.trend = p.totalTally > proj.midpoint ? 'up' : p.totalTally < proj.midpoint ? 'down' : 'stable'
  })

  const seatsReported = Number(aiParsed.seatsReported ?? 0)
  const phase: ElectionResultsResponse['phase'] = now >= COUNTING_END ? 'declared' : 'counting'

  const data: ElectionResultsResponse = {
    phase,
    countingStartsAt: new Date(COUNTING_START).toISOString(),
    seatsReported:    seatsReported,
    totalSeats:       TOTAL_SEATS,
    majorityMark:     MAJORITY_SEATS,
    parties,
    narrative:        String(aiParsed.narrative ?? 'Counting in progress across Tamil Nadu…'),
    leader:           String(aiParsed.leader ?? parties[0]?.name ?? 'Unknown'),
    projectedWinner:  aiParsed.projectedWinner ? String(aiParsed.projectedWinner) : null,
    source:           html.length > 100 ? 'eci-live' : headlines.length > 0 ? 'ai-parsed' : 'exit-poll-projection',
    updatedAt:        new Date().toISOString(),
    headlines:        headlines.slice(0, 5),
  }

  cache = { data, fetchedAt: now }
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
}
