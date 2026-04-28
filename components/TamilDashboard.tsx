'use client'

import { useState, useEffect } from 'react'
import { Cloud, Newspaper, Wind, Droplets, RefreshCw, ExternalLink, ChevronRight } from 'lucide-react'

interface WeatherCity {
  city: string
  temp: number | null
  feelsLike: number | null
  humidity: number | null
  wind: number | null
  condition: string
  icon: string
}

interface NewsItem {
  title: string
  link: string
  source: string
  color: string
  timeAgo: string
}

const HEAT_COLOR = (t: number | null) => {
  if (t === null) return '#94a3b8'
  if (t >= 40) return '#ef4444'
  if (t >= 36) return '#f97316'
  if (t >= 32) return '#f59e0b'
  if (t >= 28) return '#10b981'
  return '#3b82f6'
}

export default function TamilDashboard() {
  const [weather, setWeather] = useState<WeatherCity[]>([])
  const [news, setNews] = useState<NewsItem[]>([])
  const [tab, setTab] = useState<'news' | 'weather'>('news')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [updatedAt, setUpdatedAt] = useState('')

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const [wRes, nRes] = await Promise.all([
        fetch('/api/weather'),
        fetch('/api/tamil-news'),
      ])
      const wData = await wRes.json()
      const nData = await nRes.json()
      setWeather(wData.cities ?? [])
      setNews(nData.news ?? [])
      setUpdatedAt(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }))
    } catch {
      // silent
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-white font-black text-xl sm:text-2xl">தமிழ் டேஷ்போர்ட்</h2>
          <span className="text-white/30 text-xs hidden sm:inline">Tamil Dashboard</span>
        </div>
        <div className="flex items-center gap-2">
          {updatedAt && <span className="text-white/25 text-[10px] hidden sm:inline">Updated {updatedAt}</span>}
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="p-1.5 rounded-lg transition-all hover:bg-white/5"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-white/30 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1.5 mb-4">
        {[
          { id: 'news' as const,    label: 'Latest News',    icon: Newspaper },
          { id: 'weather' as const, label: 'TN Weather',     icon: Cloud     },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
            style={{
              background: tab === id ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${tab === id ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.08)'}`,
              color: tab === id ? '#f59e0b' : 'rgba(255,255,255,0.45)',
            }}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>

      {/* ── NEWS TAB ── */}
      {tab === 'news' && (
        <div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="shimmer rounded-xl h-14" />
              ))}
            </div>
          ) : news.length === 0 ? (
            <div className="text-center py-8 text-white/25 text-sm">Unable to load news right now</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {news.map((item, i) => (
                <a
                  key={i}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-track="tamil-news"
                  data-track-value={item.source}
                  className="group flex items-start gap-2.5 p-3 rounded-xl transition-all hover:scale-[1.01]"
                  style={{
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {/* Source dot */}
                  <span
                    className="mt-1 w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: item.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white/85 text-xs sm:text-sm leading-snug line-clamp-2 group-hover:text-white transition-colors">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[9px] font-bold" style={{ color: item.color }}>{item.source}</span>
                      {item.timeAgo && <span className="text-white/20 text-[9px]">· {item.timeAgo}</span>}
                    </div>
                  </div>
                  <ExternalLink className="w-3 h-3 text-white/15 group-hover:text-white/40 flex-shrink-0 mt-0.5 transition-colors" />
                </a>
              ))}
            </div>
          )}

          {/* Source legend */}
          {!loading && news.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/5">
              {[
                { name: 'Dinamalar',     color: '#dc2626' },
                { name: 'Vikatan',       color: '#f97316' },
                { name: 'OneIndia Tamil',color: '#3b82f6' },
                { name: 'The Hindu Tamil',color: '#16a34a' },
              ].map(s => (
                <span key={s.name} className="flex items-center gap-1 text-[9px] text-white/30">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                  {s.name}
                </span>
              ))}
              <span className="text-white/15 text-[9px] ml-auto">Auto-refreshes every 15 min</span>
            </div>
          )}
        </div>
      )}

      {/* ── WEATHER TAB ── */}
      {tab === 'weather' && (
        <div>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="shimmer rounded-2xl h-28" />
              ))}
            </div>
          ) : weather.length === 0 ? (
            <div className="text-center py-8 text-white/25 text-sm">Unable to load weather</div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {weather.map(city => {
                  const tc = HEAT_COLOR(city.temp)
                  return (
                    <div
                      key={city.city}
                      className="rounded-2xl p-3 flex flex-col gap-1 transition-all hover:scale-[1.02]"
                      style={{
                        background: `${tc}0d`,
                        border: `1px solid ${tc}30`,
                      }}
                    >
                      {/* Emoji + city */}
                      <div className="flex items-center justify-between">
                        <span className="text-xl leading-none">{city.icon}</span>
                        {city.temp !== null && (
                          <span className="font-black text-lg leading-none" style={{ color: tc }}>
                            {city.temp}°
                          </span>
                        )}
                      </div>
                      <p className="text-white font-bold text-xs leading-tight">{city.city}</p>
                      <p className="text-white/40 text-[9px] leading-tight">{city.condition}</p>
                      {city.humidity !== null && (
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-0.5 text-[9px] text-white/30">
                            <Droplets className="w-2.5 h-2.5" />{city.humidity}%
                          </span>
                          <span className="flex items-center gap-0.5 text-[9px] text-white/30">
                            <Wind className="w-2.5 h-2.5" />{city.wind} km/h
                          </span>
                        </div>
                      )}
                      {city.feelsLike !== null && city.feelsLike !== city.temp && (
                        <p className="text-[8px] text-white/20">Feels {city.feelsLike}°C</p>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Heat advisory */}
              {weather.some(c => (c.temp ?? 0) >= 38) && (
                <div className="mt-3 rounded-xl px-3 py-2 flex items-center gap-2"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <span className="text-lg">🌡️</span>
                  <p className="text-red-400 text-xs font-semibold">
                    Heat advisory: Some cities are above 38°C. Stay hydrated and avoid peak afternoon sun.
                  </p>
                </div>
              )}
              <p className="text-white/15 text-[9px] mt-3 text-right">Source: Open-Meteo · Refreshes every 30 min</p>
            </>
          )}
        </div>
      )}
    </section>
  )
}
