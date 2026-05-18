/**
 * /api/log-visit — forwards page visits to tracker-api on VPS port 3098
 * tracker-api stores in SQLite — query via GET /stats?key=sitestats2025
 */
import { NextRequest, NextResponse } from 'next/server'

export const dynamic  = 'force-dynamic'
export const revalidate = 0

const TRACKER = 'http://31.97.56.148:3098/track'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { page?: string; ref?: string; session_id?: string }
    const ua = req.headers.get('user-agent') ?? ''
    if (/bot|crawler|spider|slurp|facebookexternalhit/i.test(ua)) {
      return NextResponse.json({ ok: true })
    }
    fetch(TRACKER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        site:       'nammatamil.live',
        path:       String(body?.page ?? '/').slice(0, 200),
        referrer:   String(body?.ref ?? '').slice(0, 200),
        session_id: body?.session_id ?? null,
      }),
      signal: AbortSignal.timeout(2000),
    }).catch(() => {})
    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}
