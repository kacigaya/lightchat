'use client'

import { motion } from 'framer-motion'
import { Clipboard, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useState, useCallback, ReactNode } from 'react'
import { Button } from '@base-ui/react/button'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { LoadingDots } from './LoadingDots'
import { useTheme } from '@/contexts/theme-context'

type MessageType = 'user' | 'ai'

interface ChatMessageProps {
  content: string | ReactNode
  type: MessageType
  isLoading?: boolean
}

export function ChatMessage({ content, type, isLoading }: ChatMessageProps) {
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({})
  const [isMessageCopied, setIsMessageCopied] = useState(false)
  const { resolvedTheme } = useTheme()

  const handleCopy = useCallback(async (text: string, blockId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedStates((prev) => ({ ...prev, [blockId]: true }))
      setTimeout(() => setCopiedStates((prev) => ({ ...prev, [blockId]: false })), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }, [])

  const handleMessageCopy = useCallback(async () => {
    try {
      const text = typeof content === 'string' ? content : ''
      await navigator.clipboard.writeText(text)
      setIsMessageCopied(true)
      setTimeout(() => setIsMessageCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy message:', err)
    }
  }, [content])

  const isDark = resolvedTheme === 'dark'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex w-full max-w-4xl mx-auto mb-4',
        type === 'user' ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'flex items-start',
          type === 'user'
            ? 'bg-primary-50 dark:bg-gray-800 text-gray-900 dark:text-white max-w-[85%] px-4 py-3 rounded-2xl shadow-sm'
            : 'text-gray-900 dark:text-gray-100 max-w-[85%] group relative pb-10'
        )}
      >
        <div className="flex-1 prose prose-sm max-w-none break-words dark:prose-invert">
          {isLoading ? (
            <LoadingDots />
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, node, ...props }) {
                  const match = /language-(\w+)/.exec(className || '')
                  const code = Array.isArray(children) ? children.join('') : String(children)
                  const isInline = !match || !node?.position?.start.line

                  if (!isInline && match) {
                    const language = match[1]
                    const blockId = `${node?.position?.start.line}-${language}`

                    return (
                      <div className="relative my-4 rounded-lg overflow-hidden w-full max-w-[calc(100vw-2rem)] sm:max-w-[800px] bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900">
                          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate max-w-[120px] sm:max-w-none">
                            {language}
                          </span>
                          <Button
                            onClick={() => handleCopy(code, blockId)}
                            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex-shrink-0 ml-2"
                            title="Copy code"
                          >
                            {copiedStates[blockId] ? (
                              <Check className="w-4 h-4 text-green-500 dark:text-green-400" />
                            ) : (
                              <Clipboard className="w-4 h-4 sm:w-5 sm:h-5" />
                            )}
                          </Button>
                        </div>
                        <div className="overflow-x-auto">
                          <SyntaxHighlighter
                            language={language}
                            style={isDark ? oneDark : oneLight}
                            customStyle={{
                              margin: 0,
                              background: isDark ? '#282C34' : '#fafafa',
                              maxWidth: '100%',
                              fontSize: '0.75rem',
                              lineHeight: '1.5',
                              padding: '1rem 0.75rem',
                              whiteSpace: 'pre',
                              overflowX: 'auto',
                            }}
                            wrapLongLines={false}
                          >
                            {code}
                          </SyntaxHighlighter>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <code
                      className={cn(
                        'px-1.5 py-0.5 rounded-md font-mono text-sm',
                        type === 'user'
                          ? 'bg-primary-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100'
                      )}
                      {...props}
                    >
                      {children}
                    </code>
                  )
                },
                pre: ({ children }) => <div className="overflow-x-auto">{children}</div>,
                p: ({ children }) => (
                  <p className="mb-4 last:mb-0 whitespace-pre-wrap break-words text-gray-800 dark:text-gray-100">
                    {children}
                  </p>
                ),
                h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">{children}</h1>,
                h2: ({ children }) => <h2 className="text-xl font-bold mb-3 text-gray-900 dark:text-gray-100">{children}</h2>,
                h3: ({ children }) => <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-gray-100">{children}</h3>,
                ul: ({ children }) => <ul className="list-disc list-inside mb-4">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside mb-4">{children}</ol>,
                li: ({ children }) => <li className="mb-1 last:mb-0">{children}</li>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-gray-300 dark:border-gray-700 pl-4 italic my-4 text-gray-600 dark:text-gray-300">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {typeof content === 'string' ? content : ''}
            </ReactMarkdown>
          )}
        </div>
        {type === 'ai' && !isLoading && (
          <Button
            onClick={handleMessageCopy}
            className={cn(
              'absolute bottom-1 left-0 p-1.5 rounded-md transition-colors',
              isMessageCopied
                ? 'bg-green-500/20 text-green-500'
                : 'bg-gray-100/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 hover:text-gray-700 dark:hover:text-gray-300'
            )}
            title={isMessageCopied ? 'Copied!' : 'Copy message'}
          >
            {isMessageCopied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Clipboard className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    </motion.div>
  )
}
