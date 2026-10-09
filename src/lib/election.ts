// Live by-election results scraped from the Election Commission of India (official source).
// Nothing here is hardcoded data: only the seat page IDs are config (ELECTION_SEATS env, comma list).
const ECI_BASE = process.env.ELECTION_BASE ?? 'https://results.eci.gov.in/ResultAcByeOct2026'
const SEATS = (process.env.ELECTION_SEATS ?? 'S2235,S22101').split(',').map(s => s.trim()).filter(Boolean)

export interface Candidate { name: string; party: string; votes: number; margin: number; status: string }
export interface SeatResult {
  seat: string
  state: string
  round: string | null
  candidates: Candidate[]
  sourceUrl: string
}

function text(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
}

export function parseSeat(html: string, id: string): SeatResult | null {
  const t = text(html)
  const head = t.match(/Assembly Constituency \d+ - ([A-Z .]+?) \(([^)]+)\)/)
  if (!head) return null
  const round = t.match(/Status of EVM Round:\s*(\d+\s*\/\s*\d+)/)?.[1]?.replace(/\s/g, '') ?? null
  const candidates: Candidate[] = []
  const re = /(leading|trailing|won|lost)\s+(\d+)\s*\(\s*([+-]?)\s*(\d+)\s*\)\s+((?:[A-Z.]+\s)*[A-Z.]+)\s+(.+?)(?=\s+(?:leading|trailing|won|lost)\s+\d+\s*\(|\s*(?:Last Updated|Note|$))/g
  for (const m of t.matchAll(re)) {
    candidates.push({
      status: m[1], votes: Number(m[2]),
      margin: Number(m[4]) * (m[3] === '-' ? -1 : 1),
      name: m[5], party: m[6].replace(/\s+\d+\s*\(.*$/, '').trim(),
    })
  }
  if (candidates.length === 0) return null
  return { seat: head[1].trim(), state: head[2], round, candidates, sourceUrl: `${ECI_BASE}/candidateswise-${id}.htm` }
}

export async function getElection(): Promise<SeatResult[]> {
  const out = await Promise.all(SEATS.map(async id => {
    try {
      const res = await fetch(`${ECI_BASE}/candidateswise-${id}.htm`, {
        headers: { 'User-Agent': 'Mozilla/5.0 NammaTamil' },
        signal: AbortSignal.timeout(6000),
        next: { revalidate: 60 },
      })
      return res.ok ? parseSeat(await res.text(), id) : null
    } catch { return null }
  }))
  return out.filter((s): s is SeatResult => s !== null)
}
