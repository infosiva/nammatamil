'use client'

import { useState } from 'react'
import { Play, Youtube, ExternalLink, X } from 'lucide-react'

interface VideoItem {
  id: string
  youtubeId: string
  title: string
  channel: string
  label: string
  labelColor: string
  views?: string
}

// Curated latest Tamil entertainment videos (trailers, songs, highlights)
const VIDEOS: VideoItem[] = [
  {
    id: 'v1',
    youtubeId: 'AHnT1DRKTPM',
    title: 'Coolie — Official Trailer',
    channel: 'Sun Pictures',
    label: 'Rajinikanth',
    labelColor: '#f59e0b',
  },
  {
    id: 'v2',
    youtubeId: 'cz7TP3kPDaY',
    title: 'Retro — Official Trailer',
    channel: 'Lyca Productions',
    label: 'Suriya',
    labelColor: '#e11d48',
  },
  {
    id: 'v3',
    youtubeId: 'bRkBNRMxQbk',
    title: 'Dragon — Official Trailer',
    channel: 'AGS Entertainment',
    label: 'Pradeep Ranganathan',
    labelColor: '#8b5cf6',
  },
  {
    id: 'v4',
    youtubeId: 'JxjMQBRXOSU',
    title: 'Amaran — Official Trailer',
    channel: 'Raaj Kamal Films',
    label: 'Sivakarthikeyan',
    labelColor: '#06b6d4',
  },
  {
    id: 'v5',
    youtubeId: 'hnLgrxHqzZM',
    title: 'CSK vs MI IPL 2025 — Highlights',
    channel: 'Star Sports Tamil',
    label: '🏏 IPL Live',
    labelColor: '#22c55e',
  },
  {
    id: 'v6',
    youtubeId: 'Dvjpf-hdKTs',
    title: 'Thunivu — Official Trailer (Ajith)',
    channel: 'Zee Studios',
    label: 'Thala Ajith',
    labelColor: '#f97316',
  },
]

function VideoCard({ video, onPlay }: { video: VideoItem; onPlay: (v: VideoItem) => void }) {
  const thumb = `https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`
  return (
    <div
      className="group relative rounded-xl overflow-hidden cursor-pointer"
      style={{ background: '#0d0018', border: '1px solid rgba(255,255,255,0.07)' }}
      onClick={() => onPlay(video)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumb}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
          loading="lazy"
        />
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
          <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Play className="w-4 h-4 text-white ml-0.5 fill-white" />
          </div>
        </div>
        {/* Label badge */}
        <div
          className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold text-white"
          style={{ background: video.labelColor + 'dd' }}
        >
          {video.label}
        </div>
      </div>
      {/* Info */}
      <div className="p-2.5">
        <p className="text-white text-xs font-semibold line-clamp-2 leading-snug mb-1">{video.title}</p>
        <div className="flex items-center gap-1">
          <Youtube className="w-3 h-3 text-red-500" />
          <span className="text-white/35 text-[10px] truncate">{video.channel}</span>
        </div>
      </div>
    </div>
  )
}

function VideoModal({ video, onClose }: { video: VideoItem; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-red-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        {/* Embed */}
        <div className="aspect-video">
          <iframe
            src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&rel=0`}
            title={video.title}
            allow="autoplay; encrypted-media"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
        {/* Footer */}
        <div className="bg-dark-900 px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-white font-semibold text-sm">{video.title}</p>
            <p className="text-white/40 text-xs">{video.channel}</p>
          </div>
          <a
            href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            YouTube
          </a>
        </div>
      </div>
    </div>
  )
}

export default function VideoShowcase() {
  const [playing, setPlaying] = useState<VideoItem | null>(null)

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {VIDEOS.map(v => (
          <VideoCard key={v.id} video={v} onPlay={setPlaying} />
        ))}
      </div>

      {playing && <VideoModal video={playing} onClose={() => setPlaying(null)} />}
    </>
  )
}
