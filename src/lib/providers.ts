// ─── Provider catalogue ───────────────────────────────────────────────────────
// Each entry drives both the Settings UI and the server-side model factory.
// Add new providers here; the rest of the codebase picks them up automatically.
// Last updated: February 2026

export interface ModelInfo {
  id: string
  name: string
}

export interface ExtraConfigField {
  key: string
  label: string
  placeholder: string
  required: boolean
  type: 'text' | 'password'
}

export interface ProviderConfig {
  id: string
  /** Human-readable name shown in dropdowns / labels */
  name: string
  /** Short label shown beside the active provider badge */
  badge: string
  models: ModelInfo[]
  apiKeyLabel: string
  apiKeyPlaceholder: string
  /** Link to the provider's API-key console */
  docsUrl: string
  /**
   * Extra configuration fields required beyond a plain API key.
   * Examples: Azure resource name, OpenAI-compatible base URL,
   *           Bedrock secret key + region, Vertex project + location.
   */
  extraConfigFields?: ExtraConfigField[]
  /**
   * Providers that require credentials other than a simple API key
   * (e.g. AWS IAM, GCP service accounts).  The UI shows a warning.
   */
  requiresCloudCredentials?: boolean
}

export const PROVIDERS: ProviderConfig[] = [
  // ── Tier-1: simple API-key providers ──────────────────────────────────────

  {
    id: 'openai',
    name: 'OpenAI',
    badge: 'OpenAI',
    models: [
      { id: 'gpt-4.1', name: 'GPT-4.1' },
      { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini' },
      { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano' },
      { id: 'o4-mini', name: 'o4-mini' },
      { id: 'o3', name: 'o3' },
      { id: 'o3-mini', name: 'o3-mini' },
      { id: 'o1', name: 'o1' },
      { id: 'o1-pro', name: 'o1-pro' },
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
    ],
    apiKeyLabel: 'OpenAI API Key',
    apiKeyPlaceholder: 'sk-…',
    docsUrl: 'https://platform.openai.com/api-keys',
  },

  {
    id: 'anthropic',
    name: 'Anthropic',
    badge: 'Anthropic',
    models: [
      { id: 'claude-opus-4-6', name: 'Claude Opus 4.6' },
      { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6' },
      { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5' },
      { id: 'claude-opus-4-5-20251101', name: 'Claude Opus 4.5' },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku' },
    ],
    apiKeyLabel: 'Anthropic API Key',
    apiKeyPlaceholder: 'sk-ant-…',
    docsUrl: 'https://console.anthropic.com/settings/keys',
  },

  {
    id: 'google',
    name: 'Google Generative AI',
    badge: 'Google',
    models: [
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
      { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
      { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash-Lite' },
    ],
    apiKeyLabel: 'Google AI API Key',
    apiKeyPlaceholder: 'AIza…',
    docsUrl: 'https://aistudio.google.com/app/apikey',
  },

  {
    id: 'xai',
    name: 'xAI Grok',
    badge: 'xAI',
    models: [
      { id: 'grok-3', name: 'Grok 3' },
      { id: 'grok-3-latest', name: 'Grok 3 (latest)' },
      { id: 'grok-3-mini-beta', name: 'Grok 3 Mini' },
      { id: 'grok-2-1212', name: 'Grok 2' },
      { id: 'grok-2-vision-1212', name: 'Grok 2 Vision' },
    ],
    apiKeyLabel: 'xAI API Key',
    apiKeyPlaceholder: 'xai-…',
    docsUrl: 'https://console.x.ai/',
  },

  {
    id: 'mistral',
    name: 'Mistral',
    badge: 'Mistral',
    models: [
      { id: 'mistral-large-latest', name: 'Mistral Large' },
      { id: 'pixtral-large-latest', name: 'Pixtral Large (Vision)' },
      { id: 'mistral-small-latest', name: 'Mistral Small' },
      { id: 'codestral-latest', name: 'Codestral' },
      { id: 'mistral-nemo', name: 'Mistral Nemo 12B' },
      { id: 'open-mixtral-8x22b', name: 'Mixtral 8×22B' },
    ],
    apiKeyLabel: 'Mistral API Key',
    apiKeyPlaceholder: '…',
    docsUrl: 'https://console.mistral.ai/api-keys/',
  },

  {
    id: 'groq',
    name: 'Groq',
    badge: 'Groq',
    models: [
      { id: 'meta-llama/llama-4-maverick-17b-128e-instruct', name: 'Llama 4 Maverick 17B' },
      { id: 'llama-3.3-70b-versatile', name: 'LLaMA 3.3 70B' },
      { id: 'qwen-qwq-32b', name: 'Qwen QwQ 32B' },
      { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill 70B' },
      { id: 'deepseek-r1-distill-qwen-32b', name: 'DeepSeek R1 Distill Qwen 32B' },
      { id: 'llama-3.1-8b-instant', name: 'LLaMA 3.1 8B Instant' },
      { id: 'gemma2-9b-it', name: 'Gemma 2 9B' },
    ],
    apiKeyLabel: 'Groq API Key',
    apiKeyPlaceholder: 'gsk_…',
    docsUrl: 'https://console.groq.com/keys',
  },

  {
    id: 'cohere',
    name: 'Cohere',
    badge: 'Cohere',
    models: [
      { id: 'command-r-plus', name: 'Command R+' },
      { id: 'command-r7b-12-2024', name: 'Command R7B' },
      { id: 'command-r-08-2024', name: 'Command R (Aug 2024)' },
    ],
    apiKeyLabel: 'Cohere API Key',
    apiKeyPlaceholder: '…',
    docsUrl: 'https://dashboard.cohere.com/api-keys',
  },

  {
    id: 'deepseek',
    name: 'DeepSeek',
    badge: 'DeepSeek',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat (V3)' },
      { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner (R1)' },
    ],
    apiKeyLabel: 'DeepSeek API Key',
    apiKeyPlaceholder: 'sk-…',
    docsUrl: 'https://platform.deepseek.com/api_keys',
  },

  {
    id: 'perplexity',
    name: 'Perplexity',
    badge: 'Perplexity',
    models: [
      { id: 'sonar-pro', name: 'Sonar Pro' },
      { id: 'sonar-reasoning-pro', name: 'Sonar Reasoning Pro' },
      { id: 'sonar-deep-research', name: 'Sonar Deep Research' },
      { id: 'sonar', name: 'Sonar' },
      { id: 'sonar-reasoning', name: 'Sonar Reasoning' },
    ],
    apiKeyLabel: 'Perplexity API Key',
    apiKeyPlaceholder: 'pplx-…',
    docsUrl: 'https://www.perplexity.ai/settings/api',
  },

  {
    id: 'cerebras',
    name: 'Cerebras',
    badge: 'Cerebras',
    models: [
      { id: 'llama-4-maverick-400b', name: 'Llama 4 Maverick 400B' },
      { id: 'qwen-3-235b-a22b-instruct-2507', name: 'Qwen 3 235B' },
      { id: 'llama-3.3-70b', name: 'LLaMA 3.3 70B' },
      { id: 'llama3.1-8b', name: 'LLaMA 3.1 8B' },
    ],
    apiKeyLabel: 'Cerebras API Key',
    apiKeyPlaceholder: '…',
    docsUrl: 'https://cloud.cerebras.ai/',
  },

  {
    id: 'fireworks',
    name: 'Fireworks AI',
    badge: 'Fireworks',
    models: [
      { id: 'accounts/fireworks/models/qwen3-coder-480b-a35b-instruct', name: 'Qwen 3 Coder 480B' },
      { id: 'accounts/fireworks/models/deepseek-v3p1-terminus', name: 'DeepSeek V3.1' },
      { id: 'accounts/fireworks/models/deepseek-r1-0528', name: 'DeepSeek R1' },
      { id: 'accounts/fireworks/models/kimi-k2-instruct-0905', name: 'Kimi K2' },
      { id: 'accounts/fireworks/models/llama-v3p3-70b-instruct', name: 'LLaMA 3.3 70B' },
    ],
    apiKeyLabel: 'Fireworks API Key',
    apiKeyPlaceholder: 'fw_…',
    docsUrl: 'https://fireworks.ai/account/api-keys',
  },

  {
    id: 'deepinfra',
    name: 'DeepInfra',
    badge: 'DeepInfra',
    models: [
      { id: 'deepseek-ai/DeepSeek-V3.2', name: 'DeepSeek V3.2' },
      { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3' },
      { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', name: 'LLaMA 3.3 70B Turbo' },
      { id: 'meta-llama/Meta-Llama-3.1-70B-Instruct', name: 'LLaMA 3.1 70B' },
      { id: 'microsoft/phi-4', name: 'Phi-4' },
    ],
    apiKeyLabel: 'DeepInfra API Key',
    apiKeyPlaceholder: '…',
    docsUrl: 'https://deepinfra.com/dash/api_keys',
  },

  {
    id: 'togetherai',
    name: 'Together AI',
    badge: 'Together',
    models: [
      { id: 'Qwen/Qwen3-235B-Instruct', name: 'Qwen 3 235B' },
      { id: 'Qwen/Qwen3-235B-Thinking', name: 'Qwen 3 235B Thinking' },
      { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', name: 'LLaMA 3.3 70B Turbo' },
      { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free', name: 'LLaMA 3.3 70B Turbo (Free)' },
      { id: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo', name: 'LLaMA 3.1 8B Turbo' },
      { id: 'Qwen/Qwen2.5-7B-Turbo', name: 'Qwen 2.5 7B Turbo' },
    ],
    apiKeyLabel: 'Together AI API Key',
    apiKeyPlaceholder: '…',
    docsUrl: 'https://api.together.xyz/settings/api-keys',
  },

  // ── Tier-2: providers with extra configuration fields ──────────────────────

  {
    id: 'azure',
    name: 'Azure OpenAI',
    badge: 'Azure',
    models: [
      { id: 'gpt-4.1', name: 'GPT-4.1' },
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'o3-mini', name: 'o3-mini' },
      { id: 'o1', name: 'o1' },
    ],
    apiKeyLabel: 'Azure OpenAI API Key',
    apiKeyPlaceholder: '…',
    docsUrl: 'https://portal.azure.com/',
    extraConfigFields: [
      {
        key: 'resourceName',
        label: 'Azure Resource Name',
        placeholder: 'my-azure-openai-resource',
        required: true,
        type: 'text',
      },
    ],
  },

  {
    id: 'openai-compatible',
    name: 'OpenAI-compatible',
    badge: 'Custom',
    models: [],
    apiKeyLabel: 'API Key',
    apiKeyPlaceholder: '…',
    docsUrl: '',
    extraConfigFields: [
      {
        key: 'baseURL',
        label: 'Base URL',
        placeholder: 'https://api.my-provider.com/v1',
        required: true,
        type: 'text',
      },
      {
        key: 'modelId',
        label: 'Model ID',
        placeholder: 'my-model',
        required: true,
        type: 'text',
      },
    ],
  },

  // ── Tier-3: cloud-credential providers ────────────────────────────────────

  {
    id: 'amazon-bedrock',
    name: 'Amazon Bedrock',
    badge: 'Bedrock',
    requiresCloudCredentials: true,
    models: [
      { id: 'anthropic.claude-opus-4-6-v1:0', name: 'Claude Opus 4.6' },
      { id: 'anthropic.claude-3-5-sonnet-20241022-v2:0', name: 'Claude 3.5 Sonnet' },
      { id: 'anthropic.claude-3-5-haiku-20241022-v1:0', name: 'Claude 3.5 Haiku' },
      { id: 'us.amazon.nova-pro-v1:0', name: 'Amazon Nova Pro' },
      { id: 'us.amazon.nova-lite-v1:0', name: 'Amazon Nova Lite' },
      { id: 'us.amazon.nova-micro-v1:0', name: 'Amazon Nova Micro' },
      { id: 'meta.llama3-3-70b-instruct-v1:0', name: 'LLaMA 3.3 70B' },
    ],
    apiKeyLabel: 'AWS Access Key ID',
    apiKeyPlaceholder: 'AKIA…',
    docsUrl: 'https://console.aws.amazon.com/iam/',
    extraConfigFields: [
      {
        key: 'secretAccessKey',
        label: 'AWS Secret Access Key',
        placeholder: '…',
        required: true,
        type: 'password',
      },
      {
        key: 'region',
        label: 'AWS Region',
        placeholder: 'us-east-1',
        required: true,
        type: 'text',
      },
    ],
  },

  {
    id: 'google-vertex',
    name: 'Google Vertex AI',
    badge: 'Vertex',
    requiresCloudCredentials: true,
    models: [
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
      { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash-Lite' },
    ],
    apiKeyLabel: 'Google Cloud API Key (or leave blank for ADC)',
    apiKeyPlaceholder: 'AIza… (optional)',
    docsUrl: 'https://cloud.google.com/vertex-ai/docs/authentication',
    extraConfigFields: [
      {
        key: 'project',
        label: 'GCP Project ID',
        placeholder: 'my-gcp-project',
        required: true,
        type: 'text',
      },
      {
        key: 'location',
        label: 'Region / Location',
        placeholder: 'us-central1',
        required: false,
        type: 'text',
      },
    ],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const PROVIDER_MAP = Object.fromEntries(PROVIDERS.map((p) => [p.id, p])) as Record<
  string,
  ProviderConfig
>

export function getProvider(id: string): ProviderConfig | undefined {
  return PROVIDER_MAP[id]
}

export const DEFAULT_PROVIDER_ID = 'google'
