import Link from 'next/link'
import { Star, Tv2, Film, Music, Globe, Zap, Radio } from 'lucide-react'
import clsx from 'clsx'

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

const TYPE_ICON    = { serial: Tv2, movie: Film, album: Music }
const TYPE_EMOJI   = { serial: '📺', movie: '🎬', album: '🎵' }

const CHANNEL_STYLE: Record<string, { bg: string; text: string }> = {
  'Sun TV':       { bg: 'rgba(234,88,12,0.18)',   text: '#fb923c' },
  'Vijay TV':     { bg: 'rgba(59,130,246,0.18)',  text: '#60a5fa' },
  'Star Vijay':   { bg: 'rgba(139,92,246,0.18)',  text: '#a78bfa' },
  'Zee Tamil':    { bg: 'rgba(20,184,166,0.18)',  text: '#2dd4bf' },
  'Colors Tamil': { bg: 'rgba(236,72,153,0.18)',  text: '#f472b6' },
}

/* ── Gradient-only poster design ── */
function GradientPoster({
  gradient, title, type, badge, language, status, year, rating, tags, compact,
}: {
  gradient: string; title: string; type: 'serial' | 'movie' | 'album'
  badge?: string; language?: string; status?: string; year?: number
  rating?: number; tags?: string[]; compact?: boolean
}) {
  const isOngoing = status === 'Ongoing'
  const emoji     = TYPE_EMOJI[type]
  const firstTag  = tags?.[0]

  return (
    <div className={clsx(
      'relative w-full overflow-hidden',
      `bg-gradient-to-br ${gradient}`,
      compact ? 'h-48' : 'h-56',
    )}>

      {/* Background pattern — subtle grid */}
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }} />

      {/* Large emoji watermark */}
      <div className="absolute -bottom-2 -right-2 text-[64px] opacity-15 leading-none select-none">
        {emoji}
      </div>

      {/* Floating blobs */}
      <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/10 transition-transform duration-700 group-hover:scale-125" />
      <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-black/20 transition-transform duration-700 group-hover:scale-125" />

      {/* Top row: badge + live indicator */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
        {badge ? (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-400 text-black">
            {badge}
          </span>
        ) : (
          <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold text-amber-400"
            style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)' }}>
            <Zap className="w-2.5 h-2.5" />AI
          </span>
        )}
        {isOngoing && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold text-emerald-300"
            style={{ background: 'rgba(16,185,129,0.18)', border: '1px solid rgba(16,185,129,0.3)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <Radio className="w-2.5 h-2.5" />Live
          </span>
        )}
        {language === 'Tamil Dubbed' && !isOngoing && (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold text-cyan-300"
            style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.25)' }}>
            <Globe className="w-2.5 h-2.5" />Dubbed
          </span>
        )}
      </div>

      {/* Year pill (movies/albums) */}
      {year && type !== 'serial' && (
        <div className="absolute top-2.5 right-2.5 px-1.5 py-0.5 rounded text-[9px] font-bold text-white/70"
          style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)' }}>
          {year}
        </div>
      )}

      {/* Genre tag */}
      {firstTag && (
        <div className="absolute bottom-10 left-2.5 px-2 py-0.5 rounded-md text-[9px] font-semibold text-white/60"
          style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)' }}>
          {firstTag}
        </div>
      )}

      {/* Rating badge */}
      {rating !== undefined && !compact && (
        <div className="absolute bottom-10 right-2.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)' }}>
          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
          <span className="text-amber-400 text-[10px] font-black">{rating.toFixed(1)}</span>
        </div>
      )}

      {/* Title overlay */}
      <div className="absolute inset-x-0 bottom-0 pt-10 pb-2.5 px-2.5"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)' }}>
        <h3 className="text-white font-black text-sm leading-tight line-clamp-2 group-hover:text-amber-200 transition-colors duration-200 drop-shadow">
          {title}
        </h3>
      </div>
    </div>
  )
}

export default function ContentCard({
  href, title, subtitle, gradient, type, badge, rating,
  language, channel, year, status, tags = [], thumbnail, compact = false,
}: ContentCardProps) {
  const Icon = TYPE_ICON[type]
  const ch   = channel ? (CHANNEL_STYLE[channel] ?? null) : null

  return (
    <Link href={href} className="group block h-full">
      <div
        className="rounded-2xl overflow-hidden card-hover h-full flex flex-col"
        style={{
          background: '#0d0d1c',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* ── Poster ── */}
        {thumbnail ? (
          <div className={clsx('relative overflow-hidden', compact ? 'h-48' : 'h-56')}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbnail}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            {/* Type icon */}
            <div className="absolute top-2 left-2 p-1.5 rounded-lg"
              style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)' }}>
              <Icon className="w-3 h-3 text-white/80" />
            </div>
            {badge && (
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-black">
                {badge}
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 pb-2.5 px-2.5 pt-10"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)' }}>
              <h3 className="text-white font-black text-sm leading-tight line-clamp-2 group-hover:text-amber-200 transition-colors">
                {title}
              </h3>
            </div>
          </div>
        ) : (
          <GradientPoster
            gradient={gradient} title={title} type={type}
            badge={badge} language={language} status={status}
            year={year} rating={rating} tags={tags} compact={compact}
          />
        )}

        {/* ── Card body (non-compact only) ── */}
        {!compact && (
          <div className="px-2.5 py-2 space-y-1.5 flex-1">
            <div className="flex items-center justify-between gap-1 min-w-0">
              <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                {ch ? (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full truncate max-w-[90px]"
                    style={{ background: ch.bg, color: ch.text }}>
                    {channel}
                  </span>
                ) : year ? (
                  <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{year}</span>
                ) : null}
              </div>
              {rating !== undefined && (
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                  <span className="text-amber-400 text-[10px] font-bold">{rating.toFixed(1)}</span>
                </div>
              )}
            </div>
            {subtitle && (
              <p className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>{subtitle}</p>
            )}
            {tags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {tags.slice(0, 2).map(tag => (
                  <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-md capitalize"
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)' }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Compact footer: rating + channel ── */}
        {compact && (
          <div className="px-2.5 py-2 flex items-center justify-between gap-1 border-t border-white/[0.05]">
            {rating !== undefined ? (
              <div className="flex items-center gap-0.5">
                <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                <span className="text-amber-400 text-[10px] font-bold">{rating.toFixed(1)}</span>
              </div>
            ) : <span />}
            {channel ? (
              <span className="text-[9px] font-semibold truncate ml-1"
                style={{ color: ch?.text ?? 'rgba(255,255,255,0.3)' }}>
                {channel}
              </span>
            ) : year ? (
              <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{year}</span>
            ) : null}
          </div>
        )}
      </div>
    </Link>
  )
}
