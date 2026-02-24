// ─── Provider catalogue ───────────────────────────────────────────────────────
// Each entry drives both the Settings UI and the server-side model factory.
// Add new providers here; the rest of the codebase picks them up automatically.

export interface ModelInfo {
  id: string
  name: string
  reasoningEffortOptions?: Array<'low' | 'medium' | 'high' | 'xhigh'>
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
  supportsTools?: boolean
}

export const PROVIDERS: ProviderConfig[] = [
  // ── Tier-1: simple API-key providers ──────────────────────────────────────
  {
    id: 'openai',
    name: 'OpenAI',
    badge: 'OpenAI',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
      { id: 'gpt-5.3-codex', name: 'GPT-5.3 Codex', reasoningEffortOptions: ['low', 'medium', 'high', 'xhigh'] },
      { id: 'gpt-5.2', name: 'GPT-5.2', reasoningEffortOptions: ['low', 'medium', 'high'] },
      { id: 'gpt-5', name: 'GPT-5', reasoningEffortOptions: ['low', 'medium', 'high'] },
      { id: 'gpt-5-mini', name: 'GPT-5 Mini', reasoningEffortOptions: ['low', 'medium', 'high'] },
      { id: 'o1', name: 'o1', reasoningEffortOptions: ['low', 'medium', 'high'] },
      { id: 'o1-mini', name: 'o1-mini', reasoningEffortOptions: ['low', 'medium', 'high'] },
      { id: 'o3-mini', name: 'o3-mini', reasoningEffortOptions: ['low', 'medium', 'high'] },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
    ],
    apiKeyLabel: 'OpenAI API Key',
    apiKeyPlaceholder: 'sk-…',
    docsUrl: 'https://platform.openai.com/api-keys',
    supportsTools: true,
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    badge: 'Anthropic',
    models: [
      { id: 'claude-opus-4-6', name: 'Claude Opus 4.6' },
      { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6' },
      { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5' },
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
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
      { id: 'gemini-2.5-flash-preview-04-17', name: 'Gemini 2.5 Flash Preview' },
      { id: 'gemini-3.1-pro', name: 'Gemini 3.1 Pro', reasoningEffortOptions: ['low', 'medium', 'high'] },
      { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro Preview', reasoningEffortOptions: ['low', 'medium', 'high'] },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
    ],
    apiKeyLabel: 'Google AI API Key',
    apiKeyPlaceholder: 'AIza…',
    docsUrl: 'https://aistudio.google.com/app/apikey',
    supportsTools: true,
  },
  {
    id: 'xai',
    name: 'xAI Grok',
    badge: 'xAI',
    models: [
      { id: 'grok-2-1212', name: 'Grok 2' },
      { id: 'grok-2-vision-1212', name: 'Grok 2 Vision' },
      { id: 'grok-3', name: 'Grok 3' },
      { id: 'grok-3-mini', name: 'Grok 3 Mini' },
      { id: 'grok-beta', name: 'Grok Beta' },
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
      { id: 'mistral-small-latest', name: 'Mistral Small' },
      { id: 'codestral-latest', name: 'Codestral' },
      { id: 'open-mixtral-8x7b', name: 'Mixtral 8×7B' },
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
      { id: 'llama-3.3-70b-versatile', name: 'LLaMA 3.3 70B' },
      { id: 'llama-3.1-8b-instant', name: 'LLaMA 3.1 8B Instant' },
      { id: 'llama-3.2-90b-vision-preview', name: 'LLaMA 3.2 90B Vision' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8×7B' },
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
      { id: 'command-r', name: 'Command R' },
      { id: 'command', name: 'Command' },
      { id: 'command-light', name: 'Command Light' },
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
      { id: 'sonar', name: 'Sonar' },
      { id: 'sonar-reasoning-pro', name: 'Sonar Reasoning Pro' },
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
      { id: 'llama3.1-70b', name: 'LLaMA 3.1 70B' },
      { id: 'llama3.1-8b', name: 'LLaMA 3.1 8B' },
      { id: 'llama3.3-70b', name: 'LLaMA 3.3 70B' },
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
      { id: 'accounts/fireworks/models/llama-v3p3-70b-instruct', name: 'LLaMA 3.3 70B' },
      { id: 'accounts/fireworks/models/deepseek-r1', name: 'DeepSeek R1' },
      { id: 'accounts/fireworks/models/mixtral-8x7b-instruct', name: 'Mixtral 8×7B' },
      { id: 'accounts/fireworks/models/qwen2p5-72b-instruct', name: 'Qwen 2.5 72B' },
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
      { id: 'meta-llama/Meta-Llama-3.1-70B-Instruct', name: 'LLaMA 3.1 70B' },
      { id: 'meta-llama/Meta-Llama-3.1-8B-Instruct', name: 'LLaMA 3.1 8B' },
      { id: 'mistralai/Mixtral-8x7B-Instruct-v0.1', name: 'Mixtral 8×7B' },
      { id: 'deepseek-ai/DeepSeek-R1', name: 'DeepSeek R1' },
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
      { id: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo', name: 'LLaMA 3.1 70B Turbo' },
      { id: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo', name: 'LLaMA 3.1 8B Turbo' },
      { id: 'mistralai/Mixtral-8x7B-Instruct-v0.1', name: 'Mixtral 8×7B' },
      { id: 'google/gemma-2-27b-it', name: 'Gemma 2 27B' },
      { id: 'deepseek-ai/DeepSeek-R1', name: 'DeepSeek R1' },
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
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'gpt-4', name: 'GPT-4' },
      { id: 'gpt-35-turbo', name: 'GPT-3.5 Turbo' },
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
      { id: 'anthropic.claude-3-5-sonnet-20241022-v2:0', name: 'Claude 3.5 Sonnet' },
      { id: 'anthropic.claude-3-haiku-20240307-v1:0', name: 'Claude 3 Haiku' },
      { id: 'amazon.titan-text-express-v1', name: 'Titan Text Express' },
      { id: 'meta.llama3-70b-instruct-v1:0', name: 'LLaMA 3 70B' },
      { id: 'mistral.mixtral-8x7b-instruct-v0:1', name: 'Mixtral 8×7B' },
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
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
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
  ProviderConfig | undefined
>

export function getProvider(id: string): ProviderConfig | undefined {
  return PROVIDER_MAP[id]
}

export function getModelReasoningEffortOptions(
  providerId: string,
  modelId: string,
): Array<'low' | 'medium' | 'high' | 'xhigh'> {
  const model = getProvider(providerId)?.models.find((entry) => entry.id === modelId)
  return model?.reasoningEffortOptions ?? []
}

export const DEFAULT_PROVIDER_ID = 'google'
