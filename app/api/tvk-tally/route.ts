/**
 * /api/tvk-tally — Live Tamil Nadu 2026 election seat tally for government formation.
 *
 * Fetches the ECI official results JSON in real-time.
 * Maps each party to its current bloc:
 *   - tvk_direct  : TVK seats (their own MLAs)
 *   - tvk_support : parties that pledged outside support to Vijay govt
 *   - opposition  : DMK bloc
 *   - admk_bloc   : ADMK + BJP + rest
 *   - others      : Independents and minor parties
 *
 * Cache: 3 minutes (ECI JSON updates live during counting, static after)
 */
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const ECI_URL = 'https://results.eci.gov.in/ResultAcGenMay2026/election-json-S22-live.json'
const TOTAL   = 234
const MAJORITY = 118

// ── Party → bloc mapping (post-election government formation phase) ────────────
// TVK direct seats
const TVK_DIRECT = new Set(['TVK'])

// Parties that officially pledged support to Vijay government (outside support)
const TVK_SUPPORTERS = new Set([
  'INC',           // Congress — 5 seats, backed Vijay
  'PMK',           // PMK — 4 seats, supporting TVK
  'CPI',           // CPI — 2 seats
  'CPI(M)',        // CPI(M) — 2 seats
  'VCK',           // VCK — 2 seats (Left alliance)
  'IUML',          // IUML
  'MDMK',          // MDMK
])

// AIADMK MLAs who broke ranks to support TVK (tracked separately as "ADMK split")
// ECI won't split this — we just show total ADMK seats and label note separately
const ADMK_BLOC    = new Set(['ADMK', 'AIADMK', 'DMDK', 'PT'])
const OPPOSITION   = new Set(['DMK'])               // DMK bloc (main opposition)
const BJP_BLOC     = new Set(['BJP', 'NDA'])

interface Tally {
  tvk_direct:   number   // TVK own seats
  tvk_support:  number   // Congress + PMK + Left etc. pledged seats
  tvk_total:    number   // combined
  opposition:   number   // DMK
  admk_bloc:    number   // ADMK + BJP
  others:       number   // Independents + minor
  declared:     number   // seats declared so far
  total:        number   // 234
  majority:     number   // 118
  majority_gap: number   // tvk_total - 118 (positive = secured)
  parties: {             // party-level breakdown for detail view
    name: string
    seats: number
    bloc: 'tvk_direct' | 'tvk_support' | 'opposition' | 'admk' | 'others'
  }[]
  source: 'eci_live' | 'fallback'
  updatedAt: string
}

async function fetchFromECI(): Promise<Tally | null> {
  try {
    const res = await fetch(ECI_URL, {
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'Mozilla/5.0 NammaTamil/1.0' },
    })
    if (!res.ok) return null

    const json = await res.json() as Record<string, {
      chartData: [string, string, number, string, string][]
    }>

    const rows = json['S22']?.chartData
    if (!rows?.length) return null

    // Count per party
    const partyCounts: Record<string, number> = {}
    for (const [party] of rows) {
      partyCounts[party] = (partyCounts[party] ?? 0) + 1
    }

    let tvk_direct  = 0
    let tvk_support = 0
    let opposition  = 0
    let admk_bloc   = 0
    let others      = 0

    const partyDetail: Tally['parties'] = []

    for (const [party, seats] of Object.entries(partyCounts)) {
      if (TVK_DIRECT.has(party)) {
        tvk_direct += seats
        partyDetail.push({ name: party, seats, bloc: 'tvk_direct' })
      } else if (TVK_SUPPORTERS.has(party)) {
        tvk_support += seats
        partyDetail.push({ name: party, seats, bloc: 'tvk_support' })
      } else if (OPPOSITION.has(party)) {
        opposition += seats
        partyDetail.push({ name: party, seats, bloc: 'opposition' })
      } else if (ADMK_BLOC.has(party) || BJP_BLOC.has(party)) {
        admk_bloc += seats
        partyDetail.push({ name: party, seats, bloc: 'admk' })
      } else {
        others += seats
        partyDetail.push({ name: party, seats, bloc: 'others' })
      }
    }

    // Sort parties by seats descending
    partyDetail.sort((a, b) => b.seats - a.seats)

    const tvk_total = tvk_direct + tvk_support

    return {
      tvk_direct,
      tvk_support,
      tvk_total,
      opposition,
      admk_bloc,
      others,
      declared:     rows.length,
      total:        TOTAL,
      majority:     MAJORITY,
      majority_gap: tvk_total - MAJORITY,
      parties:      partyDetail,
      source:       'eci_live',
      updatedAt:    new Date().toISOString(),
    }
  } catch {
    return null
  }
}

// ── Fallback — last known values (May 6 2026, post-counting) ─────────────────
// Updated once counting is complete; ECI JSON becomes static after all 234 declared
function fallbackTally(): Tally {
  return {
    tvk_direct:   108,
    tvk_support:  18,   // INC 5 + PMK 4 + CPI 2 + CPI(M) 2 + VCK 2 + IUML 2 + MDMK 1
    tvk_total:    126,
    opposition:   59,   // DMK bloc
    admk_bloc:    47,   // ADMK + BJP + allies
    others:        4,   // Independents
    declared:     234,
    total:        TOTAL,
    majority:     MAJORITY,
    majority_gap: 126 - MAJORITY,  // +8 above majority
    parties: [
      { name: 'TVK',    seats: 108, bloc: 'tvk_direct'  },
      { name: 'DMK',    seats:  59, bloc: 'opposition'  },
      { name: 'ADMK',   seats:  35, bloc: 'admk'        },
      { name: 'INC',    seats:   5, bloc: 'tvk_support' },
      { name: 'PMK',    seats:   4, bloc: 'tvk_support' },
      { name: 'BJP',    seats:   7, bloc: 'admk'        },
      { name: 'CPI(M)', seats:   2, bloc: 'tvk_support' },
      { name: 'CPI',    seats:   2, bloc: 'tvk_support' },
      { name: 'VCK',    seats:   2, bloc: 'tvk_support' },
      { name: 'IUML',   seats:   2, bloc: 'tvk_support' },
      { name: 'MDMK',   seats:   1, bloc: 'tvk_support' },
      { name: 'Ind',    seats:   4, bloc: 'others'      },
    ],
    source:    'fallback',
    updatedAt: new Date().toISOString(),
  }
}

// ── In-memory cache ───────────────────────────────────────────────────────────
let cache: { data: Tally; fetchedAt: number } | null = null
const CACHE_TTL = 3 * 60 * 1000

export async function GET() {
  const now = Date.now()
  if (cache && now - cache.fetchedAt < CACHE_TTL) {
    return NextResponse.json({ ...cache.data, cached: true }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  }

  const live = await fetchFromECI()
  const data = live ?? fallbackTally()

  cache = { data, fetchedAt: now }
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
}
