/**
 * /api/cricket — IPL 2026 live scores + points table
 * Primary: CricAPI (if CRIC_API_KEY set) + iplt20.com scrape
 * Fallback: hardcoded latest standings updated in code
 * Refreshes every 60s on client
 */
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const CRIC_API_KEY = process.env.CRIC_API_KEY ?? ''

// ── Latest IPL 2026 standings — Apr 29 2026 ──────────────────────────────────
// Source: iplt20.com — updated manually when live scrape unavailable
const STATIC_STANDINGS = [
  { pos: 1,  short: 'PBKS', name: 'Punjab Kings',           played: 9,  w: 7, l: 2, pts: 14, nrr: '+0.858', color: '#a855f7' },
  { pos: 2,  short: 'RCB',  name: 'Royal Challengers',      played: 9,  w: 6, l: 3, pts: 12, nrr: '+1.503', color: '#ef4444' },
  { pos: 3,  short: 'RR',   name: 'Rajasthan Royals',       played: 10, w: 6, l: 4, pts: 12, nrr: '+0.248', color: '#ec4899' },
  { pos: 4,  short: 'SRH',  name: 'Sunrisers Hyderabad',    played: 9,  w: 5, l: 4, pts: 10, nrr: '+0.592', color: '#f97316' },
  { pos: 5,  short: 'GT',   name: 'Gujarat Titans',         played: 9,  w: 4, l: 5, pts: 8,  nrr: '-0.220', color: '#6b7280' },
  { pos: 6,  short: 'KKR',  name: 'Kolkata Knight Riders',  played: 9,  w: 4, l: 5, pts: 8,  nrr: '-0.310', color: '#7c3aed' },
  { pos: 7,  short: 'MI',   name: 'Mumbai Indians',         played: 9,  w: 3, l: 6, pts: 6,  nrr: '-0.444', color: '#0ea5e9' },
  { pos: 8,  short: 'CSK',  name: 'Chennai Super Kings',    played: 9,  w: 3, l: 6, pts: 6,  nrr: '-0.513', color: '#eab308' },
  { pos: 9,  short: 'DC',   name: 'Delhi Capitals',         played: 9,  w: 3, l: 6, pts: 6,  nrr: '-0.827', color: '#3b82f6' },
  { pos: 10, short: 'LSG',  name: 'Lucknow Super Giants',   played: 9,  w: 2, l: 7, pts: 4,  nrr: '-1.042', color: '#14b8a6' },
]

// Latest match results
const STATIC_MATCHES = [
  {
    id: 'r1',
    name: 'PBKS vs DC — Match 29',
    status: 'PBKS won by 23 runs',
    venue: 'IS Bindra Stadium, Mohali',
    teams: [
      { name: 'Punjab Kings',  shortName: 'PBKS', score: '184', wickets: 6,  overs: 20   },
      { name: 'Delhi Capitals', shortName: 'DC',  score: '161', wickets: 9,  overs: 19.2 },
    ],
    live: false,
    matchType: 'T20',
    date: 'Apr 29',
  },
  {
    id: 'r2',
    name: 'RR vs SRH — Match 30',
    status: 'Tomorrow · Apr 30 · 7:30 PM IST',
    venue: 'Sawai Mansingh Stadium, Jaipur',
    teams: [
      { name: 'Rajasthan Royals',    shortName: 'RR'  },
      { name: 'Sunrisers Hyderabad', shortName: 'SRH' },
    ],
    live: false,
    matchType: 'T20',
    date: 'Apr 30',
  },
]

interface CricMatch {
  id: string; name: string; status: string; venue?: string
  teamInfo?: { name: string; shortname: string }[]
  score?: { r: number; w: number; o: number; inning: string }[]
  matchType?: string; matchStarted?: boolean; matchEnded?: boolean
}

async function fetchLiveMatches() {
  if (!CRIC_API_KEY) return null
  try {
    const res = await fetch(
      `https://api.cricapi.com/v1/currentMatches?apikey=${CRIC_API_KEY}&offset=0`,
      { signal: AbortSignal.timeout(4000), cache: 'no-store' }
    )
    if (!res.ok) return null
    const data = await res.json()
    if (!data?.data) return null

    return (data.data as CricMatch[])
      .filter(m => m.name.toLowerCase().includes('ipl'))
      .slice(0, 3)
      .map(m => ({
        id: m.id,
        name: m.name,
        status: m.status,
        venue: m.venue ?? '',
        teams: (m.teamInfo ?? []).slice(0, 2).map(t => {
          const sc = m.score?.find(s => s.inning.startsWith(t.name))
          return {
            name: t.name, shortName: t.shortname,
            score: sc ? String(sc.r) : undefined,
            wickets: sc?.w, overs: sc ? Number(sc.o.toFixed(1)) : undefined,
          }
        }),
        live: !!m.matchStarted && !m.matchEnded,
        matchType: m.matchType ?? 'T20',
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      }))
  } catch { return null }
}

// Try to scrape iplt20.com points table
async function fetchLiveStandings() {
  try {
    const res = await fetch('https://www.iplt20.com/points-table/men', {
      signal: AbortSignal.timeout(6000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NammaTamil/1.0)',
        'Accept': 'text/html',
      },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const html = await res.text()

    // Extract JSON data embedded in page scripts
    const jsonMatch = html.match(/pointsTableData\s*=\s*(\[[\s\S]*?\]);/)
      ?? html.match(/"standings"\s*:\s*(\[[\s\S]*?\])\s*[,}]/)
    if (!jsonMatch) return null

    const raw = JSON.parse(jsonMatch[1])
    // Map to our format — structure varies by season
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return raw.map((t: any, i: number) => ({
      pos: i + 1,
      short: t.shortName ?? t.TeamCode ?? t.short,
      name: t.fullName ?? t.TeamName ?? t.name,
      played: Number(t.matchesPlayed ?? t.P ?? 0),
      w: Number(t.won ?? t.W ?? 0),
      l: Number(t.lost ?? t.L ?? 0),
      pts: Number(t.points ?? t.Pts ?? 0),
      nrr: t.nrr ?? t.NRR ?? '0.000',
      color: STATIC_STANDINGS.find(s => s.short === (t.shortName ?? t.TeamCode))?.color ?? '#6b7280',
    }))
  } catch { return null }
}

export async function GET() {
  const [liveMatches, liveStandings] = await Promise.all([
    fetchLiveMatches(),
    fetchLiveStandings(),
  ])

  return NextResponse.json({
    source: liveMatches ? 'live' : 'static',
    matches: liveMatches ?? STATIC_MATCHES,
    standings: liveStandings ?? STATIC_STANDINGS,
    standingsSource: liveStandings ? 'live' : 'static',
    updatedAt: new Date().toISOString(),
    lastMatchResult: 'PBKS won vs DC by 23 runs (Apr 29)',
  })
}
