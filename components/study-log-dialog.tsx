'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { BookOpenCheck, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { fetcher } from '@/lib/fetcher'
import { cn } from '@/lib/utils'

type DayStatus = 'yes' | 'no' | 'pending'
type UserStats = {
  id: string
  name: string
  role: string
  decisions: { yes: number; no: number }
  days: { day: string; status: DayStatus }[]
  totals: { yes: number; no: number; pending: number }
}
type StatsResponse = { month: string; activeDays: string[]; users: UserStats[] }

const monthFormat = new Intl.DateTimeFormat('ar-IQ', { month: 'long', year: 'numeric' })
const dayFormat = new Intl.DateTimeFormat('ar-IQ', { day: 'numeric', month: 'numeric' })

const STATUS_LABEL: Record<DayStatus, string> = {
  yes: 'نعم درست',
  no: 'لم ادرس',
  pending: 'لم يصوت',
}
const STATUS_STYLE: Record<DayStatus, string> = {
  yes: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  no: 'bg-destructive/15 text-destructive',
  pending: 'bg-muted text-muted-foreground',
}

function currentMonth() {
  const now = new Date(Date.now() + 3 * 60 * 60 * 1000)
  return now.toISOString().slice(0, 7)
}

function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function StudyLogDialog() {
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState(currentMonth)

  const { data, isLoading } = useSWR<StatsResponse>(
    open ? `/api/study/stats?month=${month}` : null,
    fetcher,
  )

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="سجل الدراسة"
        onClick={() => setOpen(true)}
      >
        <BookOpenCheck aria-hidden="true" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl" className="max-h-[85vh] overflow-y-auto text-right sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>سجل الدراسة</DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label="الشهر السابق"
              onClick={() => setMonth((m) => shiftMonth(m, -1))}
            >
              <ChevronRight aria-hidden="true" />
            </Button>
            <span className="text-sm font-medium">{monthFormat.format(new Date(`${month}-01`))}</span>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label="الشهر التالي"
              disabled={month >= currentMonth()}
              onClick={() => setMonth((m) => shiftMonth(m, 1))}
            >
              <ChevronLeft aria-hidden="true" />
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              جارٍ التحميل...
            </div>
          ) : !data || data.activeDays.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              لا يوجد تذكير دراسة مُفعّل في هذا الشهر
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {data.users.map((u) => (
                <div key={u.id} className="rounded-xl border p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-medium">{u.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {u.role === 'owner' ? 'مالك' : 'مشرف'}
                    </span>
                  </div>
                  <p className="mb-2 text-xs text-muted-foreground">
                    تفعيل التذكير: <span className="font-medium text-foreground">{u.decisions.yes}</span> اي
                    {' · '}
                    <span className="font-medium text-foreground">{u.decisions.no}</span> لا
                  </p>
                  <ul className="flex flex-wrap gap-1.5">
                    {u.days.map((d) => (
                      <li
                        key={d.day}
                        className={cn(
                          'flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[0.65rem]',
                          STATUS_STYLE[d.status],
                        )}
                      >
                        <span className="tabular-nums">{dayFormat.format(new Date(d.day))}</span>
                        <span>{STATUS_LABEL[d.status]}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-muted-foreground">
                    إجمالي الشهر: {u.totals.yes} نعم درست · {u.totals.no} لم ادرس · {u.totals.pending} لم
                    يصوت
                  </p>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
