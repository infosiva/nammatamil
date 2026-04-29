'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, ChevronLeft, ChevronRight, Film, Tv2, X } from 'lucide-react'
import type { Trailer } from '@/app/api/trailers/route'

const CATEGORY_TABS = [
  { id: 'all',   label: 'All',     icon: null },
  { id: 'movie', label: 'Movies',  icon: Film },
  { id: 'drama', label: 'Dramas',  icon: Tv2 },
]

function TrailerCard({ trailer, onPlay }: { trailer: Trailer; onPlay: (t: Trailer) => void }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="flex-shrink-0 w-[180px] sm:w-[210px] cursor-pointer group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onPlay(trailer)}
    >
      {/* Thumbnail */}
      <div className="relative rounded-xl overflow-hidden"
        style={{ aspectRatio: '16/9', background: 'rgba(255,255,255,0.05)' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={trailer.thumbnail}
          alt={trailer.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={e => {
            const img = e.currentTarget as HTMLImageElement
            img.src = `https://img.youtube.com/vi/${trailer.videoId}/mqdefault.jpg`
          }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 transition-opacity duration-300"
          style={{
            background: hovered
              ? 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.15) 100%)'
              : 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)',
          }} />
        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="rounded-full flex items-center justify-center transition-all duration-300"
            style={{
              width: hovered ? 44 : 36,
              height: hovered ? 44 : 36,
              background: hovered ? 'rgba(255,0,0,0.9)' : 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(4px)',
              border: '2px solid rgba(255,255,255,0.3)',
              boxShadow: hovered ? '0 0 20px rgba(255,0,0,0.5)' : 'none',
            }}>
            <Play className="w-4 h-4 text-white fill-white ml-0.5" />
          </div>
        </div>
        {/* Category badge */}
        <div className="absolute top-2 left-2">
          <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full"
            style={{
              background: trailer.category === 'drama' ? 'rgba(249,115,22,0.85)' : 'rgba(239,68,68,0.85)',
              color: '#fff',
            }}>
            {trailer.category === 'drama' ? 'DRAMA' : 'MOVIE'}
          </span>
        </div>
      </div>

      {/* Info below */}
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
  // Close on backdrop click or Escape
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
      style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl rounded-2xl overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.1)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full transition-colors"
          style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.15)' }}>
          <X className="w-4 h-4 text-white" />
        </button>

        {/* 16:9 embed */}
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

        {/* Title bar */}
        <div className="px-4 py-3" style={{ background: 'rgba(10,6,28,0.98)' }}>
          <p className="text-white font-bold text-sm line-clamp-1">{trailer.title}</p>
          <p className="text-white/40 text-xs mt-0.5">{trailer.channel}</p>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function TrailersSection() {
  const [trailers, setTrailers]   = useState<Trailer[]>([])
  const [loading, setLoading]     = useState(true)
  const [category, setCategory]   = useState<'all' | 'movie' | 'drama'>('all')
  const [playing, setPlaying]     = useState<Trailer | null>(null)
  const scrollRef                 = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/trailers')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { if (d?.trailers?.length) setTrailers(d.trailers) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const visible = trailers.filter(t =>
    category === 'all' ? true : t.category === category
  )

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir === 'left' ? -400 : 400, behavior: 'smooth' })
  }

  return (
    <section className="py-4">
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <h2 className="text-white font-black text-base">Trailers & Teasers</h2>
          <span className="text-white/25 text-[11px]">Latest</span>
        </div>
        {/* Category filter */}
        <div className="flex gap-1">
          {CATEGORY_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setCategory(tab.id as 'all' | 'movie' | 'drama')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all"
              style={category === tab.id
                ? { background: 'rgba(239,68,68,0.2)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.4)' }
                : { color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.07)' }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scroll container */}
      <div className="relative">
        {/* Left arrow */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-6 z-10 p-1.5 rounded-full -translate-x-2 hidden sm:flex"
          style={{ background: 'rgba(10,6,28,0.9)', border: '1px solid rgba(255,255,255,0.12)' }}>
          <ChevronLeft className="w-4 h-4 text-white/60" />
        </button>

        {loading ? (
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[180px] sm:w-[210px]">
                <div className="shimmer rounded-xl" style={{ aspectRatio: '16/9' }} />
                <div className="mt-2 space-y-1">
                  <div className="h-3 shimmer rounded w-full" />
                  <div className="h-2.5 shimmer rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {visible.map(t => (
              <div key={t.id} style={{ scrollSnapAlign: 'start' }}>
                <TrailerCard trailer={t} onPlay={setPlaying} />
              </div>
            ))}
          </div>
        )}

        {/* Right arrow */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-6 z-10 p-1.5 rounded-full translate-x-2 hidden sm:flex"
          style={{ background: 'rgba(10,6,28,0.9)', border: '1px solid rgba(255,255,255,0.12)' }}>
          <ChevronRight className="w-4 h-4 text-white/60" />
        </button>
      </div>

      {/* Video modal */}
      {playing && <VideoModal trailer={playing} onClose={() => setPlaying(null)} />}
    </section>
  )
}
