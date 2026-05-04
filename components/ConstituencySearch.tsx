'use client'

/**
 * ConstituencySearch — Search your constituency by name.
 * The #1 thing people Google on election day.
 * Fetches live from ECI, instant fuzzy search across all 234 seats.
 */

import { useState, useEffect, useRef, useCallback } from 'react'

const ECI_JSON = 'https://results.eci.gov.in/ResultAcGenMay2026/election-json-S22-live.json'

const PARTY_ALIASES: Record<string, string> = {
  TVK:'TVK', DMK:'DMK', ADMK:'AIADMK', AIADMK:'AIADMK', BJP:'BJP',
  PMK:'PMK', INC:'INC', 'CPI(M)':'CPI(M)', CPI:'CPI', VCK:'VCK',
  DMDK:'DMDK', IUML:'IUML', AMMKMNKZ:'AMMK', PT:'PT',
}
const PARTY_COLORS: Record<string, string> = {
  TVK:'#fbbf24', DMK:'#f87171', AIADMK:'#4ade80', BJP:'#fb923c',
  PMK:'#a78bfa', INC:'#38bdf8', 'CPI(M)':'#fb7185', CPI:'#fb7185',
  VCK:'#34d399', DMDK:'#f59e0b', IUML:'#10b981', AMMK:'#f472b6', Others:'#94a3b8',
}
const PARTY_EMOJI: Record<string, string> = {
  TVK:'⭐', DMK:'🌅', AIADMK:'🍃', BJP:'🪷', PMK:'🌿', INC:'✋',
  'CPI(M)':'✊', CPI:'✊', VCK:'✊', DMDK:'🎬', IUML:'🕌', AMMK:'🏛️', Others:'🏛️',
}

