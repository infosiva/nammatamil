import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import TrendingTicker from '@/components/TrendingTicker'
import ChatBot from '@/components/ChatBot'
import FeedbackWidget from '@/components/FeedbackWidget'
import CookieConsent from "../components/CookieConsent";

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
  description: 'Discover Tamil serials, movies, dubbed films, and music albums on NammaTamil.tv — your ultimate hub for Tamil entertainment worldwide.',
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
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'NammaTamil.tv — Tamil Entertainment Hub',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NammaTamil.tv — Tamil Entertainment Hub',
    description: 'Your complete Tamil entertainment universe — movies, serials, OTT, cricket and more.',
    images: ['/opengraph-image'],
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_ID ?? 'ca-pub-4237294630161176'

  return (
    <html lang="ta-IN">
      <head>
        {/* Fonts — preconnect first, then non-blocking load via media trick */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        {/* Load font as print first (non-blocking), then swap to all on load */}
        <link
          rel="preload"
          as="style"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          media="print"
          // @ts-expect-error onload is valid for link elements
          onLoad="this.media='all'"
        />
        <noscript>
          {/* eslint-disable-next-line @next/next/no-page-custom-font */}
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          />
        </noscript>
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        {/* Kill Vercel's built-in feedback widget — we have our own */}
        <Script id="kill-vercel-feedback" strategy="afterInteractive">{`
          (function(){
            function rm(){
              ['__vercel-feedback','vercel-live-feedback','__vercel-toolbar-wrapper'].forEach(function(id){
                var el=document.getElementById(id);
                if(el){el.remove();}
              });
              ['vercel-toolbar','nextjs-portal'].forEach(function(sel){
                document.querySelectorAll(sel).forEach(function(el){el.remove();});
              });
            }
            rm();
            var obs=new MutationObserver(rm);
            function startObs(){
              obs.observe(document.body,{childList:true,subtree:true});
              rm();
            }
            if(document.body){startObs();}
            else{document.addEventListener('DOMContentLoaded',startObs);}
          })();
        `}</Script>
      </head>
      <body className="min-h-screen flex flex-col bg-site">
        <Header />
        <TrendingTicker />
        <main className="flex-1">{children}</main>
        <Footer />
        <ChatBot />
        <FeedbackWidget />
      <CookieConsent />
      </body>
    </html>
  )
}
