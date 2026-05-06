/**
 * /api/cricket — IPL 2026 live standings + rich match context
 *
 * Returns:
 *  - standings[]       : live points table from Cricbuzz (fallback: static)
 *  - lastMatch         : { teams, result, margin, date, winner }
 *  - nextMatch         : { teams, venue, dateLabel, team1, team2 }
 *  - winProbability    : { team1, pct1, team2, pct2, basis } — NRR+form based
 *  - liveScore         : string | null
 *  - headlines[]       : top 5 IPL news titles
 *
 * Sources: Google News RSS (reliable), Cricbuzz HTML scrape, ESPN Cricinfo RSS
 * Cache: 5 minutes
 */
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// ── Team metadata ─────────────────────────────────────────────────────────────
const TEAM_COLORS: Record<string, string> = {
  PBKS: '#a855f7', RCB: '#ef4444', RR: '#ec4899', SRH: '#f97316',
  GT:   '#6b7280', KKR: '#7c3aed', MI: '#0ea5e9', CSK: '#eab308',
  DC:   '#3b82f6', LSG: '#14b8a6',
}
const TEAM_NAMES: Record<string, string> = {
  PBKS: 'Punjab Kings',       RCB: 'Royal Challengers',
  RR:   'Rajasthan Royals',   SRH: 'Sunrisers Hyderabad',
  GT:   'Gujarat Titans',     KKR: 'Kolkata Knight Riders',
  MI:   'Mumbai Indians',     CSK: 'Chennai Super Kings',
  DC:   'Delhi Capitals',     LSG: 'Lucknow Super Giants',
}
const TEAMS = Object.keys(TEAM_COLORS)
const TEAM_RE = new RegExp(`\\b(${TEAMS.join('|')})\\b`, 'g')

interface StandingRow {
  pos: number; short: string; name: string; played: number
  w: number; l: number; pts: number; nrr: string; color: string
}
interface MatchInfo {
  team1: string; team2: string
  result?: string       // e.g. "PBKS won by 6 wickets"
  margin?: string       // e.g. "6 wickets" / "34 runs"
  winner?: string       // short code
  venue?: string
  dateLabel?: string    // "Today, 7:30 PM" / "Tomorrow" / "Sun, May 10"
  live?: boolean
  score?: string        // live score string
}
interface WinProbability {
  team1: string; team2: string
  pct1: number; pct2: number
  basis: string         // short explanation
}

// ── Static fallback standings (May 6 2026) ────────────────────────────────────
const STATIC_STANDINGS: StandingRow[] = [
  { pos: 1,  short: 'PBKS', name: 'Punjab Kings',         played: 9,  w: 6, l: 2, pts: 13, nrr: '+0.855', color: '#a855f7' },
  { pos: 2,  short: 'RCB',  name: 'Royal Challengers',    played: 9,  w: 6, l: 3, pts: 12, nrr: '+1.420', color: '#ef4444' },
  { pos: 3,  short: 'SRH',  name: 'Sunrisers Hyderabad',  played: 10, w: 6, l: 4, pts: 12, nrr: '+0.644', color: '#f97316' },
  { pos: 4,  short: 'RR',   name: 'Rajasthan Royals',     played: 10, w: 6, l: 4, pts: 12, nrr: '+0.510', color: '#ec4899' },
  { pos: 5,  short: 'GT',   name: 'Gujarat Titans',       played: 10, w: 6, l: 4, pts: 12, nrr: '-0.147', color: '#6b7280' },
  { pos: 6,  short: 'CSK',  name: 'Chennai Super Kings',  played: 9,  w: 4, l: 5, pts: 8,  nrr: '+0.005', color: '#eab308' },
  { pos: 7,  short: 'DC',   name: 'Delhi Capitals',       played: 9,  w: 4, l: 5, pts: 8,  nrr: '-0.895', color: '#3b82f6' },
  { pos: 8,  short: 'KKR',  name: 'Kolkata Knight Riders',played: 9,  w: 3, l: 5, pts: 7,  nrr: '-0.539', color: '#7c3aed' },
  { pos: 9,  short: 'MI',   name: 'Mumbai Indians',       played: 9,  w: 2, l: 7, pts: 4,  nrr: '-0.803', color: '#0ea5e9' },
  { pos: 10, short: 'LSG',  name: 'Lucknow Super Giants', played: 8,  w: 2, l: 6, pts: 4,  nrr: '-1.106', color: '#14b8a6' },
]

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

