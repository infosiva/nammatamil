'use client'

/**
 * PromoBar — inline "have a promo code?" toggle + unlocked-state banner.
 * Uses existing lib/promoCode.ts (server) + hooks/usePromo.ts (client) backend.
 */

import { useState } from 'react'
import { usePromo } from '@/hooks/usePromo'

const ACCENT = '#dc2626'

export default function PromoBar() {
  const { isUnlocked, daysLeft } = usePromo()
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<'idle' | 'checking' | 'invalid'>('idle')

  if (isUnlocked) {
    return (
      <span style={{ fontSize: 12, color: ACCENT, fontWeight: 600 }}>
        🎉 Pro active — {daysLeft}d left
      </span>
    )
  }

  async function submit() {
    if (!code.trim()) return
    setStatus('checking')
    try {
      const res = await fetch('/api/promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      if (data.valid) {
        window.location.reload()
      } else {
        setStatus('invalid')
      }
    } catch {
      setStatus('invalid')
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{ fontSize: 12, color: '#64748b', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Noto Sans Tamil', sans-serif" }}
      >
        Have a promo code?
      </button>
    )
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <input
        value={code}
        onChange={(e) => { setCode(e.target.value); setStatus('idle') }}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="Enter code"
        style={{ borderRadius: 6, border: '1px solid rgba(220,38,38,0.35)', padding: '3px 8px', fontSize: 12, width: 100 }}
      />
      <button
        onClick={submit}
        disabled={status === 'checking'}
        style={{ borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600, color: '#fff', background: ACCENT, opacity: status === 'checking' ? 0.6 : 1 }}
      >
        {status === 'checking' ? '...' : 'Apply'}
      </button>
      {status === 'invalid' && <span style={{ color: '#ef4444', fontSize: 11 }}>Invalid</span>}
    </span>
  )
}
