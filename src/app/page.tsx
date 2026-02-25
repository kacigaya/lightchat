'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { Chat } from '@/components/Chat'
import { SettingsModal } from '@/components/SettingsModal'
import { useStore } from '@/lib/store'
import { Menu } from 'lucide-react'
import { Button } from '@base-ui/react/button'

export default function Home() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const {
    conversations,
    currentConversation,
    addConversation,
    deleteConversation,
    selectConversation,
    isMobileMenuOpen,
    setMobileMenuOpen,
    editConversation,
  } = useStore()

  return (
    <div className="fixed inset-0 flex bg-white dark:bg-gray-900 transition-colors">
      {/* Mobile hamburger */}
      <Button
        onClick={() => setMobileMenuOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-lg bg-white dark:bg-gray-900 p-2 text-gray-900 dark:text-white shadow-sm dark:shadow-none md:hidden"
        aria-label="Open sidebar"
      >
        <Menu className="h-6 w-6" />
      </Button>

      <Sidebar
        conversations={conversations}
        currentConversation={currentConversation}
        onNewChat={addConversation}
        onSelectChat={selectConversation}
        onDeleteChat={deleteConversation}
        onEditChat={editConversation}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <main className="flex flex-1 flex-col overflow-hidden relative w-full">
        {currentConversation ? (
          <Chat onOpenSettings={() => setIsSettingsOpen(true)} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              onClick={addConversation}
              className="rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-2 text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Start a new conversation
            </Button>
          </div>
        )}
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  )
}
