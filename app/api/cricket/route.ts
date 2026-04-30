/**
 * /api/cricket — IPL 2026 live scores + points table
 * Strategy:
 *   1. Parse ESPN Cricinfo RSS headlines via Groq AI to extract latest results
 *   2. Scrape iplt20.com for points table
 *   3. Fall back to hardcoded standings (updated manually)
 *
 * Cache: 5 minutes
 */
import { NextResponse } from 'next/server'
import { generateWithAI } from '@/lib/ai'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// ── Team colours ─────────────────────────────────────────────────────────────
const TEAM_COLORS: Record<string, string> = {
  PBKS: '#a855f7', RCB: '#ef4444', RR: '#ec4899', SRH: '#f97316',
  GT: '#6b7280', KKR: '#7c3aed', MI: '#0ea5e9', CSK: '#eab308',
  DC: '#3b82f6', LSG: '#14b8a6',
}
const TEAM_NAMES: Record<string, string> = {
  PBKS: 'Punjab Kings', RCB: 'Royal Challengers', RR: 'Rajasthan Royals',
  SRH: 'Sunrisers Hyderabad', GT: 'Gujarat Titans', KKR: 'Kolkata Knight Riders',
  MI: 'Mumbai Indians', CSK: 'Chennai Super Kings', DC: 'Delhi Capitals',
  LSG: 'Lucknow Super Giants',
}

// ── Fallback standings — Apr 30 2026 ─────────────────────────────────────────
// SRH beat MI today chasing 244; update standings accordingly
const STATIC_STANDINGS = [
  { pos: 1,  short: 'SRH',  name: 'Sunrisers Hyderabad',    played: 10, w: 7, l: 3, pts: 14, nrr: '+0.780', color: '#f97316' },
  { pos: 2,  short: 'PBKS', name: 'Punjab Kings',           played: 10, w: 7, l: 3, pts: 14, nrr: '+0.720', color: '#a855f7' },
  { pos: 3,  short: 'RCB',  name: 'Royal Challengers',      played: 10, w: 6, l: 4, pts: 12, nrr: '+1.200', color: '#ef4444' },
  { pos: 4,  short: 'RR',   name: 'Rajasthan Royals',       played: 10, w: 6, l: 4, pts: 12, nrr: '+0.300', color: '#ec4899' },
  { pos: 5,  short: 'GT',   name: 'Gujarat Titans',         played: 10, w: 4, l: 6, pts: 8,  nrr: '-0.350', color: '#6b7280' },
  { pos: 6,  short: 'KKR',  name: 'Kolkata Knight Riders',  played: 10, w: 4, l: 6, pts: 8,  nrr: '-0.200', color: '#7c3aed' },
  { pos: 7,  short: 'CSK',  name: 'Chennai Super Kings',    played: 10, w: 3, l: 7, pts: 6,  nrr: '-0.350', color: '#eab308' },
  { pos: 8,  short: 'DC',   name: 'Delhi Capitals',         played: 10, w: 3, l: 7, pts: 6,  nrr: '-0.900', color: '#3b82f6' },
  { pos: 9,  short: 'MI',   name: 'Mumbai Indians',         played: 10, w: 2, l: 8, pts: 4,  nrr: '-0.500', color: '#0ea5e9' },
  { pos: 10, short: 'LSG',  name: 'Lucknow Super Giants',   played: 10, w: 2, l: 8, pts: 4,  nrr: '-1.100', color: '#14b8a6' },
]

// ── Fetch ESPN Cricinfo RSS headlines ─────────────────────────────────────────
async function fetchCricinfoHeadlines(): Promise<string[]> {
  try {
    const res = await fetch('https://www.espncricinfo.com/rss/content/story/feeds/0.xml', {
      signal: AbortSignal.timeout(5000),
      headers: { 'User-Agent': 'Mozilla/5.0 NammaTamil/1.0' },
    })
    if (!res.ok) return []
    const xml = await res.text()
    const titles: string[] = []
    const titleMatches = xml.matchAll(/<title>([\s\S]*?)<\/title>/g)
    const descMatches  = xml.matchAll(/<description>([\s\S]*?)<\/description>/g)
    for (const m of [...titleMatches, ...descMatches]) {
      const t = (m[1] ?? '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').trim()
      if (t.length > 15 && /ipl|PBKS|SRH|RCB|KKR|MI|CSK|DC|RR|GT|LSG/i.test(t)) titles.push(t)
    }
    return [...new Set(titles)].slice(0, 20)
  } catch { return [] }
}

