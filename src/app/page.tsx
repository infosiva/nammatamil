'use client'
import { useState, useEffect, useCallback } from 'react'

function useRateLimit(key: string, limit: number) {
  const getUsage = useCallback(() => {
    if (typeof window === 'undefined') return { count: 0, date: '' }
    try { return JSON.parse(localStorage.getItem(key) || '{"count":0,"date":""}') } catch { return { count: 0, date: '' } }
  }, [key])
  const today = new Date().toISOString().split('T')[0]
  const usage = getUsage()
  const count = usage.date === today ? usage.count : 0
  const remaining = Math.max(0, limit - count)
  const increment = useCallback(() => {
    const d = new Date().toISOString().split('T')[0]
    const u = getUsage()
    const c = u.date === d ? u.count + 1 : 1
    localStorage.setItem(key, JSON.stringify({ count: c, date: d }))
  }, [key, getUsage])
  return { remaining, increment, isLimited: remaining === 0 }
}

const INTERESTS = ['Food & Dining', 'Culture & History', 'Nature & Hiking', 'Art & Museums', 'Nightlife', 'Shopping', 'Adventure Sports', 'Photography']
const BUDGETS = ['Budget', 'Moderate', 'Luxury']
const STYLES = ['Relaxed', 'Balanced', 'Action-packed']
const TRAVEL_WITH = ['Solo', 'Couple', 'Family with Kids', 'Friends Group', 'Senior']

interface DayActivity { activity: string; location: string; duration: string; cost?: string; kids_tip?: string }
interface Day { day: number; theme: string; morning: DayActivity; afternoon: DayActivity; evening: DayActivity; tips?: string; kids_highlight?: string }
interface Itinerary { destination: string; duration: number; overview: string; budget_estimate: string; days: Day[]; practical_tips: string[]; kids_essentials?: string[] }
interface WeatherDay { date: string; maxC: number; minC: number; desc: string; icon: string }

function useWeather(destination: string, enabled: boolean) {
  const [weather, setWeather] = useState<WeatherDay[] | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(false)

  useEffect(() => {
    if (!enabled || !destination) return
    setWeatherLoading(true)
    fetch(`https://wttr.in/${encodeURIComponent(destination)}?format=j1`)
      .then(r => r.json())
      .then(data => {
        const days: WeatherDay[] = (data.weather || []).slice(0, 3).map((d: {
          date: string
          maxtempC: string
          mintempC: string
          hourly: Array<{ weatherDesc: Array<{ value: string }>; weatherIconUrl: Array<{ value: string }> }>
        }) => ({
          date: d.date,
          maxC: parseInt(d.maxtempC),
          minC: parseInt(d.mintempC),
          desc: d.hourly?.[4]?.weatherDesc?.[0]?.value || '',
          icon: d.hourly?.[4]?.weatherIconUrl?.[0]?.value || '',
        }))
        setWeather(days)
      })
      .catch(() => setWeather(null))
      .finally(() => setWeatherLoading(false))
  }, [destination, enabled])

  return { weather, weatherLoading }
}

function WeatherBar({ weather, loading }: { weather: WeatherDay[] | null; loading: boolean }) {
  if (loading) return (
    <div className="rounded-xl border border-white/8 bg-white/[0.025] px-5 py-3 flex items-center gap-3">
      <div className="w-4 h-4 border-2 border-amber-600/30 border-t-amber-500 rounded-full animate-spin" />
      <span className="text-xs text-white/40">Fetching weather...</span>
    </div>
  )
  if (!weather || weather.length === 0) return null
  return (
    <div className="rounded-xl border border-amber-700/20 bg-amber-950/20 px-5 py-4">
      <div className="text-[10px] text-white/40 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <span>🌤</span> 3-Day Weather Forecast
      </div>
      <div className="flex gap-4 flex-wrap">
        {weather.map((d, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <div>
              <div className="text-xs text-white/40 mb-0.5">{i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : 'Day 3'}</div>
              <div className="text-sm font-semibold text-white">{d.maxC}° <span className="text-white/35 font-normal">/ {d.minC}°</span></div>
              <div className="text-[10px] text-white/40 truncate max-w-[90px]">{d.desc}</div>
            </div>
            {i < weather.length - 1 && <div className="w-px h-8 bg-white/10 ml-2" />}
          </div>
        ))}
      </div>
    </div>
  )
}

