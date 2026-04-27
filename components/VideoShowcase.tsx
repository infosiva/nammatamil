'use client'

import { Play, Youtube } from 'lucide-react'

const VIDEOS = [
  {
    id: 'v1',
    title: 'Coolie Official Trailer — Thalapathy Vijay',
    channel: 'Sun Pictures',
    views: '42M views',
    thumb: 'linear-gradient(135deg, #1a0a00 0%, #3d1a00 100%)',
    youtubeId: '',
  },
  {
    id: 'v2',
    title: 'Retro — Official Teaser | Suriya | Karthik Subbaraj',
    channel: 'AGS Entertainment',
    views: '18M views',
    thumb: 'linear-gradient(135deg, #000d1a 0%, #001a3d 100%)',
    youtubeId: '',
  },
  {
    id: 'v3',
    title: 'Dragon — Mass Trailer | Pradeep Ranganathan',
    channel: 'Lyca Productions',
    views: '9M views',
    thumb: 'linear-gradient(135deg, #0d001a 0%, #1a003d 100%)',
    youtubeId: '',
  },
  {
    id: 'v4',
    title: 'IPL 2025 Highlights — CSK vs MI Super Over',
    channel: 'Star Sports Tamil',
    views: '6M views',
    thumb: 'linear-gradient(135deg, #001a0a 0%, #003d1a 100%)',
    youtubeId: '',
  },
]

export default function VideoShowcase() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {VIDEOS.map(v => (
        <a
          key={v.id}
          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(v.title)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group block rounded-xl overflow-hidden transition-transform hover:scale-[1.02]"
          style={{ border: '1px solid rgba(255,255,255,0.07)' }}
        >
          {/* Thumbnail */}
          <div
            className="relative aspect-video flex items-center justify-center"
            style={{ background: v.thumb }}
          >
            <div className="w-9 h-9 rounded-full bg-red-600/90 flex items-center justify-center group-hover:bg-red-500 transition-colors">
              <Play className="w-4 h-4 text-white fill-white ml-0.5" />
            </div>
          </div>
          {/* Info */}
          <div className="p-2 space-y-0.5" style={{ background: 'rgba(0,0,0,0.4)' }}>
            <p className="text-white text-[11px] font-semibold leading-snug line-clamp-2">{v.title}</p>
            <div className="flex items-center gap-1 text-white/30 text-[10px]">
              <Youtube className="w-2.5 h-2.5 text-red-400" />
              <span>{v.channel}</span>
              <span>·</span>
              <span>{v.views}</span>
            </div>
          </div>
        </a>
      ))}
    </div>
  )
}
