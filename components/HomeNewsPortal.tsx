'use client'

/**
 * NammaTamil Super-App Home
 *
 * Architecture: 5-tab layout — News | Cinema | Serials | Calendar | TVK
 * - Stat bar: live story count, sources active, Tamil date, festival today
 * - Tab 1 NEWS: hero + sidebar grid, stagger-animated feed, source-color borders
 * - Tab 2 CINEMA: poster grid with OTT badges, rating colors, coming-soon strip
 * - Tab 3 SERIALS: channel-grouped cards, ongoing status, episode count
 * - Tab 4 CALENDAR: Tamil date, festivals, upcoming events mini-calendar
 * - Tab 5 TVK: dedicated TVK/political news stream, election focus
 *
 * Design principles:
 * - Source colors = identity (never plain gray)
 * - Gradient fallbacks when no image — keyed to source brand color
 * - Noto Serif Tamil for ALL Tamil script text
 * - Dense but breathable: 6+ stories above fold on 375px mobile
 * - Framer Motion: shared-layout tab pill, stagger lists, scroll-reveal rows
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import {
  RefreshCw, Newspaper, TrendingUp, Tv2, Film, Play, Trophy,
  Radio, Clock, Flame, Zap, Star, ChevronRight, ArrowUpRight,
  CalendarDays, Sun, Music, Users, Rss, Phone, X, ExternalLink,
} from 'lucide-react'
import { goLink } from '@/lib/goLink'
import CricketWidget from '@/components/CricketWidget'
import AdUnit from '@/components/AdUnit'
import VisitorCounter from '@/components/VisitorCounter'
import TVKSpotlight from '@/components/TVKSpotlight'
import { movies } from '@/data/movies'
import { serials } from '@/data/serials'
import { albums } from '@/data/albums'

// ── Daily accent palette ──────────────────────────────────────────────────────
function getDayAccent() {
  const d = new Date().getDay()
  if (d === 0 || d === 3 || d === 6) return { primary: '#e53935', light: '#ff6b6b', name: 'crimson' }
  if (d === 1 || d === 4)            return { primary: '#f59e0b', light: '#fbbf24', name: 'amber'   }
  return                                    { primary: '#0ea5e9', light: '#38bdf8', name: 'sky'     }
}
const ACCENT = getDayAccent()

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:      '#09090f',
  card:    '#111118',
  raised:  '#18181f',
  border:  'rgba(255,255,255,0.06)',
  border2: 'rgba(255,255,255,0.11)',
  text:    '#f0f0f5',
  sub:     'rgba(240,240,245,0.62)',
  muted:   'rgba(240,240,245,0.36)',
  dim:     'rgba(240,240,245,0.16)',
  accent:  ACCENT.primary,
  accentL: ACCENT.light,
  gold:    '#f5a623',
  purple:  '#a855f7',
  green:   '#22c55e',
  teal:    '#14b8a6',
  red:     '#ef4444',
}

// ── Source color map ──────────────────────────────────────────────────────────
const SRC: Record<string, string> = {
  'Dinamalar':           '#e53935',
  'Maalaimalar':         '#7c3aed',
  'OneIndia Tamil':      '#0288d1',
  'The Hindu Tamil':     '#1565c0',
  'Vikatan':             '#e65100',
  'Puthiya Thalaimurai': '#c62828',
  'Sun News':            '#f59e0b',
  'Polimer News':        '#2e7d32',
  'NammaTVK':            '#f59e0b',
  'Kalaignar News':      '#b71c1c',
  'Thanthi TV':          '#e65100',
  'NDTV India':          '#b71c1c',
  'CricBuzz':            '#1b5e20',
  'ESPN Cricinfo':       '#d32f2f',
}

const OTT_C: Record<string, string> = {
  'Netflix': '#e50914', 'Amazon Prime': '#00a8e0',
  'Disney+ Hotstar': '#0073e6', 'ZEE5': '#8b5cf6',
  'YouTube': '#ff0000', 'SunNXT': '#f59e0b',
}

// ── Gradient fallback — never empty ──────────────────────────────────────────
function gradFb(source: string, seed: number): string {
  const c = SRC[source] ?? ACCENT.primary
  const angle = 120 + (seed % 4) * 30
  return `linear-gradient(${angle}deg, ${c}55 0%, #1a1a2e 100%)`
}

// ── Tamil calendar utils ──────────────────────────────────────────────────────
const TAMIL_MONTHS = [
  'சித்திரை','வைகாசி','ஆனி','ஆடி','ஆவணி','புரட்டாசி',
  'ஐப்பசி','கார்த்திகை','மார்கழி','தை','மாசி','பங்குனி',
]
const TAMIL_MONTH_EN = [
  'Chittirai','Vaikasi','Aani','Aadi','Aavani','Purattasi',
  'Aippasi','Karthigai','Margazhi','Thai','Maasi','Panguni',
]
const TAMIL_MONTH_INFO: Record<string, { deity: string; significance: string; season: string; color: string }> = {
  'Chittirai': { deity: 'விஷ்ணு', significance: 'Tamil New Year · Chithirai Brahmotsavam at Madurai Meenakshi', season: 'Spring (Vasantham)', color: '#f59e0b' },
  'Vaikasi':   { deity: 'முருகன்', significance: 'Vaikasi Visakam — Lord Murugan\'s star birthday · Brahmotsavam season', season: 'Late Spring', color: '#10b981' },
  'Aani':      { deity: 'சிவன்', significance: 'Aani Thirumanjanam · Aadi Pooram approaching · Monsoon onset (NE)', season: 'Early Monsoon', color: '#06b6d4' },
  'Aadi':      { deity: 'ஆதி சக்தி', significance: 'Aadi Perukku · Aadi Amavasai · Kaveri floods · Amman temples festivals', season: 'Monsoon (Aadi Mazhai)', color: '#8b5cf6' },
  'Aavani':    { deity: 'கிருஷ்ணன்', significance: 'Aavani Avittam (Upakarma) · Gokulashtami · Vinayagar Chaturthi', season: 'Post-Monsoon', color: '#f97316' },
  'Purattasi': { deity: 'விஷ்ணு', significance: 'Purattasi Sanikazhimai — Vishnu worship every Saturday · Navarathri', season: 'Autumn (Karthigai starts)', color: '#ef4444' },
  'Aippasi':   { deity: 'லட்சுமி', significance: 'Deepavali season · Skanda Sashti · Karthigai Deepam approaches', season: 'Cool/Dry season starts', color: '#f59e0b' },
  'Karthigai': { deity: 'முருகன் + சிவன்', significance: 'Karthigai Deepam — lamps lit everywhere · Skanda Sashti fasting', season: 'Cool & Dry', color: '#fbbf24' },
  'Margazhi':  { deity: 'திருமால்', significance: 'Thiruvembavai · Thiruppavai · Kolam season · Carnatic music season', season: 'Winter (Hemantha)', color: '#a78bfa' },
  'Thai':      { deity: 'சூர்யன்', significance: 'Thai Pongal (harvest) · Thai Poosam · Aadi Pooram for diaspora', season: 'Winter Solstice / Harvest', color: '#fbbf24' },
  'Maasi':     { deity: 'யமன்', significance: 'Maasi Magam — ancestors · Mahasivarathri · Teppotsavam (float festival)', season: 'Late Winter/Spring', color: '#6366f1' },
  'Panguni':   { deity: 'முருகன்', significance: 'Panguni Uthiram · Brahmotsavam · Spring festivals at Tiruchendur', season: 'Spring begins', color: '#ec4899' },
}

// Rahu Kalam & Yamagandam by day (Mon–Sun) — IST slots
const RAHU_KALAM: Record<number, string> = {
  0: '16:30–18:00', // Sun
  1: '07:30–09:00', // Mon
  2: '15:00–16:30', // Tue
  3: '12:00–13:30', // Wed
  4: '13:30–15:00', // Thu
  5: '10:30–12:00', // Fri
  6: '09:00–10:30', // Sat
}
const YAMAGANDAM: Record<number, string> = {
  0: '12:00–13:30',
  1: '10:30–12:00',
  2: '09:00–10:30',
  3: '07:30–09:00',
  4: '06:00–07:30',
  5: '15:00–16:30',
  6: '13:30–15:00',
}
const NALLA_NERAM: Record<number, string> = {
  0: '06:30–07:30', // Sun
  1: '06:00–07:30', // Mon
  2: '06:00–07:30', // Tue
  3: '07:30–09:00', // Wed
  4: '06:00–07:30', // Thu
  5: '06:00–07:30', // Fri
  6: '06:00–07:30', // Sat
}

const TAMIL_DAYS = ['ஞாயிறு','திங்கள்','செவ்வாய்','புதன்','வியாழன்','வெள்ளி','சனி']
const NAKSHATRA_CYCLE = [
  'அசுவினி','பரணி','கார்த்திகை','ரோகிணி','மிருகசீர்ஷம்','திருவாதிரை',
  'புனர்பூசம்','பூசம்','ஆயில்யம்','மகம்','பூரம்','உத்திரம்',
  'அஸ்தம்','சித்திரை','சுவாதி','விசாகம்','அனுஷம்','கேட்டை',
  'மூலம்','பூராடம்','உத்திராடம்','திருவோணம்','அவிட்டம்','சதயம்',
  'பூரட்டாதி','உத்திரட்டாதி','ரேவதி',
]
function getTodayNakshatra() {
  const start = new Date('2000-01-01').getTime()
  const daysSince = Math.floor((Date.now() - start) / 86400000)
  return NAKSHATRA_CYCLE[daysSince % 27]
}

// TN Govt helplines
const TN_HELPLINES = [
  { name: 'Chief Minister Helpline', number: '1100', desc: 'Grievances, welfare schemes', color: '#e53935' },
  { name: 'Police Emergency', number: '100', desc: 'Crime, emergency response', color: '#1565c0' },
  { name: 'Ambulance (108)', number: '108', desc: '24/7 free ambulance service', color: '#c62828' },
  { name: 'Fire & Rescue', number: '101', desc: 'Fire emergency, rescue ops', color: '#e65100' },
  { name: 'Child Helpline', number: '1098', desc: 'CHILDLINE — child abuse, missing', color: '#6a1b9a' },
  { name: 'Women Helpline', number: '181', desc: 'Violence, harassment, safety', color: '#880e4f' },
  { name: 'Arasu Cable', number: '044-28592020', desc: 'TN Arasu cable TV complaints', color: '#2e7d32' },
  { name: 'Road Accidents (1033)', number: '1033', desc: 'Highway accident, breakdown', color: '#f57f17' },
]
const FESTIVALS: Array<{ month: number; day: number; name: string; tamil: string; color: string; deity?: string }> = [
  { month: 1,  day: 14, name: 'Thai Pongal',         tamil: 'தை பொங்கல்',           color: '#fbbf24', deity: 'சூரியன்' },
  { month: 1,  day: 15, name: 'Mattu Pongal',        tamil: 'மாட்டு பொங்கல்',       color: '#f59e0b', deity: 'நந்தி' },
  { month: 1,  day: 16, name: 'Kaanum Pongal',       tamil: 'காணும் பொங்கல்',       color: '#fb923c' },
  { month: 2,  day: 14, name: 'Thai Amavasai',       tamil: 'தை அமாவாசை',           color: '#8b5cf6', deity: 'முன்னோர்கள்' },
  { month: 3,  day: 8,  name: 'Maha Shivratri',      tamil: 'மகா சிவராத்திரி',      color: '#6366f1', deity: 'சிவன்' },
  { month: 3,  day: 25, name: 'Panguni Uthiram',     tamil: 'பங்குனி உத்திரம்',    color: '#ec4899', deity: 'முருகன்·ஆண்டாள்' },
  { month: 4,  day: 13, name: 'Tamil New Year',      tamil: 'தமிழ் புத்தாண்டு',    color: '#f59e0b' },
  { month: 4,  day: 14, name: 'Chithirai Brahmotsavam', tamil: 'சித்திரை பிரம்மோத்சவம்', color: '#e11d48', deity: 'மீனாட்சி' },
  { month: 5,  day: 1,  name: 'Labour Day',          tamil: 'தொழிலாளர் தினம்',     color: '#ef4444' },
  { month: 5,  day: 18, name: 'தமிழீழ நினைவு நாள்', tamil: 'Eelam Remembrance',    color: '#f97316' },
  { month: 6,  day: 3,  name: 'Vaikasi Brahmotsavam',tamil: 'வைகாசி பிரம்மோத்சவம்',color: '#0ea5e9', deity: 'திருவேங்கடம்' },
  { month: 6,  day: 21, name: 'Vaikasi Visakam',     tamil: 'வைகாசி விசாகம்',      color: '#10b981', deity: 'முருகன்' },
  { month: 7,  day: 3,  name: 'Adi Amavasai',        tamil: 'ஆடி அமாவாசை',         color: '#8b5cf6', deity: 'முன்னோர்கள்' },
  { month: 7,  day: 17, name: 'Aadi Perukku',        tamil: 'ஆடி பெருக்கு',        color: '#06b6d4', deity: 'காவிரி·ஆதி சக்தி' },
  { month: 7,  day: 26, name: 'Aadi Pooram',         tamil: 'ஆடி பூரம்',           color: '#ec4899', deity: 'மாரியம்மன்' },
  { month: 8,  day: 15, name: 'Independence Day',    tamil: 'சுதந்திர தினம்',      color: '#f97316' },
  { month: 8,  day: 26, name: 'Krishna Jayanthi',    tamil: 'கிருஷ்ண ஜயந்தி',     color: '#7c3aed', deity: 'கண்ணன்' },
  { month: 9,  day: 2,  name: 'Ganesh Chaturthi',    tamil: 'விநாயகர் சதுர்த்தி', color: '#fb923c', deity: 'விநாயகர்' },
  { month: 10, day: 2,  name: 'Gandhi Jayanthi',     tamil: 'காந்தி ஜயந்தி',      color: '#34d399' },
  { month: 10, day: 10, name: 'Navratri Begins',     tamil: 'நவராத்திரி',          color: '#e879f9', deity: 'துர்கை·சரஸ்வதி·லக்ஷ்மி' },
  { month: 10, day: 19, name: 'Vijaya Dasami',       tamil: 'விஜயதசமி·அயுத பூஜை', color: '#f59e0b', deity: 'சரஸ்வதி' },
  { month: 10, day: 24, name: 'Deepavali',           tamil: 'தீபாவளி',             color: '#fbbf24', deity: 'லக்ஷ்மி' },
  { month: 11, day: 1,  name: 'Karthigai Deepam',   tamil: 'கார்த்திகை தீபம்',    color: '#fde68a', deity: 'சிவன்·முருகன்' },
  { month: 11, day: 5,  name: 'Skanda Sashti',      tamil: 'ஸ்கந்த சஷ்டி',       color: '#10b981', deity: 'முருகன்' },
  { month: 12, day: 3,  name: 'Arudra Darshan',     tamil: 'ஆருத்ரா தரிசனம்',    color: '#6366f1', deity: 'நடராஜர்' },
  { month: 12, day: 25, name: 'Christmas',          tamil: 'கிறிஸ்மஸ்',           color: '#34d399' },
  { month: 12, day: 31, name: 'Vaikunta Ekadasi',   tamil: 'வைகுண்ட ஏகாதசி',     color: '#0ea5e9', deity: 'திருமால்' },
]

// ── Famous Tamil Nadu temples ─────────────────────────────────────────────────
const KOVILS = [
  { name: 'Meenakshi Amman', tamil: 'மீனாட்சி அம்மன்', city: 'Madurai', deity: 'மீனாட்சி · சுந்தரேஸ்வரர்', morning: '5:00 – 12:30', evening: '4:00 – 10:00', color: '#e11d48', famous: 'Largest temple complex in Tamil Nadu · 14 gopurams' },
  { name: 'Brihadeeswarar',   tamil: 'பிரகதீஸ்வரர்', city: 'Thanjavur', deity: 'சிவன்',               morning: '6:00 – 12:00', evening: '4:00 – 8:30',  color: '#6366f1', famous: 'UNESCO World Heritage · Chola architecture masterpiece' },
  { name: 'Murugan Palani',   tamil: 'தண்டாயுதபாணி', city: 'Palani',   deity: 'முருகன்',            morning: '5:00 – 12:00', evening: '4:00 – 9:00',  color: '#10b981', famous: '2nd of 6 Arupadai Veedu · Kavadi pilgrimage site' },
  { name: 'Tirupati Balaji',  tamil: 'திருவேங்கடம்', city: 'Tirupati', deity: 'திருமால்',           morning: '3:00 – 1:30',  evening: '3:00 – 11:30', color: '#f59e0b', famous: 'Richest temple in the world · 50,000+ pilgrims/day' },
  { name: 'Rameshwaram',      tamil: 'ராமேஸ்வரம்',  city: 'Rameswaram',deity: 'ராமநாதேஸ்வரர்',   morning: '5:00 – 1:00',  evening: '3:00 – 9:00',  color: '#0ea5e9', famous: '22 theerthams · Jyotirlinga · Ramanathamy Corridor' },
  { name: 'Murugan Thiruchendur', tamil: 'திருச்செந்தூர்', city: 'Tiruchendur', deity: 'முருகன்', morning: '5:30 – 12:30', evening: '4:00 – 9:00',  color: '#06b6d4', famous: 'Only Arupadai Veedu on the sea coast' },
]

function getTamilDate() {
  const now = new Date()
  const m = now.getMonth() + 1
  const d = now.getDate()
  // approximate Tamil month by Gregorian month (±2 weeks offset)
  const tamilMonthIdx = (m + 9) % 12  // rough approximation
  const festival = FESTIVALS.find(f => f.month === m && f.day === d)
  return {
    day: d, month: m, weekdayIdx: now.getDay(),
    tamilMonth: TAMIL_MONTHS[tamilMonthIdx],
    tamilMonthEn: TAMIL_MONTH_EN[tamilMonthIdx],
    tamilYear: now.getFullYear() + 56,
    festival,
  }
}

// ── Cinema data ───────────────────────────────────────────────────────────────
const _10W = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
function hasThumb(m: { thumbnail?: string }) {
  return !!(m.thumbnail && m.thumbnail !== 'undefined' && !m.thumbnail.includes('default.jpg') && !m.thumbnail.includes('goat-vijay'))
}
function freshOtt(d?: string) {
  if (!d) return false
  if (d === 'Coming Soon') return true
  try { return new Date(d) >= _10W } catch { return false }
}

// Shared cinema movie type — compatible with both static movies.ts and /api/ott response
interface CinemaMovie {
  id: string; slug: string; title: string; year: number
  cast?: string[]; genre?: string[]; language: string
  streamingOn?: string[]; ottDate?: string
  rating: number; thumbnail?: string; badge?: string
}

// Static fallback grids (used until live data loads)
const STATIC_CINEMA_GRID: CinemaMovie[] = movies
  .filter(m => m.language === 'Tamil' && (freshOtt(m.ottDate) || m.year >= 2025))
  .sort((a, b) => {
    const as = a.ottDate === 'Coming Soon' ? 2 : freshOtt(a.ottDate) ? 1 : 0
    const bs = b.ottDate === 'Coming Soon' ? 2 : freshOtt(b.ottDate) ? 1 : 0
    if (bs !== as) return bs - as
    return b.rating - a.rating
  })
  .slice(0, 20)

const STATIC_ALL_CINEMA: CinemaMovie[] = movies
  .filter(m => m.language === 'Tamil')
  .sort((a, b) => b.rating - a.rating)
  .slice(0, 40)

function rc(r: number) {
  if (r >= 8) return '#22c55e'; if (r >= 7) return '#f5a623'; if (r >= 6) return '#fb923c'; return '#f87171'
}

// ── News types ────────────────────────────────────────────────────────────────
interface NewsItem {
  title: string; link: string; source: string; sourceLogo: string
  pubDate: string; timeAgo: string; desc: string; imageUrl: string | null; category: string
}
interface ApiResponse { news: NewsItem[]; updatedAt: string; count: number }

const REFRESH_MS   = 6 * 60 * 1000
const CACHE_TTL    = 5 * 60 * 1000
const LS_CACHE_TTL = 10 * 60 * 1000
const LS_KEY       = 'nt_news_ls_v5'
const SS_KEY       = 'nt_news_v7'
const SPORTS_KW    = ['cricket','ipl','csk','dhoni','match','விளையாட்டு','கிரிக்கெட்']

const TVK_PROMO: NewsItem = {
  title: 'Thalapathy Vijay — TVK கட்சி | Tamil Nadu CM Race 2026',
  desc: '', link: 'https://en.wikipedia.org/wiki/Tamilaga_Vettri_Kazhagam',
  source: 'NammaTamil.tv', sourceLogo: '', pubDate: new Date().toISOString(),
  timeAgo: 'pinned',
  imageUrl: null,
  category: 'tvk',
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'news',     label: 'செய்திகள்',  labelEn: 'News',     icon: Newspaper, color: ACCENT.primary },
  { key: 'cinema',   label: 'சினிமா',     labelEn: 'Cinema',   icon: Film,      color: T.purple       },
  { key: 'serials',  label: 'சீரியல்கள்', labelEn: 'Serials',  icon: Tv2,       color: T.teal         },
  { key: 'calendar', label: 'பஞ்சாங்கம்', labelEn: 'Calendar', icon: CalendarDays, color: T.gold      },
  { key: 'tvk',      label: 'TVK 2026',   labelEn: 'TVK',      icon: Zap,       color: '#f59e0b', badge: 'LIVE' },
]

const NEWS_CATS = [
  { key: 'all',      label: 'அனைத்தும்',   icon: Radio,       color: ACCENT.primary },
  { key: 'politics', label: 'அரசியல்',    icon: Flame,       color: '#f97316' },
  { key: 'cinema',   label: 'சினிமா',     icon: Film,        color: T.purple  },
  { key: 'religion', label: 'கோவில்',     icon: Star,        color: '#e11d48' },
  { key: 'sports',   label: 'விளையாட்டு', icon: Trophy,      color: T.green   },
]

// ── Animation variants ────────────────────────────────────────────────────────
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.048 } } }
const rowVar  = { hidden: { opacity: 0, x: -8 }, visible: { opacity: 1, x: 0, transition: { duration: 0.2, ease: 'easeOut' as const } } }
const fadeIn  = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' as const } } }

// ════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ════════════════════════════════════════════════════════════════════════════

// ── Breaking ticker ───────────────────────────────────────────────────────────
function Ticker({ items }: { items: NewsItem[] }) {
  if (!items.length) return null
  const heads = items.slice(0, 20).map(n => n.title)
  return (
    <div style={{ background: T.accent, overflow: 'hidden', display: 'flex', alignItems: 'center', height: 30, flexShrink: 0 }}>
      <div style={{ flexShrink: 0, padding: '0 14px', height: '100%', display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.25)', fontSize: 8.5, fontWeight: 900, color: '#fff', letterSpacing: '0.2em', whiteSpace: 'nowrap' }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff', display: 'inline-block', animation: 'nt-ping 1.4s ease-in-out infinite' }} />
        LIVE
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 52, whiteSpace: 'nowrap', fontSize: 11.5, fontWeight: 500, color: 'rgba(255,255,255,0.96)', animation: 'nt-marquee 140s linear infinite', paddingLeft: 20 }}>
          {[...heads, ...heads].map((h, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 4, opacity: 0.55 }}>◆</span>{h}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Stat bar — MandiRates-inspired ────────────────────────────────────────────
function StatBar({ newsCount, sourceCount, tamilDate, festival }: {
  newsCount: number; sourceCount: number
  tamilDate: ReturnType<typeof getTamilDate>; festival?: typeof FESTIVALS[0]
}) {
  return (
    <div style={{ background: '#0d0d14', borderBottom: `1px solid ${T.border}`, padding: '7px 0' }}>
      <div className="nt-w" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {/* Story count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 6, background: `${T.accent}14`, border: `1px solid ${T.accent}28` }}>
          <Rss style={{ width: 9, height: 9, color: T.accent }} />
          <span style={{ fontSize: 10, fontWeight: 800, color: T.accent }}>{newsCount}</span>
          <span style={{ fontSize: 9, color: T.muted }}>stories</span>
        </div>
        {/* Sources */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 6, background: `${T.teal}14`, border: `1px solid ${T.teal}28` }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: T.green, display: 'inline-block', animation: 'nt-ping 2s ease-in-out infinite' }} />
          <span style={{ fontSize: 10, fontWeight: 800, color: T.teal }}>{sourceCount}</span>
          <span style={{ fontSize: 9, color: T.muted }}>sources live</span>
        </div>
        {/* Tamil date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 6, background: `${T.gold}10`, border: `1px solid ${T.gold}22` }}>
          <CalendarDays style={{ width: 9, height: 9, color: T.gold }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: T.gold, fontFamily: "'Noto Serif Tamil', serif" }}>{tamilDate.tamilMonth}</span>
          <span style={{ fontSize: 9, color: T.muted }}>{tamilDate.tamilMonthEn}</span>
        </div>
        {/* Festival */}
        {festival && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 6, background: `${festival.color}12`, border: `1px solid ${festival.color}28` }}>
            <Star style={{ width: 9, height: 9, color: festival.color }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: festival.color }}>{festival.name}</span>
          </div>
        )}
        {/* Time */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
          <VisitorCounter />
          <span style={{ fontSize: 9, color: T.dim }}>
            {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })} IST
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Section header ────────────────────────────────────────────────────────────
function SH({ label, color = T.accent, href, icon: Icon, sub }: {
  label: string; color?: string; href?: string; icon?: React.ElementType; sub?: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', paddingBottom: 10, marginBottom: 14, borderBottom: `1px solid ${T.border}` }}>
      <div style={{ width: 3, height: 16, borderRadius: 2, background: color, marginRight: 9, flexShrink: 0 }} />
      {Icon && <Icon style={{ width: 11, height: 11, color, marginRight: 5, flexShrink: 0 }} />}
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 11, fontWeight: 900, color: T.text, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
        {sub && <span style={{ fontSize: 9.5, color: T.muted, marginLeft: 8 }}>{sub}</span>}
      </div>
      {href && (
        <Link href={href} style={{ fontSize: 10, color, textDecoration: 'none', opacity: 0.75, display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          More <ChevronRight style={{ width: 8, height: 8 }} />
        </Link>
      )}
    </div>
  )
}

// ── Source badge ──────────────────────────────────────────────────────────────
function Src({ source, small }: { source: string; small?: boolean }) {
  const c = SRC[source] ?? '#555'
  return (
    <span style={{ fontSize: small ? 7.5 : 8.5, fontWeight: 800, padding: small ? '1px 5px' : '2px 7px', borderRadius: 3, background: c, color: '#fff', whiteSpace: 'nowrap', flexShrink: 0 }}>
      {source.slice(0, 12)}
    </span>
  )
}

// ── Hero card ─────────────────────────────────────────────────────────────────
function HeroCard({ item, idx }: { item: NewsItem; idx: number }) {
  const [err, setErr] = useState(false)
  return (
    <a href={goLink(item.link, 'hero')} target="_blank" rel="noopener noreferrer"
      style={{ display: 'block', textDecoration: 'none', position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: '16/9' }}
      className="nt-hero">
      <div style={{ position: 'absolute', inset: 0 }}>
        {item.imageUrl && !err
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={item.imageUrl} alt={item.title} loading="eager" fetchPriority="high" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setErr(true)} />
          : <div style={{ width: '100%', height: '100%', background: gradFb(item.source, idx) }} />
        }
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.45) 42%, rgba(0,0,0,0.05) 72%)' }} />
      </div>
      <div style={{ position: 'absolute', top: 10, left: 10 }}><Src source={item.source} /></div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 14px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
          {item.category !== 'general' && (
            <span style={{ fontSize: 8, fontWeight: 800, color: T.accentL, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{item.category}</span>
          )}
          <span style={{ marginLeft: 'auto', fontSize: 9.5, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Clock style={{ width: 7, height: 7 }} />{item.timeAgo}
          </span>
        </div>
        <h2 style={{ margin: 0, fontFamily: "'Noto Serif Tamil', 'Noto Serif', Georgia, serif", fontSize: 'clamp(15px, 3.8vw, 22px)', fontWeight: 800, lineHeight: 1.22, color: '#fff', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', letterSpacing: '-0.01em', textShadow: '0 2px 16px rgba(0,0,0,0.6)' }}>
          {item.title}
        </h2>
      </div>
    </a>
  )
}

// ── Story tile ────────────────────────────────────────────────────────────────
function StoryTile({ item, idx }: { item: NewsItem; idx: number }) {
  const [err, setErr] = useState(false)
  return (
    <a href={goLink(item.link, 'story')} target="_blank" rel="noopener noreferrer"
      style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none' }} className="nt-tile">
      <div style={{ position: 'relative', borderRadius: 7, overflow: 'hidden', marginBottom: 7, aspectRatio: '16/9' }}>
        {item.imageUrl && !err
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={item.imageUrl} alt={item.title} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setErr(true)} />
          : <div style={{ width: '100%', height: '100%', background: gradFb(item.source, idx + 2) }} />
        }
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)' }} />
        <div style={{ position: 'absolute', bottom: 5, left: 6 }}><Src source={item.source} small /></div>
      </div>
      <p style={{ margin: '0 0 4px', fontFamily: "'Noto Serif Tamil', 'Noto Serif', Georgia, serif", fontSize: 12.5, fontWeight: 700, color: T.text, lineHeight: 1.38, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {item.title}
      </p>
      <span style={{ fontSize: 9, color: T.muted, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Clock style={{ width: 6, height: 6 }} />{item.timeAgo}
      </span>
    </a>
  )
}

// ── News row — left border = source color ─────────────────────────────────────
function NewsRow({ item, idx }: { item: NewsItem; idx: number }) {
  const c = SRC[item.source] ?? '#555'
  const [err, setErr] = useState(false)
  const ref = useRef<HTMLAnchorElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -30px 0px' })
  return (
    <motion.a ref={ref as React.Ref<HTMLAnchorElement>}
      href={goLink(item.link, 'feed')} target="_blank" rel="noopener noreferrer"
      variants={rowVar} initial="hidden" animate={inView ? 'visible' : 'hidden'}
      className="nt-row"
      style={{ display: 'flex', alignItems: 'flex-start', gap: 10, textDecoration: 'none', padding: '9px 12px 9px 11px', borderBottom: `1px solid ${T.border}`, borderLeft: `3px solid ${c}` }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: '0 0 5px', fontSize: 13, fontWeight: 650, color: T.text, lineHeight: 1.42, fontFamily: "'Noto Serif Tamil', 'Noto Serif', Georgia, serif", display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {item.title}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 8.5, fontWeight: 800, color: c }}>{item.source}</span>
          {item.category !== 'general' && (
            <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: `${c}1a`, color: c, border: `1px solid ${c}28` }}>{item.category}</span>
          )}
          <span style={{ fontSize: 9, color: T.muted, display: 'flex', alignItems: 'center', gap: 2, marginLeft: 'auto' }}>
            <Clock style={{ width: 6, height: 6 }} />{item.timeAgo}
          </span>
        </div>
      </div>
      <div style={{ flexShrink: 0, width: 72, height: 52, borderRadius: 6, overflow: 'hidden', background: gradFb(item.source, idx) }}>
        {item.imageUrl && !err
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={item.imageUrl} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setErr(true)} />
          : null
        }
      </div>
    </motion.a>
  )
}

// ── Trending row ──────────────────────────────────────────────────────────────
function TrendRow({ item, rank }: { item: NewsItem; rank: number }) {
  const c = SRC[item.source] ?? '#555'
  return (
    <a href={goLink(item.link, 'trending')} target="_blank" rel="noopener noreferrer" className="nt-trow"
      style={{ display: 'flex', gap: 9, textDecoration: 'none', padding: '7px 0', borderBottom: `1px solid ${T.border}`, alignItems: 'flex-start' }}>
      <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 900, color: rank <= 3 ? T.accent : T.dim, width: 18, textAlign: 'right', fontFamily: 'Georgia, serif', paddingTop: 1 }}>{rank}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 11.5, fontWeight: 600, color: T.sub, lineHeight: 1.36, margin: '0 0 3px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.title}</p>
        <div style={{ display: 'flex', gap: 5 }}>
          <span style={{ fontSize: 8.5, fontWeight: 700, color: c }}>{item.source}</span>
          <span style={{ fontSize: 8.5, color: T.muted }}>{item.timeAgo}</span>
        </div>
      </div>
    </a>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Sk({ h = 50, r = 6, mb = 0 }: { h?: number; r?: number; mb?: number }) {
  return <div style={{ height: h, borderRadius: r, background: 'rgba(255,255,255,0.045)', animation: 'nt-shimmer 1.8s ease-in-out infinite', marginBottom: mb, flexShrink: 0 }} />
}

// ── TN Helplines modal ────────────────────────────────────────────────────────
function TNHelplinesModal({ onClose }: { onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 0 0 0' }}
        onClick={onClose}>
        <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 36 }}
          style={{ width: '100%', maxWidth: 560, background: T.card, borderRadius: '16px 16px 0 0', border: `1px solid ${T.border2}`, borderBottom: 'none', padding: '20px 18px 28px', maxHeight: '85vh', overflowY: 'auto' }}
          onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: '#e5393512', border: '1px solid #e5393530', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Phone style={{ width: 16, height: 16, color: '#ef4444' }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: T.text }}>Tamil Nadu Helplines</p>
              <p style={{ margin: 0, fontSize: 10.5, color: T.muted }}>Government emergency numbers — free to call 24/7</p>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, padding: 4 }}>
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
            {TN_HELPLINES.map((h, i) => (
              <a key={i} href={`tel:${h.number}`}
                style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '11px 13px', borderRadius: 10, background: `${h.color}0e`, border: `1px solid ${h.color}28`, textDecoration: 'none', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                  <span style={{ fontSize: 22, fontWeight: 900, color: h.color, letterSpacing: '-0.02em', lineHeight: 1 }}>{h.number}</span>
                  <ExternalLink style={{ width: 10, height: 10, color: h.color, opacity: 0.6, flexShrink: 0 }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 800, color: T.text, lineHeight: 1.2 }}>{h.name}</span>
                <span style={{ fontSize: 9.5, color: T.muted, lineHeight: 1.3 }}>{h.desc}</span>
              </a>
            ))}
          </div>
          <p style={{ margin: '14px 0 0', textAlign: 'center', fontSize: 9.5, color: T.dim }}>Tap any number to call directly · Free from any mobile</p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ── Tamil Songs / Album strip ─────────────────────────────────────────────────
