'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { Menu, X, Search, Tv2, Film, Music, Users, Home, PlayCircle } from 'lucide-react'
import clsx from 'clsx'

const NAV = [
  { href: '/',          label: 'Home',      icon: Home       },
  { href: '/serials',   label: 'Serials',   icon: Tv2        },
  { href: '/movies',    label: 'Movies',    icon: Film       },
  { href: '/albums',    label: 'Albums',    icon: Music      },
  { href: '/actors',    label: 'Artists',   icon: Users      },
  { href: '/ott-plans', label: 'OTT Plans', icon: PlayCircle },
]

export default function Header() {
  const pathname  = usePathname()
  const router    = useRouter()
  const [open, setOpen]           = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery]         = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // ⌘K / Ctrl+K opens search overlay
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
        setTimeout(() => inputRef.current?.focus(), 40)
      }
      if (e.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const openSearch = () => {
    setSearchOpen(true)
    setTimeout(() => inputRef.current?.focus(), 40)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}`)
      setSearchOpen(false)
      setQuery('')
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 glass border-b border-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-500 to-crimson-600
                              flex items-center justify-center glow-gold-sm
                              group-hover:scale-110 transition-transform">
                <Tv2 className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold">
                <span className="text-gradient">நம்ம</span>
                <span className="text-white ml-1">Tamil</span>
                <span className="text-gold-500 text-sm">.live</span>
              </span>
            </Link>

            {/* Desktop nav — icons + labels */}
            <nav className="hidden md:flex items-center gap-0.5">
              {NAV.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    pathname === href
                      ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </Link>
              ))}
            </nav>

            {/* Right: search pill + mobile toggle */}
            <div className="flex items-center gap-2">

              {/* Desktop: pill search button with ⌘K hint */}
              <button
                onClick={openSearch}
                className="hidden md:flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl
                           glass border border-white/10 text-slate-400 text-sm
                           hover:border-gold-500/30 hover:text-white transition-all"
              >
                <Search className="w-3.5 h-3.5" />
                <span className="w-28 text-left">Search...</span>
                <kbd className="px-1.5 py-0.5 rounded text-xs bg-white/5 border border-white/10 font-mono text-muted">
                  ⌘K
                </kbd>
              </button>

              {/* Mobile: search icon */}
              <button
                onClick={openSearch}
                className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-all"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Mobile: hamburger */}
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
            <div className="px-4 py-3 space-y-0.5">
              {NAV.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                    pathname === href
                      ? 'bg-gold-500/10 text-gold-400'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* ── Search overlay ───────────────────────────────────────────────── */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm
                     flex items-start justify-center pt-20 px-4"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl
                       glass-gold border border-gold-500/25"
            onClick={e => e.stopPropagation()}
          >
            <form onSubmit={handleSearch}>
              <div className="flex items-center gap-3 px-4 py-4">
                <Search className="w-5 h-5 text-gold-400 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search serials, movies, albums, artists..."
                  className="flex-1 bg-transparent text-white placeholder-slate-500 text-base outline-none"
                  autoComplete="off"
                />
                {query && (
                  <button type="button" onClick={() => setQuery('')}
                    className="text-muted hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>
            <div className="border-t border-white/5 px-4 py-2.5 flex gap-5 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded font-mono">↵</kbd>
                Search
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded font-mono">ESC</kbd>
                Close
              </span>
              <span className="ml-auto">
                <Link href="/search" onClick={() => setSearchOpen(false)}
                  className="text-gold-500 hover:text-gold-400 transition-colors">
                  Advanced search →
                </Link>
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
