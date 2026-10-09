import type { SeatResult } from '@/lib/election'

const fmt = (n: number) => n.toLocaleString('en-IN')
// initials of a long party name (Tamilaga Vettri Kazhagam -> TVK); short names pass through
const abbr = (p: string) => (p.split(' ').length > 2 ? p.split(' ').map(w => w[0]).join('').toUpperCase() : p)

function Seat({ s }: { s: SeatResult }) {
  const [lead, second] = s.candidates
  const done = lead.status === 'won'
  const top = s.candidates.slice(0, 3)
  return (
    <a
      href={s.sourceUrl}
      className="nt-tile"
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: 'none', flex: '1 1 300px', background: '#fff', border: '1px solid #e5d9b8', borderRadius: 10, padding: '14px 16px', display: 'block', minHeight: 44 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
        <strong style={{ fontSize: 15, color: '#1a1a1a', textTransform: 'capitalize' }}>{s.seat.toLowerCase()}</strong>
        <span style={{ fontSize: 10, fontWeight: 800, color: done ? '#15803d' : '#237a57', letterSpacing: '0.8px' }}>
          {done ? 'RESULT' : `LIVE${s.round ? ` · ROUND ${s.round}` : ''}`}
        </span>
      </div>
      <p style={{ margin: '8px 0 2px', fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>
        {lead.name} <span style={{ fontWeight: 500, color: '#4b4b4b' }}>· {abbr(lead.party)}</span>
      </p>
      <p style={{ margin: 0, fontSize: 12, color: '#4b4b4b' }}>
        {done ? 'Won' : 'Leading'} by <b>{fmt(Math.abs(lead.margin))}</b> votes{second ? ` over ${second.name}` : ''}
      </p>
      <div style={{ marginTop: 10, display: 'grid', gap: 4 }}>
        {top.map(c => (
          <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#4b4b4b' }}>
            <span>{c.name} ({abbr(c.party)})</span>
            <b style={{ color: '#1a1a1a' }}>{fmt(c.votes)}</b>
          </div>
        ))}
      </div>
    </a>
  )
}

export default function ElectionCard({ seats }: { seats: SeatResult[] }) {
  if (seats.length === 0) return null
  return (
    <section aria-label="By-election results" style={{ maxWidth: 1200, margin: '16px 0 0', padding: 0 }}>
      <div style={{ background: '#eef6f1', border: '1px solid #cfe5d8', borderRadius: 12, padding: 14 }}>
        <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: '#1b5e43' }}>
          இடைத்தேர்தல் · By-election · Source: Election Commission of India · provisional until Form-20
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {seats.map(s => <Seat key={s.seat} s={s} />)}
        </div>
      </div>
    </section>
  )
}
