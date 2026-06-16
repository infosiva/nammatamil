const store = new Map<string, { count: number; reset: number }>()

export function checkRateLimit(ip: string, max: number, windowMs = 3600_000): { ok: boolean } {
  const now = Date.now()
  const entry = store.get(ip)
  if (!entry || now > entry.reset) {
    store.set(ip, { count: 1, reset: now + windowMs })
    return { ok: true }
  }
  entry.count++
  return { ok: entry.count <= max }
}
