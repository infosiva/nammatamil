import type { Metadata } from 'next'
import './globals.css'
import SharedNavbar from '@/components/SharedNavbar'
import SharedFooter from '@/components/SharedFooter'
import DesignEffects from '@/components/DesignEffects'
import AnimatedBackground from '@/components/AnimatedBackground'
import type { BrandConfig } from '@/components/SharedNavbar'

export const brand: BrandConfig = {
  name: 'RoamPlan',
  tagline: 'AI travel planner — personalised day-by-day itineraries for any destination.',
  icon: '✈️',
  color: '#f97316',
  url: 'https://roamplan.app',
  navLinks: [{ label: 'Plan trip', href: '/' }, { label: 'Pricing', href: '#pricing' }],
  cta: { label: 'Plan free →', href: '#planner' },
}

export const metadata: Metadata = {
  title: 'RoamPlan — AI Travel Itinerary Planner',
  description: 'Generate personalised day-by-day travel itineraries in seconds. AI travel planner for any budget, duration and destination.',
  keywords: ['travel planner', 'AI itinerary', 'trip planner', 'travel itinerary', 'holiday planner'],
  openGraph: { title: 'RoamPlan — AI Travel Planner', description: 'Personalised travel itineraries in seconds.', type: 'website', locale: 'en_GB', siteName: 'RoamPlan' },
  twitter: { card: 'summary_large_image', title: 'RoamPlan', description: 'AI travel itinerary planner.' },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org", "@type": "SoftwareApplication",
          "name": "RoamPlan", "url": brand.url, "description": brand.tagline,
          "applicationCategory": "TravelApplication", "operatingSystem": "Web",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "GBP" }
        })}} />
      </head>
      <body className="flex flex-col min-h-screen">
        <AnimatedBackground />
        <DesignEffects />
        <SharedNavbar brand={brand} />
        <main className="flex-1 pt-16">{children}</main>
        <SharedFooter brand={brand} />
      </body>
    </html>
  )
}
