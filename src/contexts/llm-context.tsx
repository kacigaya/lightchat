'use client'

/**
 * LLM Context
 * -----------
 * Manages the active provider, per-provider API keys, extra configuration,
 * and selected model.  Everything is persisted to localStorage as JSON.
 *
 * ⚠ Security note
 * ───────────────
 * API keys are stored in **browser localStorage** (client-side only).
 * They are never sent to or stored on any server beyond the duration of a
 * single request.  This is appropriate for personal / local use.  Do NOT
 * use this pattern in a multi-tenant production application; instead store
 * secrets server-side (encrypted) and use session-scoped tokens.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { DEFAULT_PROVIDER_ID, getProvider } from '@/lib/providers'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProviderSettings {
  /** The user-supplied API key (or AWS access key ID for Bedrock). */
  apiKey: string
  /** The currently selected model ID for this provider. */
  model: string
  /**
   * Arbitrary extra fields indexed by the `key` defined in
   * `ProviderConfig.extraConfigFields`.
   * Examples: { resourceName: "my-azure" }, { baseURL: "https://…" }
   */
  extraConfig: Record<string, string>
  enableWebSearch?: boolean
  reasoningEffort?: 'low' | 'medium' | 'high' | 'xhigh'
}

/** Keyed by provider ID, e.g. { openai: { apiKey: "sk-…", model: "gpt-4o", extraConfig: {} } } */
export type LLMSettings = Record<string, ProviderSettings>

export interface TestResult {
  success: boolean
  error?: string
}

export interface LLMContextValue {
  /** Currently active provider ID */
  activeProviderId: string
  /** Currently selected model for the active provider */
  activeModel: string
  /** API key for the active provider */
  activeApiKey: string
  /** Extra config for the active provider */
  activeExtraConfig: Record<string, string>
  /** All stored settings, keyed by provider ID */
  settings: LLMSettings
  /** True when the active provider has a non-empty API key (or ADC-based) */
  isConfigured: boolean
  /** Web search toggle for the active provider */
  activeEnableWebSearch: boolean
  /** Reasoning effort for the active provider/model */
  activeReasoningEffort?: 'low' | 'medium' | 'high' | 'xhigh'
  /** Global browser speech-input toggle */
  audioInputEnabled: boolean

  /** Switch the active provider; pre-selects its first model if none saved */
  setActiveProvider: (providerId: string) => void
  /** Merge partial settings for a provider */
  updateProviderSettings: (providerId: string, partial: Partial<ProviderSettings>) => void
  /** Wipe the API key for a provider */
  removeProviderKey: (providerId: string) => void
  /** Return saved settings for any provider */
  getProviderSettings: (providerId: string) => ProviderSettings | undefined
  /** Toggle global browser speech-input */
  setAudioInputEnabled: (enabled: boolean) => void

