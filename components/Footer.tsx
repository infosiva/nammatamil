import Link from 'next/link'
import { Tv2, Heart } from 'lucide-react'

const LINKS = {
  Explore: [
    { href: '/serials', label: 'Tamil Serials' },
    { href: '/movies', label: 'Tamil Movies' },
    { href: '/movies?lang=dubbed', label: 'Tamil Dubbed' },
    { href: '/albums', label: 'Music Albums' },
    { href: '/actors', label: 'Artists' },
  ],
  Channels: [
    { href: '/serials?channel=Sun+TV', label: 'Sun TV' },
    { href: '/serials?channel=Vijay+TV', label: 'Vijay TV' },
    { href: '/serials?channel=Star+Vijay', label: 'Star Vijay' },
    { href: '/serials?channel=Zee+Tamil', label: 'Zee Tamil' },
  ],
}

export default function Footer() {
  return (
    <footer className="border-t border-subtle mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-500 to-crimson-600 flex items-center justify-center">
                <Tv2 className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold">
                <span className="text-gradient">நம்ம</span>
                <span className="text-white ml-1">Tamil</span>
                <span className="text-gold-500 text-sm">.tv</span>
              </span>
            </Link>
            <p className="text-muted text-sm max-w-xs leading-relaxed">
              Your complete Tamil entertainment universe — serials, movies, albums, and dubbed content, all in one place.
            </p>
            <p className="text-muted text-xs mt-4">
              தமிழ் பொழுதுபோக்கு உலகம் — உங்களுக்காக
            </p>
          </div>

          {/* Links */}
          {Object.entries(LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-gold-400 font-semibold text-sm mb-3 uppercase tracking-wider">{title}</h3>
              <ul className="space-y-2">
                {links.map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href} className="text-muted text-sm hover:text-white transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-subtle mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-muted text-xs">
            © {new Date().getFullYear()} NammaTamil.tv — For Tamil entertainment lovers worldwide
          </p>
          <p className="text-muted text-xs flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-crimson-500 fill-crimson-500" /> for the Tamil diaspora
          </p>
        </div>
      </div>
    </footer>
  )
}
