'use client'

import { useState } from 'react'
import { BookOpen, ClipboardList, Megaphone, type LucideIcon } from 'lucide-react'
import { useApp } from '@/components/app-provider'
import { ColumnShell } from '@/components/column-shell'
import { Feed } from '@/components/feed'
import { MaterialsColumn } from '@/components/materials-column'
import { SECTIONS, type Section } from '@/lib/types'
import { cn } from '@/lib/utils'

const ICONS: Record<Section, LucideIcon> = {
  materials: BookOpen,
  announcements: Megaphone,
  tasks: ClipboardList,
}

export function Board({ initialTab }: { initialTab: Section }) {
  const { settings } = useApp()
  const [active, setActive] = useState<Section>(initialTab)

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-3 px-3 py-4 md:px-4 lg:py-6">
      <nav
        aria-label="الأقسام"
        className="sticky top-16 z-30 -mx-3 bg-background/90 px-3 py-2 backdrop-blur lg:hidden"
      >
        <div role="tablist" className="grid grid-cols-3 gap-1 rounded-2xl border bg-card p-1 shadow-sm">
          {SECTIONS.map((section) => {
            const Icon = ICONS[section]
            const selected = active === section
            return (
              <button
                key={section}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`panel-${section}`}
                onClick={() => setActive(section)}
                className={cn(
                  'flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-sm font-medium transition-colors',
                  selected
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-secondary',
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{settings.columns[section]}</span>
              </button>
            )
          })}
        </div>
      </nav>

      <div className="grid flex-1 gap-4 lg:grid-cols-3">
        {SECTIONS.map((section) => (
          <div
            key={section}
            id={`panel-${section}`}
            role="tabpanel"
            className={cn(
              'h-[calc(100dvh-9.5rem)] min-h-[28rem] lg:flex lg:h-[calc(100dvh-7rem)] lg:max-h-[52rem]',
              active === section ? 'flex' : 'hidden',
            )}
          >
            <ColumnShell section={section} icon={ICONS[section]} className="flex-1">
              {(query) =>
                section === 'materials' ? (
                  <MaterialsColumn query={query} />
                ) : (
                  <Feed section={section} query={query} />
                )
              }
            </ColumnShell>
          </div>
        ))}
      </div>
    </div>
  )
}
