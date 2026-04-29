'use client'

/**
 * TamilCalendar — shows today's Tamil date, month, year (Vikrama Samvat / Tamil solar calendar),
 * current Tamil month name, and any special Hindu/Tamil festival for the day.
 *
 * Tamil solar calendar months (Chittirai = Mesha = mid-April to mid-May, etc.)
 * Approximated by mapping Gregorian date ranges.
 */

import { useMemo } from 'react'
import { CalendarDays, Sun, Star } from 'lucide-react'

// Tamil month names with Gregorian approximate start dates (day of month, month index 0-based)
const TAMIL_MONTHS = [
  { name: 'சித்திரை',  english: 'Chittirai',  start: [4, 13],  end: [5, 14]  }, // Apr 13 – May 14
  { name: 'வைகாசி',   english: 'Vaikasi',    start: [5, 15],  end: [6, 14]  }, // May 15 – Jun 14
  { name: 'ஆனி',      english: 'Aani',       start: [6, 15],  end: [7, 16]  }, // Jun 15 – Jul 16
  { name: 'ஆடி',      english: 'Aadi',       start: [7, 17],  end: [8, 16]  }, // Jul 17 – Aug 16
  { name: 'ஆவணி',    english: 'Aavani',     start: [8, 17],  end: [9, 16]  }, // Aug 17 – Sep 16
  { name: 'புரட்டாசி', english: 'Purattasi', start: [9, 17],  end: [10,16]  }, // Sep 17 – Oct 16
  { name: 'ஐப்பசி',   english: 'Aippasi',   start: [10, 17], end: [11, 15] }, // Oct 17 – Nov 15
  { name: 'கார்த்திகை', english: 'Karthigai',start: [11, 16], end: [12, 15] }, // Nov 16 – Dec 15
  { name: 'மார்கழி',  english: 'Margazhi',  start: [12, 16], end: [1, 13]  }, // Dec 16 – Jan 13
  { name: 'தை',       english: 'Thai',       start: [1, 14],  end: [2, 12]  }, // Jan 14 – Feb 12
  { name: 'மாசி',     english: 'Maasi',      start: [2, 13],  end: [3, 13]  }, // Feb 13 – Mar 13
  { name: 'பங்குனி',  english: 'Panguni',   start: [3, 14],  end: [4, 12]  }, // Mar 14 – Apr 12
]

// Key Tamil/Hindu festivals — [month (1-12), day]
const FESTIVALS: Array<{ month: number; day: number; name: string; tamil: string; color: string }> = [
  { month: 1,  day: 14, name: 'Thai Pongal',           tamil: 'தை பொங்கல்',        color: '#fbbf24' },
  { month: 1,  day: 15, name: 'Mattu Pongal',          tamil: 'மாட்டுப் பொங்கல்', color: '#fbbf24' },
  { month: 1,  day: 26, name: 'Republic Day',          tamil: 'குடியரசு தினம்',    color: '#f97316' },
  { month: 3,  day: 8,  name: 'Maha Shivaratri',       tamil: 'மகா சிவராத்திரி',   color: '#a78bfa' },
  { month: 4,  day: 13, name: 'Tamil New Year',        tamil: 'தமிழ் புத்தாண்டு', color: '#f59e0b' },
  { month: 4,  day: 14, name: 'Puthandu',              tamil: 'புத்தாண்டு',        color: '#f59e0b' },
  { month: 4,  day: 14, name: 'Dr. Ambedkar Jayanti', tamil: 'அம்பேத்கர் ஜெயந்தி', color: '#3b82f6' },
  { month: 5,  day: 1,  name: 'Labour Day',           tamil: 'தொழிலாளர் தினம்',   color: '#ef4444' },
  { month: 6,  day: 21, name: 'Vaikasi Visakam',       tamil: 'வைகாசி விசாகம்',   color: '#10b981' },
  { month: 7,  day: 17, name: 'Aadi Perukku',          tamil: 'ஆடி பெருக்கு',     color: '#06b6d4' },
  { month: 8,  day: 15, name: 'Independence Day',      tamil: 'சுதந்திர தினம்',   color: '#f97316' },
  { month: 8,  day: 19, name: 'Krishna Jayanti',       tamil: 'கிருஷ்ண ஜெயந்தி', color: '#4ade80' },
  { month: 9,  day: 2,  name: 'Ganesh Chaturthi',      tamil: 'விநாயகர் சதுர்த்தி', color: '#fb923c' },
  { month: 10, day: 2,  name: 'Gandhi Jayanti',        tamil: 'காந்தி ஜெயந்தி',   color: '#94a3b8' },
  { month: 10, day: 20, name: 'Saraswathi Puja',       tamil: 'சரஸ்வதி பூஜை',     color: '#f472b6' },
  { month: 10, day: 24, name: 'Vijaya Dashami',        tamil: 'விஜயதசமி',          color: '#fbbf24' },
  { month: 11, day: 1,  name: 'Karthigai Deepam',      tamil: 'கார்த்திகை தீபம்', color: '#fbbf24' },
  { month: 11, day: 15, name: 'Childrens Day',         tamil: 'குழந்தைகள் தினம்', color: '#60a5fa' },
  { month: 12, day: 16, name: 'Margazhi begins',       tamil: 'மார்கழி திங்கள்',  color: '#c084fc' },
  { month: 12, day: 25, name: 'Christmas',             tamil: 'கிறிஸ்மஸ்',        color: '#34d399' },
]

