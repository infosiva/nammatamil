'use client'

/**
 * DistrictHeatmap — Shows all 38 TN districts colored by winning party.
 * Click a district to see seat breakdown. Auto-updates from ECI.
 */

import { useState, useEffect } from 'react'

const ECI_JSON = 'https://results.eci.gov.in/ResultAcGenMay2026/election-json-S22-live.json'
const MAJORITY = 118
const TOTAL    = 234

const PARTY_ALIASES: Record<string, string> = {
  TVK:'TVK', DMK:'DMK', ADMK:'AIADMK', AIADMK:'AIADMK', BJP:'BJP',
  PMK:'Others', INC:'Others', CPI:'Others', 'CPI(M)':'Others', VCK:'Others',
  DMDK:'Others', IUML:'Others', AMMKMNKZ:'Others', PT:'Others',
}

const PARTY_COLORS: Record<string, string> = {
  TVK:'#fbbf24', DMK:'#f87171', AIADMK:'#4ade80', BJP:'#fb923c', Others:'#94a3b8',
}
const PARTY_EMOJI: Record<string, string> = {
  TVK:'⭐', DMK:'🌅', AIADMK:'🍃', BJP:'🪷', Others:'🏛️',
}

// AC number → district mapping
const AC_DISTRICT: Record<number, string> = {
  1:'Chennai',2:'Chennai',3:'Chennai',4:'Chennai',5:'Chennai',6:'Chennai',7:'Chennai',8:'Chennai',9:'Chennai',10:'Chennai',
  11:'Chennai',12:'Chennai',13:'Chennai',14:'Chennai',15:'Chennai',16:'Chennai',17:'Chennai',18:'Chennai',
  19:'Kancheepuram',20:'Kancheepuram',21:'Kancheepuram',22:'Chengalpattu',23:'Chengalpattu',24:'Chengalpattu',
  25:'Kancheepuram',26:'Kancheepuram',27:'Ranipet',28:'Ranipet',29:'Vellore',30:'Ranipet',31:'Ranipet',
  32:'Vellore',33:'Vellore',34:'Vellore',35:'Vellore',36:'Tirupattur',37:'Tirupattur',38:'Tirupattur',39:'Tirupattur',
  40:'Krishnagiri',41:'Krishnagiri',42:'Krishnagiri',43:'Krishnagiri',44:'Krishnagiri',45:'Krishnagiri',
  46:'Dharmapuri',47:'Dharmapuri',48:'Dharmapuri',49:'Dharmapuri',50:'Dharmapuri',
  51:'Salem',52:'Salem',53:'Salem',54:'Salem',55:'Salem',56:'Salem',57:'Salem',58:'Salem',59:'Salem',60:'Salem',61:'Salem',
  62:'Namakkal',63:'Namakkal',64:'Namakkal',65:'Namakkal',66:'Namakkal',67:'Namakkal',
  68:'Erode',69:'Erode',70:'Erode',71:'Erode',72:'Erode',73:'Erode',74:'Erode',75:'Erode',
  76:'Nilgiris',77:'Nilgiris',78:'Nilgiris',79:'Nilgiris',
  80:'Coimbatore',81:'Tiruppur',82:'Tiruppur',83:'Tiruppur',84:'Tiruppur',85:'Tiruppur',86:'Tiruppur',87:'Tiruppur',88:'Tiruppur',
  89:'Coimbatore',90:'Coimbatore',91:'Coimbatore',92:'Coimbatore',93:'Coimbatore',94:'Coimbatore',95:'Coimbatore',96:'Coimbatore',97:'Coimbatore',98:'Coimbatore',
  99:'Dindigul',100:'Dindigul',101:'Dindigul',102:'Dindigul',103:'Dindigul',104:'Dindigul',105:'Dindigul',
  106:'Karur',107:'Karur',108:'Karur',109:'Karur',
  110:'Tiruchirappalli',111:'Tiruchirappalli',112:'Perambalur',113:'Perambalur',114:'Ariyalur',115:'Ariyalur',
  116:'Tiruchirappalli',117:'Tiruchirappalli',118:'Tiruchirappalli',119:'Tiruchirappalli',120:'Tiruchirappalli',
  121:'Tiruchirappalli',122:'Tiruchirappalli',123:'Tiruchirappalli',
  124:'Madurai',125:'Madurai',126:'Madurai',127:'Madurai',128:'Madurai',129:'Madurai',130:'Madurai',131:'Madurai',132:'Madurai',133:'Madurai',
  134:'Theni',135:'Theni',136:'Theni',137:'Theni',
  138:'Sivaganga',139:'Sivaganga',140:'Sivaganga',141:'Sivaganga',
  142:'Virudhunagar',143:'Virudhunagar',144:'Virudhunagar',145:'Virudhunagar',146:'Virudhunagar',147:'Virudhunagar',
  148:'Tenkasi',149:'Tenkasi',150:'Tenkasi',151:'Tenkasi',152:'Tenkasi',
  153:'Tirunelveli',154:'Tirunelveli',155:'Tirunelveli',156:'Tirunelveli',157:'Tirunelveli',
  158:'Thoothukudi',159:'Thoothukudi',160:'Thoothukudi',161:'Thoothukudi',162:'Thoothukudi',
  163:'Kanyakumari',164:'Kanyakumari',165:'Kanyakumari',166:'Kanyakumari',167:'Kanyakumari',168:'Kanyakumari',
  169:'Thanjavur',170:'Thanjavur',171:'Thanjavur',172:'Thanjavur',173:'Thanjavur',174:'Thanjavur',175:'Thanjavur',
  176:'Tiruvarur',177:'Tiruvarur',178:'Tiruvarur',
  179:'Nagapattinam',180:'Nagapattinam',181:'Nagapattinam',
  182:'Mayiladuthurai',183:'Mayiladuthurai',
  184:'Cuddalore',185:'Cuddalore',186:'Cuddalore',187:'Cuddalore',188:'Cuddalore',189:'Cuddalore',190:'Cuddalore',
  191:'Villupuram',192:'Kallakurichi',193:'Villupuram',194:'Villupuram',195:'Villupuram',196:'Villupuram',
  197:'Villupuram',198:'Villupuram',199:'Villupuram',200:'Villupuram',201:'Villupuram',
  202:'Tiruvallur',203:'Tiruvallur',204:'Tiruvallur',205:'Tiruvallur',206:'Tiruvallur',207:'Tiruvallur',208:'Tiruvallur',209:'Tiruvallur',210:'Tiruvallur',
  211:'Ramanathapuram',212:'Ramanathapuram',213:'Ramanathapuram',214:'Ramanathapuram',
  215:'Pudukkottai',216:'Pudukkottai',217:'Pudukkottai',218:'Pudukkottai',
  219:'Tiruvannamalai',220:'Tiruvannamalai',221:'Tiruvannamalai',222:'Tiruvannamalai',223:'Tiruvannamalai',
  224:'Tiruvannamalai',225:'Tiruvannamalai',226:'Tiruvannamalai',227:'Tiruvannamalai',
  228:'Kancheepuram',229:'Ranipet',230:'Ranipet',231:'Vellore',232:'Dharmapuri',233:'Karur',234:'Virudhunagar',
}

