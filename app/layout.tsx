import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: {
    default: 'NammaTamil.tv — Tamil Entertainment & TVK Election 2026',
    template: '%s | NammaTamil.tv',
  },
  description: 'Complete database of Tamil serials, Tamil movies, Tamil dubbed films and music albums. Proud supporters of TVK — Tamilaga Vettri Kazhagam led by Vijay. Tamil Nadu Elections May 4, 2026.',
  keywords: [
    'Tamil serials', 'Tamil movies', 'Tamil dubbed movies',
    'Sun TV serials', 'Vijay TV serials', 'Tamil albums',
    'Tamil dubbed Malayalam movies', 'NammaTamil',
    'TVK', 'Tamilaga Vettri Kazhagam', 'Vijay actor', 'Vijay politics',
    'Tamil Nadu election 2026', 'May 4 election', 'Tamil politics',
    'Thalapathy Vijay', 'TVK party',
  ],
  metadataBase: new URL('https://nammatamil.live'),
  openGraph: {
    type: 'website',
    siteName: 'NammaTamil.tv',
    title: 'NammaTamil.tv — Tamil Entertainment & TVK 2026',
    description: 'Tamil serials, movies, dubbed films, and music albums — all in one place. Supporting TVK & Thalapathy Vijay for Tamil Nadu Elections 2026.',
    locale: 'ta_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NammaTamil.tv — Tamil Entertainment & TVK',
    description: 'Your complete Tamil entertainment universe. Proud TVK supporters. Tamil Nadu Elections May 4, 2026.',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_ID ?? 'ca-pub-4237294630161176'

  return (
    <html lang="ta-IN">
      <head>
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-site">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
