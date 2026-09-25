import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Sans_Arabic } from 'next/font/google'
import type { CSSProperties } from 'react'
import { AppProvider } from '@/components/app-provider'
import { PushProvider } from '@/components/push-provider'
import { PwaRegister } from '@/components/pwa-register'
import { Toaster } from '@/components/ui/sonner'
import { getCurrentUser } from '@/lib/auth'
import { getSettings } from '@/lib/settings'
import './globals.css'

const arabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-arabic',
})

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings()
  return {
    title: {
      default: `${settings.siteName} | ${settings.stageLabel}`,
      template: `%s | ${settings.siteName}`,
    },
    description: `${settings.welcomeText}`,
    applicationName: settings.siteName,
    generator: 'v0.app',
    appleWebApp: { capable: true, title: settings.siteName, statusBarStyle: 'default' },
    icons: { icon: '/logo.png', apple: '/logo.png' },
  }
}

export async function generateViewport(): Promise<Viewport> {
  const settings = await getSettings()
  return {
    themeColor: settings.colors.primary,
    colorScheme: 'light',
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [settings, user] = await Promise.all([getSettings(), getCurrentUser()])
  const brandVars = {
    '--brand-primary': settings.colors.primary,
    '--brand-accent': settings.colors.accent,
    '--brand-bg': settings.colors.background,
  } as CSSProperties

  return (
    <html lang="ar" dir="rtl" className={arabic.variable} style={brandVars}>
      <body className="min-h-dvh antialiased">
        <AppProvider initialSettings={settings} initialUser={user}>
          <PushProvider>{children}</PushProvider>
        </AppProvider>
        <Toaster position="top-center" dir="rtl" />
        <PwaRegister />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
