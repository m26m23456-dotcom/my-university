'use client'

import { useState } from 'react'
import { Check, Loader2, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { useApp } from '@/components/app-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { SiteSettings } from '@/lib/types'
import { cn } from '@/lib/utils'

const PALETTES: { name: string; colors: SiteSettings['colors'] }[] = [
  { name: 'أزرق بترولي', colors: { primary: '#1e4d5c', accent: '#a8864f', background: '#f5f3ee' } },
  { name: 'كحلي رسمي', colors: { primary: '#1f3a5f', accent: '#b38b3f', background: '#f4f5f7' } },
  { name: 'أخضر زيتوني', colors: { primary: '#3d5a3a', accent: '#a07a3c', background: '#f4f3ec' } },
  { name: 'عنابي', colors: { primary: '#6b2737', accent: '#b0894f', background: '#f7f3f0' } },
  { name: 'رمادي فحمي', colors: { primary: '#2f3a40', accent: '#9a7b4f', background: '#f3f3f1' } },
]

const COLOR_FIELDS: { key: keyof SiteSettings['colors']; label: string }[] = [
  { key: 'primary', label: 'اللون الأساسي' },
  { key: 'accent', label: 'لون التمييز' },
  { key: 'background', label: 'لون الخلفية' },
]

export function IdentityPanel() {
  const { settings, updateSettings, resetSettings } = useApp()
  const [draft, setDraft] = useState<SiteSettings>(settings)
  const [saving, setSaving] = useState(false)

  function set<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  async function save() {
    setSaving(true)
    try {
      await updateSettings(draft)
      toast.success('تم حفظ الإعدادات')
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const textFields: { key: keyof SiteSettings; label: string; max: number }[] = [
    { key: 'siteName', label: 'اسم الموقع', max: 60 },
    { key: 'stageLabel', label: 'المرحلة', max: 60 },
    { key: 'collegeName', label: 'الكلية والجامعة', max: 120 },
    { key: 'welcomeTitle', label: 'عبارة الترحيب', max: 120 },
    { key: 'authorName', label: 'اسم المُعِد', max: 60 },
  ]

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border bg-card p-5 shadow-sm" aria-labelledby="identity-title">
        <h2 id="identity-title" className="mb-4 font-semibold">
          هوية الموقع
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {textFields.map((f) => (
            <div key={f.key} className="flex flex-col gap-1.5">
              <Label htmlFor={`f-${f.key}`}>{f.label}</Label>
              <Input
                id={`f-${f.key}`}
                value={draft[f.key] as string}
                maxLength={f.max}
                dir="auto"
                onChange={(e) => set(f.key, e.target.value as never)}
              />
            </div>
          ))}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <Label htmlFor="f-welcomeText">نص الترحيب</Label>
            <Textarea
              id="f-welcomeText"
              rows={3}
              maxLength={600}
              value={draft.welcomeText}
              onChange={(e) => set('welcomeText', e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5 shadow-sm" aria-labelledby="colors-title">
        <h2 id="colors-title" className="mb-1 font-semibold">
          الألوان
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">اختر نمطاً جاهزاً أو خصّص الألوان بنفسك.</p>
        <div className="mb-5 flex flex-wrap gap-2">
          {PALETTES.map((p) => {
            const active =
              p.colors.primary === draft.colors.primary &&
              p.colors.accent === draft.colors.accent &&
              p.colors.background === draft.colors.background
            return (
              <button
                key={p.name}
                type="button"
                onClick={() => set('colors', p.colors)}
                aria-pressed={active}
                className={cn(
                  'flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors hover:bg-secondary',
                  active && 'border-primary ring-2 ring-primary/20',
                )}
              >
                <span className="flex -space-x-1 space-x-reverse">
                  {Object.values(p.colors).map((c) => (
                    <span
                      key={c}
                      className="size-4 rounded-full ring-2 ring-card"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </span>
                {p.name}
                {active && <Check className="size-3.5 text-primary" aria-hidden="true" />}
              </button>
            )
          })}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {COLOR_FIELDS.map((f) => (
            <div key={f.key} className="flex flex-col gap-1.5">
              <Label htmlFor={`c-${f.key}`}>{f.label}</Label>
              <div className="flex items-center gap-2 rounded-lg border bg-background p-1.5">
                <input
                  id={`c-${f.key}`}
                  type="color"
                  value={draft.colors[f.key]}
                  onChange={(e) => set('colors', { ...draft.colors, [f.key]: e.target.value })}
                  className="size-8 cursor-pointer rounded-md border-0 bg-transparent p-0"
                />
                <span className="font-mono text-sm uppercase text-muted-foreground" dir="ltr">
                  {draft.colors[f.key]}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div
          className="mt-5 overflow-hidden rounded-xl border"
          style={{ backgroundColor: draft.colors.background }}
          aria-label="معاينة الألوان"
        >
          <div className="px-4 py-3 text-white" style={{ backgroundColor: draft.colors.primary }}>
            <p className="text-xs" style={{ color: draft.colors.accent }}>
              {draft.welcomeTitle}
            </p>
            <p className="font-bold">{draft.siteName}</p>
          </div>
          <div className="flex gap-2 p-4">
            <span className="rounded-lg bg-white px-3 py-2 text-sm shadow-sm">رسالة تجريبية</span>
            <span
              className="rounded-lg px-3 py-2 text-sm text-white"
              style={{ backgroundColor: draft.colors.primary }}
            >
              زر
            </span>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          variant="ghost"
          className="text-muted-foreground"
          onClick={async () => {
            try {
              await resetSettings()
              toast.success('تمت استعادة الإعدادات الافتراضية')
              window.location.reload()
            } catch (error) {
              toast.error((error as Error).message)
            }
          }}
        >
          <RotateCcw aria-hidden="true" />
          استعادة الافتراضي
        </Button>
        <Button size="lg" onClick={save} disabled={saving}>
          {saving && <Loader2 className="animate-spin" aria-hidden="true" />}
          حفظ التغييرات
        </Button>
      </div>
    </div>
  )
}
