export interface NewsItem {
  id: string
  title: string       // Tamil title
  titleEn: string     // English fallback
  summary: string
  category: Category
  source: string
  sourceUrl: string
  publishedAt: string // ISO
  imageUrl?: string
  tags?: string[]
  breaking?: boolean
  trending?: boolean
}

export type Category = 'அனைத்தும்' | 'அரசியல்' | 'சினிமா' | 'விளையாட்டு' | 'தமிழகம்' | 'உலகம்' | 'தொழில்நுட்பம்' | 'வாழ்க்கை'

export const CATEGORIES: Category[] = [
  'அனைத்தும்',
  'தமிழகம்',
  'அரசியல்',
  'சினிமா',
  'விளையாட்டு',
  'உலகம்',
  'தொழில்நுட்பம்',
  'வாழ்க்கை',
]

export const CATEGORY_EN: Record<Category, string> = {
  'அனைத்தும்':    'All',
  'தமிழகம்':      'Tamil Nadu',
  'அரசியல்':      'Politics',
  'சினிமா':       'Cinema',
  'விளையாட்டு':   'Sports',
  'உலகம்':        'World',
  'தொழில்நுட்பம்': 'Tech',
  'வாழ்க்கை':    'Lifestyle',
}

export const CATEGORY_ICONS: Record<Category, string> = {
  'அனைத்தும்':    '🗞',
  'தமிழகம்':      '🏛',
  'அரசியல்':      '⚖️',
  'சினிமா':       '🎬',
  'விளையாட்டு':   '🏏',
  'உலகம்':        '🌍',
  'தொழில்நுட்பம்': '💡',
  'வாழ்க்கை':    '🌿',
}

// No sample headlines: the home page shows an honest empty state when the live feed is unavailable.
export const SAMPLE_HEADLINES: NewsItem[] = []

export function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60)   return `${Math.round(diff)} நிமிடம் முன்`
  if (diff < 3600) return `${Math.round(diff / 60)} நிமிடங்கள் முன்`
  if (diff < 86400) return `${Math.round(diff / 3600)} மணி நேரம் முன்`
  return `${Math.round(diff / 86400)} நாட்கள் முன்`
}
