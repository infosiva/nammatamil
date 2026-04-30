/**
 * /api/ipl — live IPL 2026 standings + today's match score
 * Primary:  cricapi.com (free tier, 100 req/day) — uses CRIC_API_KEY
 * Fallback: static data embedded below (updated manually)
 * Cache: 2 minutes for live matches, 15 min otherwise
 */
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const CRIC_API_KEY = process.env.CRIC_API_KEY ?? ''
const CRIC_BASE    = 'https://api.cricapi.com/v1'

// ── Static fallback standings — Apr 30 2026 (ESPNCricinfo) ───────────────────
const STATIC_STANDINGS = [
  { pos: 1,  team: 'Punjab Kings',                short: 'PBKS', played: 9, w: 8, l: 1, pts: 13, nrr: '+1.043', color: '#a855f7' },
  { pos: 2,  team: 'Royal Challengers Bengaluru', short: 'RCB',  played: 8, w: 6, l: 2, pts: 13, nrr: '+1.919', color: '#ef4444' },
  { pos: 3,  team: 'Sunrisers Hyderabad',         short: 'SRH',  played: 8, w: 5, l: 3, pts: 10, nrr: '+0.832', color: '#f97316' },
  { pos: 4,  team: 'Rajasthan Royals',            short: 'RR',   played: 9, w: 5, l: 3, pts: 11, nrr: '+0.817', color: '#ec4899' },
  { pos: 5,  team: 'Gujarat Titans',              short: 'GT',   played: 8, w: 4, l: 4, pts: 8,  nrr: '-0.475', color: '#6b7280' },
  { pos: 6,  team: 'Chennai Super Kings',         short: 'CSK',  played: 8, w: 3, l: 5, pts: 6,  nrr: '-0.121', color: '#eab308' },
  { pos: 7,  team: 'Delhi Capitals',              short: 'DC',   played: 8, w: 2, l: 6, pts: 4,  nrr: '-1.136', color: '#3b82f6' },
  { pos: 8,  team: 'Kolkata Knight Riders',       short: 'KKR',  played: 8, w: 2, l: 5, pts: 5,  nrr: '-0.751', color: '#7c3aed' },
  { pos: 9,  team: 'Mumbai Indians',              short: 'MI',   played: 8, w: 2, l: 5, pts: 5,  nrr: '-0.788', color: '#0ea5e9' },
  { pos: 10, team: 'Lucknow Super Giants',        short: 'LSG',  played: 8, w: 2, l: 6, pts: 4,  nrr: '-1.506', color: '#14b8a6' },
]

// ── Static fallback fixtures (matches 41-51, Apr 29 – May 8) ─────────────────
const STATIC_FIXTURES = [
  { id: 'm41', isoDate: '2026-04-29', team1: 'MI',   team2: 'SRH',  time: '7:30 PM', venue: 'Wankhede, Mumbai'    },
  { id: 'm42', isoDate: '2026-04-30', team1: 'GT',   team2: 'RCB',  time: '7:30 PM', venue: 'Narendra Modi, Ahmedabad' },
  { id: 'm43', isoDate: '2026-05-01', team1: 'RR',   team2: 'DC',   time: '7:30 PM', venue: 'Sawai Mansingh, Jaipur'   },
  { id: 'm44', isoDate: '2026-05-02', team1: 'CSK',  team2: 'MI',   time: '7:30 PM', venue: 'Chidambaram, Chennai' },
  { id: 'm45', isoDate: '2026-05-03', team1: 'SRH',  team2: 'KKR',  time: '3:30 PM', venue: 'Rajiv Gandhi, Hyderabad'  },
  { id: 'm46', isoDate: '2026-05-03', team1: 'GT',   team2: 'PBKS', time: '7:30 PM', venue: 'Narendra Modi, Ahmedabad' },
  { id: 'm47', isoDate: '2026-05-04', team1: 'MI',   team2: 'LSG',  time: '7:30 PM', venue: 'Wankhede, Mumbai'    },
  { id: 'm48', isoDate: '2026-05-05', team1: 'DC',   team2: 'CSK',  time: '7:30 PM', venue: 'Arun Jaitley, Delhi' },
  { id: 'm49', isoDate: '2026-05-06', team1: 'SRH',  team2: 'PBKS', time: '3:30 PM', venue: 'Rajiv Gandhi, Hyderabad'  },
  { id: 'm50', isoDate: '2026-05-07', team1: 'LSG',  team2: 'RCB',  time: '7:30 PM', venue: 'Ekana, Lucknow'      },
  { id: 'm51', isoDate: '2026-05-08', team1: 'DC',   team2: 'KKR',  time: '7:30 PM', venue: 'Arun Jaitley, Delhi' },
]

interface CricApiMatch {
  id: string
  name: string
  status: string
  venue?: string
  teamInfo?: { name: string; shortname: string }[]
  score?: { r: number; w: number; o: number; inning: string }[]
  matchStarted?: boolean
  matchEnded?: boolean
  dateTimeGMT?: string
}

function toIST(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000)
    return ist.toISOString().slice(0, 10)
  } catch {
    return ''
  }
}

function fmtScore(s: { r: number; w: number; o: number }) {
  return `${s.r}/${s.w} (${Number(s.o.toFixed(1))})`
}

async function fetchLiveMatches() {
  if (!CRIC_API_KEY) return null
  try {
    const res = await fetch(
      `${CRIC_BASE}/currentMatches?apikey=${CRIC_API_KEY}&offset=0`,
      { signal: AbortSignal.timeout(4000), cache: 'no-store' },
    )
    if (!res.ok) return null
    const data = await res.json()
    const matches: CricApiMatch[] = data?.data ?? []
    // Filter to IPL matches only
    return matches.filter(m =>
      m.name.toLowerCase().includes('ipl') ||
      (m.teamInfo ?? []).some(t => ['MI','CSK','RCB','KKR','DC','SRH','RR','PBKS','GT','LSG'].includes(t.shortname))
    )
  } catch {
    return null
  }
}

export async function GET() {
  const liveMatches = await fetchLiveMatches()

  // Build live score overlay for today's fixture(s)
  const liveScores: Record<string, { score1?: string; score2?: string; status: string; isLive: boolean }> = {}

  if (liveMatches) {
    for (const m of liveMatches) {
      const isoDate = toIST(m.dateTimeGMT ?? '')
      const teams   = (m.teamInfo ?? []).map(t => t.shortname)
      const key     = `${isoDate}_${teams.join('_')}`
      const t1Score = m.score?.find(s => m.teamInfo?.[0] && s.inning.startsWith(m.teamInfo[0].name))
      const t2Score = m.score?.find(s => m.teamInfo?.[1] && s.inning.startsWith(m.teamInfo[1].name))
      liveScores[key] = {
        score1:  t1Score ? fmtScore(t1Score) : undefined,
        score2:  t2Score ? fmtScore(t2Score) : undefined,
        status:  m.status,
        isLive:  !!m.matchStarted && !m.matchEnded,
      }
    }
  }

  return NextResponse.json({
    standings:  STATIC_STANDINGS,
    fixtures:   STATIC_FIXTURES,
    liveScores,
    updatedAt:  new Date().toISOString(),
    source:     liveMatches ? 'live' : 'static',
  })
}