function MusicStrip() {
  const recent = albums.filter(a => a.year >= 2025).slice(0, 8)
  if (!recent.length) return null
  return (
    <div style={{ background: `linear-gradient(135deg, ${T.purple}0a 0%, ${T.card} 60%)`, border: `1px solid ${T.purple}1a`, borderRadius: 10, padding: '12px 14px 14px', marginBottom: 14 }}>
      <SH label="Tamil Songs" color={T.purple} href="/albums" icon={Music} sub="Latest 2025 albums" />
      <div style={{ display: 'flex', gap: 9, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
        {recent.map((a, i) => (
          <Link key={a.id} href={`/albums/${a.slug}`} style={{ textDecoration: 'none', flexShrink: 0, width: 100 }}>
            <div style={{ borderRadius: 8, overflow: 'hidden', background: T.raised, border: `1px solid ${T.border}` }}>
              <div style={{ height: 100, background: `linear-gradient(135deg, ${['#7c3aed','#e53935','#0288d1','#2e7d32','#f59e0b','#dc2626','#c62828','#6a1b9a'][i % 8]}50 0%, #1a1a2e 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Music style={{ width: 24, height: 24, color: 'rgba(255,255,255,0.4)' }} />
              </div>
              <div style={{ padding: '5px 7px 7px' }}>
                <p style={{ margin: '0 0 2px', fontSize: 10, fontWeight: 800, color: T.text, lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontFamily: "'Noto Serif Tamil', 'Noto Serif', Georgia, serif" }}>{a.title}</p>
                <p style={{ margin: 0, fontSize: 8.5, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.artist}</p>
                {a.badge && <span style={{ display: 'inline-block', marginTop: 3, fontSize: 7, fontWeight: 900, padding: '1px 5px', borderRadius: 3, background: `${T.purple}28`, color: T.purple }}>{a.badge}</span>}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ── Cinema poster card ────────────────────────────────────────────────────────
function CinemaCard({ movie, wide }: { movie: CinemaMovie; wide?: boolean }) {
  const [err, setErr] = useState(false)
  const has = !err && hasThumb(movie)
  const rating = rc(movie.rating)
  const platform = movie.streamingOn?.[0]
  const ottC = platform ? (OTT_C[platform] ?? '#555') : null
  const isOtt = movie.ottDate && movie.ottDate !== 'Coming Soon'
  const fbGrad = `linear-gradient(160deg, ${rating}40 0%, #1a1a2e 100%)`
  return (
    <div className="nt-ccard">
      <Link href={`/movies/${movie.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
        <div style={{ borderRadius: 8, overflow: 'hidden', background: T.raised, border: `1px solid ${T.border}` }}>
          <div style={{ aspectRatio: wide ? '16/9' : '2/3', position: 'relative', overflow: 'hidden' }}>
            {has
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={movie.thumbnail} alt={movie.title} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={() => setErr(true)} />
              : <div style={{ width: '100%', height: '100%', background: fbGrad, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Play style={{ width: 18, height: 18, color: `${rating}60` }} /></div>
            }
            {movie.rating > 0 && (
              <div style={{ position: 'absolute', top: 5, left: 5, display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(0,0,0,0.82)', borderRadius: 4, padding: '2px 5px' }}>
                <Star style={{ width: 7, height: 7, color: rating, fill: rating }} />
                <span style={{ fontSize: 8.5, fontWeight: 900, color: rating }}>{movie.rating.toFixed(1)}</span>
              </div>
            )}
            {isOtt && ottC && (
              <div style={{ position: 'absolute', bottom: 5, right: 5, fontSize: 7, fontWeight: 900, padding: '2px 5px', borderRadius: 3, background: ottC, color: '#fff', maxWidth: 52, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {platform}
              </div>
            )}
            {movie.ottDate === 'Coming Soon' && (
              <div style={{ position: 'absolute', bottom: 5, left: 5, fontSize: 7, fontWeight: 900, padding: '2px 5px', borderRadius: 3, background: T.accent, color: '#fff' }}>SOON</div>
            )}
          </div>
          <div style={{ padding: '5px 7px 7px' }}>
            <p style={{ fontSize: wide ? 12 : 10, fontWeight: 700, color: T.text, lineHeight: 1.3, margin: '0 0 2px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontFamily: "'Noto Serif Tamil', 'Noto Serif', Georgia, serif" }}>{movie.title}</p>
            {wide && <p style={{ fontSize: 9.5, color: T.muted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{movie.cast?.slice(0, 2).join(' · ')}</p>}
          </div>
        </div>
      </Link>
    </div>
  )
}

// ── Serial card ───────────────────────────────────────────────────────────────
function SerialCard({ serial }: { serial: typeof serials[0] }) {
  const [err, setErr] = useState(false)
  const has = !err && !!(serial.thumbnail && !serial.thumbnail.includes('default.jpg'))
  const fbGrad = `linear-gradient(135deg, ${T.teal}40 0%, #1a1a2e 100%)`
  const channelColor: Record<string, string> = {
    'Sun TV': '#f59e0b', 'Vijay TV': '#3b82f6', 'Zee Tamil': '#9333ea',
    'Colors Tamil': '#ef4444', 'Kalaignar TV': '#dc2626', 'Star Vijay': '#2563eb',
  }
  const cc = channelColor[serial.channel] ?? T.teal
  return (
    <Link href={`/serials/${serial.slug}`} style={{ textDecoration: 'none', display: 'block' }} className="nt-scard">
      <div style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: `1px solid ${T.border}`, alignItems: 'flex-start' }}>
        <div style={{ flexShrink: 0, width: 60, height: 80, borderRadius: 7, overflow: 'hidden', background: fbGrad, border: `1px solid ${T.border}` }}>
          {has
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={serial.thumbnail} alt={serial.title} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setErr(true)} />
            : <div style={{ width: '100%', height: '100%', background: fbGrad, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Tv2 style={{ width: 16, height: 16, color: `${T.teal}60` }} /></div>
          }
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 8.5, fontWeight: 800, padding: '1px 6px', borderRadius: 3, background: cc, color: '#fff' }}>{serial.channel}</span>
            <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: serial.status === 'Ongoing' ? `${T.green}20` : `${T.muted}18`, color: serial.status === 'Ongoing' ? T.green : T.muted, border: `1px solid ${serial.status === 'Ongoing' ? T.green : T.muted}28` }}>
              {serial.status === 'Ongoing' ? '● Ongoing' : 'Completed'}
            </span>
          </div>
          <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 800, color: T.text, lineHeight: 1.3, fontFamily: "'Noto Serif Tamil', 'Noto Serif', Georgia, serif", display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {serial.title}
          </p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {serial.genre.slice(0, 2).map(g => (
              <span key={g} style={{ fontSize: 8.5, color: T.muted, padding: '1px 5px', borderRadius: 3, background: T.raised, border: `1px solid ${T.border}` }}>{g}</span>
            ))}
            {serial.rating > 0 && <span style={{ fontSize: 9, color: T.gold, fontWeight: 700, marginLeft: 'auto' }}>★ {serial.rating.toFixed(1)}</span>}
          </div>
        </div>
      </div>
    </Link>
  )
}

// ── Tamil Calendar Panel ──────────────────────────────────────────────────────
function CalendarPanel({ all }: { all: NewsItem[] }) {
  const td = useMemo(() => getTamilDate(), [])
  const greg = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const monthInfo = TAMIL_MONTH_INFO[td.tamilMonthEn] ?? null
  const nakshatra = useMemo(() => getTodayNakshatra(), [])
  const dayIdx = new Date().getDay()
  const rahuKalam = RAHU_KALAM[dayIdx]
  const yamagandam = YAMAGANDAM[dayIdx]
  const nallaNeram = NALLA_NERAM[dayIdx]

  const now = new Date()
  const upcoming = FESTIVALS
    .map(f => {
      const d = new Date(now.getFullYear(), f.month - 1, f.day)
      if (d < now) d.setFullYear(d.getFullYear() + 1)
      const diff = Math.ceil((d.getTime() - now.getTime()) / 86400000)
      return { ...f, diff, date: d }
    })
    .filter(f => f.diff <= 90)
    .sort((a, b) => a.diff - b.diff)
    .slice(0, 8)

  const EN_DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

  const TEMPLE_KW = ['கோவில்', 'temple', 'kovil', 'tiruvallur', 'tirupati', 'meenakshi', 'murugan', 'amman', 'அம்மன்', 'ஆலயம்', 'pooja', 'பூஜை', 'thiruvaiyaru', 'brahmotsavam', 'abishekam', 'abhishekam', 'vigraham', 'rameswaram', 'chidambaram', 'sri ranganathar', 'srirangam', 'palani', 'karthigai', 'deepam', 'navratri', 'நவராத்திரி', 'vinayakar', 'விநாயகர்', 'sivarathri', 'vaikasi', 'panguni', 'aadi', 'ஆடி']
  const templeNews = useMemo(() => all.filter(n =>
    TEMPLE_KW.some(kw => (n.title + n.desc).toLowerCase().includes(kw))
  ).slice(0, 5), [all])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }} className="nt-cal-g">

      {/* Today card */}
      <div style={{ background: `linear-gradient(135deg, ${monthInfo?.color ?? T.gold}12 0%, ${T.card} 60%)`, border: `1px solid ${monthInfo?.color ?? T.gold}28`, borderRadius: 12, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ width: 58, height: 58, borderRadius: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: `${monthInfo?.color ?? T.gold}18`, border: `1px solid ${monthInfo?.color ?? T.gold}35`, flexShrink: 0 }}>
            <span style={{ fontSize: 26, fontWeight: 900, color: monthInfo?.color ?? T.gold, lineHeight: 1 }}>{td.day}</span>
            <span style={{ fontSize: 8, color: T.muted, fontWeight: 700, letterSpacing: '0.04em', fontFamily: "'Noto Serif Tamil', serif" }}>{TAMIL_DAYS[td.weekdayIdx]?.slice(0, 4)}</span>
          </div>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: 24, fontWeight: 900, color: T.text, fontFamily: "'Noto Serif Tamil', serif", lineHeight: 1 }}>{td.tamilMonth}</p>
            <p style={{ margin: '0 0 1px', fontSize: 11.5, color: T.muted }}>{td.tamilMonthEn} · {greg}</p>
            <p style={{ margin: 0, fontSize: 10, color: T.dim }}>Tamil Year {td.tamilYear}</p>
          </div>
        </div>

        {/* Day + Nakshatra row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
          <div style={{ padding: '8px 12px', borderRadius: 8, background: T.raised, border: `1px solid ${T.border}` }}>
            <p style={{ margin: '0 0 2px', fontSize: 9, color: T.muted, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>இன்று</p>
            <span style={{ fontSize: 13, fontWeight: 900, color: T.text, fontFamily: "'Noto Serif Tamil', serif" }}>{TAMIL_DAYS[td.weekdayIdx]}</span>
            <span style={{ fontSize: 9, color: T.dim, marginLeft: 6 }}>({EN_DAYS[td.weekdayIdx]})</span>
          </div>
          <div style={{ padding: '8px 12px', borderRadius: 8, background: T.raised, border: `1px solid ${T.purple}28` }}>
            <p style={{ margin: '0 0 2px', fontSize: 9, color: T.muted, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>நட்சத்திரம்</p>
            <span style={{ fontSize: 13, fontWeight: 900, color: T.purple, fontFamily: "'Noto Serif Tamil', serif" }}>{nakshatra}</span>
          </div>
        </div>

        {/* Month significance */}
        {monthInfo && (
          <div style={{ padding: '10px 12px', borderRadius: 8, background: `${monthInfo.color}0d`, border: `1px solid ${monthInfo.color}22`, marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: monthInfo.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{monthInfo.season}</span>
              <span style={{ fontSize: 9, color: T.dim }}>·</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: T.muted }}>தெய்வம்: <span style={{ color: monthInfo.color, fontFamily: "'Noto Serif Tamil', serif" }}>{monthInfo.deity}</span></span>
            </div>
            <p style={{ margin: 0, fontSize: 11, color: T.sub, lineHeight: 1.5 }}>{monthInfo.significance}</p>
          </div>
        )}

        {/* Festival today */}
        {td.festival && (
          <div style={{ padding: '10px 12px', borderRadius: 8, background: `${td.festival.color}12`, border: `1px solid ${td.festival.color}30`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Star style={{ width: 14, height: 14, color: td.festival.color, flexShrink: 0 }} />
            <div>
              <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 900, color: td.festival.color }}>{td.festival.name}</p>
              <p style={{ margin: 0, fontSize: 10, color: T.muted, fontFamily: "'Noto Serif Tamil', serif" }}>{td.festival.tamil}</p>
            </div>
          </div>
        )}
      </div>

      {/* Panchangam — auspicious timings */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
        <SH label="பஞ்சாங்கம்" color='#f59e0b' icon={Sun} sub="Today's auspicious timings (IST)" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
          <div style={{ padding: '10px 10px', borderRadius: 8, background: `${T.green}10`, border: `1px solid ${T.green}25`, textAlign: 'center' }}>
            <p style={{ margin: '0 0 4px', fontSize: 8.5, fontWeight: 800, color: T.green, textTransform: 'uppercase', letterSpacing: '0.06em' }}>நல்ல நேரம்</p>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: T.text }}>{nallaNeram}</p>
          </div>
          <div style={{ padding: '10px 10px', borderRadius: 8, background: `${T.red}10`, border: `1px solid ${T.red}25`, textAlign: 'center' }}>
            <p style={{ margin: '0 0 4px', fontSize: 8.5, fontWeight: 800, color: T.red, textTransform: 'uppercase', letterSpacing: '0.06em' }}>ராகு காலம்</p>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: T.text }}>{rahuKalam}</p>
          </div>
          <div style={{ padding: '10px 10px', borderRadius: 8, background: `${T.purple}10`, border: `1px solid ${T.purple}25`, textAlign: 'center' }}>
            <p style={{ margin: '0 0 4px', fontSize: 8.5, fontWeight: 800, color: T.purple, textTransform: 'uppercase', letterSpacing: '0.06em' }}>யமகண்டம்</p>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: T.text }}>{yamagandam}</p>
          </div>
        </div>

        {/* Upcoming festivals */}
        <SH label="Upcoming Festivals" color={T.gold} icon={Star} />
        {upcoming.map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < upcoming.length - 1 ? `1px solid ${T.border}` : 'none' }}>
            <div style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${f.color}15`, border: `1px solid ${f.color}30` }}>
              <span style={{ fontSize: 9, fontWeight: 900, color: f.color, textAlign: 'center', lineHeight: 1.2 }}>{f.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: '0 0 2px', fontSize: 12, fontWeight: 800, color: T.text }}>{f.name}</p>
              <p style={{ margin: 0, fontSize: 10, color: T.muted, fontFamily: "'Noto Serif Tamil', serif" }}>{f.tamil}</p>
            </div>
            <span style={{ flexShrink: 0, fontSize: 9.5, fontWeight: 800, padding: '2px 8px', borderRadius: 99, background: `${f.color}15`, color: f.color }}>
              {f.diff === 0 ? 'Today' : f.diff === 1 ? 'Tomorrow' : `${f.diff}d`}
            </span>
          </div>
        ))}
      </div>

      {/* Tamil Nadu Kovils — Famous Temples */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
        <SH label="கோவில்கள்" color='#e11d48' icon={Star} sub="Famous Tamil Nadu temples · Pooja timings (IST)" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
          {/* Live temple news from RSS feeds */}
          {templeNews.length > 0 && (
            <div style={{ marginBottom: 10, padding: '10px 12px', borderRadius: 10, background: `#e11d4808`, border: `1px solid #e11d4820` }}>
              <p style={{ margin: '0 0 8px', fontSize: 9.5, fontWeight: 800, color: '#e11d48', textTransform: 'uppercase', letterSpacing: '0.08em' }}>கோவில் செய்திகள் · Live Temple News</p>
              {templeNews.map((n, i) => (
                <a key={i} href={goLink(n.link, 'temple')} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '6px 0', borderBottom: i < templeNews.length - 1 ? `1px solid ${T.border}` : 'none', textDecoration: 'none' }}>
                  <Rss style={{ width: 10, height: 10, color: '#e11d48', flexShrink: 0, marginTop: 2 }} />
                  <p style={{ margin: 0, fontSize: 11, color: T.text, lineHeight: 1.45, fontFamily: /[஀-௿]/.test(n.title) ? "'Noto Serif Tamil', serif" : 'inherit' }}>{n.title}</p>
                </a>
              ))}
            </div>
          )}
          {KOVILS.map((k, i) => (
            <div key={i} style={{ padding: '11px 12px', borderRadius: 10, background: `${k.color}08`, border: `1px solid ${k.color}20`, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: `${k.color}15`, border: `1px solid ${k.color}30` }}>
                <span style={{ fontSize: 18, lineHeight: 1 }}>🛕</span>
                <span style={{ fontSize: 7, color: k.color, fontWeight: 800, marginTop: 2 }}>{k.city.slice(0, 6)}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: T.text }}>{k.name}</p>
                  <span style={{ fontSize: 9, fontWeight: 700, color: k.color, padding: '1px 6px', borderRadius: 4, background: `${k.color}15` }}>{k.city}</span>
                </div>
                <p style={{ margin: '0 0 4px', fontSize: 10.5, color: T.muted, fontFamily: "'Noto Serif Tamil', serif" }}>{k.tamil} · {k.deity}</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 9, color: T.sub, background: `${T.green}12`, padding: '2px 7px', borderRadius: 4, border: `1px solid ${T.green}20` }}>🌅 {k.morning}</span>
                  <span style={{ fontSize: 9, color: T.sub, background: `${T.gold}10`, padding: '2px 7px', borderRadius: 4, border: `1px solid ${T.gold}20` }}>🌆 {k.evening}</span>
                </div>
                <p style={{ margin: '5px 0 0', fontSize: 9.5, color: T.dim, lineHeight: 1.4 }}>{k.famous}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// TABS