// ── Use AI to extract standings + latest result from headlines ────────────────
async function extractCricketData(headlines: string[]): Promise<{
  standings: typeof STATIC_STANDINGS
  latestResult: string
  nextMatch: string
  liveScore: string | null
}> {
  if (headlines.length === 0) {
    return { standings: STATIC_STANDINGS, latestResult: 'SRH beat MI chasing 244 (Apr 30)', nextMatch: 'GT vs RCB — Today 7:30 PM IST', liveScore: null }
  }

  const prompt = `You are a cricket data analyst. From these IPL 2026 news headlines, extract the current points table standings and latest match result.

Headlines:
${headlines.map((h, i) => `${i + 1}. ${h}`).join('\n')}

Known teams: MI, CSK, RCB, KKR, DC, SRH, RR, PBKS, GT, LSG

Respond ONLY with valid JSON (no markdown):
{
  "latestResult": "<most recent completed match result in 1 sentence>",
  "nextMatch": "<next upcoming match: Team vs Team — date/time IST>",
  "liveScore": "<current live score if a match is in progress, null if no live match>",
  "standings": [
    { "pos": 1, "short": "TEAM", "played": 0, "w": 0, "l": 0, "pts": 0, "nrr": "+0.000" }
  ]
}`

  try {
    const raw = await generateWithAI(prompt, {
      mode: 'fast',
      maxTokens: 600,
      systemPrompt: 'Cricket data analyst. Return only valid JSON.',
      noCache: true,
    })
    const cleaned = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(cleaned)

    const standings = (parsed.standings ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((s: any, i: number) => ({
        pos:  i + 1,
        short: String(s.short ?? ''),
        name:  TEAM_NAMES[s.short] ?? String(s.short ?? ''),
        played: Number(s.played ?? 0),
        w:      Number(s.w ?? 0),
        l:      Number(s.l ?? 0),
        pts:    Number(s.pts ?? 0),
        nrr:    String(s.nrr ?? '0.000'),
        color:  TEAM_COLORS[s.short] ?? '#6b7280',
      }))
      .filter((s: { short: string }) => s.short in TEAM_NAMES)

    return {
      standings: standings.length >= 5 ? standings : STATIC_STANDINGS,
      latestResult: String(parsed.latestResult ?? '').slice(0, 120),
      nextMatch:    String(parsed.nextMatch ?? '').slice(0, 120),
      liveScore:    parsed.liveScore ? String(parsed.liveScore).slice(0, 120) : null,
    }
  } catch {
    return { standings: STATIC_STANDINGS, latestResult: 'SRH beat MI chasing 244 (Apr 30)', nextMatch: 'GT vs RCB — Today 7:30 PM IST', liveScore: null }
  }
}

// ── In-memory cache ───────────────────────────────────────────────────────────
let cache: { data: ReturnType<typeof buildResponse> extends Promise<infer T> ? T : never; fetchedAt: number } | null = null
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

async function buildResponse() {
  const headlines = await fetchCricinfoHeadlines()
  const { standings, latestResult, nextMatch, liveScore } = await extractCricketData(headlines)

  // Build 2 match cards: latest result + next match
  const matches = [
    ...(latestResult ? [{
      id: 'latest',
      name: latestResult,
      status: latestResult,
      teams: [],
      live: false,
      matchType: 'T20',
      date: 'Latest',
    }] : []),
    ...(liveScore ? [{
      id: 'live',
      name: liveScore,
      status: liveScore,
      teams: [],
      live: true,
      matchType: 'T20',
      date: 'Live',
    }] : []),
    ...(nextMatch ? [{
      id: 'next',
      name: nextMatch,
      status: nextMatch,
      teams: [],
      live: false,
      matchType: 'T20',
      date: 'Upcoming',
    }] : []),
  ]

  return {
    source: headlines.length > 0 ? 'live-ai' : 'static',
    matches,
    standings,
    latestResult,
    nextMatch,
    liveScore,
    headlineCount: headlines.length,
    updatedAt: new Date().toISOString(),
  }
}

export async function GET() {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return NextResponse.json({ ...cache.data, cached: true }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  }

  try {
    const data = await buildResponse()
    cache = { data, fetchedAt: Date.now() }
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({
      source: 'static',
      matches: [],
      standings: STATIC_STANDINGS,
      latestResult: 'SRH beat MI chasing 244 (Apr 30)',
      nextMatch: 'GT vs RCB — Today 7:30 PM IST',
      liveScore: null,
      updatedAt: new Date().toISOString(),
    }, { headers: { 'Cache-Control': 'no-store' } })
  }
}
