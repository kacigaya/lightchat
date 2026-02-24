'use client'

/**
 * SettingsModal
 * ─────────────
 * A full-featured settings panel for choosing an LLM provider, entering API
 * keys, selecting a model, and testing the connection.
 *
 * UI: Tailwind CSS dark theme, matching the rest of the app.
 * State: managed entirely through the LLMContext (persisted to localStorage).
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
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
import { PROVIDERS, getProvider, type ProviderConfig } from '@/lib/providers'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  isOpen: boolean
  onClose: () => void
}

type TestStatus = 'idle' | 'testing' | 'success' | 'error'

// ─── Sub-components ──────────────────────────────────────────────────────────

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-300 mb-1.5">
      {children}
    </label>
  )
}

function FieldInput({
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  className,
  rightSlot,
}: {
  id?: string
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
  rightSlot?: React.ReactNode
}) {
  return (
    <div className="relative">
      <input
        id={id}
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
    setActiveProvider,
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
      setTestStatus('idle')
      setTestError('')
      setIsSaved(false)
      setShowKey(false)
      setDraftKeyRemoved(false)
    },
    [settings],
  )

  // Re-sync when modal opens
  useEffect(() => {
    if (isOpen) syncDraft(activeProviderId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // Focus management refs
  const overlayRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  // Focus management: focus first interactive element on open; restore on close
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement
      const firstFocusable = panelRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      firstFocusable?.focus()
    } else {
      previousFocusRef.current?.focus()
    }
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
    })
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 2000)
  }, [draftProviderId, draftApiKey, draftModel, draftExtraConfig, draftKeyRemoved, setActiveProvider, updateProviderSettings, removeProviderKey])

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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={overlayRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === overlayRef.current) onClose()
          }}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18 }}
            className="relative w-full max-w-lg rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl"
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
              <div className="flex items-center gap-2 text-white">
                <Lock className="h-4 w-4 text-primary-400" />
                <h2 id="modal-title" className="text-base font-semibold">LLM Provider Settings</h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
                aria-label="Close settings"
              >
                <X className="h-5 w-5" />
              </button>
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
                <Label htmlFor="provider-select">Provider</Label>
                <div className="relative">
                  <select
                    id="provider-select"
                    value={draftProviderId}
                    onChange={(e) => syncDraft(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 pr-9 text-sm text-gray-100 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    {PROVIDERS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                        {p.requiresCloudCredentials ? ' (cloud credentials)' : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
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
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label htmlFor="api-key-input">{draftProvider?.apiKeyLabel ?? 'API Key'}</Label>
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
                <FieldInput
                  id="api-key-input"
                  type={showKey ? 'text' : 'password'}
                  value={draftApiKey}
                  onChange={(v) => {
                    setDraftApiKey(v)
                    setTestStatus('idle')
                  }}
                  placeholder={draftProvider?.apiKeyPlaceholder ?? '…'}
                  rightSlot={
                    <button
                      type="button"
                      onClick={() => setShowKey((s) => !s)}
                      className="text-gray-400 hover:text-gray-200 transition-colors"
                      aria-label={showKey ? 'Hide key' : 'Show key'}
                    >
                      {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />

                {/* Remove key button */}
                {hasApiKey && (
                  <button
                    onClick={handleRemoveKey}
                    className="mt-2 flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove key
                  </button>
                )}
              </div>

              {/* Extra config fields (Azure, Bedrock, Vertex, OpenAI-compatible…) */}
              {(draftProvider?.extraConfigFields ?? []).map((field) => (
                <div key={field.key}>
                  <Label htmlFor={`extra-${field.key}`}>
                    {field.label}
                    {field.required && <span className="ml-1 text-red-400">*</span>}
                  </Label>
                  <FieldInput
                    id={`extra-${field.key}`}
                    type={field.type}
                    value={draftExtraConfig[field.key] ?? ''}
                    onChange={(v) => {
                      setDraftExtraConfig((prev) => ({ ...prev, [field.key]: v }))
                      setTestStatus('idle')
                    }}
                    placeholder={field.placeholder}
                  />
                </div>
              ))}

              {/* Model selector */}
              {(draftProvider?.models.length ?? 0) > 0 ? (
                <div>
                  <Label htmlFor="model-select">Model</Label>
                  <div className="relative">
                    <select
                      id="model-select"
                      value={draftModel}
                      onChange={(e) => {
                        setDraftModel(e.target.value)
                        setTestStatus('idle')
                      }}
                      className="w-full appearance-none rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 pr-9 text-sm text-gray-100 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      {draftProvider?.models.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
              ) : (
                /* Only show free-form model input when no extraConfigFields covers modelId.
                   OpenAI-compatible providers expose modelId via extraConfigFields instead. */
                !(draftProvider?.extraConfigFields ?? []).some((f) => f.key === 'modelId') && (
                  <div>
                    <Label htmlFor="model-free">Model ID</Label>
                    <FieldInput
                      id="model-free"
                      value={draftModel}
                      onChange={(v) => {
                        setDraftModel(v)
                        setTestStatus('idle')
                      }}
                      placeholder="e.g. gpt-4o or llama-3"
                    />
                  </div>
                )
              )}

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
              <button
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
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setDraftKeyRemoved(false); onClose() }}
                  className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
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
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
