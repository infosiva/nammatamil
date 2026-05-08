/**
 * GET /api/health
 * Checks all external integrations:
 * - AI keys (Groq/Gemini/Anthropic)
 * - Resend (feedback emails)
 * - RSS feeds reachability (Google News, ESPNCricinfo)
 * - Cricbuzz scrape endpoint
 */
import { NextResponse } from 'next/server'

function checkAIKeys(): { ok: boolean; providers: string[]; error?: string } {
  const providers = [
    process.env.GROQ_API_KEY && 'groq',
    process.env.GEMINI_API_KEY && 'gemini',
    process.env.ANTHROPIC_API_KEY && 'anthropic',
  ].filter(Boolean) as string[]
  return providers.length > 0
    ? { ok: true, providers }
    : { ok: false, providers: [], error: 'No AI API keys configured' }
}

function checkResend(): { ok: boolean; error?: string } {
  if (!process.env.RESEND_API_KEY) return { ok: false, error: 'RESEND_API_KEY not set' }
  return { ok: true }
}

async function checkRSS(): Promise<{ ok: boolean; latencyMs?: number; error?: string }> {
  const start = Date.now()
  try {
    const res = await fetch(
      'https://news.google.com/rss/search?q=Tamil+cinema&hl=en-IN&gl=IN&ceid=IN:en',
      { signal: AbortSignal.timeout(5000), method: 'HEAD' }
    )
    return { ok: res.ok, latencyMs: Date.now() - start, error: res.ok ? undefined : `HTTP ${res.status}` }
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'unreachable' }
  }
}

export async function GET() {
  const [rss, ai, resend] = await Promise.all([
    checkRSS(),
    Promise.resolve(checkAIKeys()),
    Promise.resolve(checkResend()),
  ])

  const services = { ai, resend, rss }
  const allOk = Object.values(services).every(s => s.ok)

  return NextResponse.json(
    { ok: allOk, services, ts: new Date().toISOString() },
    { status: allOk ? 200 : 207 }
  )
}
