'use client'

/**
 * TVKTrendingBanner — Full-width scrolling top bar showing live TVK/TN politics news.
 * Hot topic: Thalapathy Vijay / TVK government formation — trending May 2026.
 * Fetches from /api/tvk-news, rotates headlines, links out to source.
 */

import { useState, useEffect, useCallback } from 'react'
import { Radio, X, ExternalLink } from 'lucide-react'

interface NewsItem {
  title:   string
  link:    string
  source:  string
  timeAgo: string
  isHot:   boolean
  lang:    string
}

const STATIC_HEADLINES: NewsItem[] = [
  { title: 'TVK wins historic majority — Thalapathy Vijay to be Tamil Nadu CM', link: '', source: 'NammaTamil', timeAgo: 'Today', isHot: true,  lang: 'en' },
  { title: 'TVK forms government — oath ceremony scheduled', link: '', source: 'NammaTamil', timeAgo: 'Today', isHot: true,  lang: 'en' },
  { title: 'Vijay CM: TVK sweeps 110 seats in debut election', link: '', source: 'NammaTamil', timeAgo: 'Today', isHot: false, lang: 'en' },
]

export default function TVKTrendingBanner() {
  const [dismissed, setDismissed] = useState(false)
  const [headlines, setHeadlines] = useState<NewsItem[]>(STATIC_HEADLINES)
  const [active, setActive]       = useState(0)

  const fetchNews = useCallback(async () => {
    try {
      const res = await fetch('/api/tvk-news', { cache: 'no-store', signal: AbortSignal.timeout(5000) })
      if (!res.ok) return
      const d = await res.json()
      const items: NewsItem[] = (d.news ?? []).slice(0, 8)
      if (items.length > 0) setHeadlines(items)
    } catch { /* keep static */ }
  }, [])

  useEffect(() => {
    fetchNews()
    const id = setInterval(fetchNews, 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [fetchNews])

  // Rotate every 5 seconds
  useEffect(() => {
    if (headlines.length <= 1) return
    const id = setInterval(() => setActive(p => (p + 1) % headlines.length), 5000)
    return () => clearInterval(id)
  }, [headlines])

  if (dismissed) return null

  const item = headlines[active]

  return (
    <div
      className="w-full flex-shrink-0"
      style={{
        background: 'linear-gradient(90deg, rgba(234,179,8,0.10) 0%, rgba(239,68,68,0.08) 100%)',
        borderBottom: '1px solid rgba(234,179,8,0.18)',
      }}
    >
      {/* Gold accent line */}
      <div className="h-[2px]" style={{ background: 'linear-gradient(90deg,#eab308 0%,#ef4444 50%,#eab308 100%)' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center gap-3">

        {/* TVK badge */}
        <div className="flex items-center gap-1.5 flex-shrink-0 border-r border-white/10 pr-3">
          <div className="relative flex-shrink-0">
            <Radio className="w-3 h-3 text-yellow-400" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping opacity-75" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-yellow-400" />
          </div>
          <span className="text-[10px] font-black tracking-wider" style={{ color: '#eab308' }}>
            🌟 TVK
          </span>
        </div>

        {/* Hot badge */}
        {item?.isHot && (
          <span className="text-[8px] font-black px-1.5 py-0.5 rounded flex-shrink-0"
            style={{ background: 'rgba(239,68,68,0.18)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
            🔥 HOT
          </span>
        )}

        {/* Headline */}
        {item && (
          item.link ? (
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center gap-1.5 min-w-0 group"
            >
              <span className="text-[11px] font-semibold text-white/80 truncate group-hover:text-white transition-colors">
                {item.title}
              </span>
              <ExternalLink className="w-2.5 h-2.5 text-white/20 flex-shrink-0 group-hover:text-white/50 transition-colors" />
            </a>
          ) : (
            <span className="flex-1 text-[11px] font-semibold text-white/80 truncate min-w-0">
              {item.title}
            </span>
          )
        )}

        {/* Source + time */}
        {item?.timeAgo && (
          <span className="text-[9px] text-white/25 flex-shrink-0 hidden sm:inline">
            {item.source} · {item.timeAgo}
          </span>
        )}

        {/* Dot indicators */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {headlines.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className="rounded-full transition-all"
              style={{
                width:  i === active ? 12 : 4,
                height: 4,
                background: i === active ? 'rgba(234,179,8,0.8)' : 'rgba(255,255,255,0.15)',
              }}
            />
          ))}
        </div>

        {/* Dismiss */}
        <button
          onClick={() => setDismissed(true)}
          className="text-white/20 hover:text-white/50 transition-colors flex-shrink-0 ml-1"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}