// ── Helpers ───────────────────────────────────────────────────────────────────
function cleanText(s: string): string {
  return s.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim()
}

function extractTeams(text: string): string[] {
  const found = [...new Set([...text.matchAll(TEAM_RE)].map(m => m[1]))]
  return found.slice(0, 2)
}

function parseMargin(text: string): string {
  const m = text.match(/by\s+(\d+\s+(?:wickets?|runs?))/i)
  return m ? m[1] : ''
}

// ── NRR/form-based win probability ───────────────────────────────────────────
function calcWinProbability(
  t1: string, t2: string, standings: StandingRow[]
): WinProbability {
  const s1 = standings.find(s => s.short === t1)
  const s2 = standings.find(s => s.short === t2)
  if (!s1 || !s2) return { team1: t1, team2: t2, pct1: 50, pct2: 50, basis: 'equal' }

  // Score = pts weight (60%) + NRR weight (30%) + win-rate weight (10%)
  const nrr1 = parseFloat(s1.nrr) || 0
  const nrr2 = parseFloat(s2.nrr) || 0
  const wr1  = s1.played > 0 ? s1.w / s1.played : 0.5
  const wr2  = s2.played > 0 ? s2.w / s2.played : 0.5

  const score1 = s1.pts * 0.6 + nrr1 * 0.3 + wr1 * 10 * 0.1
  const score2 = s2.pts * 0.6 + nrr2 * 0.3 + wr2 * 10 * 0.1

  const total  = score1 + score2 || 1
  let pct1 = Math.round((score1 / total) * 100)
  // Clamp to 30-70 — true cricket is never certain
  pct1 = Math.max(30, Math.min(70, pct1))
  const pct2 = 100 - pct1

  const basis = `Based on points (${s1.pts} vs ${s2.pts}) & NRR (${s1.nrr} vs ${s2.nrr})`
  return { team1: t1, team2: t2, pct1, pct2, basis }
}

// ── Scrape Cricbuzz points table ──────────────────────────────────────────────
async function fetchLiveStandings(): Promise<StandingRow[] | null> {
  try {
    const res = await fetch(
      'https://www.cricbuzz.com/cricket-series/9241/indian-premier-league-2026/points-table',
      { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(9000), cache: 'no-store' }
    )
    if (!res.ok) return null
    const html = await res.text()

    const rowPattern = /\\"teamFullName\\":\\"([^\\]+)\\",\\"teamName\\":\\"([^\\]+)\\",\\"teamId\\":\d+,\\"matchesPlayed\\":(\d+),\\"matchesWon\\":(\d+),\\"matchesLost\\":(\d+),\\"matchesTied\\":\d+,\\"noRes\\":(\d+),\\"matchesDrawn\\":\d+,\\"nrr\\":\\"([^\\]+)\\",\\"points\\":(\d+)/g
    const rows: StandingRow[] = []
    let m: RegExpExecArray | null, pos = 1
    while ((m = rowPattern.exec(html)) !== null) {
      const [,, short, played, w, l,, nrr, pts] = m
      if (!(short in TEAM_COLORS)) continue
      rows.push({ pos: pos++, short, name: TEAM_NAMES[short] ?? short,
        played: +played, w: +w, l: +l, pts: +pts, nrr, color: TEAM_COLORS[short] })
    }

    // Alternate pattern
    if (rows.length < 5) {
      const alt = /"teamName":"([A-Z]{2,4})","matchesPlayed":(\d+),"matchesWon":(\d+),"matchesLost":(\d+)[^}]*"nrr":"([^"]+)","points":(\d+)/g
      let m2: RegExpExecArray | null
      while ((m2 = alt.exec(html)) !== null) {
        const [, short, played, w, l, nrr, pts] = m2
        if (!(short in TEAM_COLORS) || rows.find(r => r.short === short)) continue
        rows.push({ pos: rows.length + 1, short, name: TEAM_NAMES[short] ?? short,
          played: +played, w: +w, l: +l, pts: +pts, nrr, color: TEAM_COLORS[short] })
      }
    }

    return rows.length >= 5
      ? rows.sort((a, b) => b.pts - a.pts || parseFloat(b.nrr) - parseFloat(a.nrr))
            .map((r, i) => ({ ...r, pos: i + 1 }))
      : null
  } catch { return null }
}

