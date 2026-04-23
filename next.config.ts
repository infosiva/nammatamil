import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Skip ESLint during builds — TypeScript strict mode handles code quality
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'image.tmdb.org' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
    ],
  },
}

export default nextConfig
