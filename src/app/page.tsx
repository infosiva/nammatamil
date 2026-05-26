'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import ShareCard from '@/components/ShareCard'
import GuidedTour, { type TourStep } from '@/components/GuidedTour'
import { useGate } from '@/lib/shared/useGate'

const TRAVEL_TOUR: TourStep[] = [
  { target: '#planner', title: 'Plan any trip free', icon: '✈️', body: 'Type your destination, dates and interests — AI builds a full day-by-day itinerary in seconds.', placement: 'top' },
  { target: '#pricing', title: 'Unlock unlimited trips', icon: '🗺️', body: 'Pro removes all daily limits — plan as many itineraries as you want.', placement: 'top' },
]
import RegisterGate from '@/lib/shared/RegisterGate'
import { Spotlight } from '@/components/aceternity/spotlight'
import { CardContainer, CardBody, CardItem } from '@/components/aceternity/card-3d'

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
    <div className="roam-card rounded-2xl px-5 py-3 flex items-center gap-3">
      <div className="w-4 h-4 border-2 border-orange-600/30 border-t-orange-400 rounded-full animate-spin" />
      <span className="text-xs text-white/40">Fetching weather...</span>
    </div>
  )
  if (!weather || weather.length === 0) return null
  return (
    <div className="roam-card rounded-2xl px-5 py-4">
      <div className="text-[10px] text-orange-300/60 uppercase tracking-wider mb-3 flex items-center gap-1.5 font-semibold">
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
        <div style="width:2.5rem;height:2.5rem;background:linear-gradient(135deg,#f97316,#d97706);border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:1rem">${day.day}</div>
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
          return `<div style="padding:1rem;background:#fff7ed;border-radius:8px">
            <div style="color:#9ca3af;font-size:0.7rem;text-transform:uppercase;margin-bottom:0.5rem">${period === 'morning' ? '🌅' : period === 'afternoon' ? '☀️' : '🌙'} ${period}</div>
            <div style="font-weight:600;font-size:0.9rem;margin-bottom:0.25rem">${act.activity}</div>
            <div style="color:#6b7280;font-size:0.8rem">${act.location}</div>
            <div style="color:#9ca3af;font-size:0.75rem">${act.duration}</div>
            ${act.cost ? `<div style="color:#f97316;font-size:0.75rem">${act.cost}</div>` : ''}
            ${withKids && act.kids_tip ? `<div style="color:#f97316;font-size:0.75rem;margin-top:0.25rem">🧒 ${act.kids_tip}</div>` : ''}
          </div>`
        }).join('')}
      </div>
    </div>
  `).join('')

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${itinerary.destination} Itinerary — RoamPlan</title>
  <style>
    body{font-family:'Georgia',serif;max-width:900px;margin:2rem auto;padding:2rem;color:#111;line-height:1.5}
    @media print{body{margin:0;padding:1rem}}
    h1{font-size:2rem;font-weight:800;margin-bottom:0.25rem;font-family:'Georgia',serif}
    .badge{display:inline-block;padding:0.25rem 0.75rem;background:#fff7ed;color:#c2410c;border-radius:999px;font-size:0.75rem;font-weight:600;margin-bottom:1rem}
    .meta{color:#6b7280;margin-bottom:2rem}
    .logo{font-size:0.75rem;color:#9ca3af;margin-bottom:1.5rem}
  </style>
  </head><body>
    <div class="logo">✈️ RoamPlan · roamplan.app</div>
    <h1>${itinerary.destination} — ${itinerary.duration}-Day Itinerary</h1>
    ${withKids ? '<div class="badge">🧒 Family with Kids</div>' : ''}
    <p class="meta">${itinerary.overview}</p>
    <p class="meta"><strong>Budget estimate:</strong> ${itinerary.budget_estimate}</p>
    ${dayHtml}
    ${itinerary.practical_tips?.length ? `
      <div style="padding:1.5rem;background:#fff7ed;border-radius:12px;margin-top:1rem">
        <h3 style="margin:0 0 1rem;color:#c2410c">✦ Practical Tips</h3>
        <ul>${itinerary.practical_tips.map(t => `<li style="margin:0.5rem 0;color:#374151">${t}</li>`).join('')}</ul>
      </div>` : ''}
  </body></html>`

  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.print()
}

const DESTINATION_CARDS = [
  { city: 'Bali',      emoji: '🌴', tag: 'Tropical',  gradient: 'from-[#0c4a6e] via-[#0e7490] to-[#ea580c]' },
  { city: 'Paris',     emoji: '🗼', tag: 'Romance',   gradient: 'from-[#7c2d12] via-[#c2410c] to-[#b45309]' },
  { city: 'Tokyo',     emoji: '⛩️',  tag: 'Culture',   gradient: 'from-[#831843] via-[#be185d] to-[#c2410c]' },
  { city: 'New York',  emoji: '🗽', tag: 'Urban',     gradient: 'from-[#0c4a6e] via-[#1e40af] to-[#ea580c]' },
  { city: 'Santorini', emoji: '🏛️', tag: 'Scenic',    gradient: 'from-[#1e3a5f] via-[#0369a1] to-[#f97316]' },
]

