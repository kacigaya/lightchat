/**
 * _model-factory.ts  —  server-only utility
 * ──────────────────────────────────────────
 * Resolves a { provider, apiKey, model, extraConfig } tuple into a
 * LanguageModelV1 instance that can be passed to streamText / generateText.
 *
 * The leading underscore tells Next.js App Router not to treat this file
 * as a route segment.  It must NEVER be imported from a 'use client' module.
 */

import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createXai } from '@ai-sdk/xai'
import { createMistral } from '@ai-sdk/mistral'
import { createGroq } from '@ai-sdk/groq'
import { createCohere } from '@ai-sdk/cohere'
import { createDeepSeek } from '@ai-sdk/deepseek'
import { createPerplexity } from '@ai-sdk/perplexity'
import { createCerebras } from '@ai-sdk/cerebras'
import { createFireworks } from '@ai-sdk/fireworks'
import { createDeepInfra } from '@ai-sdk/deepinfra'
import { createTogetherAI } from '@ai-sdk/togetherai'
import { createAzure } from '@ai-sdk/azure'
import { createVertex } from '@ai-sdk/google-vertex'
import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock'
import type { LanguageModel } from 'ai'

export interface ModelFactoryParams {
  provider: string
  apiKey: string
  model: string
  extraConfig?: Record<string, string>
}

/**
 * Returns a LanguageModelV1 ready for use with streamText / generateText.
 * Throws an Error with a user-readable message on misconfiguration.
 */
export function getModel({
  provider,
  apiKey,
  model,
  extraConfig = {},
}: ModelFactoryParams): LanguageModel {
  switch (provider) {
    // ── Tier-1: simple API-key ─────────────────────────────────────────────

    case 'openai':
      return createOpenAI({ apiKey })(model)

    case 'anthropic':
      return createAnthropic({ apiKey })(model)

    case 'google':
      return createGoogleGenerativeAI({ apiKey })(model)

    case 'xai':
      return createXai({ apiKey })(model)

    case 'mistral':
      return createMistral({ apiKey })(model)

    case 'groq':
      return createGroq({ apiKey })(model)

    case 'cohere':
      return createCohere({ apiKey })(model)

    case 'deepseek':
      return createDeepSeek({ apiKey })(model)

    case 'perplexity':
      return createPerplexity({ apiKey })(model)

    case 'cerebras':
      return createCerebras({ apiKey })(model)

    case 'fireworks':
      return createFireworks({ apiKey })(model)

    case 'deepinfra':
      return createDeepInfra({ apiKey })(model)

    case 'togetherai':
      return createTogetherAI({ apiKey })(model)

    // ── Tier-2: extra config fields ────────────────────────────────────────

    case 'azure': {
      const resourceName = extraConfig.resourceName
      if (!resourceName) throw new Error('Azure requires a resource name in extra config.')
      return createAzure({ apiKey, resourceName })(model)
    }

    case 'openai-compatible': {
      const baseURL = extraConfig.baseURL
      if (!baseURL) throw new Error('OpenAI-compatible provider requires a base URL.')
      // If no explicit model was provided, fall back to the modelId extra field
      const effectiveModel = model || extraConfig.modelId
      if (!effectiveModel) throw new Error('openai-compatible provider requires a model or extraConfig.modelId')
      return createOpenAI({ apiKey, baseURL })(effectiveModel)
    }

    // ── Tier-3: cloud credentials ──────────────────────────────────────────

    case 'amazon-bedrock': {
      const secretAccessKey = extraConfig.secretAccessKey
      const region = extraConfig.region || 'us-east-1'
      if (!apiKey) throw new Error('Amazon Bedrock requires an AWS Access Key ID.')
      if (!secretAccessKey) throw new Error('Amazon Bedrock requires an AWS Secret Access Key.')
      return createAmazonBedrock({
        region,
        accessKeyId: apiKey,
        secretAccessKey,
      })(model)
    }

    case 'google-vertex': {
      const project = extraConfig.project
      const location = extraConfig.location || 'us-central1'
      if (!project) throw new Error('Google Vertex AI requires a GCP Project ID.')
      if (extraConfig.apiKey) {
        throw new Error(
          'google-vertex does not support an API key. createVertex uses Application Default Credentials (ADC) or explicit googleAuthOptions/service-account credentials. Remove the API key and configure ADC instead.',
        )
      }
      // Uses Application Default Credentials (ADC) from the environment.
      return createVertex({ project, location })(model)
    }

    default:
      throw new Error(`Unsupported provider: "${provider}". Check your settings.`)
  }
}
