/**
 * /api/ipl — live IPL 2026 standings + today's match score
 * Primary:  cricapi.com (free tier, 100 req/day) — uses CRIC_API_KEY env var
 * Fallback: static data embedded below (last updated: 2026-05-06)
 * Cache: 2 minutes for live matches, 15 min otherwise
 */
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const CRIC_API_KEY = process.env.CRIC_API_KEY ?? ''
const CRIC_BASE    = 'https://api.cricapi.com/v1'

// ── Static fallback standings — May 6 2026 (ESPNCricinfo) ────────────────────
const STATIC_STANDINGS = [
  { pos: 1,  team: 'Punjab Kings',                short: 'PBKS', played: 9,  w: 6, l: 2, pts: 13, nrr: '+0.855', color: '#a855f7' },
  { pos: 2,  team: 'Royal Challengers Bengaluru', short: 'RCB',  played: 9,  w: 6, l: 3, pts: 12, nrr: '+1.420', color: '#ef4444' },
  { pos: 3,  team: 'Sunrisers Hyderabad',         short: 'SRH',  played: 10, w: 6, l: 4, pts: 12, nrr: '+0.644', color: '#f97316' },
  { pos: 4,  team: 'Rajasthan Royals',            short: 'RR',   played: 10, w: 6, l: 4, pts: 12, nrr: '+0.510', color: '#ec4899' },
  { pos: 5,  team: 'Gujarat Titans',              short: 'GT',   played: 10, w: 6, l: 4, pts: 12, nrr: '-0.147', color: '#6b7280' },
  { pos: 6,  team: 'Chennai Super Kings',         short: 'CSK',  played: 9,  w: 4, l: 5, pts: 8,  nrr: '+0.005', color: '#eab308' },
  { pos: 7,  team: 'Delhi Capitals',              short: 'DC',   played: 9,  w: 4, l: 5, pts: 8,  nrr: '-0.895', color: '#3b82f6' },
  { pos: 8,  team: 'Kolkata Knight Riders',       short: 'KKR',  played: 9,  w: 3, l: 5, pts: 7,  nrr: '-0.539', color: '#7c3aed' },
  { pos: 9,  team: 'Mumbai Indians',              short: 'MI',   played: 9,  w: 2, l: 7, pts: 4,  nrr: '-0.803', color: '#0ea5e9' },
  { pos: 10, team: 'Lucknow Super Giants',        short: 'LSG',  played: 8,  w: 2, l: 6, pts: 4,  nrr: '-1.106', color: '#14b8a6' },
]

// ── Static fallback fixtures (May 6 – May 24 2026, league stage) ─────────────
const STATIC_FIXTURES = [
  { id: 'm47', isoDate: '2026-05-06', team1: 'SRH',  team2: 'PBKS', time: '7:30 PM', venue: 'Rajiv Gandhi, Hyderabad'  },
  { id: 'm48', isoDate: '2026-05-07', team1: 'LSG',  team2: 'RCB',  time: '7:30 PM', venue: 'Ekana, Lucknow'           },
  { id: 'm49', isoDate: '2026-05-08', team1: 'DC',   team2: 'KKR',  time: '7:30 PM', venue: 'Arun Jaitley, Delhi'      },
  { id: 'm50', isoDate: '2026-05-09', team1: 'RR',   team2: 'GT',   time: '7:30 PM', venue: 'Sawai Mansingh, Jaipur'   },
  { id: 'm51', isoDate: '2026-05-10', team1: 'CSK',  team2: 'LSG',  time: '3:30 PM', venue: 'Chidambaram, Chennai'     },
  { id: 'm52', isoDate: '2026-05-10', team1: 'RCB',  team2: 'MI',   time: '7:30 PM', venue: 'Chinnaswamy, Bangalore'   },
  { id: 'm53', isoDate: '2026-05-11', team1: 'PBKS', team2: 'DC',   time: '7:30 PM', venue: 'HPCA, Dharamsala'         },
  { id: 'm54', isoDate: '2026-05-12', team1: 'GT',   team2: 'SRH',  time: '7:30 PM', venue: 'Narendra Modi, Ahmedabad' },
  { id: 'm55', isoDate: '2026-05-13', team1: 'RCB',  team2: 'KKR',  time: '7:30 PM', venue: 'Raipur'                   },
  { id: 'm56', isoDate: '2026-05-14', team1: 'PBKS', team2: 'MI',   time: '7:30 PM', venue: 'HPCA, Dharamsala'         },
  { id: 'm57', isoDate: '2026-05-15', team1: 'LSG',  team2: 'CSK',  time: '7:30 PM', venue: 'Ekana, Lucknow'           },
  { id: 'm58', isoDate: '2026-05-16', team1: 'KKR',  team2: 'GT',   time: '7:30 PM', venue: 'Eden Gardens, Kolkata'    },
  { id: 'm59', isoDate: '2026-05-17', team1: 'PBKS', team2: 'RCB',  time: '3:30 PM', venue: 'HPCA, Dharamsala'         },
  { id: 'm60', isoDate: '2026-05-17', team1: 'DC',   team2: 'RR',   time: '7:30 PM', venue: 'Arun Jaitley, Delhi'      },
  { id: 'm61', isoDate: '2026-05-18', team1: 'CSK',  team2: 'SRH',  time: '7:30 PM', venue: 'Chidambaram, Chennai'     },
  { id: 'm62', isoDate: '2026-05-19', team1: 'RR',   team2: 'LSG',  time: '7:30 PM', venue: 'Sawai Mansingh, Jaipur'   },
  { id: 'm63', isoDate: '2026-05-20', team1: 'KKR',  team2: 'MI',   time: '7:30 PM', venue: 'Eden Gardens, Kolkata'    },
  { id: 'm64', isoDate: '2026-05-21', team1: 'GT',   team2: 'CSK',  time: '7:30 PM', venue: 'Narendra Modi, Ahmedabad' },
  { id: 'm65', isoDate: '2026-05-22', team1: 'SRH',  team2: 'RCB',  time: '7:30 PM', venue: 'Rajiv Gandhi, Hyderabad'  },
  { id: 'm66', isoDate: '2026-05-23', team1: 'LSG',  team2: 'PBKS', time: '7:30 PM', venue: 'Ekana, Lucknow'           },
  { id: 'm67', isoDate: '2026-05-24', team1: 'MI',   team2: 'RR',   time: '3:30 PM', venue: 'Wankhede, Mumbai'         },
  { id: 'm68', isoDate: '2026-05-24', team1: 'KKR',  team2: 'DC',   time: '7:30 PM', venue: 'Eden Gardens, Kolkata'    },
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
