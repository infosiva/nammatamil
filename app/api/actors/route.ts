/**
 * /api/actors — Tamil cinema actors, directors, composers
 * Primary: TMDB person search for known Tamil stars
 * Fallback: static data/actors.ts
 * Cache: 24 hours (person data is stable)
 */
import { NextResponse } from 'next/server'

export const revalidate = 86400 // 24 hours

const TMDB_KEY = process.env.TMDB_API_KEY ?? ''
const TMDB_BASE = 'https://api.themoviedb.org/3'

// Canonical list of Tamil stars — fetch from TMDB by name for live bios/credits
const TAMIL_STARS = [
  { name: 'Rajinikanth', slug: 'rajinikanth', badge: 'Superstar', type: 'actor' as const, gradient: 'from-red-700 via-orange-600 to-amber-500' },
  { name: 'Vijay', slug: 'vijay', badge: 'Thalapathy / TVK Chief', type: 'actor' as const, gradient: 'from-blue-700 via-indigo-600 to-violet-500' },
  { name: 'Ajith Kumar', slug: 'ajith-kumar', badge: 'Thala', type: 'actor' as const, gradient: 'from-slate-700 via-gray-600 to-zinc-500' },
  { name: 'Kamal Haasan', slug: 'kamal-haasan', badge: 'Ulaganayagan', type: 'actor' as const, gradient: 'from-purple-700 via-violet-600 to-indigo-500' },
  { name: 'Suriya', slug: 'suriya', badge: 'Sivakumar\'s Son', type: 'actor' as const, gradient: 'from-amber-600 via-orange-500 to-red-500' },
  { name: 'Dhanush', slug: 'dhanush', badge: 'National Award Winner', type: 'actor' as const, gradient: 'from-indigo-700 via-blue-600 to-cyan-500' },
  { name: 'Sivakarthikeyan', slug: 'sivakarthikeyan', badge: 'SK', type: 'actor' as const, gradient: 'from-teal-700 via-emerald-600 to-green-500' },
  { name: 'Vijay Sethupathi', slug: 'vijay-sethupathi', badge: 'Makkal Selvan', type: 'actor' as const, gradient: 'from-rose-700 via-pink-600 to-fuchsia-500' },
  { name: 'Mani Ratnam', slug: 'mani-ratnam', badge: 'Maestro', type: 'director' as const, gradient: 'from-gray-700 via-slate-600 to-zinc-500' },
  { name: 'Shankar', slug: 'shankar', badge: 'Isai Puyal', type: 'director' as const, gradient: 'from-blue-800 via-blue-700 to-indigo-600' },
  { name: 'A.R. Rahman', slug: 'ar-rahman', badge: 'Mozart of Madras', type: 'composer' as const, gradient: 'from-amber-700 via-yellow-600 to-lime-500' },
  { name: 'Ilaiyaraaja', slug: 'ilaiyaraaja', badge: 'Isaignani', type: 'composer' as const, gradient: 'from-orange-700 via-amber-600 to-yellow-500' },
]

interface TMDBPerson {
  id: number
  name: string
  biography?: string
  birthday?: string
  known_for_department?: string
  profile_path?: string
}

async function fetchTMDBPerson(name: string): Promise<TMDBPerson | null> {
  if (!TMDB_KEY) return null
  try {
    const searchUrl = `${TMDB_BASE}/search/person?api_key=${TMDB_KEY}&query=${encodeURIComponent(name)}&language=en-US`
    const res = await fetch(searchUrl, { signal: AbortSignal.timeout(4000) })
    if (!res.ok) return null
    const data = await res.json() as { results: TMDBPerson[] }
    const person = data.results?.[0]
    if (!person) return null

    // Fetch full details for biography
    const detailRes = await fetch(`${TMDB_BASE}/person/${person.id}?api_key=${TMDB_KEY}&language=en-US`, {
      signal: AbortSignal.timeout(4000),
    })
    if (!detailRes.ok) return person
    return await detailRes.json() as TMDBPerson
  } catch { return null }
}

export async function GET() {
  // Import static data as baseline (always available at build time)
  const { actors: STATIC_ACTORS } = await import('@/data/actors')

  if (!TMDB_KEY) {
    return NextResponse.json({ actors: STATIC_ACTORS, source: 'static', updatedAt: new Date().toISOString() })
  }

  // Enrich known stars with live TMDB data in parallel (throttled to avoid rate limits)
  const enriched = await Promise.all(
    TAMIL_STARS.map(async (star) => {
      const tmdb = await fetchTMDBPerson(star.name)
      // Find matching static entry for base data
      const staticEntry = STATIC_ACTORS.find(a => a.slug === star.slug)
      return {
        id: staticEntry?.id ?? `tmdb-${star.slug}`,
        slug: star.slug,
        name: star.name,
        tamilName: staticEntry?.tamilName ?? '',
        type: star.type,
        born: staticEntry?.born ?? (tmdb?.birthday ? new Date(tmdb.birthday).getFullYear() : undefined),
        description: (tmdb?.biography?.slice(0, 400)) || staticEntry?.description || `${star.name} — Tamil cinema legend.`,
        knownFor: staticEntry?.knownFor ?? [],
        gradient: star.gradient,
        badge: star.badge,
        notableWorks: staticEntry?.notableWorks ?? [],
        thumbnail: tmdb?.profile_path ? `https://image.tmdb.org/t/p/w300${tmdb.profile_path}` : undefined,
      }
    })
  )

  // Merge: enriched stars + any static entries not in TAMIL_STARS list
  const enrichedSlugs = new Set(enriched.map(e => e.slug))
  const remaining = STATIC_ACTORS.filter(a => !enrichedSlugs.has(a.slug))

  return NextResponse.json({
    actors: [...enriched, ...remaining],
    source: 'tmdb+static',
    updatedAt: new Date().toISOString(),
  })
}
