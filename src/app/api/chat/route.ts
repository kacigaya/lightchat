import { streamText, convertToModelMessages } from 'ai'
import { getModel } from '../_model-factory'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  let body: {
    messages: unknown
    provider?: string
    apiKey?: string
    model?: string
    extraConfig?: Record<string, string>
  }

  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const {
    messages,
    provider = 'google',
    apiKey = '',
    model = '',
    extraConfig = {},
  } = body

  if (!apiKey && provider !== 'google-vertex') {
    return Response.json(
      { error: 'No API key provided. Please configure a provider in Settings.' },
      { status: 400 },
    )
  }

  if (!model) {
    return Response.json({ error: 'No model specified.' }, { status: 400 })
  }

  let modelInstance
  try {
    modelInstance = getModel({ provider, apiKey, model, extraConfig })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return Response.json({ error: message }, { status: 400 })
  }

  try {
    const modelMessages = await convertToModelMessages(messages as Parameters<typeof convertToModelMessages>[0])

    const result = streamText({
      model: modelInstance,
      messages: modelMessages,
    })

    return result.toUIMessageStreamResponse()
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    // Surface provider authentication / quota errors as 4xx so the client
    // can show them directly to the user.
    const status = message.toLowerCase().includes('auth') || message.toLowerCase().includes('key')
      ? 401
      : 500
    return Response.json({ error: message }, { status })
  }
}
