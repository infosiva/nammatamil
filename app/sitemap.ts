import { MetadataRoute } from 'next'
import { serials } from '@/data/serials'
import { movies } from '@/data/movies'
import { albums } from '@/data/albums'
import { actors } from '@/data/actors'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://nammatamil.live'
  const now = new Date()

  const staticRoutes = ['', '/serials', '/movies', '/albums', '/actors', '/tn-election-2026'].map(route => ({
    url: `${base}${route}`,
    lastModified: now,
    changeFrequency: route === '/tn-election-2026' ? 'hourly' as const : 'weekly' as const,
    priority: route === '' ? 1 : route === '/tn-election-2026' ? 0.95 : 0.8,
  }))

  const serialRoutes = serials.map(s => ({
    url: `${base}/serials/${s.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  const movieRoutes = movies.map(m => ({
    url: `${base}/movies/${m.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  const albumRoutes = albums.map(a => ({
    url: `${base}/albums/${a.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  const actorRoutes = actors.map(a => ({
    url: `${base}/actors/${a.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  return [...staticRoutes, ...serialRoutes, ...movieRoutes, ...albumRoutes, ...actorRoutes]
}
