/**
 * /api/election-results — Tamil Nadu Assembly Election 2026 Live Counting
 *
 * FALLBACK CHAIN (in order):
 *   1. MANUAL_OVERRIDE env var — if set, always return this (admin control)
 *   2. ECI scrape → Groq AI parse → structured JSON
 *   3. News RSS headlines → AI parse → best-effort numbers
 *   4. Last known good data from in-memory cache (stale but safe)
 *   5. Exit poll projections (last resort — always works)
 *
 * PHASES:
 *   BEFORE May 4 08:00 IST  → exit poll projections
 *   May 4 08:00–20:00 IST   → live ECI scrape + AI parse
 *   AFTER  May 4 20:00 IST  → declared results
 *
 * EMERGENCY OVERRIDE:
 *   Set env var ELECTION_OVERRIDE in Vercel dashboard:
 *   {"TVK":{"won":95,"leading":18},"DMK":{"won":82,"leading":12},...}
 *   This immediately overrides ALL scraping for any refresh.
 */
import { NextResponse } from 'next/server'
import { generateWithAI } from '@/lib/ai'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// ── Constants ────────────────────────────────────────────────────────────────
const TOTAL_SEATS    = 234
const MAJORITY_SEATS = 118
const COUNTING_START = new Date('2026-05-04T08:00:00+05:30').getTime()
const COUNTING_END   = new Date('2026-05-04T20:00:00+05:30').getTime()

// ── Party config ─────────────────────────────────────────────────────────────
const PARTIES = {
  TVK:    { name: 'TVK',    fullName: 'Tamilaga Vettri Kazhagam',   leader: 'Vijay (Thalapathy)', color: '#fbbf24', emoji: '⭐' },
  DMK:    { name: 'DMK',    fullName: 'Dravida Munnetra Kazhagam',  leader: 'M.K. Stalin',        color: '#f87171', emoji: '🌅' },
  AIADMK: { name: 'AIADMK', fullName: 'All India AIADMK',           leader: 'E. Palaniswami',     color: '#4ade80', emoji: '🍃' },
  BJP:    { name: 'BJP',    fullName: 'Bharatiya Janata Party',      leader: 'K. Annamalai',       color: '#fb923c', emoji: '🪷' },
  Others: { name: 'Others', fullName: 'Others / Independents',       leader: '',                   color: '#94a3b8', emoji: '🏛️' },
}

// ── Exit poll projections (Axis My India, Apr 29 2026) ───────────────────────
// Midpoints corrected to sum to exactly 234
const EXIT_PROJECTIONS = {
  TVK:    { seatsLow: 98,  seatsHigh: 120, midpoint: 105, voteShare: 35.0 },
  DMK:    { seatsLow: 85,  seatsHigh: 105, midpoint:  95, voteShare: 35.0 },
  AIADMK: { seatsLow: 20,  seatsHigh: 30,  midpoint:  24, voteShare: 23.0 },
  BJP:    { seatsLow: 3,   seatsHigh: 8,   midpoint:   6, voteShare: 4.2  },
  Others: { seatsLow: 2,   seatsHigh: 6,   midpoint:   4, voteShare: 2.8  },
}
// Total midpoints: 105+95+24+6+4 = 234 ✓

export interface PartyResult {
  name:         string
  fullName:     string
  leader:       string
  color:        string
  emoji:        string
  seatsWon:     number
  seatsLeading: number
  totalTally:   number
  voteShare:    number
  trend:        'up' | 'down' | 'stable'
  isLeading:    boolean
  hasMajority:  boolean
}

export interface ElectionResultsResponse {
  phase:            'pre-counting' | 'counting' | 'declared'
  countingStartsAt: string
  seatsReported:    number
  totalSeats:       number
  majorityMark:     number
  parties:          PartyResult[]
  narrative:        string
  leader:           string
  projectedWinner:  string | null
  source:           'eci-live' | 'ai-parsed' | 'exit-poll-projection' | 'manual-override' | 'cached-stale' | 'static'
  updatedAt:        string
  headlines:        string[]
  fallbackLevel:    number  // 1=override, 2=eci, 3=news, 4=stale-cache, 5=exit-poll
}

