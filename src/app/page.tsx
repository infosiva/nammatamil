'use client'
import { useState, useEffect } from 'react'
import { SAMPLE_HEADLINES, CATEGORIES, CATEGORY_ICONS, BREAKING_TICKERS, timeAgo, type Category, type NewsItem } from '@/lib/news'

const T = {
  bg: '#0a0f0a',
  surface: '#111811',
  surface2: '#1a201a',
  border: 'rgba(255,255,255,0.07)',
  border2: 'rgba(255,255,255,0.13)',
  text: '#f0ede6',
  text2: 'rgba(240,237,230,0.55)',
  text3: 'rgba(240,237,230,0.28)',
  accent: '#f97316',
  accent2: '#ea580c',
  red: '#ef4444',
}

// Category-specific Unsplash thumbnail images (free, no API key)
const CATEGORY_IMG: Record<string, string> = {
  'அரசியல்':       'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=600&q=70&auto=format',
  'சினிமா':        'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&q=70&auto=format',
  'விளையாட்டு':    'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=600&q=70&auto=format',
  'தமிழகம்':       'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=600&q=70&auto=format',
  'உலகம்':         'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=70&auto=format',
  'தொழில்நுட்பம்': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=70&auto=format',
  'வாழ்க்கை':     'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=70&auto=format',
  'default':        'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&q=70&auto=format',
}

