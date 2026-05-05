/**
 * /api/log-visit — logs page visit stats to VPS
 *
 * Called client-side (fire-and-forget) on every page load.
 * Posts to VPS site-watchdog stats endpoint.
 * No personal data — just timestamp, page, country hint from headers.
 */
import { NextRequest, NextResponse } from 'next/server'

export const dynamic  = 'force-dynamic'
export const revalidate = 0

const VPS_HOST    = '31.97.56.148'
const VPS_PORT    = 3099
const VPS_ENDPOINT = `http://${VPS_HOST}:${VPS_PORT}/api/stats/nammatamil`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { page?: string; ref?: string }
    const country = req.headers.get('x-vercel-ip-country') ?? 'unknown'
    const city    = req.headers.get('x-vercel-ip-city') ?? ''
    const ua      = req.headers.get('user-agent') ?? ''

    const payload = {
      site:    'nammatamil.live',
      page:    String(body?.page ?? '/').slice(0, 200),
      ref:     String(body?.ref ?? '').slice(0, 200),
      country,
      city:    city.slice(0, 60),
      ua:      ua.slice(0, 120),
      ts:      Date.now(),
    }

    // Fire-and-forget to VPS — don't block the response
    fetch(VPS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(2000),
    }).catch(() => { /* VPS offline is fine */ })

    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}