// ── In-memory cache (last known good data) ───────────────────────────────────
let cache: { data: ElectionResultsResponse; fetchedAt: number } | null = null

function getCacheTTL(now: number): number {
  if (now >= COUNTING_START && now <= COUNTING_END) return 3 * 60 * 1000   // 3 min live
  return 30 * 60 * 1000  // 30 min pre/post
}

// ── FALLBACK 1: Manual override via env var ──────────────────────────────────
// Set ELECTION_OVERRIDE in Vercel env vars as JSON string:
// {"TVK":{"won":95,"leading":18},"DMK":{"won":82,"leading":12},"AIADMK":{"won":28,"leading":4},"BJP":{"won":9,"leading":2},"Others":{"won":12,"leading":3},"seatsReported":148,"narrative":"TVK surges ahead with 113 seats","projectedWinner":"TVK"}
function getManualOverride(): Partial<ElectionResultsResponse> | null {
  const raw = process.env.ELECTION_OVERRIDE
  if (!raw) return null
  try {
    const o = JSON.parse(raw) as Record<string, { won: number; leading: number }> & {
      seatsReported?: number; narrative?: string; projectedWinner?: string
    }
    const partiesRaw = Object.entries(PARTIES).map(([key, party]) => {
      const d = o[key] ?? { won: 0, leading: 0 }
      const won     = Number(d.won     ?? 0)
      const leading = Number(d.leading ?? 0)
      const tally   = won + leading
      const proj    = EXIT_PROJECTIONS[key as keyof typeof EXIT_PROJECTIONS]
      return {
        ...party,
        seatsWon:     won,
        seatsLeading: leading,
        totalTally:   tally,
        voteShare:    proj?.voteShare ?? 0,
        trend:        (tally > (proj?.midpoint ?? 0) ? 'up' : tally < (proj?.midpoint ?? 0) ? 'down' : 'stable') as 'up' | 'down' | 'stable',
        isLeading:    false,
        hasMajority:  tally >= MAJORITY_SEATS,
      }
    }).sort((a, b) => b.totalTally - a.totalTally)
    if (partiesRaw.length > 0) partiesRaw[0].isLeading = true

    return {
      phase:           'counting',
      seatsReported:   Number(o.seatsReported ?? 0),
      parties:         partiesRaw,
      narrative:       String(o.narrative ?? 'Live counting update'),
      leader:          partiesRaw[0]?.name ?? 'Unknown',
      projectedWinner: o.projectedWinner ? String(o.projectedWinner) : null,
      source:          'manual-override',
      fallbackLevel:   1,
    }
  } catch {
    return null
  }
}

// ── FALLBACK 2: Scrape ECI results page ─────────────────────────────────────
async function scrapeECIResults(): Promise<string> {
  const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-IN,en;q=0.9,ta;q=0.8',
    'Referer': 'https://results.eci.gov.in/',
    'Cache-Control': 'no-cache',
  }
  // S22 = Tamil Nadu state code (confirmed via ECI voters portal)
  const urls = [
    'https://results.eci.gov.in/ResultAcGenMay2026/partywiseresult-S22.htm',
    'https://results.eci.gov.in/AcResultGenMay2026/partywiseresult-S22.htm',
    'https://results.eci.gov.in/ResultAcGen2026/partywiseresult-S22.htm',
    'https://results.eci.gov.in/ResultAcGenMay2026/index.htm',
    'https://elections.tn.gov.in/ElectionResults/results.html',
    'https://results.eci.gov.in/',
  ]
  for (const url of urls) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(7000), headers: HEADERS, cache: 'no-store' })
      if (!res.ok) continue
      const html = await res.text()
      if (html.length > 300) {
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

// ── FALLBACK 3: News RSS headlines ───────────────────────────────────────────
async function fetchResultsHeadlines(): Promise<string[]> {
  const feeds = [
    'https://www.thehindu.com/elections/feeder/default.rss',
    'https://www.thehindu.com/news/national/tamil-nadu/feeder/default.rss',
    'https://feeds.feedburner.com/ndtvnews-india-news',
    'https://timesofindia.indiatimes.com/rssfeeds/296589292.cms',
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
        headers: { 'User-Agent': 'Mozilla/5.0 NammaTamil/1.0', 'Accept': 'application/rss+xml, application/xml, text/xml, */*' },
      })
      if (!res.ok) return
      const xml = await res.text()
      for (const m of xml.matchAll(/<title[^>]*>([\s\S]*?)<\/title>/g)) {
        const t = m[1]
          .replace(/<!\[CDATA\[|\]\]>/g, '')
          .replace(/<[^>]+>/g, '')
          .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
          .trim()
        if (t.length > 20 && /election|result|win|lead|count|seat|majority|தேர்தல்|வெற்றி|TVK|DMK|AIADMK|Vijay|Stalin|Palaniswami|BJP/i.test(t))
          headlines.push(t)
      }
    } catch { /* skip */ }
  }))
  return [...new Set(headlines)].slice(0, 20)
}

