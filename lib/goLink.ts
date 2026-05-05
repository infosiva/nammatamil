/**
 * goLink — wraps any external URL through /go?url=...&ref=...
 * so every outbound click passes through our monetised redirect page.
 * Pass an empty/hash URL and it returns '#' unchanged.
 */
export function goLink(url: string, ref = 'site'): string {
  if (!url || url === '#') return '#'
  try {
    // Only wrap http/https external URLs
    const u = new URL(url)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return url
    return `/go?url=${encodeURIComponent(url)}&ref=${encodeURIComponent(ref)}`
  } catch {
    return url
  }
}
