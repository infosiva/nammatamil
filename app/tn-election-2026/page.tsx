import type { Metadata } from 'next'
import TNElectionClient from './TNElectionClient'

export const metadata: Metadata = {
  title: 'Tamil Nadu Elections 2026 — Who Will Lead Tamil Nadu? | NammaTamil',
  description:
    'Tamil Nadu Assembly Elections 2026: Vote for your leader, see live seat predictions, crowdsourced forecasts for DMK, AIADMK, TVK, BJP, Congress, PMK. Real-time polls, party-wise seat ranges and election results on May 4.',
  keywords: [
    'Tamil Nadu elections 2026',
    'TN election 2026',
    'தமிழ்நாடு தேர்தல் 2026',
    'DMK AIADMK TVK seats prediction',
    'MK Stalin election 2026',
    'Edappadi Palaniswami',
    'Thalapathy Vijay TVK election',
    'Tamil Nadu assembly election results',
    'TN election counting May 4',
    'Tamil Nadu seat forecast',
    'who will win Tamil Nadu 2026',
    'TN election poll vote',
  ],
  metadataBase: new URL('https://nammatamil.live'),
  alternates: {
    canonical: 'https://nammatamil.live/tn-election-2026',
  },
  openGraph: {
    type: 'website',
    url: 'https://nammatamil.live/tn-election-2026',
    title: 'Tamil Nadu Elections 2026 — Who Will Lead Tamil Nadu?',
    description:
      'Cast your vote, see live seat predictions and crowdsourced forecasts for TN Elections 2026. DMK vs AIADMK vs TVK — results from May 4.',
    siteName: 'NammaTamil.live',
    locale: 'ta_IN',
    images: [
      {
        url: '/og-election-2026.jpg',
        width: 1200,
        height: 630,
        alt: 'Tamil Nadu Elections 2026 — Who Will Lead Tamil Nadu?',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tamil Nadu Elections 2026 — Who Will Lead Tamil Nadu?',
    description:
      'Vote, predict, and track live results. TN Elections 2026 — Counting starts May 4.',
    images: ['/og-election-2026.jpg'],
  },
  robots: { index: true, follow: true },
}

// JSON-LD structured data for rich results
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Event',
  name: 'Tamil Nadu Assembly Elections 2026',
  description:
    'Tamil Nadu Legislative Assembly Elections 2026. Vote counting begins May 4, 2026.',
  startDate: '2026-05-04T06:00:00+05:30',
  location: {
    '@type': 'Place',
    name: 'Tamil Nadu, India',
    address: { '@type': 'PostalAddress', addressRegion: 'Tamil Nadu', addressCountry: 'IN' },
  },
  organizer: { '@type': 'GovernmentOrganization', name: 'Election Commission of India' },
  url: 'https://nammatamil.live/tn-election-2026',
}

export default function TNElectionPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TNElectionClient />
    </>
  )
}
