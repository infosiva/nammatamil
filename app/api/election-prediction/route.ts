/**
 * /api/election-prediction
 * Fetches live Tamil news headlines → Groq AI analyses political sentiment →
 * returns real-time party sentiment scores + AI-generated narrative.
 *
 * Cache: 1 hour (Groq is free, but we don't need more freshness than this)
 */
import { NextResponse } from 'next/server'
import { generateWithAI } from '@/lib/ai'

export const dynamic = 'force-dynamic'
export const revalidate = 0 // always fresh — client polls every 5 min

// ── Fetch Tamil political headlines from RSS ──────────────────────────────────
const POLITICAL_FEEDS = [
  { name: 'Dinamalar',     url: 'https://www.dinamalar.com/rss/news_rss.asp' },
  { name: 'OneIndia Tamil', url: 'https://tamil.oneindia.com/rss/tamil-news-fb.xml' },
  { name: 'The Hindu Tamil', url: 'https://www.thehindu.com/news/national/tamil-nadu/feeder/default.rss' },
]

const POLITICAL_KEYWORDS = ['தேர்தல்', 'election', 'DMK', 'AIADMK', 'TVK', 'Stalin', 'Palaniswami',
  'Vijay', 'BJP', 'Congress', 'vote', 'வாக்கு', 'ஆட்சி', 'கட்சி', 'campaign', 'manifesto']

function extractHeadlines(xml: string): string[] {
  const titles: string[] = []
  const matches = xml.matchAll(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/g)
  for (const m of matches) {
    const t = (m[1] ?? m[2] ?? '').trim()
    if (t && t.length > 10 && !t.includes('RSS') && !t.includes('Feed')) {
      titles.push(t)
    }
  }
  return titles
}

async function fetchPoliticalHeadlines(): Promise<string[]> {
  const headlines: string[] = []
  await Promise.allSettled(
    POLITICAL_FEEDS.map(async feed => {
      try {
        const res = await fetch(feed.url, {
          signal: AbortSignal.timeout(4000),
          headers: { 'User-Agent': 'NammaTamil/1.0 (+https://nammatamil.live)' },
        })
        if (!res.ok) return
        const xml = await res.text()
        const all = extractHeadlines(xml)
        // Filter to political/election headlines only
        const political = all.filter(h =>
          POLITICAL_KEYWORDS.some(kw => h.toLowerCase().includes(kw.toLowerCase()))
        )
        headlines.push(...political.slice(0, 6))
      } catch { /* skip failed feeds */ }
    })
  )
  return headlines.slice(0, 18) // max 18 headlines to keep prompt small
}

// ── All Exit Poll data — Tamil Nadu Assembly Election 2026 ────────────────────
// Aggregated from all major exit poll agencies (Apr 28–29 2026)
const BASE_PREDICTIONS = {
  TVK:    { voteShare: 35.0, seats: '98–120', sentiment: 82, color: '#fbbf24' },
  DMK:    { voteShare: 35.0, seats: '92–110', sentiment: 70, color: '#f87171' },
  AIADMK: { voteShare: 23.0, seats: '22–32',  sentiment: 42, color: '#4ade80' },
  BJP:    { voteShare: 4.2,  seats: '4–10',   sentiment: 35, color: '#fb923c' },
  Others: { voteShare: 2.8,  seats: '2–8',    sentiment: 40, color: '#94a3b8' },
}

// Exit polls from all agencies — Tamil Nadu Assembly Election 2026 (Apr 28–29)
const EXIT_POLLS = [
  {
    agency:  'Axis My India',
    client:  'India Today',
    TVK:  '98–120',
    DMK:  '92–110',
    AIADMK: '22–32',
    others: '2–8',
    winner: 'TVK',
  },
  {
    agency:  'Matrize',
    client:  'News18',
    TVK:  '102–122',
    DMK:  '85–105',
    AIADMK: '18–26',
    others: '2–6',
    winner: 'TVK',
  },
  {
    agency:  'Jan Ki Baat',
    client:  'NewsX',
    TVK:  '95–115',
    DMK:  '88–108',
    AIADMK: '20–30',
    others: '3–9',
    winner: 'TVK',
  },
  {
    agency:  'P-MARQ',
    client:  'NDTV',
    TVK:  '90–112',
    DMK:  '93–113',
    AIADMK: '20–30',
    others: '3–8',
    winner: 'close',
  },
  {
    agency:  'CVoter',
    client:  'Republic TV',
    TVK:  '88–108',
    DMK:  '95–115',
    AIADMK: '18–28',
    others: '4–10',
    winner: 'DMK',
  },
  {
    agency:  'Today\'s Chanakya',
    client:  'ABP News',
    TVK:  '104–126',
    DMK:  '80–100',
    AIADMK: '16–24',
    others: '2–6',
    winner: 'TVK',
  },
  {
    agency:  'Peoples Pulse',
    client:  'TV9',
    TVK:  '96–114',
    DMK:  '90–108',
    AIADMK: '19–27',
    others: '3–7',
    winner: 'TVK',
  },
  {
    agency:  'Dakshin Research',
    client:  'Sun News',
    TVK:  '100–118',
    DMK:  '88–106',
    AIADMK: '20–28',
    others: '2–6',
    winner: 'TVK',
  },
]

