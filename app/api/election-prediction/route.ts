/**
 * /api/election-prediction
 * Fetches live Tamil news headlines → Groq AI analyses political sentiment →
 * returns real-time party sentiment scores + AI-generated narrative.
 *
 * Cache: 1 hour (Groq is free, but we don't need more freshness than this)
 */
import { NextResponse } from 'next/server'
import { generateWithAI } from '@/lib/ai'

export const revalidate = 3600 // cache 1 hour on Vercel edge

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

// ── Exit Poll averages (April 29, 2026 — voting was April 23) ────────────────
// Poll of Polls: Matrize + P-MARQ + Axis My India + JVC averaged
// DMK: 92–145 range → avg ~112 | AIADMK: 22–147 → avg ~83 | TVK: 8–120 → avg ~38
const BASE_PREDICTIONS = {
  DMK:    { voteShare: 36.5, seats: '107–141', sentiment: 68, color: '#f87171' },
  AIADMK: { voteShare: 31.2, seats: '44–71',  sentiment: 55, color: '#4ade80' },
  TVK:    { voteShare: 23.0, seats: '13–47',  sentiment: 72, color: '#fbbf24' },
  BJP:    { voteShare: 4.2,  seats: '4–10',   sentiment: 38, color: '#fb923c' },
  Others: { voteShare: 5.1,  seats: '5–12',   sentiment: 45, color: '#94a3b8' },
}
// NOTE: Axis My India outlier predicts TVK 98–120 seats as single largest party

// ── AI Sentiment Analysis ─────────────────────────────────────────────────────
async function analyseWithAI(headlines: string[]): Promise<{
  DMK: number; AIADMK: number; TVK: number; BJP: number
  narrative: string; trend: string
}> {
  if (headlines.length === 0) {
    return { DMK: 65, AIADMK: 58, TVK: 62, BJP: 40, narrative: 'No recent headlines available.', trend: 'stable' }
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
      name: 'DMK', tamil: 'திமுக', leader: 'M.K. Stalin', role: 'Chief Minister',
      color: BASE_PREDICTIONS.DMK.color,
      sentiment: ai.DMK,
      voteShare: BASE_PREDICTIONS.DMK.voteShare,
      seats: adjustSeats('DMK', ai.DMK),
      trend: ai.DMK > BASE_PREDICTIONS.DMK.sentiment ? 'up' : ai.DMK < BASE_PREDICTIONS.DMK.sentiment ? 'down' : 'stable',
    },
    {
      name: 'AIADMK', tamil: 'அதிமுக', leader: 'E. Palaniswami', role: 'Opposition Leader',
      color: BASE_PREDICTIONS.AIADMK.color,
      sentiment: ai.AIADMK,
      voteShare: BASE_PREDICTIONS.AIADMK.voteShare,
      seats: adjustSeats('AIADMK', ai.AIADMK),
      trend: ai.AIADMK > BASE_PREDICTIONS.AIADMK.sentiment ? 'up' : ai.AIADMK < BASE_PREDICTIONS.AIADMK.sentiment ? 'down' : 'stable',
    },
    {
      name: 'TVK', tamil: 'தவக', leader: 'Vijay (Thalapathy)', role: 'Party President',
      color: BASE_PREDICTIONS.TVK.color,
      sentiment: ai.TVK,
      voteShare: BASE_PREDICTIONS.TVK.voteShare,
      seats: adjustSeats('TVK', ai.TVK),
      trend: ai.TVK > BASE_PREDICTIONS.TVK.sentiment ? 'up' : ai.TVK < BASE_PREDICTIONS.TVK.sentiment ? 'down' : 'stable',
    },
  ]

  return NextResponse.json({
    parties,
    narrative:    ai.narrative,
    trend:        ai.trend,
    headlineCount: headlines.length,
    updatedAt:    new Date().toISOString(),
    source:       headlines.length > 0 ? 'live-ai' : 'static',
  }, {
    headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=300' },
  })
}
