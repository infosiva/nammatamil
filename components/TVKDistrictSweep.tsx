'use client'

/**
 * TVKDistrictSweep — Shows districts where TVK dominated.
 * Fetches live ECI, groups by district, shows TVK win rate per district.
 */

import { useState, useEffect } from 'react'

const ECI_JSON = 'https://results.eci.gov.in/ResultAcGenMay2026/election-json-S22-live.json'

const ALIAS: Record<string, string> = {
  TVK:'TVK',
  DMK:'DMK', INC:'DMK', CPI:'DMK', 'CPI(M)':'DMK', VCK:'DMK', IUML:'DMK', MDMK:'DMK',
  ADMK:'ADMK', AIADMK:'ADMK', PMK:'ADMK', DMDK:'ADMK', PT:'ADMK',
  BJP:'BJP', AMMKMNKZ:'Others',
}

// ECI AC# → district (correct mapping)
const AC_DISTRICT: Record<number, string> = {
  1:'Tiruvallur',2:'Tiruvallur',3:'Tiruvallur',4:'Tiruvallur',5:'Tiruvallur',6:'Tiruvallur',
  7:'Tiruvallur',8:'Tiruvallur',9:'Tiruvallur',10:'Chennai',11:'Chennai',12:'Chennai',
  13:'Chennai',14:'Chennai',15:'Chennai',16:'Chennai',17:'Chennai',18:'Chennai',
  19:'Chennai',20:'Chennai',21:'Chennai',22:'Chennai',23:'Chennai',24:'Chennai',
  25:'Chennai',26:'Chennai',27:'Chennai',
  28:'Kancheepuram',29:'Kancheepuram',30:'Kancheepuram',31:'Kancheepuram',32:'Kancheepuram',
  33:'Chengalpattu',34:'Chengalpattu',35:'Chengalpattu',36:'Chengalpattu',37:'Chengalpattu',
  38:'Chengalpattu',
  39:'Ranipet',40:'Ranipet',41:'Ranipet',42:'Ranipet',43:'Ranipet',
  44:'Vellore',45:'Vellore',46:'Vellore',47:'Vellore',48:'Vellore',
  49:'Tirupattur',50:'Tirupattur',51:'Tirupattur',52:'Tirupattur',
  53:'Krishnagiri',54:'Krishnagiri',55:'Krishnagiri',56:'Krishnagiri',57:'Krishnagiri',
  58:'Dharmapuri',59:'Dharmapuri',60:'Dharmapuri',61:'Dharmapuri',
  62:'Salem',63:'Salem',64:'Salem',65:'Salem',66:'Salem',67:'Salem',68:'Salem',69:'Salem',
  70:'Namakkal',71:'Namakkal',72:'Namakkal',73:'Namakkal',74:'Namakkal',75:'Namakkal',
  76:'Erode',77:'Erode',78:'Erode',79:'Erode',80:'Erode',81:'Erode',
  82:'Nilgiris',83:'Nilgiris',84:'Nilgiris',
  85:'Coimbatore',86:'Coimbatore',87:'Coimbatore',
  88:'Tiruppur',89:'Tiruppur',90:'Tiruppur',91:'Tiruppur',92:'Tiruppur',93:'Tiruppur',94:'Tiruppur',95:'Tiruppur',
  96:'Coimbatore',97:'Coimbatore',98:'Coimbatore',99:'Coimbatore',100:'Coimbatore',101:'Coimbatore',
  102:'Dindigul',103:'Dindigul',104:'Dindigul',105:'Dindigul',106:'Dindigul',107:'Dindigul',108:'Dindigul',
  109:'Karur',110:'Karur',111:'Karur',112:'Karur',
  113:'Perambalur',114:'Perambalur',
  115:'Ariyalur',116:'Ariyalur',
  117:'Tiruchirappalli',118:'Tiruchirappalli',119:'Tiruchirappalli',120:'Tiruchirappalli',
  121:'Tiruchirappalli',122:'Tiruchirappalli',123:'Tiruchirappalli',124:'Tiruchirappalli',
  125:'Madurai',126:'Madurai',127:'Madurai',128:'Madurai',129:'Madurai',130:'Madurai',131:'Madurai',132:'Madurai',133:'Madurai',
  134:'Theni',135:'Theni',136:'Theni',137:'Theni',138:'Theni',
  139:'Sivaganga',140:'Sivaganga',141:'Sivaganga',142:'Sivaganga',
  143:'Virudhunagar',144:'Virudhunagar',145:'Virudhunagar',146:'Virudhunagar',147:'Virudhunagar',148:'Virudhunagar',
  149:'Tenkasi',150:'Tenkasi',151:'Tenkasi',152:'Tenkasi',153:'Tenkasi',
  154:'Tirunelveli',155:'Tirunelveli',156:'Tirunelveli',157:'Tirunelveli',158:'Tirunelveli',
  159:'Thoothukudi',160:'Thoothukudi',161:'Thoothukudi',162:'Thoothukudi',163:'Thoothukudi',
  164:'Kanyakumari',165:'Kanyakumari',166:'Kanyakumari',167:'Kanyakumari',168:'Kanyakumari',169:'Kanyakumari',
  170:'Thanjavur',171:'Thanjavur',172:'Thanjavur',173:'Thanjavur',174:'Thanjavur',175:'Thanjavur',176:'Thanjavur',
  177:'Tiruvarur',178:'Tiruvarur',179:'Tiruvarur',180:'Tiruvarur',181:'Tiruvarur',
  182:'Nagapattinam',183:'Nagapattinam',184:'Nagapattinam',185:'Nagapattinam',
  186:'Mayiladuthurai',187:'Mayiladuthurai',188:'Mayiladuthurai',
  189:'Cuddalore',190:'Cuddalore',191:'Cuddalore',192:'Cuddalore',193:'Cuddalore',194:'Cuddalore',
  195:'Villupuram',196:'Villupuram',197:'Villupuram',198:'Villupuram',199:'Villupuram',
  200:'Kallakurichi',201:'Kallakurichi',202:'Kallakurichi',
  203:'Tiruvannamalai',204:'Tiruvannamalai',205:'Tiruvannamalai',206:'Tiruvannamalai',207:'Tiruvannamalai',208:'Tiruvannamalai',209:'Tiruvannamalai',
  210:'Ramanathapuram',211:'Ramanathapuram',212:'Ramanathapuram',213:'Ramanathapuram',
  214:'Pudukkottai',215:'Pudukkottai',216:'Pudukkottai',217:'Pudukkottai',
  218:'Thanjavur',219:'Thanjavur',
  220:'Tiruchirappalli',221:'Tiruchirappalli',
  222:'Dindigul',
  223:'Karur',224:'Karur',
  225:'Virudhunagar',226:'Virudhunagar',
  227:'Ranipet',228:'Ranipet',229:'Ranipet',230:'Ranipet',
  231:'Vellore',232:'Vellore',
  233:'Tirupattur',234:'Tirupattur',
}

