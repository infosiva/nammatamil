/**
 * /api/visitors — proxies to VPS visitor counter
 * VPS stores persistent count in data/visitors.json
 * Falls back to in-memory if VPS unreachable
 */
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const VPS_HIT = 'http://31.97.56.148:3096/api/visitors/hit'

// In-memory fallback: session_id → last seen
const sessionMap = new Map<string, number>()
const ONLINE_WINDOW = 5 * 60 * 1000

function onlineNow(sid?: string): number {
  if (sid) sessionMap.set(sid, Date.now())
  const cutoff = Date.now() - ONLINE_WINDOW
  let count = 0
  for (const ts of sessionMap.values()) { if (ts > cutoff) count++ }
  return Math.max(1, count)
}

export async function POST(req: NextRequest) {
  let session_id: string | undefined
  try { session_id = (await req.json())?.session_id } catch { /* no body */ }

  try {
    const res = await fetch(VPS_HIT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id }),
      signal: AbortSignal.timeout(3000),
      cache: 'no-store',
    })
    if (res.ok) {
      const json = await res.json() as { count: number; online: number }
      return NextResponse.json(json, { headers: { 'Cache-Control': 'no-store' } })
    }
  } catch { /* VPS unreachable — fallback */ }

  return NextResponse.json(
    { count: null, online: onlineNow(session_id) },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
