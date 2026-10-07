export default function Logo({ size = 26 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2 select-none">
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
        <rect width="32" height="32" rx="8" fill="var(--accent)" />
        <circle cx="16" cy="16" r="5" fill="#fff" />
        <path d="M16 4v3M16 25v3M4 16h3M25 16h3M7.5 7.5l2 2M22.5 22.5l2 2M7.5 24.5l2-2M22.5 9.5l2-2" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span className="font-tamil font-bold text-[16px]" style={{ color: 'var(--text)' }}>
        நம்ம <span style={{ color: 'var(--accent)' }}>Tamil</span>
      </span>
    </span>
  )
}
