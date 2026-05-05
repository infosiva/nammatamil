/**
 * /api/cricket — IPL 2026 live standings + match headlines
 * Strategy:
 *   1. Scrape Cricbuzz IPL 2026 points table (regex on embedded JS data)
 *   2. Fetch live headlines from ESPN Cricinfo RSS + Cricbuzz schedule
 *   3. Minimal static fallback ONLY for team colours — no hardcoded scores/dates
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

interface StandingRow {
  pos: number; short: string; name: string; played: number
  w: number; l: number; pts: number; nrr: string; color: string
}

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

// ── Scrape Cricbuzz IPL 2026 points table ─────────────────────────────────────
async function fetchLiveStandings(): Promise<StandingRow[] | null> {
  try {
    const res = await fetch(
      'https://www.cricbuzz.com/cricket-series/9241/indian-premier-league-2026/points-table',
      {
        headers: { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml' },
        signal: AbortSignal.timeout(9000),
        cache: 'no-store',
      }
    )
    if (!res.ok) return null
    const html = await res.text()

    // Data is double-escaped inside self.__next_f.push() calls
    const rowPattern = /\\"teamFullName\\":\\"([^\\]+)\\",\\"teamName\\":\\"([^\\]+)\\",\\"teamId\\":\d+,\\"matchesPlayed\\":(\d+),\\"matchesWon\\":(\d+),\\"matchesLost\\":(\d+),\\"matchesTied\\":\d+,\\"noRes\\":(\d+),\\"matchesDrawn\\":\d+,\\"nrr\\":\\"([^\\]+)\\",\\"points\\":(\d+)/g

    const rows: StandingRow[] = []
    let match: RegExpExecArray | null
    let pos = 1

    while ((match = rowPattern.exec(html)) !== null) {
      const [, , short, played, w, l, , nrr, pts] = match
      if (!(short in TEAM_COLORS)) continue
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

    // Try alternate pattern (plain JSON in HTML)
    if (rows.length < 5) {
      const alt = /\"teamName\":\"([A-Z]{2,4})\",\"matchesPlayed\":(\d+),\"matchesWon\":(\d+),\"matchesLost\":(\d+)[^}]*\"nrr\":\"([^\"]+)\",\"points\":(\d+)/g
      let m2: RegExpExecArray | null
      while ((m2 = alt.exec(html)) !== null) {
        const [, short, played, w, l, nrr, pts] = m2
        if (!(short in TEAM_COLORS)) continue
        if (rows.find(r => r.short === short)) continue
        rows.push({
          pos: rows.length + 1, short,
          name: TEAM_NAMES[short] ?? short,
          played: parseInt(played), w: parseInt(w), l: parseInt(l),
          pts: parseInt(pts), nrr,
          color: TEAM_COLORS[short] ?? '#6b7280',
        })
      }
    }

    return rows.length >= 5 ? rows.sort((a, b) => b.pts - a.pts || parseFloat(b.nrr) - parseFloat(a.nrr)).map((r, i) => ({ ...r, pos: i + 1 })) : null
  } catch {
    return null
  }
}

// ── Fetch headlines from multiple sources ─────────────────────────────────────
async function fetchHeadlines(): Promise<string[]> {
  const sources = [
    // ESPN Cricinfo IPL feed
    'https://www.espncricinfo.com/rss/content/story/feeds/0.xml',
    // CricBuzz IPL news RSS
    'https://www.cricbuzz.com/rss-feeds/rcbuzz-ipl-news',
    // Google News IPL
    'https://news.google.com/rss/search?q=IPL+2026&hl=en-IN&gl=IN&ceid=IN:en',
  ]

  const allTitles: string[] = []
  await Promise.allSettled(sources.map(async url => {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(5000),
        headers: { 'User-Agent': 'Mozilla/5.0 NammaTamil/1.0' },
      })
      if (!res.ok) return
      const xml = await res.text()
      for (const m of xml.matchAll(/<title>([\s\S]*?)<\/title>/g)) {
        const t = (m[1] ?? '').replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '')
          .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim()
        if (t.length > 15 && /ipl|PBKS|SRH|RCB|KKR|MI|CSK|DC|RR|GT|LSG/i.test(t)) {
          allTitles.push(t)
        }
      }
    } catch { /* skip */ }
  }))

  return [...new Set(allTitles)].slice(0, 20)
}

