import './globals.css'
import { Metadata, Viewport } from 'next'
import { LLMProvider } from '@/contexts/llm-context'
import { ThemeProvider } from '@/contexts/theme-context'

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
    <html lang="en" className="h-full overflow-hidden" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('lightchat-theme');
                  var isDark = theme === 'dark' ||
                    (theme !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) document.documentElement.classList.add('dark');
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased h-full overflow-hidden bg-white dark:bg-gray-900 transition-colors duration-200">
        <ThemeProvider>
          <LLMProvider>{children}</LLMProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
