/**
 * /api/cricket — fetches live IPL/cricket scores
 * Uses cricapi.com free tier or falls back to static schedule
 */
import { NextResponse } from 'next/server'

// CricAPI free tier — 100 requests/day
// Get free key at https://www.cricapi.com/
const CRIC_API_KEY = process.env.CRIC_API_KEY ?? ''
const CRIC_BASE = 'https://api.cricapi.com/v1'

// No ISR — scores need to be fresh
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface CricMatch {
  id: string
  name: string
  status: string
  venue?: string
  teamInfo?: { name: string; shortname: string; img?: string }[]
  score?: { r: number; w: number; o: number; inning: string }[]
  matchType?: string
  matchStarted?: boolean
  matchEnded?: boolean
}

function buildMatches(raw: CricMatch[]) {
  return raw
    .filter(m => m.name.toLowerCase().includes('ipl') || m.matchType === 'T20')
    .slice(0, 4)
    .map(m => {
      const teams = (m.teamInfo ?? []).slice(0, 2).map((t, i) => {
        const scoreEntry = m.score?.find(s => s.inning.startsWith(t.name))
        return {
          name: t.name,
          shortName: t.shortname,
          score: scoreEntry ? String(scoreEntry.r) : undefined,
          wickets: scoreEntry?.w,
          overs: scoreEntry ? Number(scoreEntry.o.toFixed(1)) : undefined,
        }
      })
      return {
        id: m.id,
        name: m.name,
        status: m.status,
        venue: m.venue,
        teams,
        live: !!m.matchStarted && !m.matchEnded,
        matchType: m.matchType,
      }
    })
}

export async function GET() {
  if (!CRIC_API_KEY) {
    return NextResponse.json({ source: 'no-key', matches: [] })
  }

  try {
    const res = await fetch(`${CRIC_BASE}/currentMatches?apikey=${CRIC_API_KEY}&offset=0`, {
      signal: AbortSignal.timeout(4000),
      cache: 'no-store',
    })

    if (!res.ok) throw new Error(`CricAPI ${res.status}`)

    const data = await res.json()
    if (!data?.data) throw new Error('No data')

    const matches = buildMatches(data.data as CricMatch[])
    return NextResponse.json({ source: 'live', matches, updatedAt: new Date().toISOString() })
  } catch (e) {
    return NextResponse.json({ source: 'error', matches: [], error: String(e) })
  }
}