// Ordered for display (roughly north→south, west→east)
const DISTRICT_ORDER = [
  'Chennai','Tiruvallur','Kancheepuram','Chengalpattu',
  'Ranipet','Vellore','Tirupattur','Krishnagiri',
  'Dharmapuri','Salem','Namakkal','Erode',
  'Nilgiris','Coimbatore','Tiruppur','Tiruvannamalai',
  'Villupuram','Kallakurichi','Cuddalore','Mayiladuthurai',
  'Nagapattinam','Tiruvarur','Thanjavur','Perambalur',
  'Ariyalur','Tiruchirappalli','Karur','Dindigul',
  'Theni','Madurai','Sivaganga','Pudukkottai',
  'Ramanathapuram','Virudhunagar','Tenkasi','Tirunelveli',
  'Thoothukudi','Kanyakumari',
]

interface DistrictData {
  name: string
  leader: string
  tally: Record<string, number>
  total: number
  sweep: boolean // one party won all seats
}

type DistrictMap = Record<string, DistrictData>

async function fetchDistricts(): Promise<DistrictMap> {
  try {
    const res = await fetch(ECI_JSON, { cache: 'no-store', signal: AbortSignal.timeout(8000) })
    if (!res.ok) return {}
    const json = await res.json() as Record<string, { chartData: [string, string, number, string, string][] }>
    const s22 = json['S22']
    if (!s22?.chartData?.length) return {}

    const dm: DistrictMap = {}
    for (const [rawParty, , acNo] of s22.chartData) {
      const dist   = AC_DISTRICT[acNo] ?? 'Unknown'
      const party  = PARTY_ALIASES[rawParty] ?? 'Others'
      if (!dm[dist]) dm[dist] = { name: dist, leader: '', tally: {}, total: 0, sweep: false }
      dm[dist].tally[party] = (dm[dist].tally[party] ?? 0) + 1
      dm[dist].total++
    }
    for (const d of Object.values(dm)) {
      d.leader = Object.entries(d.tally).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''
      d.sweep  = Object.values(d.tally).filter(v => v > 0).length === 1
    }
    return dm
  } catch { return {} }
}

