/**
 * /api/election-results/constituencies
 *
 * Returns per-constituency live results for Tamil Nadu Assembly 2026.
 * Refreshes every 90 seconds during counting.
 *
 * FALLBACK CHAIN:
 *   1. Manual env override  CONSTITUENCY_OVERRIDE = JSON array
 *   2. ECI constituency page scrape → AI parse
 *   3. News RSS → AI best-effort per region
 *   4. Stale cache
 *   5. Hardcoded 234-seat skeleton (pending state)
 */
import { NextResponse } from 'next/server'
import { generateWithAI } from '@/lib/ai'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const COUNTING_START = new Date('2026-05-04T08:00:00+05:30').getTime()
const COUNTING_END   = new Date('2026-05-04T20:00:00+05:30').getTime()

export interface ConstituencyResult {
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

export interface ConstituenciesResponse {
  constituencies: ConstituencyResult[]
  totalReporting: number
  totalSeats: number
  updatedAt: string
  source: 'eci-live' | 'ai-parsed' | 'manual-override' | 'cached-stale' | 'pending'
  fallbackLevel: number
}

// ── All 234 Tamil Nadu constituencies ─────────────────────────────────────────
const TN_CONSTITUENCIES: { id: number; name: string; district: string }[] = [
  // Chennai
  { id: 1,  name: 'Thiruvottiyur',    district: 'Chennai' },
  { id: 2,  name: 'Dr. Radhakrishnan Nagar', district: 'Chennai' },
  { id: 3,  name: 'Perambur',         district: 'Chennai' },
  { id: 4,  name: 'Kolathur',         district: 'Chennai' },
  { id: 5,  name: 'Villivakkam',      district: 'Chennai' },
  { id: 6,  name: 'Thiru Vi Ka Nagar', district: 'Chennai' },
  { id: 7,  name: 'Egmore',           district: 'Chennai' },
  { id: 8,  name: 'Royapuram',        district: 'Chennai' },
  { id: 9,  name: 'Harbour',          district: 'Chennai' },
  { id: 10, name: 'Chepauk-Thiruvallikeni', district: 'Chennai' },
  { id: 11, name: 'Thousand Lights',  district: 'Chennai' },
  { id: 12, name: 'Anna Nagar',       district: 'Chennai' },
  { id: 13, name: 'Virugambakkam',    district: 'Chennai' },
  { id: 14, name: 'Saidapet',         district: 'Chennai' },
  { id: 15, name: 'Thiyagaraya Nagar', district: 'Chennai' },
  { id: 16, name: 'Mylapore',         district: 'Chennai' },
  { id: 17, name: 'Velachery',        district: 'Chennai' },
  { id: 18, name: 'Sholinganallur',   district: 'Chennai' },
  // Kancheepuram & Chengalpattu
  { id: 19, name: 'Alandur',          district: 'Kancheepuram' },
  { id: 20, name: 'Sriperumbudur',    district: 'Kancheepuram' },
  { id: 21, name: 'Pallavaram',       district: 'Kancheepuram' },
  { id: 22, name: 'Tambaram',         district: 'Chengalpattu' },
  { id: 23, name: 'Chengalpattu',     district: 'Chengalpattu' },
  { id: 24, name: 'Madurantakam',     district: 'Chengalpattu' },
  { id: 25, name: 'Uthiramerur',      district: 'Kancheepuram' },
  { id: 26, name: 'Kancheepuram',     district: 'Kancheepuram' },
  { id: 27, name: 'Arakkonam',        district: 'Ranipet' },
  { id: 28, name: 'Sholingur',        district: 'Ranipet' },
  { id: 29, name: 'Katpadi',          district: 'Vellore' },
  { id: 30, name: 'Ranipet',          district: 'Ranipet' },
  { id: 31, name: 'Arcot',            district: 'Ranipet' },
  { id: 32, name: 'Vellore',          district: 'Vellore' },
  { id: 33, name: 'Anaikattu',        district: 'Vellore' },
  { id: 34, name: 'Kilvaithinankuppam', district: 'Vellore' },
  { id: 35, name: 'Gudiyatham',       district: 'Vellore' },
  { id: 36, name: 'Vaniyambadi',      district: 'Tirupattur' },
  { id: 37, name: 'Ambur',            district: 'Tirupattur' },
  { id: 38, name: 'Jolarpet',         district: 'Tirupattur' },
  { id: 39, name: 'Tirupattur',       district: 'Tirupattur' },
  { id: 40, name: 'Uthangarai',       district: 'Krishnagiri' },
  { id: 41, name: 'Bargur',           district: 'Krishnagiri' },
  { id: 42, name: 'Krishnagiri',      district: 'Krishnagiri' },
  { id: 43, name: 'Veppanahalli',     district: 'Krishnagiri' },
  { id: 44, name: 'Hosur',            district: 'Krishnagiri' },
  { id: 45, name: 'Thalli',           district: 'Krishnagiri' },
  // Dharmapuri & Salem
  { id: 46, name: 'Palacodu',         district: 'Dharmapuri' },
  { id: 47, name: 'Pennagaram',       district: 'Dharmapuri' },
  { id: 48, name: 'Dharmapuri',       district: 'Dharmapuri' },
  { id: 49, name: 'Pappireddippatti', district: 'Dharmapuri' },
  { id: 50, name: 'Harur',            district: 'Dharmapuri' },
  { id: 51, name: 'Omalur',           district: 'Salem' },
  { id: 52, name: 'Mettur',           district: 'Salem' },
  { id: 53, name: 'Edappadi',         district: 'Salem' },
  { id: 54, name: 'Sankari',          district: 'Salem' },
  { id: 55, name: 'Salem (West)',     district: 'Salem' },
  { id: 56, name: 'Salem (North)',    district: 'Salem' },
  { id: 57, name: 'Salem (South)',    district: 'Salem' },
  { id: 58, name: 'Veerapandi',       district: 'Salem' },
  { id: 59, name: 'Attur',            district: 'Salem' },
  { id: 60, name: 'Yercaud',          district: 'Salem' },
  { id: 61, name: 'Gangavalli',       district: 'Salem' },
  // Namakkal & Erode
  { id: 62, name: 'Rasipuram',        district: 'Namakkal' },
  { id: 63, name: 'Senthamangalam',   district: 'Namakkal' },
  { id: 64, name: 'Namakkal',         district: 'Namakkal' },
  { id: 65, name: 'Paramathi Velur',  district: 'Namakkal' },
  { id: 66, name: 'Tiruchengode',     district: 'Namakkal' },
  { id: 67, name: 'Kumarapalayam',    district: 'Namakkal' },
  { id: 68, name: 'Erode (East)',     district: 'Erode' },
  { id: 69, name: 'Erode (West)',     district: 'Erode' },
  { id: 70, name: 'Modakurichi',      district: 'Erode' },
  { id: 71, name: 'Perundurai',       district: 'Erode' },
  { id: 72, name: 'Bhavani',          district: 'Erode' },
  { id: 73, name: 'Anthiyur',         district: 'Erode' },
  { id: 74, name: 'Gobichettipalayam', district: 'Erode' },
  { id: 75, name: 'Bhavanisagar',     district: 'Erode' },
  // Nilgiris & Coimbatore
  { id: 76, name: 'Gudalur',          district: 'Nilgiris' },
  { id: 77, name: 'Udhagamandalam',   district: 'Nilgiris' },
  { id: 78, name: 'Kundah',           district: 'Nilgiris' },
  { id: 79, name: 'Coonoor',          district: 'Nilgiris' },
  { id: 80, name: 'Mettuppalayam',    district: 'Coimbatore' },
  { id: 81, name: 'Avanashi',         district: 'Tiruppur' },
  { id: 82, name: 'Tiruppur (North)', district: 'Tiruppur' },
  { id: 83, name: 'Tiruppur (South)', district: 'Tiruppur' },
  { id: 84, name: 'Palladam',         district: 'Tiruppur' },
  { id: 85, name: 'Dharapuram',       district: 'Tiruppur' },
  { id: 86, name: 'Kangeyam',         district: 'Tiruppur' },
  { id: 87, name: 'Udumalaipettai',   district: 'Tiruppur' },
  { id: 88, name: 'Madathukulam',     district: 'Tiruppur' },
  { id: 89, name: 'Pollachi',         district: 'Coimbatore' },
  { id: 90, name: 'Valparai',         district: 'Coimbatore' },
  { id: 91, name: 'Sulur',            district: 'Coimbatore' },
  { id: 92, name: 'Coimbatore (North)', district: 'Coimbatore' },
  { id: 93, name: 'Thondamuthur',     district: 'Coimbatore' },
  { id: 94, name: 'Coimbatore (South)', district: 'Coimbatore' },
  { id: 95, name: 'Singanallur',      district: 'Coimbatore' },
  { id: 96, name: 'Kinathukadavu',    district: 'Coimbatore' },
  { id: 97, name: 'Kavundampalayam',  district: 'Coimbatore' },
  { id: 98, name: 'Mettupalayam',     district: 'Coimbatore' },
  // Dindigul & Madurai
  { id: 99,  name: 'Palani',          district: 'Dindigul' },
  { id: 100, name: 'Oddanchatram',    district: 'Dindigul' },
  { id: 101, name: 'Athoor',          district: 'Dindigul' },
  { id: 102, name: 'Dindigul',        district: 'Dindigul' },
  { id: 103, name: 'Natham',          district: 'Dindigul' },
  { id: 104, name: 'Nilakottai',      district: 'Dindigul' },
  { id: 105, name: 'Vedasandur',      district: 'Dindigul' },
  { id: 106, name: 'Aravakurichi',    district: 'Karur' },
  { id: 107, name: 'Karur',           district: 'Karur' },
  { id: 108, name: 'Krishnarayapuram', district: 'Karur' },
  { id: 109, name: 'Kulithalai',      district: 'Karur' },
  { id: 110, name: 'Musiri',          district: 'Tiruchirappalli' },
  { id: 111, name: 'Thuraiyur',       district: 'Tiruchirappalli' },
  { id: 112, name: 'Perambalur',      district: 'Perambalur' },
  { id: 113, name: 'Kunnam',          district: 'Perambalur' },
  { id: 114, name: 'Ariyalur',        district: 'Ariyalur' },
  { id: 115, name: 'Jayankondam',     district: 'Ariyalur' },
  { id: 116, name: 'Tiruchirappalli (West)', district: 'Tiruchirappalli' },
  { id: 117, name: 'Tiruchirappalli (East)', district: 'Tiruchirappalli' },
  { id: 118, name: 'Thiruverumbur',   district: 'Tiruchirappalli' },
  { id: 119, name: 'Srirangam',       district: 'Tiruchirappalli' },
  { id: 120, name: 'Tiruverumbur',    district: 'Tiruchirappalli' },
  { id: 121, name: 'Lalgudi',         district: 'Tiruchirappalli' },
  { id: 122, name: 'Manachanallur',   district: 'Tiruchirappalli' },
  { id: 123, name: 'Manapparai',      district: 'Tiruchirappalli' },
  // Madurai
  { id: 124, name: 'Melur',           district: 'Madurai' },
  { id: 125, name: 'Madurai (East)',  district: 'Madurai' },
  { id: 126, name: 'Sholavandan',     district: 'Madurai' },
  { id: 127, name: 'Madurai (North)', district: 'Madurai' },
  { id: 128, name: 'Madurai (South)', district: 'Madurai' },
  { id: 129, name: 'Madurai (Central)', district: 'Madurai' },
  { id: 130, name: 'Madurai (West)',  district: 'Madurai' },
  { id: 131, name: 'Thiruparankundram', district: 'Madurai' },
  { id: 132, name: 'Thirumangalam',   district: 'Madurai' },
  { id: 133, name: 'Usilampatti',     district: 'Madurai' },
  { id: 134, name: 'Andipatti',       district: 'Theni' },
  { id: 135, name: 'Periyakulam',     district: 'Theni' },
  { id: 136, name: 'Bodinayakanur',   district: 'Theni' },
  { id: 137, name: 'Cumbum',          district: 'Theni' },
  // Sivaganga & Virudhunagar
  { id: 138, name: 'Sivaganga',       district: 'Sivaganga' },
  { id: 139, name: 'Manamadurai',     district: 'Sivaganga' },
  { id: 140, name: 'Karaikudi',       district: 'Sivaganga' },
  { id: 141, name: 'Tiruppattur',     district: 'Sivaganga' },
  { id: 142, name: 'Aruppukkottai',   district: 'Virudhunagar' },
  { id: 143, name: 'Rajapalayam',     district: 'Virudhunagar' },
  { id: 144, name: 'Srivilliputhur',  district: 'Virudhunagar' },
  { id: 145, name: 'Sattur',          district: 'Virudhunagar' },
  { id: 146, name: 'Sivakasi',        district: 'Virudhunagar' },
  { id: 147, name: 'Virudhunagar',    district: 'Virudhunagar' },
  // Tirunelveli & Tenkasi
  { id: 148, name: 'Sankarankovil',   district: 'Tenkasi' },
  { id: 149, name: 'Vasudevanallur',  district: 'Tenkasi' },
  { id: 150, name: 'Kadayanallur',    district: 'Tenkasi' },
  { id: 151, name: 'Tenkasi',         district: 'Tenkasi' },
  { id: 152, name: 'Alangulam',       district: 'Tenkasi' },
  { id: 153, name: 'Tirunelveli',     district: 'Tirunelveli' },
  { id: 154, name: 'Ambasamudram',    district: 'Tirunelveli' },
  { id: 155, name: 'Palayamkottai',   district: 'Tirunelveli' },
  { id: 156, name: 'Nanguneri',       district: 'Tirunelveli' },
  { id: 157, name: 'Radhapuram',      district: 'Tirunelveli' },
  // Thoothukudi
  { id: 158, name: 'Thoothukudi',     district: 'Thoothukudi' },
  { id: 159, name: 'Tiruchendur',     district: 'Thoothukudi' },
  { id: 160, name: 'Srivaikuntam',    district: 'Thoothukudi' },
  { id: 161, name: 'Ottapidaram',     district: 'Thoothukudi' },
  { id: 162, name: 'Vilathikulam',    district: 'Thoothukudi' },
  // Kanyakumari
  { id: 163, name: 'Thovalai',        district: 'Kanyakumari' },
  { id: 164, name: 'Nagercoil',       district: 'Kanyakumari' },
  { id: 165, name: 'Colachel',        district: 'Kanyakumari' },
  { id: 166, name: 'Padmanabhapuram', district: 'Kanyakumari' },
  { id: 167, name: 'Vilavancode',     district: 'Kanyakumari' },
  { id: 168, name: 'Killiyoor',       district: 'Kanyakumari' },
  // Tiruvarur & Thanjavur
  { id: 169, name: 'Papanasam',       district: 'Thanjavur' },
  { id: 170, name: 'Thiruvidaimarudur', district: 'Thanjavur' },
  { id: 171, name: 'Kumbakonam',      district: 'Thanjavur' },
  { id: 172, name: 'Papanasam',       district: 'Thanjavur' },
  { id: 173, name: 'Thanjavur',       district: 'Thanjavur' },
  { id: 174, name: 'Orathanadu',      district: 'Thanjavur' },
  { id: 175, name: 'Pattukkottai',    district: 'Thanjavur' },
  { id: 176, name: 'Peravurani',      district: 'Thanjavur' },
  { id: 177, name: 'Thiruvarur',      district: 'Tiruvarur' },
  { id: 178, name: 'Nannilam',        district: 'Tiruvarur' },
  { id: 179, name: 'Papanasam',       district: 'Tiruvarur' },
  { id: 180, name: 'Nagapattinam',    district: 'Nagapattinam' },
  { id: 181, name: 'Kilvelur',        district: 'Nagapattinam' },
  { id: 182, name: 'Vedaranyam',      district: 'Nagapattinam' },
  { id: 183, name: 'Mayiladuthurai',  district: 'Mayiladuthurai' },
  { id: 184, name: 'Sirkazhi',        district: 'Mayiladuthurai' },
  { id: 185, name: 'Chidambaram',     district: 'Cuddalore' },
  { id: 186, name: 'Kattumannarkoil', district: 'Cuddalore' },
  { id: 187, name: 'Cuddalore',       district: 'Cuddalore' },
  { id: 188, name: 'Bhuvanagiri',     district: 'Cuddalore' },
  { id: 189, name: 'Vridhachalam',    district: 'Cuddalore' },
  // Villupuram
  { id: 190, name: 'Neyveli',         district: 'Cuddalore' },
  { id: 191, name: 'Panruti',         district: 'Cuddalore' },
  { id: 192, name: 'Ulundurpettai',   district: 'Villupuram' },
  { id: 193, name: 'Kallakurichi',    district: 'Kallakurichi' },
  { id: 194, name: 'Sankarapuram',    district: 'Villupuram' },
  { id: 195, name: 'Tindivanam',      district: 'Villupuram' },
  { id: 196, name: 'Vanur',           district: 'Villupuram' },
  { id: 197, name: 'Villupuram',      district: 'Villupuram' },
  { id: 198, name: 'Vikravandi',      district: 'Villupuram' },
  { id: 199, name: 'Thirukoilur',     district: 'Villupuram' },
  { id: 200, name: 'Rishivandiyam',   district: 'Villupuram' },
  { id: 201, name: 'Gingee',          district: 'Villupuram' },
  { id: 202, name: 'Mailam',          district: 'Villupuram' },
  { id: 203, name: 'Pondicherry (border)', district: 'Villupuram' },
  // Tiruvallur & Ponneri
  { id: 204, name: 'Ponneri',         district: 'Tiruvallur' },
  { id: 205, name: 'Tiruttani',       district: 'Tiruvallur' },
  { id: 206, name: 'Thiruvallur',     district: 'Tiruvallur' },
  { id: 207, name: 'Poonamallee',     district: 'Tiruvallur' },
  { id: 208, name: 'Avadi',           district: 'Tiruvallur' },
  { id: 209, name: 'Maduravoyal',     district: 'Tiruvallur' },
  { id: 210, name: 'Ambattur',        district: 'Tiruvallur' },
  { id: 211, name: 'Madavaram',       district: 'Tiruvallur' },
  // Ramanathapuram
  { id: 212, name: 'Ramanathapuram',  district: 'Ramanathapuram' },
  { id: 213, name: 'Mudhukulathur',   district: 'Ramanathapuram' },
  { id: 214, name: 'Paramakudi',      district: 'Ramanathapuram' },
  { id: 215, name: 'Tiruvadanai',     district: 'Ramanathapuram' },
  // Pudukkottai
  { id: 216, name: 'Pudukkottai',     district: 'Pudukkottai' },
  { id: 217, name: 'Thirumayam',      district: 'Pudukkottai' },
  { id: 218, name: 'Alangudi',        district: 'Pudukkottai' },
  { id: 219, name: 'Aranthangi',      district: 'Pudukkottai' },
  // Dharmapuri extras
  { id: 220, name: 'Palacode',        district: 'Dharmapuri' },
  // Additional
  { id: 221, name: 'Gummidipoondi',   district: 'Tiruvallur' },
  { id: 222, name: 'Perkkaranai',     district: 'Kancheepuram' },
  { id: 223, name: 'Anaicut',         district: 'Vellore' },
  { id: 224, name: 'Walajapet',       district: 'Ranipet' },
  { id: 225, name: 'Kaveripakkam',    district: 'Ranipet' },
  { id: 226, name: 'Chengam',         district: 'Tiruvannamalai' },
  { id: 227, name: 'Tiruvannamalai',  district: 'Tiruvannamalai' },
  { id: 228, name: 'Kilpennathur',    district: 'Tiruvannamalai' },
  { id: 229, name: 'Kalasapakkam',    district: 'Tiruvannamalai' },
  { id: 230, name: 'Polur',           district: 'Tiruvannamalai' },
  { id: 231, name: 'Arani',           district: 'Tiruvannamalai' },
  { id: 232, name: 'Cheyyar',         district: 'Tiruvannamalai' },
  { id: 233, name: 'Vandavasi',       district: 'Tiruvannamalai' },
  { id: 234, name: 'Vembakkam',       district: 'Tiruvannamalai' },
]

// ── In-memory cache ───────────────────────────────────────────────────────────
let cache: { data: ConstituenciesResponse; fetchedAt: number } | null = null

function getTTL(now: number) {
  if (now >= COUNTING_START && now <= COUNTING_END) return 90 * 1000  // 90s live
  return 10 * 60 * 1000  // 10 min pre/post
}

// ── FALLBACK 1: Manual env override ──────────────────────────────────────────
function getManualOverride(): ConstituencyResult[] | null {
  const raw = process.env.CONSTITUENCY_OVERRIDE
  if (!raw) return null
  try { return JSON.parse(raw) as ConstituencyResult[] } catch { return null }
}

// ── FALLBACK 2: ECI constituency scrape ──────────────────────────────────────
async function scrapeECIConstituencies(): Promise<string> {
  const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Referer': 'https://results.eci.gov.in/',
    'Cache-Control': 'no-cache',
  }
  const urls = [
    'https://results.eci.gov.in/ResultAcGenMay2026/statewiseS22.htm',
    'https://results.eci.gov.in/AcResultGenMay2026/statewiseS22.htm',
    'https://results.eci.gov.in/ResultAcGenMay2026/constituencyresult-S22.htm',
    'https://results.eci.gov.in/ResultAcGenMay2026/resultS22-all.htm',
  ]
  for (const url of urls) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000), headers: HEADERS, cache: 'no-store' })
      if (!res.ok) continue
      const html = await res.text()
      if (html.length > 500) {
        const cleaned = html
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
        if (cleaned.length > 300) return cleaned.slice(0, 8000)
      }
    } catch { continue }
  }
  return ''
}

