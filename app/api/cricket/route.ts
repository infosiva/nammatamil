/**
 * /api/cricket — IPL 2026 live standings + match headlines
 * Strategy:
 *   1. Scrape Cricbuzz IPL 2026 points table (regex on embedded JS data)
 *   2. Fetch live headlines from ESPN Cricinfo RSS
 *   3. Static fallback (updated Apr 30 2026) if scrape fails
 *
 * Cache: 5 minutes
 */
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// ── Team colours & names ──────────────────────────────────────────────────────
const TEAM_COLORS: Record<string, string> = {
  PBKS: '#a855f7', RCB: '#ef4444', RR: '#ec4899', SRH: '#f97316',
  GT:   '#6b7280', KKR: '#7c3aed', MI: '#0ea5e9', CSK: '#eab308',
  DC:   '#3b82f6', LSG: '#14b8a6',
}
const TEAM_NAMES: Record<string, string> = {
  PBKS: 'Punjab Kings',         RCB: 'Royal Challengers',
  RR:   'Rajasthan Royals',     SRH: 'Sunrisers Hyderabad',
  GT:   'Gujarat Titans',       KKR: 'Kolkata Knight Riders',
  MI:   'Mumbai Indians',       CSK: 'Chennai Super Kings',
  DC:   'Delhi Capitals',       LSG: 'Lucknow Super Giants',
}

// ── Static fallback — verified from Cricbuzz Apr 30 2026 ─────────────────────
const STATIC_STANDINGS = [
  { pos: 1,  short: 'PBKS', name: 'Punjab Kings',          played: 8, w: 6, l: 1, pts: 13, nrr: '+1.043', color: '#a855f7' },
  { pos: 2,  short: 'RCB',  name: 'Royal Challengers',     played: 8, w: 6, l: 2, pts: 12, nrr: '+1.919', color: '#ef4444' },
  { pos: 3,  short: 'SRH',  name: 'Sunrisers Hyderabad',   played: 9, w: 6, l: 3, pts: 12, nrr: '+0.832', color: '#f97316' },
  { pos: 4,  short: 'RR',   name: 'Rajasthan Royals',      played: 9, w: 6, l: 3, pts: 12, nrr: '+0.617', color: '#ec4899' },
  { pos: 5,  short: 'GT',   name: 'Gujarat Titans',        played: 8, w: 4, l: 4, pts: 8,  nrr: '-0.475', color: '#6b7280' },
  { pos: 6,  short: 'CSK',  name: 'Chennai Super Kings',   played: 8, w: 3, l: 5, pts: 6,  nrr: '-0.121', color: '#eab308' },
  { pos: 7,  short: 'DC',   name: 'Delhi Capitals',        played: 8, w: 3, l: 5, pts: 6,  nrr: '-1.060', color: '#3b82f6' },
  { pos: 8,  short: 'KKR',  name: 'Kolkata Knight Riders', played: 8, w: 2, l: 5, pts: 5,  nrr: '-0.751', color: '#7c3aed' },
  { pos: 9,  short: 'MI',   name: 'Mumbai Indians',        played: 8, w: 2, l: 6, pts: 4,  nrr: '-0.784', color: '#0ea5e9' },
  { pos: 10, short: 'LSG',  name: 'Lucknow Super Giants',  played: 8, w: 2, l: 6, pts: 4,  nrr: '-1.106', color: '#14b8a6' },
]

interface StandingRow {
  pos: number; short: string; name: string; played: number
  w: number; l: number; pts: number; nrr: string; color: string
}

// ── Scrape Cricbuzz IPL 2026 points table ─────────────────────────────────────
// Cricbuzz series 9241 = IPL 2026. Team data is embedded as double-escaped JSON
// inside self.__next_f.push() calls. We use a direct regex to extract team rows.
async function fetchLiveStandings(): Promise<StandingRow[] | null> {
  try {
    const res = await fetch(
      'https://www.cricbuzz.com/cricket-series/9241/indian-premier-league-2026/points-table',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        signal: AbortSignal.timeout(8000),
        cache: 'no-store',
      }
    )
    if (!res.ok) return null
    const html = await res.text()

    // Data is double-escaped: \"teamName\":\"PBKS\" inside JS strings
    // Pattern matches each team row in the points table
    const rowPattern = /\\"teamFullName\\":\\"([^\\]+)\\",\\"teamName\\":\\"([^\\]+)\\",\\"teamId\\":\d+,\\"matchesPlayed\\":(\d+),\\"matchesWon\\":(\d+),\\"matchesLost\\":(\d+),\\"matchesTied\\":\d+,\\"noRes\\":(\d+),\\"matchesDrawn\\":\d+,\\"nrr\\":\\"([^\\]+)\\",\\"points\\":(\d+)/g

    const rows: StandingRow[] = []
    let match: RegExpExecArray | null
    let pos = 1

    while ((match = rowPattern.exec(html)) !== null) {
      const [, , short, played, w, l, , nrr, pts] = match
      if (!(short in TEAM_COLORS)) continue // skip non-IPL teams
      rows.push({
        pos:    pos++,
        short,
        name:   TEAM_NAMES[short] ?? short,
        played: parseInt(played, 10),
        w:      parseInt(w, 10),
        l:      parseInt(l, 10),
        pts:    parseInt(pts, 10),
        nrr,
        color:  TEAM_COLORS[short] ?? '#6b7280',
      })
    }

    return rows.length >= 8 ? rows : null
  } catch {
    return null
  }
}

