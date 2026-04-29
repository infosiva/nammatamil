import Link from 'next/link'
import { Star, Globe } from 'lucide-react'

interface ContentCardProps {
  href: string
  title: string
  subtitle?: string
  gradient: string
  type: 'serial' | 'movie' | 'album'
  badge?: string
  rating?: number
  language?: string
  channel?: string
  year?: number
  status?: string
  tags?: string[]
  thumbnail?: string
  compact?: boolean
}

const CHANNEL_COLOR: Record<string, string> = {
  'Sun TV':       '#fb923c',
  'Vijay TV':     '#60a5fa',
  'Star Vijay':   '#a78bfa',
  'Zee Tamil':    '#2dd4bf',
  'Colors Tamil': '#f472b6',
}

/* ── Gradient poster fallback ── */
function GradientPoster({ gradient, title }: { gradient: string; title: string }) {
  return (
    <div className={`relative w-full h-full bg-gradient-to-br ${gradient} flex items-end p-3`}>
      {/* subtle grid pattern */}
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
          backgroundSize: '18px 18px',
        }} />
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-black/20" />
      <p className="relative text-white font-black text-sm leading-tight line-clamp-3 drop-shadow">{title}</p>
    </div>
  )
}

export default function ContentCard({
  href, title, subtitle, gradient, type, badge, rating,
  language, channel, year, status, tags = [], thumbnail,
}: ContentCardProps) {
  const channelColor = channel ? (CHANNEL_COLOR[channel] ?? 'rgba(255,255,255,0.4)') : null
  const isOngoing = status === 'Ongoing'
  const isDubbed  = language === 'Tamil Dubbed'

  // Score circle colour (TMDB style)
  const scoreColor = rating === undefined ? null
    : rating >= 7  ? '#21d07a'
    : rating >= 5  ? '#d2d531'
    : '#db2360'

  return (
    <Link href={href} className="group block">
      {/* ── Poster ── */}
      <div className="relative rounded-xl overflow-hidden"
        style={{ aspectRatio: '2/3', background: '#0d0d1c' }}>

        {thumbnail ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={thumbnail}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <GradientPoster gradient={gradient} title={title} />
        )}

        {/* Dark overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

        {/* Badge top-left */}
        {badge && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-400 text-black z-10">
            {badge}
          </div>
        )}

        {/* Dubbed badge */}
        {isDubbed && (
          <div className="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold text-cyan-300 z-10"
            style={{ background: 'rgba(6,182,212,0.2)', border: '1px solid rgba(6,182,212,0.35)' }}>
            <Globe className="w-2.5 h-2.5" />DUB
          </div>
        )}

        {/* Ongoing live dot */}
        {isOngoing && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold text-emerald-300 z-10"
            style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.35)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />ON
          </div>
        )}

        {/* Score circle — TMDB style, overlaps bottom edge */}
        {rating !== undefined && scoreColor && (
          <div className="absolute -bottom-3 left-2.5 z-10 w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: '#081c22', border: `2.5px solid ${scoreColor}` }}>
            <span className="text-[10px] font-black" style={{ color: scoreColor }}>
              {Math.round(rating * 10)}
            </span>
          </div>
        )}
      </div>

      {/* ── Info below poster (TMDB style) ── */}
      <div className="pt-5 pb-1 px-0.5">
        <h3 className="text-white font-bold text-xs leading-snug line-clamp-2 group-hover:text-amber-200 transition-colors">
          {title}
        </h3>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {year && (
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{year}</span>
          )}
          {channel && channelColor && (
            <>
              {year && <span className="text-[10px] text-white/15">·</span>}
              <span className="text-[10px] font-semibold" style={{ color: channelColor }}>{channel}</span>
            </>
          )}
          {subtitle && !channel && !year && (
            <span className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>{subtitle}</span>
          )}
        </div>
        {tags.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-1">
            {tags.slice(0, 2).map(tag => (
              <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded capitalize"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
