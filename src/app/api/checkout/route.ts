import Stripe from 'stripe'

export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return Response.json({ error: 'Payments not configured' }, { status: 503 })
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-04-22.dahlia' as any })
  const origin = req.headers.get('origin') || 'https://roamplan.app'
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    success_url: `${origin}/?upgraded=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: origin,
    metadata: { product: 'roamplan' },
  })
  return Response.json({ url: session.url })
}
