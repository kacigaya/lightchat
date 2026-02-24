'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { Chat } from '@/components/Chat'
import { SettingsModal } from '@/components/SettingsModal'
import { useStore } from '@/lib/store'
import { Menu } from 'lucide-react'

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
    <div className="fixed inset-0 flex bg-gray-900">
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-lg bg-gray-900 p-2 text-white md:hidden"
        aria-label="Open sidebar"
      >
        <Menu className="h-6 w-6" />
      </button>

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
            <button
              onClick={addConversation}
              className="rounded-lg bg-gray-800 px-4 py-2 text-white hover:bg-gray-700"
            >
              Start a new conversation
            </button>
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
