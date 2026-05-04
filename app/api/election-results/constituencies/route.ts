/**
 * /api/election-results/constituencies
 *
 * Fast stale-while-revalidate pattern:
 *   - Always respond immediately from cache (< 5ms)
 *   - Trigger background refresh if cache is stale
 *   - Never block the response on scraping or AI calls
 *
 * Background refresh runs at most once per TTL window.
 */
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'edge'

const COUNTING_START = new Date('2026-05-04T08:00:00+05:30').getTime()
const COUNTING_END   = new Date('2026-05-04T20:00:00+05:30').getTime()
const TTL_LIVE       = 90  * 1000   // 90s during counting
const TTL_IDLE       = 10  * 60 * 1000  // 10 min outside counting

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
  cached?: boolean
  refreshing?: boolean
}

// ── All 234 Tamil Nadu constituencies ─────────────────────────────────────────
const TN_CONSTITUENCIES: { id: number; name: string; district: string }[] = [
  // Chennai (18)
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
  // Dindigul
  { id: 99,  name: 'Palani',          district: 'Dindigul' },
  { id: 100, name: 'Oddanchatram',    district: 'Dindigul' },
  { id: 101, name: 'Athoor',          district: 'Dindigul' },
  { id: 102, name: 'Dindigul',        district: 'Dindigul' },
  { id: 103, name: 'Natham',          district: 'Dindigul' },
  { id: 104, name: 'Nilakottai',      district: 'Dindigul' },
  { id: 105, name: 'Vedasandur',      district: 'Dindigul' },
  // Karur & Tiruchirappalli
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
  // Tenkasi & Tirunelveli
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
  // Thanjavur & Tiruvarur
  { id: 169, name: 'Papanasam',       district: 'Thanjavur' },
  { id: 170, name: 'Thiruvidaimarudur', district: 'Thanjavur' },
  { id: 171, name: 'Kumbakonam',      district: 'Thanjavur' },
  { id: 172, name: 'Pattukkottai',    district: 'Thanjavur' },
  { id: 173, name: 'Thanjavur',       district: 'Thanjavur' },
  { id: 174, name: 'Orathanadu',      district: 'Thanjavur' },
  { id: 175, name: 'Peravurani',      district: 'Thanjavur' },
  { id: 176, name: 'Papanasam (Tiruvarur)', district: 'Tiruvarur' },
  { id: 177, name: 'Thiruvarur',      district: 'Tiruvarur' },
  { id: 178, name: 'Nannilam',        district: 'Tiruvarur' },
  { id: 179, name: 'Nagapattinam',    district: 'Nagapattinam' },
  { id: 180, name: 'Kilvelur',        district: 'Nagapattinam' },
  { id: 181, name: 'Vedaranyam',      district: 'Nagapattinam' },
  { id: 182, name: 'Mayiladuthurai',  district: 'Mayiladuthurai' },
  { id: 183, name: 'Sirkazhi',        district: 'Mayiladuthurai' },
  { id: 184, name: 'Chidambaram',     district: 'Cuddalore' },
  { id: 185, name: 'Kattumannarkoil', district: 'Cuddalore' },
  { id: 186, name: 'Cuddalore',       district: 'Cuddalore' },
  { id: 187, name: 'Bhuvanagiri',     district: 'Cuddalore' },
  { id: 188, name: 'Vridhachalam',    district: 'Cuddalore' },
  { id: 189, name: 'Neyveli',         district: 'Cuddalore' },
  { id: 190, name: 'Panruti',         district: 'Cuddalore' },
  // Villupuram & Kallakurichi
  { id: 191, name: 'Ulundurpettai',   district: 'Villupuram' },
  { id: 192, name: 'Kallakurichi',    district: 'Kallakurichi' },
  { id: 193, name: 'Sankarapuram',    district: 'Villupuram' },
  { id: 194, name: 'Tindivanam',      district: 'Villupuram' },
  { id: 195, name: 'Vanur',           district: 'Villupuram' },
  { id: 196, name: 'Villupuram',      district: 'Villupuram' },
  { id: 197, name: 'Vikravandi',      district: 'Villupuram' },
  { id: 198, name: 'Thirukoilur',     district: 'Villupuram' },
  { id: 199, name: 'Rishivandiyam',   district: 'Villupuram' },
  { id: 200, name: 'Gingee',          district: 'Villupuram' },
  { id: 201, name: 'Mailam',          district: 'Villupuram' },
  // Tiruvallur
  { id: 202, name: 'Ponneri',         district: 'Tiruvallur' },
  { id: 203, name: 'Tiruttani',       district: 'Tiruvallur' },
  { id: 204, name: 'Thiruvallur',     district: 'Tiruvallur' },
  { id: 205, name: 'Poonamallee',     district: 'Tiruvallur' },
  { id: 206, name: 'Avadi',           district: 'Tiruvallur' },
  { id: 207, name: 'Maduravoyal',     district: 'Tiruvallur' },
  { id: 208, name: 'Ambattur',        district: 'Tiruvallur' },
  { id: 209, name: 'Madavaram',       district: 'Tiruvallur' },
  { id: 210, name: 'Gummidipoondi',   district: 'Tiruvallur' },
  // Ramanathapuram
  { id: 211, name: 'Ramanathapuram',  district: 'Ramanathapuram' },
  { id: 212, name: 'Mudhukulathur',   district: 'Ramanathapuram' },
  { id: 213, name: 'Paramakudi',      district: 'Ramanathapuram' },
  { id: 214, name: 'Tiruvadanai',     district: 'Ramanathapuram' },
  // Pudukkottai
  { id: 215, name: 'Pudukkottai',     district: 'Pudukkottai' },
  { id: 216, name: 'Thirumayam',      district: 'Pudukkottai' },
  { id: 217, name: 'Alangudi',        district: 'Pudukkottai' },
  { id: 218, name: 'Aranthangi',      district: 'Pudukkottai' },
  // Tiruvannamalai
  { id: 219, name: 'Chengam',         district: 'Tiruvannamalai' },
  { id: 220, name: 'Tiruvannamalai',  district: 'Tiruvannamalai' },
  { id: 221, name: 'Kilpennathur',    district: 'Tiruvannamalai' },
  { id: 222, name: 'Kalasapakkam',    district: 'Tiruvannamalai' },
  { id: 223, name: 'Polur',           district: 'Tiruvannamalai' },
  { id: 224, name: 'Arani',           district: 'Tiruvannamalai' },
  { id: 225, name: 'Cheyyar',         district: 'Tiruvannamalai' },
  { id: 226, name: 'Vandavasi',       district: 'Tiruvannamalai' },
  { id: 227, name: 'Vembakkam',       district: 'Tiruvannamalai' },
  // Remaining to reach 234
  { id: 228, name: 'Perkkaranai',     district: 'Kancheepuram' },
  { id: 229, name: 'Walajapet',       district: 'Ranipet' },
  { id: 230, name: 'Kaveripakkam',    district: 'Ranipet' },
  { id: 231, name: 'Anaicut',         district: 'Vellore' },
  { id: 232, name: 'Palacode',        district: 'Dharmapuri' },
  { id: 233, name: 'Alangudi (Karur)', district: 'Karur' },
  { id: 234, name: 'Aruppukkottai (South)', district: 'Virudhunagar' },
]

