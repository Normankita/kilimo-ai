import type { Metadata, Viewport } from 'next'
import { createBrowserClient } from '@supabase/ssr'
import { Providers } from './providers'
import InstallPrompt from '@/components/ui/install-prompt'
import './globals.css'

export async function generateMetadata(): Promise<Metadata> {
  let appName = 'NorZah Kilimo Smart assist'
  try {
    // site_settings is publicly readable and this doesn't need a user session,
    // so a plain cookie-free client is used here deliberately — the cookie-bound
    // server client (lib/supabase/server.ts) calls next/headers' cookies(),
    // which is a dynamic API and would force every page under this root layout
    // out of static generation just to read one rarely-changed app name.
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data } = await supabase.from('site_settings').select('app_name').eq('id', 1).single()
    if (data?.app_name) appName = data.app_name
  } catch {
    // Falls back to the default above — e.g. before the site_settings migration has run.
  }

  return {
    title: `${appName}, Msaada wa Kilimo Tanzania`,
    description: 'Msaidizi wa kilimo kwa wakulima wadogo Tanzania',
    manifest: '/manifest.json',
    icons: {
      icon: '/icon',
      apple: '/icons/icon-192x192.png',
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: appName,
    },
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2d5a27',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sw" suppressHydrationWarning className="h-full" data-scroll-behavior="smooth">
      <body className="min-h-full">
        <Providers>{children}</Providers>
        <InstallPrompt />
      </body>
    </html>
  )
}
