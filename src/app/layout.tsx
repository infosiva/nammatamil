import type { Metadata } from 'next'
import './globals.css'
import SharedNavbar from '../../components/SharedNavbar'
import Footer from '../../components/Footer'
import CookieConsent from '../../components/CookieConsent'
import type { BrandConfig } from '../../components/SharedNavbar'

export const brand: BrandConfig = {
  name: 'NammaTamil',
  tagline: 'உங்கள் தமிழ் செய்திகள் — AI-powered Tamil news and culture.',
  icon: '🌿',
  color: '#7c3aed',
  url: 'https://nammatamil.live',
  navLinks: [
    { label: 'செய்திகள்', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ],
}

export const metadata: Metadata = {
  title: 'NammaTamil — Tamil News & Culture',
  description: 'உங்கள் தமிழ் செய்திகள். AI-curated Tamil news, culture, and stories for the global Tamil community.',
  keywords: ['Tamil news', 'தமிழ் செய்திகள்', 'Tamil culture', 'Tamil community', 'NammaTamil'],
  openGraph: {
    title: 'NammaTamil — Tamil News & Culture',
    description: 'AI-curated Tamil news for the global community.',
    type: 'website',
    locale: 'ta_IN',
    siteName: 'NammaTamil',
    url: 'https://nammatamil.live',
  },
  twitter: { card: 'summary_large_image', title: 'NammaTamil', description: 'Tamil news & culture.' },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ta" suppressHydrationWarning>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org", "@type": "NewsMediaOrganization",
          "name": "NammaTamil", "url": "https://nammatamil.live",
          "description": "AI-curated Tamil news and culture",
          "inLanguage": "ta",
        })}} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{ __html: `
          body { font-family: 'Noto Sans Tamil', 'Inter', system-ui, sans-serif !important; }
          h1, h2, h3 { font-family: 'Noto Sans Tamil', 'Inter', sans-serif !important; font-weight: 700; }
        ` }} />
      </head>
      <body className="flex flex-col min-h-screen">
        <SharedNavbar brand={brand} />
        <main className="flex-1 pt-16">{children}</main>
        <Footer siteName="NammaTamil" />
        <CookieConsent />
      </body>
    </html>
  )
}
