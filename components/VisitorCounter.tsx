'use client'

/**
 * VisitorCounter — shows total visitors + "online now" count
 * Hits /api/visitors on mount (increments counter) and polls every 60s.
 */
import { useState, useEffect } from 'react'
import { Eye, Users } from 'lucide-react'

interface VisitorData {
  count: number | null
  online: number
}

export default function VisitorCounter() {
  const [data, setData] = useState<VisitorData | null>(null)

  useEffect(() => {
    const hit = async () => {
      try {
        const res = await fetch('/api/visitors', { cache: 'no-store' })
        if (res.ok) setData(await res.json())
      } catch { /* silent */ }
    }
    hit()
    const interval = setInterval(hit, 60_000)
    return () => clearInterval(interval)
  }, [])

  if (!data) return null

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 12,
      padding: '5px 12px', borderRadius: 99,
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
    }}>
      {/* Online now */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0,
          boxShadow: '0 0 6px #22c55e',
          animation: 'vcPulse 2s ease-in-out infinite',
          display: 'inline-block',
        }} />
        <span style={{ fontSize: 10, fontWeight: 800, color: '#22c55e' }}>
          {data.online}
        </span>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>online</span>
      </div>

      {/* Separator */}
      <span style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.1)' }} />

      {/* Total visits */}
      {data.count !== null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Eye style={{ width: 10, height: 10, color: 'rgba(255,255,255,0.3)' }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', fontVariantNumeric: 'tabular-nums' }}>
            {data.count >= 1000
              ? `${(data.count / 1000).toFixed(1)}K`
              : data.count}
          </span>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>visits</span>
        </div>
      )}

      <style>{`
        @keyframes vcPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }
      `}</style>
    </div>
  )
}
