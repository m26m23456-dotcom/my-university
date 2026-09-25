'use client'

import { useApp } from '@/components/app-provider'

export function SiteFooter() {
  const { settings } = useApp()
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-1 px-4 py-4 text-center text-xs text-muted-foreground sm:flex-row sm:text-right">
        <p>
          <span dir="auto" className="font-medium text-foreground">
            {settings.siteName}
          </span>{' '}
          · {settings.collegeName}
        </p>
        <p>
          إعداد: <span className="font-medium text-foreground">{settings.authorName}</span>
        </p>
      </div>
    </footer>
  )
}
