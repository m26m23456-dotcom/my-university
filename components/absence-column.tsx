'use client'

import { ShieldAlert } from 'lucide-react'
import { AbsenceChat } from '@/components/absence-chat'
import { cn } from '@/lib/utils'

export function AbsenceColumn({ className }: { className?: string }) {
  return (
    <section
      aria-labelledby="column-absence"
      className={cn(
        'flex min-h-0 flex-col overflow-hidden rounded-2xl border bg-card shadow-sm',
        className,
      )}
    >
      <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
          <ShieldAlert className="size-4.5" aria-hidden="true" />
        </span>
        <h2 id="column-absence" className="text-base font-semibold">
          سجل الغياب
        </h2>
      </div>
      <AbsenceChat />
    </section>
  )
}
