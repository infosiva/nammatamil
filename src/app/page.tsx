'use client'
import { useState, useEffect } from 'react'

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
      <div className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
      <span className="text-xs text-white/40">Fetching weather...</span>
    </div>
  )
  if (!weather || weather.length === 0) return null
  return (
    <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/[0.04] px-5 py-4">
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
  const [destination, setDestination] = useState('')
  const [duration, setDuration] = useState(5)
  const [budget, setBudget] = useState('Moderate')
  const [style, setStyle] = useState('Balanced')
  const [travelWith, setTravelWith] = useState('Solo')
  const [interests, setInterests] = useState<string[]>(['Food & Dining', 'Culture & History'])
  const [itinerary, setItinerary] = useState<Itinerary | null>(null)
  const [loading, setLoading] = useState(false)
  const [showWeather, setShowWeather] = useState(false)

  const toggleInterest = (i: string) => setInterests(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i])
  const withKids = travelWith === 'Family with Kids'

  const { weather, weatherLoading } = useWeather(itinerary?.destination || destination, showWeather)

  async function generate() {
    if (!destination) return
    setLoading(true)
    setShowWeather(true)
    try {
      const res = await fetch('/api/itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination, duration, budget: budget.toLowerCase(), travel_style: style.toLowerCase(), interests, travel_with: travelWith }),
      })
      const data = await res.json()
      setItinerary(data.itinerary)
    } finally { setLoading(false) }
  }

  const inputCls = 'w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-indigo-500/50 transition-all'

  return (
    <main className="min-h-screen bg-[#09090f] text-white">
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 left-1/3 w-[500px] h-[500px] rounded-full bg-indigo-600/15 blur-[130px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-cyan-500/10 blur-[120px]" />
        {withKids && <div className="absolute top-1/2 left-0 w-[300px] h-[300px] rounded-full bg-orange-500/8 blur-[100px]" />}
      </div>

      <nav className="border-b border-white/5 backdrop-blur-xl bg-white/[0.02] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center font-bold text-sm">W</div>
            <span className="font-semibold text-lg">WanderAI</span>
          </div>
          <div className="flex items-center gap-3">
            {withKids && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-300 text-xs font-medium">
                <span>🧒</span> Kids Mode
              </div>
            )}
            {itinerary && (
              <button onClick={() => printItinerary(itinerary, withKids)}
                className="px-3 py-2 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-white/60 hover:text-white transition-all flex items-center gap-1.5">
                🖨️ Print / PDF
              </button>
            )}
            <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-sm font-medium transition-all">
              Plan free trip
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 pt-16 pb-24">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            AI-powered · Weather-aware · Kids-friendly · Printable
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">
            Your perfect trip,<br />
            <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">planned in seconds</span>
          </h1>
          <p className="text-white/50 text-lg">Tell us where you&apos;re going and who you&apos;re travelling with. AI builds a detailed day-by-day itinerary tailored just for you.</p>
        </div>

        {/* Config form */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-8 mb-10" style={{ boxShadow: withKids ? '0 0 40px rgba(249,115,22,0.1)' : '0 0 40px rgba(99,102,241,0.1)' }}>
          {/* Row 1: Destination + Duration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            <div className="md:col-span-2">
              <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">Where to?</label>
              <input value={destination} onChange={e => setDestination(e.target.value)} onKeyDown={e => e.key === 'Enter' && generate()} placeholder="Paris, Tokyo, Bali, New York, Queenstown..." className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">Duration — <span className="text-indigo-300 font-semibold">{duration} {duration === 1 ? 'day' : 'days'}</span></label>
              <input type="range" min={1} max={14} value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-full mt-3 accent-indigo-500" />
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
                    ? tw === 'Family with Kids' ? 'bg-orange-500/25 border border-orange-500/50 text-orange-300' : 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-300'
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
                  <button key={b} onClick={() => setBudget(b)} className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all ${budget === b ? 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-300' : 'bg-white/[0.04] border border-white/10 text-white/40 hover:text-white/70'}`}>{b}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">Travel style</label>
              <div className="flex gap-1.5">
                {STYLES.map(s => (
                  <button key={s} onClick={() => setStyle(s)} className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all ${style === s ? 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-300' : 'bg-white/[0.04] border border-white/10 text-white/40 hover:text-white/70'}`}>{s}</button>
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

          <button onClick={generate} disabled={!destination || loading}
            className={`w-full py-4 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 flex items-center justify-center gap-2 ${withKids ? 'bg-gradient-to-r from-orange-500 to-indigo-600 hover:from-orange-400 hover:to-indigo-500' : 'bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500'}`}>
            {loading
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Crafting your itinerary...</>
              : withKids ? '🧒 Generate family-friendly itinerary ✦' : 'Generate itinerary ✦'
            }
          </button>
        </div>

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
                  <span className="text-indigo-300 font-semibold">{itinerary.budget_estimate}</span>
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
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-black flex-shrink-0">{day.day}</div>
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
              <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.05] p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><span className="text-indigo-400">✦</span> Practical Tips</h3>
                <ul className="space-y-2">
                  {itinerary.practical_tips.map((tip, i) => (
                    <li key={i} className="text-sm text-white/70 flex items-start gap-2">
                      <span className="text-indigo-400 mt-0.5 flex-shrink-0">•</span>{tip}
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
    </main>
  )
}
