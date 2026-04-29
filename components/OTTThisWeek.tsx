'use client'

/**
 * OTTThisWeek — Shows latest Tamil/South Indian OTT releases this week
 * Static data updated periodically — no API needed
 */

import { Tv2, ExternalLink } from 'lucide-react'

interface OTTRelease {
  title: string
  platform: string
  platformColor: string
  date: string
  type: 'Movie' | 'Series' | 'Special'
  language: string
  poster: string
  link?: string
}

const OTT_RELEASES: OTTRelease[] = [
  {
    title: 'Amaran',
    platform: 'Netflix',
    platformColor: '#e50914',
    date: 'Apr 25',
    type: 'Movie',
    language: 'Tamil',
    poster: 'https://image.tmdb.org/t/p/w500/eCB06m1KUGilEOlIzb40nkQhVY0.jpg',
  },
  {
    title: 'Vidaamuyarchi',
    platform: 'Amazon Prime',
    platformColor: '#00a8e0',
    date: 'Apr 18',
    type: 'Movie',
    language: 'Tamil',
    poster: 'https://image.tmdb.org/t/p/w500/yx7AYFLoupzBfdfEAlDFuOiei2A.jpg',
  },
  {
    title: 'L2: Empuraan',
    platform: 'Amazon Prime',
    platformColor: '#00a8e0',
    date: 'Apr 22',
    type: 'Movie',
    language: 'Malayalam',
    poster: 'https://image.tmdb.org/t/p/w500/dfaZipN3Aw5BK85nEvfr2FNg4EW.jpg',
  },
  {
    title: 'Thug Life',
    platform: 'Netflix',
    platformColor: '#e50914',
    date: 'May 2',
    type: 'Movie',
    language: 'Tamil',
    poster: 'https://image.tmdb.org/t/p/w500/DmBbUtbA3T9sdVXDgIJ8bsIDw0.jpg',
  },
  {
    title: 'Lucky Baskhar',
    platform: 'ZEE5',
    platformColor: '#a855f7',
    date: 'Apr 28',
    type: 'Movie',
    language: 'Telugu',
    poster: 'https://image.tmdb.org/t/p/w500/z5SxDcVWa9nokynVqBHb2IKk78J.jpg',
  },
]

const TYPE_COLORS = {
  Movie: '#60a5fa',
  Series: '#4ade80',
  Special: '#fbbf24',
}

export default function OTTThisWeek() {
  return (
    <div className="rounded-2xl p-4 space-y-3"
      style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.06), rgba(99,102,241,0.04))', border: '1px solid rgba(168,85,247,0.18)' }}>

      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)' }}>
          <Tv2 className="w-4 h-4 text-purple-400" />
        </div>
        <div>
          <p className="text-[10px] font-black text-purple-400 tracking-wider uppercase">New on OTT</p>
          <p className="text-xs text-white/40">Tamil &amp; South Indian · April 2026</p>
        </div>
      </div>

      {/* Release list */}
      <div className="space-y-2">
        {OTT_RELEASES.map((r) => (
          <div key={r.title} className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl group"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>

            {/* Poster thumbnail */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={r.poster}
              alt={r.title}
              className="w-9 h-12 object-cover rounded-lg flex-shrink-0"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-white truncate leading-tight">{r.title}</p>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: r.platformColor + '22', color: r.platformColor, border: `1px solid ${r.platformColor}44` }}>
                  {r.platform}
                </span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{ background: TYPE_COLORS[r.type] + '15', color: TYPE_COLORS[r.type] }}>
                  {r.type}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-white/30">{r.language}</span>
                <span className="text-white/15">·</span>
                <span className="text-[10px] text-white/30">{r.date}</span>
              </div>
            </div>

            {r.link && (
              <a href={r.link} target="_blank" rel="noopener noreferrer"
                className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <ExternalLink className="w-3 h-3 text-white/30" />
              </a>
            )}
          </div>
        ))}
      </div>

      <p className="text-[10px] text-white/20 text-center">Streaming dates may vary by region</p>
    </div>
  )
}