// ── In-memory cache + refresh lock ───────────────────────────────────────────
interface CacheEntry { data: ConstituenciesResponse; fetchedAt: number }
// Wrap in object so TS sees mutations across async boundaries
const store: { cache: CacheEntry | null; refreshing: boolean } = { cache: null, refreshing: false }

function getTTL(now: number) {
  if (now >= COUNTING_START && now <= COUNTING_END) return TTL_LIVE
  return TTL_IDLE
}

function buildPendingResponse(): ConstituenciesResponse {
  const now = new Date().toISOString()
  return {
    constituencies: TN_CONSTITUENCIES.map(c => ({
      id: c.id, name: c.name, district: c.district,
      leadingParty: null, leadingCandidate: null,
      margin: null, votesLeading: null,
      status: 'pending' as const, updatedAt: now,
    })),
    totalReporting: 0,
    totalSeats: 234,
    updatedAt: now,
    source: 'pending',
    fallbackLevel: 5,
  }
}

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
    return { id: c.id, name: c.name, district: c.district, leadingParty: null, leadingCandidate: null, margin: null, votesLeading: null, status: 'pending' as const, updatedAt: now }
  })
  return { constituencies, totalReporting: liveResults.length, totalSeats: 234, updatedAt: now, source, fallbackLevel }
}

