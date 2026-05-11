import Groq from 'groq-sdk'
import { NextRequest, NextResponse } from 'next/server'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export const runtime = 'nodejs'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

// Cache live TVK headlines for 3 min — avoids hitting RSS on every chat message
let headlineCache: { headlines: string; fetchedAt: number } | null = null
const HEADLINE_TTL = 3 * 60 * 1000

async function getLiveContext(): Promise<string> {
  const now = Date.now()
  if (headlineCache && now - headlineCache.fetchedAt < HEADLINE_TTL) {
    return headlineCache.headlines
  }
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://nammatamil.live'
    const res = await fetch(`${base}/api/tvk-news`, {
      signal: AbortSignal.timeout(4000),
      next: { revalidate: 180 },
    })
    if (!res.ok) throw new Error(`tvk-news ${res.status}`)
    const data = await res.json() as { news?: Array<{ title: string; source: string }> }
    const top5 = (data.news ?? [])
      .slice(0, 5)
      .map((n, i) => `${i + 1}. [${n.source}] ${n.title}`)
      .join('\n')
    headlineCache = { headlines: top5, fetchedAt: now }
    return top5
  } catch {
    // Silently fall back — no hardcoded facts, just omit live context
    return ''
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const messages: Message[] = body.messages

    if (!messages?.length) {
      return NextResponse.json({ error: 'messages required' }, { status: 400 })
    }

    // Pull live TVK/Vijay/TN news context dynamically
    const liveContext = await getLiveContext()
    const liveSection = liveContext
      ? `\n\nLatest live headlines (use these to answer current-affairs questions):\n${liveContext}`
      : ''

    const systemPrompt: string = body.systemPrompt ?? `You are TamilBot, the friendly AI assistant for NammaTamil.tv — a Tamil entertainment hub covering Tamil cinema, serials, OTT, music, cricket, and Tamil Nadu politics.${liveSection}

Answer in a friendly, enthusiastic tone. Mix English and Tamil words naturally when appropriate (da, pa, machan, Anna, etc.).
Help users discover Tamil serials, movies, OTT content, music, cricket, and TN political updates.
Keep responses short and helpful. For political questions stay informative and neutral.`

    const chatMessages: Message[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: Message) => ({ role: m.role, content: m.content })),
    ]

    const stream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: chatMessages,
      max_tokens: 600,
      temperature: 0.7,
      stream: true,
    })

    const readable = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? ''
            if (text) controller.enqueue(encoder.encode(text))
          }
        } finally {
          controller.close()
        }
      },
    })

    return new NextResponse(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (err) {
    console.error('[/api/chat]', err)
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 })
  }
}