// ─── Breaking ticker ───────────────────────────────────────────
function BreakingTicker() {
  const doubled = [...BREAKING_TICKERS, ...BREAKING_TICKERS]
  return (
    <div style={{ background: T.red, overflow: 'hidden', height: 32, display: 'flex', alignItems: 'center' }}>
      <span style={{
        flexShrink: 0, padding: '0 12px',
        fontSize: 10, fontWeight: 900, letterSpacing: '1.5px', textTransform: 'uppercase',
        color: '#fff', background: 'rgba(0,0,0,0.35)', height: '100%',
        display: 'flex', alignItems: 'center', whiteSpace: 'nowrap',
      }}>
        🔴 LIVE
      </span>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div className="ticker-track" style={{ display: 'inline-flex', gap: 0 }}>
          {doubled.map((t, i) => (
            <span key={i} style={{ fontSize: 11, fontWeight: 600, color: '#fff', padding: '0 28px', whiteSpace: 'nowrap', fontFamily: "'Noto Sans Tamil', sans-serif" }}>
              {t} &nbsp;•
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Navbar ────────────────────────────────────────────────────
function Navbar() {
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(10,15,10,0.92)', backdropFilter: 'blur(20px)',
      borderBottom: `1px solid ${T.border}`,
      height: 52, display: 'flex', alignItems: 'center',
      padding: '0 16px', gap: 16, justifyContent: 'space-between',
    }}>
      {/* Logo */}
      <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
        <span style={{ fontSize: 20 }}>🌿</span>
        <span style={{ fontFamily: "'Noto Serif Tamil', serif", fontWeight: 800, fontSize: 18, color: T.text }}>
          நம்ம<span style={{ color: T.accent }}>Tamil</span>
        </span>
      </a>

      {/* Center — tagline desktop */}
      <span style={{ fontSize: 11, color: T.text3, display: 'none', fontStyle: 'italic' }} className="hidden md:block">
        உங்கள் மொழியில் உலக செய்திகள்
      </span>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Live</span>
        </div>
        <span style={{ color: T.border2 }}>|</span>
        <span style={{ fontSize: 11, color: T.text2 }}>
          {new Date().toLocaleDateString('ta-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </div>
    </nav>
  )
}

// ─── Category tabs ──────────────────────────────────────────────
function CategoryTabs({ active, onChange }: { active: Category; onChange: (c: Category) => void }) {
  return (
    <div style={{
      borderBottom: `1px solid ${T.border}`,
      background: T.surface,
      overflowX: 'auto',
      WebkitOverflowScrolling: 'touch',
    }}>
      <div style={{ display: 'flex', padding: '0 12px', minWidth: 'max-content' }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            style={{
              padding: '10px 14px',
              fontSize: 12,
              fontWeight: active === cat ? 700 : 500,
              color: active === cat ? T.accent : T.text2,
              background: 'none',
              border: 'none',
              borderBottom: active === cat ? `2px solid ${T.accent}` : '2px solid transparent',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
              fontFamily: "'Noto Sans Tamil', sans-serif",
              cursor: 'pointer',
            }}
          >
            {CATEGORY_ICONS[cat]} {cat}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Hero card (featured story) ────────────────────────────────
function HeroCard({ item }: { item: NewsItem }) {
  return (
    <div
      className="news-card"
      style={{
        borderRadius: 12, overflow: 'hidden',
        border: `1px solid ${T.border}`,
        background: T.surface,
        cursor: 'pointer',
      }}
    >
      {/* Thumbnail */}
      <div style={{
        height: 200, position: 'relative', overflow: 'hidden',
        background: '#1a2f1a',
      }}>
        <img
          src={item.imageUrl || CATEGORY_IMG[item.category] || CATEGORY_IMG.default}
          alt={item.titleEn}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)' }} />
        <span style={{ position: 'absolute', bottom: 10, right: 10, fontSize: 28, opacity: 0.85 }}>{CATEGORY_ICONS[item.category]}</span>
        {item.breaking && (
          <span style={{
            position: 'absolute', top: 10, left: 10,
            background: T.red, color: '#fff',
            fontSize: 9, fontWeight: 900, padding: '3px 8px', borderRadius: 4,
            textTransform: 'uppercase', letterSpacing: '1px',
          }}>
            🔴 Breaking
          </span>
        )}
        {item.trending && !item.breaking && (
          <span style={{
            position: 'absolute', top: 10, left: 10,
            background: T.accent, color: '#000',
            fontSize: 9, fontWeight: 900, padding: '3px 8px', borderRadius: 4,
            letterSpacing: '0.5px',
          }}>
            🔥 Trending
          </span>
        )}
        <span style={{
          position: 'absolute', top: 10, right: 10,
          background: 'rgba(0,0,0,0.6)', color: T.text2,
          fontSize: 10, padding: '3px 8px', borderRadius: 4,
        }}>
          {item.category}
        </span>
      </div>
      <div style={{ padding: '14px 16px 16px' }}>
        <h2 style={{
          fontSize: 16, fontWeight: 800, lineHeight: 1.45,
          color: T.text, margin: '0 0 8px',
          fontFamily: "'Noto Serif Tamil', serif",
        }}>
          {item.title}
        </h2>
        <p style={{ fontSize: 12, color: T.text2, lineHeight: 1.6, margin: '0 0 12px', fontFamily: "'Noto Sans Tamil', sans-serif" }}>
          {item.summary}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 10, color: T.accent, fontWeight: 600 }}>{item.source}</span>
          <span style={{ fontSize: 10, color: T.text3 }}>{timeAgo(item.publishedAt)}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Compact news card ─────────────────────────────────────────
function CompactCard({ item, index }: { item: NewsItem; index: number }) {
  return (
    <div
      className="news-card"
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '12px 14px',
        border: `1px solid ${T.border}`,
        borderRadius: 10,
        background: T.surface,
        cursor: 'pointer',
        animation: `fadeUp 0.3s ease-out ${index * 0.05}s both`,
      }}
    >
      {/* Thumbnail */}
      <div style={{ width: 64, height: 64, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: '#1a2f1a', position: 'relative' }}>
        <img
          src={item.imageUrl || CATEGORY_IMG[item.category] || CATEGORY_IMG.default}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 18 }}>{CATEGORY_ICONS[item.category]}</span>
        <span style={{ position: 'absolute', bottom: 2, right: 3, fontSize: 8, fontWeight: 900, color: 'rgba(255,255,255,0.5)', fontVariantNumeric: 'tabular-nums' }}>
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
          {item.breaking && (
            <span style={{ fontSize: 8, fontWeight: 900, color: T.red, border: `1px solid ${T.red}`, padding: '1px 5px', borderRadius: 3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Breaking</span>
          )}
          {item.trending && !item.breaking && (
            <span style={{ fontSize: 8, fontWeight: 900, color: T.accent, border: `1px solid ${T.accent}`, padding: '1px 5px', borderRadius: 3 }}>🔥 Trending</span>
          )}
          <span style={{ fontSize: 9, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.category}</span>
        </div>
        <h3 style={{
          fontSize: 13, fontWeight: 700, lineHeight: 1.45,
          color: T.text, margin: '0 0 6px',
          fontFamily: "'Noto Serif Tamil', serif",
        }}>
          {item.title}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, color: T.accent, fontWeight: 600 }}>{item.source}</span>
          <span style={{ color: T.text3, fontSize: 10 }}>·</span>
          <span style={{ fontSize: 10, color: T.text3 }}>{timeAgo(item.publishedAt)}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Sidebar: trending + sources ──────────────────────────────
function Sidebar({ items }: { items: NewsItem[] }) {
  const trending = items.filter(i => i.trending || i.breaking).slice(0, 4)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Trending */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{
          padding: '10px 14px', borderBottom: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ fontSize: 14 }}>🔥</span>
          <span style={{ fontSize: 11, fontWeight: 800, color: T.text, textTransform: 'uppercase', letterSpacing: '1px' }}>
            Trending இப்போது
          </span>
        </div>
        {trending.map((item, i) => (
          <div key={item.id} style={{
            padding: '10px 14px',
            borderBottom: i < trending.length - 1 ? `1px solid ${T.border}` : 'none',
            cursor: 'pointer',
          }} className="news-card">
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: T.accent, minWidth: 20 }}>{i + 1}</span>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: T.text, margin: '0 0 4px', lineHeight: 1.4, fontFamily: "'Noto Serif Tamil', serif" }}>
                  {item.title}
                </p>
                <span style={{ fontSize: 9, color: T.text3 }}>{timeAgo(item.publishedAt)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sources */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: `1px solid ${T.border}` }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: T.text, textTransform: 'uppercase', letterSpacing: '1px' }}>
            📰 ஆதாரங்கள்
          </span>
        </div>
        {['Dinamalar', 'Vikatan', 'The Hindu Tamil', 'Dinamani', 'Puthiyathalaimurai'].map(src => (
          <div key={src} style={{
            padding: '8px 14px', fontSize: 12, color: T.text2,
            borderBottom: `1px solid ${T.border}`,
            display: 'flex', alignItems: 'center', gap: 8,
            fontFamily: "'Noto Sans Tamil', sans-serif",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.accent, flexShrink: 0 }} />
            {src}
          </div>
        ))}
      </div>

      {/* NammaBot promo */}
      <div style={{
        background: `linear-gradient(135deg, rgba(249,115,22,0.12) 0%, rgba(234,88,12,0.06) 100%)`,
        border: `1px solid rgba(249,115,22,0.3)`,
        borderRadius: 10, padding: '14px',
      }}>
        <div style={{ fontSize: 20, marginBottom: 6 }}>🤖</div>
        <p style={{ fontSize: 12, fontWeight: 700, color: T.text, margin: '0 0 6px', fontFamily: "'Noto Serif Tamil', serif" }}>
          NammaBot — AI செய்தி உதவியாளர்
        </p>
        <p style={{ fontSize: 11, color: T.text2, margin: '0 0 10px', lineHeight: 1.5, fontFamily: "'Noto Sans Tamil', sans-serif" }}>
          செய்திகள் பற்றிய கேள்விகளை தமிழிலேயே கேளுங்கள்!
        </p>
        <span style={{ fontSize: 10, color: T.accent, fontWeight: 600 }}>👇 கீழே உள்ள chatbot பயன்படுத்துங்கள்</span>
      </div>
    </div>
  )
}

