'use client'

import { useEffect } from 'react'

interface AdUnitProps {
  slot?: string
  format?: 'auto' | 'rectangle' | 'horizontal'
  className?: string
}

export default function AdUnit({ slot = 'nammatamil-live-rectangle', format = 'auto', className = '' }: AdUnitProps) {
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_ID ?? 'ca-pub-4237294630161176'

  useEffect(() => {
    try {
      // @ts-expect-error adsbygoogle may not be typed
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {}
  }, [])

  return (
    <div className={`overflow-hidden rounded-xl glass border border-white/5 ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={publisherId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  )
}