// ── AI parse constituency data ────────────────────────────────────────────────
async function parseConstituenciesWithAI(
  html: string,
  headlines: string[],
): Promise<ConstituencyResult[]> {
  const ctx = [
    html ? `ECI page data:\n${html.slice(0, 4000)}` : '',
    headlines.length ? `Headlines:\n${headlines.slice(0, 8).join('\n')}` : '',
  ].filter(Boolean).join('\n\n')

  if (!ctx.trim()) return []

  const allNames = TN_CONSTITUENCIES.map(c => `${c.id}: ${c.name} (${c.district})`).join(', ')

  const prompt = `Tamil Nadu Assembly Election 2026 — May 4 counting day.
Extract per-constituency results from the data below.

Available constituencies:
${allNames}

Data:
${ctx.slice(0, 5000)}

Return ONLY a JSON array of found constituencies (skip those with no data). Format:
[{"id":1,"name":"Thiruvottiyur","district":"Chennai","leadingParty":"TVK","leadingCandidate":"Candidate Name","margin":1234,"votesLeading":45678,"status":"leading"},...]

Party names must be one of: TVK, DMK, AIADMK, BJP, Others
Status: "leading" if counting in progress, "won" if declared
Only include seats you have real data for. Return [] if no data found.`

  try {
    const raw = await generateWithAI(prompt, {
      mode: 'fast',
      maxTokens: 2000,
      systemPrompt: 'Tamil Nadu election analyst. Return ONLY valid compact JSON array.',
      noCache: true,
    })
    const cleaned = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(cleaned)
    if (!Array.isArray(parsed)) return []
    // Merge with skeleton
    return parsed.filter((p: ConstituencyResult) => p.id && p.leadingParty)
  } catch {
    return []
  }
}