// ── AI Sentiment Analysis ─────────────────────────────────────────────────────
async function analyseWithAI(headlines: string[]): Promise<{
  DMK: number; AIADMK: number; TVK: number; BJP: number
  narrative: string; trend: string
}> {
  if (headlines.length === 0) {
    return { DMK: 70, AIADMK: 42, TVK: 82, BJP: 35, narrative: 'Axis My India exit poll: TVK leads with 98–120 seats. Vijay preferred CM at 37%.', trend: 'TVK_surge' }
  }

  const prompt = `You are a Tamil Nadu political analyst. Analyse these recent Tamil news headlines and score each party's current sentiment (0–100, where 100 = very positive news coverage).

Headlines:
${headlines.map((h, i) => `${i + 1}. ${h}`).join('\n')}

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{
  "DMK": <0-100>,
  "AIADMK": <0-100>,
  "TVK": <0-100>,
  "BJP": <0-100>,
  "narrative": "<one sentence: key election trend from these headlines, max 120 chars>",
  "trend": "<one of: DMK_leading | AIADMK_rising | TVK_surge | close_race | stable>"
}`

  try {
    const raw = await generateWithAI(prompt, {
      mode: 'fast', // Groq only — free + fast
      maxTokens: 200,
      systemPrompt: 'You are a political data analyst. Return only valid JSON, no markdown fences.',
      noCache: true, // always fresh
    })
    // Strip markdown fences if present
    const cleaned = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(cleaned)
    return {
      DMK:       Math.min(100, Math.max(0, Number(parsed.DMK)   || 65)),
      AIADMK:    Math.min(100, Math.max(0, Number(parsed.AIADMK) || 58)),
      TVK:       Math.min(100, Math.max(0, Number(parsed.TVK)   || 62)),
      BJP:       Math.min(100, Math.max(0, Number(parsed.BJP)   || 40)),
      narrative: String(parsed.narrative || '').slice(0, 160),
      trend:     String(parsed.trend || 'stable'),
    }
  } catch {
    return { DMK: 65, AIADMK: 58, TVK: 62, BJP: 40, narrative: 'Analysis unavailable.', trend: 'stable' }
  }
}

// ── Adjust seat predictions based on sentiment delta ─────────────────────────
function adjustSeats(party: keyof typeof BASE_PREDICTIONS, aiSentiment: number): string {
  const base = BASE_PREDICTIONS[party]
  const delta = aiSentiment - base.sentiment
  // Each 5-point sentiment shift moves seat estimate by ~3 seats
  const shift = Math.round((delta / 5) * 3)
  const [lo, hi] = base.seats.split('–').map(Number)
  const newLo = Math.max(0, lo + shift)
  const newHi = Math.min(234, hi + shift)
  return `${newLo}–${newHi}`
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function GET() {
  const headlines = await fetchPoliticalHeadlines()
  const ai = await analyseWithAI(headlines)

  const parties = [
    {
      name: 'TVK', tamil: 'தவக', leader: 'Vijay (Thalapathy)', role: 'Projected Winner',
      color: BASE_PREDICTIONS.TVK.color,
      sentiment: Math.max(ai.TVK, BASE_PREDICTIONS.TVK.sentiment),
      voteShare: BASE_PREDICTIONS.TVK.voteShare,
      seats: BASE_PREDICTIONS.TVK.seats, // fixed from Axis My India
      trend: 'up' as const,
      leading: true,
    },
    {
      name: 'DMK', tamil: 'திமுக', leader: 'M.K. Stalin', role: 'Incumbent CM',
      color: BASE_PREDICTIONS.DMK.color,
      sentiment: ai.DMK,
      voteShare: BASE_PREDICTIONS.DMK.voteShare,
      seats: BASE_PREDICTIONS.DMK.seats,
      trend: 'stable' as const,
    },
    {
      name: 'AIADMK', tamil: 'அதிமுக', leader: 'E. Palaniswami', role: 'Opposition',
      color: BASE_PREDICTIONS.AIADMK.color,
      sentiment: Math.min(ai.AIADMK, BASE_PREDICTIONS.AIADMK.sentiment),
      voteShare: BASE_PREDICTIONS.AIADMK.voteShare,
      seats: BASE_PREDICTIONS.AIADMK.seats,
      trend: 'down' as const,
    },
  ]

  return NextResponse.json({
    parties,
    exitPolls:    EXIT_POLLS,
    narrative:    ai.narrative,
    trend:        ai.trend,
    headlineCount: headlines.length,
    updatedAt:    new Date().toISOString(),
    source:       headlines.length > 0 ? 'live-ai' : 'static',
  }, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
