import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ModelType =
  | 'gemini-2.0-flash'
  | 'gemini-2.5-flash-preview-04-17'
  | 'gemini-1.5-pro'
  | 'gemini-1.5-flash'

export interface Conversation {
  id: string
  title: string
  timestamp: Date
}

interface ChatStore {
  conversations: Conversation[]
  currentConversation: string | null
  selectedModel: ModelType
  isMobileMenuOpen: boolean

  addConversation: () => string
  deleteConversation: (id: string) => void
  selectConversation: (id: string) => void
  editConversation: (id: string, title: string) => void
  setMobileMenuOpen: (isOpen: boolean) => void
  setSelectedModel: (model: ModelType) => void
}

export const useStore = create<ChatStore>()(
  persist(
    (set) => ({
      conversations: [],
      currentConversation: null,
      isMobileMenuOpen: false,
      selectedModel: 'gemini-2.0-flash',

      addConversation: () => {
        const id = crypto.randomUUID()
        const conversation: Conversation = {
          id,
          title: 'New conversation',
          timestamp: new Date(),
        }
        set((state) => ({
          conversations: [conversation, ...state.conversations],
          currentConversation: id,
        }))
        return id
      },

      deleteConversation: (id) => {
        set((state) => {
          const remaining = state.conversations.filter((c) => c.id !== id)
          if (remaining.length === 0) {
            const newId = crypto.randomUUID()
            return {
              conversations: [{ id: newId, title: 'New conversation', timestamp: new Date() }],
              currentConversation: newId,
            }
          }
          return {
            conversations: remaining,
            currentConversation: state.currentConversation === id ? null : state.currentConversation,
          }
        })
      },

      selectConversation: (id) => set({ currentConversation: id }),

      editConversation: (id, title) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, title } : c
          ),
        }))
      },

      setMobileMenuOpen: (isOpen) => set({ isMobileMenuOpen: isOpen }),

      setSelectedModel: (model) => set({ selectedModel: model }),
    }),
    { name: 'lightchat-storage' }
  )
) 