// ── Parse rich match info from RSS items ──────────────────────────────────────
interface RSSItem { title: string; desc: string; pubDate: string; link: string }

function parseRSSItems(xml: string): RSSItem[] {
  const items: RSSItem[] = []
  for (const [, block] of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const title = cleanText(
      block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1] ??
      block.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? ''
    )
    const desc = cleanText(
      block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1] ??
      block.match(/<description>([\s\S]*?)<\/description>/)?.[1] ?? ''
    ).slice(0, 300)
    const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1]?.trim() ?? ''
    const link = (
      block.match(/<link>(https?:[^<]+)<\/link>/)?.[1] ??
      block.match(/<guid[^>]*>(https?:[^<]+)<\/guid>/)?.[1] ?? ''
    ).trim()
    if (title.length > 10) items.push({ title, desc, pubDate, link })
  }
  return items
}

// ── Fetch RSS from multiple sources ──────────────────────────────────────────
async function fetchAllRSS(): Promise<RSSItem[]> {
  const feeds = [
    'https://news.google.com/rss/search?q=IPL+2026+match&hl=en-IN&gl=IN&ceid=IN:en',
    'https://news.google.com/rss/search?q=IPL+2026+result&hl=en-IN&gl=IN&ceid=IN:en',
    'https://www.espncricinfo.com/rss/content/story/feeds/0.xml',
  ]
  const all: RSSItem[] = []
  await Promise.allSettled(feeds.map(async url => {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(5000),
        headers: { 'User-Agent': 'Mozilla/5.0 NammaTamil/1.0' },
      })
      if (!res.ok) return
      const xml = await res.text()
      const items = parseRSSItems(xml).filter(i =>
        /ipl|PBKS|SRH|RCB|KKR|MI|CSK|DC|RR|GT|LSG/i.test(i.title)
      )
      all.push(...items)
    } catch { /* skip */ }
  }))
  // Deduplicate by title prefix
  const seen = new Set<string>()
  return all.filter(i => {
    const k = i.title.toLowerCase().slice(0, 50)
    if (seen.has(k)) return false
    seen.add(k); return true
  })
}

// ── Derive last match + next match from RSS items ─────────────────────────────
function extractMatchInfo(items: RSSItem[]): {
  lastMatch: MatchInfo | null
  nextMatch: MatchInfo | null
  liveMatch: MatchInfo | null
  headlines: string[]
} {
  let lastMatch: MatchInfo | null = null
  let nextMatch: MatchInfo | null = null
  let liveMatch: MatchInfo | null = null
  const headlines: string[] = []

  for (const item of items) {
    const t = item.title
    const lower = t.toLowerCase()
    const teams = extractTeams(t)

    // Live match
    if (!liveMatch && (lower.includes('live') || lower.includes('batting') || lower.includes('bowling'))) {
      if (teams.length >= 1) {
        liveMatch = { team1: teams[0], team2: teams[1] ?? '', score: t.slice(0, 120), live: true }
      }
    }

    // Result match — "X beat Y" / "X won by Z"
    if (!lastMatch && (lower.includes(' beat ') || lower.includes(' won by') || lower.includes('wins by'))) {
      if (teams.length >= 2) {
        const winner = lower.includes(`${teams[0].toLowerCase()} beat`) ||
                       lower.includes(`${teams[0].toLowerCase()} won`) ? teams[0] : teams[1]
        lastMatch = {
          team1: teams[0], team2: teams[1],
          result: t.slice(0, 140),
          margin: parseMargin(t),
          winner,
          dateLabel: relativeDate(item.pubDate),
        }
      } else if (teams.length === 1) {
        lastMatch = { team1: teams[0], team2: '', result: t.slice(0, 140), margin: parseMargin(t), winner: teams[0], dateLabel: relativeDate(item.pubDate) }
      }
    }

    // Upcoming — "X vs Y" without result keywords
    if (!nextMatch && lower.includes(' vs ') &&
        !lower.includes('beat') && !lower.includes('won') && !lower.includes('win') && !lower.includes('result')) {
      if (teams.length >= 2) {
        // Try to extract venue
        const venueM = t.match(/at\s+([A-Z][^,.\n]{4,40}(?:Stadium|Ground|Oval|Eden|Wankhede|Chinnaswamy|Narendra))/i)
        nextMatch = {
          team1: teams[0], team2: teams[1],
          venue: venueM?.[1]?.trim() ?? '',
          dateLabel: relativeDate(item.pubDate),
        }
      }
    }

    if (headlines.length < 5) headlines.push(t)
  }

  return { lastMatch, nextMatch, liveMatch, headlines }
}

