import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import TNElectionClient from './TNElectionClient'

export const metadata: Metadata = {
  title: 'Tamil Nadu Election Results 2026 — Live Counting | NammaTamil',
  description:
    'Tamil Nadu Assembly Election Results 2026 LIVE. Party-wise seat count, constituency results, DMK vs TVK vs AIADMK live tally. Counting starts May 4, 2026 at 8 AM IST. 234 seats · 6.4 Cr voters.',
  keywords: [
    'Tamil Nadu election results 2026',
    'TN election results live',
    'Tamil Nadu assembly election 2026',
    'TN election counting May 4 2026',
    'DMK election results',
    'TVK election results',
    'AIADMK election results',
    'Thalapathy Vijay TVK seats 2026',
    'MK Stalin DMK election 2026',
    'Edappadi Palaniswami AIADMK',
    'Tamil Nadu live seat count',
    'Tamil Nadu constituency results',
    'தமிழ்நாடு தேர்தல் முடிவுகள் 2026',
    'தமிழ்நாடு சட்டமன்ற தேர்தல் 2026',
    'வாக்கு எண்ணிக்கை 2026',
    'who will win Tamil Nadu 2026',
    'TN election seat prediction',
    'exit poll Tamil Nadu 2026',
    'Tamil Nadu election live results today',
  ],
  metadataBase: new URL('https://nammatamil.live'),
  alternates: {
    canonical: 'https://nammatamil.live/tn-election-2026',
  },
  openGraph: {
    type: 'article',
    url: 'https://nammatamil.live/tn-election-2026',
    title: 'Tamil Nadu Election Results 2026 — Live Counting | NammaTamil',
    description:
      'LIVE: Tamil Nadu Assembly Election Results 2026. DMK vs TVK vs AIADMK seat-by-seat count. Counting begins May 4 at 8 AM IST.',
    siteName: 'NammaTamil.live',
    locale: 'ta_IN',
    images: [
      {
        url: '/og-election-2026.jpg',
        width: 1200,
        height: 630,
        alt: 'Tamil Nadu Election Results 2026 — Live on NammaTamil',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tamil Nadu Election Results 2026 LIVE | NammaTamil',
    description:
      'LIVE seat count: DMK vs TVK vs AIADMK. 234 seats · Counting from May 4, 8 AM IST.',
    images: ['/og-election-2026.jpg'],
  },
  robots: { index: true, follow: true },
}

// JSON-LD: Event + NewsArticle + FAQPage
const eventSchema = {
  '@context': 'https://schema.org',
  '@type': 'Event',
  name: 'Tamil Nadu Assembly Elections 2026 — Vote Counting',
  description:
    'Live counting of Tamil Nadu Legislative Assembly Election 2026 results. 234 seats, majority mark 118. DMK, TVK, AIADMK, BJP, Congress, PMK contesting.',
  startDate: '2026-05-04T08:00:00+05:30',
  endDate: '2026-05-04T23:59:00+05:30',
  eventStatus: 'https://schema.org/EventScheduled',
  eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
  location: {
    '@type': 'Place',
    name: 'Tamil Nadu, India',
    address: { '@type': 'PostalAddress', addressRegion: 'Tamil Nadu', addressCountry: 'IN' },
  },
  organizer: { '@type': 'GovernmentOrganization', name: 'Election Commission of India', url: 'https://eci.gov.in' },
  url: 'https://nammatamil.live/tn-election-2026',
}

const newsArticleSchema = {
  '@context': 'https://schema.org',
  '@type': 'NewsArticle',
  headline: 'Tamil Nadu Election Results 2026 — Live Counting Update',
  description:
    'Real-time Tamil Nadu Assembly Election 2026 results. Seat-by-seat live count for all 234 constituencies. DMK, TVK, AIADMK, BJP seat tally updating live.',
  datePublished: '2026-05-04T08:00:00+05:30',
  dateModified: new Date().toISOString(),
  author: { '@type': 'Organization', name: 'NammaTamil', url: 'https://nammatamil.live' },
  publisher: {
    '@type': 'Organization',
    name: 'NammaTamil.live',
    logo: { '@type': 'ImageObject', url: 'https://nammatamil.live/favicon.svg' },
  },
  mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://nammatamil.live/tn-election-2026' },
  about: [
    { '@type': 'Thing', name: 'Tamil Nadu Legislative Assembly Election 2026' },
    { '@type': 'Organization', name: 'DMK' },
    { '@type': 'Organization', name: 'TVK' },
    { '@type': 'Organization', name: 'AIADMK' },
  ],
  keywords: 'Tamil Nadu election results 2026, TN election live, DMK TVK AIADMK seats',
  inLanguage: 'ta',
  isAccessibleForFree: true,
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'When are Tamil Nadu election 2026 results announced?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Tamil Nadu Assembly Election 2026 vote counting begins on May 4, 2026 at 8:00 AM IST. Results are expected to be declared by the evening of May 4.',
      },
    },
    {
      '@type': 'Question',
      name: 'How many seats does a party need to win Tamil Nadu election 2026?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Tamil Nadu has 234 assembly constituencies. A party or alliance needs 118 seats for a majority to form the government.',
      },
    },
    {
      '@type': 'Question',
      name: 'What do exit polls say about Tamil Nadu 2026 election?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Axis My India exit poll (India Today) projects TVK (Vijay\'s party) as the single largest party with 98–120 seats. DMK is projected at 92–110 seats, AIADMK at 22–32 seats.',
      },
    },
    {
      '@type': 'Question',
      name: 'Which party is leading in Tamil Nadu 2026 elections?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'According to exit polls, TVK (Thalapathy Vijay\'s party) is projected to be the leading party with 98–120 seats in the Tamil Nadu 2026 assembly election. Live results are available on NammaTamil from May 4, 2026.',
      },
    },
    {
      '@type': 'Question',
      name: 'Where can I watch Tamil Nadu election 2026 live results?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Live Tamil Nadu Election 2026 results are available on NammaTamil.live/tn-election-2026 from May 4, 8 AM IST. Results update automatically from the Election Commission of India.',
      },
    },
  ],
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'NammaTamil', item: 'https://nammatamil.live' },
    { '@type': 'ListItem', position: 2, name: 'TN Election 2026', item: 'https://nammatamil.live/tn-election-2026' },
  ],
}

export default function TNElectionPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(newsArticleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <TNElectionClient />
    </>
  )
}
