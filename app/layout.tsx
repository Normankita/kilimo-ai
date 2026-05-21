import type { Metadata, Viewport } from 'next'
import { Providers } from './providers'
import InstallPrompt from '@/components/ui/install-prompt'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kilimo AI — Msaada wa Kilimo Tanzania',
  description: 'Msaidizi wa kilimo kwa wakulima wadogo Tanzania',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon',
    apple: '/icons/icon-192x192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Kilimo AI',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2d5a27',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sw" suppressHydrationWarning className="h-full">
      <body className="min-h-full">
        <Providers>{children}</Providers>
        <InstallPrompt />
      </body>
    </html>
  )
}
