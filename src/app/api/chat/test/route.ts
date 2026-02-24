/**
 * POST /api/chat/test
 * ───────────────────
 * Fires a minimal generateText call (maxTokens: 1) to verify that the
 * supplied credentials are valid.  Returns { success: true } or
 * { error: "…" } with an appropriate HTTP status code.
 */

import { generateText } from 'ai'
import { getModel } from '../../_model-factory'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  let body: {
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

  const { provider = 'google', apiKey = '', model = '', extraConfig = {} } = body

  if (!apiKey && provider !== 'google-vertex') {
    return Response.json({ error: 'API key is required.' }, { status: 400 })
  }

  if (!model) {
    return Response.json({ error: 'Model is required.' }, { status: 400 })
  }

  let modelInstance
  try {
    modelInstance = getModel({ provider, apiKey, model, extraConfig })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return Response.json({ error: message }, { status: 400 })
  }

  try {
    await generateText({
      model: modelInstance,
      messages: [{ role: 'user', content: 'Say "ok"' }],
      maxOutputTokens: 5,
    })
    return Response.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return Response.json({ success: false, error: message }, { status: 400 })
  }
}
