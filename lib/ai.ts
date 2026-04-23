/**
 * Token-optimised AI layer — NammaTamil.live
 *
 * Optimisation stack (applied in order):
 *  1. Response cache   – identical prompts never hit any API twice (in-process TTL)
 *  2. Model tiering    – Groq (free) → Gemini (free) → Claude Haiku (paid, last resort)
 *  3. Prompt caching   – Claude system prompt marked cache_control:ephemeral (saves ~90% on re-use)
 *  4. Context trimmer  – long conversation histories compressed to summary + last 3 turns
 *  5. Token budget     – hard cap per request; daily Claude spend guard
 *  6. Gemini 2.0 flash – faster + cheaper than 1.5 pro
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AIOptions {
  maxTokens?: number
  systemPrompt?: string
  /** 'fast' = Groq only (free). 'smart' = full fallback chain. Default: 'smart' */
  mode?: 'fast' | 'smart'
  /** Skip response cache for this call */
  noCache?: boolean
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// ─── In-Process Response Cache ────────────────────────────────────────────────
// Avoids re-calling any API for identical prompts within the same process lifetime.
// On Vercel each serverless function instance has its own cache (fine for our scale).

const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour
const responseCache = new Map<string, { text: string; expires: number }>()

function getCached(key: string): string | null {
  const entry = responseCache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expires) { responseCache.delete(key); return null }
  return entry.text
}

function setCached(key: string, text: string) {
  // Evict oldest entry if cache grows large
  if (responseCache.size > 500) {
    const firstKey = responseCache.keys().next().value
    if (firstKey) responseCache.delete(firstKey)
  }
  responseCache.set(key, { text, expires: Date.now() + CACHE_TTL_MS })
}

function cacheKey(prompt: string, system?: string, maxTokens?: number): string {
  return `${maxTokens ?? 400}::${(system ?? '').slice(0, 60)}::${prompt.slice(0, 200)}`
}

// ─── Token Estimator ──────────────────────────────────────────────────────────
// Rough estimate: ~4 chars per token (good enough for budgeting)

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

// ─── Context Compressor ───────────────────────────────────────────────────────
// Keeps last 3 messages verbatim; older messages become a 1-line summary.
// Cuts token usage by 60–80% in long conversations.

export function compressContext(messages: ChatMessage[]): ChatMessage[] {
  if (messages.length <= 6) return messages
  const keep = messages.slice(-3)
  const old   = messages.slice(0, -3)
  // Summarise old turns into a single short assistant note
  const summaryLines = old
    .filter(m => m.role === 'user')
    .map(m => m.content.slice(0, 80).replace(/\n/g, ' '))
    .join(' | ')
  return [
    { role: 'user',      content: `[Earlier context]: ${summaryLines}` },
    { role: 'assistant', content: 'Understood. Continuing.' },
    ...keep,
  ]
}

// ─── Daily Claude Budget Guard ────────────────────────────────────────────────
// Tracks estimated spend in-process. Prevents surprise bills on free Vercel plans.
// Resets automatically each day (process restarts on Vercel cold starts).

const claudeBudget = {
  tokensUsedToday: 0,
  // Claude Haiku: input $0.25/M, output $1.25/M tokens
  // Daily soft limit: ~50k tokens ≈ $0.075/day
  dailySoftLimitTokens: 50_000,
}

function claudeBudgetExceeded(): boolean {
  return claudeBudget.tokensUsedToday >= claudeBudget.dailySoftLimitTokens
}

function recordClaudeUsage(inputTokens: number, outputTokens: number) {
  claudeBudget.tokensUsedToday += inputTokens + outputTokens
}

// ─── Provider Implementations ─────────────────────────────────────────────────

async function callGroq(
  prompt: string,
  opts: AIOptions = {},
  history: ChatMessage[] = []
): Promise<string> {
  if (!process.env.GROQ_API_KEY) throw new Error('No Groq key')
  const Groq = (await import('groq-sdk')).default
  const groq  = new Groq({ apiKey: process.env.GROQ_API_KEY })

  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = []
  if (opts.systemPrompt) messages.push({ role: 'system', content: opts.systemPrompt })
  for (const m of compressContext(history)) messages.push(m)
  messages.push({ role: 'user', content: prompt })

  const res = await groq.chat.completions.create({
    model:      process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile',
    messages,
    max_tokens: Math.min(opts.maxTokens ?? 400, 800), // hard cap
    temperature: 0.7,
  })
  return res.choices[0]?.message?.content?.trim() ?? ''
}

async function callGemini(prompt: string, opts: AIOptions = {}): Promise<string> {
  if (!process.env.GEMINI_API_KEY) throw new Error('No Gemini key')
  const { GoogleGenerativeAI } = await import('@google/generative-ai')
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  // gemini-2.0-flash: faster + cheaper than 1.5-pro
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL ?? 'gemini-2.0-flash',
    generationConfig: { maxOutputTokens: Math.min(opts.maxTokens ?? 400, 800) },
  })
  const fullPrompt = opts.systemPrompt
    ? `${opts.systemPrompt}\n\n${prompt}`
    : prompt
  const result = await model.generateContent(fullPrompt)
  return result.response.text().trim()
}

