import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

const DEFAULT_SYSTEM = `You are NammaBot, the AI news assistant for NammaTamil — a Tamil news portal for the global Tamil community.
Help users understand Tamil Nadu news, politics, cinema, sports, and culture. Answer in Tamil when user writes in Tamil, English otherwise.
Be concise, factual, and neutral. If asked about something outside Tamil news/culture, say: "நான் NammaTamil-க்காக பயிற்சி பெற்றேன். பொது கேள்விகளுக்கு Google அல்லது ChatGPT-ஐ பயன்படுத்துங்கள்."`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const messages: Message[] = body.messages
    const systemPrompt: string = body.systemPrompt ?? DEFAULT_SYSTEM

    if (!messages?.length) {
      return NextResponse.json({ error: 'messages required' }, { status: 400 })
    }

    const groqKey = process.env.GROQ_API_KEY
    if (!groqKey) return NextResponse.json({ error: 'AI not configured' }, { status: 503 })

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        max_tokens: 600,
        temperature: 0.6,
        stream: true,
      }),
    })

    if (!res.ok || !res.body) return NextResponse.json({ error: 'AI request failed' }, { status: 502 })

    const readable = new ReadableStream({
      async start(controller) {
        const reader = res.body!.getReader()
        const decoder = new TextDecoder()
        const encoder = new TextEncoder()
        let buffer = ''
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() ?? ''
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue
              const data = line.slice(6).trim()
              if (data === '[DONE]') return
              try {
                const text = JSON.parse(data).choices?.[0]?.delta?.content ?? ''
                if (text) controller.enqueue(encoder.encode(text))
              } catch { /* skip */ }
            }
          }
        } finally { controller.close() }
      },
    })

    return new NextResponse(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' },
    })
  } catch (err) {
    console.error('[/api/chat]', err)
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 })
  }
}