// ── AI parse (used for both ECI HTML and headlines-only fallback) ─────────────
async function parseResultsWithAI(html: string, headlines: string[]): Promise<Partial<ElectionResultsResponse>> {
  const context = [
    html ? `ECI Results page data:\n${html.slice(0, 3000)}` : '',
    headlines.length ? `News headlines:\n${headlines.map((h, i) => `${i + 1}. ${h}`).join('\n')}` : '',
  ].filter(Boolean).join('\n\n')

  if (!context.trim()) return {}

  const prompt = `You are a Tamil Nadu election results analyst. It is May 4, 2026 — counting day.
Tamil Nadu has 234 assembly seats. Majority mark: 118. Main parties: TVK (Vijay), DMK (MK Stalin), AIADMK (Palaniswami), BJP, Others.

Extract live seat tallies from this data:
${context}

If you cannot find specific numbers, use your best estimate from context clues (e.g. "DMK leading in 80+ seats").
Respond ONLY with valid JSON — no markdown, no explanation:
{
  "seatsReported": <integer, seats where counting is complete>,
  "parties": [
    { "name": "TVK",    "seatsWon": 0, "seatsLeading": 0, "voteShare": 35.0 },
    { "name": "DMK",    "seatsWon": 0, "seatsLeading": 0, "voteShare": 35.0 },
    { "name": "AIADMK", "seatsWon": 0, "seatsLeading": 0, "voteShare": 23.0 },
    { "name": "BJP",    "seatsWon": 0, "seatsLeading": 0, "voteShare": 4.2  },
    { "name": "Others", "seatsWon": 0, "seatsLeading": 0, "voteShare": 2.8  }
  ],
  "leader": "<party name currently ahead in total tally>",
  "narrative": "<one clear sentence about current trend, max 100 chars>",
  "projectedWinner": "<party name if they are clearly heading to 118+, else null>"
}`

  try {
    const raw = await generateWithAI(prompt, {
      mode: 'fast', maxTokens: 450,
      systemPrompt: 'Tamil Nadu election analyst. Return only valid compact JSON.',
      noCache: true,
    })
    const cleaned = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(cleaned)
    // Sanity check — reject if all tallies are 0 and we have context
    const total = (parsed.parties ?? []).reduce((s: number, p: {seatsWon:number;seatsLeading:number}) => s + p.seatsWon + p.seatsLeading, 0)
    if (total === 0 && context.length > 200) return {}
    return parsed
  } catch {
    return {}
  }
}

