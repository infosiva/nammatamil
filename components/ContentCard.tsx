import Link from 'next/link'
import { Star, Tv2, Film, Music, Globe, Sparkles } from 'lucide-react'
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
  /** Reduce poster height for dense grid layouts */
  compact?: boolean
}

const TYPE_ICON = {
  serial: Tv2,
  movie: Film,
  album: Music,
}

const CHANNEL_COLORS: Record<string, string> = {
  'Sun TV': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'Vijay TV': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Star Vijay': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'Zee Tamil': 'bg-teal-500/20 text-teal-400 border-teal-500/30',
}

export default function ContentCard({
  href,
  title,
  subtitle,
  gradient,
  type,
  badge,
  rating,
  language,
  channel,
  year,
  status,
  tags = [],
  compact = false,
}: ContentCardProps) {
  const Icon = TYPE_ICON[type]
  const isOngoing = status === 'Ongoing'
  const posterH = compact ? 'h-36' : 'h-44'

  return (
    <Link href={href} className="group block">
      <div className="glass rounded-xl overflow-hidden card-hover border border-white/5 h-full">

        {/* Poster / Gradient Art */}
        <div className={clsx('relative bg-gradient-to-br overflow-hidden', gradient, posterH)}>
          {/* Decorative circles */}
          <div className="absolute -top-5 -right-5 w-20 h-20 rounded-full bg-white/10 group-hover:scale-150 transition-transform duration-700" />
          <div className="absolute -bottom-3 -left-3 w-14 h-14 rounded-full bg-black/20 group-hover:scale-150 transition-transform duration-700" />

          {/* Type icon */}
          <div className="absolute top-2 left-2 p-1.5 rounded-lg bg-black/30 backdrop-blur-sm">
            <Icon className="w-3.5 h-3.5 text-white" />
          </div>

          {/* Badge or AI sparkle */}
          {badge ? (
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-gold-500 text-dark-900 text-[10px] font-bold leading-tight max-w-[60px] truncate">
              {badge}
            </div>
          ) : (
            <div
              className="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(245,158,11,0.18)', border: '1px solid rgba(245,158,11,0.3)' }}
            >
              <Sparkles className="w-2.5 h-2.5 text-gold-400" />
              <span className="text-[9px] font-bold text-gold-400 leading-none">AI</span>
            </div>
          )}

          {/* Language tag for dubbed */}
          {language === 'Tamil Dubbed' && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/20">
              <Globe className="w-2.5 h-2.5 text-cyan-400" />
              <span className="text-cyan-400 text-[10px] font-medium">Dubbed</span>
            </div>
          )}

          {/* Ongoing dot */}
          {isOngoing && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 text-[10px] font-medium">Live</span>
            </div>
          )}

          {/* Year tag (when no channel) */}
          {year && !channel && !compact && (
            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/40 text-slate-300 text-[10px]">
              {year}
            </div>
          )}

          {/* Title overlay */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent pt-6 pb-2 px-2.5">
            <h3 className="text-white font-bold text-xs leading-tight line-clamp-2 group-hover:text-gold-300 transition-colors">
              {title}
            </h3>
          </div>
        </div>

        {/* Card body — hidden in compact mode to save vertical space */}
        {!compact && (
          <div className="p-2.5 space-y-1.5">
            {/* Meta row */}
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                {channel && (
                  <span className={clsx('badge border text-[10px] px-1.5 py-0.5 truncate max-w-[80px]', CHANNEL_COLORS[channel] ?? 'bg-white/10 text-slate-300 border-white/20')}>
                    {channel}
                  </span>
                )}
                {year && !channel && (
                  <span className="text-muted text-[10px]">{year}</span>
                )}
              </div>
              {rating !== undefined && (
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <Star className="w-2.5 h-2.5 text-gold-400 fill-gold-400" />
                  <span className="text-gold-400 text-[10px] font-semibold">{rating.toFixed(1)}</span>
                </div>
              )}
            </div>

            {/* Subtitle */}
            {subtitle && (
              <p className="text-muted text-[10px] truncate leading-tight">{subtitle}</p>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 capitalize">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Compact mode: just rating pill below poster */}
        {compact && rating !== undefined && (
          <div className="px-2 py-1 flex items-center justify-between">
            <div className="flex items-center gap-0.5">
              <Star className="w-2.5 h-2.5 text-gold-400 fill-gold-400" />
              <span className="text-gold-400 text-[10px] font-semibold">{rating.toFixed(1)}</span>
            </div>
            {channel && (
              <span className="text-[9px] text-slate-500 truncate ml-1">{channel}</span>
            )}
            {year && !channel && (
              <span className="text-[9px] text-slate-500">{year}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
