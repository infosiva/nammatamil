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

const RECENT = movies
  .filter(m => m.language === 'Tamil' && m.year >= 2025)
  .sort((a, b) => {
    const aReleased = a.ottDate && a.ottDate !== 'Coming Soon' ? 1 : 0
    const bReleased = b.ottDate && b.ottDate !== 'Coming Soon' ? 1 : 0
    if (bReleased !== aReleased) return bReleased - aReleased
    if (b.year !== a.year) return b.year - a.year
    return b.rating - a.rating
  })
  .slice(0, 7)

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ width: 3, height: 16, borderRadius: 99, background: '#a78bfa', flexShrink: 0 }} />
        <TrendingUp style={{ width: 12, height: 12, color: '#a78bfa', flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 900, color: '#fff', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Cinema Reviews
        </span>
        <Link href="/movies" style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>
          All movies →
        </Link>
      </div>

      {/* 7-col compact grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
        {RECENT.map((movie, i) => {
          const ott = ottStatus(movie)
          const rc = ratingColor(movie.rating)
          return (
            <motion.div
              key={movie.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3, ease }}
            >
              <Link href={`/movies/${movie.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                <motion.div
                  whileHover={{ y: -2, boxShadow: '0 6px 20px rgba(0,0,0,0.4)' }}
                  transition={{ duration: 0.18 }}
                  style={{
                    borderRadius: 10,
                    overflow: 'hidden',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {/* Poster area — taller aspect ratio */}
                  <div style={{
                    aspectRatio: '2/3',
                    background: `linear-gradient(160deg, ${rc}30 0%, rgba(5,5,16,0.95) 100%)`,
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {/* Rating */}
                    <div style={{
                      position: 'absolute', top: 5, left: 5,
                      display: 'flex', alignItems: 'center', gap: 2,
                      background: 'rgba(0,0,0,0.75)', borderRadius: 5, padding: '2px 5px',
                    }}>
                      <Star style={{ width: 8, height: 8, color: rc, fill: rc }} />
                      <span style={{ fontSize: 9, fontWeight: 900, color: rc }}>{movie.rating.toFixed(1)}</span>
                    </div>

                    {/* OTT badge */}
                    {ott && (
                      <div style={{
                        position: 'absolute', top: 5, right: 5,
                        fontSize: 7, fontWeight: 900, padding: '2px 4px', borderRadius: 3,
                        background: `${ott.color}25`, color: ott.color,
                        border: `1px solid ${ott.color}40`,
                        maxWidth: 56, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {ott.label}
                      </div>
                    )}

                    <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', gap: 2, flexDirection: 'column' }}>
                      <Play style={{ width: 14, height: 14, opacity: 0.4 }} />
                      <span>{movie.genre[0]}</span>
                    </span>

                    <span style={{
                      position: 'absolute', bottom: 4, right: 5,
                      fontSize: 8, color: 'rgba(255,255,255,0.2)',
                      display: 'flex', alignItems: 'center', gap: 2,
                    }}>
                      <Clock style={{ width: 7, height: 7 }} />{movie.year}
                    </span>
                  </div>

                  {/* Info */}
                  <div style={{ padding: '6px 6px 8px' }}>
                    <p style={{
                      fontSize: 10, fontWeight: 800, color: '#f4f4f5', lineHeight: 1.3,
                      margin: '0 0 2px',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {movie.title}
                    </p>
                    <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {movie.cast.slice(0, 1).join(', ')}
                    </p>
                    {movie.badge && (
                      <span style={{
                        display: 'inline-block', marginTop: 4,
                        fontSize: 7, fontWeight: 900, padding: '1px 5px', borderRadius: 3,
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

      <style>{`
        @media (max-width: 900px) {
          .cinema-grid { grid-template-columns: repeat(4, 1fr) !important; }
        }
        @media (max-width: 600px) {
          .cinema-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
      `}</style>
    </section>
  )
}
