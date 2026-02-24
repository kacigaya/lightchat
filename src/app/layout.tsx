import './globals.css'
import { Metadata, Viewport } from 'next'
import { LLMProvider } from '@/contexts/llm-context'

export const metadata: Metadata = {
  title: 'LightChat',
  description: 'A fast and modern AI chat interface',
  icons: {
    icon: [{ url: '/favicon.ico', type: 'image/x-icon' }],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark h-full overflow-hidden">
      <body className="font-sans antialiased h-full overflow-hidden bg-gray-900">
        <LLMProvider>{children}</LLMProvider>
      </body>
    </html>
  )
}
