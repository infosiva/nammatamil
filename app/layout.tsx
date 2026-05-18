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
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --nt-red: #c0392b;
            --nt-gold: #d4a017;
            --nt-dark: #0d0508;
            --nt-surface: #180b0e;
            --nt-surface-2: #221014;
            --nt-border: rgba(192,57,43,0.18);
            --nt-text: #f5ede0;
            --nt-text-2: rgba(220,190,170,0.65);
          }
          html, body { background: #0d0508 !important; }
          /* Breaking news banner */
          .breaking-banner { background: linear-gradient(90deg,#c0392b,#e74c3c) !important; }
          /* Category pills stronger */
          .cat-pill-cinema { background: rgba(139,92,246,0.15) !important; color: #a78bfa !important; }
          .cat-pill-sports { background: rgba(52,211,153,0.12) !important; color: #34d399 !important; }
          .cat-pill-politics { background: rgba(251,191,36,0.12) !important; color: #fbbf24 !important; }
          /* Editorial grid card border on hover */
          .news-card:hover { border-color: rgba(192,57,43,0.4) !important; }
          /* Noto Serif Tamil for all headlines — authentic Tamil rendering */
          h1, h2, h3, .headline { font-family: 'Noto Serif Tamil', 'Noto Serif', Georgia, serif !important; }
          /* Live badge pulse */
          .live-badge { animation: livePulse 1.5s ease-in-out infinite; }
          @keyframes livePulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
        `}} />
        {/* Fonts — Noto Serif Tamil (headlines) + Inter (UI chrome) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,700;0,800;1,700&family=Noto+Serif+Tamil:wght@700;800&family=Inter:wght@400;500;600;700;800;900&display=swap"
          media="print"
          // @ts-expect-error onload is valid for link elements
          onLoad="this.media='all'"
        />
        <noscript>
          {/* eslint-disable-next-line @next/next/no-page-custom-font */}
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,700;0,800;1,700&family=Noto+Serif+Tamil:wght@700;800&family=Inter:wght@400;500;600;700;800;900&display=swap"
          />
        </noscript>
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        {/* Push AdSense for dynamically injected ins tags */}
        <Script id="adsense-init" strategy="afterInteractive">{`
          (function(){
            try {
              (window.adsbygoogle = window.adsbygoogle || []).push({});
            } catch(e){}
          })();
        `}</Script>
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
