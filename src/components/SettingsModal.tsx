'use client'

/**
 * SettingsModal
 * ─────────────
 * A full-featured settings panel for choosing an LLM provider, entering API
 * keys, selecting a model, and testing the connection.
 *
 * UI: Tailwind CSS dark theme + Base UI headless primitives for accessibility.
 * State: managed entirely through the LLMContext (persisted to localStorage).
 */

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@base-ui/react/button'
import { Dialog } from '@base-ui/react/dialog'
import { Field } from '@base-ui/react/field'
import { Input } from '@base-ui/react/input'
import { Select } from '@base-ui/react/select'
import { Switch } from '@base-ui/react/switch'
import {
  AlertTriangle,
  Brain,
  Check,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  ShieldAlert,
  Trash2,
  X,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLLM } from '@/contexts/llm-context'
import {
  PROVIDERS,
  getModelReasoningEffortOptions,
  getProvider,
  type ProviderConfig,
} from '@/lib/providers'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  isOpen: boolean
  onClose: () => void
}

type TestStatus = 'idle' | 'testing' | 'success' | 'error'

// ─── Constants ───────────────────────────────────────────────────────────────

const LABEL_CLASS = 'text-sm font-medium text-gray-300'

// ─── Sub-components ──────────────────────────────────────────────────────────

function SelectLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className={`block ${LABEL_CLASS} mb-1.5`}>
      {children}
    </label>
  )
}