interface DistrictStats {
  name: string
  total: number
  tvk: number
  dmk: number
  admk: number
  others: number
  pct: number  // TVK %
  sweep: boolean
}

async function fetchDistricts(): Promise<DistrictStats[]> {
  try {
    const res = await fetch(ECI_JSON, { cache: 'no-store', signal: AbortSignal.timeout(8000) })
    if (!res.ok) return []
    const json = await res.json() as Record<string, { chartData: [string, string, number, string, string][] }>
    const rows = json['S22']?.chartData ?? []

    const byDistrict: Record<string, Record<string, number>> = {}
    for (const [raw, , acNo] of rows) {
      const d = AC_DISTRICT[acNo] ?? 'Other'
      const p = ALIAS[raw] ?? 'Others'
      if (!byDistrict[d]) byDistrict[d] = {}
      byDistrict[d][p] = (byDistrict[d][p] ?? 0) + 1
    }

    return Object.entries(byDistrict).map(([name, tally]) => {
      const total  = Object.values(tally).reduce((a, b) => a + b, 0)
      const tvk    = tally['TVK'] ?? 0
      const dmk    = tally['DMK'] ?? 0
      const admk   = tally['ADMK'] ?? 0
      const others = total - tvk - dmk - admk
      return {
        name, total, tvk, dmk, admk, others: Math.max(0, others),
        pct: total > 0 ? Math.round((tvk / total) * 100) : 0,
        sweep: total > 0 && tvk === total,
      }
    }).sort((a, b) => b.tvk - a.tvk || b.pct - a.pct)
  } catch { return [] }
}

