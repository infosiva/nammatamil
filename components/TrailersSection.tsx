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
function ytThumb(videoId: string, quality: 'hq' | 'mq' | 'sd' = 'hq') {
  const q = quality === 'hq' ? 'hqdefault' : quality === 'mq' ? 'mqdefault' : 'sddefault'
  return `https://i.ytimg.com/vi/${videoId}/${q}.jpg`
}

function TrailerCard({ trailer, onPlay }: { trailer: Trailer; onPlay: (t: Trailer) => void }) {
  const [imgSrc, setImgSrc] = useState(() => ytThumb(trailer.videoId, 'hq'))
  const [imgFailed, setImgFailed] = useState(false)
  const [hovered, setHovered] = useState(false)

  const handleImgError = () => {
    if (imgSrc.includes('hqdefault')) {
      setImgSrc(ytThumb(trailer.videoId, 'mq'))
    } else if (imgSrc.includes('mqdefault')) {
      setImgSrc(ytThumb(trailer.videoId, 'sd'))
    } else {
      setImgFailed(true)
    }
  }

  return (
    <div
      className="flex-shrink-0 w-[168px] sm:w-[200px] cursor-pointer group"
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

        {/* Category badge */}
        <div className="absolute top-1.5 left-1.5">
          <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full"
            style={{
              background: trailer.category === 'drama' ? 'rgba(249,115,22,0.9)' : 'rgba(220,38,38,0.9)',
              color: '#fff',
            }}>
            {trailer.category === 'drama' ? 'SERIAL' : 'MOVIE'}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="mt-2 px-0.5">
        <p className="text-white text-[11px] font-bold leading-snug line-clamp-2 group-hover:text-amber-200 transition-colors">
          {trailer.title}
        </p>
        <p className="text-white/35 text-[10px] mt-0.5 truncate">{trailer.channel}</p>
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
export default function TrailersSection() {
  const [trailers, setTrailers] = useState<Trailer[]>([])
  const [loading, setLoading]   = useState(true)
  const [category, setCategory] = useState<'all' | 'movie' | 'drama'>('all')
  const [playing, setPlaying]   = useState<Trailer | null>(null)
  const [canLeft, setCanLeft]   = useState(false)
  const [canRight, setCanRight] = useState(true)
  const scrollRef               = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/trailers')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { if (d?.trailers?.length) setTrailers(d.trailers) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const visible = trailers.filter(t => category === 'all' ? true : t.category === category)

  const updateArrows = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 8)
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8)
  }, [])

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -420 : 420, behavior: 'smooth' })
  }

  return (
    <section className="pb-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <h2 className="text-white font-black text-base">Trailers & Teasers</h2>
        </div>
        <div className="flex items-center gap-1.5">
          {CATEGORY_TABS.map(tab => (
            <button key={tab.id}
              onClick={() => setCategory(tab.id as 'all' | 'movie' | 'drama')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all"
              style={category === tab.id
                ? { background: 'rgba(239,68,68,0.2)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.4)' }
                : { color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.07)' }}>
              {tab.label}
            </button>
          ))}
          {/* Arrows in header — always visible */}
          <div className="flex gap-1 ml-1">
            <button onClick={() => scroll('left')} disabled={!canLeft}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
              style={{
                background: canLeft ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${canLeft ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'}`,
              }}>
              <ChevronLeft className="w-4 h-4" style={{ color: canLeft ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.2)' }} />
            </button>
            <button onClick={() => scroll('right')} disabled={!canRight}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
              style={{
                background: canRight ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${canRight ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'}`,
              }}>
              <ChevronRight className="w-4 h-4" style={{ color: canRight ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.2)' }} />
            </button>
          </div>
        </div>
      </div>

      {/* Scroll strip */}
      {loading ? (
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[168px] sm:w-[200px]">
              <div className="shimmer rounded-xl" style={{ aspectRatio: '16/9' }} />
              <div className="mt-2 space-y-1.5">
                <div className="h-3 shimmer rounded w-full" />
                <div className="h-2.5 shimmer rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          ref={scrollRef}
          onScroll={updateArrows}
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-1"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {visible.map(t => (
            <div key={t.id} style={{ scrollSnapAlign: 'start' }}>
              <TrailerCard trailer={t} onPlay={setPlaying} />
            </div>
          ))}
          {visible.length === 0 && (
            <p className="text-white/25 text-sm py-6 px-2">No trailers in this category yet.</p>
          )}
        </div>
      )}

      {playing && <VideoModal trailer={playing} onClose={() => setPlaying(null)} />}
    </section>
  )
}
