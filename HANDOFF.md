# HANDOFF — nammatamil election card + dynamic data
**Date:** 2026-10-09  **Status:** PAUSED — deployed, awaiting GA4 id + commit approval
**Goal:** Live by-election card + TN trending + real thumbnails, no hardcoded data, production gate.

## Design lock
- Accent #237a57, bg #faf3e3 (existing). Card: pale-green panel, white seat tiles, no new deps.
- ANIMATED SCOPE: what moves = tile/pill press (scale .97) + hover shadow; why = tactile feedback on tappable live data; trigger = :active/:hover; reduced-motion = transitions off (globals.css `.nt-tile/.nt-pill`). No other motion (data is live, not decorative).
- ai-core: exempt (no AI feature; scrape + RSS).

## Data sources (all dynamic)
- ECI results scrape `src/lib/election.ts` (60s) · Google Trends TN RSS `src/lib/trending.ts` (300s) · ABP Live Tamil RSS `/api/news` (images via media:thumbnail; fetch keyed by VERCEL_DEPLOYMENT_ID so code fixes aren't hidden by stale cache).

## Production gate status
- [x] Analytics: @vercel/analytics added; GA4 wired via hub id / NEXT_PUBLIC_GA4_ID fallback
- [ ] GA4 id: NONE set (hub empty) -> need `G-…` from owner
- [x] Chatbot + feedback present in layout
- [ ] User state, hub promo validate, PostHog events, rate-limit proof: NOT done (gaps, not faked)
- [ ] Skill stack (ds-source/pick-design/taste/animate/a11y/critique): only press-state + a11y focus ring done; rest NOT run
- [ ] visual-qa + security-gate pre-push: not run (nothing pushed)

## Verified live (nammatamil.live, 375 + 1280)
48 ABP images rendered, 82 distinct in HTML, 0 Unsplash, 0 broken, no horizontal overflow, 2 seat tiles, 10 trend pills.

## Known / unfixed
- Cookie banner overlaps Feedback + chat FAB at 375 (existing).
- Hero image sometimes unrelated (ABP's own feed image).
- Project under infosivas-projects; policy says sivaprakasam team — owner decision.
- Nothing committed. Stage nammatamil files by name; skip .bak, tsbuildinfo, pnpm-lock.yaml.

## Resume from here
Get GA4 id, then user state / promo / PostHog / rate-limit, then commit on approval.
