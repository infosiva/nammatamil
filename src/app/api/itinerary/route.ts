import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { destination, duration, budget, travel_style, interests } = await req.json()

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    system: 'You are an expert travel planner. Return ONLY valid JSON, no markdown, no explanation.',
    messages: [{
      role: 'user',
      content: `Create a ${duration}-day itinerary for ${destination}.
Budget: ${budget}, Style: ${travel_style}, Interests: ${interests.join(', ')}.

Return exactly this JSON structure:
{
  "destination": "City, Country",
  "duration": ${duration},
  "overview": "2-3 sentence overview",
  "budget_estimate": "daily range e.g. $80-120/day",
  "days": [
    {
      "day": 1,
      "theme": "theme name",
      "morning": {"activity": "...", "location": "...", "duration": "2-3 hours", "cost": "~$X"},
      "afternoon": {"activity": "...", "location": "...", "duration": "3-4 hours", "cost": "~$X"},
      "evening": {"activity": "...", "location": "...", "duration": "2-3 hours", "cost": "~$X"},
      "tips": "one practical tip"
    }
  ],
  "practical_tips": ["tip1", "tip2", "tip3", "tip4", "tip5"]
}`,
    }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : '{}'
  try {
    const match = text.match(/\{[\s\S]*\}/)
    const itinerary = match ? JSON.parse(match[0]) : { raw: text }
    return NextResponse.json({ itinerary })
  } catch {
    return NextResponse.json({ itinerary: { raw: text } })
  }
}
