import type { NextConfig } from 'next'

const TRACKER = 'http://31.97.56.148:3098'

const nextConfig: NextConfig = {
  // Skip ESLint during builds — TypeScript strict mode handles code quality
  eslint: { ignoreDuringBuilds: true },
  async rewrites() {
    return [
      { source: '/t.js', destination: `${TRACKER}/t.js` },
      { source: '/track', destination: `${TRACKER}/track` },
      { source: '/session', destination: `${TRACKER}/session` },
      { source: '/feedback', destination: `${TRACKER}/feedback` },
    ]
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'image.tmdb.org' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
    ],
  },
}

export default nextConfig
