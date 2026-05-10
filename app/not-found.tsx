import Link from 'next/link'

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: '40px 16px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 64,
          fontWeight: 900,
          background: 'linear-gradient(135deg, #fbbf24, #ef4444)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          lineHeight: 1,
        }}
      >
        404
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f4f4f5', margin: 0 }}>
        Page not found
      </h1>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0, maxWidth: 320 }}>
        This page has moved or doesn&apos;t exist. Head back to the Tamil universe.
      </p>
      <Link
        href="/"
        style={{
          marginTop: 8,
          padding: '12px 28px',
          borderRadius: 12,
          background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
          color: '#fff',
          fontWeight: 800,
          fontSize: 14,
          textDecoration: 'none',
          boxShadow: '0 4px 20px rgba(245,158,11,0.3)',
        }}
      >
        Back to NammaTamil →
      </Link>
    </div>
  )
}