// ── Scrape Cricbuzz for live/upcoming match ───────────────────────────────────
async function fetchMatchStatus(): Promise<{ liveScore: string | null; latestResult: string; nextMatch: string }> {
  let liveScore: string | null = null
  let latestResult = ''
  let nextMatch = ''

  try {
    const res = await fetch('https://www.cricbuzz.com/cricket-match/live-scores', {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    })
    if (res.ok) {
      const html = await res.text()
      // Extract IPL match cards — look for team names + score patterns
      const teamPattern = new RegExp(`(${Object.keys(TEAM_COLORS).join('|')})`, 'g')
      const scoreBlocks = html.match(/\d{2,3}\/\d{1,2}[^<]{0,30}ov/g) ?? []

      // Find live IPL match
      const liveBlock = html.match(/(?:LIVE|In Progress)[^>]*>[^<]*<[^>]*>([^<]{5,80}(?:PBKS|SRH|RCB|KKR|MI|CSK|DC|RR|GT|LSG)[^<]{0,80})/i)?.[1]
      if (liveBlock) liveScore = liveBlock.replace(/<[^>]+>/g, '').trim().slice(0, 120)

      // Find completed IPL result
      const resultBlock = html.match(/(?:won by|beat)[^<]{5,120}(?:PBKS|SRH|RCB|KKR|MI|CSK|DC|RR|GT|LSG)/i)?.[0]
      if (resultBlock) latestResult = resultBlock.replace(/<[^>]+>/g, '').trim().slice(0, 120)

      // Suppress unused vars
      void teamPattern; void scoreBlocks
    }
  } catch { /* skip */ }

  // If no live score from Cricbuzz, parse from RSS headlines
  if (!liveScore || !latestResult) {
    const headlines = await fetchHeadlines()
    for (const h of headlines) {
      const lower = h.toLowerCase()
      if (!latestResult && (lower.includes('beat') || lower.includes('won') || lower.includes('win'))) {
        latestResult = h.slice(0, 120)
      }
      if (!liveScore && (lower.includes('batting') || lower.includes('bowling') || lower.includes('over') || lower.includes('live'))) {
        liveScore = h.slice(0, 120)
      }
      if (!nextMatch && lower.includes(' vs ') && !lower.includes('beat') && !lower.includes('won')) {
        nextMatch = h.slice(0, 120)
      }
    }
  }

  // Try Cricbuzz schedule for next match
  if (!nextMatch) {
    try {
      const res = await fetch('https://www.cricbuzz.com/cricket-series/9241/indian-premier-league-2026/matches', {
        headers: { 'User-Agent': UA },
        signal: AbortSignal.timeout(6000),
        cache: 'no-store',
      })
      if (res.ok) {
        const html = await res.text()
        // Find upcoming match (contains "Upcoming" and team names)
        const upBlock = html.match(/Upcoming[^<]{0,200}((?:PBKS|SRH|RCB|KKR|MI|CSK|DC|RR|GT|LSG)[^<]{0,80}vs[^<]{0,80}(?:PBKS|SRH|RCB|KKR|MI|CSK|DC|RR|GT|LSG)[^<]{0,80})/i)?.[1]
        if (upBlock) nextMatch = upBlock.replace(/<[^>]+>/g, '').trim().slice(0, 120)
      }
    } catch { /* skip */ }
  }

  return { liveScore, latestResult, nextMatch }
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
  const [standings, matchStatus] = await Promise.all([
    fetchLiveStandings(),
    fetchMatchStatus(),
  ])

  const { latestResult, nextMatch, liveScore } = matchStatus
  const finalStandings = standings ?? []

  const matches = [
    ...(liveScore    ? [{ id: 'live',   status: liveScore,    live: true,  date: 'Live'     }] : []),
    ...(latestResult ? [{ id: 'latest', status: latestResult, live: false, date: 'Latest'   }] : []),
    ...(nextMatch    ? [{ id: 'next',   status: nextMatch,    live: false, date: 'Upcoming' }] : []),
  ]

  return {
    source:        standings ? 'live-cricbuzz' : 'no-data',
    matches,
    standings:     finalStandings,
    latestResult,
    nextMatch,
    liveScore,
    headlineCount: matches.length,
    updatedAt:     new Date().toISOString(),
  }
}

export async function GET(req: Request) {
  // Manual refresh — bust cache
  const url = new URL(req.url)
  const bustCache = url.searchParams.has('t')
  if (bustCache) cache = null

  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return NextResponse.json({ ...cache.data, cached: true }, { headers: { 'Cache-Control': 'no-store' } })
  }
  try {
    const data = await buildResponse()
    cache = { data, fetchedAt: Date.now() }
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({
      source: 'error', matches: [], standings: [],
      latestResult: '', nextMatch: '', liveScore: null,
      updatedAt: new Date().toISOString(),
    }, { headers: { 'Cache-Control': 'no-store' } })
  }
}
