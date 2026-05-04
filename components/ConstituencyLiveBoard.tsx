'use client'

/**
 * ConstituencyLiveBoard — Tamil Nadu 2026 live per-constituency results
 *
 * Filterable grid of all 234 seats.
 * Auto-refreshes every 90 seconds during counting.
 * Color-coded by leading party. Flash animation on updates.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, Zap, ChevronDown, X, TrendingUp, Users, Award, MapPin } from 'lucide-react'

interface ConstituencyResult {
  id: number
  name: string
  district: string
  leadingParty: string | null
  leadingCandidate: string | null
  margin: number | null
  votesLeading: number | null
  status: 'pending' | 'leading' | 'won'
  updatedAt: string
}

interface ConstituenciesResponse {
  constituencies: ConstituencyResult[]
  totalReporting: number
  totalSeats: number
  updatedAt: string
  source: string
  fallbackLevel: number
  cached?: boolean
}

const PARTY_COLORS: Record<string, string> = {
  TVK:    '#fbbf24',
  DMK:    '#f87171',
  AIADMK: '#4ade80',
  BJP:    '#fb923c',
  Others: '#94a3b8',
}

const REFRESH_MS = 60 * 1000   // refresh every 60s on counting day

// ── ECI direct fetch (browser-side — ECI allows browser CORS, blocks server IPs) ──
const ECI_JSON = 'https://results.eci.gov.in/ResultAcGenMay2026/election-json-S22-live.json'

const TN_SEATS: Record<number, { name: string; district: string }> = {
  1:{'name':'Thiruvottiyur','district':'Chennai'},2:{'name':'Dr. Radhakrishnan Nagar','district':'Chennai'},3:{'name':'Perambur','district':'Chennai'},4:{'name':'Kolathur','district':'Chennai'},5:{'name':'Villivakkam','district':'Chennai'},6:{'name':'Thiru Vi Ka Nagar','district':'Chennai'},7:{'name':'Egmore','district':'Chennai'},8:{'name':'Royapuram','district':'Chennai'},9:{'name':'Harbour','district':'Chennai'},10:{'name':'Chepauk-Thiruvallikeni','district':'Chennai'},11:{'name':'Thousand Lights','district':'Chennai'},12:{'name':'Anna Nagar','district':'Chennai'},13:{'name':'Virugambakkam','district':'Chennai'},14:{'name':'Saidapet','district':'Chennai'},15:{'name':'Thiyagaraya Nagar','district':'Chennai'},16:{'name':'Mylapore','district':'Chennai'},17:{'name':'Velachery','district':'Chennai'},18:{'name':'Sholinganallur','district':'Chennai'},19:{'name':'Alandur','district':'Kancheepuram'},20:{'name':'Sriperumbudur','district':'Kancheepuram'},21:{'name':'Pallavaram','district':'Kancheepuram'},22:{'name':'Tambaram','district':'Chengalpattu'},23:{'name':'Chengalpattu','district':'Chengalpattu'},24:{'name':'Madurantakam','district':'Chengalpattu'},25:{'name':'Uthiramerur','district':'Kancheepuram'},26:{'name':'Kancheepuram','district':'Kancheepuram'},27:{'name':'Arakkonam','district':'Ranipet'},28:{'name':'Sholingur','district':'Ranipet'},29:{'name':'Katpadi','district':'Vellore'},30:{'name':'Ranipet','district':'Ranipet'},31:{'name':'Arcot','district':'Ranipet'},32:{'name':'Vellore','district':'Vellore'},33:{'name':'Anaikattu','district':'Vellore'},34:{'name':'Kilvaithinankuppam','district':'Vellore'},35:{'name':'Gudiyatham','district':'Vellore'},36:{'name':'Vaniyambadi','district':'Tirupattur'},37:{'name':'Ambur','district':'Tirupattur'},38:{'name':'Jolarpet','district':'Tirupattur'},39:{'name':'Tirupattur','district':'Tirupattur'},40:{'name':'Uthangarai','district':'Krishnagiri'},41:{'name':'Bargur','district':'Krishnagiri'},42:{'name':'Krishnagiri','district':'Krishnagiri'},43:{'name':'Veppanahalli','district':'Krishnagiri'},44:{'name':'Hosur','district':'Krishnagiri'},45:{'name':'Thalli','district':'Krishnagiri'},46:{'name':'Palacodu','district':'Dharmapuri'},47:{'name':'Pennagaram','district':'Dharmapuri'},48:{'name':'Dharmapuri','district':'Dharmapuri'},49:{'name':'Pappireddippatti','district':'Dharmapuri'},50:{'name':'Harur','district':'Dharmapuri'},51:{'name':'Omalur','district':'Salem'},52:{'name':'Mettur','district':'Salem'},53:{'name':'Edappadi','district':'Salem'},54:{'name':'Sankari','district':'Salem'},55:{'name':'Salem (West)','district':'Salem'},56:{'name':'Salem (North)','district':'Salem'},57:{'name':'Salem (South)','district':'Salem'},58:{'name':'Veerapandi','district':'Salem'},59:{'name':'Attur','district':'Salem'},60:{'name':'Yercaud','district':'Salem'},61:{'name':'Gangavalli','district':'Salem'},62:{'name':'Rasipuram','district':'Namakkal'},63:{'name':'Senthamangalam','district':'Namakkal'},64:{'name':'Namakkal','district':'Namakkal'},65:{'name':'Paramathi Velur','district':'Namakkal'},66:{'name':'Tiruchengode','district':'Namakkal'},67:{'name':'Kumarapalayam','district':'Namakkal'},68:{'name':'Erode (East)','district':'Erode'},69:{'name':'Erode (West)','district':'Erode'},70:{'name':'Modakurichi','district':'Erode'},71:{'name':'Perundurai','district':'Erode'},72:{'name':'Bhavani','district':'Erode'},73:{'name':'Anthiyur','district':'Erode'},74:{'name':'Gobichettipalayam','district':'Erode'},75:{'name':'Bhavanisagar','district':'Erode'},76:{'name':'Gudalur','district':'Nilgiris'},77:{'name':'Udhagamandalam','district':'Nilgiris'},78:{'name':'Kundah','district':'Nilgiris'},79:{'name':'Coonoor','district':'Nilgiris'},80:{'name':'Mettuppalayam','district':'Coimbatore'},81:{'name':'Avanashi','district':'Tiruppur'},82:{'name':'Tiruppur (North)','district':'Tiruppur'},83:{'name':'Tiruppur (South)','district':'Tiruppur'},84:{'name':'Palladam','district':'Tiruppur'},85:{'name':'Dharapuram','district':'Tiruppur'},86:{'name':'Kangeyam','district':'Tiruppur'},87:{'name':'Udumalaipettai','district':'Tiruppur'},88:{'name':'Madathukulam','district':'Tiruppur'},89:{'name':'Pollachi','district':'Coimbatore'},90:{'name':'Valparai','district':'Coimbatore'},91:{'name':'Sulur','district':'Coimbatore'},92:{'name':'Coimbatore (North)','district':'Coimbatore'},93:{'name':'Thondamuthur','district':'Coimbatore'},94:{'name':'Coimbatore (South)','district':'Coimbatore'},95:{'name':'Singanallur','district':'Coimbatore'},96:{'name':'Kinathukadavu','district':'Coimbatore'},97:{'name':'Kavundampalayam','district':'Coimbatore'},98:{'name':'Mettupalayam','district':'Coimbatore'},99:{'name':'Palani','district':'Dindigul'},100:{'name':'Oddanchatram','district':'Dindigul'},101:{'name':'Athoor','district':'Dindigul'},102:{'name':'Dindigul','district':'Dindigul'},103:{'name':'Natham','district':'Dindigul'},104:{'name':'Nilakottai','district':'Dindigul'},105:{'name':'Vedasandur','district':'Dindigul'},106:{'name':'Aravakurichi','district':'Karur'},107:{'name':'Karur','district':'Karur'},108:{'name':'Krishnarayapuram','district':'Karur'},109:{'name':'Kulithalai','district':'Karur'},110:{'name':'Musiri','district':'Tiruchirappalli'},111:{'name':'Thuraiyur','district':'Tiruchirappalli'},112:{'name':'Perambalur','district':'Perambalur'},113:{'name':'Kunnam','district':'Perambalur'},114:{'name':'Ariyalur','district':'Ariyalur'},115:{'name':'Jayankondam','district':'Ariyalur'},116:{'name':'Tiruchirappalli (West)','district':'Tiruchirappalli'},117:{'name':'Tiruchirappalli (East)','district':'Tiruchirappalli'},118:{'name':'Thiruverumbur','district':'Tiruchirappalli'},119:{'name':'Srirangam','district':'Tiruchirappalli'},120:{'name':'Tiruverumbur','district':'Tiruchirappalli'},121:{'name':'Lalgudi','district':'Tiruchirappalli'},122:{'name':'Manachanallur','district':'Tiruchirappalli'},123:{'name':'Manapparai','district':'Tiruchirappalli'},124:{'name':'Melur','district':'Madurai'},125:{'name':'Madurai (East)','district':'Madurai'},126:{'name':'Sholavandan','district':'Madurai'},127:{'name':'Madurai (North)','district':'Madurai'},128:{'name':'Madurai (South)','district':'Madurai'},129:{'name':'Madurai (Central)','district':'Madurai'},130:{'name':'Madurai (West)','district':'Madurai'},131:{'name':'Thiruparankundram','district':'Madurai'},132:{'name':'Thirumangalam','district':'Madurai'},133:{'name':'Usilampatti','district':'Madurai'},134:{'name':'Andipatti','district':'Theni'},135:{'name':'Periyakulam','district':'Theni'},136:{'name':'Bodinayakanur','district':'Theni'},137:{'name':'Cumbum','district':'Theni'},138:{'name':'Sivaganga','district':'Sivaganga'},139:{'name':'Manamadurai','district':'Sivaganga'},140:{'name':'Karaikudi','district':'Sivaganga'},141:{'name':'Tiruppattur','district':'Sivaganga'},142:{'name':'Aruppukkottai','district':'Virudhunagar'},143:{'name':'Rajapalayam','district':'Virudhunagar'},144:{'name':'Srivilliputhur','district':'Virudhunagar'},145:{'name':'Sattur','district':'Virudhunagar'},146:{'name':'Sivakasi','district':'Virudhunagar'},147:{'name':'Virudhunagar','district':'Virudhunagar'},148:{'name':'Sankarankovil','district':'Tenkasi'},149:{'name':'Vasudevanallur','district':'Tenkasi'},150:{'name':'Kadayanallur','district':'Tenkasi'},151:{'name':'Tenkasi','district':'Tenkasi'},152:{'name':'Alangulam','district':'Tenkasi'},153:{'name':'Tirunelveli','district':'Tirunelveli'},154:{'name':'Ambasamudram','district':'Tirunelveli'},155:{'name':'Palayamkottai','district':'Tirunelveli'},156:{'name':'Nanguneri','district':'Tirunelveli'},157:{'name':'Radhapuram','district':'Tirunelveli'},158:{'name':'Thoothukudi','district':'Thoothukudi'},159:{'name':'Tiruchendur','district':'Thoothukudi'},160:{'name':'Srivaikuntam','district':'Thoothukudi'},161:{'name':'Ottapidaram','district':'Thoothukudi'},162:{'name':'Vilathikulam','district':'Thoothukudi'},163:{'name':'Thovalai','district':'Kanyakumari'},164:{'name':'Nagercoil','district':'Kanyakumari'},165:{'name':'Colachel','district':'Kanyakumari'},166:{'name':'Padmanabhapuram','district':'Kanyakumari'},167:{'name':'Vilavancode','district':'Kanyakumari'},168:{'name':'Killiyoor','district':'Kanyakumari'},169:{'name':'Papanasam','district':'Thanjavur'},170:{'name':'Thiruvidaimarudur','district':'Thanjavur'},171:{'name':'Kumbakonam','district':'Thanjavur'},172:{'name':'Pattukkottai','district':'Thanjavur'},173:{'name':'Thanjavur','district':'Thanjavur'},174:{'name':'Orathanadu','district':'Thanjavur'},175:{'name':'Peravurani','district':'Thanjavur'},176:{'name':'Papanasam (Tiruvarur)','district':'Tiruvarur'},177:{'name':'Thiruvarur','district':'Tiruvarur'},178:{'name':'Nannilam','district':'Tiruvarur'},179:{'name':'Nagapattinam','district':'Nagapattinam'},180:{'name':'Kilvelur','district':'Nagapattinam'},181:{'name':'Vedaranyam','district':'Nagapattinam'},182:{'name':'Mayiladuthurai','district':'Mayiladuthurai'},183:{'name':'Sirkazhi','district':'Mayiladuthurai'},184:{'name':'Chidambaram','district':'Cuddalore'},185:{'name':'Kattumannarkoil','district':'Cuddalore'},186:{'name':'Cuddalore','district':'Cuddalore'},187:{'name':'Bhuvanagiri','district':'Cuddalore'},188:{'name':'Vridhachalam','district':'Cuddalore'},189:{'name':'Neyveli','district':'Cuddalore'},190:{'name':'Panruti','district':'Cuddalore'},191:{'name':'Ulundurpettai','district':'Villupuram'},192:{'name':'Kallakurichi','district':'Kallakurichi'},193:{'name':'Sankarapuram','district':'Villupuram'},194:{'name':'Tindivanam','district':'Villupuram'},195:{'name':'Vanur','district':'Villupuram'},196:{'name':'Villupuram','district':'Villupuram'},197:{'name':'Vikravandi','district':'Villupuram'},198:{'name':'Thirukoilur','district':'Villupuram'},199:{'name':'Rishivandiyam','district':'Villupuram'},200:{'name':'Gingee','district':'Villupuram'},201:{'name':'Mailam','district':'Villupuram'},202:{'name':'Ponneri','district':'Tiruvallur'},203:{'name':'Tiruttani','district':'Tiruvallur'},204:{'name':'Thiruvallur','district':'Tiruvallur'},205:{'name':'Poonamallee','district':'Tiruvallur'},206:{'name':'Avadi','district':'Tiruvallur'},207:{'name':'Maduravoyal','district':'Tiruvallur'},208:{'name':'Ambattur','district':'Tiruvallur'},209:{'name':'Madavaram','district':'Tiruvallur'},210:{'name':'Gummidipoondi','district':'Tiruvallur'},211:{'name':'Ramanathapuram','district':'Ramanathapuram'},212:{'name':'Mudhukulathur','district':'Ramanathapuram'},213:{'name':'Paramakudi','district':'Ramanathapuram'},214:{'name':'Tiruvadanai','district':'Ramanathapuram'},215:{'name':'Pudukkottai','district':'Pudukkottai'},216:{'name':'Thirumayam','district':'Pudukkottai'},217:{'name':'Alangudi','district':'Pudukkottai'},218:{'name':'Aranthangi','district':'Pudukkottai'},219:{'name':'Chengam','district':'Tiruvannamalai'},220:{'name':'Tiruvannamalai','district':'Tiruvannamalai'},221:{'name':'Kilpennathur','district':'Tiruvannamalai'},222:{'name':'Kalasapakkam','district':'Tiruvannamalai'},223:{'name':'Polur','district':'Tiruvannamalai'},224:{'name':'Arani','district':'Tiruvannamalai'},225:{'name':'Cheyyar','district':'Tiruvannamalai'},226:{'name':'Vandavasi','district':'Tiruvannamalai'},227:{'name':'Vembakkam','district':'Tiruvannamalai'},228:{'name':'Perkkaranai','district':'Kancheepuram'},229:{'name':'Walajapet','district':'Ranipet'},230:{'name':'Kaveripakkam','district':'Ranipet'},231:{'name':'Anaicut','district':'Vellore'},232:{'name':'Palacode','district':'Dharmapuri'},233:{'name':'Alangudi (Karur)','district':'Karur'},234:{'name':'Aruppukkottai (South)','district':'Virudhunagar'},
}

const PARTY_ALIASES: Record<string, string> = {
  TVK:'TVK', DMK:'DMK', ADMK:'AIADMK', AIADMK:'AIADMK', BJP:'BJP',
  PMK:'Others', INC:'Others', CPI:'Others', VCK:'Others', DMDK:'Others',
  IUML:'Others', AMMKMNKZ:'Others', PT:'Others',
}

async function fetchECIDirect(): Promise<ConstituenciesResponse | null> {
  try {
    const res = await fetch(ECI_JSON, { cache: 'no-store', signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    const json = await res.json() as Record<string, { chartData: [string, string, number, string, string][] }>
    const s22 = json['S22']
    if (!s22?.chartData || s22.chartData.length < 10) return null

    const now = new Date().toISOString()
    const constituencies: ConstituencyResult[] = s22.chartData.map(([rawParty, , acNo, candidate]) => {
      const seat = TN_SEATS[acNo] ?? { name: `Constituency ${acNo}`, district: 'Unknown' }
      return {
        id: acNo,
        name: seat.name,
        district: seat.district,
        leadingParty: PARTY_ALIASES[rawParty] ?? 'Others',
        leadingCandidate: candidate,
        margin: null,
        votesLeading: null,
        status: 'leading' as const,
        updatedAt: now,
      }
    }).sort((a, b) => a.id - b.id)

    return {
      constituencies,
      totalReporting: constituencies.length,
      totalSeats: 234,
      updatedAt: now,
      source: 'eci-live',
      fallbackLevel: 1,
    }
  } catch {
    return null
  }
}

function formatMargin(n: number | null): string {
  if (n === null) return ''
  if (n >= 1000) return `+${(n / 1000).toFixed(1)}K`
  return `+${n}`
}

function formatVotes(n: number | null): string {
  if (n === null) return ''
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return `${n}`
}

// ── Single constituency card ──────────────────────────────────────────────────
function ConstCard({ c, flash, onClick }: { c: ConstituencyResult; flash: boolean; onClick: () => void }) {
  const color  = c.leadingParty ? PARTY_COLORS[c.leadingParty] ?? '#94a3b8' : 'rgba(255,255,255,0.10)'
  const isPend = c.status === 'pending'
  const isWon  = c.status === 'won'

  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: 12,
        padding: '10px 11px',
        background: isPend
          ? 'rgba(255,255,255,0.018)'
          : isWon
            ? `${color}18`
            : `${color}0b`,
        border: `1px solid ${isPend ? 'rgba(255,255,255,0.045)' : isWon ? color + '50' : color + '2a'}`,
        boxShadow: flash ? `0 0 18px ${color}38` : isWon ? `0 2px 12px ${color}28` : 'none',
        transition: 'box-shadow 0.4s ease, transform 0.12s ease',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)' }}
    >
      {/* Flash overlay */}
      {flash && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `${color}14`,
          animation: 'cFadeOut 1.4s ease forwards',
          pointerEvents: 'none',
        }} />
      )}

      {/* Won stripe at top */}
      {isWon && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: color,
        }} />
      )}

      {/* Header row: name + status badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4, marginBottom: 3 }}>
        <div style={{
          fontSize: 11, fontWeight: 800,
          color: isPend ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.9)',
          lineHeight: 1.25, flex: 1, minWidth: 0,
        }}>
          {c.name}
        </div>
        {!isPend && (
          <span style={{
            flexShrink: 0, fontSize: 7, fontWeight: 900, padding: '2px 5px', borderRadius: 4,
            background: isWon ? color : `${color}20`,
            color: isWon ? '#000' : color,
            letterSpacing: '0.06em',
          }}>
            {isWon ? '✓ WON' : 'LEADING'}
          </span>
        )}
      </div>

      {/* District */}
      <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', marginBottom: 7 }}>
        {c.district}
      </div>

      {isPend ? (
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.13)', fontStyle: 'italic' }}>Awaiting…</div>
      ) : (
        <>
          {/* Party pill + candidate */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 9, fontWeight: 900, padding: '2px 7px', borderRadius: 5,
              background: `${color}20`, color, border: `1px solid ${color}35`,
            }}>
              {c.leadingParty}
            </span>
            {c.leadingCandidate && (
              <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                {c.leadingCandidate.split(' ').slice(0, 2).join(' ')}
              </span>
            )}
          </div>

          {/* Margin + votes row */}
          {(c.margin !== null || c.votesLeading !== null) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
              {c.margin !== null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.22)', fontWeight: 600 }}>MARGIN</span>
                  <span style={{ fontSize: 10, fontWeight: 900, color, fontVariantNumeric: 'tabular-nums' }}>
                    {formatMargin(c.margin)}
                  </span>
                </div>
              )}
              {c.votesLeading !== null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.18)', fontWeight: 600 }}>VOTES</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.45)', fontVariantNumeric: 'tabular-nums' }}>
                    {formatVotes(c.votesLeading)}
                  </span>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Party tally pills ─────────────────────────────────────────────────────────