// Tamil weekday names
const TAMIL_DAYS = ['ஞாயிறு', 'திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி', 'சனி']
const DAY_PLANETS = ['☀️', '🌙', '♂️', '☿️', '♃', '♀️', '♄']

// Tamil year names (60-year cycle) — cycle starts from Prabhava
const TAMIL_YEAR_NAMES = [
  'பிரபவ','விபவ','சுக்கில','பிரமோதூத','பிரஜோத்பத்தி','ஆங்கீரஸ','ஸ்ரீமுக','பாவ','யுவ','தாது',
  'ஈஸ்வர','வெகுதான்ய','பிரமாதி','விக்கிரம','விஷு','சித்திரபானு','சுபானு','தாரண','பார்த்திவ','வ்யய',
  'சர்வஜித்','சர்வதாரி','விரோதி','விக்ருதி','கர','நந்தன','விஜய','ஜய','மன்மத','துர்முகி',
  'ஹேவிளம்பி','விளம்பி','விகாரி','சார்வரி','பிலவ','சுபகிருது','சோபகிருது','குரோதி','விஸ்வாவசு','பராபவ',
  'ப்லவங்க','கீலக','சௌம்ய','சாதாரண','விரோதகிருது','பரிதாபி','பிரமாதீச','ஆனந்த','ராட்சஸ','நள',
  'பிங்கள','காளயுக்தி','சித்தார்த்தி','ரௌத்திரி','துன்மதி','துந்துபி','ருத்ரோத்காரி','ரக்தாட்சி','க்ரோதன','அட்சய',
]

function getTamilDate(date: Date) {
  const month  = date.getMonth() + 1  // 1-12
  const day    = date.getDate()
  const year   = date.getFullYear()
  const weekday = date.getDay()

  // Find Tamil month
  let tamilMonth = TAMIL_MONTHS.find(m => {
    const [sm, sd] = m.start
    const [em, ed] = m.end
    if (sm <= em) {
      return (month === sm && day >= sd) || (month === em && day <= ed) || (month > sm && month < em)
    } else {
      // Wraps year (e.g. Margazhi: Dec 16 – Jan 13)
      return (month === sm && day >= sd) || (month === em && day <= ed)
    }
  }) ?? TAMIL_MONTHS[0]

  // Tamil solar year — roughly: Tamil year 1 = 57 BC so current year ≈ Gregorian + 56/57
  // Chittirai (Apr 13) starts new Tamil year
  const tamilYearNum = (month > 4 || (month === 4 && day >= 13)) ? year + 56 : year + 55
  const cycleIdx = ((tamilYearNum - 1) % 60 + 60) % 60
  const tamilYearName = TAMIL_YEAR_NAMES[cycleIdx] ?? ''

  // Find festival for today
  const festival = FESTIVALS.find(f => f.month === month && f.day === day)

  return { tamilMonth, tamilYearNum, tamilYearName, weekday, festival, day, month, year }
}

export default function TamilCalendar() {
  const today = useMemo(() => getTamilDate(new Date()), [])
  const { tamilMonth, tamilYearName, tamilYearNum, weekday, festival, day } = today

  const gregorianStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="rounded-2xl p-4 space-y-3"
      style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(99,102,241,0.04))', border: '1px solid rgba(245,158,11,0.18)' }}>

      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <CalendarDays className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <p className="text-[10px] font-black text-amber-400 tracking-wider uppercase">Tamil Calendar</p>
          <p className="text-xs text-white/40">{gregorianStr}</p>
        </div>
        <div className="ml-auto text-xl">{DAY_PLANETS[weekday]}</div>
      </div>

      {/* Main date display */}
      <div className="flex items-start gap-3">
        {/* Big date number */}
        <div className="flex-shrink-0 w-16 h-16 rounded-xl flex flex-col items-center justify-center"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <span className="text-3xl font-black text-amber-400 leading-none">{day}</span>
          <span className="text-[9px] text-white/40 mt-0.5 font-semibold uppercase tracking-wide">{TAMIL_DAYS[weekday]?.slice(0, 4)}</span>
        </div>
        {/* Month + Year */}
        <div className="flex-1 min-w-0">
          <p className="text-2xl font-black text-white leading-tight">{tamilMonth.name}</p>
          <p className="text-sm font-semibold text-white/50">{tamilMonth.english} month</p>
          <div className="flex items-center gap-1.5 mt-1">
            <Sun className="w-3 h-3 text-amber-400/60" />
            <span className="text-[11px] text-white/35 font-semibold">{tamilYearName} · {tamilYearNum}</span>
          </div>
        </div>
      </div>

      {/* Weekday full name */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <span className="text-base font-black text-white">{TAMIL_DAYS[weekday]}</span>
        <span className="text-white/30 text-xs">({['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][weekday]})</span>
      </div>

      {/* Festival / special day */}
      {festival ? (
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
          style={{ background: festival.color + '12', border: `1px solid ${festival.color}35` }}>
          <Star className="w-4 h-4 flex-shrink-0" style={{ color: festival.color }} />
          <div>
            <p className="text-sm font-black" style={{ color: festival.color }}>{festival.name}</p>
            <p className="text-xs text-white/40 mt-0.5">{festival.tamil}</p>
          </div>
        </div>
      ) : (
        <div className="px-3 py-2 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-xs text-white/25 text-center">No special festival today</p>
        </div>
      )}
    </div>
  )
}
