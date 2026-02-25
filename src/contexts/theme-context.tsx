'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type Theme = 'light' | 'dark' | 'system'

export interface ThemeContextValue {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

const THEME_KEY = 'lightchat-theme'

// ─── Context ──────────────────────────────────────────────────────────────────

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark')
  const [hydrated, setHydrated] = useState(false)

  // Read from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_KEY) as Theme | null
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setThemeState(stored)
      }
    } catch {
      // localStorage unavailable
    }
    setHydrated(true)
  }, [])

  // Resolve theme and apply class
  useEffect(() => {
    if (!hydrated) return

    const getSystemTheme = (): 'light' | 'dark' =>
      window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

    const apply = (resolved: 'light' | 'dark') => {
      setResolvedTheme(resolved)
      const root = document.documentElement
      if (resolved === 'dark') {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }

    if (theme === 'system') {
      apply(getSystemTheme())

      const mql = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = (e: MediaQueryListEvent) => apply(e.matches ? 'dark' : 'light')
      mql.addEventListener('change', handler)
      return () => mql.removeEventListener('change', handler)
    } else {
      apply(theme)
    }
  }, [theme, hydrated])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    try {
      localStorage.setItem(THEME_KEY, next)
    } catch {
      // localStorage unavailable
    }
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
