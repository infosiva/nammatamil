/**
 * /api/serial-thumb?title=Pandian+Stores&channel=Vijay+TV&gradient=orange
 * Returns a styled SVG poster thumbnail for Tamil serials
 */
import { NextRequest, NextResponse } from 'next/server'

const CHANNEL_COLORS: Record<string, [string, string]> = {
  'vijay tv':   ['#f59e0b', '#ef4444'],
  'star vijay': ['#f59e0b', '#ef4444'],
  'sun tv':     ['#f97316', '#dc2626'],
  'zee tamil':  ['#6366f1', '#8b5cf6'],
  'colors tamil': ['#ec4899', '#f43f5e'],
  'kalaignar tv': ['#3b82f6', '#6366f1'],
}

export function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const title   = searchParams.get('title')   ?? 'Serial'
  const channel = searchParams.get('channel') ?? 'Vijay TV'

  const key = channel.toLowerCase()
  const [c1, c2] = CHANNEL_COLORS[key] ?? ['#f59e0b', '#a855f7']

  // Break title into up to 2 lines
  const words = title.split(' ')
  let line1 = '', line2 = ''
  let i = 0
  while (i < words.length && (line1 + words[i]).length <= 12) { line1 += (line1 ? ' ' : '') + words[i]; i++ }
  while (i < words.length) { line2 += (line2 ? ' ' : '') + words[i]; i++ }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0a1a"/>
      <stop offset="100%" style="stop-color:#12082a"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${c1}"/>
      <stop offset="100%" style="stop-color:${c2}"/>
    </linearGradient>
    <linearGradient id="fade" x1="0%" y1="50%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0a1a;stop-opacity:0"/>
      <stop offset="100%" style="stop-color:#0a0a1a;stop-opacity:0.95"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="200" height="300" fill="url(#bg)"/>

  <!-- Decorative circles -->
  <circle cx="160" cy="50" r="80" fill="${c1}" opacity="0.08"/>
  <circle cx="40" cy="250" r="60" fill="${c2}" opacity="0.10"/>

  <!-- Grid pattern -->
  <rect width="200" height="300" fill="none" stroke="white" stroke-opacity="0.03" stroke-width="0.5"
    style="background-image: repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(255,255,255,0.02) 20px, rgba(255,255,255,0.02) 21px)"/>

  <!-- Top accent bar -->
  <rect x="0" y="0" width="200" height="4" fill="url(#accent)" rx="0"/>

  <!-- Center icon area -->
  <rect x="70" y="90" width="60" height="60" rx="16" fill="${c1}" fill-opacity="0.15" stroke="${c1}" stroke-opacity="0.3" stroke-width="1"/>
  <text x="100" y="128" text-anchor="middle" font-size="28" fill="${c1}" opacity="0.8">📺</text>

  <!-- Bottom fade -->
  <rect x="0" y="150" width="200" height="150" fill="url(#fade)"/>

  <!-- Channel badge -->
  <rect x="12" y="210" width="${Math.min(channel.length * 6.5 + 12, 130)}" height="18" rx="4" fill="${c1}" fill-opacity="0.2" stroke="${c1}" stroke-opacity="0.4" stroke-width="0.8"/>
  <text x="18" y="222" font-family="system-ui,sans-serif" font-size="9" font-weight="700" fill="${c1}" letter-spacing="0.5">${channel.toUpperCase()}</text>

  <!-- Title -->
  <text x="12" y="252" font-family="system-ui,sans-serif" font-size="${line2 ? '16' : '18'}" font-weight="900" fill="white">${line1}</text>
  ${line2 ? `<text x="12" y="272" font-family="system-ui,sans-serif" font-size="14" font-weight="900" fill="white" opacity="0.8">${line2}</text>` : ''}

  <!-- Bottom accent line -->
  <rect x="12" y="286" width="40" height="2" rx="1" fill="url(#accent)" opacity="0.6"/>
</svg>`

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
