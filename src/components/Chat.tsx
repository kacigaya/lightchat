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
import { Send, Settings, AlertTriangle, Globe, Mic, Square, XCircle, Paperclip } from 'lucide-react'
import Image from 'next/image'

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

function hasSelectedFiles(files: FileList | null): files is FileList {
  return files !== null && files.length > 0
}

export function Chat({ onOpenSettings }: ChatProps) {
  const [input, setInput] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [speechError, setSpeechError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
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
    async (e: React.FormEvent) => {
      e.preventDefault()
      const hasText = Boolean(input.trim())
      const hasFiles = hasSelectedFiles(selectedFiles)
      if ((!hasText && !hasFiles) || isLoading || !isConfigured) return
      if (hasText) {
        await sendMessage(hasFiles ? { text: input, files: selectedFiles } : { text: input })
      } else if (hasFiles && selectedFiles) {
        await sendMessage({ files: selectedFiles })
      }
      setInput('')
      setSelectedFiles(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    },
    [input, isLoading, isConfigured, selectedFiles, sendMessage],
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
    <div className="flex h-full flex-col bg-white dark:bg-gray-950 transition-colors">

      {/* Top bar: provider badge + settings */}
      <div className="absolute top-3 right-4 z-10 flex items-center gap-2">
        {supportsWebSearchTool && activeEnableWebSearch && (isLoading || hasActiveWebSearchTool) && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 dark:border-blue-700/50 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 text-[11px] font-medium text-blue-600 dark:text-blue-300">
            <Globe className="h-3 w-3" />
            Web search
          </span>
        )}
        {isConfigured ? (
          <span className="rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2.5 py-1 text-xs text-gray-500 dark:text-gray-400">
            {activeProvider?.badge ?? activeProviderId} · {activeModel}
            {reasoningEffortOptions.length > 0 && activeReasoningEffort ? ` · ${activeReasoningEffort}` : ''}
          </span>
        ) : (
          <Button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-700/50 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors"
          >
            <AlertTriangle className="h-3 w-3" />
            Configure provider
          </Button>
        )}
        <Button
          onClick={onOpenSettings}
          className="rounded-lg p-1.5 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="Open settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 pb-28 pt-14">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
            {!isConfigured ? (
              /* No provider configured state */
              <div className="flex flex-col items-center gap-4 max-w-sm">
                <div className="h-16 w-16 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 flex items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-amber-500 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-1">
                    No provider configured
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                    Add your API key and select a model to start chatting.
                  </p>
                  <Button
                    onClick={onOpenSettings}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-600 transition-colors shadow-sm"
                  >
                    <Settings className="h-4 w-4" />
                    Open Settings
                  </Button>
                </div>
              </div>
            ) : (
              /* Ready to chat state */
              <div className="flex flex-col items-center gap-5">
                <div className="h-14 w-14 rounded-2xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/40 flex items-center justify-center shadow-sm">
                  <Image
                    src="/leaf.png"
                    alt="LightChat"
                    width={32}
                    height={32}
                    unoptimized
                    className="dark:brightness-0 dark:invert opacity-90"
                  />
                </div>
                <div>
                  <p className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                    How can I help you?
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    Ask anything — I&apos;m ready.
                  </p>
                </div>
              </div>
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
        className="fixed bottom-0 left-0 right-0 z-10 md:left-72 bg-white dark:bg-gray-950 transition-all"
      >
        {/* Recording status bar */}
        {audioInputEnabled && isRecording && (
          <div className="mx-4 mb-2 flex items-center justify-between rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 px-4 py-2">
            <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 font-medium">
              <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              Recording {Math.floor(recordingSeconds / 60).toString().padStart(2, '0')}:
              {(recordingSeconds % 60).toString().padStart(2, '0')}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={() => stopRecording(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <XCircle className="h-3.5 w-3.5" />
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => stopRecording(false)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-2.5 py-1.5 text-xs text-white hover:bg-red-500 transition-colors"
              >
                <Square className="h-3.5 w-3.5" />
                Stop
              </Button>
            </div>
          </div>
        )}

        {/* Speech error / unsupported */}
        {audioInputEnabled && speechError && (
          <div className="mx-4 mb-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-600 dark:text-amber-300">
            {speechError}
          </div>
        )}
        {audioInputEnabled && !speechRecognitionSupported && (
          <div className="mx-4 mb-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-600 dark:text-amber-300">
            Speech recognition is not supported in this browser.
          </div>
        )}

        {/* Selected files indicator */}
        {hasSelectedFiles(selectedFiles) && (
          <div className="mx-4 mb-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Paperclip className="h-3.5 w-3.5" />
            {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
            <Button
              type="button"
              onClick={() => {
                setSelectedFiles(null)
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
              className="text-red-400 hover:text-red-600 transition-colors"
            >
              <XCircle className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        {/* Main input container */}
        <div className="mx-4 mb-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg dark:shadow-gray-900/50 overflow-hidden transition-colors">
          <div className="flex items-end gap-0">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              multiple
              onChange={(e) => setSelectedFiles(e.target.files)}
              aria-label="Select images or PDF files"
              className="hidden"
            />

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isConfigured ? 'Ask a question…' : 'Configure a provider in Settings first…'}
              disabled={!isConfigured}
              className="flex-1 resize-none bg-transparent px-4 py-3.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              rows={1}
              style={{ maxHeight: '150px' }}
            />

            {/* Action buttons */}
            <div className="flex items-center gap-1 px-2 py-2">
              <Button
                type="button"
                disabled={!isConfigured || isLoading}
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-xl text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Attach files"
              >
                <Paperclip className="h-4 w-4" />
              </Button>

              {audioInputEnabled && (
                <Button
                  type="button"
                  disabled={!isConfigured || !speechRecognitionSupported || isLoading}
                  onClick={startRecording}
                  className="p-2 rounded-xl text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Start voice input"
                >
                  <Mic className={`h-4 w-4 ${isRecording ? 'text-red-500' : ''}`} />
                </Button>
              )}

              <Button
                type="submit"
                disabled={isLoading || (!input.trim() && !hasSelectedFiles(selectedFiles)) || !isConfigured}
                className="p-2 rounded-xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