// ════════════════════════════════════════════════════════════════════════════

// ── Tab: News ─────────────────────────────────────────────────────────────────
function NewsTab({ all, loading, cinemaGrid }: { all: NewsItem[]; loading: boolean; cinemaGrid: CinemaMovie[] }) {
  const [newsCat, setNewsCat] = useState('all')
  const [showMore, setShowMore] = useState(false)
  const [heroIdx, setHeroIdx] = useState(0)
  const heroTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const filtered = useMemo(() => {
    if (newsCat === 'all') return all
    if (newsCat === 'sports') {
      const tagged = all.filter(n => n.category === 'sports')
      if (tagged.length >= 4) return tagged
      return [...tagged, ...all.filter(n => SPORTS_KW.some(kw => (n.title + n.desc).toLowerCase().includes(kw)) && n.category !== 'sports')]
    }
    return all.filter(n => n.category === newsCat)
  }, [all, newsCat])

  const WIKI_GENERIC = ['Tamil_country','Tamil_Nadu_state','Tamil_language_inscription','Flag_of_Tamil_Nadu']
  const heroPool = useMemo(() => {
    const withReal = filtered.filter(n => n.imageUrl && !WIKI_GENERIC.some(g => n.imageUrl!.includes(g)))
    return (withReal.length >= 2 ? withReal : filtered).slice(0, 5)
  }, [filtered])

  const heroItem = heroPool[heroIdx] ?? heroPool[0] ?? null
  const trending = useMemo(() => all.slice(0, 12), [all])

  useEffect(() => {
    if (heroPool.length <= 1) return
    if (heroTimer.current) clearInterval(heroTimer.current)
    heroTimer.current = setInterval(() => setHeroIdx(p => (p + 1) % heroPool.length), 10000)
    return () => { if (heroTimer.current) clearInterval(heroTimer.current) }
  }, [heroPool.length])

  const listStart = filtered.length >= 3 ? 3 : 1
  const listItems = showMore ? filtered.slice(listStart) : filtered.slice(listStart, listStart + 24)

  return (
    <div>
      {/* News category sub-tabs */}
      <div style={{ display: 'flex', gap: 3, padding: '8px 0', overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 14 }}>
        {NEWS_CATS.map(cat => {
          const active = newsCat === cat.key
          const Ic = cat.icon
          return (
            <button key={cat.key} onClick={() => { setNewsCat(cat.key); setShowMore(false) }}
              style={{ flexShrink: 0, position: 'relative', display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', fontSize: 11.5, fontWeight: active ? 800 : 500, color: active ? '#fff' : T.muted, background: 'transparent', border: 'none', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {active && <motion.span layoutId="news-cat-pill" style={{ position: 'absolute', inset: 0, borderRadius: 6, background: cat.color, zIndex: -1 }} transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
              <Ic style={{ width: 10, height: 10 }} />
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* Hero + sidebar grid */}
      <div className="nt-top" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14, marginBottom: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading ? (
            <><Sk h={200} r={10} mb={10} /><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}><Sk h={120} /><Sk h={120} /></div></>
          ) : heroItem ? (
            <>
              {heroPool.length > 1 && (
                <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                  {heroPool.map((_, i) => (
                    <button key={i} onClick={() => setHeroIdx(i)} style={{ width: i === heroIdx ? 18 : 4, height: 4, borderRadius: 99, background: i === heroIdx ? T.accent : 'rgba(255,255,255,0.14)', border: 'none', cursor: 'pointer', padding: 0, transition: 'width 0.22s ease, background 0.22s ease' }} />
                  ))}
                </div>
              )}
              <AnimatePresence mode="wait">
                <motion.div key={heroItem.link} initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
                  <HeroCard item={heroItem} idx={heroIdx} />
                </motion.div>
              </AnimatePresence>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {filtered.slice(1, 3).map((it, i) => <StoryTile key={i} item={it} idx={i} />)}
              </div>
            </>
          ) : null}
        </div>
        {/* desktop trending sidebar */}
        <div className="nt-tend" style={{ display: 'none' }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '13px 13px 8px', position: 'sticky', top: 110 }}>
            <SH label="Trending" color={T.gold} icon={TrendingUp} />
            {loading
              ? Array.from({ length: 9 }).map((_, i) => <Sk key={i} h={42} r={4} mb={6} />)
              : trending.map((it, i) => <TrendRow key={i} item={it} rank={i + 1} />)
            }
          </div>
        </div>
      </div>

      {/* Cinema strip */}
      <div style={{ background: `linear-gradient(135deg, ${T.purple}10 0%, ${T.card} 60%)`, border: `1px solid ${T.purple}20`, borderRadius: 10, padding: '12px 12px 14px', marginBottom: 14 }}>
        <SH label="சினிமா" color={T.purple} href="/movies" icon={Film} sub="Latest Tamil releases" />
        <div className="nt-cm-g" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 7 }}>
          {cinemaGrid.slice(0, 10).map(m => <CinemaCard key={m.id} movie={m} />)}
        </div>
        <div className="nt-cm-s" style={{ display: 'none', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
          {cinemaGrid.slice(0, 8).map(m => <div key={m.id} style={{ flexShrink: 0, width: 88 }}><CinemaCard movie={m} /></div>)}
        </div>
      </div>

      {/* Music strip */}
      <MusicStrip />

      {/* Main feed + sidebar */}
      <div className="nt-low" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '12px 12px 0' }}>
              <SH label="செய்திகள்" color={T.accent} icon={Newspaper} />
            </div>
            {loading
              ? <div style={{ padding: '0 12px 10px' }}>{Array.from({ length: 10 }).map((_, i) => <Sk key={i} h={60} r={4} mb={7} />)}</div>
              : (
                <motion.div variants={stagger} initial="hidden" animate="visible" style={{ padding: '0 0 4px' }}>
                  {listItems.map((item, i) => (
                    <div key={item.link + i}>
                      <NewsRow item={item} idx={i} />
                      {(i + 1) % 8 === 0 && <ins className="adsbygoogle" style={{ display: 'block', margin: '4px 12px' }} data-ad-format="fluid" data-ad-layout-key="-fb+5w+4e-db+86" data-ad-client="ca-pub-4237294630161176" data-ad-slot="auto" />}
                    </div>
                  ))}
                </motion.div>
              )
            }
            {!loading && filtered.length > listStart + 24 && (
              <div style={{ padding: '10px 12px 12px' }}>
                <button onClick={() => setShowMore(s => !s)} className="nt-more"
                  style={{ width: '100%', padding: '9px 0', borderRadius: 7, background: T.raised, border: `1px solid ${T.border2}`, color: T.muted, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                  {showMore ? 'Show less' : `Load more · ${filtered.length - listStart - 24} more`}
                  <ChevronRight style={{ width: 11, height: 11, transform: showMore ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="nt-side" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 12px' }}>
            <SH label="IPL Live" color={T.green} />
            <div style={{ borderRadius: 7, overflow: 'hidden', border: `1px solid ${T.border}` }}>
              <CricketWidget compact />
            </div>
          </div>
          <div className="nt-tend-m">
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 12px' }}>
              <SH label="Trending" color={T.gold} icon={TrendingUp} />
              {loading ? Array.from({ length: 6 }).map((_, i) => <Sk key={i} h={40} r={4} mb={5} />) : trending.slice(0, 8).map((it, i) => <TrendRow key={i} item={it} rank={i + 1} />)}
            </div>
          </div>
          <AdUnit size="rectangle" />
        </div>
      </div>
    </div>
  )
}

// ── Tab: Cinema ───────────────────────────────────────────────────────────────
function CinemaTab({ cinemaNews, allCinema }: { cinemaNews: NewsItem[]; allCinema: CinemaMovie[] }) {
  const comingSoon = allCinema.filter(m => m.ottDate === 'Coming Soon')
  const nowOTT     = allCinema.filter(m => m.ottDate && m.ottDate !== 'Coming Soon' && freshOtt(m.ottDate))
  const topRated   = [...allCinema].sort((a, b) => b.rating - a.rating).slice(0, 16)

  // Celebrity gossip / trending people from news feed
  const GOSSIP_KW = ['ravi mohan', 'gayathrie', 'divorce', 'romance', 'wedding', 'காதல்', 'திருமணம்', 'விவாகரத்து', 'breakup', 'anirudh', 'sai pallavi', 'nayanthara', 'trisha', 'samantha']
  const celebNews = cinemaNews.filter(n =>
    GOSSIP_KW.some(kw => (n.title + n.desc).toLowerCase().includes(kw))
  ).slice(0, 6)

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible">

      {/* Vijay / TVK Cinema spotlight */}
      <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(239,68,68,0.06) 50%, #111118 100%)', border: '1px solid rgba(245,158,11,0.24)', borderRadius: 12, padding: 14, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Zap style={{ width: 18, height: 18, color: T.gold }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 900, color: T.text }}>Vijay × TVK</p>
            <p style={{ margin: 0, fontSize: 10.5, color: T.muted }}>Thalapathy turns politician · TN CM Race 2026</p>
          </div>
          <span style={{ fontSize: 7.5, fontWeight: 900, padding: '2px 7px', borderRadius: 3, background: T.red, color: '#fff' }}>HOT</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { label: 'Party Founded', value: 'Feb 2024', icon: '🗓' },
            { label: 'Party Name', value: 'TVK', icon: '⚡' },
            { label: 'TN Election', value: '2026 Goal', icon: '🗳' },
            { label: 'Members', value: '10 Lakh+', icon: '👥' },
          ].map((s, i) => (
            <div key={i} style={{ padding: '9px 11px', borderRadius: 8, background: `${T.gold}08`, border: `1px solid ${T.gold}18`, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>{s.icon}</span>
              <div>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 900, color: T.gold }}>{s.value}</p>
                <p style={{ margin: 0, fontSize: 9, color: T.muted }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10, padding: '9px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.28)', border: `1px solid ${T.border}` }}>
          <p style={{ margin: 0, fontSize: 11, color: T.sub, lineHeight: 1.6 }}>
            After his final film <strong style={{ color: T.text }}>GOAT (2024)</strong>, Thalapathy Vijay officially launched <strong style={{ color: T.gold }}>Tamilaga Vettri Kazhagam (TVK)</strong>. With party conferences drawing lakhs and a clear 2026 election agenda, he&apos;s pivoting from cinema to CM race — making him Tamil Nadu&apos;s most talked-about political wildcard.
          </p>
        </div>
      </div>

      {/* Music strip */}
      <MusicStrip />

      {/* Celebrity gossip */}
      {celebNews.length > 0 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
          <SH label="Trending Celebs" color='#ec4899' icon={Users} sub="Latest gossip & news" />
          {celebNews.map((item, i) => <NewsRow key={i} item={item} idx={i} />)}
        </div>
      )}

      {/* Coming soon */}
      {comingSoon.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <SH label="Coming Soon" color={T.accent} icon={Star} sub="OTT premiere confirmed" />
          <div style={{ display: 'flex', gap: 9, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
            {comingSoon.map(m => <div key={m.id} style={{ flexShrink: 0, width: 110 }}><CinemaCard movie={m} /></div>)}
          </div>
        </div>
      )}

      {/* Now on OTT */}
      {nowOTT.length > 0 && (
        <div style={{ marginBottom: 16, background: `linear-gradient(135deg, ${T.purple}08 0%, ${T.card} 55%)`, border: `1px solid ${T.purple}18`, borderRadius: 10, padding: 14 }}>
          <SH label="Now on OTT" color={T.purple} href="/movies" icon={Tv2} sub="Released last 10 weeks" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }} className="nt-ott-g">
            {nowOTT.slice(0, 8).map(m => <CinemaCard key={m.id} movie={m} wide />)}
          </div>
        </div>
      )}

      {/* Top rated */}
      <div>
        <SH label="Top Rated" color={T.gold} href="/movies" icon={Star} />
        <div className="nt-cm-g" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 9 }}>
          {topRated.map(m => <CinemaCard key={m.id} movie={m} />)}
        </div>
      </div>
    </motion.div>
  )
}

// ── On-air utils ──────────────────────────────────────────────────────────────
function getISTMinutes() {
  const now = new Date()
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  const ist = new Date(utc + 5.5 * 3600000)
  return ist.getHours() * 60 + ist.getMinutes()
}
function timeToMin(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
function isOnAir(serial: typeof serials[0]) {
  if (!serial.airTime) return false
  const now = getISTMinutes()
  const start = timeToMin(serial.airTime)
  return now >= start && now <= start + 30
}
function minutesUntil(t: string) {
  return timeToMin(t) - getISTMinutes()
}

// ── Tab: Serials ──────────────────────────────────────────────────────────────
function SerialsTab() {
  const [nowMin, setNowMin] = useState(getISTMinutes())
  useEffect(() => {
    const t = setInterval(() => setNowMin(getISTMinutes()), 30000)
    return () => clearInterval(t)
  }, [])

  const ongoing  = serials.filter(s => s.status === 'Ongoing' && s.language === 'Tamil')
  const channels = [...new Set(ongoing.map(s => s.channel))].sort()
  const CC: Record<string, string> = { 'Sun TV': '#f59e0b', 'Vijay TV': '#3b82f6', 'Zee Tamil': '#9333ea', 'Colors Tamil': '#ef4444', 'Kalaignar TV': '#dc2626', 'Star Vijay': '#2563eb' }

  // On-air right now
  const onNow = ongoing.filter(s => {
    if (!s.airTime) return false
    const start = timeToMin(s.airTime)
    return nowMin >= start && nowMin <= start + 30
  })

  // Coming up in next 90 min
  const comingUp = ongoing.filter(s => {
    if (!s.airTime) return false
    const diff = timeToMin(s.airTime) - nowMin
    return diff > 0 && diff <= 90
  }).sort((a, b) => timeToMin(a.airTime!) - timeToMin(b.airTime!))

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible">

      {/* On Now banner */}
      {onNow.length > 0 && (
        <div style={{ marginBottom: 14, background: `linear-gradient(135deg, ${T.red}12 0%, ${T.card} 55%)`, border: `1px solid ${T.red}28`, borderRadius: 10, padding: '12px 14px' }}>
          <SH label="இப்போது ஒளிபரப்பு" color={T.red} icon={Radio} sub="On Air Now (IST)" />
          {onNow.map(s => {
            const c = CC[s.channel] ?? T.teal
            return (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: `1px solid ${T.border}` }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: T.red, flexShrink: 0, animation: 'nt-ping 1.4s ease-in-out infinite' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: T.text, fontFamily: "'Noto Serif Tamil', 'Noto Serif', serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</p>
                </div>
                <span style={{ fontSize: 8.5, fontWeight: 800, padding: '2px 7px', borderRadius: 3, background: c, color: '#fff', flexShrink: 0 }}>{s.channel}</span>
                <span style={{ fontSize: 9, color: T.red, fontWeight: 800, flexShrink: 0 }}>{s.airTime} IST</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Coming up */}
      {comingUp.length > 0 && (
        <div style={{ marginBottom: 14, background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 14px' }}>
          <SH label="Coming Up" color={T.teal} icon={Clock} sub="Next 90 minutes" />
          {comingUp.slice(0, 6).map(s => {
            const c = CC[s.channel] ?? T.teal
            const diff = timeToMin(s.airTime!) - nowMin
            return (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: `1px solid ${T.border}` }}>
                <span style={{ flexShrink: 0, fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 3, background: `${T.teal}1a`, color: T.teal, border: `1px solid ${T.teal}30`, whiteSpace: 'nowrap' }}>
                  {diff}m
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: T.text, fontFamily: "'Noto Serif Tamil', 'Noto Serif', serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</p>
                </div>
                <span style={{ fontSize: 8.5, fontWeight: 800, padding: '2px 6px', borderRadius: 3, background: c, color: '#fff', flexShrink: 0 }}>{s.channel}</span>
                <span style={{ fontSize: 9, color: T.muted, flexShrink: 0 }}>{s.airTime}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Channel chips */}
      <div style={{ marginBottom: 10, display: 'flex', gap: 5, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {channels.map(ch => {
          const c = CC[ch] ?? T.teal
          return (
            <div key={ch} style={{ flexShrink: 0, padding: '4px 12px', borderRadius: 99, background: `${c}18`, border: `1px solid ${c}30`, fontSize: 10.5, fontWeight: 800, color: c, whiteSpace: 'nowrap' }}>{ch}</div>
          )
        })}
      </div>

      {channels.map(ch => {
        const chSerials = ongoing.filter(s => s.channel === ch)
        if (!chSerials.length) return null
        const c = CC[ch] ?? T.teal
        return (
          <div key={ch} style={{ marginBottom: 14, background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 14px' }}>
            <SH label={ch} color={c} icon={Tv2} sub={`${chSerials.length} ongoing`} />
            {chSerials.map(s => (
              <div key={s.id} style={{ position: 'relative' }}>
                {s.airTime && nowMin >= timeToMin(s.airTime) && nowMin <= timeToMin(s.airTime) + 30 && (
                  <div style={{ position: 'absolute', right: 0, top: 14, fontSize: 8, fontWeight: 900, padding: '2px 6px', borderRadius: 3, background: T.red, color: '#fff', zIndex: 2 }}>ON AIR</div>
                )}
                <SerialCard serial={s} />
              </div>
            ))}
          </div>
        )
      })}

      <div style={{ marginTop: 8, textAlign: 'center' }}>
        <Link href="/serials" style={{ fontSize: 12, fontWeight: 700, color: T.teal, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, padding: '9px 20px', borderRadius: 8, border: `1px solid ${T.teal}30`, background: `${T.teal}08` }}>
          View all Tamil serials <ArrowUpRight style={{ width: 12, height: 12 }} />
        </Link>
      </div>
    </motion.div>
  )
}

// ── Tab: TVK ──────────────────────────────────────────────────────────────────
function TVKTab({ all, loading }: { all: NewsItem[]; loading: boolean }) {
  const tvkItems = useMemo(() => {
    const tagged = all.filter(n =>
      n.category === 'tvk' ||
      /tvk|vijay|தாளபதி|வெற்றி கழகம்|tamilaga|2026 election|tn election/i.test(n.title + n.desc)
    )
    return tagged.length ? tagged : [TVK_PROMO, ...all.filter(n => n.category === 'politics').slice(0, 8)]
  }, [all])

  const heroItem = tvkItems.find(n => n.imageUrl) ?? tvkItems[0] ?? TVK_PROMO

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible">
      {/* TVK banner */}
      <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(99,102,241,0.08) 50%, #111118 100%)', border: '1px solid rgba(245,158,11,0.22)', borderRadius: 10, padding: 14, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(245,158,11,0.18)', border: '1px solid rgba(245,158,11,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Zap style={{ width: 20, height: 20, color: T.gold }} />
        </div>
        <div>
          <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 900, color: T.text }}>TVK — Tamilaga Vettri Kazhagam</p>
          <p style={{ margin: 0, fontSize: 11, color: T.muted }}>Thalapathy Vijay's party · Tamil Nadu 2026 elections · Real-time updates</p>
        </div>
        <span style={{ marginLeft: 'auto', flexShrink: 0, fontSize: 8, fontWeight: 900, padding: '3px 7px', borderRadius: 4, background: T.red, color: '#fff', animation: 'nt-ping-bg 2s ease-in-out infinite' }}>LIVE</span>
      </div>

      {loading ? (
        <><Sk h={200} r={10} mb={12} />{Array.from({ length: 6 }).map((_, i) => <Sk key={i} h={62} r={4} mb={7} />)}</>
      ) : (
        <>
          {heroItem && (
            <div style={{ marginBottom: 14 }}>
              <HeroCard item={heroItem} idx={0} />
            </div>
          )}
          <motion.div variants={stagger} initial="hidden" animate="visible" style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
            {tvkItems.slice(1, 20).map((item, i) => <NewsRow key={i} item={item} idx={i} />)}
          </motion.div>
        </>
      )}

      <TVKSpotlight />
    </motion.div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════
export default function HomeNewsPortal() {
  const [data, setData]          = useState<ApiResponse | null>(null)
  const [loading, setLoading]    = useState(true)
  const [refreshing, setRefresh] = useState(false)
  const [tab, setTab]            = useState('news')
  const [secAgo, setSecAgo]      = useState(0)
  const [showHelplines, setShowHelplines] = useState(false)
  const [liveMovies, setLiveMovies] = useState<CinemaMovie[]>([])

  // Fetch live Tamil OTT data from TMDB (via /api/ott)
  useEffect(() => {
    fetch('/api/ott', { cache: 'no-store', signal: AbortSignal.timeout(8000) })
      .then(r => r.ok ? r.json() : null)
      .then((json: { movies?: CinemaMovie[] } | null) => {
        if (json?.movies && json.movies.length >= 4) setLiveMovies(json.movies)
      })
      .catch(() => { /* keep static fallback */ })
  }, [])

  const cinemaGrid = liveMovies.length >= 4
    ? liveMovies.filter(m => freshOtt(m.ottDate) || m.ottDate === 'Coming Soon' || (m.year ?? 0) >= 2025).slice(0, 20)
    : STATIC_CINEMA_GRID
  const allCinema = liveMovies.length >= 4 ? liveMovies : STATIC_ALL_CINEMA

  const fetchNews = useCallback(async (manual = false) => {
    if (manual) setRefresh(true)
    else {
      try { const ss = sessionStorage.getItem(SS_KEY); if (ss) { const { d, at } = JSON.parse(ss); if (Date.now() - at < CACHE_TTL) { setData(d); setLoading(false); return } } } catch { /* ignore */ }
      try { const ls = localStorage.getItem(LS_KEY); if (ls) { const { d, at } = JSON.parse(ls); if (Date.now() - at < LS_CACHE_TTL) { setData(d); setLoading(false) } } } catch { /* ignore */ }
    }
    try {
      const res = await fetch('/api/tamil-media-news', { cache: 'no-store', signal: AbortSignal.timeout(12000) })
      if (!res.ok) return
      const json: ApiResponse = await res.json()
      setData(json); setSecAgo(0)
      const p = JSON.stringify({ d: json, at: Date.now() })
      try { sessionStorage.setItem(SS_KEY, p) } catch { /* ignore */ }
      try { localStorage.setItem(LS_KEY, p) } catch { /* ignore */ }
    } catch { /* keep stale */ }
    finally { setLoading(false); setRefresh(false) }
  }, [])

  useEffect(() => {
    fetchNews()
    const r = setInterval(fetchNews, REFRESH_MS)
    const t = setInterval(() => setSecAgo(s => s + 1), 1000)
    return () => { clearInterval(r); clearInterval(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const all = data?.news ?? []
  const sourceCount = useMemo(() => new Set(all.map(n => n.source)).size, [all])
  const tamilDate = useMemo(() => getTamilDate(), [])
  const freshLabel = secAgo < 60 ? `${secAgo}s` : `${Math.floor(secAgo / 60)}m`
  const cinemaNews = useMemo(() => all.filter(n => n.category === 'cinema'), [all])

  // Featured movie — prefer one with a verified thumbnail
  const featuredMovie = cinemaGrid.find(m => hasThumb(m)) ?? cinemaGrid[0]

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text }}>

      {/* ── TN HELPLINES MODAL ──────────────────────────────────────────── */}
      {showHelplines && <TNHelplinesModal onClose={() => setShowHelplines(false)} />}

      {/* ── BREAKING TICKER ─────────────────────────────────────────────── */}
      {!loading && <Ticker items={all} />}

      {/* ── MAIN TAB NAV ────────────────────────────────────────────────── */}
      <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, position: 'sticky', top: 56, zIndex: 40 }}>
        <div className="nt-w" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', overflowX: 'auto', scrollbarWidth: 'none', gap: 2, padding: '8px 0' }}>
            {TABS.map(t => {
              const active = tab === t.key
              const Ic = t.icon
              return (
                <button key={t.key} onClick={() => setTab(t.key)}
                  style={{ flexShrink: 0, position: 'relative', display: 'flex', alignItems: 'center', gap: 5, padding: '6px 13px', fontSize: 12, fontWeight: active ? 800 : 500, color: active ? '#fff' : T.muted, background: 'transparent', border: 'none', borderRadius: 7, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {active && <motion.span layoutId="main-tab-pill" style={{ position: 'absolute', inset: 0, borderRadius: 7, background: t.color, zIndex: -1 }} transition={{ type: 'spring', stiffness: 480, damping: 36 }} />}
                  <Ic style={{ width: 11, height: 11 }} />
                  <span className="nt-tab-label">{t.label}</span>
                  {'badge' in t && t.badge && (
                    <span style={{ fontSize: 7, fontWeight: 900, padding: '1px 4px', borderRadius: 2, background: 'rgba(255,255,255,0.22)', color: '#fff' }}>{t.badge}</span>
                  )}
                </button>
              )
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, paddingLeft: 8 }}>
            <button onClick={() => setShowHelplines(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 5, background: '#ef444412', border: '1px solid #ef444428', cursor: 'pointer', lineHeight: 0 }}>
              <Phone style={{ width: 9, height: 9, color: '#ef4444' }} />
              <span style={{ fontSize: 9, fontWeight: 800, color: '#ef4444' }}>TN Help</span>
            </button>
            <span style={{ fontSize: 9.5, color: T.dim }}>{refreshing ? '…' : freshLabel}</span>
            <button onClick={() => fetchNews(true)} disabled={refreshing}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.dim, padding: 3, lineHeight: 0 }}>
              <RefreshCw style={{ width: 10, height: 10, animation: refreshing ? 'nt-spin 1s linear infinite' : 'none' }} />
            </button>
          </div>
        </div>
      </div>

      {/* ── STAT BAR ────────────────────────────────────────────────────── */}
      <StatBar newsCount={all.length} sourceCount={sourceCount} tamilDate={tamilDate} festival={tamilDate.festival} />

      <div className="nt-w nt-vpad">

        {/* ── Featured movie banner ─────────────────────────────────────── */}
        {featuredMovie && tab === 'news' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }} style={{ marginBottom: 14 }}>
            <Link href={`/movies/${featuredMovie.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
              <div className="nt-feat" style={{ background: `linear-gradient(135deg, rgba(0,0,0,0.72) 0%, ${T.card} 55%)`, border: `1px solid ${T.border2}`, borderRadius: 10, padding: '10px 13px', display: 'flex', alignItems: 'center', gap: 11, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 50% 80% at 0% 50%, ${rc(featuredMovie.rating)}0e 0%, transparent 65%)`, pointerEvents: 'none' }} />
                <div style={{ flexShrink: 0, width: 44, height: 66, borderRadius: 5, overflow: 'hidden', border: `1px solid ${T.border2}`, background: `linear-gradient(160deg, ${rc(featuredMovie.rating)}40 0%, #1a1a2e 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {hasThumb(featuredMovie)
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={featuredMovie.thumbnail} alt={featuredMovie.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    : <Film style={{ width: 16, height: 16, color: `${rc(featuredMovie.rating)}80` }} />
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 8, fontWeight: 900, padding: '2px 7px', borderRadius: 3, background: T.accent, color: '#fff', letterSpacing: '0.06em' }}>{featuredMovie.badge ?? 'NEW RELEASE'}</span>
                    <span style={{ fontSize: 8.5, color: T.gold, fontWeight: 800 }}>★ {featuredMovie.rating.toFixed(1)}</span>
                  </div>
                  <p style={{ margin: '0 0 2px', fontSize: 13.5, fontWeight: 800, color: T.text, fontFamily: "'Noto Serif Tamil', 'Noto Serif', Georgia, serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{featuredMovie.title}</p>
                  <p style={{ margin: 0, fontSize: 10.5, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{featuredMovie.cast?.slice(0, 3).join(' · ')}</p>
                </div>
                <ArrowUpRight style={{ width: 13, height: 13, color: T.dim, flexShrink: 0 }} />
              </div>
            </Link>
          </motion.div>
        )}

        {/* ── TAB CONTENT ─────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
            {tab === 'news'     && <NewsTab all={all} loading={loading} cinemaGrid={cinemaGrid} />}
            {tab === 'cinema'   && <CinemaTab cinemaNews={cinemaNews} allCinema={allCinema} />}
            {tab === 'serials'  && <SerialsTab />}
            {tab === 'calendar' && <CalendarPanel all={all} />}
            {tab === 'tvk'      && <TVKTab all={all} loading={loading} />}
          </motion.div>
        </AnimatePresence>

      </div>

      {tab !== 'tvk' && <TVKSpotlight />}

      <div className="nt-w" style={{ paddingBottom: 24 }}>
        <AdUnit size="banner" />
      </div>

      <style>{`
        @keyframes nt-marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes nt-ping    { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.3;transform:scale(1.5)} }
        @keyframes nt-spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes nt-shimmer { 0%{opacity:0.22} 50%{opacity:0.5} 100%{opacity:0.22} }

        /* Wrapper */
        .nt-w { max-width: 1280px; margin: 0 auto; padding-left: 14px; padding-right: 14px; }
        @media(min-width:640px)  { .nt-w { padding-left: 20px; padding-right: 20px; } }
        @media(min-width:1024px) { .nt-w { padding-left: 28px; padding-right: 28px; } }
        .nt-vpad { padding-top: 14px; padding-bottom: 8px; }

        /* Main tabs — show English labels only on mobile to save space */
        @media(max-width:400px) {
          .nt-tab-label { font-size: 0; }
          .nt-tab-label::after { font-size: 11px; content: attr(data-en); }
        }

        /* Top hero section */
        @media(min-width:960px) {
          .nt-top  { grid-template-columns: 1fr 268px !important; align-items: start; }
          .nt-tend { display: block !important; }
          .nt-tend-m { display: none !important; }
        }

        /* Cinema grids */
        @media(min-width:1024px) { .nt-cm-g { grid-template-columns: repeat(10,1fr) !important; } .nt-cm-s { display:none !important; } }
        @media(min-width:640px) and (max-width:1023px) { .nt-cm-g { grid-template-columns: repeat(5,1fr) !important; } .nt-cm-s { display:none !important; } }
        @media(max-width:639px)  { .nt-cm-g { display:none !important; } .nt-cm-s { display:flex !important; } }

        /* OTT grid */
        @media(max-width:639px)  { .nt-ott-g { grid-template-columns: repeat(2,1fr) !important; } }

        /* Lower grid */
        @media(min-width:960px) { .nt-low { grid-template-columns: 1fr 268px !important; align-items: start; } }

        /* Calendar two-col */
        @media(min-width:768px) { .nt-cal-g { grid-template-columns: 1fr 1fr !important; } }

        /* Hero zoom */
        .nt-hero { transition: transform 0.22s cubic-bezier(.23,1,.32,1); }
        .nt-hero:hover { transform: scale(1.006); }

        /* News row */
        .nt-row { transition: background 0.1s ease; }
        .nt-row:hover { background: rgba(255,255,255,0.03) !important; }

        /* Story tile */
        .nt-tile { transition: opacity 0.14s; }
        .nt-tile:hover { opacity: 0.75; }

        /* Cinema card */
        .nt-ccard { transition: transform 0.16s ease; }
        .nt-ccard:hover { transform: translateY(-3px); }

        /* Serial card */
        .nt-scard { transition: background 0.1s; }
        .nt-scard:hover { background: rgba(255,255,255,0.02); }

        /* Feature banner */
        .nt-feat { transition: border-color 0.15s, transform 0.15s; }
        .nt-feat:hover { border-color: rgba(255,255,255,0.18) !important; transform: translateY(-1px); }

        /* Trending row */
        .nt-trow { transition: background 0.1s; }
        .nt-trow:hover { background: rgba(255,255,255,0.03); }

        /* Load more */
        .nt-more:hover { background: rgba(255,255,255,0.055) !important; }
      `}</style>
    </div>
  )
}
