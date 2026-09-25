import type { MetadataRoute } from 'next'
import { getSettings } from '@/lib/settings'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getSettings()
  return {
    name: settings.siteName,
    short_name: settings.siteName,
    description: `${settings.stageLabel} - ${settings.collegeName}`,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    dir: 'rtl',
    lang: 'ar',
    background_color: settings.colors.background,
    theme_color: settings.colors.primary,
    icons: [{ src: '/logo.png', sizes: '300x300', type: 'image/png', purpose: 'any' }],
  }
}
