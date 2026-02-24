'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Button } from '@base-ui/react/button'
import { ChatMessage } from './ChatMessage'
import { LoadingDots } from './LoadingDots'
import { useStore } from '@/lib/store'
import { useLLM } from '@/contexts/llm-context'
import { getModelReasoningEffortOptions, getProvider } from '@/lib/providers'
import { Send, Settings, AlertTriangle, Globe, Mic, Square, XCircle } from 'lucide-react'

interface ChatProps {
  onOpenSettings: () => void
}

type BrowserSpeechRecognition = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript?: string }>> }) => void) | null
  onerror: ((event: { error?: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

export function Chat({ onOpenSettings }: ChatProps) {
  const [input, setInput] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [speechError, setSpeechError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const speechRecognitionRef = useRef<{ stop: () => void } | null>(null)
  const recordingBaseInputRef = useRef('')

  const {
    currentConversation,
    conversations,
    addConversation,
    editConversation,
  } = useStore()

  const {
    activeProviderId,
    activeModel,
    activeApiKey,
    activeExtraConfig,
    isConfigured,
    activeEnableWebSearch,
    activeReasoningEffort,
    audioInputEnabled,
  } = useLLM()

  const activeProvider = getProvider(activeProviderId)
  const reasoningEffortOptions = getModelReasoningEffortOptions(activeProviderId, activeModel)
  const supportsWebSearchTool = Boolean(activeProvider?.supportsTools)

  useEffect(() => {
    if (conversations.length === 0) {
      addConversation()
    }
  }, [conversations.length, addConversation])

  const { messages, sendMessage, status } = useChat({
    id: currentConversation ?? undefined,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: {
        provider: activeProviderId,
        apiKey: activeApiKey,
        model: activeModel,
        extraConfig: activeExtraConfig,
        enableWebSearch: activeEnableWebSearch,
        reasoningEffort: activeReasoningEffort,
      },
    }),
  })

  const isLoading = status === 'streaming' || status === 'submitted'
  const hasActiveWebSearchTool = messages.some((message) =>
    message.parts?.some((part) => part.type === 'tool-web_search'),
  )
  const speechRecognitionSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, scrollToBottom])

  // Auto-generate conversation title from first user message
  useEffect(() => {
    if (!currentConversation) return
    const conversation = conversations.find((c) => c.id === currentConversation)
    if (!conversation || conversation.title !== 'New conversation') return

    const firstUserMessage = messages.find((m) => m.role === 'user')
    if (firstUserMessage) {
      const textPart = firstUserMessage.parts?.find((p) => p.type === 'text')
      const text = textPart ? textPart.text : ''
      if (text) {
        const title = text.length > 30 ? text.slice(0, 30) + '...' : text
        editConversation(currentConversation, title)
      }
    }
  }, [messages, currentConversation, conversations, editConversation])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!input.trim() || isLoading || !isConfigured) return
      sendMessage({ text: input })
      setInput('')
    },
    [input, isLoading, isConfigured, sendMessage],
  )

  const stopRecording = useCallback((cancel = false) => {
    speechRecognitionRef.current?.stop()
    speechRecognitionRef.current = null
    setIsRecording(false)
    setRecordingSeconds(0)
    if (cancel) {
      setInput(recordingBaseInputRef.current)
    }
  }, [])

  const startRecording = useCallback(() => {
    if (!speechRecognitionSupported || isRecording) return

    const SpeechRecognitionCtor = (
      window as Window & {
        SpeechRecognition?: new () => BrowserSpeechRecognition
        webkitSpeechRecognition?: new () => BrowserSpeechRecognition
      }
    ).SpeechRecognition ??
      (
        window as Window & {
          webkitSpeechRecognition?: new () => BrowserSpeechRecognition
        }
      ).webkitSpeechRecognition

    if (!SpeechRecognitionCtor) {
      setSpeechError('Speech recognition is not available in this browser.')
      return
    }

    const recognition = new SpeechRecognitionCtor()
    recognition.lang = 'en-US'
    recognition.continuous = true
    recognition.interimResults = true
    recordingBaseInputRef.current = input
    setSpeechError('')
    setRecordingSeconds(0)

    recognition.onresult = (event) => {
      let transcript = ''
      for (let i = 0; i < event.results.length; i += 1) {
        transcript += event.results[i][0]?.transcript ?? ''
      }
      setInput(`${recordingBaseInputRef.current} ${transcript}`.trim())
    }

    recognition.onerror = (event) => {
      setSpeechError(event.error === 'not-allowed' ? 'Microphone access denied.' : 'Speech recognition failed.')
      setIsRecording(false)
    }

    recognition.onend = () => {
      setIsRecording(false)
    }

    speechRecognitionRef.current = recognition
    recognition.start()
    setIsRecording(true)
  }, [input, isRecording, speechRecognitionSupported])

  useEffect(() => {
    if (!isRecording) return
    const timer = window.setInterval(() => {
      setRecordingSeconds((prev) => prev + 1)
    }, 1000)
    return () => window.clearInterval(timer)
  }, [isRecording])

  useEffect(() => {
    return () => {
      speechRecognitionRef.current?.stop()
    }
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSubmit(e)
      }
    },
    [handleSubmit],
  )

  return (
    <div className="flex h-full flex-col bg-gray-900">
      {/* Provider badge */}
      <div className="absolute top-3 right-4 z-10 flex items-center gap-2">
        {isConfigured ? (
          <span className="rounded-full bg-gray-800 border border-gray-700 px-2.5 py-0.5 text-xs text-gray-400">
            {activeProvider?.badge ?? activeProviderId} · {activeModel}
            {reasoningEffortOptions.length > 0 && activeReasoningEffort ? ` · ${activeReasoningEffort}` : ''}
          </span>
        ) : (
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 rounded-full bg-amber-900/50 border border-amber-700/50 px-2.5 py-0.5 text-xs text-amber-300 hover:bg-amber-900 transition-colors"
          >
            <AlertTriangle className="h-3 w-3" />
            Configure provider
          </button>
        )}
        <button
          onClick={onOpenSettings}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors"
          aria-label="Open settings"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {supportsWebSearchTool && activeEnableWebSearch && (isLoading || hasActiveWebSearchTool) && (
        <div className="absolute top-12 right-4 z-10">
          <span className="inline-flex items-center gap-1 rounded-full border border-blue-700/50 bg-blue-900/40 px-2 py-0.5 text-[11px] text-blue-200">
            <Globe className="h-3 w-3" />
            Web search active
          </span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32 pt-12">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            {!isConfigured ? (
              <>
                <div className="rounded-xl border border-amber-800/40 bg-amber-950/20 px-6 py-5 max-w-sm">
                  <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto mb-3" />
                  <p className="text-sm text-amber-200 font-medium mb-1">No provider configured</p>
                  <p className="text-xs text-amber-400 mb-4">
                    Open Settings to add your API key and select a model.
                  </p>
                  <button
                    onClick={onOpenSettings}
                    className="w-full rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500 transition-colors"
                  >
                    Open Settings
                  </button>
                </div>
              </>
            ) : (
              <p className="text-gray-400 text-sm">Start a new conversation…</p>
            )}
          </div>
        ) : (
          messages.map((message) => {
            const textPart = message.parts?.find((p) => p.type === 'text')
            const text = textPart ? textPart.text : ''
            return (
              <ChatMessage
                key={message.id}
                content={text}
                type={message.role === 'user' ? 'user' : 'ai'}
              />
            )
          })
        )}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <ChatMessage content={<LoadingDots />} type="ai" isLoading />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input form */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-gray-800 fixed bottom-0 left-0 right-0 bg-gray-900 z-10 safe-bottom md:left-72"
      >
        <div className="flex gap-2 w-full p-4 items-center">
          {audioInputEnabled && (
            <Button
              type="button"
              disabled={!isConfigured || !speechRecognitionSupported || isLoading}
              onClick={startRecording}
              className="p-3 rounded-2xl border border-gray-700 text-gray-300 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              aria-label="Start voice input"
            >
              <Mic className="h-5 w-5" />
            </Button>
          )}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isConfigured ? 'Ask a question…' : 'Configure a provider in Settings first…'}
            disabled={!isConfigured}
            className="flex-1 resize-none rounded-2xl border border-gray-800 bg-gray-800 p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            rows={1}
            style={{ maxHeight: '150px' }}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim() || !isConfigured}
            className="p-3 rounded-2xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        {audioInputEnabled && isRecording && (
          <div className="px-4 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-red-300">
              <span className="inline-block h-2 w-2 rounded-full bg-red-400 animate-pulse" />
              Recording {Math.floor(recordingSeconds / 60).toString().padStart(2, '0')}:
              {(recordingSeconds % 60).toString().padStart(2, '0')}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={() => stopRecording(true)}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-700 px-2.5 py-1.5 text-xs text-gray-300 hover:bg-gray-800"
              >
                <XCircle className="h-3.5 w-3.5" />
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => stopRecording(false)}
                className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1.5 text-xs text-white hover:bg-red-500"
              >
                <Square className="h-3.5 w-3.5" />
                Stop
              </Button>
            </div>
          </div>
        )}
        {audioInputEnabled && speechError && (
          <div className="px-4 pb-3 text-xs text-amber-300">{speechError}</div>
        )}
        {audioInputEnabled && !speechRecognitionSupported && (
          <div className="px-4 pb-3 text-xs text-amber-300">
            Speech recognition is not supported in this browser.
          </div>
        )}
      </form>
    </div>
  )
}