const WHY_PRO = [
  { icon: '∞', title: 'Unlimited trips', desc: 'Generate as many itineraries as you want, any day.' },
  { icon: '🗺️', title: 'Multi-city routing', desc: 'Plan complex trips spanning multiple cities seamlessly.' },
  { icon: '🏨', title: 'Hotel recommendations', desc: 'Curated stays matched to your budget and style.' },
  { icon: '📄', title: 'Offline PDF export', desc: 'Download your full itinerary — no internet needed.' },
]

const TRUST = [
  { stat: '1,000+', label: 'Travelers planned with RoamPlan' },
  { stat: '195+',   label: 'Destinations covered worldwide' },
  { stat: '60s',    label: 'Average time to full itinerary' },
]

const SAMPLE_DAYS = [
  { day: 1, theme: 'Arrival & Old Town Wander', morning: 'Airport pickup → Hotel check-in', afternoon: 'Wander the old medina & local souks', evening: 'Rooftop dinner with panoramic views' },
  { day: 2, theme: 'Temples, Markets & Street Food', morning: 'Sacred temple tour at sunrise', afternoon: 'Street food crawl with local guide', evening: 'Traditional cooking class dinner' },
  { day: 3, theme: 'Nature & Hidden Gems', morning: 'Hike to waterfall viewpoint', afternoon: 'Secret lagoon swim & kayaking', evening: 'Beachside sunset cocktails' },
]

