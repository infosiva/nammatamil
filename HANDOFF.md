# HANDOFF — nammatamil design apply
**Date:** 2026-10-06  **Status:** COMPLETE (files only, uncommitted)
**Goal:** Apply design system: unique accent, archetype, hub-switchable theme, honest content.

## Design lock (finalized before code)
- Archetype default: travel-magazine (weak fit: home is a Tamil news site; places and temple-tour routes suit it). Hub can switch via theme_nammatamil.layout.archetype -> html[data-layout].
- Accent #237a57 (temple green), bg #faf3e3 (sandstone). Registered in design-system/tokens/palette-registry.json.
- Background: AnimatedBg (aurora default, reduced-motion honoured), all colours CSS vars from theme-loader.
- Logo: app/icon.svg + apple icon + Logo component, accent-coloured "Tamil".
- Cleanup: remove SAMPLE_HEADLINES fake news and stale WanderAI theme.config fake pricing/stats.
- Telemetry: GA4 hub-gated, consent-gated usage log, /api/log structured errors.
- AI pillars: gateway = existing lib/ai.ts chain; evals/budget/RAG exempt for this pass (design-only), gaps stated not faked.

## Steps
- [x] layout/theme wiring  - [ ] CSS vars  - [ ] logo  - [ ] pricing honesty  - [ ] build  - [ ] screenshots

## Files changed
See git status in nammatamil. Renamed to .bak: icon.tsx (and theme.config.ts for nammatamil). Dead: DesignEffects.tsx (meetscribe).


## OWASP LLM Top 10 dispositions (gate item 45, 2026-10-07; list recalled from memory, unverified)
- LLM01 prompt injection: lib/guard.ts present, NOT yet wired into routes; no output filtering or tool sandbox review done. PARTIAL.
- LLM02 sensitive info disclosure: `redact()` helper available; not applied to every log. PARTIAL.
- LLM04/10 DoS / unbounded consumption: per-IP rate limit where present; token budgets not enforced. PARTIAL.
- LLM05 improper output handling: model output rendered as text; not audited for HTML sinks. UNVERIFIED.
- LLM06 excessive agency: no tool-calling agents audited. UNVERIFIED.
- Others (supply chain, poisoning, embeddings, misinformation): not assessed.