function printItinerary(itinerary: Itinerary, withKids: boolean) {
  const dayHtml = itinerary.days?.map(day => `
    <div style="margin-bottom:2rem;padding:1.5rem;border:1px solid #e5e7eb;border-radius:12px;page-break-inside:avoid">
      <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1rem">
        <div style="width:2.5rem;height:2.5rem;background:#6366f1;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:1rem">${day.day}</div>
        <div>
          <div style="font-weight:700;font-size:1.1rem">${day.theme}</div>
          ${day.tips ? `<div style="color:#6b7280;font-size:0.8rem">💡 ${day.tips}</div>` : ''}
          ${withKids && day.kids_highlight ? `<div style="color:#f97316;font-size:0.8rem">🎠 ${day.kids_highlight}</div>` : ''}
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem">
        ${(['morning','afternoon','evening'] as const).map(period => {
          const act = day[period]
          if (!act) return ''
          return `<div style="padding:1rem;background:#f9fafb;border-radius:8px">
            <div style="color:#9ca3af;font-size:0.7rem;text-transform:uppercase;margin-bottom:0.5rem">${period === 'morning' ? '🌅' : period === 'afternoon' ? '☀️' : '🌙'} ${period}</div>
            <div style="font-weight:600;font-size:0.9rem;margin-bottom:0.25rem">${act.activity}</div>
            <div style="color:#6b7280;font-size:0.8rem">${act.location}</div>
            <div style="color:#9ca3af;font-size:0.75rem">${act.duration}</div>
            ${act.cost ? `<div style="color:#0ea5e9;font-size:0.75rem">${act.cost}</div>` : ''}
            ${withKids && act.kids_tip ? `<div style="color:#f97316;font-size:0.75rem;margin-top:0.25rem">🧒 ${act.kids_tip}</div>` : ''}
          </div>`
        }).join('')}
      </div>
    </div>
  `).join('')

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${itinerary.destination} Itinerary</title>
  <style>
    body{font-family:'Segoe UI',Arial,sans-serif;max-width:900px;margin:2rem auto;padding:2rem;color:#111;line-height:1.5}
    @media print{body{margin:0;padding:1rem}}
    h1{font-size:2rem;font-weight:800;margin-bottom:0.25rem}
    .badge{display:inline-block;padding:0.25rem 0.75rem;background:#ede9fe;color:#7c3aed;border-radius:999px;font-size:0.75rem;font-weight:600;margin-bottom:1rem}
    .meta{color:#6b7280;margin-bottom:2rem}
  </style>
  </head><body>
    <h1>${itinerary.destination} — ${itinerary.duration}-Day Itinerary</h1>
    ${withKids ? '<div class="badge">🧒 Family with Kids</div>' : ''}
    <p class="meta">${itinerary.overview}</p>
    <p class="meta"><strong>Budget estimate:</strong> ${itinerary.budget_estimate}</p>
    ${dayHtml}
    ${itinerary.practical_tips?.length ? `
      <div style="padding:1.5rem;background:#eef2ff;border-radius:12px;margin-top:1rem">
        <h3 style="margin:0 0 1rem;color:#4338ca">✦ Practical Tips</h3>
        <ul>${itinerary.practical_tips.map(t => `<li style="margin:0.5rem 0;color:#374151">${t}</li>`).join('')}</ul>
      </div>` : ''}
  </body></html>`

  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.print()
}

export default function Home() {
  const { remaining, increment, isLimited } = useRateLimit('wanderai-usage', 2)
  const [destination, setDestination] = useState('')
  const [duration, setDuration] = useState(5)
  const [budget, setBudget] = useState('Moderate')
  const [style, setStyle] = useState('Balanced')
  const [travelWith, setTravelWith] = useState('Solo')
  const [interests, setInterests] = useState<string[]>(['Food & Dining', 'Culture & History'])
  const [itinerary, setItinerary] = useState<Itinerary | null>(null)
  const [loading, setLoading] = useState(false)
  const [showWeather, setShowWeather] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const toggleInterest = (i: string) => setInterests(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i])
  const withKids = travelWith === 'Family with Kids'

  const { weather, weatherLoading } = useWeather(itinerary?.destination || destination, showWeather)

  async function generate() {
    if (!destination || isLimited) return
    increment()
    setLoading(true)
    setApiError(null)
    setShowWeather(true)
    try {
      const res = await fetch('/api/itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination, duration, budget: budget.toLowerCase(), travel_style: style.toLowerCase(), interests, travel_with: travelWith }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setApiError(data.error || 'Something went wrong. Please try again.')
      } else {
        setItinerary(data.itinerary)
      }
    } catch {
      setApiError('Network error. Please check your connection and try again.')
    } finally { setLoading(false) }
  }

  const inputCls = 'w-full bg-black/40 border border-amber-900/40 rounded-lg px-4 py-3 text-sm text-amber-100 placeholder-amber-900/60 focus:outline-none focus:border-amber-600/60 transition-all'

  return (
    <main className="min-h-screen relative z-10">
      {/* Travel Magazine nav */}
      <nav className="border-b border-amber-900/20 backdrop-blur-xl sticky top-0 z-50" style={{ background: 'rgba(8,6,4,0.85)' }}>
        {/* Amber accent line at top */}
        <div className="h-px bg-gradient-to-r from-transparent via-amber-600/60 to-transparent" />
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✈️</span>
            <div className="leading-tight">
              <span className="font-bold text-xl tracking-tight" style={{ color: '#fef9f0' }}>WanderAI</span>
              <span className="hidden sm:block text-xs font-normal" style={{ color: 'rgba(217,119,6,0.6)' }}>AI Travel Planner</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm">
            <a href="#how" className="transition-colors" style={{ color: 'rgba(254,243,199,0.5)' }} onMouseEnter={e => (e.currentTarget.style.color = '#fbbf24')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(254,243,199,0.5)')}>How it works</a>
            <a href="#pricing" className="transition-colors" style={{ color: 'rgba(254,243,199,0.5)' }} onMouseEnter={e => (e.currentTarget.style.color = '#fbbf24')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(254,243,199,0.5)')}>Destinations</a>
          </div>
          <div className="flex items-center gap-3">
            {withKids && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-300 text-xs font-semibold">
                🧒 Family Mode
              </div>
            )}
            {itinerary && (
              <button onClick={() => printItinerary(itinerary, withKids)}
                className="px-3 py-2 rounded-lg border border-amber-800/40 bg-amber-950/30 hover:bg-amber-950/60 text-xs font-medium text-amber-400 hover:text-amber-300 transition-all flex items-center gap-1.5">
                🖨️ Print / PDF
              </button>
            )}
            <button className="px-5 py-2 rounded-full font-semibold text-sm transition-all" style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)', color: '#080604' }}>
              Plan My Trip
            </button>
          </div>
        </div>
      </nav>

      {/* Hero — Travel Magazine style */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-950/30 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto px-6 pt-14 pb-10 relative">
          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="flex-1">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border font-semibold text-xs uppercase tracking-widest" style={{ borderColor: 'rgba(217,119,6,0.4)', background: 'rgba(120,53,15,0.25)', color: '#fbbf24' }}>
                ✈️ AI-Powered Itinerary Builder
              </div>
              {/* Headline */}
              <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-4" style={{ color: '#fef9f0', letterSpacing: '-0.02em' }}>
                Your perfect trip,<br />
                planned in{' '}
                <span style={{ background: 'linear-gradient(90deg, #d97706, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>seconds.</span>
              </h1>
              {/* Subtext */}
              <p className="text-base max-w-md leading-relaxed mb-6" style={{ color: 'rgba(251,191,36,0.6)' }}>
                Tell us where you&apos;re going. Our AI builds a day-by-day itinerary with activities, restaurants, and local tips.
              </p>
              {/* Trust pills */}
              <div className="flex flex-wrap gap-2 mb-5">
                {['☁️ Weather-aware', '🧒 Family-friendly', '🖨️ Print-ready'].map(pill => (
                  <span key={pill} className="text-xs px-3 py-1.5 rounded-full font-medium" style={{ border: '1px solid rgba(217,119,6,0.35)', color: 'rgba(251,191,36,0.75)', background: 'rgba(120,53,15,0.18)' }}>
                    {pill}
                  </span>
                ))}
              </div>
              {/* Destination stamps */}
              <div className="flex flex-wrap gap-2">
                {['🗼 Paris', '🗾 Tokyo', '🏝️ Bali', '🗽 New York', '🦁 Safari', '🏔️ Alps'].map(d => (
                  <button key={d} onClick={() => setDestination(d.split(' ').slice(1).join(' '))}
                    className="stamp text-xs text-amber-600/80 px-3 py-1.5 rounded-lg hover:border-amber-600/60 hover:text-amber-400 transition-all bg-amber-950/20">
                    {d}
                  </button>
                ))}
              </div>
            </div>
            {/* Stats sidebar */}
            <div className="hidden lg:flex flex-col gap-3 flex-shrink-0 w-44">
              {[
                { icon: '🌍', label: 'Destinations', value: '195+' },
                { icon: '📅', label: 'Max days', value: '14 days' },
                { icon: '🧒', label: 'Family mode', value: 'Built-in' },
                { icon: '🌤', label: 'Weather', value: 'Live' },
              ].map(s => (
                <div key={s.label} className="day-card rounded-lg px-3 py-2.5 flex items-center gap-2.5">
                  <span className="text-lg">{s.icon}</span>
                  <div>
                    <div className="text-[9px] text-amber-900 uppercase tracking-widest">{s.label}</div>
                    <div className="text-sm text-amber-300 font-bold">{s.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-24">
        {/* Config form */}
        <div className="day-card rounded-xl p-8 mb-8 amber-glow" style={{ boxShadow: withKids ? '0 0 40px rgba(249,115,22,0.12)' : '0 0 40px rgba(217,119,6,0.12)' }}>
          {/* Row 1: Destination + Duration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            <div className="md:col-span-2">
              <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">Where to?</label>
              <input value={destination} onChange={e => setDestination(e.target.value)} onKeyDown={e => e.key === 'Enter' && generate()} placeholder="Paris, Tokyo, Bali, New York, Queenstown..." className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">Duration — <span className="text-amber-400 font-semibold">{duration} {duration === 1 ? 'day' : 'days'}</span></label>
              <input type="range" min={1} max={14} value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-full mt-3 accent-amber-500" />
              <div className="flex justify-between text-[10px] text-white/20 mt-1">
                <span>1 day</span><span>1 week</span><span>2 weeks</span>
              </div>
            </div>
          </div>

          {/* Travelling With */}
          <div className="mb-6">
            <label className="text-xs text-white/40 uppercase tracking-wider mb-3 block">Travelling with</label>
            <div className="flex flex-wrap gap-2">
              {TRAVEL_WITH.map(tw => (
                <button key={tw} onClick={() => setTravelWith(tw)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${travelWith === tw
                    ? tw === 'Family with Kids' ? 'bg-orange-500/25 border border-orange-500/50 text-orange-300' : 'bg-amber-600/15 border border-amber-600/40 text-amber-300'
                    : 'bg-white/[0.04] border border-white/10 text-white/40 hover:text-white/70'}`}>
                  {tw === 'Family with Kids' ? '🧒 ' : tw === 'Couple' ? '💑 ' : tw === 'Solo' ? '🎒 ' : tw === 'Friends Group' ? '👥 ' : '👴 '}{tw}
                </button>
              ))}
            </div>
            {withKids && (
              <div className="mt-3 px-4 py-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-200 text-sm">
                🎠 <strong>Kids mode on!</strong> Your itinerary will include kid-friendly spots, playgrounds, child-appropriate timings, and family dining recommendations.
              </div>
            )}
          </div>

          {/* Budget + Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">Budget</label>
              <div className="flex gap-1.5">
                {BUDGETS.map(b => (
                  <button key={b} onClick={() => setBudget(b)} className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all ${budget === b ? 'bg-amber-600/15 border border-amber-600/40 text-amber-300' : 'bg-white/[0.04] border border-white/10 text-white/40 hover:text-white/70'}`}>{b}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">Travel style</label>
              <div className="flex gap-1.5">
                {STYLES.map(s => (
                  <button key={s} onClick={() => setStyle(s)} className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all ${style === s ? 'bg-amber-600/15 border border-amber-600/40 text-amber-300' : 'bg-white/[0.04] border border-white/10 text-white/40 hover:text-white/70'}`}>{s}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Interests */}
          <div className="mb-6">
            <label className="text-xs text-white/40 uppercase tracking-wider mb-3 block">Interests</label>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map(i => (
                <button key={i} onClick={() => toggleInterest(i)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${interests.includes(i) ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300' : 'bg-white/[0.04] border border-white/10 text-white/40 hover:text-white/70'}`}>{i}</button>
              ))}
            </div>
          </div>

          {isLimited ? (
            <div className="w-full py-4 rounded-xl bg-white/[0.04] border border-amber-700/30 text-center">
              <p className="text-amber-400 font-semibold text-sm mb-1">Daily limit reached (2 free / day)</p>
              <a href="#pricing" className="text-xs text-amber-600 hover:text-amber-400 underline">Upgrade for unlimited itineraries →</a>
            </div>
          ) : (
            <button onClick={generate} disabled={!destination || loading}
              className={`w-full py-4 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 flex items-center justify-center gap-2 ${withKids ? 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500' : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500'}`}>
              {loading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Crafting your itinerary...</>
                : withKids ? `🧒 Generate family itinerary ✦ (${remaining} left today)` : `Generate itinerary ✦ (${remaining} left today)`
              }
            </button>
          )}
        </div>

        {/* Error state */}
        {apiError && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center">
            <div className="text-2xl mb-3">⚠️</div>
            <p className="text-red-300 font-semibold mb-2">Could not generate itinerary</p>
            <p className="text-red-300/70 text-sm max-w-lg mx-auto">{apiError}</p>
            {apiError.includes('ANTHROPIC_API_KEY') && (
              <div className="mt-4 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white/50 text-left max-w-md mx-auto">
                <p className="font-semibold text-white/70 mb-1">How to fix:</p>
                <ol className="space-y-1 list-decimal list-inside">
                  <li>Go to vercel.com → your project → Settings → Environment Variables</li>
                  <li>Add <code className="text-cyan-400">ANTHROPIC_API_KEY</code> with your API key</li>
                  <li>Redeploy the project</li>
                </ol>
              </div>
            )}
          </div>
        )}

        {/* Result */}
        {itinerary && (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <h2 className="text-3xl font-bold">{itinerary.destination} — {itinerary.duration} Days</h2>
                  {withKids && <span className="px-2.5 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-300 text-xs font-semibold">🧒 Family Itinerary</span>}
                </div>
                <p className="text-white/50 mt-1 max-w-2xl">{itinerary.overview}</p>
              </div>
              <div className="flex gap-2 items-start flex-shrink-0">
                <div className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-sm">
                  <span className="text-white/40">Est. budget: </span>
                  <span className="text-amber-400 font-semibold">{itinerary.budget_estimate}</span>
                </div>
              </div>
            </div>

            {/* Weather */}
            <WeatherBar weather={weather} loading={weatherLoading} />

            {/* Kids essentials */}
            {withKids && itinerary.kids_essentials && itinerary.kids_essentials.length > 0 && (
              <div className="rounded-2xl border border-orange-500/25 bg-orange-500/[0.06] p-5">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-orange-300">🎒 Family Essentials</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {itinerary.kids_essentials.map((tip, i) => (
                    <div key={i} className="text-sm text-white/70 flex items-start gap-2">
                      <span className="text-orange-400 mt-0.5 flex-shrink-0">•</span>{tip}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {itinerary.days?.map(day => (
              <div key={day.day} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <div className="flex items-start justify-between gap-3 mb-5 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-700/20 text-amber-400 flex items-center justify-center font-black flex-shrink-0">{day.day}</div>
                    <div>
                      <div className="font-bold text-lg">{day.theme}</div>
                      {day.tips && <div className="text-xs text-white/40 mt-0.5">💡 {day.tips}</div>}
                    </div>
                  </div>
                  {withKids && day.kids_highlight && (
                    <div className="px-3 py-1.5 rounded-xl bg-orange-500/15 border border-orange-500/25 text-orange-200 text-xs font-medium">
                      🎠 {day.kids_highlight}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {(['morning', 'afternoon', 'evening'] as const).map(period => {
                    const act = day[period]
                    if (!act) return null
                    return (
                      <div key={period} className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
                        <div className="text-xs text-white/30 uppercase tracking-wider mb-2">{period === 'morning' ? '🌅' : period === 'afternoon' ? '☀️' : '🌙'} {period}</div>
                        <div className="font-semibold text-sm mb-1">{act.activity}</div>
                        <div className="text-xs text-white/40">{act.location}</div>
                        <div className="text-xs text-white/30 mt-1">{act.duration}</div>
                        {act.cost && <div className="text-xs text-cyan-400 mt-1">{act.cost}</div>}
                        {withKids && act.kids_tip && (
                          <div className="text-xs text-orange-300 mt-2 flex items-start gap-1">
                            <span className="flex-shrink-0">🧒</span> {act.kids_tip}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            {itinerary.practical_tips?.length > 0 && (
              <div className="rounded-2xl border border-amber-700/20 bg-amber-950/20 p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><span className="text-amber-500</span> Practical Tips</h3>
                <ul className="space-y-2">
                  {itinerary.practical_tips.map((tip, i) => (
                    <li key={i} className="text-sm text-white/70 flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5 flex-shrink-0">•</span>{tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Bottom print CTA */}
            <div className="flex justify-center pt-2">
              <button onClick={() => printItinerary(itinerary, withKids)}
                className="px-6 py-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-sm font-medium text-white/60 hover:text-white transition-all flex items-center gap-2">
                🖨️ Print or save as PDF
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pricing section */}
      <section id="pricing" className="border-t border-amber-900/20 px-6 py-20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 border border-amber-700/40 bg-amber-950/20 text-amber-600 text-xs font-bold uppercase tracking-widest rounded">✦ Pricing</div>
            <h2 className="text-4xl font-black text-amber-100 mb-2" style={{ fontFamily: 'Georgia, serif' }}>Start planning free</h2>
            <p className="text-amber-900/80 text-sm">2 free itineraries per day · No card required</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px border border-amber-900/30 rounded-2xl overflow-hidden">
            {[
              { name: 'Free', price: '$0', sub: 'forever', features: ['2 itineraries / day', 'Up to 14 days', 'Weather forecast', 'Kids family mode', 'Print to PDF', 'All destinations'], cta: 'Start free', highlight: false },
              { name: 'Pro', price: '$6', sub: '/month', features: ['Unlimited itineraries', 'Save & edit trips', 'Hotel & flight links', 'Offline PDF export', 'Custom trip notes', 'Priority AI speed'], cta: 'Go Pro →', highlight: true },
            ].map(plan => (
              <div key={plan.name} className={`p-8 ${plan.highlight ? 'bg-amber-950/30' : 'bg-black/40'}`}>
                <div className={`text-xs font-bold uppercase tracking-widest mb-1 ${plan.highlight ? 'text-amber-500' : 'text-amber-900'}`}>{plan.name}</div>
                <div className={`text-5xl font-black mb-0.5 ${plan.highlight ? 'text-amber-300' : 'text-amber-900'}`} style={{ fontFamily: 'Georgia, serif' }}>{plan.price}</div>
                <div className={`text-sm mb-6 ${plan.highlight ? 'text-amber-700' : 'text-amber-900/50'}`}>{plan.sub}</div>
                <ul className="space-y-2.5 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className={`flex items-start gap-2 text-sm ${plan.highlight ? 'text-amber-200/70' : 'text-amber-900/60'}`}>
                      <span className={plan.highlight ? 'text-amber-500 mt-0.5' : 'text-amber-900/40 mt-0.5'}>•</span> {f}
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-3 font-bold text-sm transition-all rounded-xl ${plan.highlight ? 'bg-amber-600 hover:bg-amber-500 text-black' : 'border border-amber-900/30 text-amber-900/50 cursor-default'}`}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
