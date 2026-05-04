'use client'

/**
 * NammaTVKVideos — Latest videos from NammaTVK YouTube channel
 * Fetches live RSS feed via /api/nammatvk-videos, auto-refreshes every 5 min.
 */

import { useState, useEffect, useCallback } from 'react'
import { Play, Youtube, RefreshCw, ExternalLink, X } from 'lucide-react'

interface NammaTVKVideo {
  videoId: string
  title: string
  publishedAt: string
  timeAgo: string
  thumbnail: string
  description?: string
}

interface ApiResponse {
  videos: NammaTVKVideo[]
  source: string
  count: number
  updatedAt: string
  cached?: boolean
}

const REFRESH_MS = 5 * 60 * 1000 // 5 minutes

// ── Video player modal ────────────────────────────────────────────────────────
function VideoModal({ video, onClose }: { video: NammaTVKVideo; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: '#0d0018', border: '1px solid rgba(255,255,255,0.1)' }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center text-white transition-colors hover:bg-red-600"
          style={{ background: 'rgba(0,0,0,0.6)' }}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="aspect-video">
          <iframe
            src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1&rel=0`}
            title={video.title}
            allow="autoplay; encrypted-media"
            allowFullScreen
            className="w-full h-full"
          />
        </div>

        <div className="px-4 py-3 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm leading-snug line-clamp-2">{video.title}</p>
            <p className="text-white/35 text-xs mt-1">NammaTVK · {video.timeAgo}</p>
          </div>
          <a
            href={`https://www.youtube.com/watch?v=${video.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            YouTube
          </a>
        </div>
      </div>
    </div>
  )
}

// ── Single video card ─────────────────────────────────────────────────────────
function VideoCard({ video, onPlay }: { video: NammaTVKVideo; onPlay: (v: NammaTVKVideo) => void }) {
  return (
    <div
      className="group relative rounded-xl overflow-hidden cursor-pointer"
      style={{ background: '#0d0018', border: '1px solid rgba(255,255,255,0.07)', transition: 'border-color 0.2s' }}
      onClick={() => onPlay(video)}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(251,191,36,0.25)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-75 group-hover:opacity-100"
          loading="lazy"
          onError={e => {
            // Fallback to default thumbnail if hqdefault fails
            const img = e.currentTarget
            if (img.src.includes('hqdefault')) {
              img.src = `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`
            }
          }}
        />
        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/10 transition-colors">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"
            style={{ background: '#ff0000' }}
          >
            <Play className="w-4 h-4 text-white ml-0.5 fill-white" />
          </div>
        </div>
        {/* NammaTVK badge */}
        <div
          className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold text-white"
          style={{ background: 'rgba(251,191,36,0.85)' }}
        >
          <span style={{ color: '#000' }}>NammaTVK</span>
        </div>
        {/* Time badge */}
        <div
          className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-bold text-white"
          style={{ background: 'rgba(0,0,0,0.75)' }}
        >
          {video.timeAgo}
        </div>
      </div>

      {/* Info */}
      <div className="p-2.5">
        <p className="text-white text-xs font-semibold line-clamp-2 leading-snug mb-1.5">{video.title}</p>
        <div className="flex items-center gap-1">
          <Youtube className="w-3 h-3 text-red-500 flex-shrink-0" />
          <span className="text-white/30 text-[10px]">NammaTVK</span>
        </div>
      </div>
    </div>
  )
}

// ── Skeleton loader ───────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="aspect-video" style={{ background: 'rgba(255,255,255,0.04)', animation: 'tvkShimmer 1.5s infinite' }} />
      <div className="p-2.5 space-y-1.5">
        <div style={{ height: 10, borderRadius: 4, background: 'rgba(255,255,255,0.05)', animation: 'tvkShimmer 1.5s infinite' }} />
        <div style={{ height: 10, borderRadius: 4, background: 'rgba(255,255,255,0.04)', width: '70%', animation: 'tvkShimmer 1.5s infinite' }} />
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function NammaTVKVideos() {
  const [data, setData]         = useState<ApiResponse | null>(null)
  const [loading, setLoading]   = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [playing, setPlaying]   = useState<NammaTVKVideo | null>(null)
  const [secAgo, setSecAgo]     = useState(0)

  const fetchVideos = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true)
    try {
      const res = await fetch('/api/nammatvk-videos', {
        cache: 'no-store',
        signal: AbortSignal.timeout(12000),
      })
      if (!res.ok) return
      const json: ApiResponse = await res.json()
      setData(json)
      setSecAgo(0)
    } catch {
      // keep existing data
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchVideos()
    const d = setInterval(fetchVideos, REFRESH_MS)
    const t = setInterval(() => setSecAgo(s => s + 1), 1000)
    return () => { clearInterval(d); clearInterval(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const videos = data?.videos ?? []

  return (
    <>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* NammaTVK branded header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', borderRadius: 99,
            background: 'rgba(251,191,36,0.08)',
            border: '1px solid rgba(251,191,36,0.2)',
          }}>
            <Youtube className="w-3.5 h-3.5" style={{ color: '#ff0000' }} />
            <span style={{ fontSize: 11, fontWeight: 900, color: '#fbbf24' }}>NammaTVK</span>
            {/* Live indicator */}
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0, animation: 'tvkPulse 2s infinite' }} />
          </div>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
            {loading ? 'Loading…' : refreshing ? 'Refreshing…' : secAgo > 0 ? `Updated ${secAgo < 60 ? `${secAgo}s` : `${Math.floor(secAgo / 60)}m`} ago` : 'Live'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Manual refresh */}
          <button
            onClick={() => fetchVideos(true)}
            disabled={refreshing}
            title="Refresh"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8, padding: '5px 8px', cursor: 'pointer', color: 'rgba(255,255,255,0.4)',
              display: 'flex', alignItems: 'center', gap: 4, fontSize: 10,
            }}
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          {/* Channel link */}
          <a
            href="https://www.youtube.com/@NammaTVK"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '5px 10px', borderRadius: 8, fontSize: 10, fontWeight: 700,
              color: 'rgba(255,255,255,0.5)',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              textDecoration: 'none', transition: 'color 0.15s',
            }}
          >
            View Channel <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>

      {/* Video grid */}
      {loading ? (
        <div className="tvk-grid">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : videos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 20px', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
          No videos available right now.{' '}
          <a href="https://www.youtube.com/@NammaTVK" target="_blank" rel="noopener noreferrer" style={{ color: '#fbbf24', textDecoration: 'none' }}>
            Visit NammaTVK on YouTube →
          </a>
        </div>
      ) : (
        <div className="tvk-grid">
          {videos.map(v => (
            <VideoCard key={v.videoId} video={v} onPlay={setPlaying} />
          ))}
        </div>
      )}

      {/* Source indicator */}
      {!loading && data && (
        <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.12)', marginTop: 10, textAlign: 'right' }}>
          {data.source === 'youtube-rss' ? '🟢 Live from YouTube' : data.source === 'stale-cache' ? '⚡ Cached' : '⏳ Seed data'} · {data.count} videos
        </p>
      )}

      {playing && <VideoModal video={playing} onClose={() => setPlaying(null)} />}

      <style>{`
        .tvk-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 10px;
        }
        @media (max-width: 480px) {
          .tvk-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
        }
        @keyframes tvkShimmer { 0%,100%{opacity:0.5} 50%{opacity:1} }
        @keyframes tvkPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} }
      `}</style>
    </>
  )
}
