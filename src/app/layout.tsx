import type { Metadata } from 'next'
import './globals.css'
import FloatingChatWrapper from '../../components/FloatingChatWrapper'
import FeedbackWidget from '@/components/FeedbackWidget'
import { AnimatedBg } from '@/components/AnimatedBg'
import { Analytics } from '@vercel/analytics/next'
import Telemetry from '@/components/Telemetry'
import { loadSiteTheme, buildThemeStyleTag, buildGa4Snippet } from '@/lib/theme-loader'

import { MotionProvider } from "@infosiva/shared-ui/modern";
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = await loadSiteTheme('nammatamil')
  // hub id wins; env is the fallback until the hub has nammatamil's id
  const ga4Id = theme?.analytics?.ga4Id || process.env.NEXT_PUBLIC_GA4_ID
  const ga4 = buildGa4Snippet(theme?.analytics?.ga4Id ? theme : { ...(theme ?? {}), analytics: { ...(theme?.analytics ?? {}), ga4Id } } as typeof theme)
  return (
    <html lang="ta" data-layout={theme?.layout?.archetype ?? 'travel-magazine'} suppressHydrationWarning>
      <head>
        <meta name="google-adsense-account" content="ca-pub-4237294630161176" />
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
        <style dangerouslySetInnerHTML={{ __html: buildThemeStyleTag(theme, { background: '#faf3e3', primary: '#237a57', secondary: '#c98a2b' }) }} />
        {ga4 && <script async src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`} />}
        {ga4 && <script dangerouslySetInnerHTML={{ __html: ga4 }} />}
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        <AnimatedBg theme={theme} />
        <MotionProvider>{children}</MotionProvider>
        <Telemetry />
        <Analytics />
        <FloatingChatWrapper />
        <FeedbackWidget siteName="NammaTamil" />
      </body>
    </html>
  )
}
