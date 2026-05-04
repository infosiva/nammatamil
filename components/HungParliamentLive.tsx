'use client'

/**
 * HungParliamentLive — Real-time coalition news + AI analysis
 *
 * Polls /api/election-news every 4 minutes.
 * Shows:
 *   - Breaking alert banner (AI-detected)
 *   - Coalition likelihood meter (TVK-led / DMK-led / President's rule)
 *   - Seat-to-majority gap for each party
 *   - AI narrative: scenario + paths to govt
 *   - Live news feed from RSS + scored by relevance
 */

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Zap, AlertTriangle, TrendingUp, Newspaper, ExternalLink } from 'lucide-react'

interface CoalitionAnalysis {
  summary: string
  scenario: string
  tvkPath: string
  dmkPath: string
  likelihood: { tvk_led: number; dmk_led: number; presidents_rule: number }
  keyDeal: string
  urgency: 'low' | 'medium' | 'high' | 'breaking'
  breakingAlert: string | null
}

interface NewsItem {
  title: string
  link: string
  source: string
  pubDate: string
  timeAgo: string
  desc: string
  score: number
  isHot: boolean
}

interface PartySplit { won: number; leading: number; total: number }

interface ElectionNewsResponse {
  news: NewsItem[]
  analysis: CoalitionAnalysis
  seats: {
    TVK: PartySplit; DMK: PartySplit; AIADMK: PartySplit; BJP: PartySplit; Others: PartySplit
    total: number; majority: number; reported: number
  }
  phase: string
  updatedAt: string
}

const POLL_MS = 4 * 60 * 1000 // 4 min

const PARTY_COLORS: Record<string, string> = {
  TVK: '#fbbf24', DMK: '#f87171', AIADMK: '#4ade80', BJP: '#fb923c', Others: '#94a3b8',
}

// ── Gap bar: won + leading vs majority needed ─────────────────────────────────
function GapBar({ name, split, majority, color }: {
  name: string
  split: { won: number; leading: number; total: number }
  majority: number
  color: string
}) {
  const total = split.total
  const pct   = Math.min((total / majority) * 100, 100)
  const wonPct = total > 0 ? Math.min((split.won / majority) * 100, pct) : 0
  const gap   = majority - total
  const hasGap = gap > 0

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
          <span style={{ fontWeight: 900, fontSize: 13, color }}>{name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 900, fontSize: 20, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{total}</span>
          {split.won > 0 && (
            <span style={{ fontSize: 9, fontWeight: 700, color: '#4ade80' }}>{split.won}W</span>
          )}
          {split.leading > 0 && (
            <span style={{ fontSize: 9, fontWeight: 700, color: '#fbbf24' }}>{split.leading}L</span>
          )}
          {hasGap ? (
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 99,
              background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)',
            }}>
              needs {gap} more
            </span>
          ) : (
            <span style={{
              fontSize: 9, fontWeight: 900, padding: '2px 6px', borderRadius: 99,
              background: 'rgba(74,222,128,0.15)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.35)',
            }}>
              ✓ MAJORITY
            </span>
          )}
        </div>
      </div>
      {/* Stacked bar: won (solid) + leading (lighter) */}
      <div style={{ height: 8, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', position: 'relative' }}>
        {/* Leading portion (behind won) */}
        <div style={{
          position: 'absolute', top: 0, left: 0, bottom: 0,
          width: `${pct}%`,
          background: `${color}50`,
          borderRadius: 99,
          transition: 'width 0.8s ease',
        }} />
        {/* Won portion (solid, on top) */}
        <div style={{
          position: 'absolute', top: 0, left: 0, bottom: 0,
          width: `${wonPct}%`,
          background: color,
          borderRadius: 99,
          transition: 'width 0.8s ease',
          boxShadow: `0 0 8px ${color}55`,
        }} />
        {/* 118 mark */}
        <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: 1.5, background: 'rgba(251,191,36,0.5)' }} />
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        {split.won > 0 && <span style={{ fontSize: 8, color: `${color}99` }}>▬ Won: {split.won}</span>}
        {split.leading > 0 && <span style={{ fontSize: 8, color: `${color}55` }}>░ Leading: {split.leading}</span>}
      </div>
    </div>
  )
}

