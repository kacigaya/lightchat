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
    <div className="fixed inset-0 flex bg-white dark:bg-gray-950 transition-colors">
      {/* Mobile hamburger */}
      <Button
        onClick={() => setMobileMenuOpen(true)}
        className="fixed left-4 top-3.5 z-40 rounded-xl bg-white dark:bg-gray-900 p-2 text-gray-600 dark:text-gray-300 shadow-sm border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors md:hidden"
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

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
              className="rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-600 transition-colors shadow-sm"
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
