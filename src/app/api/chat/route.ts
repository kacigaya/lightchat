import { google } from '@ai-sdk/google'
import { streamText, convertToModelMessages } from 'ai'

export async function POST(req: Request) {
  const { messages, model = 'gemini-2.0-flash' } = await req.json()

  const modelMessages = await convertToModelMessages(messages)

  const result = streamText({
    model: google(model),
    messages: modelMessages,
  })

  return result.toUIMessageStreamResponse()
}
