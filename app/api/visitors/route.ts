/**
 * /api/visitors — lightweight visit counter
 *
 * Uses countapi.xyz (free, no auth) to persist hit count across Vercel
 * serverless restarts. Falls back to an in-memory counter for the session.
 *
 * GET  → increment + return { count, online }
 */
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Namespace + key on countapi.xyz — unique per site
const NAMESPACE = 'nammatamil.live'
const KEY       = 'visitors'
const COUNT_URL = `https://api.countapi.xyz/hit/${NAMESPACE}/${KEY}`

// In-memory recent-hit tracker to estimate "online now"
// Stores timestamps of last N hits (rolling 5-min window)
const recentHits: number[] = []
const ONLINE_WINDOW_MS = 5 * 60 * 1000 // 5 minutes

function getOnlineCount(): number {
  const cutoff = Date.now() - ONLINE_WINDOW_MS
  // Prune old entries
  while (recentHits.length > 0 && recentHits[0] < cutoff) recentHits.shift()
  return Math.max(1, recentHits.length)
}

export async function GET() {
  recentHits.push(Date.now())

  try {
    const res = await fetch(COUNT_URL, {
      signal: AbortSignal.timeout(3000),
      cache: 'no-store',
    })
    if (res.ok) {
      const json = await res.json() as { value: number }
      return NextResponse.json(
        { count: json.value, online: getOnlineCount() },
        { headers: { 'Cache-Control': 'no-store' } },
      )
    }
  } catch { /* fallback */ }

  // Fallback: just return online count without persistent total
  return NextResponse.json(
    { count: null, online: getOnlineCount() },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
