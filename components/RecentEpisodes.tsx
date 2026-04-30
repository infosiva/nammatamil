'use client'

import { useEffect, useState } from 'react'
import { Play, Clock, ExternalLink } from 'lucide-react'

interface Episode {
  id: string
  title: string
  videoId: string
  channelName: string
  channelColor: string
  publishedAt: string
  thumbnail: string
}

interface Props {
  serialTitle: string
  channelName: string
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const h  = Math.floor(ms / 3_600_000)
  const d  = Math.floor(h / 24)
  if (d === 0 && h === 0) return 'Just now'
  if (d === 0) return `${h}h ago`
  if (d === 1) return 'Yesterday'
  return `${d}d ago`
}

function dayLabel(iso: string): string {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (d === 0) return 'TODAY'
  if (d === 1) return 'YESTERDAY'
  return null as unknown as string
}

export default function RecentEpisodes({ serialTitle, channelName }: Props) {
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [status, setStatus]     = useState<'loading' | 'done' | 'empty'>('loading')

  useEffect(() => {
    const params = new URLSearchParams({
      serial:  serialTitle,
      channel: channelName,
      limit:   '6',
    })
    fetch(`/api/recent-episodes?${params}`)
      .then(r => r.json())
      .then(data => {
        setEpisodes(data.episodes ?? [])
        setStatus(data.episodes?.length > 0 ? 'done' : 'empty')
      })
      .catch(() => setStatus('empty'))
  }, [serialTitle, channelName])

  if (status === 'loading') {
    return (
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1 h-5 rounded-full bg-amber-400" />
          <h2 className="text-lg font-bold text-white">Recent Episodes</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden animate-pulse"
              style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="w-full bg-white/10" style={{ aspectRatio: '16/9' }} />
              <div className="p-2.5 space-y-1.5">
                <div className="h-3 bg-white/10 rounded w-3/4" />
                <div className="h-2.5 bg-white/10 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (status === 'empty') {
    return (
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1 h-5 rounded-full bg-amber-400" />
          <h2 className="text-lg font-bold text-white">Recent Episodes</h2>
        </div>
        <div className="rounded-2xl p-6 text-center border border-white/5"
          style={{ background: 'rgba(255,255,255,0.02)' }}>
          <p className="text-white/40 text-sm">No recent episodes found on YouTube.</p>
          <a
            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(serialTitle + ' latest episode')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
          >
            Search on YouTube <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </section>
    )
  }

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-amber-400" />
          <h2 className="text-lg font-bold text-white">Recent Episodes</h2>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)' }}>
            LIVE
          </span>
        </div>
        <a
          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(serialTitle + ' latest episode')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-white/40 hover:text-white/70 flex items-center gap-1 transition-colors"
        >
          All on YouTube <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {episodes.map((ep) => {
          const label = dayLabel(ep.publishedAt)
          return (
            <a
              key={ep.id}
              href={`https://www.youtube.com/watch?v=${ep.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-xl overflow-hidden border border-white/5 hover:border-amber-400/30 transition-all hover:-translate-y-0.5"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              {/* Thumbnail */}
              <div className="relative w-full overflow-hidden" style={{ aspectRatio: '16/9' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ep.thumbnail}
                  alt={ep.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  onError={e => {
                    (e.currentTarget as HTMLImageElement).src =
                      `https://img.youtube.com/vi/${ep.videoId}/hqdefault.jpg`
                  }}
                />
                {/* Dark overlay + play icon */}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'rgba(251,191,36,0.9)' }}>
                    <Play className="w-4 h-4 text-black fill-black ml-0.5" />
                  </div>
                </div>
                {/* Day badge */}
                {label && (
                  <div className="absolute top-2 left-2 text-[9px] font-black px-1.5 py-0.5 rounded-full"
                    style={{
                      background: label === 'TODAY' ? 'rgba(251,191,36,0.9)' : 'rgba(255,255,255,0.15)',
                      color: label === 'TODAY' ? '#000' : '#fff',
                    }}>
                    {label}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-2.5">
                <p className="text-white text-xs font-semibold leading-snug line-clamp-2 group-hover:text-amber-200 transition-colors">
                  {ep.title}
                </p>
                <div className="flex items-center gap-1 mt-1.5">
                  <Clock className="w-2.5 h-2.5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
                  <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {timeAgo(ep.publishedAt)}
                  </span>
                </div>
              </div>
            </a>
          )
        })}
      </div>
    </section>
  )
}
