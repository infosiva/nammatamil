'use client'

import { useState, useEffect } from 'react'

interface VisitorData {
  count: number | null
  online: number
}

export default function VisitorCounter({ compact }: { compact?: boolean }) {
  const [data, setData] = useState<VisitorData | null>(null)

  useEffect(() => {
    let sid = sessionStorage.getItem('nt_sid')
    if (!sid) { sid = Math.random().toString(36).slice(2); sessionStorage.setItem('nt_sid', sid) }
    const sessionId = sid

    const hit = async () => {
      try {
        const res = await fetch('/api/visitors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId }),
          cache: 'no-store',
        })
        if (res.ok) setData(await res.json())
      } catch { /* silent */ }
    }

    // Also log page + referrer to tracker-api (fire-and-forget)
    fetch('/api/log-visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: window.location.pathname, ref: document.referrer, session_id: sessionId }),
    }).catch(() => {})

    hit()
    const interval = setInterval(hit, 60_000)
    return () => clearInterval(interval)
  }, [])

  if (!data) return null

  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 6, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', flexShrink: 0 }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', flexShrink: 0, boxShadow: '0 0 5px #22c55e', animation: 'vcPulse 2s ease-in-out infinite', display: 'inline-block' }} />
        <span style={{ fontSize: 10, fontWeight: 800, color: '#22c55e' }}>{data.online}</span>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>online</span>
        <style>{`@keyframes vcPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(1.4)}}`}</style>
      </div>
    )
  }

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 12,
      padding: '5px 12px', borderRadius: 99,
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0, boxShadow: '0 0 6px #22c55e', animation: 'vcPulse 2s ease-in-out infinite', display: 'inline-block' }} />
        <span style={{ fontSize: 10, fontWeight: 800, color: '#22c55e' }}>{data.online}</span>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>online</span>
      </div>
      <span style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.1)' }} />
      {data.count !== null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', fontVariantNumeric: 'tabular-nums' }}>
            {data.count >= 1000 ? `${(data.count / 1000).toFixed(1)}K` : data.count}
          </span>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>visits</span>
        </div>
      )}
      <style>{`@keyframes vcPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(1.4)}}`}</style>
    </div>
  )
}
