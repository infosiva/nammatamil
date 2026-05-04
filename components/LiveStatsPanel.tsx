'use client'

/**
 * LiveStatsPanel — Detailed live counters for each alliance.
 * Shows: seats won, % share, seats to majority, recently declared, win rate per declared.
 */

import { useState, useEffect, useRef } from 'react'

const ECI_JSON = 'https://results.eci.gov.in/ResultAcGenMay2026/election-json-S22-live.json'
const MAJORITY = 118
const TOTAL    = 234

const ALIAS: Record<string, string> = {
  TVK:'TVK',
  DMK:'DMK', INC:'DMK', CPI:'DMK', 'CPI(M)':'DMK', VCK:'DMK', IUML:'DMK', MDMK:'DMK',
  ADMK:'ADMK', AIADMK:'ADMK', PMK:'ADMK', DMDK:'ADMK', PT:'ADMK',
  BJP:'BJP',
  AMMKMNKZ:'Others',
}

const ALLIANCES: {
  key: string; label: string; subLabel: string; color: string; emoji: string
}[] = [
  { key:'TVK',   label:'TVK',           subLabel:'Vijay Alliance',      color:'#fbbf24', emoji:'⭐' },
  { key:'DMK',   label:'DMK Alliance',  subLabel:'DMK · INC · VCK · IUML · CPI', color:'#f87171', emoji:'🌅' },
  { key:'ADMK',  label:'ADMK Alliance', subLabel:'ADMK · PMK · DMDK',   color:'#4ade80', emoji:'🍃' },
  { key:'BJP',   label:'BJP',           subLabel:'NDA',                  color:'#fb923c', emoji:'🪷' },
  { key:'Others',label:'Others',        subLabel:'Independent & small',  color:'#94a3b8', emoji:'🏛️' },
]

interface RecentSeat { acNo: number; name: string; party: string; color: string; emoji: string }

interface Stats {
  tally: Record<string, number>
  declared: number
  remaining: number
  recent: RecentSeat[]   // last 5 declared
}