// ── Build full response from AI-parsed data ───────────────────────────────────
function buildCountingResponse(
  aiParsed: Partial<ElectionResultsResponse>,
  source: ElectionResultsResponse['source'],
  fallbackLevel: number,
  now: number
): ElectionResultsResponse {
  const partiesRaw = (aiParsed.parties ?? []) as { name: string; seatsWon: number; seatsLeading: number; voteShare: number }[]
  const parties: PartyResult[] = Object.entries(PARTIES).map(([key, party]) => {
    const ai      = partiesRaw.find(p => p.name === key)
    const won     = Number(ai?.seatsWon     ?? 0)
    const leading = Number(ai?.seatsLeading ?? 0)
    const tally   = won + leading
    const proj    = EXIT_PROJECTIONS[key as keyof typeof EXIT_PROJECTIONS]
    return {
      ...party,
      seatsWon:     won,
      seatsLeading: leading,
      totalTally:   tally,
      voteShare:    Number(ai?.voteShare ?? proj?.voteShare ?? 0),
      trend:        (tally > (proj?.midpoint ?? 0) ? 'up' : tally < (proj?.midpoint ?? 0) ? 'down' : 'stable') as 'up' | 'down' | 'stable',
      isLeading:    false,
      hasMajority:  tally >= MAJORITY_SEATS,
    }
  }).sort((a, b) => b.totalTally - a.totalTally)

  if (parties.length > 0) parties[0].isLeading = true

  const phase: ElectionResultsResponse['phase'] = now >= COUNTING_END ? 'declared' : 'counting'

  return {
    phase,
    countingStartsAt: new Date(COUNTING_START).toISOString(),
    seatsReported:    Number(aiParsed.seatsReported ?? 0),
    totalSeats:       TOTAL_SEATS,
    majorityMark:     MAJORITY_SEATS,
    parties,
    narrative:        String(aiParsed.narrative ?? 'Counting in progress across Tamil Nadu…'),
    leader:           String(aiParsed.leader ?? parties[0]?.name ?? 'Unknown'),
    projectedWinner:  aiParsed.projectedWinner ? String(aiParsed.projectedWinner) : null,
    source,
    updatedAt:        new Date().toISOString(),
    headlines:        (aiParsed.headlines ?? []).slice(0, 5),
    fallbackLevel,
  }
}

// ── FALLBACK 5: Empty state — no fake data ────────────────────────────────────
function buildEmptyCountingResponse(phase: 'pre-counting' | 'counting'): ElectionResultsResponse {
  const parties: PartyResult[] = Object.entries(PARTIES).map(([, party]) => ({
    ...party,
    seatsWon:     0,
    seatsLeading: 0,
    totalTally:   0,
    voteShare:    0,
    trend:        'stable' as const,
    isLeading:    false,
    hasMajority:  false,
  }))

  return {
    phase,
    countingStartsAt: new Date(COUNTING_START).toISOString(),
    seatsReported:    0,
    totalSeats:       TOTAL_SEATS,
    majorityMark:     MAJORITY_SEATS,
    parties,
    narrative:        'Tamil Nadu Assembly Election 2026 — Fetching live results…',
    leader:           '',
    projectedWinner:  null,
    source:           'static',
    updatedAt:        new Date().toISOString(),
    headlines:        [],
    fallbackLevel:    5,
  }
}

// ── Main GET handler ──────────────────────────────────────────────────────────
export async function GET() {
  const now = Date.now()
  const ttl = getCacheTTL(now)

  // ── FALLBACK 1: Manual override (highest priority — ignores cache TTL) ──────
  const override = getManualOverride()
  if (override) {
    const data: ElectionResultsResponse = {
      phase:            'counting',
      countingStartsAt: new Date(COUNTING_START).toISOString(),
      seatsReported:    override.seatsReported ?? 0,
      totalSeats:       TOTAL_SEATS,
      majorityMark:     MAJORITY_SEATS,
      parties:          override.parties ?? [],
      narrative:        override.narrative ?? 'Manual update in progress',
      leader:           override.leader ?? '',
      projectedWinner:  override.projectedWinner ?? null,
      source:           'manual-override',
      updatedAt:        new Date().toISOString(),
      headlines:        [],
      fallbackLevel:    1,
    }
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
  }

  // ── Serve from cache if fresh ─────────────────────────────────────────────
  if (cache && now - cache.fetchedAt < ttl) {
    return NextResponse.json({ ...cache.data, cached: true }, { headers: { 'Cache-Control': 'no-store' } })
  }

  // ── PRE-COUNTING: show empty counting state (no hardcoded projections) ──────
  if (now < COUNTING_START) {
    const data = buildEmptyCountingResponse('pre-counting')
    cache = { data, fetchedAt: now }
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
  }

  // ── COUNTING DAY: try each fallback in order ──────────────────────────────

  // Fallback 2+3: fetch ECI + headlines in parallel
  const [html, headlines] = await Promise.all([
    scrapeECIResults(),
    fetchResultsHeadlines(),
  ])

  // Fallback 2: ECI HTML → AI parse
  if (html.length > 100) {
    const aiParsed = await parseResultsWithAI(html, headlines)
    const hasData  = (aiParsed.parties ?? []).some((p: {seatsWon:number;seatsLeading:number}) => p.seatsWon + p.seatsLeading > 0)
    if (hasData) {
      aiParsed.headlines = headlines.slice(0, 5)
      const data = buildCountingResponse(aiParsed, 'eci-live', 2, now)
      cache = { data, fetchedAt: now }
      return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
    }
  }

  // Fallback 3: headlines only → AI parse
  if (headlines.length > 0) {
    const aiParsed = await parseResultsWithAI('', headlines)
    const hasData  = (aiParsed.parties ?? []).some((p: {seatsWon:number;seatsLeading:number}) => p.seatsWon + p.seatsLeading > 0)
    if (hasData) {
      aiParsed.headlines = headlines.slice(0, 5)
      const data = buildCountingResponse(aiParsed, 'ai-parsed', 3, now)
      cache = { data, fetchedAt: now }
      return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
    }
  }

  // Fallback 4: return stale cache with flag (better than nothing)
  if (cache) {
    const stale = { ...cache.data, source: 'cached-stale' as const, fallbackLevel: 4, updatedAt: cache.data.updatedAt }
    return NextResponse.json(stale, { headers: { 'Cache-Control': 'no-store' } })
  }

  // Fallback 5: empty state — no fake data
  const data = buildEmptyCountingResponse('counting')
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
}

