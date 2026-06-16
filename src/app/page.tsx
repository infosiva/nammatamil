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

  return <NewsLayout articles={articles} />
}
