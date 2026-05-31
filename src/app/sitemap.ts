import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://nammatamil.live', lastModified: new Date(), changeFrequency: 'hourly', priority: 1 },
    { url: 'https://nammatamil.live/about', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: 'https://nammatamil.live/contact', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: 'https://nammatamil.live/privacy', lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: 'https://nammatamil.live/terms', lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ]
}
