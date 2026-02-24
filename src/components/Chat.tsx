'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { ChatMessage } from './ChatMessage'
import { LoadingDots } from './LoadingDots'
import { useStore } from '@/lib/store'
import { useLLM } from '@/contexts/llm-context'
import { getProvider } from '@/lib/providers'
import { Send, Settings, AlertTriangle } from 'lucide-react'
import { Button } from '@base-ui/react/button'

interface ChatProps {
  onOpenSettings: () => void
}

export function Chat({ onOpenSettings }: ChatProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
  } = useLLM()

  const activeProvider = getProvider(activeProviderId)

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
      },
    }),
  })

  const isLoading = status === 'streaming' || status === 'submitted'

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
          </span>
        ) : (
          // CHANGED: native button → Base UI Button
          <Button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 rounded-full bg-amber-900/50 border border-amber-700/50 px-2.5 py-0.5 text-xs text-amber-300 hover:bg-amber-900 transition-colors"
          >
            <AlertTriangle className="h-3 w-3" />
            Configure provider
          </Button>
        )}
        {/* CHANGED: native button → Base UI Button */}
        <Button
          onClick={onOpenSettings}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors"
          aria-label="Open settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

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
                  {/* CHANGED: native button → Base UI Button */}
                  <Button
                    onClick={onOpenSettings}
                    className="w-full rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500 transition-colors"
                  >
                    Open Settings
                  </Button>
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
          {/* CHANGED: native button → Base UI Button */}
          <Button
            type="submit"
            disabled={isLoading || !input.trim() || !isConfigured}
            className="p-3 rounded-2xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </form>
    </div>
  )
}
