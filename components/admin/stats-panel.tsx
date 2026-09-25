'use client'

import useSWR from 'swr'
import { Bell, CalendarDays, Eye, FileStack, HardDrive, Loader2, MessagesSquare, Users } from 'lucide-react'
import { fetcher, formatBytes } from '@/lib/fetcher'

type Stats = {
  total_visitors: number
  today_visitors: number
  week_visitors: number
  total_hits: number
  files_bytes: number
  files_count: number
  image_bytes: number
  video_bytes: number
  pdf_bytes: number
  db_bytes: number
  posts_count: number
  subscribers: number
}

const numberFormat = new Intl.NumberFormat('ar-IQ')
const shortDay = new Intl.DateTimeFormat('ar-IQ', { day: 'numeric', month: 'numeric' })

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-sm">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xl font-bold tabular-nums">{value}</span>
      </div>
    </div>
  )
}

export function StatsPanel() {
  const { data, isLoading, error } = useSWR<{
    stats: Stats
    daily: { day: string; visitors: number }[]
  }>('/api/stats', fetcher, { refreshInterval: 60000 })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        جارٍ تحميل الإحصائيات...
      </div>
    )
  }
  if (error || !data) {
    return <p className="py-16 text-center text-sm text-destructive">تعذر تحميل الإحصائيات</p>
  }

  const s = data.stats
  const maxDaily = Math.max(1, ...data.daily.map((d) => d.visitors))
  const breakdown = [
    { label: 'فيديو', bytes: s.video_bytes, color: 'var(--brand-primary)' },
    { label: 'صور', bytes: s.image_bytes, color: 'var(--brand-accent)' },
    { label: 'PDF', bytes: s.pdf_bytes, color: 'color-mix(in oklch, var(--brand-primary) 45%, white)' },
  ]
  const totalFiles = Math.max(1, s.files_bytes)

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={Users} label="إجمالي الزوار" value={numberFormat.format(s.total_visitors)} />
        <StatCard icon={CalendarDays} label="زوار اليوم" value={numberFormat.format(s.today_visitors)} />
        <StatCard icon={Eye} label="زوار آخر 7 أيام" value={numberFormat.format(s.week_visitors)} />
        <StatCard icon={Eye} label="إجمالي الزيارات" value={numberFormat.format(s.total_hits)} />
        <StatCard icon={MessagesSquare} label="المنشورات" value={numberFormat.format(s.posts_count)} />
        <StatCard icon={FileStack} label="الملفات المرفوعة" value={numberFormat.format(s.files_count)} />
        <StatCard icon={Bell} label="مشتركو الإشعارات" value={numberFormat.format(s.subscribers)} />
        <StatCard icon={HardDrive} label="حجم قاعدة البيانات" value={formatBytes(s.db_bytes)} />
      </div>

      <section className="rounded-2xl border bg-card p-5 shadow-sm" aria-labelledby="daily-title">
        <h2 id="daily-title" className="mb-4 font-semibold">
          الزوار خلال آخر 14 يوماً
        </h2>
        <div className="flex h-40 items-end gap-1.5" role="img" aria-label="مخطط الزوار اليومي">
          {data.daily.map((d) => (
            <div key={d.day} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <span className="text-[0.65rem] tabular-nums text-muted-foreground">
                {d.visitors || ''}
              </span>
              <div
                className="w-full rounded-t-md bg-primary/85"
                style={{ height: `${Math.max(3, (d.visitors / maxDaily) * 100)}%` }}
              />
              <span className="text-[0.6rem] text-muted-foreground">
                {shortDay.format(new Date(d.day))}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5 shadow-sm" aria-labelledby="storage-title">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="storage-title" className="font-semibold">
            التخزين المستخدم
          </h2>
          <p className="text-sm text-muted-foreground">
            الملفات: <span className="font-semibold text-foreground">{formatBytes(s.files_bytes)}</span>
            {' · '}
            قاعدة البيانات كاملة:{' '}
            <span className="font-semibold text-foreground">{formatBytes(s.db_bytes)}</span>
          </p>
        </div>
        <div className="flex h-3 overflow-hidden rounded-full bg-muted">
          {breakdown.map((b) => (
            <div
              key={b.label}
              style={{ width: `${(b.bytes / totalFiles) * 100}%`, backgroundColor: b.color }}
            />
          ))}
        </div>
        <ul className="mt-3 flex flex-wrap gap-4 text-sm">
          {breakdown.map((b) => (
            <li key={b.label} className="flex items-center gap-2">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: b.color }} />
              <span className="text-muted-foreground">{b.label}</span>
              <span className="font-medium tabular-nums">{formatBytes(b.bytes)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