// All 234 TN constituencies with AC number → name + district
const TN_SEATS: Record<number, { name: string; district: string }> = {
  1:{name:'Thiruvottiyur',district:'Chennai'},2:{name:'Dr. Radhakrishnan Nagar',district:'Chennai'},3:{name:'Perambur',district:'Chennai'},4:{name:'Kolathur',district:'Chennai'},5:{name:'Villivakkam',district:'Chennai'},6:{name:'Thiru Vi Ka Nagar',district:'Chennai'},7:{name:'Egmore',district:'Chennai'},8:{name:'Royapuram',district:'Chennai'},9:{name:'Harbour',district:'Chennai'},10:{name:'Chepauk-Thiruvallikeni',district:'Chennai'},11:{name:'Thousand Lights',district:'Chennai'},12:{name:'Anna Nagar',district:'Chennai'},13:{name:'Virugambakkam',district:'Chennai'},14:{name:'Saidapet',district:'Chennai'},15:{name:'Thiyagaraya Nagar',district:'Chennai'},16:{name:'Mylapore',district:'Chennai'},17:{name:'Velachery',district:'Chennai'},18:{name:'Sholinganallur',district:'Chennai'},19:{name:'Alandur',district:'Kancheepuram'},20:{name:'Sriperumbudur',district:'Kancheepuram'},21:{name:'Pallavaram',district:'Kancheepuram'},22:{name:'Tambaram',district:'Chengalpattu'},23:{name:'Chengalpattu',district:'Chengalpattu'},24:{name:'Madurantakam',district:'Chengalpattu'},25:{name:'Uthiramerur',district:'Kancheepuram'},26:{name:'Kancheepuram',district:'Kancheepuram'},27:{name:'Arakkonam',district:'Ranipet'},28:{name:'Sholingur',district:'Ranipet'},29:{name:'Katpadi',district:'Vellore'},30:{name:'Ranipet',district:'Ranipet'},31:{name:'Arcot',district:'Ranipet'},32:{name:'Vellore',district:'Vellore'},33:{name:'Anaikattu',district:'Vellore'},34:{name:'Kilvaithinankuppam',district:'Vellore'},35:{name:'Gudiyatham',district:'Vellore'},36:{name:'Vaniyambadi',district:'Tirupattur'},37:{name:'Ambur',district:'Tirupattur'},38:{name:'Jolarpet',district:'Tirupattur'},39:{name:'Tirupattur',district:'Tirupattur'},40:{name:'Uthangarai',district:'Krishnagiri'},41:{name:'Bargur',district:'Krishnagiri'},42:{name:'Krishnagiri',district:'Krishnagiri'},43:{name:'Veppanahalli',district:'Krishnagiri'},44:{name:'Hosur',district:'Krishnagiri'},45:{name:'Thalli',district:'Krishnagiri'},46:{name:'Palacodu',district:'Dharmapuri'},47:{name:'Pennagaram',district:'Dharmapuri'},48:{name:'Dharmapuri',district:'Dharmapuri'},49:{name:'Pappireddippatti',district:'Dharmapuri'},50:{name:'Harur',district:'Dharmapuri'},51:{name:'Omalur',district:'Salem'},52:{name:'Mettur',district:'Salem'},53:{name:'Edappadi',district:'Salem'},54:{name:'Sankari',district:'Salem'},55:{name:'Salem West',district:'Salem'},56:{name:'Salem North',district:'Salem'},57:{name:'Salem South',district:'Salem'},58:{name:'Veerapandi',district:'Salem'},59:{name:'Attur',district:'Salem'},60:{name:'Yercaud',district:'Salem'},61:{name:'Gangavalli',district:'Salem'},62:{name:'Rasipuram',district:'Namakkal'},63:{name:'Senthamangalam',district:'Namakkal'},64:{name:'Namakkal',district:'Namakkal'},65:{name:'Paramathi Velur',district:'Namakkal'},66:{name:'Tiruchengode',district:'Namakkal'},67:{name:'Kumarapalayam',district:'Namakkal'},68:{name:'Erode East',district:'Erode'},69:{name:'Erode West',district:'Erode'},70:{name:'Modakurichi',district:'Erode'},71:{name:'Perundurai',district:'Erode'},72:{name:'Bhavani',district:'Erode'},73:{name:'Anthiyur',district:'Erode'},74:{name:'Gobichettipalayam',district:'Erode'},75:{name:'Bhavanisagar',district:'Erode'},76:{name:'Gudalur',district:'Nilgiris'},77:{name:'Udhagamandalam',district:'Nilgiris'},78:{name:'Kundah',district:'Nilgiris'},79:{name:'Coonoor',district:'Nilgiris'},80:{name:'Mettuppalayam',district:'Coimbatore'},81:{name:'Avanashi',district:'Tiruppur'},82:{name:'Tiruppur North',district:'Tiruppur'},83:{name:'Tiruppur South',district:'Tiruppur'},84:{name:'Palladam',district:'Tiruppur'},85:{name:'Dharapuram',district:'Tiruppur'},86:{name:'Kangeyam',district:'Tiruppur'},87:{name:'Udumalaipettai',district:'Tiruppur'},88:{name:'Madathukulam',district:'Tiruppur'},89:{name:'Pollachi',district:'Coimbatore'},90:{name:'Valparai',district:'Coimbatore'},91:{name:'Sulur',district:'Coimbatore'},92:{name:'Coimbatore North',district:'Coimbatore'},93:{name:'Thondamuthur',district:'Coimbatore'},94:{name:'Coimbatore South',district:'Coimbatore'},95:{name:'Singanallur',district:'Coimbatore'},96:{name:'Kinathukadavu',district:'Coimbatore'},97:{name:'Kavundampalayam',district:'Coimbatore'},98:{name:'Mettupalayam',district:'Coimbatore'},99:{name:'Palani',district:'Dindigul'},100:{name:'Oddanchatram',district:'Dindigul'},101:{name:'Athoor',district:'Dindigul'},102:{name:'Dindigul',district:'Dindigul'},103:{name:'Natham',district:'Dindigul'},104:{name:'Nilakottai',district:'Dindigul'},105:{name:'Vedasandur',district:'Dindigul'},106:{name:'Aravakurichi',district:'Karur'},107:{name:'Karur',district:'Karur'},108:{name:'Krishnarayapuram',district:'Karur'},109:{name:'Kulithalai',district:'Karur'},110:{name:'Musiri',district:'Tiruchirappalli'},111:{name:'Thuraiyur',district:'Tiruchirappalli'},112:{name:'Perambalur',district:'Perambalur'},113:{name:'Kunnam',district:'Perambalur'},114:{name:'Ariyalur',district:'Ariyalur'},115:{name:'Jayankondam',district:'Ariyalur'},116:{name:'Tiruchirappalli West',district:'Tiruchirappalli'},117:{name:'Tiruchirappalli East',district:'Tiruchirappalli'},118:{name:'Thiruverumbur',district:'Tiruchirappalli'},119:{name:'Srirangam',district:'Tiruchirappalli'},120:{name:'Tiruverumbur',district:'Tiruchirappalli'},121:{name:'Lalgudi',district:'Tiruchirappalli'},122:{name:'Manachanallur',district:'Tiruchirappalli'},123:{name:'Manapparai',district:'Tiruchirappalli'},124:{name:'Melur',district:'Madurai'},125:{name:'Madurai East',district:'Madurai'},126:{name:'Sholavandan',district:'Madurai'},127:{name:'Madurai North',district:'Madurai'},128:{name:'Madurai South',district:'Madurai'},129:{name:'Madurai Central',district:'Madurai'},130:{name:'Madurai West',district:'Madurai'},131:{name:'Thiruparankundram',district:'Madurai'},132:{name:'Thirumangalam',district:'Madurai'},133:{name:'Usilampatti',district:'Madurai'},134:{name:'Andipatti',district:'Theni'},135:{name:'Periyakulam',district:'Theni'},136:{name:'Bodinayakanur',district:'Theni'},137:{name:'Cumbum',district:'Theni'},138:{name:'Sivaganga',district:'Sivaganga'},139:{name:'Manamadurai',district:'Sivaganga'},140:{name:'Karaikudi',district:'Sivaganga'},141:{name:'Tiruppattur',district:'Sivaganga'},142:{name:'Aruppukkottai',district:'Virudhunagar'},143:{name:'Rajapalayam',district:'Virudhunagar'},144:{name:'Srivilliputhur',district:'Virudhunagar'},145:{name:'Sattur',district:'Virudhunagar'},146:{name:'Sivakasi',district:'Virudhunagar'},147:{name:'Virudhunagar',district:'Virudhunagar'},148:{name:'Sankarankovil',district:'Tenkasi'},149:{name:'Vasudevanallur',district:'Tenkasi'},150:{name:'Kadayanallur',district:'Tenkasi'},151:{name:'Tenkasi',district:'Tenkasi'},152:{name:'Alangulam',district:'Tenkasi'},153:{name:'Tirunelveli',district:'Tirunelveli'},154:{name:'Ambasamudram',district:'Tirunelveli'},155:{name:'Palayamkottai',district:'Tirunelveli'},156:{name:'Nanguneri',district:'Tirunelveli'},157:{name:'Radhapuram',district:'Tirunelveli'},158:{name:'Thoothukudi',district:'Thoothukudi'},159:{name:'Tiruchendur',district:'Thoothukudi'},160:{name:'Srivaikuntam',district:'Thoothukudi'},161:{name:'Ottapidaram',district:'Thoothukudi'},162:{name:'Vilathikulam',district:'Thoothukudi'},163:{name:'Thovalai',district:'Kanyakumari'},164:{name:'Nagercoil',district:'Kanyakumari'},165:{name:'Colachel',district:'Kanyakumari'},166:{name:'Padmanabhapuram',district:'Kanyakumari'},167:{name:'Vilavancode',district:'Kanyakumari'},168:{name:'Killiyoor',district:'Kanyakumari'},169:{name:'Papanasam',district:'Thanjavur'},170:{name:'Thiruvidaimarudur',district:'Thanjavur'},171:{name:'Kumbakonam',district:'Thanjavur'},172:{name:'Pattukkottai',district:'Thanjavur'},173:{name:'Thanjavur',district:'Thanjavur'},174:{name:'Orathanadu',district:'Thanjavur'},175:{name:'Peravurani',district:'Thanjavur'},176:{name:'Thiruvarur',district:'Tiruvarur'},177:{name:'Nannilam',district:'Tiruvarur'},178:{name:'Papanasam Tiruvarur',district:'Tiruvarur'},179:{name:'Nagapattinam',district:'Nagapattinam'},180:{name:'Kilvelur',district:'Nagapattinam'},181:{name:'Vedaranyam',district:'Nagapattinam'},182:{name:'Mayiladuthurai',district:'Mayiladuthurai'},183:{name:'Sirkazhi',district:'Mayiladuthurai'},184:{name:'Chidambaram',district:'Cuddalore'},185:{name:'Kattumannarkoil',district:'Cuddalore'},186:{name:'Cuddalore',district:'Cuddalore'},187:{name:'Bhuvanagiri',district:'Cuddalore'},188:{name:'Vridhachalam',district:'Cuddalore'},189:{name:'Neyveli',district:'Cuddalore'},190:{name:'Panruti',district:'Cuddalore'},191:{name:'Ulundurpettai',district:'Villupuram'},192:{name:'Kallakurichi',district:'Kallakurichi'},193:{name:'Sankarapuram',district:'Villupuram'},194:{name:'Tindivanam',district:'Villupuram'},195:{name:'Vanur',district:'Villupuram'},196:{name:'Villupuram',district:'Villupuram'},197:{name:'Vikravandi',district:'Villupuram'},198:{name:'Thirukoilur',district:'Villupuram'},199:{name:'Rishivandiyam',district:'Villupuram'},200:{name:'Gingee',district:'Villupuram'},201:{name:'Mailam',district:'Villupuram'},202:{name:'Ponneri',district:'Tiruvallur'},203:{name:'Tiruttani',district:'Tiruvallur'},204:{name:'Thiruvallur',district:'Tiruvallur'},205:{name:'Poonamallee',district:'Tiruvallur'},206:{name:'Avadi',district:'Tiruvallur'},207:{name:'Maduravoyal',district:'Tiruvallur'},208:{name:'Ambattur',district:'Tiruvallur'},209:{name:'Madavaram',district:'Tiruvallur'},210:{name:'Gummidipoondi',district:'Tiruvallur'},211:{name:'Ramanathapuram',district:'Ramanathapuram'},212:{name:'Mudhukulathur',district:'Ramanathapuram'},213:{name:'Paramakudi',district:'Ramanathapuram'},214:{name:'Tiruvadanai',district:'Ramanathapuram'},215:{name:'Pudukkottai',district:'Pudukkottai'},216:{name:'Thirumayam',district:'Pudukkottai'},217:{name:'Alangudi',district:'Pudukkottai'},218:{name:'Aranthangi',district:'Pudukkottai'},219:{name:'Chengam',district:'Tiruvannamalai'},220:{name:'Tiruvannamalai',district:'Tiruvannamalai'},221:{name:'Kilpennathur',district:'Tiruvannamalai'},222:{name:'Kalasapakkam',district:'Tiruvannamalai'},223:{name:'Polur',district:'Tiruvannamalai'},224:{name:'Arani',district:'Tiruvannamalai'},225:{name:'Cheyyar',district:'Tiruvannamalai'},226:{name:'Vandavasi',district:'Tiruvannamalai'},227:{name:'Vembakkam',district:'Tiruvannamalai'},228:{name:'Perungalathur',district:'Kancheepuram'},229:{name:'Walajapet',district:'Ranipet'},230:{name:'Kaveripakkam',district:'Ranipet'},231:{name:'Anaicut',district:'Vellore'},232:{name:'Palacode',district:'Dharmapuri'},233:{name:'Alangudi Karur',district:'Karur'},234:{name:'Aruppukkottai South',district:'Virudhunagar'},
}