async function callClaude(prompt: string, opts: AIOptions = {}): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('No Claude key')
  if (claudeBudgetExceeded()) throw new Error('Claude daily budget exceeded')

  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const client    = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const maxOut = Math.min(opts.maxTokens ?? 400, 600) // tight cap on paid model

  const res = await client.messages.create({
    model:      process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5-20251001',
    max_tokens: maxOut,
    // ── Prompt caching: system prompt cached for ~5 min on Anthropic side ──
    // Saves ~90% of system-prompt input tokens on repeated calls.
    system: opts.systemPrompt
      ? [{ type: 'text', text: opts.systemPrompt, cache_control: { type: 'ephemeral' } }]
      : undefined,
    messages: [{ role: 'user', content: prompt }],
  })

  // Track usage for budget guard
  if (res.usage) {
    recordClaudeUsage(res.usage.input_tokens, res.usage.output_tokens)
    console.log(`[Claude] tokens: in=${res.usage.input_tokens} out=${res.usage.output_tokens} | daily_total=${claudeBudget.tokensUsedToday}`)
  }

  const block = res.content[0]
  return block.type === 'text' ? block.text.trim() : ''
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate text with full token optimisation.
 *
 * @param prompt      The user prompt
 * @param opts        Options (maxTokens, systemPrompt, mode, noCache)
 * @param history     Optional prior conversation (will be compressed)
 */
export async function generateWithAI(
  prompt: string,
  opts: AIOptions = {},
  history: ChatMessage[] = []
): Promise<string> {

  // 1. Check response cache first
  if (!opts.noCache) {
    const cached = getCached(cacheKey(prompt, opts.systemPrompt, opts.maxTokens))
    if (cached) {
      console.log('[AI] Cache hit — 0 tokens used')
      return cached
    }
  }

  // 2. 'fast' mode = Groq only (free, no fallback)
  if (opts.mode === 'fast') {
    try {
      const result = await callGroq(prompt, opts, history)
      if (result) { setCached(cacheKey(prompt, opts.systemPrompt, opts.maxTokens), result); return result }
    } catch (e) {
      console.warn('[AI] Groq fast-mode failed:', (e as Error).message)
    }
    return ''
  }

  // 3. Smart fallback chain: Groq → Gemini → Claude
  const providers = [
    { name: 'Groq',   fn: () => callGroq(prompt, opts, history) },
    { name: 'Gemini', fn: () => callGemini(prompt, opts) },
    { name: 'Claude', fn: () => callClaude(prompt, opts) },
  ]

  for (const { name, fn } of providers) {
    try {
      const result = await fn()
      if (result) {
        console.log(`[AI] Provider: ${name} | est. tokens: ${estimateTokens(prompt + result)}`)
        if (!opts.noCache) setCached(cacheKey(prompt, opts.systemPrompt, opts.maxTokens), result)
        return result
      }
    } catch (e) {
      console.warn(`[AI] ${name} failed:`, (e as Error).message)
    }
  }

  return ''
}

/**
 * Lightweight wrapper for short, non-critical tasks (labels, tags, one-liners).
 * Uses Groq only — completely free, fastest response.
 */
export function generateFast(prompt: string, systemPrompt?: string): Promise<string> {
  return generateWithAI(prompt, { mode: 'fast', maxTokens: 150, systemPrompt })
}

/**
 * Wrapper for rich content (summaries, descriptions, analysis).
 * Uses full fallback chain with 400-token budget.
 */
export function generateContent(prompt: string, systemPrompt?: string): Promise<string> {
  return generateWithAI(prompt, { mode: 'smart', maxTokens: 400, systemPrompt })
}

// ─── System Prompts ───────────────────────────────────────────────────────────
// Defined once here, cached by Claude on first use.

export const SYSTEM_TAMIL_EXPERT = `You are an expert Tamil entertainment analyst with deep knowledge of Tamil cinema, serials, music, and the Tamil diaspora. Write concise, engaging descriptions in English for a global Tamil audience. Be factual, warm, and culturally accurate. Keep responses under 120 words.`

export const SYSTEM_SEO_WRITER = `You are an SEO content writer specialising in Tamil entertainment. Write keyword-rich, natural-sounding meta descriptions and page summaries in English. Max 160 characters for meta descriptions. Be accurate and engaging.`

// ─── Budget Stats (for monitoring/logging) ───────────────────────────────────

export function getTokenStats() {
  return {
    claudeTokensToday: claudeBudget.tokensUsedToday,
    claudeDailyLimit:  claudeBudget.dailySoftLimitTokens,
    cacheSize:         responseCache.size,
    budgetUsedPct:     Math.round((claudeBudget.tokensUsedToday / claudeBudget.dailySoftLimitTokens) * 100),
  }
}
