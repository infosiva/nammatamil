import type { Metadata } from 'next'
import { CheckCircle, XCircle, ExternalLink } from 'lucide-react'
import AdUnit from '@/components/AdUnit'

export const metadata: Metadata = {
  title: 'Best OTT Plans for Tamil Content 2026 — Compare Netflix, Hotstar, ZEE5 & More',
  description: 'Compare the best OTT streaming plans for Tamil movies and serials. Find the cheapest subscription for Netflix Tamil, Disney+ Hotstar, ZEE5, Amazon Prime, and SunNXT.',
  keywords: ['OTT plans Tamil', 'Netflix Tamil subscription', 'Hotstar Tamil plan', 'ZEE5 Tamil', 'SunNXT subscription', 'best OTT for Tamil content'],
}

interface Plan {
  name: string
  tier: string
  priceInr: string
  priceGbp?: string
  priceUsd?: string
  color: string
  bg: string
  border: string
  url: string
  badge?: string
  features: {
    tamilMovies: boolean | string
    tamilSerials: boolean | string
    tamilDubbed: boolean | string
    liveTV: boolean | string
    downloads: boolean | string
    screens: string
    quality: string
  }
}

const PLANS: Plan[] = [
  {
    name: 'Netflix',
    tier: 'Standard with Ads',
    priceInr: '₹149/mo',
    priceGbp: '£4.99/mo',
    priceUsd: '$7.99/mo',
    color: '#e50914',
    bg: 'rgba(229,9,20,0.10)',
    border: 'rgba(229,9,20,0.35)',
    url: 'https://www.netflix.com/in/',
    features: {
      tamilMovies: true,
      tamilSerials: 'Limited',
      tamilDubbed: true,
      liveTV: false,
      downloads: false,
      screens: '2 screens',
      quality: 'Full HD',
    },
  },
  {
    name: 'Netflix',
    tier: 'Standard',
    priceInr: '₹499/mo',
    priceGbp: '£10.99/mo',
    priceUsd: '$15.49/mo',
    color: '#e50914',
    bg: 'rgba(229,9,20,0.10)',
    border: 'rgba(229,9,20,0.35)',
    url: 'https://www.netflix.com/in/',
    badge: 'Popular',
    features: {
      tamilMovies: true,
      tamilSerials: 'Limited',
      tamilDubbed: true,
      liveTV: false,
      downloads: true,
      screens: '2 screens',
      quality: 'Full HD',
    },
  },
  {
    name: 'Disney+ Hotstar',
    tier: 'Mobile',
    priceInr: '₹149/mo',
    priceGbp: '£2.99/mo',
    priceUsd: '$2.99/mo',
    color: '#0073e6',
    bg: 'rgba(0,115,230,0.10)',
    border: 'rgba(0,115,230,0.35)',
    url: 'https://www.hotstar.com/in',
    features: {
      tamilMovies: true,
      tamilSerials: true,
      tamilDubbed: true,
      liveTV: 'Select channels',
      downloads: true,
      screens: '1 screen (mobile)',
      quality: 'HD',
    },
  },
  {
    name: 'Disney+ Hotstar',
    tier: 'Super',
    priceInr: '₹299/mo',
    priceGbp: '£5.99/mo',
    priceUsd: '$5.99/mo',
    color: '#0073e6',
    bg: 'rgba(0,115,230,0.10)',
    border: 'rgba(0,115,230,0.35)',
    url: 'https://www.hotstar.com/in',
    badge: 'Best Value',
    features: {
      tamilMovies: true,
      tamilSerials: true,
      tamilDubbed: true,
      liveTV: true,
      downloads: true,
      screens: '2 screens',
      quality: 'Full HD',
    },
  },
  {
    name: 'ZEE5',
    tier: 'Annual',
    priceInr: '₹99/mo',
    priceGbp: '£3.99/mo',
    priceUsd: '$4.99/mo',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.10)',
    border: 'rgba(139,92,246,0.35)',
    url: 'https://www.zee5.com/',
    badge: 'Cheapest',
    features: {
      tamilMovies: true,
      tamilSerials: 'ZEE Tamil originals',
      tamilDubbed: 'Some',
      liveTV: 'ZEE Tamil live',
      downloads: true,
      screens: '2 screens',
      quality: 'Full HD',
    },
  },
  {
    name: 'Amazon Prime Video',
    tier: 'Prime',
    priceInr: '₹299/mo',
    priceGbp: '£8.99/mo',
    priceUsd: '$8.99/mo',
    color: '#00a8e0',
    bg: 'rgba(0,168,224,0.10)',
    border: 'rgba(0,168,224,0.35)',
    url: 'https://www.primevideo.com/',
    features: {
      tamilMovies: true,
      tamilSerials: 'Limited',
      tamilDubbed: true,
      liveTV: false,
      downloads: true,
      screens: '3 screens',
      quality: '4K (select titles)',
    },
  },
  {
    name: 'SunNXT',
    tier: 'Monthly',
    priceInr: '₹50/mo',
    priceGbp: '£2.99/mo',
    priceUsd: '$3.99/mo',
    color: '#f97316',
    bg: 'rgba(249,115,22,0.10)',
    border: 'rgba(249,115,22,0.35)',
    url: 'https://www.sunnxt.com/',
    badge: 'Sun TV Fans',
    features: {
      tamilMovies: 'Sun Pictures',
      tamilSerials: 'All Sun TV serials',
      tamilDubbed: 'Some',
      liveTV: 'Sun TV live',
      downloads: true,
      screens: '1 screen',
      quality: 'HD',
    },
  },
]