  /**
   * Fires a lightweight POST /api/chat/test request with the current config.
   * Returns { success: true } or { success: false, error: "…" }.
   */
  testConnection: () => Promise<TestResult>
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SETTINGS_KEY = 'lightchat-llm-settings'
const ACTIVE_PROVIDER_KEY = 'lightchat-active-provider'
const AUDIO_INPUT_ENABLED_KEY = 'lightchat-audio-input-enabled'

// ─── Context ─────────────────────────────────────────────────────────────────

const LLMContext = createContext<LLMContextValue | null>(null)

// ─── Provider component ──────────────────────────────────────────────────────

export function LLMProvider({ children }: { children: React.ReactNode }) {
  const [activeProviderId, setActiveProviderIdState] = useState<string>(DEFAULT_PROVIDER_ID)
  const [settings, setSettings] = useState<LLMSettings>({})
  const [audioInputEnabled, setAudioInputEnabledState] = useState(true)
  const [hydrated, setHydrated] = useState(false)

  // Load from localStorage on first mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY)
      if (raw) {
        const parsed: unknown = JSON.parse(raw)
        if (
          parsed !== null &&
          typeof parsed === 'object' &&
          !Array.isArray(parsed) &&
          Object.values(parsed as Record<string, unknown>).every(
            (entry) =>
              entry !== null &&
              typeof entry === 'object' &&
              typeof (entry as Record<string, unknown>).apiKey === 'string' &&
              typeof (entry as Record<string, unknown>).model === 'string' &&
              typeof (entry as Record<string, unknown>).extraConfig === 'object' &&
              ((entry as Record<string, unknown>).enableWebSearch === undefined ||
                typeof (entry as Record<string, unknown>).enableWebSearch === 'boolean') &&
              ((entry as Record<string, unknown>).reasoningEffort === undefined ||
                ['low', 'medium', 'high', 'xhigh'].includes(
                  String((entry as Record<string, unknown>).reasoningEffort),
                )),
          )
        ) {
          setSettings(parsed as LLMSettings)
        }
        // If validation fails, fall back to defaults silently
      }

      const storedProvider = localStorage.getItem(ACTIVE_PROVIDER_KEY)
      if (storedProvider && typeof storedProvider === 'string' && storedProvider.length > 0) {
        setActiveProviderIdState(storedProvider)
      }

      const storedAudioInputEnabled = localStorage.getItem(AUDIO_INPUT_ENABLED_KEY)
      if (storedAudioInputEnabled === 'true' || storedAudioInputEnabled === 'false') {
        setAudioInputEnabledState(storedAudioInputEnabled === 'true')
      }
    } catch {
      // localStorage unavailable or corrupt – fall back to defaults silently
    }
    setHydrated(true)
  }, [])

  // Persist settings whenever they change (after hydration)
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    } catch {
      console.warn('[LLMContext] Could not persist settings to localStorage.')
    }
  }, [settings, hydrated])

  // Persist active provider
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(ACTIVE_PROVIDER_KEY, activeProviderId)
    } catch {
      // ignore
    }
  }, [activeProviderId, hydrated])

  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(AUDIO_INPUT_ENABLED_KEY, String(audioInputEnabled))
    } catch {
      // ignore
    }
  }, [audioInputEnabled, hydrated])

  // ── Actions ────────────────────────────────────────────────────────────────

  const setActiveProvider = useCallback(
    (providerId: string) => {
      setActiveProviderIdState(providerId)
      // Auto-select first model if none stored for this provider
      const provider = getProvider(providerId)
      if (provider && provider.models.length > 0 && !settings[providerId]?.model) {
        setSettings((prev) => ({
          ...prev,
            [providerId]: {
              apiKey: prev[providerId]?.apiKey ?? '',
              model: provider.models[0].id,
              extraConfig: prev[providerId]?.extraConfig ?? {},
              enableWebSearch: prev[providerId]?.enableWebSearch ?? false,
              reasoningEffort: prev[providerId]?.reasoningEffort,
            },
          }))
      }
    },
    [settings],
  )

  const updateProviderSettings = useCallback(
    (providerId: string, partial: Partial<ProviderSettings>) => {
      setSettings((prev) => {
        const existing = prev[providerId]
        const provider = getProvider(providerId)
        const defaultModel = provider?.models[0]?.id ?? ''
        // Merge extraConfig deeply so callers can update individual keys
        const mergedExtraConfig =
          partial.extraConfig !== undefined
            ? { ...(existing?.extraConfig ?? {}), ...partial.extraConfig }
            : (existing?.extraConfig ?? {})
        return {
          ...prev,
          [providerId]: {
            apiKey: existing?.apiKey ?? '',
            model: existing?.model ?? defaultModel,
            ...partial,
            extraConfig: mergedExtraConfig,
            enableWebSearch:
              partial.enableWebSearch ?? existing?.enableWebSearch ?? false,
            reasoningEffort:
              'reasoningEffort' in partial
                ? partial.reasoningEffort
                : existing?.reasoningEffort,
          },
        }
      })
    },
    [],
  )

  const removeProviderKey = useCallback((providerId: string) => {
    setSettings((prev) => ({
      ...prev,
      [providerId]: {
        ...prev[providerId],
        apiKey: '',
        extraConfig: prev[providerId]?.extraConfig ?? {},
        model: prev[providerId]?.model ?? '',
        enableWebSearch: prev[providerId]?.enableWebSearch ?? false,
        reasoningEffort: prev[providerId]?.reasoningEffort,
      },
    }))
  }, [])

  const getProviderSettings = useCallback(
    (providerId: string): ProviderSettings | undefined => settings[providerId],
    [settings],
  )

  // ── Derived values ─────────────────────────────────────────────────────────

  const activeSettings = settings[activeProviderId]
  const activeApiKey = activeSettings?.apiKey ?? ''
  const activeExtraConfig = activeSettings?.extraConfig ?? {}
  const activeProvider = getProvider(activeProviderId)
  const activeModel =
    activeSettings?.model ?? (activeProvider?.models[0]?.id ?? '')
  const activeEnableWebSearch = activeSettings?.enableWebSearch ?? false
  const activeReasoningEffort = activeSettings?.reasoningEffort

  // Vertex can use Application Default Credentials without an explicit key
  const isConfigured =
    Boolean(activeApiKey) || activeProviderId === 'google-vertex'

  // ── Test connection ────────────────────────────────────────────────────────

  const testConnection = useCallback(async (): Promise<TestResult> => {
    if (!activeApiKey && activeProviderId !== 'google-vertex') {
      return { success: false, error: 'No API key configured for this provider.' }
    }
    try {
      const res = await fetch('/api/chat/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: activeProviderId,
          apiKey: activeApiKey,
          model: activeModel,
          extraConfig: activeExtraConfig,
        }),
      })
      const data = (await res.json()) as { success?: boolean; error?: string }
      if (res.ok && data.success) return { success: true }
      return { success: false, error: data.error ?? `HTTP ${res.status}` }
    } catch (err) {
      return { success: false, error: `Network error: ${String(err)}` }
    }
  }, [activeProviderId, activeApiKey, activeModel, activeExtraConfig])

  // ── Context value ──────────────────────────────────────────────────────────

  const value: LLMContextValue = {
    activeProviderId,
    activeModel,
    activeApiKey,
    activeExtraConfig,
    settings,
    isConfigured,
    activeEnableWebSearch,
    activeReasoningEffort,
    audioInputEnabled,
    setActiveProvider,
    updateProviderSettings,
    removeProviderKey,
    getProviderSettings,
    setAudioInputEnabled: setAudioInputEnabledState,
    testConnection,
  }

  return <LLMContext.Provider value={value}>{children}</LLMContext.Provider>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useLLM(): LLMContextValue {
  const ctx = useContext(LLMContext)
  if (!ctx) throw new Error('useLLM must be used inside <LLMProvider>.')
  return ctx
}
