# NammaTamil.tv — Agent Context

## What This Project Is
A complete Tamil entertainment database covering Tamil serials, Tamil movies,
Tamil dubbed films (Malayalam, Telugu), and Tamil music albums.
Target audience: Tamil diaspora worldwide (UK, USA, Canada, Malaysia, Singapore).

## Production URL
**https://nammatamil.live** (or current Vercel URL until domain is connected)

## Hosting & Deployment
- Platform: **Vercel** (auto-deploys from `main` branch on GitHub)
- Repo: `https://github.com/infosiva/nammatamil`
- Push to `main` → Vercel builds and deploys automatically

## Tech Stack
- **Framework**: Next.js 15 (App Router, static generation)
- **Styling**: Tailwind CSS — dark gold/crimson theme
- **Data**: Static TypeScript files (data/serials.ts, data/movies.ts, data/albums.ts)
- **AI**: Groq → Gemini → Claude fallback chain (lib/ai.ts)
- **Font**: Inter (Google Fonts, loaded in globals.css)

## Key Files
| File | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout, AdSense script, metadata |
| `app/page.tsx` | Home page — hero, featured sections, stats |
| `app/globals.css` | Design system — glass, gradients, animations |
| `app/serials/page.tsx` | All serials listing |
| `app/movies/page.tsx` | All movies listing |
| `app/albums/page.tsx` | All albums listing |
| `data/serials.ts` | Serial data (original + dubbed) |
| `data/movies.ts` | Movie data (Tamil + Tamil dubbed) |
| `data/albums.ts` | Music album data |
| `lib/ai.ts` | Groq → Gemini → Claude fallback |
| `components/ContentCard.tsx` | Reusable card for all content types |
| `public/ads.txt` | AdSense ads.txt |

## Design System
- Background: `#07010f` (deep dark purple-black)
- Primary accent: Gold `#f59e0b` → Crimson `#dc2626` gradient
- Cards: `.glass` class — `rgba(255,255,255,0.04)` + `backdrop-filter: blur`
- Gradient text: `.text-gradient` class
- Animations: float, glow, fade-up, shimmer, ticker

## AdSense
- Publisher ID: `ca-pub-4237294630161176`
- ads.txt: `public/ads.txt` ✅
- AdSense script in `app/layout.tsx`

## Content Strategy (SEO)
- Every serial = 1 URL: `/serials/[slug]`
- Every movie = 1 URL: `/movies/[slug]`
- Every album = 1 URL: `/albums/[slug]`
- Static generation = fast load + good SEO
- Target keywords: "Tamil dubbed Malayalam movies", "Sun TV serials list", "Tamil albums AR Rahman"

## Focus Areas for Improvement
1. **SEO** — Meta tags, structured data (schema.org), og:image tags
2. **Content Volume** — Add more serials, movies, albums to data files
3. **AdSense** — Ensure ad units around content sections
4. **Social Sharing** — Share buttons on each detail page
5. **Search** — Implement /search page with client-side filtering
6. **User Engagement** — Recently viewed, favourites (localStorage)

## What NOT to Change
- Do not alter the Groq → Gemini → Claude fallback order in `lib/ai.ts`
- Keep static data in `data/*.ts` — no database needed for MVP
- Do not remove `.text-gradient` or `.glass` CSS classes — used throughout
- Keep `public/ads.txt` with the correct publisher ID
