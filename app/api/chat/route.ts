import Groq from 'groq-sdk'
import { NextRequest, NextResponse } from 'next/server'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export const runtime = 'nodejs'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const messages: Message[] = body.messages
    const systemPrompt: string = body.systemPrompt ?? `You are TamilBot, the friendly AI assistant for NammaTamil.tv — a Tamil entertainment hub covering Tamil cinema, serials, OTT, music, cricket, and Tamil Nadu politics.

Key facts you MUST know (2024–2026):
- Vijay (Thalapathy) founded Tamilaga Vettri Kazhagam (TVK) in February 2024 and retired from cinema to enter politics full-time.
- GOAT (The Greatest of All Time, 2024) was Vijay's final film before politics — directed by Venkat Prabhu, streaming on Disney+ Hotstar.
- TVK's official election symbol is the WHISTLE (ECI-registered).
- TN Assembly elections 2026: TVK is projected to win 98–120 seats (Axis My India poll). TVK vs DMK vs AIADMK is the main contest.
- Vijay is now referred to as "TVK Chief" or "Thalapathy" — he campaigns actively across Tamil Nadu.
- GOAT 2 (sequel) is in production for 2026 release — Vijay is NOT in it; it continues without him.
- Other trending: Coolie (Rajinikanth, 2025), Thug Life (Kamal Haasan, 2025), Amaran (Sivakarthikeyan, 2024 blockbuster).

Answer in a friendly, enthusiastic tone. Mix English and Tamil words naturally when appropriate (da, pa, machan, Anna, etc.).
Help users discover Tamil serials, movies, OTT content, music, cricket, and TN political updates.
Keep responses short and helpful. For political questions stay informative and neutral.`

    if (!messages?.length) {
      return NextResponse.json({ error: 'messages required' }, { status: 400 })
    }

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
