'use client'

import Link from 'next/link'
import { Star, Play, Clock, TrendingUp } from 'lucide-react'
import { movies } from '@/data/movies'
import { motion } from 'framer-motion'

const ease = [0.23, 1, 0.32, 1] as const

const OTT_COLORS: Record<string, string> = {
  'Netflix':         '#e50914',
  'Amazon Prime':    '#00a8e0',
  'Disney+ Hotstar': '#0073e6',
  'ZEE5':            '#8b5cf6',
  'YouTube':         '#ff0000',
}

// Latest Tamil releases — 2025-2026, sorted by rating desc
const RECENT = movies
  .filter(m => m.language === 'Tamil' && m.year >= 2025)
  .sort((a, b) => {
    // OTT released first, then by year desc, then rating
    const aReleased = a.ottDate && a.ottDate !== 'Coming Soon' ? 1 : 0
    const bReleased = b.ottDate && b.ottDate !== 'Coming Soon' ? 1 : 0
    if (bReleased !== aReleased) return bReleased - aReleased
    if (b.year !== a.year) return b.year - a.year
    return b.rating - a.rating
  })
  .slice(0, 12)

function ratingColor(r: number) {
  if (r >= 8) return '#4ade80'
  if (r >= 7) return '#fbbf24'
  if (r >= 6) return '#fb923c'
  return '#f87171'
}

function ottStatus(m: (typeof RECENT)[0]) {
  if (!m.ottDate) return null
  if (m.ottDate === 'Coming Soon') return { label: 'Coming Soon', color: '#94a3b8' }
  const platform = m.streamingOn[0]
  return { label: platform ?? 'OTT', color: OTT_COLORS[platform] ?? '#6b7280' }
}

export default function CinemaReviewStrip() {
  return (
    <section style={{ padding: '0 0 8px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ width: 3, height: 18, borderRadius: 99, background: '#a78bfa', flexShrink: 0 }} />
        <TrendingUp style={{ width: 13, height: 13, color: '#a78bfa', flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 900, color: '#fff', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Cinema Reviews
        </span>
        <Link href="/movies" style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>
          All movies →
        </Link>
      </div>

      {/* Horizontal scroll strip */}
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
        {RECENT.map((movie, i) => {
          const ott = ottStatus(movie)
          const rc = ratingColor(movie.rating)
          return (
            <motion.div
              key={movie.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.35, ease }}
            >
              <Link
                href={`/movies/${movie.slug}`}
                style={{ textDecoration: 'none', display: 'block', width: 140, flexShrink: 0 }}
              >
                <motion.div
                  whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
                  transition={{ duration: 0.2 }}
                  style={{
                    borderRadius: 12,
                    overflow: 'hidden',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.09)',
                  }}
                >
                  {/* Poster area */}
                  <div
                    style={{
                      height: 90,
                      background: `linear-gradient(135deg, ${rc}22 0%, rgba(5,5,16,0.9) 100%)`,
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {/* Rating badge */}
                    <div style={{
                      position: 'absolute', top: 6, left: 6,
                      display: 'flex', alignItems: 'center', gap: 3,
                      background: 'rgba(0,0,0,0.7)', borderRadius: 6, padding: '3px 6px',
                    }}>
                      <Star style={{ width: 9, height: 9, color: rc, fill: rc }} />
                      <span style={{ fontSize: 10, fontWeight: 900, color: rc }}>{movie.rating.toFixed(1)}</span>
                    </div>

                    {/* OTT badge */}
                    {ott && (
                      <div style={{
                        position: 'absolute', top: 6, right: 6,
                        fontSize: 8, fontWeight: 900, padding: '2px 5px', borderRadius: 4,
                        background: `${ott.color}22`, color: ott.color,
                        border: `1px solid ${ott.color}40`,
                        whiteSpace: 'nowrap', maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {ott.label}
                      </div>
                    )}

                    {/* Genre tag */}
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Play style={{ width: 10, height: 10 }} />
                      {movie.genre[0]}
                    </span>

                    {/* Year bottom */}
                    <span style={{
                      position: 'absolute', bottom: 6, right: 6,
                      fontSize: 9, color: 'rgba(255,255,255,0.2)',
                      display: 'flex', alignItems: 'center', gap: 2,
                    }}>
                      <Clock style={{ width: 8, height: 8 }} />{movie.year}
                    </span>
                  </div>

                  {/* Info */}
                  <div style={{ padding: '8px 8px 10px' }}>
                    <p style={{
                      fontSize: 11, fontWeight: 800, color: '#f4f4f5', lineHeight: 1.3,
                      margin: '0 0 3px',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {movie.title}
                    </p>
                    <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {movie.cast.slice(0, 2).join(', ')}
                    </p>
                    {movie.badge && (
                      <span style={{
                        display: 'inline-block', marginTop: 5,
                        fontSize: 8, fontWeight: 900, padding: '2px 6px', borderRadius: 4,
                        background: 'rgba(167,139,250,0.15)', color: '#a78bfa',
                        border: '1px solid rgba(167,139,250,0.25)',
                      }}>
                        {movie.badge}
                      </span>
                    )}
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
