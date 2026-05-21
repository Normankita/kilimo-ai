import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `You are Kilimo AI, an agricultural assistant for Tanzanian smallholder farmers.
Always respond in Kiswahili unless the user writes in English.
Focus only on farming topics: crops, weather, diseases, irrigation, pest control, soil health, and market advice.
Be simple, friendly, and practical. Avoid technical jargon.
If asked about something unrelated to farming, politely redirect to farming topics in Kiswahili.
Keep responses concise and actionable.`

export async function POST(request: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY

  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    return NextResponse.json(
      { error: 'GROQ_API_KEY haijawekwa. Weka API key kwenye .env.local' },
      { status: 503 }
    )
  }

  try {
    const { messages } = await request.json()

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages.map((m: { role: string; content: string }) => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content,
          })),
        ],
        max_tokens: 1024,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Groq API ilikataa ombi')
    }

    const data = await response.json()
    const text = data.choices[0].message.content

    return NextResponse.json({ content: text })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Hitilafu ya seva'
    return NextResponse.json({ error: message }, { status: 500 })
  }}
