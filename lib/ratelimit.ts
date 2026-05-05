/**
 * Simple in-process rate limiter — sliding window, per-IP
 * Works on Vercel serverless (resets per cold start, good enough for abuse prevention)
 * For stricter limits, replace with Upstash Redis or Unkey
 */

interface Window {
  count: number
  resetAt: number
}

const store = new Map<string, Window>()

/**
 * Returns true if the request is allowed, false if rate-limited.
 * @param key    — unique key (e.g. IP + route)
 * @param limit  — max requests per window
 * @param windowMs — window duration in ms
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    // Prune old entries every ~1000 checks to prevent memory leak
    if (store.size > 5000) {
      for (const [k, v] of store) {
        if (now > v.resetAt) store.delete(k)
      }
    }
    return true
  }

  if (entry.count >= limit) return false
  entry.count++
  return true
}