export default function TVKDistrictSweep() {
  const [districts, setDistricts] = useState<DistrictStats[]>([])
  const [mounted, setMounted]     = useState(false)
  const [showAll, setShowAll]     = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchDistricts().then(setDistricts)
  }, [])

  if (!mounted || !districts.length) return null

  const sweeps  = districts.filter(d => d.sweep)
  const visible = showAll ? districts : districts.slice(0, 10)

  return (
    <div style={{
      borderRadius: 16,
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.07)',
      overflow: 'hidden',
      marginBottom: 14,
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 14 }}>⭐</span>
          <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.07em' }}>
            TVK DISTRICT PERFORMANCE
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {sweeps.length > 0 && (
            <span style={{
              fontSize: 8, fontWeight: 900, padding: '2px 8px', borderRadius: 99,
              background: 'rgba(251,191,36,0.12)', color: '#fbbf24',
              border: '1px solid rgba(251,191,36,0.25)',
            }}>
              🏆 {sweeps.length} clean sweeps
            </span>
          )}
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>
            {districts.length} districts
          </span>
        </div>
      </div>

      {/* Column headers */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 36px 36px 36px 80px',
        padding: '6px 14px', gap: 4,
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        {['District', '⭐', '🌅', '🍃', 'TVK share'].map((h, i) => (
          <span key={i} style={{ fontSize: 7, fontWeight: 800, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.06em', textAlign: i > 0 ? 'center' : 'left' }}>
            {h}
          </span>
        ))}
      </div>

      {/* District rows */}
      {visible.map(d => (
        <div key={d.name} style={{
          display: 'grid', gridTemplateColumns: '1fr 36px 36px 36px 80px',
          padding: '8px 14px', gap: 4, alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.03)',
          background: d.sweep ? 'rgba(251,191,36,0.03)' : 'transparent',
        }}>
          {/* Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {d.sweep && <span style={{ fontSize: 9 }}>🏆</span>}
            <span style={{ fontSize: 11, fontWeight: d.sweep ? 900 : 600, color: d.sweep ? '#fbbf24' : 'rgba(255,255,255,0.65)' }}>
              {d.name}
            </span>
            <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>/{d.total}</span>
          </div>
          {/* TVK */}
          <span style={{ fontSize: 13, fontWeight: 900, color: '#fbbf24', textAlign: 'center' }}>{d.tvk || '—'}</span>
          {/* DMK */}
          <span style={{ fontSize: 12, fontWeight: 700, color: d.dmk ? '#f87171' : 'rgba(255,255,255,0.12)', textAlign: 'center' }}>{d.dmk || '—'}</span>
          {/* ADMK */}
          <span style={{ fontSize: 12, fontWeight: 700, color: d.admk ? '#4ade80' : 'rgba(255,255,255,0.12)', textAlign: 'center' }}>{d.admk || '—'}</span>
          {/* Bar + % */}
          <div>
            <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', marginBottom: 2 }}>
              <div style={{
                height: '100%', borderRadius: 99, width: `${d.pct}%`,
                background: d.sweep ? '#fbbf24' : `linear-gradient(90deg,#fbbf2466,#fbbf24aa)`,
                transition: 'width 1s ease',
              }} />
            </div>
            <span style={{ fontSize: 8, color: d.pct >= 80 ? '#fbbf24' : 'rgba(255,255,255,0.3)', fontWeight: 700 }}>
              {d.pct}% TVK
            </span>
          </div>
        </div>
      ))}

      {/* Show more / less */}
      <button onClick={() => setShowAll(v => !v)} style={{
        width: '100%', padding: '10px', background: 'none', border: 'none',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        color: 'rgba(255,255,255,0.3)', fontSize: 10, cursor: 'pointer',
        fontFamily: 'inherit', fontWeight: 700,
      }}>
        {showAll ? '↑ Show less' : `↓ Show all ${districts.length} districts`}
      </button>
    </div>
  )
}
