'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { api, fetcher } from '@/lib/fetcher'
import type { PublicUser, SiteSettings } from '@/lib/types'

type AppContextValue = {
  settings: SiteSettings
  user: PublicUser | null
  updateSettings: (next: SiteSettings) => Promise<void>
  resetSettings: () => Promise<void>
  refreshUser: () => Promise<unknown>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({
  initialSettings,
  initialUser,
  children,
}: {
  initialSettings: SiteSettings
  initialUser: PublicUser | null
  children: ReactNode
}) {
  const router = useRouter()
  const settingsSwr = useSWR<{ settings: SiteSettings }>('/api/settings', fetcher, {
    fallbackData: { settings: initialSettings },
    revalidateOnMount: false,
    revalidateOnFocus: false,
  })
  const userSwr = useSWR<{ user: PublicUser | null }>('/api/me', fetcher, {
    fallbackData: { user: initialUser },
    revalidateOnMount: false,
    revalidateOnFocus: true,
  })

  async function save(body: unknown) {
    const res = await api<{ settings: SiteSettings }>('/api/settings', 'PUT', body)
    await settingsSwr.mutate(res, { revalidate: false })
    router.refresh()
  }

  const value: AppContextValue = {
    settings: settingsSwr.data?.settings ?? initialSettings,
    user: userSwr.data?.user ?? null,
    updateSettings: (next) => save({ settings: next }),
    resetSettings: () => save({ reset: true }),
    refreshUser: () => userSwr.mutate(),
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
