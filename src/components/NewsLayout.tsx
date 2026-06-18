'use client'
import { useState } from 'react'
import { CATEGORIES, CATEGORY_ICONS, BREAKING_TICKERS, timeAgo, type Category, type NewsItem } from '@/lib/news'

const CATEGORY_IMG: Record<string, string> = {
  'அரசியல்':       'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=75&auto=format',
  'சினிமா':        'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=75&auto=format',
  'விளையாட்டு':    'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=75&auto=format',
  'தமிழகம்':       'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800&q=75&auto=format',
  'உலகம்':         'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=75&auto=format',
  'தொழில்நுட்பம்': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=75&auto=format',
  'வாழ்க்கை':     'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=75&auto=format',
  'default':        'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=75&auto=format',
}

function getImg(item: NewsItem) {
  return item.imageUrl || CATEGORY_IMG[item.category] || CATEGORY_IMG['default']
}

// ─── Breaking ticker ──────────────────────────────────────────────────────────
function BreakingTicker() {
  const doubled = [...BREAKING_TICKERS, ...BREAKING_TICKERS]
  return (
    <div style={{ background: '#dc2626', overflow: 'hidden', height: 34, display: 'flex', alignItems: 'center' }}>
      <span style={{
        flexShrink: 0, padding: '0 14px',
        fontSize: 10, fontWeight: 900, letterSpacing: '1.5px', textTransform: 'uppercase',
        color: '#fff', background: 'rgba(0,0,0,0.25)', height: '100%',
        display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
      }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', display: 'inline-block', animation: 'pulse 1.4s ease-in-out infinite' }} />
        LIVE
      </span>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div className="ticker-track" style={{ display: 'inline-flex' }}>
          {doubled.map((t, i) => (
            <span key={i} style={{ fontSize: 12, fontWeight: 600, color: '#fff', padding: '0 28px', whiteSpace: 'nowrap', fontFamily: "'Noto Sans Tamil', sans-serif" }}>
              {t} &nbsp;•
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar() {
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: '#fff',
      borderBottom: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      height: 56, display: 'flex', alignItems: 'center',
      padding: '0 20px', justifyContent: 'space-between',
    }}>
      <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
        <span style={{
          width: 26, height: 26, borderRadius: 7,
          background: 'linear-gradient(135deg, #991b1b, #dc2626)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="5" fill="white" />
            <g stroke="white" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="1" x2="12" y2="4" />
              <line x1="12" y1="20" x2="12" y2="23" />
              <line x1="1" y1="12" x2="4" y2="12" />
              <line x1="20" y1="12" x2="23" y2="12" />
              <line x1="4.2" y1="4.2" x2="6.3" y2="6.3" />
              <line x1="17.7" y1="17.7" x2="19.8" y2="19.8" />
              <line x1="4.2" y1="19.8" x2="6.3" y2="17.7" />
              <line x1="17.7" y1="6.3" x2="19.8" y2="4.2" />
            </g>
          </svg>
        </span>
        <span style={{ fontFamily: "'Noto Serif Tamil', serif", fontWeight: 900, fontSize: 20, color: '#0f172a' }}>
          நம்ம<span style={{ color: '#dc2626' }}>Tamil</span>
        </span>
      </a>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic', display: 'none' }} className="hidden md:block">
          உங்கள் மொழியில் உலக செய்திகள்
        </span>
        <span style={{
          fontSize: 11, fontWeight: 700, color: '#16a34a', background: '#f0fdf4',
          border: '1px solid #bbf7d0', borderRadius: 20, padding: '3px 10px',
        }}>
          🟢 LIVE · {new Date().toLocaleDateString('ta-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </div>
    </nav>
  )
}

// ─── Hero grid ────────────────────────────────────────────────────────────────
function HeroGrid({ featured, sidebar }: { featured: NewsItem; sidebar: NewsItem[] }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 340px', gap: 1,
      background: '#e2e8f0', borderBottom: '1px solid #e2e8f0',
    }} className="hero-grid">
      {/* Featured */}
      <a href={featured.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block', position: 'relative', overflow: 'hidden', minHeight: 400 }}>
        <img src={getImg(featured)} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} loading="eager" />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '28px 24px' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            {featured.breaking && (
              <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', color: '#fff', background: '#dc2626', borderRadius: 4, padding: '3px 8px' }}>BREAKING</span>
            )}
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.15)', borderRadius: 4, padding: '3px 8px', fontFamily: "'Noto Sans Tamil', sans-serif" }}>
              {featured.category}
            </span>
          </div>
          <h2 style={{ fontFamily: "'Noto Serif Tamil', serif", fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 10px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {featured.title}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#fca5a5' }}>{featured.source}</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>{timeAgo(featured.publishedAt)}</span>
          </div>
        </div>
      </a>

      {/* Sidebar */}
      <div style={{ background: '#fff', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {sidebar.slice(0, 3).map((item) => (
          <a key={item.id} href={item.sourceUrl} target="_blank" rel="noopener noreferrer" style={{
            textDecoration: 'none', display: 'flex', gap: 12, padding: '14px 16px',
            background: '#fff', borderBottom: '1px solid #f1f5f9',
            transition: 'background 150ms',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
          onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
          >
            <img src={getImg(item)} alt="" style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} loading="lazy" />
            <div style={{ flex: 1, minWidth: 0 }}>
              {item.trending && (
                <span style={{ fontSize: 9, fontWeight: 800, color: '#dc2626', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Trending</span>
              )}
              <p style={{ fontFamily: "'Noto Sans Tamil', sans-serif", fontSize: 13, fontWeight: 700, color: '#0f172a', margin: '2px 0 6px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {item.title}
              </p>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>{item.source} · {timeAgo(item.publishedAt)}</span>
            </div>
          </a>
        ))}
        {/* Source attribution */}
        <div style={{ padding: '12px 16px', marginTop: 'auto', borderTop: '1px solid #f1f5f9', background: '#f8fafc' }}>
          <p style={{ fontSize: 10, color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
            செய்திகள்: Dinamalar · The Hindu Tamil · Vikatan
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Article card ─────────────────────────────────────────────────────────────
function ArticleCard({ item }: { item: NewsItem }) {
  return (
    <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', transition: 'box-shadow 150ms, transform 150ms', cursor: 'pointer' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}
    >
      <div style={{ aspectRatio: '16/9', overflow: 'hidden' }}>
        <img src={getImg(item)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 300ms' }} loading="lazy"
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        />
      </div>
      <div style={{ padding: '12px 14px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', background: '#fef2f2', borderRadius: 4, padding: '2px 7px', alignSelf: 'flex-start', fontFamily: "'Noto Sans Tamil', sans-serif" }}>
          {item.category}
        </span>
        <p style={{ fontFamily: "'Noto Sans Tamil', sans-serif", fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {item.title}
        </p>
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>{item.source}</span>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>{timeAgo(item.publishedAt)}</span>
        </div>
      </div>
    </a>
  )
}

// ─── Main layout ──────────────────────────────────────────────────────────────
export default function NewsLayout({ articles }: { articles: NewsItem[] }) {
  const [activeCategory, setActiveCategory] = useState<Category>('அனைத்தும்')

  const filtered = activeCategory === 'அனைத்தும்'
    ? articles
    : articles.filter(n => n.category === activeCategory)

  const featured = filtered[0]
  const sidebar = filtered.slice(1, 4)
  const grid = filtered.slice(4)

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', fontFamily: "'Noto Sans Tamil', sans-serif" }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .ticker-track { animation: ticker 30s linear infinite; }
        @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        .hero-grid { grid-template-columns: 1fr 340px; }
        @media(max-width:768px){ .hero-grid{ grid-template-columns:1fr !important; } .hero-sidebar{display:none!important;} }
        @media(max-width:640px){ .article-grid{ grid-template-columns:1fr !important; } }
        @media(min-width:641px) and (max-width:900px){ .article-grid{ grid-template-columns:repeat(2,1fr) !important; } }
      `}</style>

      <BreakingTicker />
      <Navbar />

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px 60px' }}>
        {/* Stats bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '10px 0', borderBottom: '1px solid #e2e8f0', marginBottom: 20 }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>📰 {articles.length} செய்திகள்</span>
          <span style={{ fontSize: 12, color: '#64748b' }}>🕐 ஒவ்வொரு 10 நிமிடமும் புதுப்பிக்கப்படும்</span>
        </div>

        {/* Category tabs */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 0 16px', scrollbarWidth: 'none' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                flexShrink: 0, padding: '6px 14px', borderRadius: 20,
                border: activeCategory === cat ? 'none' : '1px solid #e2e8f0',
                background: activeCategory === cat ? '#dc2626' : '#fff',
                color: activeCategory === cat ? '#fff' : '#374151',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: "'Noto Sans Tamil', sans-serif",
                transition: 'background 120ms, color 120ms',
              }}
            >
              {CATEGORY_ICONS[cat]} {cat}
            </button>
          ))}
        </div>

        {/* Hero section */}
        {featured && (
          <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0', marginBottom: 24 }}>
            <HeroGrid featured={featured} sidebar={sidebar} />
          </div>
        )}

        {/* Article grid */}
        {grid.length > 0 && (
          <>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 16px' }}>
              மேலும் செய்திகள்
            </h3>
            <div className="article-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {grid.map(item => (
                <ArticleCard key={item.id} item={item} />
              ))}
            </div>
          </>
        )}

        {articles.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8', fontSize: 15 }}>
            செய்திகள் ஏற்றுகிறது...
          </div>
        )}
      </main>
    </div>
  )
}
