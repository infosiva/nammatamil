'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { Menu, X, Search, Tv2, Film, Music, Users, Home, PlayCircle } from 'lucide-react'

const NAV = [
  { href: '/',          label: 'Home',      icon: Home       },
  { href: '/serials',   label: 'Serials',   icon: Tv2        },
  { href: '/movies',    label: 'Movies',    icon: Film       },
  { href: '/albums',    label: 'Albums',    icon: Music      },
  { href: '/actors',    label: 'Artists',   icon: Users      },
  { href: '/ott-plans', label: 'OTT',       icon: PlayCircle },
]

export default function Header() {
  const pathname     = usePathname()
  const router       = useRouter()
  const [open, setOpen]             = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery]           = useState('')
  const [scrolled, setScrolled]     = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
      <header
        className="sticky top-0 z-50 transition-all duration-300"
        style={{
          background: scrolled
            ? 'rgba(8,8,16,0.9)'
            : 'rgba(8,8,16,0.7)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderBottom: scrolled
            ? '1px solid rgba(255,255,255,0.08)'
            : '1px solid rgba(255,255,255,0.05)',
          boxShadow: scrolled ? '0 1px 32px rgba(0,0,0,0.4)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">

            {/* ── Logo ── */}
            <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all group-hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                  boxShadow: '0 0 12px rgba(245,158,11,0.3)',
                }}
              >
                <Tv2 className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-[15px] font-black tracking-tight">
                <span className="text-gradient">நம்ம</span>
                <span className="text-white">Tamil</span>
                <span className="text-xs font-bold" style={{ color: '#f59e0b', opacity: 0.7 }}>.live</span>
              </span>
            </Link>

            {/* ── Desktop nav ── */}
            <nav className="hidden md:flex items-center gap-0.5">
              {NAV.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href
                return (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150"
                    style={{
                      background: isActive ? 'rgba(245,158,11,0.1)' : 'transparent',
                      color: isActive ? '#f59e0b' : 'rgba(255,255,255,0.5)',
                      border: isActive ? '1px solid rgba(245,158,11,0.2)' : '1px solid transparent',
                    }}
                    onMouseEnter={e => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.9)'
                        ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)'
                        ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                      }
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </Link>
                )
              })}
            </nav>

            {/* ── Right actions ── */}
            <div className="flex items-center gap-2">
              {/* Desktop search pill */}
              <button
                onClick={openSearch}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl text-[12px] transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.35)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'
                  ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,158,11,0.3)'
                  ;(e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'
                  ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'
                  ;(e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)'
                }}
              >
                <Search className="w-3.5 h-3.5" />
                <span className="w-24 text-left">Search...</span>
                <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  ⌘K
                </kbd>
              </button>

              {/* Mobile search */}
              <button
                onClick={openSearch}
                className="md:hidden p-2 rounded-lg transition-all"
                style={{ color: 'rgba(255,255,255,0.45)' }}
                aria-label="Search"
              >
                <Search className="w-4.5 h-4.5" />
              </button>

              {/* Mobile hamburger */}
              <button
                onClick={() => setOpen(!open)}
                className="md:hidden p-2 rounded-lg transition-all"
                style={{ color: 'rgba(255,255,255,0.45)' }}
                aria-label="Menu"
              >
                {open ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile menu ── */}
        {open && (
          <div
            className="md:hidden"
            style={{
              background: 'rgba(8,8,16,0.97)',
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="px-4 py-2 space-y-0.5">
              {NAV.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: isActive ? 'rgba(245,158,11,0.08)' : 'transparent',
                      color: isActive ? '#f59e0b' : 'rgba(255,255,255,0.55)',
                    }}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </header>

      {/* ── Search overlay ── */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center pt-16 px-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
            style={{
              background: 'rgba(13,13,24,0.98)',
              border: '1px solid rgba(245,158,11,0.2)',
              boxShadow: '0 0 0 1px rgba(245,158,11,0.08), 0 32px 64px rgba(0,0,0,0.6)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <form onSubmit={handleSearch}>
              <div className="flex items-center gap-3 px-4 py-3.5">
                <Search className="w-4.5 h-4.5 flex-shrink-0" style={{ color: '#f59e0b' }} />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search serials, movies, albums, artists…"
                  className="flex-1 bg-transparent text-white placeholder-white/25 text-sm outline-none"
                  autoComplete="off"
                />
                {query && (
                  <button type="button" onClick={() => setQuery('')}
                    className="text-white/25 hover:text-white/60 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>
            <div
              className="flex gap-5 px-4 py-2.5 text-xs"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}
            >
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded font-mono text-[10px]"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>↵</kbd>
                Search
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded font-mono text-[10px]"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>ESC</kbd>
                Close
              </span>
              <Link href="/search" onClick={() => setSearchOpen(false)}
                className="ml-auto transition-colors"
                style={{ color: '#f59e0b' }}>
                Advanced →
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