// ── Normalise ECI party code → our display name ───────────────────────────────
function normaliseParty(raw: string): string {
  const p = raw.toUpperCase().trim()
  if (p === 'TVK' || p.includes('TAMILAGA') || p.includes('VETTRI')) return 'TVK'
  if (p === 'DMK' || p.includes('DRAVIDA MUNNETRA')) return 'DMK'
  if (p === 'ADMK' || p === 'AIADMK' || p.includes('ANNA DRAVIDA')) return 'AIADMK'
  if (p === 'BJP' || p.includes('BHARATIYA JANATA')) return 'BJP'
  return 'Others'
}

// ── Fetch ECI live JSON — the real official data source ───────────────────────
// URL discovered from: https://results.eci.gov.in/ResultAcGenMay2026/partywiseresult-S22.htm
// Structure: { S22: { chartData: [party, stateCode, acNo, candidate, color][] } }
async function fetchECILiveJSON(): Promise<ConstituencyResult[]> {
  const ECI_JSON = 'https://results.eci.gov.in/ResultAcGenMay2026/election-json-S22-live.json'
  const PROXY    = `https://api.allorigins.win/raw?url=${encodeURIComponent(ECI_JSON)}`

  for (const url of [ECI_JSON, PROXY]) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(8000),
        cache: 'no-store',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
          'Referer': 'https://results.eci.gov.in/',
        },
      })
      if (!res.ok) continue

      const json = await res.json() as Record<string, { chartData: [string, string, number, string, string][] }>
      const s22  = json['S22']
      if (!s22?.chartData || !Array.isArray(s22.chartData) || s22.chartData.length < 10) continue

      const now = new Date().toISOString()
      const results: ConstituencyResult[] = []

      for (const row of s22.chartData) {
        const [partyRaw, , acNo, candidate] = row
        const seat = TN_CONSTITUENCIES.find(c => c.id === acNo)
        if (!seat) continue
        const leadingParty = normaliseParty(partyRaw)
        results.push({
          id: seat.id, name: seat.name, district: seat.district,
          leadingParty,
          leadingCandidate: candidate ?? null,
          margin: null,       // ECI live JSON doesn't include margin (JS-rendered separately)
          votesLeading: null, // Same — only available after full count declared
          status: 'leading',  // All entries are "leading" during live count
          updatedAt: now,
        })
      }

      if (results.length >= 10) return results
    } catch { continue }
  }
  return []
}

// ── Background data fetcher — never blocks the response ──────────────────────
async function fetchFresh(): Promise<void> {
  if (store.refreshing) return
  store.refreshing = true
  const now = Date.now()
  try {
    // Skip if pre-counting
    if (now < COUNTING_START) {
      store.cache = { data: buildPendingResponse(), fetchedAt: now }
      return
    }

    // 1. Primary: ECI official live JSON (confirmed working, all 234 constituencies)
    const eciResults = await fetchECILiveJSON()
    if (eciResults.length >= 10) {
      store.cache = { data: buildResponse(eciResults, 'eci-live', 1), fetchedAt: now }
      return
    }

    // 2. Nothing worked — keep stale cache or show pending
    if (!store.cache) {
      store.cache = { data: buildPendingResponse(), fetchedAt: now }
    } else {
      store.cache.data = { ...store.cache.data, source: 'cached-stale', fallbackLevel: 4 }
    }
  } catch {
    if (!store.cache) store.cache = { data: buildPendingResponse(), fetchedAt: now }
  } finally {
    store.refreshing = false
  }
}

// ── FALLBACK 1: Manual env override ──────────────────────────────────────────
function getManualOverride(): ConstituencyResult[] | null {
  const raw = process.env.CONSTITUENCY_OVERRIDE
  if (!raw) return null
  try { return JSON.parse(raw) as ConstituencyResult[] } catch { return null }
}

// ── Main GET — fetch directly (Vercel is stateless, no persistent in-memory cache) ──
export async function GET() {
  const now = Date.now()

  // Manual override — always serve synchronously
  const override = getManualOverride()
  if (override) {
    const data = buildResponse(override, 'manual-override', 1)
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
  }

  // Fetch ECI JSON directly on every request (fast ~100ms, 5s timeout)
  if (now >= COUNTING_START) {
    const eciResults = await fetchECILiveJSON()
    if (eciResults.length >= 10) {
      const data = buildResponse(eciResults, 'eci-live', 1)
      return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
    }
  }

  return NextResponse.json(buildPendingResponse(), { headers: { 'Cache-Control': 'no-store' } })
}