function PartyPills({ constituencies }: { constituencies: ConstituencyResult[] }) {
  const counts: Record<string, { leading: number; won: number }> = {}
  for (const c of constituencies) {
    if (!c.leadingParty) continue
    if (!counts[c.leadingParty]) counts[c.leadingParty] = { leading: 0, won: 0 }
    if (c.status === 'won') counts[c.leadingParty].won++
    else counts[c.leadingParty].leading++
  }
  const sorted = Object.entries(counts).sort((a, b) => (b[1].won + b[1].leading) - (a[1].won + a[1].leading))
  if (sorted.length === 0) return null

  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'stretch' }}>
      {sorted.map(([party, { leading, won }]) => {
        const color = PARTY_COLORS[party] ?? '#94a3b8'
        const total = won + leading
        return (
          <div key={party} style={{
            display: 'flex', flexDirection: 'column',
            padding: '8px 12px', borderRadius: 10,
            background: `${color}0d`, border: `1px solid ${color}28`,
            minWidth: 72,
          }}>
            {/* Party name + total */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 5 }}>
              <span style={{ fontWeight: 900, fontSize: 11, color }}>{party}</span>
              <span style={{ fontWeight: 900, fontSize: 18, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{total}</span>
            </div>
            {/* Won / Leading breakdown */}
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{
                flex: 1, textAlign: 'center', padding: '3px 4px', borderRadius: 5,
                background: won > 0 ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${won > 0 ? 'rgba(74,222,128,0.25)' : 'rgba(255,255,255,0.06)'}`,
              }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: won > 0 ? '#4ade80' : 'rgba(255,255,255,0.18)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{won}</div>
                <div style={{ fontSize: 7, color: won > 0 ? 'rgba(74,222,128,0.6)' : 'rgba(255,255,255,0.14)', fontWeight: 700, marginTop: 2 }}>WON</div>
              </div>
              <div style={{
                flex: 1, textAlign: 'center', padding: '3px 4px', borderRadius: 5,
                background: leading > 0 ? `${color}14` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${leading > 0 ? color + '28' : 'rgba(255,255,255,0.06)'}`,
              }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: leading > 0 ? color : 'rgba(255,255,255,0.18)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{leading}</div>
                <div style={{ fontSize: 7, color: leading > 0 ? `${color}99` : 'rgba(255,255,255,0.14)', fontWeight: 700, marginTop: 2 }}>LEAD</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Constituency detail modal ─────────────────────────────────────────────────
function ConstituencyModal({ c, onClose }: { c: ConstituencyResult; onClose: () => void }) {
  const color  = c.leadingParty ? PARTY_COLORS[c.leadingParty] ?? '#94a3b8' : '#94a3b8'
  const isWon  = c.status === 'won'
  const isLead = c.status === 'leading'

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 400,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-end',
        justifyContent: 'center', padding: '0 0 0 0',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%', maxWidth: 480,
          background: '#0d0018',
          border: `1px solid ${color}40`,
          borderRadius: '20px 20px 0 0',
          padding: '20px 20px 32px',
          boxShadow: `0 -8px 40px ${color}28`,
          animation: 'slideUp 0.25s cubic-bezier(.34,1.56,.64,1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16,
            width: 28, height: 28, borderRadius: '50%',
            background: 'rgba(255,255,255,0.07)', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)',
          }}
        >
          <X style={{ width: 14, height: 14 }} />
        </button>

        {/* Status badge */}
        <div style={{ marginBottom: 12 }}>
          <span style={{
            fontSize: 9, fontWeight: 900, padding: '3px 8px', borderRadius: 5, letterSpacing: '0.08em',
            background: isWon ? color : isLead ? `${color}22` : 'rgba(255,255,255,0.07)',
            color: isWon ? '#000' : isLead ? color : 'rgba(255,255,255,0.3)',
            border: isLead ? `1px solid ${color}40` : 'none',
          }}>
            {isWon ? '✓ WON' : isLead ? 'LEADING' : 'PENDING'}
          </span>
        </div>

        {/* Constituency name */}
        <h2 style={{ fontSize: 22, fontWeight: 900, color: 'rgba(255,255,255,0.92)', marginBottom: 4, lineHeight: 1.2 }}>
          {c.name}
        </h2>

        {/* District */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 20, color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>
          <MapPin style={{ width: 11, height: 11 }} />
          {c.district} District
        </div>

        {c.status === 'pending' ? (
          <div style={{
            padding: '24px', borderRadius: 12, textAlign: 'center',
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Awaiting count results</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Party card */}
            <div style={{
              padding: '14px 16px', borderRadius: 12,
              background: `${color}10`, border: `1px solid ${color}30`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{
                  fontSize: 13, fontWeight: 900, padding: '3px 10px', borderRadius: 6,
                  background: `${color}20`, color, border: `1px solid ${color}40`,
                }}>
                  {c.leadingParty}
                </span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                  {c.leadingCandidate}
                </span>
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {c.margin !== null && (
                <div style={{
                  padding: '12px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                    <TrendingUp style={{ width: 11, height: 11, color: color }} />
                    <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.07em' }}>MARGIN</span>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 900, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                    {formatMargin(c.margin)}
                  </div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 3 }}>votes ahead</div>
                </div>
              )}
              {c.votesLeading !== null && (
                <div style={{
                  padding: '12px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                    <Users style={{ width: 11, height: 11, color: 'rgba(255,255,255,0.4)' }} />
                    <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.07em' }}>VOTES</span>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: 'rgba(255,255,255,0.75)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                    {formatVotes(c.votesLeading)}
                  </div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 3 }}>leading candidate</div>
                </div>
              )}
            </div>

            {/* Majority context */}
            {isWon && (
              <div style={{
                padding: '10px 14px', borderRadius: 10,
                background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.2)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <Award style={{ width: 14, height: 14, color: '#4ade80', flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: 'rgba(74,222,128,0.8)', fontWeight: 700 }}>
                  Result officially declared — seat counted
                </span>
              </div>
            )}
          </div>
        )}

        {/* Last updated */}
        <p style={{ marginTop: 16, fontSize: 9, color: 'rgba(255,255,255,0.15)', textAlign: 'right' }}>
          Last updated: {new Date(c.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ConstituencyLiveBoard() {
  const [data, setData]               = useState<ConstituenciesResponse | null>(null)
  const [loading, setLoading]         = useState(true)
  const [refreshing, setRefreshing]   = useState(false)
  const [search, setSearch]           = useState('')
  const [district, setDistrict]       = useState('All Districts')
  const [partyFilter, setPartyFilter] = useState('All')
  const [flashIds, setFlashIds]       = useState<Set<number>>(new Set())
  const [secAgo, setSecAgo]           = useState(0)
  const [expanded, setExpanded]       = useState<ConstituencyResult | null>(null)
  const prevRef                       = useRef<Map<number, string>>(new Map())

  const fetchData = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true)
    try {
      // Try ECI directly from browser first (ECI blocks server IPs but allows browser CORS)
      let next = await fetchECIDirect()
      // Fallback to our API if ECI direct fails
      if (!next) {
        const res = await fetch('/api/election-results/constituencies', {
          cache: 'no-store',
          signal: AbortSignal.timeout(12000),
        })
        if (!res.ok) return
        next = await res.json() as ConstituenciesResponse
      }
      if (!next) return
      const flash = new Set<number>()
      for (const c of next.constituencies) {
        const prev = prevRef.current.get(c.id)
        if (c.leadingParty && prev !== c.leadingParty) flash.add(c.id)
        if (c.leadingParty) prevRef.current.set(c.id, c.leadingParty)
      }
      setData(next)
      if (flash.size > 0) {
        setFlashIds(flash)
        setTimeout(() => setFlashIds(new Set()), 1500)
      }
      setSecAgo(0)
    } catch { /* keep prev */ }
    finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => {
    fetchData()
    const d = setInterval(fetchData, REFRESH_MS)
    const t = setInterval(() => setSecAgo(s => s + 1), 1000)
    return () => { clearInterval(d); clearInterval(t) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const constituencies = data?.constituencies ?? []
  const totalReporting = data?.totalReporting ?? 0
  const source         = data?.source ?? ''

  // District list
  const districts = ['All Districts', ...Array.from(new Set(constituencies.map(c => c.district))).sort()]
  const PARTIES   = ['All', 'TVK', 'DMK', 'AIADMK', 'BJP', 'Others', 'Pending']

  const filtered = constituencies.filter(c => {
    const q = search.toLowerCase()
    if (q && !c.name.toLowerCase().includes(q) && !c.district.toLowerCase().includes(q) && !(c.leadingCandidate ?? '').toLowerCase().includes(q)) return false
    if (district !== 'All Districts' && c.district !== district) return false
    if (partyFilter === 'Pending' && c.status !== 'pending') return false
    if (partyFilter !== 'All' && partyFilter !== 'Pending' && c.leadingParty !== partyFilter) return false
    return true
  })

  const hasActive = partyFilter !== 'All' || district !== 'All Districts' || search

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ── Party summary pills ── */}
      {!loading && <PartyPills constituencies={constituencies} />}

      {/* ── Race to 118 banner ── */}
      {!loading && (() => {
        const tallies118: Record<string, number> = {}
        for (const c of constituencies) {
          if (!c.leadingParty) continue
          tallies118[c.leadingParty] = (tallies118[c.leadingParty] ?? 0) + 1
        }
        const sorted = Object.entries(tallies118).sort((a, b) => b[1] - a[1])
        if (sorted.length === 0) return null
        const [leader, leaderCount] = sorted[0]
        const leaderColor  = PARTY_COLORS[leader] ?? '#94a3b8'
        const needed       = Math.max(0, 118 - leaderCount)
        const pctToMaj     = Math.min(100, Math.round((leaderCount / 118) * 100))
        const hasMajority  = leaderCount >= 118

        return (
          <div style={{
            borderRadius: 14, padding: '14px 16px',
            background: hasMajority
              ? `linear-gradient(135deg, ${leaderColor}1a 0%, rgba(74,222,128,0.08) 100%)`
              : `linear-gradient(135deg, ${leaderColor}0f 0%, rgba(255,255,255,0.02) 100%)`,
            border: `1px solid ${hasMajority ? leaderColor + '50' : leaderColor + '28'}`,
            boxShadow: hasMajority ? `0 4px 24px ${leaderColor}28` : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
              {/* Left: label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{
                  fontSize: 9, fontWeight: 900, padding: '2px 7px', borderRadius: 4, letterSpacing: '0.1em',
                  background: hasMajority ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.07)',
                  color: hasMajority ? '#4ade80' : 'rgba(255,255,255,0.4)',
                }}>
                  {hasMajority ? '🏆 MAJORITY' : 'RACE TO 118'}
                </span>
                <span style={{ fontSize: 10, fontWeight: 700, color: leaderColor }}>
                  {leader}
                </span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                  {hasMajority
                    ? `won ${leaderCount} seats — majority secured!`
                    : `leading ${leaderCount} · needs ${needed} more`}
                </span>
              </div>
              {/* Right: big number */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 28, fontWeight: 900, color: leaderColor, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                  {leaderCount}
                </span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', fontVariantNumeric: 'tabular-nums' }}>/118</span>
              </div>
            </div>

            {/* Progress to majority */}
            <div style={{ position: 'relative' }}>
              <div style={{ height: 10, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 99,
                  width: `${pctToMaj}%`,
                  background: hasMajority
                    ? 'linear-gradient(90deg, #4ade80, #22c55e)'
                    : `linear-gradient(90deg, ${leaderColor}cc, ${leaderColor})`,
                  transition: 'width 1.4s cubic-bezier(.34,1.56,.64,1)',
                  boxShadow: `0 0 10px ${leaderColor}80`,
                }} />
              </div>
              {/* Majority label at 100% */}
              <div style={{
                position: 'absolute', right: 0, top: -16,
                fontSize: 8, fontWeight: 900, color: '#fbbf24',
              }}>118 ↑</div>
            </div>

            {/* Runner-up row */}
            {sorted.length > 1 && (
              <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                {sorted.slice(1, 4).map(([p, cnt]) => {
                  const c = PARTY_COLORS[p] ?? '#94a3b8'
                  return (
                    <span key={p} style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>
                      <span style={{ color: c, fontWeight: 800 }}>{p}</span> {cnt}
                    </span>
                  )
                })}
              </div>
            )}
          </div>
        )
      })()}

      {/* ── Progress bar ── */}
      {!loading && (() => {
        const pct     = totalReporting / 234
        const pctNum  = Math.round(pct * 100)
        const remaining = 234 - totalReporting

        // Per-party segment widths from live data
        const tallies: Record<string, { won: number; leading: number }> = {}
        for (const c of constituencies) {
          if (!c.leadingParty) continue
          if (!tallies[c.leadingParty]) tallies[c.leadingParty] = { won: 0, leading: 0 }
          if (c.status === 'won') tallies[c.leadingParty].won++
          else tallies[c.leadingParty].leading++
        }
        const PARTY_ORDER = ['TVK', 'DMK', 'AIADMK', 'BJP', 'Others']

        return (
          <div style={{
            borderRadius: 14,
            padding: '14px 16px',
            background: 'rgba(255,255,255,0.022)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}>
            {/* Top row: label + count + timer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                {/* Live pulse */}
                <span style={{
                  width: 7, height: 7, borderRadius: '50%', flexShrink: 0, display: 'inline-block',
                  background: totalReporting > 0 ? '#ef4444' : 'rgba(255,255,255,0.2)',
                  boxShadow: totalReporting > 0 ? '0 0 8px #ef4444' : 'none',
                  animation: totalReporting > 0 ? 'cbPulse 1.5s ease-in-out infinite' : 'none',
                }} />
                <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.05em' }}>
                  SEATS COUNTED
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 22, fontWeight: 900, color: 'rgba(255,255,255,0.9)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                  {totalReporting}
                </span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontVariantNumeric: 'tabular-nums' }}>/ 234</span>
                <span style={{
                  marginLeft: 6, fontSize: 10, fontWeight: 900, padding: '2px 7px', borderRadius: 5,
                  background: pctNum > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)',
                  color: pctNum > 0 ? '#ef4444' : 'rgba(255,255,255,0.2)',
                  border: `1px solid ${pctNum > 0 ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.07)'}`,
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {pctNum}%
                </span>
              </div>
            </div>

            {/* Multi-segment bar */}
            <div style={{ position: 'relative', marginBottom: 8 }}>
              {/* Track */}
              <div style={{
                height: 18, borderRadius: 99,
                background: 'rgba(255,255,255,0.05)',
                overflow: 'hidden', display: 'flex',
                position: 'relative',
              }}>
                {totalReporting === 0 ? (
                  /* Animated waiting stripe when no data */
                  <div style={{
                    width: '100%', height: '100%',
                    background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.07) 20px, rgba(255,255,255,0.04) 40px)',
                    animation: 'cbScroll 2s linear infinite',
                  }} />
                ) : (
                  PARTY_ORDER.map(party => {
                    const t = tallies[party]
                    if (!t) return null
                    const color = PARTY_COLORS[party] ?? '#94a3b8'
                    const wonW  = (t.won / 234) * 100
                    const leadW = (t.leading / 234) * 100
                    return (
                      <div key={party} style={{ display: 'flex', height: '100%' }}>
                        {wonW > 0.2 && (
                          <div title={`${party} Won: ${t.won}`} style={{
                            width: `${wonW}%`,
                            background: color,
                            transition: 'width 1.2s cubic-bezier(.34,1.56,.64,1)',
                            position: 'relative',
                          }}>
                            {wonW > 6 && (
                              <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 900, color: 'rgba(0,0,0,0.65)' }}>
                                {t.won}
                              </span>
                            )}
                          </div>
                        )}
                        {leadW > 0.2 && (
                          <div title={`${party} Leading: ${t.leading}`} style={{
                            width: `${leadW}%`,
                            background: `${color}60`,
                            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.06) 4px, rgba(255,255,255,0.06) 8px)`,
                            transition: 'width 1.2s cubic-bezier(.34,1.56,.64,1)',
                          }} />
                        )}
                      </div>
                    )
                  })
                )}
              </div>

              {/* Majority marker */}
              <div style={{
                position: 'absolute', top: -3, bottom: -3,
                left: `${(118 / 234) * 100}%`,
                width: 2, background: '#fbbf24',
                borderRadius: 99,
                boxShadow: '0 0 8px rgba(251,191,36,0.9)',
                zIndex: 2,
              }}>
                <div style={{
                  position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)',
                  fontSize: 7, fontWeight: 900, color: '#fbbf24',
                  whiteSpace: 'nowrap', letterSpacing: '0.05em',
                }}>118</div>
              </div>
            </div>

            {/* Legend row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {PARTY_ORDER.map(party => {
                const t = tallies[party]
                if (!t || (t.won + t.leading) === 0) return null
                const color = PARTY_COLORS[party] ?? '#94a3b8'
                return (
                  <div key={party} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: 'inline-block', flexShrink: 0 }} />
                    <span style={{ fontSize: 9, fontWeight: 800, color }}>{party}</span>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontVariantNumeric: 'tabular-nums' }}>
                      {t.won > 0 ? `${t.won}W` : ''}{t.won > 0 && t.leading > 0 ? '+' : ''}{t.leading > 0 ? `${t.leading}L` : ''}
                    </span>
                  </div>
                )
              })}
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                {remaining > 0 && (
                  <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.18)' }}>
                    {remaining} pending
                  </span>
                )}
                <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.15)' }}>
                  {refreshing ? '↻ Refreshing…'
                    : secAgo > 0 ? `↻ ${secAgo < 60 ? `${secAgo}s` : `${Math.floor(secAgo / 60)}m`} ago`
                    : '↻ Live'}
                </span>
              </div>
            </div>

            {/* Source */}
            <div style={{ marginTop: 8, fontSize: 8, color: 'rgba(255,255,255,0.13)' }}>
              {source === 'eci-live' ? '🟢 ECI official data'
                : source === 'ai-parsed' ? '⚡ AI news parse'
                : source === 'cached-stale' ? '🟠 Snapshot · refreshing'
                : '⏳ Awaiting count start'} · majority mark at 118 seats
            </div>
          </div>
        )
      })()}

      {/* ── Filter bar ── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 160 }}>
          <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, color: 'rgba(255,255,255,0.2)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search constituency…"
            style={{
              width: '100%', padding: '7px 10px 7px 28px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 9, color: 'rgba(255,255,255,0.8)', fontSize: 11, outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* District dropdown */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <select
            value={district}
            onChange={e => setDistrict(e.target.value)}
            style={{
              padding: '7px 28px 7px 10px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 9, color: 'rgba(255,255,255,0.65)', fontSize: 11, outline: 'none',
              appearance: 'none', cursor: 'pointer', minWidth: 110,
            }}
          >
            {districts.map(d => <option key={d} value={d} style={{ background: '#1a0a2e' }}>{d}</option>)}
          </select>
          <ChevronDown style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 11, height: 11, color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
        </div>

        {/* Party filter pills */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {PARTIES.map(p => {
            const color  = p !== 'All' && p !== 'Pending' ? PARTY_COLORS[p] ?? '#94a3b8' : 'rgba(255,255,255,0.4)'
            const active = partyFilter === p
            return (
              <button key={p} onClick={() => setPartyFilter(p)} style={{
                padding: '5px 10px', borderRadius: 99, fontSize: 10, fontWeight: 800, cursor: 'pointer', border: 'none',
                background: active ? `${color}22` : 'rgba(255,255,255,0.04)',
                color: active ? color : 'rgba(255,255,255,0.3)',
                outline: active ? `1px solid ${color}45` : '1px solid transparent',
                transition: 'all 0.15s',
              }}>
                {p}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Count + totals row ── */}
      {(() => {
        const totalWon  = constituencies.filter(c => c.status === 'won').length
        const totalLead = constituencies.filter(c => c.status === 'leading').length
        const updatedAt = data?.updatedAt
        const updatedTime = updatedAt
          ? new Date(updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
          : null
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>
              {hasActive ? `${filtered.length} of 234` : '234 constituencies'}
              {search && ` matching "${search}"`}
            </span>
            {(totalWon > 0 || totalLead > 0) && (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {totalWon > 0 && (
                  <span style={{
                    fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 5,
                    background: 'rgba(74,222,128,0.1)', color: '#4ade80',
                    border: '1px solid rgba(74,222,128,0.2)',
                  }}>
                    {totalWon} WON
                  </span>
                )}
                {totalLead > 0 && (
                  <span style={{
                    fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 5,
                    background: 'rgba(251,191,36,0.1)', color: '#fbbf24',
                    border: '1px solid rgba(251,191,36,0.2)',
                  }}>
                    {totalLead} LEADING
                  </span>
                )}
              </div>
            )}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              {flashIds.size > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#fbbf24', fontWeight: 700 }}>
                  <Zap style={{ width: 10, height: 10 }} />
                  {flashIds.size} updated
                </span>
              )}
              {updatedTime && (
                <span style={{
                  fontSize: 9, color: 'rgba(255,255,255,0.22)',
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '3px 8px', borderRadius: 6,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: refreshing ? '#fbbf24' : '#22c55e', display: 'inline-block', flexShrink: 0 }} />
                  {refreshing ? 'Refreshing…' : `Updated ${updatedTime}`}
                </span>
              )}
            </div>
          </div>
        )
      })()}

      {/* ── Card grid ── */}
      {loading ? (
        <div className="const-grid">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} style={{
              height: 76, borderRadius: 12,
              background: 'rgba(255,255,255,0.03)',
              animation: 'cShimmer 1.5s infinite',
            }} />
          ))}
        </div>
      ) : (
        <div className="const-grid">
          {filtered.map(c => (
            <ConstCard key={c.id} c={c} flash={flashIds.has(c.id)} onClick={() => setExpanded(c)} />
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '36px 20px', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
              No constituencies match your filters.
            </div>
          )}
        </div>
      )}

      {expanded && <ConstituencyModal c={expanded} onClose={() => setExpanded(null)} />}

      <style>{`
        @keyframes cFadeOut { 0%{opacity:1} 100%{opacity:0} }
        @keyframes cShimmer { 0%,100%{opacity:0.5} 50%{opacity:1} }
        @keyframes cbPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.45;transform:scale(1.5)} }
        @keyframes cbScroll { 0%{background-position:0 0} 100%{background-position:80px 0} }
        @keyframes slideUp { 0%{transform:translateY(100%);opacity:0} 100%{transform:translateY(0);opacity:1} }
        .const-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 8px;
        }
        @media (max-width: 480px) {
          .const-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 6px;
          }
        }
      `}</style>
    </div>
  )
}
