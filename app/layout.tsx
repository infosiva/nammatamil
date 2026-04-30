import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import TVKWidget from '@/components/TVKWidget'
import FeedbackWidget from '@/components/FeedbackWidget'

export const metadata: Metadata = {
  title: {
    default: 'NammaTamil.tv — Tamil Entertainment Hub',
    template: '%s | NammaTamil.tv',
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  description: 'Discover the best of Tamil entertainment - serials, movies, dubbed films, music, and more. Your ultimate hub for Tamil cinema, TV shows, and culture, including Tamil dubbed movies.',
  keywords: [
    'Tamil serials', 'Tamil movies', 'Tamil dubbed movies',
    'Sun TV serials', 'Vijay TV serials', 'Tamil albums',
    'Tamil dubbed Malayalam movies', 'NammaTamil',
    'Tamil OTT', 'Netflix Tamil', 'Amazon Prime Tamil',
    'Thalapathy Vijay', 'Tamil cinema 2026',
  ],
  metadataBase: new URL('https://nammatamil.live'),
  openGraph: {
    type: 'website',
    siteName: 'NammaTamil.tv',
    title: 'NammaTamil.tv — Tamil Entertainment Hub',
    description: 'Tamil serials, movies, dubbed films, and music albums — all in one place for the Tamil diaspora worldwide.',
    locale: 'ta_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NammaTamil.tv — Tamil Entertainment Hub',
    description: 'Your complete Tamil entertainment universe — movies, serials, OTT, cricket and more.',
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
        <Script
          src="/t.js"
          data-site="nammatamil.live"
          strategy="lazyOnload"
        />
        {/* Kill Vercel's built-in feedback tab — we have our own */}
        <Script id="kill-vercel-feedback" strategy="afterInteractive">{`
          (function(){
            function rm(){
              var el=document.getElementById('__vercel-feedback');
              if(el){el.remove();}
              var tb=document.querySelector('vercel-toolbar');
              if(tb){tb.remove();}
            }
            rm();
            new MutationObserver(rm).observe(document.body,{childList:true,subtree:true});
          })();
        `}</Script>
      </head>
      <body className="min-h-screen flex flex-col bg-site">
        <TVKWidget />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <FeedbackWidget />
      </body>
    </html>
  )
}
