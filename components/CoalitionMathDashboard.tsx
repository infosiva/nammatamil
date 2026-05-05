'use client'

/**
 * CoalitionMathDashboard — Hung Parliament Coalition Scenarios
 *
 * Shows exactly what combinations are needed to form a government
 * when no party has the 118-seat majority.
 *
 * Final results: TVK 107 · DMK 60 · AIADMK 47 · BJP+Others 20
 * Total: 234 · Majority: 118
 */

const MAJORITY = 118
const TOTAL    = 234

// Final results (post-counting)
const RESULTS = {
  TVK:    { seats: 107, color: '#fbbf24', leader: 'Vijay (Thalapathy)',  role: 'Largest Party',     dim: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.30)' },
  DMK:    { seats: 60,  color: '#f87171', leader: 'M.K. Stalin',         role: 'Incumbent Govt',    dim: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.22)' },
  AIADMK: { seats: 47,  color: '#4ade80', leader: 'E. Palaniswami',      role: 'Main Opposition',   dim: 'rgba(74,222,128,0.06)',  border: 'rgba(74,222,128,0.18)' },
  BJP:    { seats: 8,   color: '#fb923c', leader: 'K. Annamalai',        role: 'National Alliance', dim: 'rgba(251,146,60,0.07)',  border: 'rgba(251,146,60,0.20)' },
  Others: { seats: 12,  color: '#94a3b8', leader: 'Independents + small', role: 'Swing votes',      dim: 'rgba(148,163,184,0.06)', border: 'rgba(148,163,184,0.15)' },
}

// Coalition scenarios with political context
const SCENARIOS = [
  {
    id: 'tvk-aiadmk',
    label: 'TVK + AIADMK',
    labelTamil: 'தவக + அதிமுக',
    parties: ['TVK', 'AIADMK'],
    cm: 'Vijay (Thalapathy)',
    seats: 107 + 47,
    likelihood: 72,
    tag: 'MOST LIKELY',
    tagColor: '#4ade80',
    desc: 'Ideological rivals who both benefit from DMK exit. AIADMK secures opposition space while TVK leads.',
    analysis: 'TVK needs 11 more seats. AIADMK\'s 47 gives a comfortable majority of 154 — well above 118. EPS could negotiate Deputy CM or Speaker post.',
    dealBreaker: 'EPS publicly opposes "actor politics." TVK must offer significant portfolios.',
  },
  {
    id: 'tvk-others',
    label: 'TVK + Others',
    labelTamil: 'தவக + பிறர்',
    parties: ['TVK', 'Others'],
    cm: 'Vijay (Thalapathy)',
    seats: 107 + 12,
    likelihood: 18,
    tag: 'MINORITY',
    tagColor: '#fbbf24',
    desc: 'TVK + independents + small parties to reach 119. Very fragile, confidence vote risk.',
    analysis: 'TVK 107 + Others 12 = 119. Just 1 seat above majority. A no-confidence motion could topple this govt at any time.',
    dealBreaker: 'Extremely unstable. One defection ends the government.',
  },
  {
    id: 'dmk-aiadmk',
    label: 'DMK + AIADMK',
    labelTamil: 'திமுக + அதிமுக',
    parties: ['DMK', 'AIADMK'],
    cm: 'M.K. Stalin',
    seats: 60 + 47,
    likelihood: 8,
    tag: 'UNLIKELY',
    tagColor: '#94a3b8',
    desc: 'Arch rivals who traded power for decades. Stalin continues as CM. Unprecedented alliance.',
    analysis: 'DMK+AIADMK = 107, still 11 short of majority. Would need additional parties. Historical animosity makes this very hard to sustain.',
    dealBreaker: 'Short of majority even together. Need more allies. Deep political rivalry.',
  },
  {
    id: 'presidents-rule',
    label: 'President\'s Rule',
    labelTamil: 'குடியரசுத் தலைவர் ஆட்சி',
    parties: [],
    cm: 'Governor (Central)',
    seats: 0,
    likelihood: 4,
    tag: 'LAST RESORT',
    tagColor: '#ef4444',
    desc: 'If no coalition is formed within deadline. Centre appoints Governor to run state.',
    analysis: 'Article 356 invoked if no govt formed within 2–3 weeks. Fresh elections possible within 6 months.',
    dealBreaker: 'Tamil Nadu has never had President\'s Rule since 1991. Courts often stayed it.',
  },
]

