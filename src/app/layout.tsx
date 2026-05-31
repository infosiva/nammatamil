import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import FloatingChatWrapper from '../../components/FloatingChatWrapper'

export const metadata: Metadata = {
  metadataBase: new URL('https://nammatamil.live'),
  title: 'நம்ம Tamil — தமிழர்களுக்கான செய்திகள் | Tamil News',
  description: 'Tamil Nadu and global Tamil news in Tamil. Politics, cinema, sports, lifestyle — curated for the Tamil community worldwide.',
  keywords: ['tamil news', 'tamil Nadu news', 'tamil cinema news', 'kollywood', 'tamil politics', 'IPL tamil', 'தமிழ் செய்திகள்'],
  authors: [{ name: 'NammaTamil' }],
  openGraph: {
    title: 'நம்ம Tamil — தமிழர்களுக்கான செய்திகள்',
    description: 'Tamil Nadu and global Tamil news — politics, cinema, sports, lifestyle.',
    type: 'website',
    locale: 'ta_IN',
    siteName: 'NammaTamil',
    url: 'https://nammatamil.live',
    images: [{ url: 'https://nammatamil.live/og.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'நம்ம Tamil',
    description: 'Tamil Nadu and global Tamil news.',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ta" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+Tamil:wght@400;500;600;700;800&family=Noto+Sans+Tamil:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "NewsMediaOrganization",
            "name": "NammaTamil",
            "url": "https://nammatamil.live",
            "description": "Tamil Nadu and global Tamil news",
            "inLanguage": "ta",
          })}}
        />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        {children}
        <FloatingChatWrapper />
        <Script defer data-site="nammatamil.live" src="http://31.97.56.148:3098/t.js" strategy="afterInteractive" />
      </body>
    </html>
  )
}
