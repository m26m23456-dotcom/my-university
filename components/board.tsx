'use client'

import { useState } from 'react'
import { BookOpen, ClipboardList, Megaphone, ShieldAlert, type LucideIcon } from 'lucide-react'
import { AbsenceColumn } from '@/components/absence-column'
import { useApp } from '@/components/app-provider'
import { ColumnShell } from '@/components/column-shell'
import { Feed } from '@/components/feed'
import { MaterialsColumn } from '@/components/materials-column'
import { SECTIONS, type Section } from '@/lib/types'
import { cn } from '@/lib/utils'

type TabId = Section | 'absence'

const ICONS: Record<TabId, LucideIcon> = {
  materials: BookOpen,
  announcements: Megaphone,
  tasks: ClipboardList,
  absence: ShieldAlert,
}

export function Board({ initialTab }: { initialTab: Section }) {
  const { settings, user } = useApp()
  const [active, setActive] = useState<TabId>(initialTab)
  // سجل الغياب داخلي بين المالك والمشرفين فقط، ولا يظهر إطلاقاً للزوار غير المسجّلين
  const showAbsence = Boolean(user)
  const tabs: TabId[] = showAbsence ? [...SECTIONS, 'absence'] : [...SECTIONS]

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-3 px-3 py-4 md:px-4 lg:py-6">
      <nav
        aria-label="الأقسام"
        className="sticky top-16 z-30 -mx-3 bg-background/90 px-3 py-2 backdrop-blur lg:hidden"
      >
        <div
          role="tablist"
          className={cn(
            'grid gap-1 rounded-2xl border bg-card p-1 shadow-sm',
            showAbsence ? 'grid-cols-4' : 'grid-cols-3',
          )}
        >
          {tabs.map((tab) => {
            const Icon = ICONS[tab]
            const selected = active === tab
            const label = tab === 'absence' ? 'سجل الغياب' : settings.columns[tab]
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`panel-${tab}`}
                onClick={() => setActive(tab)}
                className={cn(
                  'flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-sm font-medium transition-colors',
                  selected
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-secondary',
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      <div className={cn('grid flex-1 gap-4', showAbsence ? 'lg:grid-cols-4' : 'lg:grid-cols-3')}>
        {tabs.map((tab) => (
          <div
            key={tab}
            id={`panel-${tab}`}
            role="tabpanel"
            className={cn(
              'h-[calc(100dvh-9.5rem)] min-h-[28rem] lg:flex lg:h-[calc(100dvh-7rem)] lg:max-h-[52rem]',
              active === tab ? 'flex' : 'hidden',
            )}
          >
            {tab === 'absence' ? (
              <AbsenceColumn className="flex-1" />
            ) : (
              <ColumnShell section={tab} icon={ICONS[tab]} className="flex-1">
                {(query) =>
                  tab === 'materials' ? (
                    <MaterialsColumn query={query} />
                  ) : (
                    <Feed section={tab} query={query} />
                  )
                }
              </ColumnShell>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