const BEST_FOR = [
  { icon: '🎬', title: 'Best for Tamil Movies', desc: 'Netflix or Amazon Prime — widest Tamil & dubbed catalogue.', color: '#e50914' },
  { icon: '📺', title: 'Best for Tamil Serials', desc: 'SunNXT for Sun TV, Hotstar for Vijay TV/Star Vijay.', color: '#0073e6' },
  { icon: '💰', title: 'Best Budget Pick', desc: 'SunNXT (₹50/mo) or ZEE5 annual (₹99/mo).', color: '#8b5cf6' },
  { icon: '📱', title: 'Best for Diaspora (UK/US)', desc: 'Hotstar UK or ZEE5 Global — both carry Tamil content outside India.', color: '#f97316' },
]

function FeatureCell({ value }: { value: boolean | string }) {
  if (value === true) return <CheckCircle className="w-4 h-4 text-emerald-400 mx-auto" />
  if (value === false) return <XCircle className="w-4 h-4 text-slate-600 mx-auto" />
  return <span className="text-xs text-slate-300">{value}</span>
}

export default function OttPlansPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
          Best OTT Plans for{' '}
          <span className="text-gradient">Tamil Content</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Compare Netflix, Hotstar, ZEE5, Prime Video and SunNXT — find the best value for Tamil movies and serials in 2026.
        </p>
      </div>

      <AdUnit format="horizontal" className="mb-10 min-h-[90px]" />

      {/* Best-For cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {BEST_FOR.map((item) => (
          <div key={item.title} className="glass rounded-2xl p-5 border border-white/5">
            <div className="text-2xl mb-2">{item.icon}</div>
            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: item.color }}>{item.title}</p>
            <p className="text-sm text-slate-300">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Plan cards */}
      <h2 className="text-2xl font-bold text-white mb-6">All Plans Compared</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-12">
        {PLANS.map((plan) => (
          <div
            key={`${plan.name}-${plan.tier}`}
            className="rounded-2xl p-5 flex flex-col gap-4 relative"
            style={{ background: plan.bg, border: `1px solid ${plan.border}` }}
          >
            {plan.badge && (
              <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: plan.color, color: '#fff' }}>
                {plan.badge}
              </span>
            )}
            <div>
              <p className="text-lg font-black" style={{ color: plan.color }}>{plan.name}</p>
              <p className="text-xs text-slate-400 font-medium">{plan.tier}</p>
            </div>
            <div>
              <p className="text-2xl font-black text-white">{plan.priceInr}</p>
              {plan.priceGbp && <p className="text-xs text-slate-400">{plan.priceGbp} · {plan.priceUsd}</p>}
            </div>
            <ul className="text-xs text-slate-300 space-y-1.5 flex-1">
              <li><span className="text-slate-500">Tamil Movies:</span> {plan.features.tamilMovies === true ? '✅' : plan.features.tamilMovies === false ? '❌' : plan.features.tamilMovies}</li>
              <li><span className="text-slate-500">Tamil Serials:</span> {plan.features.tamilSerials === true ? '✅' : plan.features.tamilSerials === false ? '❌' : plan.features.tamilSerials}</li>
              <li><span className="text-slate-500">Dubbed Content:</span> {plan.features.tamilDubbed === true ? '✅' : plan.features.tamilDubbed === false ? '❌' : plan.features.tamilDubbed}</li>
              <li><span className="text-slate-500">Live TV:</span> {plan.features.liveTV === true ? '✅' : plan.features.liveTV === false ? '❌' : plan.features.liveTV}</li>
              <li><span className="text-slate-500">Downloads:</span> {plan.features.downloads ? '✅' : '❌'}</li>
              <li><span className="text-slate-500">Screens:</span> {plan.features.screens}</li>
              <li><span className="text-slate-500">Quality:</span> {plan.features.quality}</li>
            </ul>
            <a
              href={plan.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-95"
              style={{ background: plan.color, color: '#fff' }}
            >
              Subscribe <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ))}
      </div>

      <AdUnit format="rectangle" className="mb-12 min-h-[250px]" />

      {/* Detailed comparison table */}
      <h2 className="text-2xl font-bold text-white mb-6">Feature Comparison Table</h2>
      <div className="glass rounded-2xl border border-white/5 overflow-x-auto mb-12">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left px-5 py-4 text-slate-400 font-semibold w-36">Platform / Plan</th>
              <th className="text-center px-3 py-4 text-slate-400 font-semibold">Price (INR)</th>
              <th className="text-center px-3 py-4 text-slate-400 font-semibold">Tamil Movies</th>
              <th className="text-center px-3 py-4 text-slate-400 font-semibold">Serials</th>
              <th className="text-center px-3 py-4 text-slate-400 font-semibold">Dubbed</th>
              <th className="text-center px-3 py-4 text-slate-400 font-semibold">Live TV</th>
              <th className="text-center px-3 py-4 text-slate-400 font-semibold">Downloads</th>
              <th className="text-center px-3 py-4 text-slate-400 font-semibold">Screens</th>
            </tr>
          </thead>
          <tbody>
            {PLANS.map((plan, i) => (
              <tr key={`${plan.name}-${plan.tier}`} className={i % 2 === 0 ? 'bg-white/[0.02]' : ''}>
                <td className="px-5 py-3">
                  <p className="font-bold" style={{ color: plan.color }}>{plan.name}</p>
                  <p className="text-xs text-slate-500">{plan.tier}</p>
                </td>
                <td className="text-center px-3 py-3 text-white font-semibold">{plan.priceInr}</td>
                <td className="text-center px-3 py-3"><FeatureCell value={plan.features.tamilMovies} /></td>
                <td className="text-center px-3 py-3"><FeatureCell value={plan.features.tamilSerials} /></td>
                <td className="text-center px-3 py-3"><FeatureCell value={plan.features.tamilDubbed} /></td>
                <td className="text-center px-3 py-3"><FeatureCell value={plan.features.liveTV} /></td>
                <td className="text-center px-3 py-3"><FeatureCell value={plan.features.downloads} /></td>
                <td className="text-center px-3 py-3 text-slate-300 text-xs">{plan.features.screens}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FAQ */}
      <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
      <div className="space-y-4 mb-12">
        {[
          {
            q: 'Which OTT has the most Tamil movies?',
            a: 'Netflix and Amazon Prime Video have the widest selection of Tamil movies and Tamil dubbed content. Netflix regularly acquires theatrical releases like Rajinikanth and Vijay films shortly after their cinema run.',
          },
          {
            q: 'Which OTT is best for Tamil serials?',
            a: 'For Sun TV serials (Pandian Stores, Vijay TV), SunNXT is the dedicated platform. Disney+ Hotstar carries Vijay TV and Star Vijay serials. ZEE5 carries ZEE Tamil originals and Gemini TV shows.',
          },
          {
            q: 'Can I watch Tamil content outside India (UK/US)?',
            a: 'Yes. Disney+ Hotstar has a dedicated UK/US app with Tamil content. ZEE5 Global is available internationally. Netflix and Amazon Prime content libraries vary by country.',
          },
          {
            q: 'Which is the cheapest plan for Tamil content?',
            a: 'SunNXT at ₹50/month is the cheapest for Sun TV content. ZEE5 annual plan works out to ~₹99/month. Hotstar Mobile at ₹149/month gives Vijay TV content.',
          },
          {
            q: 'Do all OTT platforms have Tamil dubbed movies?',
            a: 'Netflix and Amazon Prime Video have the best Tamil dubbed collections, including popular Malayalam, Telugu, Kannada, and Hollywood films dubbed in Tamil. SunNXT and ZEE5 have a more limited dubbed catalogue.',
          },
        ].map(({ q, a }) => (
          <details key={q} className="glass rounded-xl border border-white/5 group">
            <summary className="px-5 py-4 text-white font-semibold cursor-pointer list-none flex justify-between items-center">
              {q}
              <span className="text-gold-400 text-lg">+</span>
            </summary>
            <p className="px-5 pb-4 text-slate-300 text-sm leading-relaxed">{a}</p>
          </details>
        ))}
      </div>

      <AdUnit format="horizontal" className="min-h-[90px]" />
    </div>
  )
}
