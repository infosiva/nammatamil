import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import SharedNavbar from '../../components/SharedNavbar'
import Footer from '../../components/Footer'
import CookieConsent from '../../components/CookieConsent'
import type { BrandConfig } from '../../components/SharedNavbar'
import FloatingChatWrapper from '../../components/FloatingChatWrapper'
import SchemaOrg from '../../components/SchemaOrg'

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
  metadataBase: new URL('https://nammatamil.live'),
  title: 'NammaTamil — Tamil News, Culture & Stories',
  description: 'உங்கள் தமிழ் செய்திகள். AI-curated Tamil news, culture, and stories for the global Tamil community. Get latest Tamil news daily.',
  keywords: ['Tamil news', 'தமிழ் செய்திகள்', 'Tamil culture', 'Tamil stories', 'Tamil media', 'Tamil community', 'Tamil news portal'],
  authors: [{ name: 'NammaTamil' }],
  openGraph: {
    title: 'NammaTamil — Tamil News & Culture',
    description: 'உங்கள் தமிழ் செய்திகள். AI-curated Tamil news for the global Tamil community.',
    type: 'website',
    locale: 'ta_IN',
    siteName: 'NammaTamil',
    url: 'https://nammatamil.live',
    images: [{
      url: 'https://nammatamil.live/og-image.png',
      width: 1200,
      height: 630,
      alt: 'NammaTamil - Tamil News & Culture'
    }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NammaTamil — Tamil News & Culture',
    description: 'AI-curated Tamil news and culture stories for the global Tamil community.',
    images: ['https://nammatamil.live/og-image.png']
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ta" suppressHydrationWarning>
      <head>
        <SchemaOrg />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{ __html: `
          body { font-family: 'Noto Sans Tamil', 'Inter', system-ui, sans-serif !important; }
          h1, h2, h3 { font-family: 'Noto Sans Tamil', 'Inter', sans-serif !important; font-weight: 700; }
        ` }} />
      </head>
      <body className="flex flex-col min-h-screen">
        <div className="aurora aurora-primary" aria-hidden />
        <div className="aurora aurora-secondary" aria-hidden />
        <div className="aurora aurora-third" aria-hidden />
        <div className="grain" aria-hidden />
        <SharedNavbar brand={brand} />
        <main className="flex-1 pt-16">{children}</main>
        <Footer siteName="NammaTamil" />
        <CookieConsent />
        <FloatingChatWrapper />
        <Script defer data-site="nammatamil.live" src="http://31.97.56.148:3098/t.js" strategy="afterInteractive" />
      </body>
    </html>
  )
}
