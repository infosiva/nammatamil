import Link from 'next/link'
import { Star, Tv2, Film, Music, Globe } from 'lucide-react'
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
}: ContentCardProps) {
  const Icon = TYPE_ICON[type]
  const isOngoing = status === 'Ongoing'

  return (
    <Link href={href} className="group block">
      <div className="glass rounded-2xl overflow-hidden card-hover border border-white/5 h-full">

        {/* Poster / Gradient Art */}
        <div className={clsx('relative h-48 bg-gradient-to-br', gradient, 'overflow-hidden')}>
          {/* Decorative circles */}
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10 group-hover:scale-150 transition-transform duration-700" />
          <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-black/20 group-hover:scale-150 transition-transform duration-700" />

          {/* Type icon */}
          <div className="absolute top-3 left-3 p-1.5 rounded-lg bg-black/30 backdrop-blur-sm">
            <Icon className="w-4 h-4 text-white" />
          </div>

          {/* Badge */}
          {badge && (
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-gold-500 text-dark-900 text-xs font-bold">
              {badge}
            </div>
          )}

          {/* Language tag for dubbed */}
          {language === 'Tamil Dubbed' && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/20">
              <Globe className="w-3 h-3 text-cyan-400" />
              <span className="text-cyan-400 text-xs font-medium">Dubbed</span>
            </div>
          )}

          {/* Ongoing dot */}
          {isOngoing && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 text-xs font-medium">Ongoing</span>
            </div>
          )}

          {/* Title overlay */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent pt-8 pb-3 px-3">
            <h3 className="text-white font-bold text-sm leading-tight line-clamp-2 group-hover:text-gold-300 transition-colors">
              {title}
            </h3>
          </div>
        </div>

        {/* Card body */}
        <div className="p-3 space-y-2.5">

          {/* Meta row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {channel && (
                <span className={clsx('badge border text-xs px-2 py-0.5', CHANNEL_COLORS[channel] ?? 'bg-white/10 text-slate-300 border-white/20')}>
                  {channel}
                </span>
              )}
              {year && !channel && (
                <span className="text-muted text-xs">{year}</span>
              )}
            </div>
            {rating !== undefined && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <Star className="w-3 h-3 text-gold-400 fill-gold-400" />
                <span className="text-gold-400 text-xs font-semibold">{rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Subtitle (director / artist) */}
          {subtitle && (
            <p className="text-muted text-xs truncate">{subtitle}</p>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-slate-400 capitalize">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
