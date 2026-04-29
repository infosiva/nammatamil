/**
 * /api/feedback — receives user feedback and emails it to info.siva@gmail.com
 * Uses Resend (free tier: 100 emails/day, no SMTP setup)
 * Falls back to console log if RESEND_API_KEY not set
 */
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const RESEND_KEY = process.env.RESEND_API_KEY ?? ''
const TO_EMAIL   = 'info.siva@gmail.com'
const FROM_EMAIL = 'NammaTamil Feedback <onboarding@resend.dev>'

interface FeedbackBody {
  type: string
  rating: number
  message: string
  email?: string
  page?: string
}

async function sendViaResend(body: FeedbackBody, ip: string) {
  const stars = '★'.repeat(body.rating) + '☆'.repeat(5 - body.rating)
  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#f9f9f9;padding:24px;border-radius:12px">
      <h2 style="margin:0 0 4px;color:#111">NammaTamil Feedback</h2>
      <p style="margin:0 0 20px;color:#666;font-size:13px">Received from nammatamil.live</p>

      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;color:#555;font-size:13px;width:100px"><strong>Type</strong></td>
            <td style="padding:8px 0;font-size:13px">${body.type}</td></tr>
        <tr><td style="padding:8px 0;color:#555;font-size:13px"><strong>Rating</strong></td>
            <td style="padding:8px 0;font-size:18px;color:#f59e0b">${stars}</td></tr>
        <tr><td style="padding:8px 0;color:#555;font-size:13px"><strong>Page</strong></td>
            <td style="padding:8px 0;font-size:13px">${body.page ?? 'Home'}</td></tr>
        ${body.email ? `<tr><td style="padding:8px 0;color:#555;font-size:13px"><strong>Email</strong></td>
            <td style="padding:8px 0;font-size:13px">${body.email}</td></tr>` : ''}
        <tr><td style="padding:8px 0;color:#555;font-size:13px"><strong>IP</strong></td>
            <td style="padding:8px 0;font-size:13px;color:#999">${ip}</td></tr>
      </table>

      <div style="margin-top:16px;padding:16px;background:#fff;border-radius:8px;border-left:4px solid #f59e0b">
        <p style="margin:0;font-size:14px;line-height:1.6;color:#333">${body.message.replace(/\n/g, '<br>')}</p>
      </div>

      <p style="margin-top:20px;font-size:11px;color:#aaa">
        Sent ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST · nammatamil.live
      </p>
    </div>
  `

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [TO_EMAIL],
      subject: `[NammaTamil] ${body.type} feedback — ${stars}`,
      html,
    }),
    signal: AbortSignal.timeout(8000),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Resend error ${res.status}: ${err}`)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as FeedbackBody

    // Basic validation
    if (!body.message?.trim() || body.message.trim().length < 5) {
      return NextResponse.json({ error: 'Message too short' }, { status: 400 })
    }
    if (!body.rating || body.rating < 1 || body.rating > 5) {
      return NextResponse.json({ error: 'Rating 1–5 required' }, { status: 400 })
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'

    if (RESEND_KEY) {
      await sendViaResend(body, ip)
    } else {
      // Dev fallback — log to console
      console.log('[Feedback]', JSON.stringify({ ...body, ip }, null, 2))
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[Feedback API]', e)
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
  }
}
