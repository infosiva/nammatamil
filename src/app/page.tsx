'use client'
import { useState } from 'react'

const INTERESTS = ['Food & Dining', 'Culture & History', 'Nature & Hiking', 'Art & Museums', 'Nightlife', 'Shopping', 'Adventure Sports', 'Photography']
const BUDGETS = ['Budget', 'Moderate', 'Luxury']
const STYLES = ['Relaxed', 'Balanced', 'Action-packed']

interface DayActivity { activity: string; location: string; duration: string; cost?: string }
interface Day { day: number; theme: string; morning: DayActivity; afternoon: DayActivity; evening: DayActivity; tips?: string }
interface Itinerary { destination: string; duration: number; overview: string; budget_estimate: string; days: Day[]; practical_tips: string[] }

export default function Home() {
  const [destination, setDestination] = useState('')
  const [duration, setDuration] = useState(5)
  const [budget, setBudget] = useState('Moderate')
  const [style, setStyle] = useState('Balanced')
  const [interests, setInterests] = useState<string[]>(['Food & Dining', 'Culture & History'])
  const [itinerary, setItinerary] = useState<Itinerary | null>(null)
  const [loading, setLoading] = useState(false)

  const toggleInterest = (i: string) => setInterests(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i])

  async function generate() {
    if (!destination) return
    setLoading(true)
    try {
      const res = await fetch('/api/itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination, duration, budget: budget.toLowerCase(), travel_style: style.toLowerCase(), interests }),
      })
      const data = await res.json()
      setItinerary(data.itinerary)
    } finally { setLoading(false) }
  }

  const input = 'w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-indigo-500/50 transition-all'

  return (
    <main className="min-h-screen">
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 left-1/3 w-[500px] h-[500px] rounded-full bg-indigo-600/15 blur-[130px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-cyan-500/10 blur-[120px]" />
      </div>

      <nav className="border-b border-white/5 backdrop-blur-xl bg-white/[0.02] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center font-bold text-sm">W</div>
            <span className="font-semibold text-lg">WanderAI</span>
          </div>
          <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-sm font-medium transition-all">
            Plan free trip
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 pt-16 pb-24">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            AI-powered · Personalized · Instant
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">
            Your perfect trip,<br />
            <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">planned in seconds</span>
          </h1>
          <p className="text-white/50 text-lg">Tell us where you want to go and what you love. AI builds a detailed day-by-day itinerary tailored just for you.</p>
        </div>

        {/* Config form */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-8 mb-10" style={{ boxShadow: '0 0 40px rgba(99,102,241,0.1)' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            <div className="lg:col-span-2">
              <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">Destination</label>
              <input value={destination} onChange={e => setDestination(e.target.value)} placeholder="Paris, Tokyo, Bali, New York..." className={input} />
            </div>
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">Duration — {duration} days</label>
              <input type="range" min={1} max={14} value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-full mt-3 accent-indigo-500" />
            </div>
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">Budget</label>
              <div className="flex gap-1.5 mt-1">
                {BUDGETS.map(b => (
                  <button key={b} onClick={() => setBudget(b)} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${budget === b ? 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-300' : 'bg-white/[0.04] border border-white/10 text-white/40 hover:text-white/70'}`}>{b}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="text-xs text-white/40 uppercase tracking-wider mb-3 block">Interests</label>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map(i => (
                <button key={i} onClick={() => toggleInterest(i)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${interests.includes(i) ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300' : 'bg-white/[0.04] border border-white/10 text-white/40 hover:text-white/70'}`}>{i}</button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">Travel style</label>
              <div className="flex gap-1.5">
                {STYLES.map(s => (
                  <button key={s} onClick={() => setStyle(s)} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${style === s ? 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-300' : 'bg-white/[0.04] border border-white/10 text-white/40 hover:text-white/70'}`}>{s}</button>
                ))}
              </div>
            </div>
            <button onClick={generate} disabled={!destination || loading}
              className="sm:w-64 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 font-semibold text-sm transition-all disabled:opacity-40 flex items-center justify-center gap-2">
              {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Planning...</> : 'Generate itinerary ✦'}
            </button>
          </div>
        </div>

        {/* Result */}
        {itinerary && (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-3xl font-bold">{itinerary.destination} — {itinerary.duration} Days</h2>
                <p className="text-white/50 mt-1">{itinerary.overview}</p>
              </div>
              <div className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-sm">
                <span className="text-white/40">Est. budget: </span>
                <span className="text-indigo-300 font-semibold">{itinerary.budget_estimate}</span>
              </div>
            </div>

            {itinerary.days?.map(day => (
              <div key={day.day} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-black">{day.day}</div>
                  <div>
                    <div className="font-bold text-lg">{day.theme}</div>
                    {day.tips && <div className="text-xs text-white/40 mt-0.5">💡 {day.tips}</div>}
                  </div>
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
          </div>
        )}
      </div>
    </main>
  )
}
