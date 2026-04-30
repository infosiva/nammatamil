'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { Trailer } from '@/app/api/trailers/route'

const CATEGORY_TABS = [
  { id: 'all',   label: 'All'    },
  { id: 'movie', label: 'Movies' },
  { id: 'drama', label: 'Dramas' },
]

// YouTube thumbnail quality fallback chain
function ytThumb(videoId: string, quality: 'hq' | 'mq' | 'sd' | 'default' = 'hq') {
  const q = quality === 'hq' ? 'hqdefault' : quality === 'mq' ? 'mqdefault' : quality === 'sd' ? 'sddefault' : 'default'
  return `https://i.ytimg.com/vi/${videoId}/${q}.jpg`
}

function TrailerCard({ trailer, onPlay, fullWidth = false }: { trailer: Trailer; onPlay: (t: Trailer) => void; fullWidth?: boolean }) {
  const [imgSrc, setImgSrc] = useState(() => ytThumb(trailer.videoId, 'hq'))
  const [imgFailed, setImgFailed] = useState(false)
  const [hovered, setHovered] = useState(false)

  const handleImgError = () => {
    if (imgSrc.includes('hqdefault')) {
      setImgSrc(ytThumb(trailer.videoId, 'sd'))
    } else if (imgSrc.includes('sddefault')) {
      setImgSrc(ytThumb(trailer.videoId, 'mq'))
    } else if (imgSrc.includes('mqdefault')) {
      setImgSrc(ytThumb(trailer.videoId, 'default'))
    } else {
      setImgFailed(true)
    }
  }

  return (
    <div
      className={`cursor-pointer group ${fullWidth ? 'w-full' : 'flex-shrink-0 w-[168px] sm:w-[200px]'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onPlay(trailer)}
    >
      {/* Thumbnail */}
      <div className="relative rounded-xl overflow-hidden"
        style={{ aspectRatio: '16/9' }}>
        {/* Gradient background shown when image fails */}
        <div className="absolute inset-0"
          style={{
            background: trailer.category === 'drama'
              ? 'linear-gradient(135deg,#1e1b4b,#312e81)'
              : 'linear-gradient(135deg,#1c0a0a,#450a0a)',
          }} />
        {/* YouTube logo placeholder when no image */}
        {imgFailed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <svg viewBox="0 0 90 63" className="w-10 h-7 opacity-20" fill="#ff0000">
              <path d="M88 9.8a11.3 11.3 0 0 0-7.9-8C73.2 0 45 0 45 0S16.8 0 9.9 1.8a11.3 11.3 0 0 0-7.9 8C0 15.8 0 31.5 0 31.5s0 15.7 2 21.7a11.3 11.3 0 0 0 7.9 8C16.8 63 45 63 45 63s28.2 0 35.1-1.8a11.3 11.3 0 0 0 7.9-8c2-6 2-21.7 2-21.7s0-15.7-2-21.7z"/>
              <polygon points="36,45 59,31.5 36,18" fill="white"/>
            </svg>
            <span className="text-white/20 text-[9px] px-2 text-center leading-tight line-clamp-2">{trailer.title}</span>
          </div>
        )}

        {!imgFailed && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imgSrc}
            alt={trailer.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={handleImgError}
          />
        )}

        {/* Dark overlay */}
        <div className="absolute inset-0 transition-opacity duration-300"
          style={{
            background: hovered
              ? 'linear-gradient(to top,rgba(0,0,0,0.85) 0%,rgba(0,0,0,0.2) 100%)'
              : 'linear-gradient(to top,rgba(0,0,0,0.65) 0%,rgba(0,0,0,0.1) 60%)',
          }} />

        {/* Play button — always visible, grows on hover */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-full flex items-center justify-center transition-all duration-200"
            style={{
              width: hovered ? 46 : 38,
              height: hovered ? 46 : 38,
              background: hovered ? 'rgba(220,38,38,0.92)' : 'rgba(255,255,255,0.18)',
              backdropFilter: 'blur(6px)',
              border: `2px solid ${hovered ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.35)'}`,
              boxShadow: hovered ? '0 0 24px rgba(220,38,38,0.6)' : '0 2px 12px rgba(0,0,0,0.5)',
            }}>
            <Play className="w-4 h-4 text-white fill-white ml-0.5" />
          </div>
        </div>

        {/* Category badge — bottom left */}
        <div className="absolute top-1.5 left-1.5">
          <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full"
            style={{
              background: trailer.category === 'drama' ? 'rgba(249,115,22,0.9)' : 'rgba(220,38,38,0.9)',
              color: '#fff',
            }}>
            {trailer.category === 'drama' ? 'SERIAL' : 'MOVIE'}
          </span>
        </div>

        {/* Trending badge — top right: real views > recency */}
        {(() => {
          // Real YouTube trending (view-count based)
          if (trailer.trending) return (
            <div className="absolute top-1.5 right-1.5">
              <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(251,191,36,0.92)', color: '#000' }}>🔥 TRENDING</span>
            </div>
          )
          // Fallback recency badges
          const daysAgo = (Date.now() - new Date(trailer.publishedAt).getTime()) / (1000 * 60 * 60 * 24)
          if (daysAgo <= 7)  return <div className="absolute top-1.5 right-1.5"><span className="text-[8px] font-black px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(251,191,36,0.92)', color: '#000' }}>🔥 NEW</span></div>
          if (daysAgo <= 21) return <div className="absolute top-1.5 right-1.5"><span className="text-[8px] font-black px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(139,92,246,0.88)', color: '#fff' }}>⭐ NEW</span></div>
          if (daysAgo <= 45) return <div className="absolute top-1.5 right-1.5"><span className="text-[8px] font-black px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.82)', color: '#000' }}>POPULAR</span></div>
          return null
        })()}
      </div>

      {/* Info */}
      <div className="mt-2 px-0.5">
        <p className="text-white text-[11px] font-bold leading-snug line-clamp-2 group-hover:text-amber-200 transition-colors">
          {trailer.title}
        </p>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-white/35 text-[10px] truncate">{trailer.channel}</p>
          <div className="flex items-center gap-1 flex-shrink-0 ml-1">
            {trailer.viewLabel && (
              <span className="text-amber-400/70 text-[9px] font-semibold">{trailer.viewLabel}</span>
            )}
            <p className="text-white/20 text-[9px]">
              {(() => {
                const daysAgo = Math.floor((Date.now() - new Date(trailer.publishedAt).getTime()) / (1000 * 60 * 60 * 24))
                if (daysAgo === 0) return 'Today'
                if (daysAgo === 1) return '1d ago'
                if (daysAgo < 7)  return `${daysAgo}d ago`
                if (daysAgo < 30) return `${Math.floor(daysAgo / 7)}w ago`
                return `${Math.floor(daysAgo / 30)}mo ago`
              })()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── YouTube embed modal ───────────────────────────────────────────────────────
function VideoModal({ trailer, onClose }: { trailer: Trailer; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.94)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl"
        style={{ border: '1px solid rgba(255,255,255,0.12)' }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full"
          style={{ background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(255,255,255,0.2)' }}>
          <X className="w-4 h-4 text-white" />
        </button>
        <div style={{ aspectRatio: '16/9', background: '#000' }}>
          <iframe
            src={`https://www.youtube.com/embed/${trailer.videoId}?autoplay=1&rel=0&modestbranding=1`}
            title={trailer.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
            style={{ border: 'none' }}
          />
        </div>
        <div className="px-4 py-3" style={{ background: 'rgba(10,6,28,0.98)' }}>
          <p className="text-white font-bold text-sm line-clamp-1">{trailer.title}</p>
          <p className="text-white/40 text-xs mt-0.5">{trailer.channel}</p>
        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function TrailersSection({ embedded = false }: { embedded?: boolean }) {
  const [trailers, setTrailers] = useState<Trailer[]>([])
  const [loading, setLoading]   = useState(true)
  const [category, setCategory] = useState<'all' | 'movie' | 'drama'>('all')
  const [playing, setPlaying]   = useState<Trailer | null>(null)
  const scrollRef               = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/trailers')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { if (d?.trailers?.length) setTrailers(d.trailers) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const visible = trailers.filter(t => category === 'all' ? true : t.category === category)

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -420 : 420, behavior: 'smooth' })
  }

  // ── Embedded (tab) mode — responsive grid, no scroll ─────────────────────
  if (embedded) {
    return (
      <div className="space-y-4">
        {/* Filter row */}
        <div className="flex items-center gap-2 flex-wrap">
          {CATEGORY_TABS.map(tab => (
            <button key={tab.id}
              onClick={() => setCategory(tab.id as 'all' | 'movie' | 'drama')}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={category === tab.id
                ? { background: 'rgba(251,146,60,0.2)', color: '#fdba74', border: '1px solid rgba(251,146,60,0.4)' }
                : { color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.07)' }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Responsive grid — 2 cols mobile, 3 tablet, 4 desktop */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i}>
                <div className="shimmer rounded-xl" style={{ aspectRatio: '16/9' }} />
                <div className="mt-2 space-y-1.5">
                  <div className="h-3 shimmer rounded w-full" />
                  <div className="h-2.5 shimmer rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <p className="text-white/25 text-sm">No trailers found — YouTube feeds may be temporarily unavailable.</p>
            <button onClick={() => {
              setLoading(true)
              fetch('/api/trailers')
                .then(r => r.ok ? r.json() : Promise.reject())
                .then(d => { if (d?.trailers?.length) setTrailers(d.trailers) })
                .catch(() => {})
                .finally(() => setLoading(false))
            }} className="text-xs text-amber-400/60 hover:text-amber-400 transition-colors border border-white/10 px-3 py-1 rounded-lg">
              Retry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {visible.map(t => (
              <TrailerCard key={t.id} trailer={t} onPlay={setPlaying} fullWidth />
            ))}
          </div>
        )}

        {playing && <VideoModal trailer={playing} onClose={() => setPlaying(null)} />}
      </div>
    )
  }

  // ── Standalone (strip) mode — compact horizontal scroll ───────────────────
  return null
}
