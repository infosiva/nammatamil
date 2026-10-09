import { SAMPLE_HEADLINES } from '@/lib/news'
import NewsLayout from '@/components/NewsLayout'
import type { NewsItem } from '@/lib/news'
import { getSiteFlags } from '@/lib/flags'
import { getElection } from '@/lib/election'
import TrendingStrip from '@/components/TrendingStrip'
import { getTrending } from '@/lib/trending'
import ElectionCard from '@/components/ElectionCard'

export const revalidate = 60 // election card needs minute-level freshness; news fetch below keeps its own 10 min cache

export default async function HomePage() {
  const [flags, seats, trends] = await Promise.all([getSiteFlags('nammatamil'), getElection(), getTrending()])
  let articles: NewsItem[] = SAMPLE_HEADLINES

  try {
    const baseUrl = process.env.NEXT_PUBLIC_URL ?? 'https://nammatamil.live'
    // deployment id in the URL keys the data cache per deploy, so a code fix is not hidden by a 10 min stale entry
    const res = await fetch(`${baseUrl}/api/news?d=${process.env.VERCEL_DEPLOYMENT_ID ?? ''}`, {
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(8000),
    })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data.articles) && data.articles.length > 0) {
        articles = data.articles
      }
    }
  } catch {
    // fall through to SAMPLE_HEADLINES
  }

  return (
    <>
      <h1 style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
        NammaTamil — Tamil News, Cinema &amp; Trending Stories
      </h1>
      <NewsLayout top={<><ElectionCard seats={seats} /><TrendingStrip trends={trends} /></>} articles={articles} showBreakingTicker={flags.breaking_ticker} />
    </>
  )
}