const SEAT_NAMES: Record<number, string> = {
  1:'Thiruvottiyur',2:'Radhakrishnan Nagar',3:'Perambur',4:'Kolathur',5:'Villivakkam',
  6:'Thiru Vi Ka Nagar',7:'Egmore',8:'Royapuram',9:'Harbour',10:'Chepauk',
  11:'Thousand Lights',12:'Anna Nagar',13:'Virugambakkam',14:'Saidapet',15:'T. Nagar',
  16:'Mylapore',17:'Velachery',18:'Sholinganallur',19:'Alandur',20:'Sriperumbudur',
  21:'Pallavaram',22:'Tambaram',23:'Chengalpattu',24:'Madurantakam',25:'Uthiramerur',
  26:'Kancheepuram',27:'Arakkonam',28:'Sholingur',29:'Katpadi',30:'Ranipet',
  31:'Arcot',32:'Vellore',33:'Anaikattu',34:'Kilvaithinankuppam',35:'Gudiyatham',
  36:'Vaniyambadi',37:'Ambur',38:'Jolarpet',39:'Tirupattur',40:'Uthangarai',
  41:'Bargur',42:'Krishnagiri',43:'Veppanahalli',44:'Hosur',45:'Thalli',
  46:'Palacodu',47:'Pennagaram',48:'Dharmapuri',49:'Pappireddippatti',50:'Harur',
  51:'Omalur',52:'Mettur',53:'Edappadi',54:'Sankari',55:'Salem West',
  56:'Salem North',57:'Salem South',58:'Veerapandi',59:'Attur',60:'Yercaud',
  61:'Gangavalli',62:'Rasipuram',63:'Senthamangalam',64:'Namakkal',65:'Paramathi Velur',
  66:'Tiruchengode',67:'Kumarapalayam',68:'Erode East',69:'Erode West',70:'Modakurichi',
  71:'Perundurai',72:'Bhavani',73:'Anthiyur',74:'Gobichettipalayam',75:'Bhavanisagar',
  76:'Gudalur',77:'Ooty',78:'Kundah',79:'Coonoor',80:'Mettuppalayam',
  81:'Avanashi',82:'Tiruppur North',83:'Tiruppur South',84:'Palladam',85:'Dharapuram',
  86:'Kangeyam',87:'Udumalaipettai',88:'Madathukulam',89:'Pollachi',90:'Valparai',
  91:'Sulur',92:'Coimbatore North',93:'Thondamuthur',94:'Coimbatore South',95:'Singanallur',
  96:'Kinathukadavu',97:'Kavundampalayam',98:'Mettupalayam',99:'Palani',100:'Oddanchatram',
  101:'Athoor',102:'Dindigul',103:'Natham',104:'Nilakottai',105:'Vedasandur',
  106:'Aravakurichi',107:'Karur',108:'Krishnarayapuram',109:'Kulithalai',110:'Musiri',
  111:'Thuraiyur',112:'Perambalur',113:'Kunnam',114:'Ariyalur',115:'Jayankondam',
  116:'Trichy West',117:'Trichy East',118:'Thiruverumbur',119:'Srirangam',120:'Tiruverumbur',
  121:'Lalgudi',122:'Manachanallur',123:'Manapparai',124:'Melur',125:'Madurai East',
  126:'Sholavandan',127:'Madurai North',128:'Madurai South',129:'Madurai Central',130:'Madurai West',
  131:'Thiruparankundram',132:'Thirumangalam',133:'Usilampatti',134:'Andipatti',135:'Periyakulam',
  136:'Bodinayakanur',137:'Cumbum',138:'Sivaganga',139:'Manamadurai',140:'Karaikudi',
  141:'Tiruppattur',142:'Aruppukkottai',143:'Rajapalayam',144:'Srivilliputhur',145:'Sattur',
  146:'Sivakasi',147:'Virudhunagar',148:'Sankarankovil',149:'Vasudevanallur',150:'Kadayanallur',
  151:'Tenkasi',152:'Alangulam',153:'Tirunelveli',154:'Ambasamudram',155:'Palayamkottai',
  156:'Nanguneri',157:'Radhapuram',158:'Thoothukudi',159:'Tiruchendur',160:'Srivaikuntam',
  161:'Ottapidaram',162:'Vilathikulam',163:'Thovalai',164:'Nagercoil',165:'Colachel',
  166:'Padmanabhapuram',167:'Vilavancode',168:'Killiyoor',169:'Papanasam',170:'Thiruvidaimarudur',
  171:'Kumbakonam',172:'Pattukkottai',173:'Thanjavur',174:'Orathanadu',175:'Peravurani',
  176:'Thiruvarur',177:'Nannilam',178:'Papanasam TRV',179:'Nagapattinam',180:'Kilvelur',
  181:'Vedaranyam',182:'Mayiladuthurai',183:'Sirkazhi',184:'Chidambaram',185:'Kattumannarkoil',
  186:'Cuddalore',187:'Bhuvanagiri',188:'Vridhachalam',189:'Neyveli',190:'Panruti',
  191:'Ulundurpettai',192:'Kallakurichi',193:'Sankarapuram',194:'Tindivanam',195:'Vanur',
  196:'Villupuram',197:'Vikravandi',198:'Thirukoilur',199:'Rishivandiyam',200:'Gingee',
  201:'Mailam',202:'Ponneri',203:'Tiruttani',204:'Thiruvallur',205:'Poonamallee',
  206:'Avadi',207:'Maduravoyal',208:'Ambattur',209:'Madavaram',210:'Gummidipoondi',
  211:'Ramanathapuram',212:'Mudhukulathur',213:'Paramakudi',214:'Tiruvadanai',215:'Pudukkottai',
  216:'Thirumayam',217:'Alangudi',218:'Aranthangi',219:'Chengam',220:'Tiruvannamalai',
  221:'Kilpennathur',222:'Kalasapakkam',223:'Polur',224:'Arani',225:'Cheyyar',
  226:'Vandavasi',227:'Vembakkam',228:'Perungalathur',229:'Walajapet',230:'Kaveripakkam',
  231:'Anaicut',232:'Palacode',233:'Alangudi Karur',234:'Aruppukkottai South',
}

