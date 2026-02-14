'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { ChatMessage } from './ChatMessage'
import { LoadingDots } from './LoadingDots'
import { useStore } from '@/lib/store'
import { Send } from 'lucide-react'

export function Chat() {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { currentConversation, conversations, addConversation, selectedModel, editConversation } = useStore()

  useEffect(() => {
    if (conversations.length === 0) {
      addConversation()
    }
  }, [conversations.length, addConversation])

  const {
    messages,
    sendMessage,
    status,
  } = useChat({
    id: currentConversation ?? undefined,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { model: selectedModel },
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
      if (!input.trim() || isLoading) return
      sendMessage({ text: input })
      setInput('')
    },
    [input, isLoading, sendMessage]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSubmit(e)
      }
    },
    [handleSubmit]
  )

  return (
    <div className="flex h-full flex-col bg-gray-900">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32 pt-12">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            Start a new conversation...
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
            placeholder="Ask a question..."
            className="flex-1 resize-none rounded-2xl border border-gray-800 bg-gray-800 p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            rows={1}
            style={{ maxHeight: '150px' }}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-3 rounded-2xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  )
}
