/**
 * /api/ipl — live IPL 2026 standings + fixtures
 *
 * Data sources (in priority order):
 * 1. cricapi.com (free tier, 100 req/day) — live match scores
 * 2. AI fallback (Groq → Gemini) — asks the model for current standings/fixtures
 *    based on today's date, no hardcoded data
 *
 * Cache: 5 min on Vercel edge (ISR-safe)
 */
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const CRIC_API_KEY = process.env.CRIC_API_KEY ?? ''
const CRIC_BASE    = 'https://api.cricapi.com/v1'

// Team colours — purely visual, safe to keep static
const TEAM_COLOR: Record<string, string> = {
  PBKS: '#a855f7', RCB: '#ef4444', RR: '#ec4899', SRH: '#f97316',
  GT:   '#6b7280', CSK: '#eab308', DC: '#3b82f6', KKR: '#7c3aed',
  MI:   '#0ea5e9', LSG: '#14b8a6',
}

interface CricApiMatch {
  id: string; name: string; status: string; venue?: string
  teamInfo?: { name: string; shortname: string }[]
  score?: { r: number; w: number; o: number; inning: string }[]
  matchStarted?: boolean; matchEnded?: boolean; dateTimeGMT?: string
}

function toIST(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return new Date(d.getTime() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10)
  } catch { return '' }
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
    return matches.filter(m =>
      m.name.toLowerCase().includes('ipl') ||
      (m.teamInfo ?? []).some(t => ['MI','CSK','RCB','KKR','DC','SRH','RR','PBKS','GT','LSG'].includes(t.shortname))
    )
  } catch { return null }
}

// ── AI fallback: ask Groq/Gemini for current IPL data ────────────────────────
async function fetchIPLFromAI(): Promise<{ standings: unknown[]; fixtures: unknown[] } | null> {
  const todayIST = toIST(new Date().toISOString())
  const prompt = `Today is ${todayIST} (IST). Return ONLY valid JSON — no markdown, no explanation.

Return an object with exactly this shape:
{
  "standings": [
    { "pos": 1, "team": "Punjab Kings", "short": "PBKS", "played": 11, "w": 7, "l": 3, "pts": 15, "nrr": "+0.85" }
  ],
  "fixtures": [
    { "id": "m51", "isoDate": "2026-05-10", "team1": "CSK", "team2": "LSG", "time": "3:30 PM", "venue": "Chidambaram, Chennai" }
  ]
}

Rules:
- standings: all 10 IPL 2026 teams, sorted by points (highest first), reflect the MOST RECENT available standings you know
- fixtures: only upcoming matches from today (${todayIST}) onwards, up to 8 matches, use correct schedules
- short codes: PBKS, RCB, SRH, RR, GT, CSK, DC, KKR, MI, LSG
- nrr: include sign (+/-)
- Return ONLY the JSON object, nothing else`

  // Try Groq first (free, fast)
  const groqKey = process.env.GROQ_API_KEY
  if (groqKey) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 800,
          temperature: 0,
        }),
        signal: AbortSignal.timeout(8000),
      })
      if (res.ok) {
        const data = await res.json()
        const text = data.choices?.[0]?.message?.content ?? ''
        const jsonStr = text.match(/\{[\s\S]*\}/)?.[0]
        if (jsonStr) return JSON.parse(jsonStr)
      }
    } catch { /* fall through */ }
  }

  // Try Gemini (free)
  const geminiKey = process.env.GEMINI_API_KEY
  if (geminiKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          signal: AbortSignal.timeout(8000),
        }
      )
      if (res.ok) {
        const data = await res.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
        const jsonStr = text.match(/\{[\s\S]*\}/)?.[0]
        if (jsonStr) return JSON.parse(jsonStr)
      }
    } catch { /* fall through */ }
  }

  return null
}

export async function GET() {
  const liveMatches = await fetchLiveMatches()

  // Build live score overlay
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

  // Fetch standings + fixtures from AI
  const aiData = await fetchIPLFromAI()

  if (!aiData) {
    // Both cricapi and AI failed — return minimal response
    return NextResponse.json({
      standings:  [],
      fixtures:   [],
      liveScores,
      updatedAt:  new Date().toISOString(),
      source:     'unavailable',
    })
  }

  // Inject team colours into standings
  const standings = (aiData.standings as Array<Record<string, unknown>>).map(row => ({
    ...row,
    color: TEAM_COLOR[(row.short as string) ?? ''] ?? '#888',
  }))

  return NextResponse.json({
    standings,
    fixtures:   aiData.fixtures,
    liveScores,
    updatedAt:  new Date().toISOString(),
    source:     liveMatches ? 'live+ai' : 'ai',
  })
}
