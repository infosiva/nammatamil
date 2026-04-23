'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X, Search, Tv2 } from 'lucide-react'
import clsx from 'clsx'

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/serials', label: 'Serials' },
  { href: '/movies', label: 'Movies' },
  { href: '/albums', label: 'Albums' },
  { href: '/actors', label: 'Artists' },
]

export default function Header() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 glass border-b border-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-500 to-crimson-600 flex items-center justify-center glow-gold-sm group-hover:scale-110 transition-transform">
              <Tv2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold">
              <span className="text-gradient">நம்ம</span>
              <span className="text-white ml-1">Tamil</span>
              <span className="text-gold-500 text-sm">.tv</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  pathname === href
                    ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Search + mobile toggle */}
          <div className="flex items-center gap-2">
            <Link
              href="/search"
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-all"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </Link>
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-all"
              aria-label="Menu"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-subtle glass">
          <div className="px-4 py-3 space-y-1">
            {NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={clsx(
                  'block px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                  pathname === href
                    ? 'bg-gold-500/10 text-gold-400'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                )}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