interface Seat {
  acNo: number
  name: string
  district: string
  party: string
  candidate: string
  color: string
  emoji: string
}

export default function ConstituencySearch() {
  const [seats, setSeats]       = useState<Seat[]>([])
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState<Seat[]>([])
  const [selected, setSelected] = useState<Seat | null>(null)
  const [copied, setCopied]     = useState(false)
  const [mounted, setMounted]   = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
    fetch(ECI_JSON, { cache: 'no-store', signal: AbortSignal.timeout(8000) })
      .then(r => r.json())
      .then((json: Record<string, { chartData: [string, string, number, string, string][] }>) => {
        const s22 = json['S22']
        if (!s22?.chartData) return
        const loaded: Seat[] = s22.chartData.map(([raw, , acNo, candidate]) => {
          const seat  = TN_SEATS[acNo] ?? { name: `Constituency ${acNo}`, district: 'Tamil Nadu' }
          const party = PARTY_ALIASES[raw] ?? 'Others'
          return {
            acNo, name: seat.name, district: seat.district,
            party, candidate,
            color: PARTY_COLORS[party] ?? '#94a3b8',
            emoji: PARTY_EMOJI[party] ?? '🏛️',
          }
        }).sort((a, b) => a.acNo - b.acNo)
        setSeats(loaded)
      })
      .catch(() => {})
  }, [])

  const search = useCallback((q: string) => {
    setQuery(q)
    setSelected(null)
    if (!q.trim()) { setResults([]); return }
    const lq = q.toLowerCase()
    const matches = seats.filter(s =>
      s.name.toLowerCase().includes(lq) ||
      s.district.toLowerCase().includes(lq) ||
      s.candidate.toLowerCase().includes(lq) ||
      s.party.toLowerCase().includes(lq)
    ).slice(0, 6)
    setResults(matches)
    if (matches.length === 1) setSelected(matches[0])
  }, [seats])

  const copyShare = (seat: Seat) => {
    const text = `🗳️ ${seat.name} (AC #${seat.acNo}), ${seat.district}\n✅ Winner: ${seat.emoji} ${seat.party} — ${seat.candidate}\n\nFull TN Election 2026 results: https://nammatamil.live`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  if (!mounted) return null

  return (
    <div style={{
      borderRadius: 18, overflow: 'hidden',
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(255,255,255,0.08)',
      marginBottom: 14,
    }}>
      {/* Search header */}
      <div style={{ padding: '14px 16px 10px' }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
          🔍 Search your constituency
        </div>
        <div style={{ position: 'relative' }}>
          <input
            ref={inputRef}
            value={query}
            onChange={e => search(e.target.value)}
            placeholder="Type constituency, district or candidate name…"
            style={{
              width: '100%', padding: '11px 40px 11px 14px', borderRadius: 12, boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.9)', fontSize: 13, fontFamily: 'inherit',
              outline: 'none',
            }}
            onFocus={e => { e.target.style.borderColor = 'rgba(251,191,36,0.4)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)' }}
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]); setSelected(null); inputRef.current?.focus() }}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: 16, padding: '0 4px' }}>
              ✕
            </button>
          )}
        </div>

        {/* Quick popular searches */}
        {!query && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            {['Kolathur','Edappadi','Madurai Central','Coimbatore South','Anna Nagar','Velachery'].map(s => (
              <button key={s} onClick={() => search(s)} style={{
                fontSize: 10, padding: '4px 10px', borderRadius: 99, cursor: 'pointer',
                background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)',
                color: 'rgba(251,191,36,0.7)', fontFamily: 'inherit',
              }}>{s}</button>
            ))}
          </div>
        )}
      </div>

      {/* Results dropdown */}
      {results.length > 0 && !selected && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {results.map(seat => (
            <button key={seat.acNo} onClick={() => setSelected(seat)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: '1px solid rgba(255,255,255,0.04)', textAlign: 'left',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{seat.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: seat.color }}>{seat.name}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>{seat.district} · AC #{seat.acNo}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: seat.color }}>{seat.party}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>won</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Selected result — full card */}
      {selected && (
        <div style={{
          margin: '0 12px 14px', borderRadius: 14,
          background: `linear-gradient(135deg, ${selected.color}18 0%, rgba(0,0,0,0) 70%)`,
          border: `1.5px solid ${selected.color}40`,
          overflow: 'hidden',
          animation: 'csSlide 0.25s ease',
        }}>
          {/* Color bar */}
          <div style={{ height: 3, background: `linear-gradient(90deg,${selected.color}00,${selected.color},${selected.color}00)` }} />
          <div style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em', marginBottom: 4 }}>
                  AC #{selected.acNo} · {selected.district} District
                </div>
                <div style={{ fontSize: 'clamp(16px,4vw,22px)', fontWeight: 900, color: 'rgba(255,255,255,0.92)', lineHeight: 1.2 }}>
                  {selected.name}
                </div>
              </div>
              <span style={{ fontSize: 32, flexShrink: 0 }}>{selected.emoji}</span>
            </div>

            {/* Winner details */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{
                flex: 1, padding: '10px 14px', borderRadius: 10,
                background: `${selected.color}12`, border: `1px solid ${selected.color}30`,
              }}>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 4 }}>✅ WINNER</div>
                <div style={{ fontSize: 15, fontWeight: 900, color: selected.color, marginBottom: 2 }}>{selected.party}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
                  {selected.candidate.split(' ').map((w: string) => w[0] + w.slice(1).toLowerCase()).join(' ')}
                </div>
              </div>
            </div>

            {/* Share buttons */}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={() => copyShare(selected)} style={{
                flex: 1, padding: '9px 12px', borderRadius: 9, cursor: 'pointer',
                background: copied ? 'rgba(74,222,128,0.12)' : 'rgba(251,191,36,0.1)',
                border: copied ? '1px solid rgba(74,222,128,0.3)' : '1px solid rgba(251,191,36,0.25)',
                color: copied ? '#4ade80' : '#fbbf24',
                fontSize: 11, fontWeight: 800, fontFamily: 'inherit',
                transition: 'all 0.2s',
              }}>
                {copied ? '✓ Copied for WhatsApp!' : '📲 Share on WhatsApp'}
              </button>
              <button onClick={() => { setSelected(null); setQuery(''); setResults([]) }} style={{
                padding: '9px 12px', borderRadius: 9, cursor: 'pointer',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'inherit',
              }}>
                Search again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No results */}
      {query && results.length === 0 && seats.length > 0 && (
        <div style={{ padding: '16px', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>
          No results for &quot;{query}&quot; — try the district name or a candidate name
        </div>
      )}

      <style>{`@keyframes csSlide { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  )
}