function InputWithSlot({
  type = 'text',
  value,
  onChange,
  placeholder,
  className,
  rightSlot,
}: {
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
  rightSlot?: React.ReactNode
}) {
  return (
    <div className="relative">
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100',
          'placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500',
          rightSlot ? 'pr-10' : '',
          className,
        )}
      />
      {rightSlot && (
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2">{rightSlot}</div>
      )}
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export function SettingsModal({ isOpen, onClose }: Props) {
  const {
    activeProviderId,
    settings,
    audioInputEnabled,
    setActiveProvider,
    setAudioInputEnabled,
    updateProviderSettings,
    removeProviderKey,
  } = useLLM()

  // ── Local "draft" state so changes are only applied on Save ───────────────

  const [draftProviderId, setDraftProviderId] = useState(activeProviderId)
  const draftProvider: ProviderConfig | undefined = getProvider(draftProviderId)

  const draftSaved = settings[draftProviderId]
  const [draftApiKey, setDraftApiKey] = useState(draftSaved?.apiKey ?? '')
  const [draftModel, setDraftModel] = useState(
    draftSaved?.model ?? draftProvider?.models[0]?.id ?? '',
  )
  const [draftExtraConfig, setDraftExtraConfig] = useState<Record<string, string>>(
    draftSaved?.extraConfig ?? {},
  )
  const [draftEnableWebSearch, setDraftEnableWebSearch] = useState(
    draftSaved?.enableWebSearch ?? false,
  )
  const [draftReasoningEffort, setDraftReasoningEffort] = useState<
    'low' | 'medium' | 'high' | 'xhigh' | ''
  >(draftSaved?.reasoningEffort ?? '')
  const [draftAudioInputEnabled, setDraftAudioInputEnabled] = useState(audioInputEnabled)

  const [showKey, setShowKey] = useState(false)
  const [testStatus, setTestStatus] = useState<TestStatus>('idle')
  const [testError, setTestError] = useState('')
  const [isSaved, setIsSaved] = useState(false)
  const [draftKeyRemoved, setDraftKeyRemoved] = useState(false)

  // Re-sync draft when user switches provider in the dropdown
  const syncDraft = useCallback(
    (providerId: string) => {
      const saved = settings[providerId]
      const provider = getProvider(providerId)
      setDraftProviderId(providerId)
      setDraftApiKey(saved?.apiKey ?? '')
      setDraftModel(saved?.model ?? provider?.models[0]?.id ?? '')
      setDraftExtraConfig(saved?.extraConfig ?? {})
      setDraftEnableWebSearch(saved?.enableWebSearch ?? false)
      setDraftReasoningEffort(saved?.reasoningEffort ?? '')
      setDraftAudioInputEnabled(audioInputEnabled)
      setTestStatus('idle')
      setTestError('')
      setIsSaved(false)
      setShowKey(false)
      setDraftKeyRemoved(false)
    },
    [settings, audioInputEnabled],
  )

  // Re-sync when modal opens
  useEffect(() => {
    if (isOpen) syncDraft(activeProviderId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleSave = useCallback(() => {
    // Commit draft to context (which persists to localStorage)
    setActiveProvider(draftProviderId)
    if (draftKeyRemoved) {
      removeProviderKey(draftProviderId)
      setDraftKeyRemoved(false)
    }
    updateProviderSettings(draftProviderId, {
      apiKey: draftApiKey,
      model: draftModel,
      extraConfig: draftExtraConfig,
      enableWebSearch: draftEnableWebSearch,
      reasoningEffort: draftReasoningEffort || undefined,
    })
    setAudioInputEnabled(draftAudioInputEnabled)
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 2000)
  }, [draftProviderId, draftApiKey, draftModel, draftExtraConfig, draftEnableWebSearch, draftReasoningEffort, draftAudioInputEnabled, draftKeyRemoved, setActiveProvider, setAudioInputEnabled, updateProviderSettings, removeProviderKey])

  const handleRemoveKey = useCallback(() => {
    setDraftApiKey('')
    setTestStatus('idle')
    setDraftKeyRemoved(true)
  }, [])

  const handleTest = useCallback(async () => {
    setTestStatus('testing')
    setTestError('')

    // Small delay to allow any pending state updates to flush
    await new Promise((r) => setTimeout(r, 50))

    // Test directly with current draft values to avoid stale closure over active* state
    try {
      const res = await fetch('/api/chat/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: draftProviderId,
          apiKey: draftApiKey,
          model: draftModel,
          extraConfig: draftExtraConfig,
        }),
      })
      const data = (await res.json()) as { success?: boolean; error?: string }
      if (res.ok && data.success) {
        setTestStatus('success')
      } else {
        setTestStatus('error')
        setTestError(data.error ?? `HTTP ${res.status}`)
      }
    } catch (err) {
      setTestStatus('error')
      setTestError(`Network error: ${String(err)}`)
    }
  }, [
    draftProviderId,
    draftApiKey,
    draftModel,
    draftExtraConfig,
  ])

  // ── Render ────────────────────────────────────────────────────────────────

  const hasApiKey = draftApiKey.trim().length > 0
  const reasoningEffortOptions = getModelReasoningEffortOptions(draftProviderId, draftModel)

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setDraftKeyRemoved(false)
          onClose()
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-150 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl transition-all duration-[180ms] data-[starting-style]:opacity-0 data-[starting-style]:scale-[0.96] data-[ending-style]:opacity-0 data-[ending-style]:scale-[0.96]">
            {/* ── Header ── */}
            <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
              <div className="flex items-center gap-2 text-white">
                <Lock className="h-4 w-4 text-primary-400" />
                <Dialog.Title className="text-base font-semibold">LLM Provider Settings</Dialog.Title>
              </div>
              <Dialog.Close
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
                aria-label="Close settings"
              >
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>

            {/* ── Body ── */}
            <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">

              {/* Security notice */}
              <div className="flex gap-3 rounded-lg border border-amber-800/50 bg-amber-950/30 px-3 py-2.5 text-xs text-amber-300">
                <ShieldAlert className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-400" />
                <span>
                  API keys are stored in <strong>browser localStorage</strong> (client-side only)
                  and sent over HTTPS to your Next.js API route for each request. Never share your
                  browser profile or exported storage. For shared / production deployments use
                  server-side secret management instead.
                </span>
              </div>

              {/* Provider selector */}
              <div>
                <SelectLabel>Provider</SelectLabel>
                <Select.Root value={draftProviderId} onValueChange={(value) => { if (value) syncDraft(value) }}>
                  <Select.Trigger className="w-full flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 hover:border-gray-600 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer transition-colors">
                    <Select.Value />
                    <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Positioner sideOffset={4} alignItemWithTrigger={false}>
                      <Select.Popup className="z-[200] max-h-60 overflow-y-auto rounded-lg border border-gray-700 bg-gray-800 py-1 shadow-xl">
                        {PROVIDERS.map((p) => (
                          <Select.Item
                            key={p.id}
                            value={p.id}
                            className="flex cursor-pointer items-center justify-between px-3 py-2 text-sm text-gray-100 outline-none hover:bg-gray-700 data-[highlighted]:bg-gray-700 data-[selected]:text-primary-400"
                          >
                            <Select.ItemText>
                              {p.name}{p.requiresCloudCredentials ? ' (cloud credentials)' : ''}
                            </Select.ItemText>
                            <Select.ItemIndicator>
                              <Check className="h-3.5 w-3.5 text-primary-400 ml-2" />
                            </Select.ItemIndicator>
                          </Select.Item>
                        ))}
                      </Select.Popup>
                    </Select.Positioner>
                  </Select.Portal>
                </Select.Root>
              </div>

              {/* Cloud-credentials warning */}
              {draftProvider?.requiresCloudCredentials && (
                <div className="flex gap-3 rounded-lg border border-blue-800/50 bg-blue-950/30 px-3 py-2.5 text-xs text-blue-300">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5 text-blue-400" />
                  <span>
                    This provider uses cloud IAM credentials rather than a simple API key.
                    Fill in all required fields below; some providers also require additional
                    environment setup on the server (e.g. ADC for Vertex AI).
                  </span>
                </div>
              )}

              {/* API Key */}
              <Field.Root>
                <div className="flex items-center justify-between mb-1.5">
                  <Field.Label className={LABEL_CLASS}>
                    {draftProvider?.apiKeyLabel ?? 'API Key'}
                  </Field.Label>
                  {draftProvider?.docsUrl && (
                    <a
                      href={draftProvider.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 transition-colors"
                    >
                      Get key <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <InputWithSlot
                  type={showKey ? 'text' : 'password'}
                  value={draftApiKey}
                  onChange={(v) => {
                    setDraftApiKey(v)
                    setTestStatus('idle')
                  }}
                  placeholder={draftProvider?.apiKeyPlaceholder ?? '…'}
                  rightSlot={
                    <Button
                      type="button"
                      onClick={() => setShowKey((s) => !s)}
                      className="text-gray-400 hover:text-gray-200 transition-colors"
                      aria-label={showKey ? 'Hide key' : 'Show key'}
                    >
                      {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  }
                />

                {/* Remove key button */}
                {hasApiKey && (
                  <Button
                    onClick={handleRemoveKey}
                    className="mt-2 flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove key
                  </Button>
                )}
              </Field.Root>

              {/* Extra config fields (Azure, Bedrock, Vertex, OpenAI-compatible…) */}
              {(draftProvider?.extraConfigFields ?? []).map((field) => (
                <Field.Root key={field.key}>
                  <Field.Label className={`block ${LABEL_CLASS} mb-1.5`}>
                    {field.label}
                    {field.required && <span className="ml-1 text-red-400">*</span>}
                  </Field.Label>
                  <InputWithSlot
                    type={field.type}
                    value={draftExtraConfig[field.key] ?? ''}
                    onChange={(v) => {
                      setDraftExtraConfig((prev) => ({ ...prev, [field.key]: v }))
                      setTestStatus('idle')
                    }}
                    placeholder={field.placeholder}
                  />
                </Field.Root>
              ))}

              {/* Model selector */}
              {(draftProvider?.models.length ?? 0) > 0 ? (
                <div>
                  <SelectLabel>Model</SelectLabel>
                  <Select.Root
                    value={draftModel}
                    onValueChange={(value) => {
                      if (!value) return
                      setDraftModel(value)
                      const nextOptions = getModelReasoningEffortOptions(draftProviderId, value)
                      if (nextOptions.length === 0) {
                        setDraftReasoningEffort('')
                      } else if (
                        !draftReasoningEffort ||
                        !nextOptions.includes(draftReasoningEffort as 'low' | 'medium' | 'high' | 'xhigh')
                      ) {
                        setDraftReasoningEffort(
                          nextOptions.includes('medium') ? 'medium' : nextOptions[0],
                        )
                      }
                      setTestStatus('idle')
                    }}
                  >
                    <Select.Trigger className="w-full flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 hover:border-gray-600 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer transition-colors">
                      <Select.Value />
                      <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Positioner sideOffset={4} alignItemWithTrigger={false}>
                        <Select.Popup className="z-[200] max-h-60 overflow-y-auto rounded-lg border border-gray-700 bg-gray-800 py-1 shadow-xl">
                          {draftProvider?.models.map((m) => (
                            <Select.Item
                              key={m.id}
                              value={m.id}
                              className="flex cursor-pointer items-center justify-between px-3 py-2 text-sm text-gray-100 outline-none hover:bg-gray-700 data-[highlighted]:bg-gray-700 data-[selected]:text-primary-400"
                            >
                              <Select.ItemText>{m.name}</Select.ItemText>
                              <Select.ItemIndicator>
                                <Check className="h-3.5 w-3.5 text-primary-400 ml-2" />
                              </Select.ItemIndicator>
                            </Select.Item>
                          ))}
                        </Select.Popup>
                      </Select.Positioner>
                    </Select.Portal>
                  </Select.Root>
                </div>
              ) : (
                /* Only show free-form model input when no extraConfigFields covers modelId.
                   OpenAI-compatible providers expose modelId via extraConfigFields instead. */
                !(draftProvider?.extraConfigFields ?? []).some((f) => f.key === 'modelId') && (
                  <Field.Root>
                    <Field.Label className={`block ${LABEL_CLASS} mb-1.5`}>
                      Model ID
                    </Field.Label>
                    <InputWithSlot
                      value={draftModel}
                      onChange={(v) => {
                        setDraftModel(v)
                        setTestStatus('idle')
                      }}
                      placeholder="e.g. gpt-4o or llama-3"
                    />
                  </Field.Root>
                )
              )}

              {/* Advanced model/runtime options */}
              <div className="space-y-4 rounded-lg border border-gray-800 bg-gray-850/40 px-3 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Advanced</p>

                <Field.Root>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Field.Label className={LABEL_CLASS}>Enable Web Search</Field.Label>
                      <p className="mt-1 text-xs text-gray-500">
                        Allow supported models to call the <code>web_search</code> tool.
                      </p>
                    </div>
                    <Switch.Root
                      checked={draftEnableWebSearch}
                      onCheckedChange={setDraftEnableWebSearch}
                      className="relative inline-flex h-6 w-10 items-center rounded-full bg-gray-700 data-[checked]:bg-primary-600 transition-colors"
                    >
                      <Switch.Thumb className="h-4 w-4 translate-x-1 rounded-full bg-white transition-transform data-[checked]:translate-x-5" />
                    </Switch.Root>
                  </div>
                </Field.Root>

                <Field.Root>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Field.Label className={LABEL_CLASS}>Enable Audio Input</Field.Label>
                      <p className="mt-1 text-xs text-gray-500">
                        Show microphone controls and use browser speech recognition.
                      </p>
                    </div>
                    <Switch.Root
                      checked={draftAudioInputEnabled}
                      onCheckedChange={setDraftAudioInputEnabled}
                      className="relative inline-flex h-6 w-10 items-center rounded-full bg-gray-700 data-[checked]:bg-primary-600 transition-colors"
                    >
                      <Switch.Thumb className="h-4 w-4 translate-x-1 rounded-full bg-white transition-transform data-[checked]:translate-x-5" />
                    </Switch.Root>
                  </div>
                </Field.Root>

                {reasoningEffortOptions.length > 0 && (
                  <Field.Root>
                    <Field.Label className={`flex items-center gap-2 ${LABEL_CLASS} mb-1.5`}>
                      <Brain className="h-4 w-4 text-primary-400" />
                      Reasoning Effort
                    </Field.Label>
                    <Select.Root
                      value={
                        draftReasoningEffort ||
                        (reasoningEffortOptions.includes('medium')
                          ? 'medium'
                          : reasoningEffortOptions[0])
                      }
                      onValueChange={(value) => {
                        if (value) setDraftReasoningEffort(value as 'low' | 'medium' | 'high' | 'xhigh')
                      }}
                    >
                      <Select.Trigger className="w-full flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 hover:border-gray-600 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer transition-colors">
                        <Select.Value />
                        <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Positioner sideOffset={4} alignItemWithTrigger={false}>
                          <Select.Popup className="z-[200] max-h-60 overflow-y-auto rounded-lg border border-gray-700 bg-gray-800 py-1 shadow-xl">
                            {reasoningEffortOptions.map((option) => (
                              <Select.Item
                                key={option}
                                value={option}
                                className="flex cursor-pointer items-center justify-between px-3 py-2 text-sm text-gray-100 outline-none hover:bg-gray-700 data-[highlighted]:bg-gray-700 data-[selected]:text-primary-400"
                              >
                                <Select.ItemText>
                                  {option === 'xhigh' ? 'X-High' : option[0].toUpperCase() + option.slice(1)}
                                </Select.ItemText>
                                <Select.ItemIndicator>
                                  <Check className="h-3.5 w-3.5 text-primary-400 ml-2" />
                                </Select.ItemIndicator>
                              </Select.Item>
                            ))}
                          </Select.Popup>
                        </Select.Positioner>
                      </Select.Portal>
                    </Select.Root>
                  </Field.Root>
                )}
              </div>

              {/* Test connection result */}
              {testStatus === 'success' && (
                <div className="flex items-center gap-2 rounded-lg bg-green-950/40 border border-green-800/50 px-3 py-2 text-sm text-green-300">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-400" />
                  Connection successful — credentials are valid.
                </div>
              )}
              {testStatus === 'error' && (
                <div className="flex items-start gap-2 rounded-lg bg-red-950/40 border border-red-800/50 px-3 py-2 text-sm text-red-300">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5 text-red-400" />
                  <span className="break-all">{testError}</span>
                </div>
              )}
            </div>

            {/* ── Footer ── */}
            <div className="flex items-center justify-between border-t border-gray-800 px-6 py-4 gap-3">
              {/* Test button */}
              <Button
                onClick={handleTest}
                disabled={(!hasApiKey && draftProviderId !== 'google-vertex') || testStatus === 'testing'}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                  'border border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white',
                  'disabled:opacity-40 disabled:cursor-not-allowed',
                )}
              >
                {testStatus === 'testing' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                {testStatus === 'testing' ? 'Testing…' : 'Test connection'}
              </Button>

              <div className="flex items-center gap-3">
                <Dialog.Close
                  className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </Dialog.Close>
                <Button
                  onClick={handleSave}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                    isSaved
                      ? 'bg-green-600 text-white'
                      : 'bg-primary-600 text-white hover:bg-primary-500',
                  )}
                >
                  {isSaved ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" /> Saved!
                    </>
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
            </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