export default function DistrictHeatmap() {
  const [districts, setDistricts] = useState<DistrictMap>({})
  const [selected, setSelected]   = useState<string | null>(null)
  const [mounted, setMounted]     = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchDistricts().then(setDistricts)
    const iv = setInterval(() => fetchDistricts().then(setDistricts), 60_000)
    return () => clearInterval(iv)
  }, [])

  if (!mounted || Object.keys(districts).length === 0) return null

  const sel = selected ? districts[selected] : null
  const tvkCount   = Object.values(districts).filter(d => d.leader === 'TVK').length
  const dmkCount   = Object.values(districts).filter(d => d.leader === 'DMK').length
  const admkCount  = Object.values(districts).filter(d => d.leader === 'AIADMK').length
  const othersCount= Object.values(districts).filter(d => d.leader === 'Others' || d.leader === 'BJP').length

  return (
    <div style={{
      borderRadius: 18, padding: '16px',
      background: 'rgba(255,255,255,0.022)',
      border: '1px solid rgba(255,255,255,0.07)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>
            District Dominance Map
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
            Tap any district to see breakdown · 38 districts
          </div>
        </div>
        {/* Summary pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { p: 'TVK', c: tvkCount, color: '#fbbf24' },
            { p: 'DMK', c: dmkCount, color: '#f87171' },
            { p: 'ADMK', c: admkCount, color: '#4ade80' },
            { p: 'Others', c: othersCount, color: '#94a3b8' },
          ].filter(x => x.c > 0).map(x => (
            <span key={x.p} style={{
              fontSize: 10, fontWeight: 900, padding: '3px 9px', borderRadius: 99,
              background: `${x.color}18`, color: x.color, border: `1px solid ${x.color}30`,
            }}>{x.p} {x.c}</span>
          ))}
        </div>
      </div>

      {/* District grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))',
        gap: 6,
        marginBottom: sel ? 14 : 0,
      }}>
        {DISTRICT_ORDER.map(dist => {
          const d = districts[dist]
          if (!d) return null
          const color  = PARTY_COLORS[d.leader] ?? '#94a3b8'
          const isSelected = selected === dist
          const leaderSeats = d.tally[d.leader] ?? 0
          const dominance = leaderSeats / d.total // 0→1

          return (
            <button
              key={dist}
              onClick={() => setSelected(isSelected ? null : dist)}
              style={{
                borderRadius: 10, padding: '8px 6px',
                border: isSelected ? `2px solid ${color}` : `1px solid ${color}${Math.round(dominance * 255).toString(16).padStart(2,'0')}`,
                background: isSelected ? `${color}22` : `${color}${Math.round(dominance * 0.18 * 255).toString(16).padStart(2,'0')}`,
                cursor: 'pointer', textAlign: 'center',
                transition: 'all 0.2s ease',
                transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                boxShadow: isSelected ? `0 0 14px ${color}40` : 'none',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              }}
            >
              <span style={{ fontSize: 14, lineHeight: 1 }}>{PARTY_EMOJI[d.leader] ?? '🏛️'}</span>
              <span style={{ fontSize: 8, fontWeight: 800, color: isSelected ? color : 'rgba(255,255,255,0.7)', lineHeight: 1.2, wordBreak: 'break-word' }}>
                {dist.length > 10 ? dist.slice(0, 9) + '…' : dist}
              </span>
              <span style={{ fontSize: 9, fontWeight: 900, color, fontVariantNumeric: 'tabular-nums' }}>
                {leaderSeats}/{d.total}
              </span>
              {d.sweep && (
                <span style={{ fontSize: 7, color: color, fontWeight: 700 }}>clean sweep</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Selected district panel */}
      {sel && (
        <div style={{
          borderRadius: 14, padding: '14px 16px', marginTop: 6,
          background: `${PARTY_COLORS[sel.leader] ?? '#94a3b8'}10`,
          border: `1px solid ${PARTY_COLORS[sel.leader] ?? '#94a3b8'}30`,
          animation: 'dhSlideIn 0.25s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: PARTY_COLORS[sel.leader], marginBottom: 2 }}>
                {PARTY_EMOJI[sel.leader]} {selected}
              </div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>
                {sel.total} constituencies · {sel.leader} leads
                {sel.sweep ? ' — CLEAN SWEEP 🎯' : ''}
              </div>
            </div>
            <button onClick={() => setSelected(null)} style={{
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 6, padding: '3px 8px', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 11,
            }}>✕</button>
          </div>

          {/* Party bars for this district */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(sel.tally)
              .sort((a, b) => b[1] - a[1])
              .map(([party, seats]) => {
                const color = PARTY_COLORS[party] ?? '#94a3b8'
                const pct   = Math.round((seats / sel.total) * 100)
                return (
                  <div key={party}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 12 }}>{PARTY_EMOJI[party] ?? '🏛️'}</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color }}>{party}</span>
                      </div>
                      <span style={{ fontSize: 16, fontWeight: 900, color, fontVariantNumeric: 'tabular-nums' }}>{seats}</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 99, width: `${pct}%`,
                        background: `linear-gradient(90deg, ${color}88, ${color})`,
                        boxShadow: `0 0 6px ${color}55`,
                        transition: 'width 0.8s cubic-bezier(.34,1.56,.64,1)',
                      }} />
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      <style>{`
        @keyframes dhSlideIn {
          from { opacity:0; transform:translateY(6px) }
          to   { opacity:1; transform:translateY(0) }
        }
      `}</style>
    </div>
  )
}
