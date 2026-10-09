const store = new Map<string, { count: number; reset: number }>()

export function checkRateLimit(ip: string, max: number, windowMs = 3600_000): { ok: boolean; retryAfter: number } {
  const now = Date.now()
  const entry = store.get(ip)
  if (!entry || now > entry.reset) {
    store.set(ip, { count: 1, reset: now + windowMs })
    return { ok: true, retryAfter: 0 }
  }
  entry.count++
  return { ok: entry.count <= max, retryAfter: Math.ceil((entry.reset - now) / 1000) }
}

/** 429 + Retry-After when `bucket` exceeds `max` per window for the caller's IP, else null. */
export function limited(req: Request, bucket: string, max: number, windowMs = 3600_000): Response | null {
  const ip = (req.headers.get('x-forwarded-for') ?? 'unknown').split(',')[0].trim()
  const rl = checkRateLimit(`${bucket}:${ip}`, max, windowMs)
  return rl.ok ? null : new Response(JSON.stringify({ error: 'rate limit' }), { status: 429, headers: { 'content-type': 'application/json', 'Retry-After': String(rl.retryAfter) } })
}