// ── Coalition likelihood bars ─────────────────────────────────────────────────
function LikelihoodBar({ label, pct, color, sub }: { label: string; pct: number; color: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <div>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>{label}</span>
          {sub && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginLeft: 6 }}>{sub}</span>}
        </div>
        <span style={{ fontWeight: 900, fontSize: 15, color, fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 99, width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}55, ${color})`,
          transition: 'width 1s ease',
        }} />
      </div>
    </div>
  )
}

// ── Single news card ──────────────────────────────────────────────────────────
function NewsCard({ item, rank }: { item: NewsItem; rank: number }) {
  return (
    <a
      href={item.link || '#'}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'block', textDecoration: 'none',
        borderRadius: 14, padding: '13px 14px',
        background: item.isHot
          ? 'linear-gradient(135deg, rgba(239,68,68,0.10), rgba(239,68,68,0.04))'
          : 'rgba(255,255,255,0.025)',
        border: `1px solid ${item.isHot ? 'rgba(239,68,68,0.30)' : 'rgba(255,255,255,0.07)'}`,
        transition: 'all 0.15s',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Rank badge */}
      <div style={{
        position: 'absolute', top: 10, right: 10,
        width: 20, height: 20, borderRadius: '50%',
        background: 'rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, color: 'rgba(255,255,255,0.2)', fontWeight: 700,
      }}>{rank}</div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
        {item.isHot && (
          <span style={{
            flexShrink: 0, fontSize: 9, fontWeight: 900, padding: '2px 7px', borderRadius: 99,
            background: 'rgba(239,68,68,0.18)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.4)',
          }}>🔥 HOT</span>
        )}
        <p style={{
          fontSize: 13, fontWeight: 700, color: '#f4f4f5', lineHeight: 1.45,
          margin: 0, flex: 1, paddingRight: 24,
        }}>
          {item.title}
        </p>
      </div>

      {item.desc && (
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5, margin: '0 0 8px' }}>
          {item.desc.slice(0, 140)}{item.desc.length > 140 ? '…' : ''}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)' }}>{item.source}</span>
          <span style={{ width: 2, height: 2, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'inline-block' }} />
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>{item.timeAgo}</span>
        </div>
        {item.link && (
          <ExternalLink style={{ width: 10, height: 10, color: 'rgba(255,255,255,0.15)' }} />
        )}
      </div>
    </a>
  )
}

// ── Urgency color ─────────────────────────────────────────────────────────────
function urgencyColor(u: string) {
  if (u === 'breaking') return '#ef4444'
  if (u === 'high')     return '#f97316'
  if (u === 'medium')   return '#fbbf24'
  return '#94a3b8'
}

// ── Main component ────────────────────────────────────────────────────────────
export default function HungParliamentLive() {
  const [data, setData]         = useState<ElectionNewsResponse | null>(null)
  const [loading, setLoading]   = useState(true)
  const [refreshing, setRefresh] = useState(false)
  const [showAllNews, setShowAll] = useState(false)
  const [secAgo, setSecAgo]     = useState<number | null>(null)

  const fetchData = useCallback(async (manual = false) => {
    if (manual) setRefresh(true)
    try {
      const res = await fetch('/api/election-news', { cache: 'no-store', signal: AbortSignal.timeout(15000) })
      if (!res.ok) return
      const json: ElectionNewsResponse = await res.json()
      setData(json)
      setSecAgo(0)
    } catch { /* keep previous */ }
    finally { setLoading(false); setRefresh(false) }
  }, [])

  useEffect(() => {
    fetchData()
    const dataId = setInterval(() => fetchData(), POLL_MS)
    const tickId = setInterval(() => setSecAgo(s => s !== null ? s + 1 : null), 1000)
    return () => { clearInterval(dataId); clearInterval(tickId) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return (
      <div style={{
        borderRadius: 24, border: '1px solid rgba(239,68,68,0.2)', overflow: 'hidden',
        background: 'linear-gradient(160deg, rgba(15,5,32,0.98) 0%, rgba(7,1,15,0.98) 100%)',
      }}>
        <div style={{ padding: '14px 18px', background: 'rgba(239,68,68,0.08)', borderBottom: '1px solid rgba(239,68,68,0.15)' }}>
          <div style={{ height: 14, width: 220, borderRadius: 7, background: 'rgba(255,255,255,0.07)', animation: 'shimmer 1.5s infinite' }} />
        </div>
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ height: 80, borderRadius: 14, background: 'rgba(255,255,255,0.04)', animation: 'shimmer 1.5s infinite' }} />
          ))}
        </div>
      </div>
    )
  }

  const analysis  = data?.analysis
  const news      = data?.news ?? []
  const seats     = data?.seats ?? {
    TVK:    { won: 107, leading: 0, total: 107 },
    DMK:    { won: 60,  leading: 0, total: 60  },
    AIADMK: { won: 47,  leading: 0, total: 47  },
    BJP:    { won: 1,   leading: 0, total: 1   },
    Others: { won: 19,  leading: 0, total: 19  },
    total: 234, majority: 118, reported: 234,
  }
  const visibleNews = showAllNews ? news : news.slice(0, 5)
  const uc = urgencyColor(analysis?.urgency ?? 'high')

  return (
    <div style={{
      borderRadius: 24, overflow: 'hidden',
      background: 'linear-gradient(160deg, rgba(15,5,32,0.98) 0%, rgba(7,1,15,0.98) 100%)',
      border: `1px solid ${uc}28`,
      boxShadow: `0 0 40px ${uc}0d`,
    }}>

      {/* ── Header ── */}
      <div style={{
        padding: '12px 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
        background: `${uc}0d`, borderBottom: `1px solid ${uc}1e`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 99,
            background: `${uc}20`, border: `1px solid ${uc}50`,
            color: uc, fontSize: 10, fontWeight: 900, letterSpacing: '0.08em',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: uc, display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
            HUNG ASSEMBLY
          </span>
          <span style={{ fontWeight: 700, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
            Coalition Watch · TN 2026
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {secAgo !== null && (
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>
              {refreshing ? 'Refreshing…' : secAgo < 60 ? `${secAgo}s ago` : `${Math.floor(secAgo / 60)}m ago`}
            </span>
          )}
          <button onClick={() => fetchData(true)} disabled={refreshing}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'rgba(255,255,255,0.25)' }}>
            <RefreshCw style={{ width: 14, height: 14, animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Breaking alert ── */}
        {analysis?.breakingAlert && (
          <div style={{
            borderRadius: 14, padding: '12px 16px',
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <AlertTriangle style={{ width: 16, height: 16, color: '#ef4444', flexShrink: 0 }} />
            <p style={{ fontSize: 13, fontWeight: 800, color: '#ef4444', margin: 0, lineHeight: 1.4 }}>
              {analysis.breakingAlert}
            </p>
          </div>
        )}

        {/* ── Seat gap to majority ── */}
        <div style={{ borderRadius: 18, padding: '16px 18px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <TrendingUp style={{ width: 14, height: 14, color: '#fbbf24' }} />
            <span style={{ fontWeight: 900, fontSize: 14, color: '#fff' }}>Race to 118 — Majority Gap</span>
            <span style={{ marginLeft: 'auto', fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>
              ECI · {seats.reported ?? seats.total}/234 seats
            </span>
          </div>
          <GapBar name="TVK" split={seats.TVK} majority={seats.majority} color={PARTY_COLORS.TVK} />
          <GapBar name="DMK" split={seats.DMK} majority={seats.majority} color={PARTY_COLORS.DMK} />
          <GapBar name="AIADMK" split={seats.AIADMK} majority={seats.majority} color={PARTY_COLORS.AIADMK} />
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            {[
              { name: 'BJP',    split: seats.BJP    },
              { name: 'Others', split: seats.Others },
            ].map(p => (
              <div key={p.name} style={{
                flex: 1, borderRadius: 10, padding: '8px 12px',
                background: `${PARTY_COLORS[p.name]}0d`, border: `1px solid ${PARTY_COLORS[p.name]}22`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: PARTY_COLORS[p.name] }}>{p.name}</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontWeight: 900, fontSize: 16, color: PARTY_COLORS[p.name] }}>{p.split.total}</span>
                  {p.split.won > 0 && <span style={{ fontSize: 8, color: '#4ade80' }}>{p.split.won}W</span>}
                  {p.split.leading > 0 && <span style={{ fontSize: 8, color: '#fbbf24' }}>{p.split.leading}L</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── AI Coalition analysis ── */}
        {analysis && (
          <div style={{ borderRadius: 18, overflow: 'hidden', border: '1px solid rgba(139,92,246,0.25)' }}>
            <div style={{
              padding: '12px 16px', background: 'rgba(139,92,246,0.10)',
              borderBottom: '1px solid rgba(139,92,246,0.18)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <Zap style={{ width: 13, height: 13, color: '#a78bfa' }} />
              <span style={{ fontWeight: 900, fontSize: 13, color: '#a78bfa' }}>AI Coalition Analysis</span>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginLeft: 'auto' }}>Updated every 10 min</span>
            </div>
            <div style={{ padding: '16px' }}>
              {/* Summary */}
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.65, marginBottom: 14 }}>
                {analysis.summary}
              </p>

              {/* Likelihood bars */}
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 10 }}>
                  Government Formation Likelihood
                </p>
                <LikelihoodBar label="TVK-led govt" pct={analysis.likelihood.tvk_led} color="#fbbf24" sub="Vijay as CM" />
                <LikelihoodBar label="DMK-led govt" pct={analysis.likelihood.dmk_led} color="#f87171" sub="Stalin continues" />
                <LikelihoodBar label="President's Rule" pct={analysis.likelihood.presidents_rule} color="#94a3b8" sub="If no deal" />
              </div>

              {/* Path boxes */}
              <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr', marginBottom: 14 }}>
                {[
                  { label: 'TVK path to 118', text: analysis.tvkPath, color: '#fbbf24' },
                  { label: 'DMK path to 118', text: analysis.dmkPath, color: '#f87171' },
                ].map(p => (
                  <div key={p.label} style={{
                    borderRadius: 12, padding: '12px',
                    background: `${p.color}0a`, border: `1px solid ${p.color}20`,
                  }}>
                    <p style={{ fontSize: 9, fontWeight: 700, color: p.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{p.label}</p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.55, margin: 0 }}>{p.text}</p>
                  </div>
                ))}
              </div>

              {/* Key deal */}
              <div style={{
                borderRadius: 12, padding: '12px 14px',
                background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.2)',
              }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>🔑 Key Deal to Watch</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.55, margin: 0 }}>{analysis.keyDeal}</p>
              </div>

              {analysis.scenario && (
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginTop: 12, marginBottom: 0, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: '#a78bfa', fontWeight: 700 }}>Most likely: </span>{analysis.scenario}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Live news feed ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Newspaper style={{ width: 14, height: 14, color: '#ef4444' }} />
            <span style={{ fontWeight: 900, fontSize: 15, color: '#fff' }}>Breaking News Feed</span>
            <span style={{
              fontSize: 9, fontWeight: 900, padding: '2px 7px', borderRadius: 99,
              background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.35)',
            }}>LIVE</span>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginLeft: 'auto' }}>{news.length} stories</span>
          </div>

          {news.length === 0 && (
            <div style={{
              borderRadius: 14, padding: '20px', textAlign: 'center',
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Fetching latest news…</p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {visibleNews.map((item, i) => (
              <NewsCard key={item.title.slice(0, 40)} item={item} rank={i + 1} />
            ))}
          </div>

          {news.length > 5 && (
            <button
              onClick={() => setShowAll(p => !p)}
              style={{
                width: '100%', marginTop: 10, padding: '10px',
                borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.025)',
                color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}>
              {showAllNews ? '↑ Show less' : `↓ Show ${news.length - 5} more stories`}
            </button>
          )}
        </div>

        {/* Footer */}
        <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.12)', lineHeight: 1.6, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          AI analysis is for informational purposes only. Coalition probability estimates are AI-generated based on news sentiment. NammaTamil does not endorse any party or political position. News sourced from The Hindu, NDTV, India Today, Dinamalar & others.
        </p>
      </div>
    </div>
  )
}
