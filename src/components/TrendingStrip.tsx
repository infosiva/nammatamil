import type { Trend } from '@/lib/trending'

export default function TrendingStrip({ trends }: { trends: Trend[] }) {
  if (trends.length === 0) return null
  return (
    <section aria-label="Trending in Tamil Nadu" style={{ margin: '12px 0 0', background: '#fff', border: '1px solid #e5d9b8', borderRadius: 12, padding: '10px 14px' }}>
      <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: '#1b5e43' }}>
        தமிழகத்தில் டிரெண்டிங் · Trending in Tamil Nadu now · Google Trends
      </p>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {trends.map(t => (
          <li key={t.term}>
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(t.term)}`}
              className="nt-pill"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 44, padding: '0 12px', borderRadius: 999, background: '#eef6f1', border: '1px solid #cfe5d8', color: '#1a1a1a', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
            >
              {t.term}
              {t.traffic && <span style={{ fontSize: 11, fontWeight: 700, color: '#1b5e43' }}>{t.traffic}</span>}
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
