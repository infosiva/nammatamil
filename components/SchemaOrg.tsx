// components/SchemaOrg.tsx — server component, zero JS shipped to client
// NewsMediaOrganization + FAQPage schemas for nammatamil.live

const FAQ = [
  {
    q: 'What is NammaTamil?',
    a: 'NammaTamil is a Tamil language news and culture portal that delivers AI-curated news from Tamil Nadu, covering politics, cinema, culture, and current affairs for the global Tamil community.',
  },
  {
    q: 'What topics does NammaTamil cover?',
    a: 'NammaTamil covers Tamil Nadu politics, cinema and entertainment, culture, sports, technology, and current affairs — all in Tamil and English.',
  },
  {
    q: 'How often is NammaTamil updated?',
    a: 'NammaTamil is updated daily with fresh news and stories from trusted Tamil media sources, curated and summarised using AI.',
  },
  {
    q: 'Is NammaTamil free to read?',
    a: 'Yes, NammaTamil is completely free to read. No registration or subscription is required.',
  },
]

export default function SchemaOrg() {
  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'NewsMediaOrganization',
      name: 'NammaTamil',
      url: 'https://nammatamil.live',
      description: 'AI-curated Tamil news, culture, and stories for the global Tamil community.',
      inLanguage: 'ta',
      sameAs: ['https://nammatamil.live'],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    },
  ]

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
    />
  )
}
