import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: {
    default: 'NammaTamil.tv — Your Tamil Entertainment Universe',
    template: '%s | NammaTamil.tv',
  },
  description: 'Complete database of Tamil serials, Tamil movies, Tamil dubbed films from Malayalam & Telugu, and iconic Tamil music albums. Your ultimate Tamil entertainment guide.',
  keywords: ['Tamil serials', 'Tamil movies', 'Tamil dubbed movies', 'Sun TV serials', 'Vijay TV serials', 'Tamil albums', 'Tamil dubbed Malayalam movies', 'NammaTamil'],
  metadataBase: new URL('https://nammatamil.live'),
  openGraph: {
    type: 'website',
    siteName: 'NammaTamil.tv',
    title: 'NammaTamil.tv — Your Tamil Entertainment Universe',
    description: 'Tamil serials, movies, dubbed films, and music albums — all in one place.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NammaTamil.tv',
    description: 'Your complete Tamil entertainment universe',
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
