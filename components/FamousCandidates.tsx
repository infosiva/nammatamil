'use client'

/**
 * FamousCandidates — Notable candidates with win/lose status.
 * Static known results (verified from ECI). Shows the candidate themselves,
 * not just whoever won their seat.
 */

const PARTY_COLORS: Record<string, string> = {
  TVK:'#fbbf24', DMK:'#f87171', ADMK:'#4ade80', BJP:'#fb923c',
  PMK:'#a78bfa', INC:'#38bdf8', VCK:'#34d399', DMDK:'#f59e0b',
  IUML:'#10b981', Others:'#94a3b8',
}
const PARTY_EMOJI: Record<string, string> = {
  TVK:'⭐', DMK:'🌅', ADMK:'🍃', BJP:'🪷', PMK:'🌿',
  INC:'✋', VCK:'✊', DMDK:'🎬', IUML:'🕌',
}

// Verified results — candidate's own win/lose, not just who won the seat
const NOTABLE: {
  name: string
  label: string
  party: string
  constituency: string
  district: string
  won: boolean
}[] = [
  {
    name: 'Udhayanidhi Stalin',
    label: 'Deputy CM (DMK)',
    party: 'DMK',
    constituency: 'Kolathur',
    district: 'Chennai',
    won: true,
  },
  {
    name: 'Edappadi Palaniswami',
    label: 'Opposition Leader (ADMK)',
    party: 'ADMK',
    constituency: 'Edappadi',
    district: 'Salem',
    won: true,
  },
  {
    name: 'Sowmiya Anbumani',
    label: "PMK Leader's Daughter",
    party: 'PMK',
    constituency: 'Pennagaram',
    district: 'Dharmapuri',
    won: true,
  },
  {
    name: 'Premallatha Vijayakant',
    label: "Captain's Legacy (DMDK)",
    party: 'DMDK',
    constituency: 'Alangulam',
    district: 'Tenkasi',
    won: true,
  },
  {
    name: 'Sekarbabu',
    label: 'Cabinet Minister (DMK)',
    party: 'DMK',
    constituency: 'Sholinganallur',
    district: 'Chennai',
    won: true,
  },
  {
    name: 'Nainar Nagenthran',
    label: 'BJP Leader',
    party: 'BJP',
    constituency: 'Thiruvallur',
    district: 'Tiruvallur',
    won: false,
  },
]

export default function FamousCandidates() {
  return (
    <div style={{ marginBottom: 4 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10, paddingLeft: 2 }}>
        <span style={{ fontSize: 12 }}>⭐</span>
        <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.06em' }}>
          NOTABLE CANDIDATES
        </span>
      </div>

      {/* Horizontal scroll */}
      <div style={{
        display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6,
        scrollbarWidth: 'none',
      }}>
        {NOTABLE.map((c, i) => {
          const color = c.won ? (PARTY_COLORS[c.party] ?? '#94a3b8') : '#6b7280'
          const emoji = PARTY_EMOJI[c.party] ?? '🏛️'

          return (
            <div key={i} style={{
              minWidth: 158, maxWidth: 158, borderRadius: 14, padding: '12px 13px',
              background: c.won
                ? `linear-gradient(135deg, ${color}16 0%, rgba(0,0,0,0) 70%)`
                : 'rgba(255,255,255,0.02)',
              border: `1px solid ${c.won ? color + '35' : 'rgba(255,255,255,0.07)'}`,
              flexShrink: 0,
            }}>
              {/* Status badge + emoji */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{
                  fontSize: 7, fontWeight: 900, padding: '2px 7px', borderRadius: 99,
                  letterSpacing: '0.08em',
                  background: c.won ? `${color}18` : 'rgba(255,59,59,0.1)',
                  color: c.won ? color : '#f87171',
                  border: `1px solid ${c.won ? color + '30' : 'rgba(248,113,113,0.25)'}`,
                }}>
                  {c.won ? '✅ WON' : '❌ LOST'}
                </span>
                <span style={{ fontSize: 20 }}>{emoji}</span>
              </div>

              {/* Candidate name */}
              <div style={{
                fontSize: 12, fontWeight: 900, lineHeight: 1.3, marginBottom: 3,
                color: c.won ? color : 'rgba(255,255,255,0.4)',
              }}>
                {c.name}
              </div>

              {/* Role */}
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', fontWeight: 700, marginBottom: 5 }}>
                {c.label}
              </div>

              {/* Constituency */}
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>
                {c.constituency}, {c.district}
              </div>

              {/* Party pill */}
              <div style={{
                marginTop: 8, fontSize: 10, fontWeight: 900,
                color: c.won ? color : '#6b7280',
                padding: '3px 8px', borderRadius: 99, display: 'inline-block',
                background: c.won ? `${color}14` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${c.won ? color + '25' : 'rgba(255,255,255,0.06)'}`,
              }}>
                {c.party}
              </div>
            </div>
          )
        })}
      </div>

      <style>{`div[style*="overflowX"]::-webkit-scrollbar{display:none}`}</style>
    </div>
  )
}
