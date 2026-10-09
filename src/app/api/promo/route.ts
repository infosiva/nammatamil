import { validatePromoCode } from '@/lib/promoCode'
import { limited } from '@/lib/rateLimit'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const rl = limited(req, 'promo', 10)
  if (rl) return rl
  const { code } = await req.json().catch(() => ({}))
  if (typeof code !== 'string' || !code) return NextResponse.json({ valid: false }, { status: 400 })
  const entry = await validatePromoCode(code)
  if (!entry) return NextResponse.json({ valid: false, message: 'Invalid code' })
  const res = NextResponse.json({ valid: true, daysUnlocked: entry.daysUnlocked, feature: entry.feature })
  res.cookies.set('promo_unlocked', JSON.stringify({ ...entry, activatedAt: Date.now() }), {
    maxAge: entry.daysUnlocked * 86400, httpOnly: false, sameSite: 'lax', path: '/',
  })
  return res
}
