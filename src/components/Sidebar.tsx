'use client'

import { Plus, X, Pencil, Check, MessageSquare, Github, Settings } from 'lucide-react'
import { Button } from '@base-ui/react/button'
import { Input } from '@base-ui/react/input'
import { Tooltip } from '@base-ui/react/tooltip'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { useState } from 'react'
import { useLLM } from '@/contexts/llm-context'
import { getProvider } from '@/lib/providers'

interface Conversation {
  id: string
  title: string
  timestamp: Date
}

interface SidebarProps {
  conversations: Conversation[]
  currentConversation: string | null
  onNewChat: () => void
  onSelectChat: (id: string) => void
  onDeleteChat: (id: string) => void
  onEditChat: (id: string, title: string) => void
  isMobileOpen: boolean
  onCloseMobile: () => void
  onOpenSettings: () => void
}

export function Sidebar({
  conversations,
  currentConversation,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onEditChat,
  isMobileOpen,
  onCloseMobile,
  onOpenSettings,
}: SidebarProps) {
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  const { activeProviderId, activeModel, isConfigured } = useLLM()
  const activeProvider = getProvider(activeProviderId)

  const handleEditClick = (chat: Conversation) => {
    setEditingChatId(chat.id)
    setEditingTitle(chat.title)
  }

  const handleSaveEdit = (chatId: string) => {
    if (editingTitle.trim()) {
      onEditChat(chatId, editingTitle.trim())
      setEditingChatId(null)
      setEditingTitle('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, chatId: string) => {
    if (e.key === 'Enter') {
      handleSaveEdit(chatId)
    } else if (e.key === 'Escape') {
      setEditingChatId(null)
      setEditingTitle('')
    }
  }

  return (
    <Tooltip.Provider delay={400}>
      <aside
        className={cn(
          'fixed left-0 top-0 bottom-0 z-30 flex w-72 flex-col bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 transition-transform duration-300 md:relative md:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Mobile close button */}
          <div className="flex-shrink-0 flex items-center justify-end p-2 md:hidden">
            <Button
              onClick={onCloseMobile}
              className="rounded-lg p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Logo area */}
          <div className="flex-shrink-0 px-4 pt-5 pb-4">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800/40 flex items-center justify-center">
                <Image
                  src="/leaf.png"
                  alt="LightChat Logo"
                  width={18}
                  height={18}
                  priority
                  unoptimized
                  className="dark:brightness-0 dark:invert"
                />
              </div>
              <h1 className="text-base font-semibold tracking-tight text-gray-900 dark:text-white">
                LightChat
              </h1>
            </div>

            <Button
              onClick={onNewChat}
              className="flex w-full items-center gap-2.5 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 px-3 py-2.5 text-sm text-gray-500 dark:text-gray-400 hover:border-primary-300 dark:hover:border-primary-700 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
            >
              <Plus className="h-4 w-4" />
              New conversation
            </Button>
          </div>

          {/* Conversation list */}
          <nav className="flex-1 overflow-y-auto px-3 pb-2">
            {conversations.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-gray-500 px-2 py-3 text-center">
                No conversations yet
              </p>
            ) : (
              <ul className="space-y-0.5">
                <AnimatePresence initial={false}>
                  {conversations.map((chat) => {
                    const isActive = currentConversation === chat.id
                    const isEditing = editingChatId === chat.id
                    return (
                      <motion.li
                        key={chat.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <div
                          onClick={() => !isEditing && onSelectChat(chat.id)}
                          className={cn(
                            'group flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm transition-all',
                            isActive
                              ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border border-primary-100 dark:border-primary-800/40'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200',
                          )}
                        >
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <MessageSquare className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-primary-500 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500')} />
                            {isEditing ? (
                              <Input
                                type="text"
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, chat.id)}
                                onClick={(e) => e.stopPropagation()}
                                className="flex-1 bg-transparent border-b border-primary-300 dark:border-primary-600 focus:outline-none text-sm min-w-0 w-full py-0"
                                autoFocus
                              />
                            ) : (
                              <span className="line-clamp-1 min-w-0 text-sm leading-snug">{chat.title}</span>
                            )}
                          </div>

                          {/* Action buttons – show on active */}
                          {isActive && (
                            <div className="flex items-center gap-0.5 ml-1 flex-shrink-0">
                              {isEditing ? (
                                <Tooltip.Root>
                                  <Tooltip.Trigger
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleSaveEdit(chat.id)
                                    }}
                                    className="rounded-lg p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                                    aria-label="Save"
                                  >
                                    <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                                  </Tooltip.Trigger>
                                  <Tooltip.Portal>
                                    <Tooltip.Positioner side="top" sideOffset={6}>
                                      <Tooltip.Popup className="tooltip-popup">Save</Tooltip.Popup>
                                    </Tooltip.Positioner>
                                  </Tooltip.Portal>
                                </Tooltip.Root>
                              ) : (
                                <Tooltip.Root>
                                  <Tooltip.Trigger
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleEditClick(chat)
                                    }}
                                    className="rounded-lg p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                    aria-label="Rename conversation"
                                  >
                                    <Pencil className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                                  </Tooltip.Trigger>
                                  <Tooltip.Portal>
                                    <Tooltip.Positioner side="top" sideOffset={6}>
                                      <Tooltip.Popup className="tooltip-popup">Rename</Tooltip.Popup>
                                    </Tooltip.Positioner>
                                  </Tooltip.Portal>
                                </Tooltip.Root>
                              )}
                              <Tooltip.Root>
                                <Tooltip.Trigger
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onDeleteChat(chat.id)
                                  }}
                                  className="rounded-lg p-1.5 text-gray-400 dark:text-gray-500 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                  aria-label="Delete conversation"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Tooltip.Trigger>
                                <Tooltip.Portal>
                                  <Tooltip.Positioner side="top" sideOffset={6}>
                                    <Tooltip.Popup className="tooltip-popup">Delete</Tooltip.Popup>
                                  </Tooltip.Positioner>
                                </Tooltip.Portal>
                              </Tooltip.Root>
                            </div>
                          )}
                        </div>
                      </motion.li>
                    )
                  })}
                </AnimatePresence>
              </ul>
            )}
          </nav>

          {/* Footer */}
          <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-800">
            {/* Settings + provider info */}
            <Button
              onClick={onOpenSettings}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
              aria-label="Open LLM provider settings"
            >
              <div className="flex-shrink-0 h-7 w-7 rounded-lg bg-gray-100 dark:bg-gray-800 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 flex items-center justify-center transition-colors border border-gray-200 dark:border-gray-700">
                <Settings className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors" />
              </div>
              <div className="flex flex-col items-start min-w-0">
                {isConfigured ? (
                  <>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                      {activeProvider?.name ?? activeProviderId}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 truncate">{activeModel}</span>
                  </>
                ) : (
                  <span className="text-xs font-medium text-amber-500 dark:text-amber-400">No provider configured</span>
                )}
              </div>
            </Button>

            {/* GitHub attribution */}
            <a
              href="https://github.com/gayakaci20"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 py-3 px-4 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors border-t border-gray-200 dark:border-gray-800"
            >
              <Github className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs">Open Source · Gaya KACI</span>
            </a>
          </div>
        </div>
      </aside>
    </Tooltip.Provider>
  )
}
