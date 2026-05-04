/**
 * election-persist.ts — GitHub Gist as a free persistent JSON store
 *
 * Survives Vercel cold starts: on a fresh serverless instance, we read
 * last known data from the Gist before triggering a live scrape.
 *
 * Env vars required in Vercel dashboard:
 *   GITHUB_TOKEN  — Personal Access Token with `gist` scope
 *   GIST_ID       — ID of the Gist to use (create one empty Gist first)
 *
 * Gist file layout:
 *   tn-election-parties.json       — party tally (ElectionResultsResponse)
 *   tn-election-constituencies.json — constituency grid (ConstituenciesResponse)
 */

const GIST_API = 'https://api.github.com/gists'
const PARTIES_FILE = 'tn-election-parties.json'
const CONSTITUENCIES_FILE = 'tn-election-constituencies.json'

function gistHeaders() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN ?? ''}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
    'User-Agent': 'NammaTamil-ElectionDashboard/1.0',
  }
}

function isConfigured(): boolean {
  return !!(process.env.GITHUB_TOKEN && process.env.GIST_ID)
}

// ── Read from Gist ────────────────────────────────────────────────────────────
export async function readGistFile(filename: string): Promise<unknown | null> {
  if (!isConfigured()) return null
  try {
    const res = await fetch(`${GIST_API}/${process.env.GIST_ID}`, {
      headers: gistHeaders(),
      signal: AbortSignal.timeout(5000),
      cache: 'no-store',
    })
    if (!res.ok) return null
    const gist = await res.json() as { files: Record<string, { content: string } | null> }
    const file = gist.files?.[filename]
    if (!file?.content) return null
    return JSON.parse(file.content)
  } catch {
    return null
  }
}

// ── Write to Gist ─────────────────────────────────────────────────────────────
export async function writeGistFile(filename: string, data: unknown): Promise<void> {
  if (!isConfigured()) return
  try {
    await fetch(`${GIST_API}/${process.env.GIST_ID}`, {
      method: 'PATCH',
      headers: gistHeaders(),
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        files: {
          [filename]: { content: JSON.stringify(data, null, 2) },
        },
      }),
    })
  } catch {
    // Never throw — writing to Gist is best-effort only
  }
}

// ── Typed helpers ─────────────────────────────────────────────────────────────
export async function readPartiesFromGist() {
  return readGistFile(PARTIES_FILE)
}

export async function writePartiesToGist(data: unknown): Promise<void> {
  // Fire-and-forget — never await in the hot path
  writeGistFile(PARTIES_FILE, data).catch(() => {})
}

export async function readConstituenciesFromGist() {
  return readGistFile(CONSTITUENCIES_FILE)
}

export async function writeConstituenciesToGist(data: unknown): Promise<void> {
  writeGistFile(CONSTITUENCIES_FILE, data).catch(() => {})
}