function relativeDate(pubDate: string): string {
  try {
    const d = new Date(pubDate)
    if (isNaN(d.getTime())) return ''
    const diffMs  = d.getTime() - Date.now()
    const diffMin = Math.round(diffMs / 60000)
    if (diffMin > 60 * 20) {
      // Future date
      const diffH = Math.round(diffMs / 3600000)
      if (diffH < 24) return `Today, ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`
      if (diffH < 48) return `Tomorrow`
      return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
    }
    // Past
    const agoMin = Math.abs(diffMin)
    if (agoMin < 60)  return `${agoMin}m ago`
    const agoH = Math.floor(agoMin / 60)
    if (agoH < 24)    return `${agoH}h ago`
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
  } catch { return '' }
}

// ── In-memory cache ───────────────────────────────────────────────────────────
type ResponseData = {
  source: string
  standings: StandingRow[]
  lastMatch: MatchInfo | null
  nextMatch: MatchInfo | null
  liveMatch: MatchInfo | null
  winProbability: WinProbability | null
  headlines: string[]
  updatedAt: string
  // legacy fields for backward compat
  latestResult: string
  liveScore: string | null
  matches: unknown[]
  headlineCount: number
}

let cache: { data: ResponseData; fetchedAt: number } | null = null
const CACHE_TTL = 5 * 60 * 1000

async function buildResponse(): Promise<ResponseData> {
  const [standingsRaw, rssItems] = await Promise.all([
    fetchLiveStandings(),
    fetchAllRSS(),
  ])

  const standings = standingsRaw ?? STATIC_STANDINGS
  const { lastMatch, nextMatch, liveMatch, headlines } = extractMatchInfo(rssItems)

  // Win probability for next match (or live match)
  const matchForProb = nextMatch ?? liveMatch
  const winProbability = matchForProb?.team1 && matchForProb?.team2
    ? calcWinProbability(matchForProb.team1, matchForProb.team2, standings)
    : null

  return {
    source:         standingsRaw ? 'live-cricbuzz' : 'fallback',
    standings,
    lastMatch,
    nextMatch,
    liveMatch,
    winProbability,
    headlines:      headlines.slice(0, 5),
    updatedAt:      new Date().toISOString(),
    // legacy
    latestResult:   lastMatch?.result ?? '',
    liveScore:      liveMatch?.score ?? null,
    matches:        [],
    headlineCount:  headlines.length,
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  if (url.searchParams.has('t')) cache = null

  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return NextResponse.json({ ...cache.data, cached: true }, { headers: { 'Cache-Control': 'no-store' } })
  }
  try {
    const data = await buildResponse()
    cache = { data, fetchedAt: Date.now() }
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({
      source: 'error', standings: [], lastMatch: null, nextMatch: null,
      liveMatch: null, winProbability: null, headlines: [],
      latestResult: '', liveScore: null, matches: [], headlineCount: 0,
      updatedAt: new Date().toISOString(),
    }, { headers: { 'Cache-Control': 'no-store' } })
  }
}