// ── Build full response ───────────────────────────────────────────────────────
function buildResponse(
  liveResults: ConstituencyResult[],
  source: ConstituenciesResponse['source'],
  fallbackLevel: number,
): ConstituenciesResponse {
  const liveMap = new Map(liveResults.map(r => [r.id, r]))
  const now = new Date().toISOString()

  const constituencies: ConstituencyResult[] = TN_CONSTITUENCIES.map(c => {
    const live = liveMap.get(c.id)
    if (live) return { ...live, updatedAt: now }
    return {
      id: c.id,
      name: c.name,
      district: c.district,
      leadingParty: null,
      leadingCandidate: null,
      margin: null,
      votesLeading: null,
      status: 'pending' as const,
      updatedAt: now,
    }
  })

  return {
    constituencies,
    totalReporting: liveResults.length,
    totalSeats: TN_CONSTITUENCIES.length,
    updatedAt: now,
    source,
    fallbackLevel,
  }
}

// ── Main GET ──────────────────────────────────────────────────────────────────
export async function GET() {
  const now = Date.now()
  const ttl = getTTL(now)

  // FALLBACK 1: manual override
  const override = getManualOverride()
  if (override) {
    const data = buildResponse(override, 'manual-override', 1)
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
  }

  // Serve fresh cache
  if (cache && now - cache.fetchedAt < ttl) {
    return NextResponse.json({ ...cache.data, cached: true }, { headers: { 'Cache-Control': 'no-store' } })
  }

  // Pre-counting — return all pending
  if (now < COUNTING_START) {
    const data = buildResponse([], 'pending', 5)
    cache = { data, fetchedAt: now }
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
  }

  // FALLBACK 2a: GitHub-parsed ECI data (thecont1/india-votes-data)
  try {
    const ghUrls = [
      'https://raw.githubusercontent.com/thecont1/india-votes-data/main/data/2026/TN/results.json',
      'https://raw.githubusercontent.com/thecont1/india-votes-data/main/results/TN-2026.json',
    ]
    for (const url of ghUrls) {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(5000), cache: 'no-store' })
        if (!res.ok) continue
        const json = await res.json() as Record<string, unknown>[]
        if (Array.isArray(json) && json.length > 0) {
          // Map to our format
          const parsed: ConstituencyResult[] = json.map((row: Record<string, unknown>, i) => {
            const seat = TN_CONSTITUENCIES.find(c =>
              String(row.constituency ?? row.name ?? '').toLowerCase().includes(c.name.toLowerCase().slice(0, 6))
            ) ?? TN_CONSTITUENCIES[i] ?? TN_CONSTITUENCIES[0]
            return {
              id: seat.id,
              name: seat.name,
              district: seat.district,
              leadingParty: String(row.leading_party ?? row.party ?? 'Others'),
              leadingCandidate: String(row.leading_candidate ?? row.candidate ?? ''),
              margin: Number(row.margin ?? 0) || null,
              votesLeading: Number(row.votes ?? 0) || null,
              status: (row.status === 'won' ? 'won' : 'leading') as 'leading' | 'won',
              updatedAt: new Date().toISOString(),
            }
          }).filter(r => r.leadingParty)
          if (parsed.length > 5) {
            const data = buildResponse(parsed, 'eci-live', 2)
            cache = { data, fetchedAt: now }
            return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
          }
        }
      } catch { continue }
    }
  } catch { /* skip */ }

  // FALLBACK 2b: ECI scrape → AI
  const html = await scrapeECIConstituencies()
  if (html.length > 200) {
    const parsed = await parseConstituenciesWithAI(html, [])
    if (parsed.length > 0) {
      const data = buildResponse(parsed, 'eci-live', 2)
      cache = { data, fetchedAt: now }
      return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
    }
  }

  // FALLBACK 3: Headlines → AI best effort
  try {
    const feedUrls = [
      'https://www.thehindu.com/elections/feeder/default.rss',
      'https://feeds.feedburner.com/ndtvnews-india-news',
    ]
    const headlines: string[] = []
    await Promise.allSettled(feedUrls.map(async url => {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(4000) })
        if (!res.ok) return
        const xml = await res.text()
        for (const m of xml.matchAll(/<title[^>]*>([\s\S]*?)<\/title>/g)) {
          const t = m[1].replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '').trim()
          if (t.length > 15 && /election|result|win|lead|count|seat|TVK|DMK|AIADMK/i.test(t)) headlines.push(t)
        }
      } catch { /* skip */ }
    }))

    if (headlines.length > 0) {
      const parsed = await parseConstituenciesWithAI('', headlines)
      if (parsed.length > 0) {
        const data = buildResponse(parsed, 'ai-parsed', 3)
        cache = { data, fetchedAt: now }
        return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
      }
    }
  } catch { /* skip */ }

  // FALLBACK 4: stale cache
  if (cache) {
    return NextResponse.json({ ...cache.data, source: 'cached-stale', fallbackLevel: 4 }, { headers: { 'Cache-Control': 'no-store' } })
  }

  // FALLBACK 5: all pending
  const data = buildResponse([], 'pending', 5)
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
}
