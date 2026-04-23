/**
 * AI Fallback Chain: Groq (free/fast) → Gemini (free) → Claude (paid fallback)
 * Mirrors the site-watchdog pattern for consistent behaviour across all sites.
 */

interface AIOptions {
  maxTokens?: number
  systemPrompt?: string
}

async function callGroq(prompt: string, opts: AIOptions = {}): Promise<string> {
  if (!process.env.GROQ_API_KEY) throw new Error('No Groq key')
  const Groq = (await import('groq-sdk')).default
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  const messages: { role: 'system' | 'user'; content: string }[] = []
  if (opts.systemPrompt) messages.push({ role: 'system', content: opts.systemPrompt })
  messages.push({ role: 'user', content: prompt })
  const res = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages,
    max_tokens: opts.maxTokens ?? 400,
    temperature: 0.7,
  })
  return res.choices[0]?.message?.content ?? ''
}

async function callGemini(prompt: string, opts: AIOptions = {}): Promise<string> {
  if (!process.env.GEMINI_API_KEY) throw new Error('No Gemini key')
  const { GoogleGenerativeAI } = await import('@google/generative-ai')
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  const fullPrompt = opts.systemPrompt ? `${opts.systemPrompt}\n\n${prompt}` : prompt
  const result = await model.generateContent(fullPrompt)
  return result.response.text()
}

async function callClaude(prompt: string, opts: AIOptions = {}): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('No Claude key')
  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const res = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: opts.maxTokens ?? 400,
    system: opts.systemPrompt,
    messages: [{ role: 'user', content: prompt }],
  })
  const block = res.content[0]
  return block.type === 'text' ? block.text : ''
}

export async function generateWithAI(prompt: string, opts: AIOptions = {}): Promise<string> {
  const providers = [
    { name: 'Groq', fn: () => callGroq(prompt, opts) },
    { name: 'Gemini', fn: () => callGemini(prompt, opts) },
    { name: 'Claude', fn: () => callClaude(prompt, opts) },
  ]
  for (const { name, fn } of providers) {
    try {
      const result = await fn()
      if (result?.trim()) {
        console.log(`[AI] Used ${name}`)
        return result.trim()
      }
    } catch (e) {
      console.warn(`[AI] ${name} failed:`, (e as Error).message)
    }
  }
  return ''
}

export const SYSTEM_TAMIL_EXPERT = `You are an expert Tamil entertainment analyst with deep knowledge of
Tamil cinema, serials, music, and the Tamil diaspora. Write concise, engaging descriptions
in English for a global Tamil audience. Be factual, warm, and culturally accurate.`
