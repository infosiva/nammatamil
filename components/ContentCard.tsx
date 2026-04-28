import Link from 'next/link'
import { Star, Tv2, Film, Music, Globe, Zap } from 'lucide-react'
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

const TYPE_ICON = { serial: Tv2, movie: Film, album: Music }

const CHANNEL_PILL: Record<string, { bg: string; text: string }> = {
  'Sun TV':     { bg: 'rgba(234,88,12,0.18)',   text: '#fb923c' },
  'Vijay TV':   { bg: 'rgba(59,130,246,0.18)',  text: '#60a5fa' },
  'Star Vijay': { bg: 'rgba(139,92,246,0.18)',  text: '#a78bfa' },
  'Zee Tamil':  { bg: 'rgba(20,184,166,0.18)',  text: '#2dd4bf' },
}

export default function ContentCard({
  href, title, subtitle, gradient, type, badge, rating,
  language, channel, year, status, tags = [], thumbnail, compact = false,
}: ContentCardProps) {
  const Icon      = TYPE_ICON[type]
  const isOngoing = status === 'Ongoing'
  const posterH   = compact ? 'h-40' : 'h-52'
  const ch        = channel ? (CHANNEL_PILL[channel] ?? null) : null

  return (
    <Link href={href} className="group block">
      <div
        className="rounded-2xl overflow-hidden card-hover h-full"
        style={{
          background: '#0d0d18',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {/* ── Poster ── */}
        <div className={clsx('relative overflow-hidden', posterH, !thumbnail && `bg-gradient-to-br ${gradient}`)}>
          {thumbnail && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbnail}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          )}

          {/* Decorative blobs on gradient cards */}
          {!thumbnail && (
            <>
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/8 transition-transform duration-700 group-hover:scale-150" />
              <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-black/20 transition-transform duration-700 group-hover:scale-150" />
            </>
          )}

          {/* Type icon — top-left */}
          <div
            className="absolute top-2 left-2 p-1.5 rounded-lg"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)' }}
          >
            <Icon className="w-3 h-3 text-white/80" />
          </div>

          {/* Badge / AI pill — top-right */}
          {badge ? (
            <div
              className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold truncate max-w-[64px]"
              style={{ background: '#f59e0b', color: '#000' }}
            >
              {badge}
            </div>
          ) : (
            <div
              className="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}
            >
              <Zap className="w-2.5 h-2.5 text-amber-400" />
              <span className="text-[9px] font-bold text-amber-400">AI</span>
            </div>
          )}

          {/* Dubbed pill — bottom-left */}
          {language === 'Tamil Dubbed' && (
            <div
              className="absolute bottom-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold"
              style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.15)', color: '#67e8f9' }}
            >
              <Globe className="w-2.5 h-2.5" />
              Dubbed
            </div>
          )}

          {/* Ongoing dot — bottom-right */}
          {isOngoing && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 text-[9px] font-semibold">Live</span>
            </div>
          )}

          {/* Year pill when no channel */}
          {year && !channel && !compact && (
            <div
              className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[9px]"
              style={{ background: 'rgba(0,0,0,0.45)', color: 'rgba(255,255,255,0.5)' }}
            >
              {year}
            </div>
          )}

          {/* Title overlay gradient */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pt-8 pb-2.5 px-2.5">
            <h3 className="text-white font-bold text-[12px] leading-tight line-clamp-2 group-hover:text-amber-300 transition-colors duration-200">
              {title}
            </h3>
          </div>
        </div>

        {/* ── Card body (non-compact) ── */}
        {!compact && (
          <div className="px-2.5 py-2 space-y-1.5">
            <div className="flex items-center justify-between gap-1 min-w-0">
              <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                {ch ? (
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full truncate max-w-[80px]"
                    style={{ background: ch.bg, color: ch.text }}
                  >
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
                  <span
                    key={tag}
                    className="text-[9px] px-1.5 py-0.5 rounded-md capitalize"
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)' }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Compact footer ── */}
        {compact && (rating !== undefined || channel || year) && (
          <div className="px-2 py-1.5 flex items-center justify-between">
            {rating !== undefined ? (
              <div className="flex items-center gap-0.5">
                <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                <span className="text-amber-400 text-[10px] font-bold">{rating.toFixed(1)}</span>
              </div>
            ) : <span />}
            {channel && (
              <span
                className="text-[9px] truncate ml-1"
                style={{ color: ch?.text ?? 'rgba(255,255,255,0.3)' }}
              >
                {channel}
              </span>
            )}
            {year && !channel && (
              <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{year}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
