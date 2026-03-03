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
import Image from 'next/image'

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

  if (type === 'user') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex w-full max-w-3xl mx-auto mb-6 justify-end"
      >
        <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-tr-sm bg-primary-500 dark:bg-primary-700 text-white shadow-sm">
          <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {typeof content === 'string' ? content : content}
          </div>
        </div>
      </motion.div>
    )
  }

  // AI message
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex w-full max-w-3xl mx-auto mb-6 justify-start gap-3"
    >
      {/* AI avatar */}
      <div className="flex-shrink-0 mt-0.5">
        <div className="h-7 w-7 rounded-full bg-primary-100 dark:bg-primary-900/50 border border-primary-200 dark:border-primary-800/50 flex items-center justify-center overflow-hidden">
          <Image
            src="/leaf.png"
            alt="AI"
            width={16}
            height={16}
            unoptimized
            className="dark:brightness-0 dark:invert opacity-80"
          />
        </div>
      </div>

      {/* Message bubble + copy button */}
      <div className="flex-1 min-w-0 group relative pb-8">
        <div className="prose prose-sm max-w-none break-words dark:prose-invert text-gray-800 dark:text-gray-100">
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
                      <div className="relative my-4 rounded-xl overflow-hidden w-full max-w-[calc(100vw-6rem)] sm:max-w-[720px] border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            {language}
                          </span>
                          <Button
                            onClick={() => handleCopy(code, blockId)}
                            className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex-shrink-0"
                            title="Copy code"
                          >
                            {copiedStates[blockId] ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-green-500" />
                                <span className="text-green-500">Copied</span>
                              </>
                            ) : (
                              <>
                                <Clipboard className="w-3.5 h-3.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </Button>
                        </div>
                        <div className="overflow-x-auto">
                          <SyntaxHighlighter
                            language={language}
                            style={isDark ? oneDark : oneLight}
                            customStyle={{
                              margin: 0,
                              background: isDark ? '#0f172a' : '#f8fafc',
                              maxWidth: '100%',
                              fontSize: '0.8125rem',
                              lineHeight: '1.6',
                              padding: '1rem',
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
                      className="px-1.5 py-0.5 rounded-md font-mono text-[0.8125rem] bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700"
                      {...props}
                    >
                      {children}
                    </code>
                  )
                },
                pre: ({ children }) => <div className="overflow-x-auto">{children}</div>,
                p: ({ children }) => (
                  <p className="mb-4 last:mb-0 whitespace-pre-wrap break-words leading-relaxed">
                    {children}
                  </p>
                ),
                h1: ({ children }) => <h1 className="text-xl font-bold mb-3 mt-5 first:mt-0">{children}</h1>,
                h2: ({ children }) => <h2 className="text-lg font-semibold mb-2.5 mt-4 first:mt-0">{children}</h2>,
                h3: ({ children }) => <h3 className="text-base font-semibold mb-2 mt-3 first:mt-0">{children}</h3>,
                ul: ({ children }) => <ul className="list-disc list-outside pl-5 mb-4 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-outside pl-5 mb-4 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-primary-300 dark:border-primary-700 pl-4 py-0.5 my-4 text-gray-600 dark:text-gray-300 bg-primary-50/50 dark:bg-primary-900/10 rounded-r-md">
                    {children}
                  </blockquote>
                ),
                a: ({ children, href }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-500 dark:text-primary-400 hover:underline underline-offset-2"
                  >
                    {children}
                  </a>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto my-4">
                    <table className="min-w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-left font-semibold border-b border-gray-200 dark:border-gray-700">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-3 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                    {children}
                  </td>
                ),
              }}
            >
              {typeof content === 'string' ? content : ''}
            </ReactMarkdown>
          )}
        </div>

        {/* Copy message button – appears on hover */}
        {!isLoading && (
          <Button
            onClick={handleMessageCopy}
            className={cn(
              'absolute bottom-1 left-0 flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all',
              'opacity-0 group-hover:opacity-100',
              isMessageCopied
                ? 'text-green-500 bg-green-50 dark:bg-green-950/30'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60'
            )}
            title={isMessageCopied ? 'Copied!' : 'Copy message'}
          >
            {isMessageCopied ? (
              <><Check className="h-3.5 w-3.5" /> Copied</>
            ) : (
              <><Clipboard className="h-3.5 w-3.5" /> Copy</>
            )}
          </Button>
        )}
      </div>
    </motion.div>
  )
}
