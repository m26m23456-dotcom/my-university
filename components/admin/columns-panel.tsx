'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useApp } from '@/components/app-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SECTIONS } from '@/lib/types'

const SECTION_HINTS = {
  materials: 'العمود الأول - يحتوي على الكورسين والمواد',
  announcements: 'العمود الثاني',
  tasks: 'العمود الثالث',
} as const

export function ColumnsPanel() {
  const { settings, updateSettings } = useApp()
  const [columns, setColumns] = useState(settings.columns)
  const [courses, setCourses] = useState(settings.courses)
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      await updateSettings({ ...settings, columns, courses })
      toast.success('تم حفظ أسماء الأعمدة')
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border bg-card p-5 shadow-sm" aria-labelledby="columns-title">
        <h2 id="columns-title" className="mb-1 font-semibold">
          أسماء الأعمدة
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          يمكنك أيضاً تعديل الأسماء مباشرة من الصفحة الرئيسية بالضغط على أيقونة القلم.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {SECTIONS.map((s) => (
            <div key={s} className="flex flex-col gap-1.5">
              <Label htmlFor={`col-${s}`}>{SECTION_HINTS[s]}</Label>
              <Input
                id={`col-${s}`}
                value={columns[s]}
                maxLength={40}
                onChange={(e) => setColumns({ ...columns, [s]: e.target.value })}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5 shadow-sm" aria-labelledby="courses-title">
        <h2 id="courses-title" className="mb-4 font-semibold">
          أسماء الكورسات
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {([1, 2] as const).map((c) => (
            <div key={c} className="flex flex-col gap-1.5">
              <Label htmlFor={`course-${c}`}>{c === 1 ? 'الكورس الأول' : 'الكورس الثاني'}</Label>
              <Input
                id={`course-${c}`}
                value={courses[c]}
                maxLength={40}
                onChange={(e) => setCourses({ ...courses, [c]: e.target.value })}
              />
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <Button size="lg" onClick={save} disabled={saving}>
          {saving && <Loader2 className="animate-spin" aria-hidden="true" />}
          حفظ التغييرات
        </Button>
      </div>
    </div>
  )
}
