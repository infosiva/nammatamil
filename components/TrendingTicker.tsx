'use client'

/**
 * TrendingTicker — slim bar below header showing:
 *   • Tamil month + special day (Amavasai, Pournami, festival)
 *   • Scrolling hot items: cricket score, trailers, news
 * Clicking a ticker item jumps to the relevant tab on the home page.
 */

import { useEffect, useState, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { Trophy, Play, Radio, Calendar } from 'lucide-react'

// ── Tamil calendar utils ──────────────────────────────────────────────────────
const TAMIL_MONTHS = [
  { name: 'சித்திரை', english: 'Chittirai', start: [4, 13], end: [5, 14] },
  { name: 'வைகாசி',   english: 'Vaikasi',   start: [5, 15], end: [6, 14] },
  { name: 'ஆனி',      english: 'Aani',      start: [6, 15], end: [7, 16] },
  { name: 'ஆடி',      english: 'Aadi',      start: [7, 17], end: [8, 16] },
  { name: 'ஆவணி',    english: 'Aavani',    start: [8, 17], end: [9, 16] },
  { name: 'புரட்டாசி', english: 'Purattasi',start: [9, 17], end: [10,16] },
  { name: 'ஐப்பசி',   english: 'Aippasi',  start: [10,17], end: [11,15] },
  { name: 'கார்த்திகை',english: 'Karthigai',start: [11,16], end: [12,15] },
  { name: 'மார்கழி',  english: 'Margazhi', start: [12,16], end: [1, 13] },
  { name: 'தை',       english: 'Thai',      start: [1, 14], end: [2, 12] },
  { name: 'மாசி',     english: 'Maasi',     start: [2, 13], end: [3, 13] },
  { name: 'பங்குனி',  english: 'Panguni',   start: [3, 14], end: [4, 12] },
]

const FESTIVALS: Record<string, string> = {
  '1-14': 'Thai Pongal 🎊', '1-26': 'Republic Day 🇮🇳',
  '4-13': 'Tamil New Year 🎉', '4-14': 'Puthandu 🌺',
  '5-1':  'Labour Day', '8-15': 'Independence Day 🇮🇳',
  '10-2': 'Gandhi Jayanti', '12-25': 'Christmas 🎄',
}

// Approximate lunar phase from date (synodic period = 29.53 days)
// Reference new moon: Jan 29 2025
function getLunarPhase(date: Date): { phase: string; emoji: string } | null {
  const REF = new Date('2025-01-29').getTime()
  const daysSince = (date.getTime() - REF) / (1000 * 60 * 60 * 24)
  const cycleDay = ((daysSince % 29.53) + 29.53) % 29.53
  if (cycleDay < 1 || cycleDay > 28.5) return { phase: 'Amavasai', emoji: '🌑' }   // new moon
  if (cycleDay > 13.5 && cycleDay < 16) return { phase: 'Pournami', emoji: '🌕' }  // full moon
  if (cycleDay > 6.5  && cycleDay < 8.5) return { phase: 'Ashtami', emoji: '🌓' }  // first quarter
  if (cycleDay > 21   && cycleDay < 23)  return { phase: 'Ashtami', emoji: '🌗' }  // last quarter
  return null
}

function getTamilMonth(date: Date) {
  const m = date.getMonth() + 1
  const d = date.getDate()
  return TAMIL_MONTHS.find(tm => {
    const [sm, sd] = tm.start
    const [em, ed] = tm.end
    if (sm <= em) return (m === sm && d >= sd) || (m === em && d <= ed) || (m > sm && m < em)
    return (m === sm && d >= sd) || (m === em && d <= ed)
  }) ?? TAMIL_MONTHS[0]
}

// ── Ticker item types ─────────────────────────────────────────────────────────
interface TickerItem {
  id: string
  icon: React.ReactNode
  text: string
  label?: string
  tab?: string   // which HomeTabLayout tab to jump to
  color: string
}

// ── Event bus to control HomeTabLayout from ticker ────────────────────────────
// We dispatch a custom event that HomeTabLayout listens for
function jumpToTab(tab: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nammatamil:tab', { detail: { tab } }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

export default function TrendingTicker() {
  const pathname = usePathname()
  const [items, setItems]   = useState<TickerItem[]>([])
  const [active, setActive] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const buildCalendarItem = useCallback((): TickerItem => {
    const today = new Date()
    const tamilMonth = getTamilMonth(today)
    const lunar = getLunarPhase(today)
    const festKey = `${today.getMonth() + 1}-${today.getDate()}`
    const festival = FESTIVALS[festKey]

    let text = `${tamilMonth.name} (${tamilMonth.english})`
    let extra = ''
    if (festival)      extra = festival
    else if (lunar)    extra = `${lunar.emoji} ${lunar.phase} Today`

    return {
      id: 'cal',
      icon: <Calendar className="w-3 h-3" />,
      text: extra ? `${text} · ${extra}` : text,
      color: '#f59e0b',
    }
  }, [])

  const fetchLiveItems = useCallback(async () => {
    const base: TickerItem[] = [buildCalendarItem()]

    // Fetch cricket for live score/standings
    try {
      const r = await fetch('/api/cricket', { cache: 'no-store', signal: AbortSignal.timeout(4000) })
      if (r.ok) {
        const d = await r.json()
        if (d.liveScore) {
          base.push({ id: 'cricket-live', icon: <Trophy className="w-3 h-3" />, label: 'LIVE', text: d.liveScore, tab: 'cricket', color: '#4ade80' })
        } else if (d.latestResult) {
          base.push({ id: 'cricket', icon: <Trophy className="w-3 h-3" />, label: 'IPL', text: d.latestResult, tab: 'cricket', color: '#4ade80' })
        }
        // Top 2 standings
        const top = (d.standings ?? []).slice(0, 2)
        if (top.length === 2) {
          base.push({
            id: 'standings',
            icon: <Trophy className="w-3 h-3" />,
            label: 'TABLE',
            text: `${top[0].short} ${top[0].pts}pts · ${top[1].short} ${top[1].pts}pts`,
            tab: 'cricket',
            color: '#4ade80',
          })
        }
      }
    } catch { /* skip */ }

    // Fetch trailers for hot titles
    try {
      const r = await fetch('/api/trailers', { cache: 'no-store', signal: AbortSignal.timeout(4000) })
      if (r.ok) {
        const d = await r.json()
        const hot = (d.trailers ?? []).filter((t: { trending?: boolean; viewCount?: number; title: string }) => t.trending || t.viewCount).slice(0, 3)
        for (const t of hot) {
          base.push({
            id: `trailer-${t.title}`,
            icon: <Play className="w-3 h-3" />,
            label: t.trending ? '🔥 TRENDING' : 'TRAILER',
            text: t.title,
            tab: 'trailers',
            color: '#fb923c',
          })
        }
      }
    } catch { /* skip */ }

    // Fetch news headlines
    try {
      const r = await fetch('/api/news', { cache: 'no-store', signal: AbortSignal.timeout(4000) })
      if (r.ok) {
        const d = await r.json()
        const headlines = (d.articles ?? d.news ?? []).slice(0, 2)
        for (const h of headlines) {
          const title = h.title ?? h.headline ?? ''
          if (title.length > 10) {
            base.push({
              id: `news-${title.slice(0, 20)}`,
              icon: <Radio className="w-3 h-3" />,
              label: 'NEWS',
              text: title.slice(0, 80),
              tab: 'news',
              color: '#f87171',
            })
          }
        }
      }
    } catch { /* skip */ }

    setItems(base)
    setActive(0)
  }, [buildCalendarItem])

  // Rotate items every 4 seconds
  useEffect(() => {
    if (items.length === 0) return
    timerRef.current = setInterval(() => {
      setActive(prev => (prev + 1) % items.length)
    }, 4000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [items])

  useEffect(() => {
    fetchLiveItems()
    const id = setInterval(fetchLiveItems, 5 * 60 * 1000) // refresh every 5 min
    return () => clearInterval(id)
  }, [fetchLiveItems])

  // Only show on home page
  if (pathname !== '/') return null
  if (items.length === 0) return null

  const item = items[active]

  return (
    <div
      className="w-full overflow-hidden flex-shrink-0"
      style={{
        background: 'rgba(7,1,15,0.95)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        height: '28px',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center gap-3">

        {/* Tamil month badge — always visible left */}
        <div className="flex items-center gap-1.5 flex-shrink-0 border-r border-white/10 pr-3">
          <Calendar className="w-3 h-3 text-amber-400/70" />
          <span className="text-[10px] font-bold text-amber-400/80">
            {getTamilMonth(new Date()).name}
          </span>
          {(() => {
            const lunar = getLunarPhase(new Date())
            if (lunar) return <span className="text-[10px] text-white/40">{lunar.emoji} {lunar.phase}</span>
            const festKey = `${new Date().getMonth() + 1}-${new Date().getDate()}`
            const fest = FESTIVALS[festKey]
            if (fest) return <span className="text-[10px] text-amber-300/60">{fest}</span>
            return null
          })()}
        </div>

        {/* Rotating ticker item */}
        <button
          className="flex-1 flex items-center gap-2 min-w-0 text-left group"
          onClick={() => item.tab && jumpToTab(item.tab)}
          style={{ cursor: item.tab ? 'pointer' : 'default' }}
        >
          {/* Icon */}
          <span className="flex-shrink-0" style={{ color: item.color + 'cc' }}>
            {item.icon}
          </span>

          {/* Label badge */}
          {item.label && (
            <span className="text-[8px] font-black px-1.5 py-0.5 rounded flex-shrink-0"
              style={{ background: item.color + '20', color: item.color, border: `1px solid ${item.color}30` }}>
              {item.label}
            </span>
          )}

          {/* Text — truncated */}
          <span className="text-[11px] text-white/60 truncate group-hover:text-white/85 transition-colors">
            {item.text}
          </span>

          {item.tab && (
            <span className="text-[9px] text-white/20 flex-shrink-0 group-hover:text-white/40 transition-colors">→</span>
          )}
        </button>

        {/* Dot indicators */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className="rounded-full transition-all"
              style={{
                width:  i === active ? 12 : 4,
                height: 4,
                background: i === active ? (item.color + 'cc') : 'rgba(255,255,255,0.15)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