// ── Fetch ESPN Cricinfo RSS for latest result headline ────────────────────────
async function fetchHeadlines(): Promise<string[]> {
  try {
    const res = await fetch('https://www.espncricinfo.com/rss/content/story/feeds/0.xml', {
      signal: AbortSignal.timeout(5000),
      headers: { 'User-Agent': 'Mozilla/5.0 NammaTamil/1.0' },
    })
    if (!res.ok) return []
    const xml = await res.text()
    const titles: string[] = []
    for (const m of xml.matchAll(/<title>([\s\S]*?)<\/title>/g)) {
      const t = (m[1] ?? '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').trim()
      if (t.length > 15 && /ipl|PBKS|SRH|RCB|KKR|MI|CSK|DC|RR|GT|LSG/i.test(t)) titles.push(t)
    }
    return [...new Set(titles)].slice(0, 15)
  } catch { return [] }
}

function parseMatchInfo(headlines: string[]): { latestResult: string; nextMatch: string; liveScore: string | null } {
  let latestResult = ''
  let liveScore: string | null = null
  let nextMatch = ''
  for (const h of headlines) {
    const lower = h.toLowerCase()
    if (!latestResult && (lower.includes('beat') || lower.includes('won') || lower.includes('win'))) latestResult = h.slice(0, 120)
    if (!liveScore   && (lower.includes('live') || lower.includes('batting') || lower.includes('over')))    liveScore   = h.slice(0, 120)
    if (!nextMatch   && (lower.includes(' vs ')  || lower.includes('preview'))) nextMatch = h.slice(0, 120)
  }
  return {
    latestResult: latestResult || 'SRH beat MI chasing 244 (Apr 30)',
    nextMatch:    nextMatch    || 'GT vs RCB — Today 7:30 PM IST',
    liveScore,
  }
}

// ── In-memory cache ───────────────────────────────────────────────────────────
type ResponseData = {
  source: string; matches: unknown[]; standings: StandingRow[]
  latestResult: string; nextMatch: string; liveScore: string | null
  headlineCount: number; updatedAt: string
}
let cache: { data: ResponseData; fetchedAt: number } | null = null
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

async function buildResponse(): Promise<ResponseData> {
  const [standings, headlines] = await Promise.all([
    fetchLiveStandings(),
    fetchHeadlines(),
  ])

  const finalStandings = (standings && standings.length >= 8) ? standings : STATIC_STANDINGS
  const { latestResult, nextMatch, liveScore } = parseMatchInfo(headlines)

  const matches = [
    ...(latestResult ? [{ id: 'latest', name: latestResult, status: latestResult, teams: [], live: false, matchType: 'T20', date: 'Latest'   }] : []),
    ...(liveScore    ? [{ id: 'live',   name: liveScore,    status: liveScore,    teams: [], live: true,  matchType: 'T20', date: 'Live'     }] : []),
    ...(nextMatch    ? [{ id: 'next',   name: nextMatch,    status: nextMatch,    teams: [], live: false, matchType: 'T20', date: 'Upcoming' }] : []),
  ]

  return {
    source:        standings ? 'live-cricbuzz' : 'static',
    matches,
    standings:     finalStandings,
    latestResult,
    nextMatch,
    liveScore,
    headlineCount: headlines.length,
    updatedAt:     new Date().toISOString(),
  }
}

export async function GET() {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return NextResponse.json({ ...cache.data, cached: true }, { headers: { 'Cache-Control': 'no-store' } })
  }
  try {
    const data = await buildResponse()
    cache = { data, fetchedAt: Date.now() }
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({
      source: 'static', matches: [], standings: STATIC_STANDINGS,
      latestResult: 'SRH beat MI chasing 244 (Apr 30)',
      nextMatch: 'GT vs RCB — Today 7:30 PM IST',
      liveScore: null, updatedAt: new Date().toISOString(),
    }, { headers: { 'Cache-Control': 'no-store' } })
  }
}