const PARTY_COLORS: Record<string, string> = {
  TVK:'#fbbf24', DMK:'#f87171', ADMK:'#4ade80', BJP:'#fb923c', Others:'#94a3b8',
}
const PARTY_EMOJI: Record<string, string> = {
  TVK:'⭐', DMK:'🌅', ADMK:'🍃', BJP:'🪷', Others:'🏛️',
}

async function fetchStats(): Promise<Stats | null> {
  try {
    const res = await fetch(ECI_JSON, { cache: 'no-store', signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    const json = await res.json() as Record<string, { chartData: [string, string, number, string, string][] }>
    const s22 = json['S22']
    if (!s22?.chartData?.length) return null

    const tally: Record<string, number> = {}
    const recent: RecentSeat[] = []

    // Walk in reverse so last entries = most recently declared
    const rows = [...s22.chartData]
    for (const [raw, , acNo] of rows) {
      const k = ALIAS[raw] ?? 'Others'
      tally[k] = (tally[k] ?? 0) + 1
    }
    // last 6 declared
    for (const [raw, , acNo] of rows.slice(-6).reverse()) {
      const k = ALIAS[raw] ?? 'Others'
      recent.push({
        acNo,
        name: SEAT_NAMES[acNo] ?? `AC #${acNo}`,
        party: k,
        color: PARTY_COLORS[k] ?? '#94a3b8',
        emoji: PARTY_EMOJI[k] ?? '🏛️',
      })
    }

    return { tally, declared: rows.length, remaining: TOTAL - rows.length, recent }
  } catch { return null }
}

function AnimNum({ n }: { n: number }) {
  const [v, setV] = useState(0)
  const prev = useRef(0)
  const raf  = useRef<number | null>(null)
  useEffect(() => {
    if (prev.current === n) return
    if (raf.current) cancelAnimationFrame(raf.current)
    const s0 = prev.current, d = n - s0, t0 = performance.now(), dur = 900
    const step = (t: number) => {
      const p = Math.min((t - t0) / dur, 1)
      const e = p < .5 ? 2*p*p : -1+(4-2*p)*p
      setV(Math.round(s0 + d * e))
      if (p < 1) raf.current = requestAnimationFrame(step)
      else { setV(n); prev.current = n }
    }
    raf.current = requestAnimationFrame(step)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [n])
  return <>{v}</>
}

export default function LiveStatsPanel() {
  const [stats, setStats]     = useState<Stats | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchStats().then(setStats)
    const iv = setInterval(() => fetchStats().then(setStats), 60_000)
    return () => clearInterval(iv)
  }, [])

  if (!mounted || !stats) return null

  const { tally, declared, remaining, recent } = stats
  const allDone = remaining === 0

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
        padding: '10px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {!allDone && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'lsPulse 1.5s infinite' }} />}
          <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.07em' }}>
            {allDone ? '✓ FINAL RESULTS' : 'LIVE COUNT'}
          </span>
        </div>
        <span style={{ fontSize: 10, fontWeight: 900, color: allDone ? '#4ade80' : '#ef4444' }}>
          {declared} / {TOTAL} declared
        </span>
      </div>

      {/* Alliance stat rows */}
      <div style={{ padding: '10px 0' }}>
        {ALLIANCES.map(a => {
          const seats   = tally[a.key] ?? 0
          if (seats === 0) return null
          const toMaj   = MAJORITY - seats
          const hasMaj  = seats >= MAJORITY
          const nearMaj = !hasMaj && toMaj > 0 && toMaj <= 30
          const sharePct = declared > 0 ? Math.round((seats / declared) * 100) : 0
          const barPct   = Math.min(100, (seats / MAJORITY) * 100) // bar fills toward majority

          return (
            <div key={a.key} style={{
              padding: '9px 14px',
              borderBottom: '1px solid rgba(255,255,255,0.03)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

                {/* Emoji */}
                <span style={{ fontSize: 18, flexShrink: 0, width: 24, textAlign: 'center' }}>{a.emoji}</span>

                {/* Name + sub */}
                <div style={{ width: 110, flexShrink: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 900, color: a.color, lineHeight: 1 }}>{a.label}</div>
                  <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.subLabel}</div>
                </div>

                {/* Bar track toward majority */}
                <div style={{ flex: 1, position: 'relative', height: 22, borderRadius: 6, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                  {/* Filled bar */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    width: `${barPct}%`,
                    background: hasMaj
                      ? `linear-gradient(90deg, ${a.color}88, ${a.color})`
                      : `linear-gradient(90deg, ${a.color}44, ${a.color}88)`,
                    borderRadius: 6,
                    transition: 'width 1.5s cubic-bezier(.34,1.56,.64,1)',
                    boxShadow: hasMaj ? `0 0 10px ${a.color}55` : 'none',
                  }} />
                  {/* Seat label inside bar */}
                  {barPct > 12 && (
                    <span style={{
                      position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                      fontSize: 10, fontWeight: 900, color: '#000', opacity: 0.6,
                    }}>{seats}</span>
                  )}
                  {/* Gold majority marker at 100% of bar (= MAJORITY seats) */}
                  <div style={{
                    position: 'absolute', top: 0, bottom: 0, right: 0,
                    width: 2, background: 'rgba(251,191,36,0.7)',
                  }} />
                </div>

                {/* Stats block */}
                <div style={{ flexShrink: 0, textAlign: 'right', minWidth: 80 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 5 }}>
                    <span style={{ fontSize: 22, fontWeight: 900, color: a.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                      <AnimNum n={seats} />
                    </span>
                    {hasMaj && (
                      <span style={{
                        fontSize: 8, padding: '2px 6px', borderRadius: 99, fontWeight: 900,
                        background: 'rgba(74,222,128,0.15)', color: '#4ade80',
                        border: '1px solid rgba(74,222,128,0.3)',
                      }}>✓ WON</span>
                    )}
                  </div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', marginTop: 2, display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                    <span>{sharePct}% of declared</span>
                    {!hasMaj && toMaj > 0 && (
                      <span style={{
                        color: nearMaj ? '#fbbf24' : 'rgba(255,255,255,0.25)',
                        fontWeight: nearMaj ? 800 : 400,
                        animation: nearMaj ? 'lsPulse 1.4s infinite' : 'none',
                      }}>
                        needs {toMaj} more
                      </span>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )
        })}
      </div>

      {/* Recently declared feed */}
      {recent.length > 0 && (
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.05)',
          padding: '8px 14px',
        }}>
          <div style={{ fontSize: 8, fontWeight: 800, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em', marginBottom: 6 }}>
            RECENTLY DECLARED
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {recent.map((r, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '3px 8px', borderRadius: 99,
                background: `${r.color}12`, border: `1px solid ${r.color}25`,
                fontSize: 9, color: 'rgba(255,255,255,0.55)',
              }}>
                <span style={{ fontSize: 10 }}>{r.emoji}</span>
                <span style={{ fontWeight: 700, color: r.color }}>{r.party}</span>
                <span>{r.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Counting progress bar */}
      <div style={{ padding: '8px 14px 12px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', fontWeight: 700 }}>
            Counting progress
          </span>
          <span style={{ fontSize: 8, fontWeight: 900, color: allDone ? '#4ade80' : 'rgba(255,255,255,0.4)' }}>
            {Math.round((declared / TOTAL) * 100)}% complete
          </span>
        </div>
        <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 99,
            width: `${(declared / TOTAL) * 100}%`,
            background: allDone ? '#4ade80' : 'linear-gradient(90deg,#ef4444,#f87171)',
            transition: 'width 1.2s ease',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
          <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.18)' }}>{declared} declared</span>
          <span style={{ fontSize: 8, color: remaining > 0 ? '#ef444466' : '#4ade8066' }}>
            {remaining > 0 ? `${remaining} remaining` : '✓ all done'}
          </span>
        </div>
      </div>

      <style>{`@keyframes lsPulse{0%,100%{opacity:1}50%{opacity:.35}}`}</style>
    </div>
  )
}
