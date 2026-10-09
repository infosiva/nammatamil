import { limited } from '@/lib/rateLimit'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const rl = limited(req, 'feedback', 20)
  if (rl) return rl
  try {
    const raw = await req.text()
    if (raw.length > 4096) return NextResponse.json({ ok: false }, { status: 413 })
    console.log('[feedback]', raw)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}
