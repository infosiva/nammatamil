import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rateLimit'

export const runtime = 'nodejs'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

const DEFAULT_SYSTEM = `You are NammaBot, the AI news assistant for NammaTamil — a Tamil news portal for the global Tamil community.
Help users understand Tamil Nadu news, politics, cinema, sports, and culture. Answer in Tamil when user writes in Tamil, English otherwise.
Be concise, factual, and neutral. If asked about something outside Tamil news/culture, say: "நான் NammaTamil-க்காக பயிற்சி பெற்றேன். பொது கேள்விகளுக்கு Google அல்லது ChatGPT-ஐ பயன்படுத்துங்கள்."`

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const rl = checkRateLimit(ip, 10)
  if (!rl.ok) return new Response('Rate limit exceeded', { status: 429 })

  try {
    const body = await req.json()
    const messages: Message[] = body.messages
    const systemPrompt: string = body.systemPrompt ?? DEFAULT_SYSTEM

    if (!messages?.length) {
      return NextResponse.json({ error: 'messages required' }, { status: 400 })
    }

    const groqKey = process.env.GROQ_API_KEY
    const res = groqKey ? await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        max_tokens: 600,
        temperature: 0.6,
        stream: true,
      }),
    }).catch(() => null) : null

    if (!res || !res.ok || !res.body) {
      // Fallback: Groq refused (retired model, bad key, rate limit) -> Gemini, returned as the same plain-text stream
      const gk = process.env.GEMINI_API_KEY
      if (gk) {
        try {
          const gr = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${gk}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemPrompt }] },
              contents: messages.filter(m => m.role !== 'system').map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
              generationConfig: { maxOutputTokens: 600, temperature: 0.6 },
            }),
          })
          if (gr.ok) {
            const gj = await gr.json()
            const gt = gj.candidates?.[0]?.content?.parts?.[0]?.text
            if (gt) return new NextResponse(gt, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' } })
          }
        } catch { /* fall through */ }
      }
      // Third tier: Cerebras (OpenAI-compatible)
      const ck = process.env.CEREBRAS_API_KEY
      if (ck) {
        try {
          const cr = await fetch('https://api.cerebras.ai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ck}` },
            body: JSON.stringify({ model: 'llama3.1-8b', messages: [{ role: 'system', content: systemPrompt }, ...messages], max_tokens: 600, temperature: 0.6 }),
          })
          if (cr.ok) {
            const ct = (await cr.json()).choices?.[0]?.message?.content
            if (ct) return new NextResponse(ct, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' } })
          }
        } catch { /* fall through */ }
      }
      return new NextResponse('Sorry, the assistant is busy right now. Please try again in a moment.', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
    }

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
    return new NextResponse('Sorry, the assistant is busy right now. Please try again in a moment.', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  }
}