export default function Home() {
  const { count: gateCount, showGate, increment: gateIncrement, onRegistered, dismissGate, isRegistered } = useGate('wanderai', 2)
  const remaining = Math.max(0, 2 - gateCount)
  const isLimited = !isRegistered && gateCount >= 2
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
  const [isPro, setIsPro] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Check Pro status + ?upgraded=1 param
  useEffect(() => {
    const stored = localStorage.getItem('roamplan-pro')
    if (stored) setIsPro(true)
    const params = new URLSearchParams(window.location.search)
    if (params.get('upgraded') === '1') {
      localStorage.setItem('roamplan-pro', '1')
      setIsPro(true)
      window.history.replaceState({}, '', '/')
    }
  }, [])

  async function handleUpgrade() {
    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      alert('Could not start checkout. Please try again.')
    } finally {
      setCheckoutLoading(false)
    }
  }

  const toggleInterest = (i: string) => setInterests(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i])
  const withKids = travelWith === 'Family with Kids'

  const { weather, weatherLoading } = useWeather(itinerary?.destination || destination, showWeather)

  async function generate() {
    if (!destination) return
    const allowed = await gateIncrement()
    if (!allowed) return
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
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
      }
    } catch {
      setApiError('Network error. Please check your connection and try again.')
    } finally { setLoading(false) }
  }

  const inputCls = 'w-full bg-white/[0.06] border border-orange-900/30 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.09] transition-all'

  return (
    <>
    {showGate && (
      <RegisterGate
        freeUsed={gateCount}
        freeLimit={2}
        freeFeature="itineraries"
        lockedFeature="unlimited itineraries"
        accentColor="#f97316"
        site="wanderai"
        onSuccess={onRegistered}
        onDismiss={dismissGate}
      />
    )}

    {/* Pro upgrade success banner */}
    {isPro && (
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-500 text-white font-bold text-sm shadow-[0_8px_30px_rgba(249,115,22,0.50)] flex items-center gap-3 fade-up">
        <span>✈️</span> RoamPlan Pro unlocked — unlimited adventures ahead!
        <button onClick={() => setIsPro(false)} className="ml-2 opacity-60 hover:opacity-100 text-xs">✕</button>
      </div>
    )}

    <main className="min-h-screen relative z-10">

      {/* ── HERO — Travel Magazine ─────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="#06b6d4" />

        {/* Animated warm ocean-to-coral gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0c2340] via-[#0c4a6e] to-[#1a1a2e]" />

        {/* Sunset glow orbs */}
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full opacity-25"
          style={{ background: 'radial-gradient(circle, #0ea5e9 0%, transparent 70%)', filter: 'blur(80px)', animation: 'orbDrift 14s ease-in-out infinite alternate' }} />
        <div className="absolute top-[10%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #f97316 0%, #fb923c 40%, transparent 70%)', filter: 'blur(80px)', animation: 'orbDrift 18s ease-in-out infinite alternate', animationDelay: '-6s' }} />
        <div className="absolute bottom-[-5%] left-[20%] w-[400px] h-[400px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)', filter: 'blur(70px)', animation: 'orbDrift 22s ease-in-out infinite alternate', animationDelay: '-10s' }} />

        {/* Floating destination silhouettes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute bottom-0 left-0 right-0 h-48 opacity-10"
            style={{ background: 'linear-gradient(to top, rgba(249,115,22,0.3) 0%, transparent 100%)' }} />
          {/* Decorative horizon line */}
          <div className="absolute bottom-32 left-0 right-0 h-px opacity-20"
            style={{ background: 'linear-gradient(90deg, transparent, #f97316 20%, #fb923c 50%, #f97316 80%, transparent)' }} />
        </div>

        {/* Depth grid */}
        <div className="depth-grid absolute inset-0 opacity-30" />

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Editorial badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-orange-500/40 bg-orange-900/25 backdrop-blur-sm text-orange-300 text-xs font-bold uppercase tracking-widest fade-up">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
            AI-Powered Travel Planning · Free
          </div>

          {/* Big editorial headline */}
          <h1 className="text-5xl md:text-4xl md:text-5xl lg:text-[88px] font-black leading-[1.0] mb-6 text-white tracking-tight fade-up delay-100"
            style={{ fontFamily: "'Georgia', 'Times New Roman', serif", letterSpacing: '-0.03em', textShadow: '0 2px 40px rgba(0,0,0,0.5)' }}>
            Plan your<br />
            <span style={{
              background: 'linear-gradient(135deg, #fb923c 0%, #f97316 30%, #fbbf24 60%, #f59e0b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>dream trip</span><br />
            in seconds.
          </h1>

          <p className="text-lg md:text-xl text-white/60 max-w-xl mx-auto mb-10 leading-relaxed fade-up delay-200">
            Tell AI where you want to go. Get a full day-by-day itinerary with hotels, restaurants, weather and hidden gems — free.
          </p>

          {/* Hero search bar — editorial card style */}
          <div className="max-w-2xl mx-auto mb-6 fade-up delay-300"
            style={{
              background: 'rgba(255,255,255,0.07)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(249,115,22,0.25)',
              borderRadius: '1rem',
              boxShadow: '0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}>
            <div className="flex gap-2 p-2">
              <div className="flex items-center flex-1 gap-3 px-3">
                <span className="text-orange-400/80 text-lg">✈️</span>
                <input
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (generate(), formRef.current?.scrollIntoView({ behavior: 'smooth' }))}
                  placeholder="Where do you want to go? Paris, Bali, Tokyo…"
                  className="flex-1 bg-transparent py-3 text-sm text-white placeholder-white/35 focus:outline-none"
                />
              </div>
              <button
                onClick={() => { generate(); formRef.current?.scrollIntoView({ behavior: 'smooth' }) }}
                disabled={!destination}
                className="px-6 py-3 rounded-xl text-sm font-bold flex-shrink-0 disabled:opacity-40 text-white transition-all hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, #f97316, #d97706)', boxShadow: '0 4px 20px rgba(249,115,22,0.4)' }}>
                Plan my trip →
              </button>
            </div>
          </div>

          {/* Trust signals row */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-white/40 fade-up delay-400">
            {TRUST.map((t, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <span className="font-bold text-orange-400">{t.stat}</span>
                {t.label}
                {i < TRUST.length - 1 && <span className="ml-4 hidden sm:inline text-white/20">·</span>}
              </span>
            ))}
          </div>
        </div>

        {/* Down arrow */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-white/30">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
        </div>
      </section>

      {/* ── DESTINATION CARDS — 5 cards with travel magazine feel ──────── */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-400/60 text-center mb-6">Popular destinations</div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
          {DESTINATION_CARDS.map(card => (
            <CardContainer key={card.city} containerClassName="w-full">
              <CardBody className="w-full">
                <CardItem translateZ={40} className="w-full">
                  <button
                    onClick={() => setDestination(card.city)}
                    className={`group relative overflow-hidden rounded-2xl aspect-[3/4] md:aspect-[2/3] bg-gradient-to-br ${card.gradient} transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-full`}
                    style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                    {/* Texture overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    {/* Glow on hover */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: 'radial-gradient(circle at 50% 80%, rgba(249,115,22,0.25) 0%, transparent 70%)' }} />
                    <div className="relative z-10 flex flex-col items-center justify-end h-full pb-5 gap-1.5">
                      <CardItem translateZ={60} className="text-4xl md:text-5xl drop-shadow-lg mb-1 group-hover:scale-110 transition-transform duration-300">
                        {card.emoji}
                      </CardItem>
                      <CardItem translateZ={50} className="font-black text-base md:text-lg text-white tracking-tight" style={{ fontFamily: "'Georgia', serif", textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                        {card.city}
                      </CardItem>
                      <CardItem translateZ={40} className="px-2.5 py-0.5 rounded-full text-white/70 text-[10px] font-semibold uppercase tracking-wider" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}>
                        {card.tag}
                      </CardItem>
                    </div>
                    {/* Hover CTA */}
                    <div className="absolute inset-x-0 bottom-0 py-2 flex justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0"
                      style={{ background: 'linear-gradient(to top, rgba(249,115,22,0.6), transparent)' }}>
                      <span className="text-[11px] text-orange-200 font-bold">Plan this trip →</span>
                    </div>
                  </button>
                </CardItem>
              </CardBody>
            </CardContainer>
          ))}
        </div>
      </section>

      {/* ── SAMPLE ITINERARY MOCKUP — editorial teaser ─────────────────── */}
      <section className="px-6 pb-16 max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-400/60 mb-3">What you get</div>
          <h2 className="text-3xl md:text-4xl font-black text-white" style={{ fontFamily: "'Georgia', serif" }}>
            A full day-by-day itinerary, instantly.
          </h2>
        </div>
        <div className="rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(249,115,22,0.15)',
            backdropFilter: 'blur(20px)',
          }}>
          {/* Mock header */}
          <div className="px-6 py-5 flex items-center justify-between"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(249,115,22,0.05)' }}>
            <div>
              <h3 className="text-2xl font-black text-white" style={{ fontFamily: "'Georgia', serif" }}>Bali, Indonesia</h3>
              <p className="text-white/40 text-sm mt-0.5">7-day itinerary · Moderate budget · Culture & Food focus</p>
            </div>
            <div className="px-3 py-1.5 rounded-xl text-sm font-semibold text-amber-400"
              style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)' }}>
              Est. $1,200–$1,800
            </div>
          </div>
          {/* Mock days */}
          <div className="divide-y divide-white/[0.04]">
            {SAMPLE_DAYS.map((day, i) => (
              <div key={i} className="px-6 py-5 flex gap-5 items-start hover:bg-white/[0.02] transition-colors">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-sm flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #f97316, #d97706)' }}>{day.day}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white text-sm mb-2" style={{ fontFamily: "'Georgia', serif" }}>{day.theme}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { label: '🌅 Morning', text: day.morning },
                      { label: '☀️ Afternoon', text: day.afternoon },
                      { label: '🌙 Evening', text: day.evening },
                    ].map((period, j) => (
                      <div key={j} className="rounded-lg px-3 py-2.5"
                        style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.12)' }}>
                        <div className="text-[10px] text-orange-300/50 uppercase tracking-wider mb-1">{period.label}</div>
                        <div className="text-xs text-white/70 leading-relaxed">{period.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Fade + CTA */}
          <div className="relative px-6 py-8 text-center"
            style={{ background: 'linear-gradient(to bottom, rgba(12,36,64,0.0) 0%, rgba(12,36,64,0.95) 100%)' }}>
            <p className="text-white/50 text-sm mb-4">+ 4 more days generated for your trip…</p>
            <button
              onClick={() => { setDestination('Bali'); formRef.current?.scrollIntoView({ behavior: 'smooth' }) }}
              className="px-6 py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-[1.03]"
              style={{ background: 'linear-gradient(135deg, #f97316, #d97706)', boxShadow: '0 8px 30px rgba(249,115,22,0.35)' }}>
              Generate your own free itinerary →
            </button>
          </div>
        </div>
      </section>

      {/* ── PLANNER FORM ───────────────────────────────────────────────── */}
      <div ref={formRef} id="planner" className="max-w-2xl mx-auto px-6 pb-14">
        <div className="rounded-2xl p-8"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(249,115,22,0.18)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-black"
              style={{ background: 'linear-gradient(135deg, #f97316, #d97706)' }}>✈</div>
            <h2 className="text-xl font-black text-white tracking-tight" style={{ fontFamily: "'Georgia', serif" }}>Customise your trip</h2>
          </div>

          {/* Destination + Duration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            <div className="md:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-2 block">Where to?</label>
              <input value={destination} onChange={e => setDestination(e.target.value)} onKeyDown={e => e.key === 'Enter' && generate()} placeholder="Paris, Tokyo, Bali, New York…" className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-2 block">Duration — <span className="text-orange-400 font-semibold normal-case">{duration} {duration === 1 ? 'day' : 'days'}</span></label>
              <input type="range" min={1} max={14} value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-full mt-3 accent-orange-500" />
              <div className="flex justify-between text-[10px] text-white/20 mt-1">
                <span>1 day</span><span>1 week</span><span>2 weeks</span>
              </div>
            </div>
          </div>

          {/* Travelling With */}
          <div className="mb-6">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-3 block">Travelling with</label>
            <div className="flex flex-wrap gap-2">
              {TRAVEL_WITH.map(tw => (
                <button key={tw} onClick={() => setTravelWith(tw)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${travelWith === tw
                    ? tw === 'Family with Kids' ? 'bg-orange-500/25 border border-orange-500/50 text-orange-300' : 'bg-amber-600/20 border border-amber-600/40 text-amber-300'
                    : 'bg-white/[0.04] border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20'}`}>
                  {tw === 'Family with Kids' ? '🧒 ' : tw === 'Couple' ? '💑 ' : tw === 'Solo' ? '🎒 ' : tw === 'Friends Group' ? '👥 ' : '👴 '}{tw}
                </button>
              ))}
            </div>
            {withKids && (
              <div className="mt-3 px-4 py-3 rounded-xl text-orange-200 text-sm"
                style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>
                🎠 <strong>Kids mode on!</strong> Your itinerary will include kid-friendly spots, playgrounds, child-appropriate timings, and family dining recommendations.
              </div>
            )}
          </div>

          {/* Budget + Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-2 block">Budget</label>
              <div className="flex gap-1.5">
                {BUDGETS.map(b => (
                  <button key={b} onClick={() => setBudget(b)} className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all ${budget === b ? 'bg-amber-700/20 border border-amber-600/40 text-amber-300' : 'bg-white/[0.04] border border-white/10 text-white/40 hover:text-white/70'}`}>{b}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-2 block">Travel style</label>
              <div className="flex gap-1.5">
                {STYLES.map(s => (
                  <button key={s} onClick={() => setStyle(s)} className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all ${style === s ? 'bg-teal-700/20 border border-teal-600/40 text-teal-300' : 'bg-white/[0.04] border border-white/10 text-white/40 hover:text-white/70'}`}>{s}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Interests */}
          <div className="mb-6">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-3 block">Your interests</label>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map(i => (
                <button key={i} onClick={() => toggleInterest(i)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${interests.includes(i) ? 'bg-teal-500/20 border border-teal-500/40 text-teal-300' : 'bg-white/[0.04] border border-white/10 text-white/40 hover:text-white/70'}`}>{i}</button>
              ))}
            </div>
          </div>

          {isLimited ? (
            <div className="w-full py-4 rounded-xl text-center"
              style={{ background: 'rgba(124,45,2,0.2)', border: '1px solid rgba(180,83,9,0.3)' }}>
              <p className="text-orange-400 font-semibold text-sm mb-1">Daily limit reached (2 free / day)</p>
              <a href="#pricing" className="text-xs text-orange-600 hover:text-orange-400 underline">Upgrade to Pro for unlimited itineraries →</a>
            </div>
          ) : (
            <button onClick={generate} disabled={!destination || loading}
              className={`w-full py-4 rounded-xl font-bold text-sm transition-all disabled:opacity-40 flex items-center justify-center gap-2 text-white`}
              style={{
                background: withKids
                  ? 'linear-gradient(135deg, #f97316, #f59e0b)'
                  : 'linear-gradient(135deg, #f97316, #e11d48)',
                boxShadow: '0 8px 30px rgba(249,115,22,0.35)',
              }}>
              {loading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Crafting your itinerary...</>
                : withKids ? `🧒 Generate family itinerary ✦ (${remaining} free left)` : `✈️ Generate itinerary ✦ (${remaining} free left)`
              }
            </button>
          )}
        </div>
      </div>

      {/* ── RESULTS ────────────────────────────────────────────────────── */}
      <div ref={resultsRef} className="max-w-4xl mx-auto px-6 pb-12">
        {apiError && (
          <div className="rounded-2xl border border-red-500/30 p-6 text-center mb-8"
            style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)' }}>
            <div className="text-2xl mb-3">⚠️</div>
            <p className="text-red-300 font-semibold mb-2">Could not generate itinerary</p>
            <p className="text-red-300/70 text-sm max-w-lg mx-auto">{apiError}</p>
          </div>
        )}

        {itinerary && (
          <div className="space-y-5">
            {/* Itinerary header */}
            <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(249,115,22,0.15)', backdropFilter: 'blur(20px)' }}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h2 className="text-3xl font-black text-white tracking-tight" style={{ fontFamily: "'Georgia', serif" }}>{itinerary.destination}</h2>
                    <span className="px-3 py-1 rounded-full text-orange-300 text-xs font-bold uppercase tracking-wider"
                      style={{ background: 'rgba(124,45,2,0.4)', border: '1px solid rgba(180,83,9,0.4)' }}>{itinerary.duration} Days</span>
                    {withKids && <span className="px-2.5 py-1 rounded-full text-orange-300 text-xs font-semibold"
                      style={{ background: 'rgba(249,115,22,0.2)', border: '1px solid rgba(249,115,22,0.3)' }}>🧒 Family</span>}
                  </div>
                  <p className="text-white/50 text-sm max-w-2xl leading-relaxed">{itinerary.overview}</p>
                </div>
                <div className="flex gap-2 items-start flex-shrink-0 flex-wrap">
                  <div className="px-4 py-2 rounded-xl text-sm"
                    style={{ background: 'rgba(120,53,15,0.3)', border: '1px solid rgba(180,83,9,0.3)' }}>
                    <span className="text-white/40 text-xs">Est. budget </span>
                    <span className="text-amber-400 font-bold">{itinerary.budget_estimate}</span>
                  </div>
                  <button onClick={() => printItinerary(itinerary, withKids)}
                    className="px-3 py-2 rounded-xl text-xs font-medium text-white/60 hover:text-white transition-all flex items-center gap-1.5"
                    style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)' }}>
                    🖨️ Print
                  </button>
                  <button onClick={() => { setItinerary(null); setApiError(null); setShowWeather(false); formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}
                    className="px-3 py-2 rounded-xl text-xs font-medium text-orange-300/80 hover:text-orange-300 transition-all flex items-center gap-1.5"
                    style={{ border: '1px solid rgba(249,115,22,0.25)', background: 'rgba(249,115,22,0.08)' }}>
                    ✈️ Plan another trip
                  </button>
                </div>
              </div>
            </div>

            {/* Weather */}
            <WeatherBar weather={weather} loading={weatherLoading} />

            {/* Kids essentials */}
            {withKids && itinerary.kids_essentials && itinerary.kids_essentials.length > 0 && (
              <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(249,115,22,0.25)', backdropFilter: 'blur(20px)' }}>
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

            {/* Day cards */}
            {itinerary.days?.map(day => (
              <div key={day.day} className="reveal-3d rounded-2xl p-6"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(249,115,22,0.12)', backdropFilter: 'blur(20px)' }}>
                <div className="flex items-start justify-between gap-3 mb-5 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black flex-shrink-0 text-white text-sm"
                      style={{ background: 'linear-gradient(135deg, #f97316, #d97706)' }}>{day.day}</div>
                    <div>
                      <div className="font-bold text-lg text-white" style={{ fontFamily: "'Georgia', serif" }}>{day.theme}</div>
                      {day.tips && <div className="text-xs text-white/40 mt-0.5">💡 {day.tips}</div>}
                    </div>
                  </div>
                  {withKids && day.kids_highlight && (
                    <div className="px-3 py-1.5 rounded-xl text-orange-200 text-xs font-medium"
                      style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.25)' }}>
                      🎠 {day.kids_highlight}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {(['morning', 'afternoon', 'evening'] as const).map(period => {
                    const act = day[period]
                    if (!act) return null
                    return (
                      <div key={period} className="rounded-xl p-4 hover:border-orange-700/30 transition-colors"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(124,45,2,0.2)' }}>
                        <div className="text-xs text-orange-300/50 uppercase tracking-wider mb-2 font-semibold">{period === 'morning' ? '🌅' : period === 'afternoon' ? '☀️' : '🌙'} {period}</div>
                        <div className="font-semibold text-sm mb-1 text-white">{act.activity}</div>
                        <div className="text-xs text-white/40">{act.location}</div>
                        <div className="text-xs text-white/30 mt-1">{act.duration}</div>
                        {act.cost && <div className="text-xs text-teal-400 mt-1">{act.cost}</div>}
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

            {/* Practical tips */}
            {itinerary.practical_tips?.length > 0 && (
              <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(249,115,22,0.12)', backdropFilter: 'blur(20px)' }}>
                <h3 className="font-semibold mb-4 flex items-center gap-2 text-amber-300">✦ Practical Tips</h3>
                <ul className="space-y-2">
                  {itinerary.practical_tips.map((tip, i) => (
                    <li key={i} className="text-sm text-white/70 flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5 flex-shrink-0">•</span>{tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              {/* Save trip */}
              <button onClick={() => {
                try {
                  const saved = JSON.parse(localStorage.getItem('roamplan-saved') ?? '[]')
                  const exists = saved.find((s: {destination: string; duration: number}) => s.destination === itinerary.destination && s.duration === itinerary.duration)
                  if (!exists) {
                    saved.unshift({ ...itinerary, savedAt: new Date().toISOString() })
                    localStorage.setItem('roamplan-saved', JSON.stringify(saved.slice(0, 10)))
                    alert('✅ Trip saved! Access it anytime from this device.')
                  } else {
                    alert('Trip already saved!')
                  }
                } catch { alert('Could not save trip.') }
              }}
                className="px-6 py-3 rounded-xl text-sm font-medium text-white/60 hover:text-white transition-all flex items-center gap-2"
                style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
                🔖 Save Trip
              </button>
              {/* WhatsApp share */}
              <a href={`https://wa.me/?text=${encodeURIComponent(`✈️ My ${itinerary.destination} trip plan (${itinerary.duration} days)\n💰 ${itinerary.budget_estimate}\n\n${(itinerary.days ?? []).slice(0, 3).map(d => `Day ${d.day}: ${d.theme}`).join('\n')}\n\nPlan yours free → roamplan.app`)}`}
                target="_blank" rel="noopener noreferrer"
                className="px-6 py-3 rounded-xl text-sm font-medium text-white/60 hover:text-white transition-all flex items-center gap-2"
                style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
                💬 Share on WhatsApp
              </a>
              {/* Generate packing list */}
              <button onClick={() => {
                const items = [
                  '📄 Passport & travel docs', '💊 Medications', '🔌 Universal adapter',
                  '👕 Weather-appropriate clothing', '👟 Comfortable walking shoes',
                  '🎒 Day pack', '💳 Travel card / cash',
                  withKids ? '🧸 Kids entertainment' : '📚 Book / kindle',
                  withKids ? '🩹 First aid kit' : '🎧 Headphones',
                  '☀️ Sunscreen', '📷 Camera / phone charger',
                ]
                alert(`📋 Packing list for ${itinerary.destination}:\n\n${items.join('\n')}`)
              }}
                className="px-6 py-3 rounded-xl text-sm font-medium text-white/60 hover:text-white transition-all flex items-center gap-2"
                style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
                📋 Packing List
              </button>
              <button onClick={() => printItinerary(itinerary, withKids)}
                className="px-6 py-3 rounded-xl text-sm font-medium text-white/60 hover:text-white transition-all flex items-center gap-2"
                style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
                🖨️ Print / PDF
              </button>
              <ShareCard
                title={`${itinerary.destination} — ${itinerary.duration} Days`}
                subtitle={`${itinerary.overview.slice(0, 80)}…`}
                highlights={[
                  `Budget: ${itinerary.budget_estimate}`,
                  ...(itinerary.days ?? []).slice(0, 3).map(d => `Day ${d.day}: ${d.theme}`),
                ]}
                accentColor="#f97316"
                productName="RoamPlan"
                productUrl="roamplan.app"
                ctaText={`Just built my ${itinerary.destination} trip with AI ✈️\n\n${itinerary.destination} — ${itinerary.duration} Days\n💰 ${itinerary.budget_estimate}\n\n${(itinerary.days ?? []).slice(0, 3).map(d => `Day ${d.day}: ${d.theme}`).join('\n')}\n\nTry it free → roamplan.app`}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── WHY PRO ────────────────────────────────────────────────────── */}
      <section className="px-6 py-10" style={{ borderTop: '1px solid rgba(124,45,2,0.2)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-400/60 mb-3">Why Pro?</div>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight" style={{ fontFamily: "'Georgia', serif" }}>
              Travel smarter, not harder
            </h2>
            <p className="text-white/40 text-sm mt-3">Everything you need for flawless trips, for just $8/month.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {WHY_PRO.map((item, i) => (
              <div key={i} className="rounded-2xl p-6 group transition-all hover:-translate-y-1"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(249,115,22,0.12)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform"
                  style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.25)' }}>
                  {item.icon}
                </div>
                <h3 className="font-bold text-white text-sm mb-2">{item.title}</h3>
                <p className="text-xs text-white/45 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ────────────────────────────────────────────────────── */}
      <section id="pricing" className="px-6 py-10">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-400/60 mb-3">Pricing</div>
            <h2 className="text-4xl font-black text-white tracking-tight mb-2" style={{ fontFamily: "'Georgia', serif" }}>
              Start planning free
            </h2>
            <p className="text-white/35 text-sm">2 free itineraries per day · No card required</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Free plan */}
            <div className="rounded-2xl p-8" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>
              <div className="text-xs font-bold uppercase tracking-widest text-white/30 mb-1">Free</div>
              <div className="text-5xl font-black text-white/30 mb-0.5">$0</div>
              <div className="text-sm text-white/20 mb-6">forever</div>
              <ul className="space-y-2.5 mb-8">
                {['2 itineraries / day', 'Up to 14 days', 'Weather forecast', 'Kids family mode', 'Print to PDF', 'All destinations'].map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-white/35">
                    <span className="text-white/20 mt-0.5">•</span> {f}
                  </li>
                ))}
              </ul>
              <button className="w-full py-3 font-bold text-sm text-white/30 rounded-xl cursor-default"
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                Start free
              </button>
            </div>
            {/* Pro plan */}
            <div className="rounded-2xl p-8 relative"
              style={{
                background: 'linear-gradient(135deg, rgba(124,45,2,0.3) 0%, rgba(30,58,138,0.2) 100%)',
                border: '1px solid rgba(249,115,22,0.35)',
                backdropFilter: 'blur(24px)',
                boxShadow: '0 20px 60px rgba(249,115,22,0.15)',
              }}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-white text-[11px] font-bold uppercase tracking-widest shadow-lg"
                style={{ background: 'linear-gradient(135deg, #f97316, #d97706)' }}>
                Most Popular
              </div>
              <div className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-1">Pro</div>
              <div className="text-5xl font-black text-white mb-0.5">$8</div>
              <div className="text-sm text-white/45 mb-6">/month</div>
              <ul className="space-y-2.5 mb-8">
                {['Unlimited itineraries', 'Multi-city routing', 'Hotel recommendations', 'Offline PDF export', 'Custom trip notes', 'Priority AI speed'].map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-white/75">
                    <span className="text-orange-400 mt-0.5">✓</span> {f}
                  </li>
                ))}
              </ul>
              {isPro ? (
                <div className="w-full py-3 font-bold text-sm text-center text-emerald-400 rounded-xl"
                  style={{ border: '1px solid rgba(52,211,153,0.3)', background: 'rgba(52,211,153,0.1)' }}>
                  ✓ Pro active — enjoy unlimited trips!
                </div>
              ) : (
                <button
                  onClick={handleUpgrade}
                  disabled={checkoutLoading}
                  className="w-full py-3 font-bold text-sm text-white rounded-xl transition-all hover:scale-[1.02] disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #f97316, #d97706)', boxShadow: '0 8px 30px rgba(249,115,22,0.40)' }}>
                  {checkoutLoading ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Redirecting...</>
                  ) : 'Go Pro — $8/mo →'}
                </button>
              )}
            </div>
          </div>

          {/* Social proof under pricing */}
          <div className="mt-10 px-8 py-5 rounded-2xl flex flex-wrap items-center justify-between gap-4"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)' }}>
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {['🧑‍🌾','👩‍💼','🧔','👩‍🎨','🧑‍💻'].map((e,i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm"
                    style={{ background: 'rgba(124,45,2,0.5)', borderColor: 'rgba(124,45,2,0.8)' }}>{e}</div>
                ))}
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Plan any trip, free</div>
                <div className="text-xs text-white/40">AI-powered · Day-by-day itineraries · No card required</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-white/30">No credit card · Cancel anytime</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FLIGHT PRICE TRACKER TEASER ────────────────────────────────── */}
      <section className="px-6 pb-10 max-w-4xl mx-auto">
        <div className="rounded-2xl px-8 py-8 text-center relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(12,74,110,0.4) 0%, rgba(124,45,2,0.35) 100%)',
            border: '1px solid rgba(249,115,22,0.2)',
            backdropFilter: 'blur(24px)',
          }}>
          <div className="absolute inset-0 opacity-15"
            style={{ background: 'radial-gradient(ellipse at 50% 100%, #f97316 0%, transparent 60%)' }} />
          <div className="relative z-10">
            <div className="text-2xl mb-3">✈️ 💰</div>
            <h3 className="text-xl font-black text-white mb-2" style={{ fontFamily: "'Georgia', serif" }}>
              Flight & Currency Tracker — Coming Soon
            </h3>
            <p className="text-white/50 text-sm max-w-lg mx-auto">
              Track live flight prices, get fare alerts, and see real-time currency exchange rates for your destination — all inside RoamPlan Pro.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full text-orange-300 text-xs font-bold uppercase tracking-widest"
              style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.25)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" /> Pro feature · Coming 2026
            </div>
          </div>
        </div>
      </section>

      <GuidedTour steps={TRAVEL_TOUR} storageKey="roamplan_tour_v1" accentColor="#0ea5e9" />

      {/* Competitor comparison */}
      <section style={{ borderTop:'1px solid rgba(14,165,233,0.15)', padding:'48px 24px' }}>
        <div style={{ maxWidth:800, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:32 }}>
            <p style={{ fontSize:10, color:'rgba(14,165,233,0.5)', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:8 }}>How we compare</p>
            <h2 style={{ fontSize:20, fontWeight:800, color:'#f0f9ff' }}>RoamPlan vs alternatives</h2>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ borderBottom:'1px solid rgba(14,165,233,0.2)' }}>
                  {['Feature','RoamPlan','TripAdvisor','Google Trips','Airbnb'].map((h,i) => (
                    <th key={h} style={{ padding:'10px 12px', textAlign:i===0?'left':'center',
                      color: i===1 ? '#0ea5e9' : 'rgba(255,255,255,0.3)', fontWeight:700, fontSize:11, letterSpacing:'0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['AI itinerary builder','✅ Claude AI','❌','❌','❌'],
                  ['Budget breakdown','✅ Detailed','⚠️ Estimates','❌','❌'],
                  ['Accommodation booking','⚠️ Links','✅ Full','❌','✅ Full'],
                  ['No login required','✅','❌','❌','❌'],
                  ['Custom day-by-day plan','✅ AI-written','❌','✅ Basic','❌'],
                  ['Offline access','✅ Export PDF','❌','✅','❌'],
                  ['Cost','Free / Pro','Free','Free','Free'],
                ].map(row => (
                  <tr key={row[0]} style={{ borderBottom:'1px solid rgba(14,165,233,0.07)' }}>
                    {row.map((cell,i) => (
                      <td key={i} style={{ padding:'9px 12px', textAlign:i===0?'left':'center',
                        color: i===1 ? '#0ea5e9' : i===0 ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.25)',
                        background: i===1 ? 'rgba(14,165,233,0.04)' : 'transparent', fontSize:11 }}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop:'1px solid rgba(14,165,233,0.12)', padding:'24px', background:'rgba(2,8,23,0.9)' }}>
        <div style={{ maxWidth:900, margin:'0 auto', display:'flex', flexWrap:'wrap', justifyContent:'space-between', alignItems:'center', gap:16 }}>
          <div>
            <span style={{ fontWeight:900, fontSize:15, color:'#0ea5e9' }}>RoamPlan</span>
            <p style={{ fontSize:11, color:'rgba(255,255,255,0.25)', marginTop:4 }}>AI travel planner — build your perfect trip in minutes.</p>
          </div>
          <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
            {[['About','/about'],['Privacy','/privacy'],['Terms','/terms'],['Cookie Policy','/cookies']].map(([label,href]) => (
              <a key={label} href={href} style={{ fontSize:11, color:'rgba(255,255,255,0.25)', textDecoration:'none' }}
                onMouseOver={e=>(e.currentTarget.style.color='#0ea5e9')} onMouseOut={e=>(e.currentTarget.style.color='rgba(255,255,255,0.25)')}>{label}</a>
            ))}
          </div>
          <p style={{ fontSize:10, color:'rgba(255,255,255,0.15)' }}>© 2026 RoamPlan</p>
        </div>
      </footer>
    </main>
    <RoamPlanCookieBanner />
    </>
  )
}

function RoamPlanCookieBanner() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (!localStorage.getItem('rp_cookies_ok')) setVisible(true)
  }, [])
  if (!visible) return null
  return (
    <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:200, padding:'12px 24px',
      background:'rgba(2,8,23,0.97)', borderTop:'1px solid rgba(14,165,233,0.2)',
      backdropFilter:'blur(16px)', display:'flex', alignItems:'center', justifyContent:'space-between',
      gap:16, flexWrap:'wrap' }}>
      <p style={{ fontSize:12, color:'rgba(255,255,255,0.45)', maxWidth:600, lineHeight:1.5 }}>
        RoamPlan uses essential cookies to save your trip plans and preferences. No tracking, no ads.{' '}
        <a href="/privacy" style={{ color:'#0ea5e9', textDecoration:'underline', cursor:'pointer' }}>Privacy policy</a>
      </p>
      <div style={{ display:'flex', gap:10 }}>
        <button onClick={() => { localStorage.setItem('rp_cookies_ok','1'); setVisible(false) }}
          style={{ fontSize:12, fontWeight:700, padding:'7px 20px', borderRadius:8,
            background:'linear-gradient(135deg,#0ea5e9,#0284c7)', color:'#fff', border:'none', cursor:'pointer' }}>
          Accept
        </button>
        <button onClick={() => setVisible(false)}
          style={{ fontSize:12, fontWeight:500, padding:'7px 14px', borderRadius:8,
            background:'transparent', color:'rgba(255,255,255,0.3)',
            border:'1px solid rgba(255,255,255,0.1)', cursor:'pointer' }}>
          Decline
        </button>
      </div>
    </div>
  )
}