// Mini seat arc for a coalition
function CoalitionArc({ parties, total, majority }: {
  parties: { name: string; seats: number; color: string }[]
  total: number
  majority: number
}) {
  const cx = 70, cy = 60, r = 50, inner = 30
  let angle = -180
  const segs: { path: string; color: string }[] = []

  for (const p of parties) {
    const sweep = (p.seats / total) * 180
    if (sweep < 0.5) { angle += sweep; continue }
    const sR = (angle * Math.PI) / 180
    const eR = ((angle + sweep) * Math.PI) / 180
    const x1 = cx + r * Math.cos(sR), y1 = cy + r * Math.sin(sR)
    const x2 = cx + r * Math.cos(eR), y2 = cy + r * Math.sin(eR)
    const ix1 = cx + inner * Math.cos(sR), iy1 = cy + inner * Math.sin(sR)
    const ix2 = cx + inner * Math.cos(eR), iy2 = cy + inner * Math.sin(eR)
    const large = sweep > 90 ? 1 : 0
    segs.push({
      path: `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} L ${ix2.toFixed(1)} ${iy2.toFixed(1)} A ${inner} ${inner} 0 ${large} 0 ${ix1.toFixed(1)} ${iy1.toFixed(1)} Z`,
      color: p.color,
    })
    angle += sweep
  }

  // Remainder
  if (angle < 0) {
    const sR = (angle * Math.PI) / 180
    const x1 = cx + r * Math.cos(sR), y1 = cy + r * Math.sin(sR)
    const x2 = cx + r, y2 = cy
    const ix1 = cx + inner * Math.cos(sR), iy1 = cy + inner * Math.sin(sR)
    const ix2 = cx + inner, iy2 = cy
    const large = (0 - angle) > 90 ? 1 : 0
    segs.push({
      path: `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} L ${ix2.toFixed(1)} ${iy2.toFixed(1)} A ${inner} ${inner} 0 ${large} 0 ${ix1.toFixed(1)} ${iy1.toFixed(1)} Z`,
      color: 'rgba(255,255,255,0.05)',
    })
  }

  const majAngle = -180 + (majority / total) * 180
  const majRad = (majAngle * Math.PI) / 180
  const mx1 = cx + (inner - 4) * Math.cos(majRad)
  const my1 = cy + (inner - 4) * Math.sin(majRad)
  const mx2 = cx + (r + 6) * Math.cos(majRad)
  const my2 = cy + (r + 6) * Math.sin(majRad)

  const coalitionTotal = parties.reduce((s, p) => s + p.seats, 0)

  return (
    <svg viewBox="0 0 140 70" style={{ width: '100%', maxWidth: 160 }}>
      {segs.map((s, i) => (
        <path key={i} d={s.path} fill={s.color}
          style={s.color !== 'rgba(255,255,255,0.05)' ? { filter: `drop-shadow(0 0 4px ${s.color}66)` } : {}}
        />
      ))}
      <path d={`M ${cx - inner} ${cy} A ${inner} ${inner} 0 0 1 ${cx + inner} ${cy} Z`} fill="#07010f" />
      <line x1={mx1} y1={my1} x2={mx2} y2={my2}
        stroke="rgba(251,191,36,0.8)" strokeWidth="1.2" strokeDasharray="2,1.5" />
      <text x={cx} y={cy - 10} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="5" fontWeight="700">SEATS</text>
      <text x={cx} y={cy - 2} textAnchor="middle" fill={coalitionTotal >= majority ? '#4ade80' : '#fbbf24'} fontSize="11" fontWeight="900">{coalitionTotal}</text>
      <text x={cx} y={cy + 6} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="4.5">{coalitionTotal >= majority ? '✓ majority' : `need ${majority - coalitionTotal} more`}</text>
    </svg>
  )
}

