import { streamText, convertToModelMessages, tool } from 'ai'
import { z } from 'zod'
import { getProvider } from '@/lib/providers'
import { getModel, getReasoningProviderOptions } from '../_model-factory'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  let body: {
    messages: unknown
    provider?: string
    apiKey?: string
    model?: string
    extraConfig?: Record<string, string>
    enableWebSearch?: boolean
    reasoningEffort?: 'low' | 'medium' | 'high' | 'xhigh'
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
    enableWebSearch = false,
    reasoningEffort,
  } = body

  if (!apiKey && provider !== 'google-vertex') {
    return Response.json(
      { error: 'No API key provided. Please configure a provider in Settings.' },
      { status: 400 },
    )
  }

  if (!model && !extraConfig.modelId) {
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
    const providerOptions = getReasoningProviderOptions({ provider, model, reasoningEffort })
    const providerSupportsTools = Boolean(getProvider(provider)?.supportsTools)
    const tools =
      enableWebSearch && providerSupportsTools
        ? {
            web_search: tool({
              description: 'Search the web for up-to-date information.',
              inputSchema: z.object({
                query: z.string().min(2),
              }),
              execute: async ({ query }) => {
                const tavilyApiKey = process.env.TAVILY_API_KEY
                if (!tavilyApiKey) {
                  return {
                    error:
                      'Web search is unavailable because TAVILY_API_KEY is not configured on the server.',
                  }
                }

                const tavilyResponse = await fetch('https://api.tavily.com/search', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    api_key: tavilyApiKey,
                    query,
                    search_depth: 'advanced',
                    max_results: 5,
                  }),
                })

                if (!tavilyResponse.ok) {
                  throw new Error(`Web search failed (${tavilyResponse.status}).`)
                }

                const tavilyData = (await tavilyResponse.json()) as {
                  answer?: string
                  results?: Array<{ title?: string; url?: string; content?: string }>
                }

                return {
                  answer: tavilyData.answer ?? '',
                  results: (tavilyData.results ?? []).map((result) => ({
                    title: result.title ?? '',
                    url: result.url ?? '',
                    content: result.content ?? '',
                  })),
                }
              },
            }),
          }
        : undefined

    const result = streamText({
      model: modelInstance,
      messages: modelMessages,
      tools,
      providerOptions: providerOptions as Parameters<typeof streamText>[0]['providerOptions'],
    })

    return result.toUIMessageStreamResponse()
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const errName = err instanceof Error ? err.name : ''
    // Surface provider authentication / quota errors as 4xx so the client
    // can show them directly to the user.
    let status: number
    if (message.toLowerCase().includes('auth') || message.toLowerCase().includes('key')) {
      status = 401
    } else if (
      errName === 'ValidationError' ||
      /invalid|malformed|required|missing/i.test(message)
    ) {
      status = 400
    } else {
      status = 500
    }
    return Response.json({ error: message }, { status })
  }
}
