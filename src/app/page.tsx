import { SAMPLE_HEADLINES } from '@/lib/news'
import NewsLayout from '@/components/NewsLayout'
import type { NewsItem } from '@/lib/news'

export const revalidate = 600 // revalidate every 10 minutes

export default async function HomePage() {
  let articles: NewsItem[] = SAMPLE_HEADLINES

  try {
    const baseUrl = process.env.NEXT_PUBLIC_URL ?? 'https://nammatamil.live'
    const res = await fetch(`${baseUrl}/api/news`, {
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
      <NewsLayout articles={articles} />
    </>
  )
}
