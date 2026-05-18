/**
 * /api/visitors — proxies to VPS visitor counter
 * VPS stores persistent count in data/visitors.json
 * Falls back to in-memory if VPS unreachable
 */
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const VPS_HIT = 'http://31.97.56.148:3096/api/visitors/hit'

// In-memory fallback
const recentHits: number[] = []
const ONLINE_WINDOW = 5 * 60 * 1000

function onlineNow(): number {
  const cutoff = Date.now() - ONLINE_WINDOW
  while (recentHits.length > 0 && recentHits[0] < cutoff) recentHits.shift()
  return Math.max(1, recentHits.length)
}

export async function GET() {
  recentHits.push(Date.now())
  try {
    const res = await fetch(VPS_HIT, {
      signal: AbortSignal.timeout(3000),
      cache: 'no-store',
    })
    if (res.ok) {
      const json = await res.json() as { count: number; online: number }
      return NextResponse.json(json, { headers: { 'Cache-Control': 'no-store' } })
    }
  } catch { /* VPS unreachable — fallback */ }

  return NextResponse.json(
    { count: null, online: onlineNow() },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
