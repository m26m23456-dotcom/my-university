'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, BarChart3, Columns3, Palette, Users } from 'lucide-react'
import { AdminsPanel } from '@/components/admin/admins-panel'
import { ColumnsPanel } from '@/components/admin/columns-panel'
import { IdentityPanel } from '@/components/admin/identity-panel'
import { StatsPanel } from '@/components/admin/stats-panel'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'stats', label: 'الإحصائيات', icon: BarChart3 },
  { id: 'identity', label: 'الهوية والألوان', icon: Palette },
  { id: 'columns', label: 'الأعمدة', icon: Columns3 },
  { id: 'admins', label: 'المشرفون', icon: Users },
] as const

type TabId = (typeof TABS)[number]['id']

export function AdminDashboard() {
  const [tab, setTab] = useState<TabId>('stats')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowRight className="size-4" aria-hidden="true" />
          العودة للموقع
        </Link>
        <h1 className="text-2xl font-bold text-primary">لوحة تحكم المالك</h1>
        <p className="text-sm text-muted-foreground">
          إدارة هوية الموقع والأعمدة والمشرفين ومتابعة الإحصائيات.
        </p>
      </div>

      <div
        role="tablist"
        aria-label="أقسام لوحة التحكم"
        className="scrollbar-thin flex gap-1 overflow-x-auto rounded-2xl border bg-card p-1 shadow-sm"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex shrink-0 flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors',
              tab === t.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary',
            )}
          >
            <t.icon className="size-4" aria-hidden="true" />
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {tab === 'stats' && <StatsPanel />}
        {tab === 'identity' && <IdentityPanel />}
        {tab === 'columns' && <ColumnsPanel />}
        {tab === 'admins' && <AdminsPanel />}
      </div>
    </div>
  )
}
