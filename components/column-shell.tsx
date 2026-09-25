'use client'

import { useState, type ReactNode } from 'react'
import { Search, X, type LucideIcon } from 'lucide-react'
import { useApp } from '@/components/app-provider'
import { EditableTitle } from '@/components/editable-title'
import { NotifyToggle } from '@/components/notify-toggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Section } from '@/lib/types'
import { cn } from '@/lib/utils'

export function ColumnShell({
  section,
  icon: Icon,
  className,
  children,
}: {
  section: Section
  icon: LucideIcon
  className?: string
  children: (query: string) => ReactNode
}) {
  const { settings, user, updateSettings } = useApp()
  const title = settings.columns[section]
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const headingId = `column-${section}`

  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        'flex min-h-0 flex-col overflow-hidden rounded-2xl border bg-card shadow-sm',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
            <Icon className="size-4.5" aria-hidden="true" />
          </span>
          <EditableTitle
            id={headingId}
            value={title}
            canEdit={user?.role === 'owner'}
            className="text-base font-semibold"
            onSave={(next) =>
              updateSettings({ ...settings, columns: { ...settings.columns, [section]: next } })
            }
          />
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            type="button"
            size="icon-sm"
            variant={searchOpen ? 'secondary' : 'ghost'}
            aria-label={`البحث في ${title}`}
            aria-expanded={searchOpen}
            className={cn(!searchOpen && 'text-muted-foreground')}
            onClick={() => {
              if (searchOpen) setQuery('')
              setSearchOpen(!searchOpen)
            }}
          >
            <Search aria-hidden="true" />
          </Button>
          <NotifyToggle section={section} label={title} />
        </div>
      </div>
      {searchOpen && (
        <div className="relative border-b px-3 py-2">
          <Search
            className="pointer-events-none absolute top-1/2 right-5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            autoFocus
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`ابحث في ${title}...`}
            aria-label={`البحث في ${title}`}
            className="h-9 pr-8 pl-8"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="مسح البحث"
              className="absolute top-1/2 left-5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
      )}
      <div className="flex min-h-0 flex-1 flex-col">{children(query)}</div>
    </section>
  )
}
