'use client'
// Consent-gated usage logging + always-on structured error log. No deps, no PII (path + event name only).
import { useEffect, useState } from 'react'

const KEY = 'ds-consent'
type G = { gtag?: (...a: unknown[]) => void }

function send(body: Record<string, unknown>) {
  try {
    const data = JSON.stringify({ ...body, path: location.pathname, ts: Date.now() })
    if (navigator.sendBeacon) navigator.sendBeacon('/api/log', new Blob([data], { type: 'application/json' }))
    else fetch('/api/log', { method: 'POST', body: data, keepalive: true, headers: { 'content-type': 'application/json' } }).catch(() => {})
  } catch {}
}

const PH_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
const PH_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'

// Gate events: view, core_action, signup, promo_redeem. Consent-gated; fans out to usage log, GA4 and PostHog (if keyed).
export function logEvent(name: string) {
  try {
    if (localStorage.getItem(KEY) !== 'granted') return
    send({ kind: 'usage', name })
    ;(window as unknown as G).gtag?.('event', name)
    if (PH_KEY) {
      let id = localStorage.getItem('ph-id')
      if (!id) { id = crypto.randomUUID(); localStorage.setItem('ph-id', id) }
      fetch(`${PH_HOST}/capture/`, { method: 'POST', keepalive: true, body: JSON.stringify({ api_key: PH_KEY, event: name, distinct_id: id, properties: { path: location.pathname, site: 'nammatamil' } }) }).catch(() => {})
    }
  } catch {}
}

export default function Telemetry() {
  const [ask, setAsk] = useState(false)

  useEffect(() => {
    let c: string | null = null
    try { c = localStorage.getItem(KEY) } catch {}
    if (c === null) setAsk(true)
    if (c === 'granted') (window as unknown as G).gtag?.('consent', 'update', { analytics_storage: 'granted' })
    const onErr = (e: ErrorEvent) => send({ kind: 'error', message: String(e.message).slice(0, 300), stack: String(e.error?.stack ?? '').slice(0, 800) })
    const onRej = (e: PromiseRejectionEvent) => send({ kind: 'error', message: String((e.reason as Error)?.message ?? e.reason).slice(0, 300), stack: '' })
    addEventListener('error', onErr); addEventListener('unhandledrejection', onRej)
    // core_action = tapping live election tile / trending pill / article link (delegated, so server components stay server)
    const onClick = (e: MouseEvent) => { if ((e.target as Element)?.closest?.('.nt-tile,.nt-pill,[data-core]')) logEvent('core_action') }
    addEventListener('click', onClick)
    logEvent('view')
    return () => { removeEventListener('error', onErr); removeEventListener('unhandledrejection', onRej); removeEventListener('click', onClick) }
  }, [])

  const choose = (v: 'granted' | 'denied') => {
    try { localStorage.setItem(KEY, v) } catch {}
    if (v === 'granted') { (window as unknown as G).gtag?.('consent', 'update', { analytics_storage: 'granted' }); logEvent('view') }
    setAsk(false)
  }
  if (!ask) return null
  const btn = { minHeight: 44, minWidth: 88, padding: '0 16px', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer' } as const
  return (
    <div role="dialog" aria-label="Analytics consent" style={{ position: 'fixed', left: 12, right: 12, bottom: 12, zIndex: 10000, maxWidth: 520, margin: '0 auto', background: '#ffffff', color: '#1a1a1a', border: '1px solid rgba(0,0,0,.15)', borderRadius: 14, padding: 14, boxShadow: '0 8px 30px rgba(0,0,0,.18)', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
      <p style={{ flex: '1 1 220px', fontSize: 13, lineHeight: 1.4, margin: 0 }}>Allow anonymous usage stats (pages visited, no personal data) to help improve this site?</p>
      <button onClick={() => choose('denied')} style={{ ...btn, background: '#f1f1f1', color: '#1a1a1a', border: '1px solid rgba(0,0,0,.2)' }}>No thanks</button>
      <button onClick={() => choose('granted')} style={{ ...btn, background: '#1a1a1a', color: '#ffffff', border: '1px solid #1a1a1a' }}>Allow</button>
    </div>
  )
}
