'use client'

import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { LanguageProvider } from '@/lib/language-context'
import type { ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
      <LanguageProvider>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--surface)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
            },
          }}
          richColors
        />
      </LanguageProvider>
    </ThemeProvider>
  )
}