// ─── Stats strip ───────────────────────────────────────────────
function StatsStrip() {
  return (
    <div style={{
      background: T.surface2, borderBottom: `1px solid ${T.border}`,
      padding: '8px 16px', display: 'flex', gap: 24, overflowX: 'auto',
    }}>
      {[
        { label: 'தமிழக செய்திகள்', val: '60+', icon: '🏛' },
        { label: 'மூல தளங்கள்', val: '12', icon: '📰' },
        { label: 'புதுப்பிப்பு', val: 'ஒவ்வொரு மணியும்', icon: '🔄' },
        { label: 'வாசகர்கள்', val: '50k+', icon: '👥' },
      ].map(s => (
        <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 12 }}>{s.icon}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: T.accent }}>{s.val}</span>
          <span style={{ fontSize: 10, color: T.text3, fontFamily: "'Noto Sans Tamil', sans-serif" }}>{s.label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────
export default function NewsPage() {
  const [activeCategory, setActiveCategory] = useState<Category>('அனைத்தும்')
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const filtered = activeCategory === 'அனைத்தும்'
    ? SAMPLE_HEADLINES
    : SAMPLE_HEADLINES.filter(n => n.category === activeCategory)

  const hero = filtered[0]
  const rest = filtered.slice(1)

  return (
    <div style={{ background: T.bg, minHeight: '100vh', color: T.text }}>
      <BreakingTicker />
      <Navbar />
      <StatsStrip />
      <CategoryTabs active={activeCategory} onChange={setActiveCategory} />

      {/* Main layout */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 12px 48px', display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>

        {/* Mobile: stack everything */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Hero + grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
            {hero && <HeroCard item={hero} />}

            {/* Rest as compact cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {rest.map((item, i) => (
                <CompactCard key={item.id} item={item} index={i} />
              ))}
              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: T.text3 }}>
                  <span style={{ fontSize: 32 }}>📭</span>
                  <p style={{ marginTop: 8, fontSize: 13, fontFamily: "'Noto Sans Tamil', sans-serif" }}>இந்த வகையில் இப்போது செய்திகள் இல்லை</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar below on mobile */}
          <Sidebar items={SAMPLE_HEADLINES} />
        </div>
      </div>

      {/* Desktop: inject CSS grid override via style tag */}
      <style>{`
        @media (min-width: 1024px) {
          .news-layout {
            display: grid !important;
            grid-template-columns: 1fr 320px !important;
            gap: 20px !important;
            align-items: start !important;
          }
          .news-main-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 12px !important;
          }
          .hero-full { grid-column: 1 / -1; }
        }
      `}</style>
    </div>
  )
}