export default function CoalitionMathDashboard() {
  const totalSeats = Object.values(RESULTS).reduce((s, p) => s + p.seats, 0)

  return (
    <div style={{ marginBottom: 28 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 18 }}>⚖️</span>
        <div>
          <h2 style={{ fontWeight: 900, fontSize: 20, color: '#fff', margin: 0 }}>Coalition Math</h2>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', margin: 0 }}>Who can form a government? · 118 seats needed</p>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Reported</div>
          <div style={{ fontWeight: 900, fontSize: 18, color: '#fbbf24', fontVariantNumeric: 'tabular-nums' }}>{totalSeats}/234</div>
        </div>
      </div>

      {/* Full result bar — visual breakdown of all 234 seats */}
      <div style={{
        borderRadius: 20, padding: '18px 18px 14px', marginBottom: 16,
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Final Seat Count · 234 of 234
          </span>
          <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 700 }}>
            ⚖️ HUNG ASSEMBLY
          </span>
        </div>

        {/* Stacked seat bar */}
        <div style={{ height: 24, borderRadius: 12, overflow: 'hidden', display: 'flex', gap: 1, marginBottom: 10 }}>
          {Object.entries(RESULTS).map(([key, p]) => (
            <div key={key}
              title={`${key}: ${p.seats} seats`}
              style={{
                width: `${(p.seats / TOTAL) * 100}%`,
                background: p.color,
                position: 'relative',
                transition: 'opacity 0.2s',
              }}
            >
              {p.seats > 12 && (
                <span style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%,-50%)',
                  fontSize: 10, fontWeight: 900, color: 'rgba(0,0,0,0.65)',
                  fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
                }}>{p.seats}</span>
              )}
            </div>
          ))}
        </div>

        {/* 118 majority line marker */}
        <div style={{ position: 'relative', height: 14 }}>
          <div style={{
            position: 'absolute', top: 0,
            left: `${(MAJORITY / TOTAL) * 100}%`,
            width: 1.5, height: 10,
            background: 'rgba(251,191,36,0.7)',
          }} />
          <span style={{
            position: 'absolute', top: 0, fontSize: 9,
            left: `calc(${(MAJORITY / TOTAL) * 100}% + 4px)`,
            color: 'rgba(251,191,36,0.8)', fontWeight: 700,
          }}>118 — majority</span>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
          {Object.entries(RESULTS).map(([key, p]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: p.color, display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: p.color }}>{key}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontVariantNumeric: 'tabular-nums' }}>{p.seats}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Coalition Scenarios */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {SCENARIOS.map((sc, idx) => {
          const parties = sc.parties.map(name => ({
            name,
            seats: RESULTS[name as keyof typeof RESULTS]?.seats ?? 0,
            color: RESULTS[name as keyof typeof RESULTS]?.color ?? '#94a3b8',
          }))
          const hasMajority = sc.seats >= MAJORITY
          const likelyColor = sc.likelihood >= 50 ? '#4ade80' : sc.likelihood >= 15 ? '#fbbf24' : '#94a3b8'

          return (
            <div key={sc.id} style={{
              borderRadius: 20, overflow: 'hidden',
              background: hasMajority
                ? `linear-gradient(160deg, rgba(74,222,128,0.07) 0%, rgba(7,1,15,0.95) 100%)`
                : 'rgba(255,255,255,0.02)',
              border: `1.5px solid ${hasMajority ? 'rgba(74,222,128,0.25)' : 'rgba(255,255,255,0.07)'}`,
            }}>
              {/* Scenario header */}
              <div style={{
                padding: '14px 16px 12px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 900, fontSize: 15, color: '#fff' }}>{sc.label}</span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{sc.labelTamil}</span>
                    <span style={{
                      fontSize: 9, fontWeight: 900, padding: '2px 8px', borderRadius: 99,
                      letterSpacing: '0.06em',
                      background: `${sc.tagColor}18`, color: sc.tagColor, border: `1px solid ${sc.tagColor}40`,
                    }}>{sc.tag}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>
                    CM: {sc.cm}
                  </div>
                </div>

                {/* Likelihood meter */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>AI Likelihood</div>
                  <div style={{ fontWeight: 900, fontSize: 22, color: likelyColor, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                    {sc.likelihood}%
                  </div>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: '14px 16px', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                {/* Mini arc */}
                {sc.parties.length > 0 && (
                  <div style={{ flexShrink: 0, width: 120 }}>
                    <CoalitionArc parties={parties} total={TOTAL} majority={MAJORITY} />
                  </div>
                )}
                {sc.parties.length === 0 && (
                  <div style={{
                    width: 120, height: 70, borderRadius: 14,
                    background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <span style={{ fontSize: 28 }}>🚨</span>
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Party chips */}
                  {sc.parties.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                      {parties.map((p, i) => (
                        <span key={p.name}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '4px 10px', borderRadius: 99,
                            background: `${p.color}15`, border: `1px solid ${p.color}35`,
                            color: p.color, fontSize: 12, fontWeight: 900,
                          }}>
                            {p.name}
                            <span style={{ fontSize: 10, color: `${p.color}aa` }}>{p.seats}</span>
                          </span>
                          {i < parties.length - 1 && (
                            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, margin: '0 2px' }}>+</span>
                          )}
                        </span>
                      ))}
                      <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                        = <span style={{ fontWeight: 900, color: sc.seats >= MAJORITY ? '#4ade80' : '#ef4444', fontVariantNumeric: 'tabular-nums' }}>{sc.seats}</span>
                        {sc.seats >= MAJORITY
                          ? <span style={{ fontSize: 10, color: '#4ade80', fontWeight: 900 }}>✓ MAJORITY</span>
                          : <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 700 }}>({MAJORITY - sc.seats} short)</span>
                        }
                      </span>
                    </div>
                  )}

                  {/* Description */}
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: 8 }}>
                    {sc.desc}
                  </p>

                  {/* Analysis */}
                  <div style={{
                    borderRadius: 10, padding: '8px 10px', marginBottom: 6,
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.55, margin: 0 }}>
                      <span style={{ color: '#a78bfa', fontWeight: 700 }}>AI: </span>
                      {sc.analysis}
                    </p>
                  </div>

                  {/* Deal-breaker */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <span style={{ fontSize: 10, flexShrink: 0, marginTop: 1 }}>⚠️</span>
                    <p style={{ fontSize: 10, color: 'rgba(239,68,68,0.7)', lineHeight: 1.5, margin: 0 }}>{sc.dealBreaker}</p>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Kingmaker section */}
      <div style={{
        marginTop: 12, borderRadius: 18, padding: '16px 18px',
        background: 'linear-gradient(135deg, rgba(251,191,36,0.08), rgba(251,191,36,0.03))',
        border: '1px solid rgba(251,191,36,0.25)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 16 }}>👑</span>
          <span style={{ fontWeight: 900, fontSize: 15, color: '#fbbf24' }}>The Kingmaker Question</span>
        </div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.65, marginBottom: 10 }}>
          With TVK at 107 — just 11 seats short of majority — Thalapathy Vijay is the single largest party leader
          and has the first right to attempt government formation. Governor's invitation expected within 48 hours.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { icon: '📞', label: 'AIADMK talks', status: 'Ongoing', color: '#fbbf24' },
            { icon: '🤝', label: 'Independents', status: '12 MLAs',  color: '#4ade80' },
            { icon: '⏰', label: 'Deadline',     status: '14 days',  color: '#f87171' },
          ].map(k => (
            <div key={k.label} style={{
              borderRadius: 12, padding: '10px 12px', textAlign: 'center',
              background: `${k.color}0d`, border: `1px solid ${k.color}22`,
            }}>
              <div style={{ fontSize: 16, marginBottom: 4 }}>{k.icon}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>{k.label}</div>
              <div style={{ fontWeight: 900, fontSize: 12, color: k.color }}>{k.status}</div>
            </div>
          ))}
        </div>
      </div>

      <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.12)', marginTop: 10 }}>
        Seat counts based on ECI declared results. Coalition likelihood is AI analysis — not official. NammaTamil does not endorse any party.
      </p>
    </div>
  )
}