// ── POST: admin manual update endpoint ───────────────────────────────────────
// POST /api/election-results with header X-Admin-Key matching ADMIN_KEY env var
// Body: { TVK:{won,leading}, DMK:{won,leading}, AIADMK:{won,leading}, BJP:{won,leading}, Others:{won,leading}, seatsReported, narrative, projectedWinner }
export async function POST(req: Request) {
  const adminKey = process.env.ADMIN_KEY
  if (!adminKey) return NextResponse.json({ error: 'Not configured' }, { status: 403 })
  if (req.headers.get('x-admin-key') !== adminKey)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const now  = Date.now()

    const partiesRaw = Object.entries(PARTIES).map(([key, party]) => {
      const d       = (body[key] ?? {}) as { won?: number; leading?: number }
      const won     = Number(d.won     ?? 0)
      const leading = Number(d.leading ?? 0)
      const tally   = won + leading
      const proj    = EXIT_PROJECTIONS[key as keyof typeof EXIT_PROJECTIONS]
      return {
        ...party,
        seatsWon:     won,
        seatsLeading: leading,
        totalTally:   tally,
        voteShare:    proj?.voteShare ?? 0,
        trend:        (tally > (proj?.midpoint ?? 0) ? 'up' : tally < (proj?.midpoint ?? 0) ? 'down' : 'stable') as 'up' | 'down' | 'stable',
        isLeading:    false,
        hasMajority:  tally >= MAJORITY_SEATS,
      }
    }).sort((a, b) => b.totalTally - a.totalTally)
    if (partiesRaw.length > 0) partiesRaw[0].isLeading = true

    const phase: ElectionResultsResponse['phase'] = now >= COUNTING_END ? 'declared' : 'counting'

    const data: ElectionResultsResponse = {
      phase,
      countingStartsAt: new Date(COUNTING_START).toISOString(),
      seatsReported:    Number(body.seatsReported ?? 0),
      totalSeats:       TOTAL_SEATS,
      majorityMark:     MAJORITY_SEATS,
      parties:          partiesRaw,
      narrative:        String(body.narrative ?? 'Manual update'),
      leader:           partiesRaw[0]?.name ?? 'Unknown',
      projectedWinner:  body.projectedWinner ? String(body.projectedWinner) : null,
      source:           'manual-override',
      updatedAt:        new Date().toISOString(),
      headlines:        Array.isArray(body.headlines) ? body.headlines.slice(0, 5) : [],
      fallbackLevel:    1,
    }

    // Inject into cache so next GET serves this immediately
    cache = { data, fetchedAt: now }
    return NextResponse.json({ ok: true, data })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 })
  }
}
