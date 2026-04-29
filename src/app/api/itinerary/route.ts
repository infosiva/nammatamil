import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'API key not configured. Add ANTHROPIC_API_KEY in Vercel → Settings → Environment Variables.' }, { status: 500 })
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  try {
    const { destination, duration, budget, travel_style, interests, travel_with } = await req.json()
    const withKids = travel_with === 'Family with Kids'

    const kidsInstructions = withKids ? `
IMPORTANT - This is a FAMILY WITH KIDS itinerary:
- Every activity must be kid-friendly and suitable for children
- Prioritise: theme parks, zoos, aquariums, playgrounds, interactive museums, beaches, nature walks
- Avoid: nightlife, late evenings, overly long cultural visits without kid appeal
- Include short rest breaks between activities (kids get tired!)
- Suggest early morning starts and afternoon naps/pool time
- For every activity include a "kids_tip" field with a practical tip for parents
- For every day include a "kids_highlight" field naming the most exciting thing for kids that day
- Include a "kids_essentials" array at the top level with 6 packing/preparation tips for families
` : ''

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: 'You are a friendly, expert travel planner who gives warm, practical advice. Return ONLY valid JSON, no markdown, no explanation.',
      messages: [{
        role: 'user',
        content: `Create a ${duration}-day itinerary for ${destination}.
Travelling with: ${travel_with}
Budget: ${budget}, Style: ${travel_style}, Interests: ${interests.join(', ')}.
${kidsInstructions}

Return exactly this JSON structure:
{
  "destination": "City, Country",
  "duration": ${duration},
  "overview": "2-3 warm, friendly sentences describing what makes this trip special for ${travel_with}",
  "budget_estimate": "e.g. $80-120/day per person",
  ${withKids ? '"kids_essentials": ["tip1", "tip2", "tip3", "tip4", "tip5", "tip6"],' : ''}
  "days": [
    {
      "day": 1,
      "theme": "descriptive theme name",
      "morning": {"activity": "specific activity name", "location": "specific place name", "duration": "X hours", "cost": "~$X"${withKids ? ', "kids_tip": "practical tip for parents"' : ''}},
      "afternoon": {"activity": "...", "location": "...", "duration": "...", "cost": "..."${withKids ? ', "kids_tip": "..."' : ''}},
      "evening": {"activity": "...", "location": "...", "duration": "...", "cost": "..."${withKids ? ', "kids_tip": "..."' : ''}},
      "tips": "one practical tip for the day"${withKids ? ',\n      "kids_highlight": "the most exciting thing for kids today"' : ''}
    }
  ],
  "practical_tips": ["tip1", "tip2", "tip3", "tip4", "tip5"]
}`,
      }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : '{}'
    const match = text.match(/\{[\s\S]*\}/)
    const itinerary = match ? JSON.parse(match[0]) : { raw: text }
    return NextResponse.json({ itinerary })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('Itinerary API error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
