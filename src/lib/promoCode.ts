export type PromoEntry = { code: string; daysUnlocked: number; feature: string }

const HUB_URL = process.env.HUB_URL ?? 'https://ai-products-hub.vercel.app'

// Codes are issued/revoked in the hub (gate item 13); no project-local code list. Fails closed if hub is unreachable.
export async function validatePromoCode(input: string): Promise<PromoEntry | null> {
  const code = input.trim().slice(0, 64)
  if (!code) return null
  try {
    const res = await fetch(`${HUB_URL}/api/access-codes/validate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code, project: 'nammatamil' }),
      signal: AbortSignal.timeout(5000),
      cache: 'no-store',
    })
    const d = await res.json()
    return d?.valid ? { code, daysUnlocked: Number(d.daysUnlocked) || 0, feature: String(d.feature ?? '') } : null
  } catch { return null }
}
