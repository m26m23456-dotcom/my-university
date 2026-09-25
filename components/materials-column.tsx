'use client'

import { useState } from 'react'
import useSWR from 'swr'
import {
  ArrowRight,
  BookMarked,
  ChevronLeft,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useApp } from '@/components/app-provider'
import { EditableTitle } from '@/components/editable-title'
import { Feed } from '@/components/feed'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { api, fetcher } from '@/lib/fetcher'
import { can, type Subject } from '@/lib/types'
import { cn } from '@/lib/utils'

type SubjectsResponse = { subjects: Subject[] }

export function MaterialsColumn({ query }: { query: string }) {
  const { settings, user, updateSettings } = useApp()
  const [course, setCourse] = useState<1 | 2>(1)
  const [selected, setSelected] = useState<Subject | null>(null)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [renameTarget, setRenameTarget] = useState<Subject | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)

  const course1 = useSWR<SubjectsResponse>('/api/subjects?course=1', fetcher)
  const course2 = useSWR<SubjectsResponse>('/api/subjects?course=2', fetcher)
  const current = course === 1 ? course1 : course2
  const subjects = current.data?.subjects ?? []
  const canManage = can(user, 'materials', 'edit')
  const isOwner = user?.role === 'owner'

  const allNames = new Map<number, string>()
  for (const s of [...(course1.data?.subjects ?? []), ...(course2.data?.subjects ?? [])]) {
    allNames.set(s.id, `${settings.courses[s.course as 1 | 2]} · ${s.name}`)
  }

  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true)
    try {
      await action()
      await current.mutate()
      toast.success(success)
      return true
    } catch (error) {
      toast.error((error as Error).message)
      return false
    } finally {
      setBusy(false)
    }
  }

  if (selected && !query) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b bg-secondary/50 px-2 py-1.5">
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => setSelected(null)}
            aria-label="الرجوع إلى قائمة المواد"
          >
            <ArrowRight aria-hidden="true" />
          </Button>
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-semibold">{selected.name}</span>
            <span className="text-xs text-muted-foreground">{settings.courses[course]}</span>
          </div>
        </div>
        <Feed section="materials" subjectId={selected.id} />
      </div>
    )
  }

  if (query) {
    const q = query.trim().toLowerCase()
    const matches = [...(course1.data?.subjects ?? []), ...(course2.data?.subjects ?? [])].filter(
      (s) => s.name.toLowerCase().includes(q),
    )
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        {matches.length > 0 && (
          <div className="border-b p-2">
            <p className="px-1 pb-1 text-xs font-medium text-muted-foreground">المواد المطابقة</p>
            <div className="flex flex-wrap gap-1.5">
              {matches.map((s) => (
                <Button
                  key={s.id}
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setCourse(s.course as 1 | 2)
                    setSelected(s)
                  }}
                >
                  {s.name}
                </Button>
              ))}
            </div>
          </div>
        )}
        <Feed section="materials" query={query} subjectNames={allNames} allowCompose={false} />
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="p-2">
        <div role="tablist" aria-label="الكورسات" className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
          {([1, 2] as const).map((c) => (
            <div
              key={c}
              className={cn(
                'flex items-center justify-center rounded-lg transition-colors',
                course === c ? 'bg-card shadow-sm' : 'hover:bg-card/50',
              )}
            >
              {isOwner && course === c ? (
                <div className="px-2 py-1.5">
                  <EditableTitle
                    as="span"
                    value={settings.courses[c]}
                    canEdit
                    className="text-sm font-semibold text-primary"
                    onSave={(next) =>
                      updateSettings({ ...settings, courses: { ...settings.courses, [c]: next } })
                    }
                  />
                </div>
              ) : (
                <button
                  type="button"
                  role="tab"
                  aria-selected={course === c}
                  onClick={() => setCourse(c)}
                  className={cn(
                    'w-full px-2 py-2 text-sm font-medium',
                    course === c ? 'font-semibold text-primary' : 'text-muted-foreground',
                  )}
                >
                  {settings.courses[c]}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="scrollbar-thin flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto px-2 pb-2">
        {current.isLoading ? (
          <div className="m-auto flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            جارٍ التحميل...
          </div>
        ) : subjects.length === 0 && !adding ? (
          <div className="m-auto flex max-w-60 flex-col items-center gap-2 text-center text-sm text-muted-foreground">
            <BookMarked className="size-8 opacity-60" aria-hidden="true" />
            لم تتم إضافة مواد لهذا الكورس بعد
          </div>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {subjects.map((s) => (
              <li key={s.id} className="group/subject relative">
                <button
                  type="button"
                  onClick={() => setSelected(s)}
                  className="flex w-full items-center gap-3 rounded-xl border bg-card p-3 text-right transition-colors hover:border-primary/30 hover:bg-secondary/50"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-sm font-bold text-primary">
                    {s.name.trim().charAt(0)}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-semibold">{s.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {s.postCount ? `${s.postCount} منشور` : 'لا توجد منشورات'}
                    </span>
                  </span>
                  <ChevronLeft
                    className={cn('size-4 shrink-0 text-muted-foreground', canManage && 'ml-7')}
                    aria-hidden="true"
                  />
                </button>
                {canManage && (
                  <div className="absolute top-1/2 left-2 -translate-y-1/2">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            className="text-muted-foreground"
                            aria-label={`خيارات ${s.name}`}
                          />
                        }
                      >
                        <MoreVertical aria-hidden="true" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem
                          onClick={() => {
                            setDraft(s.name)
                            setRenameTarget(s)
                          }}
                        >
                          <Pencil aria-hidden="true" />
                          إعادة تسمية
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(s)}>
                          <Trash2 aria-hidden="true" />
                          حذف المادة
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {canManage &&
          (adding ? (
            <form
              className="flex items-center gap-1.5 rounded-xl border border-dashed bg-card p-2"
              onSubmit={async (e) => {
                e.preventDefault()
                const ok = await run(
                  () => api('/api/subjects', 'POST', { course, name: newName }),
                  'تمت إضافة المادة',
                )
                if (ok) {
                  setNewName('')
                  setAdding(false)
                }
              }}
            >
              <Input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="اسم المادة"
                aria-label="اسم المادة الجديدة"
                maxLength={80}
                className="h-9"
              />
              <Button type="submit" size="sm" disabled={busy || !newName.trim()}>
                إضافة
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>
                إلغاء
              </Button>
            </form>
          ) : (
            <Button
              variant="outline"
              className="mt-1 w-full border-dashed"
              onClick={() => setAdding(true)}
            >
              <Plus aria-hidden="true" />
              إضافة مادة إلى {settings.courses[course]}
            </Button>
          ))}
      </div>

      <Dialog open={!!renameTarget} onOpenChange={(o) => !o && setRenameTarget(null)}>
        <DialogContent dir="rtl" className="text-right">
          <DialogHeader>
            <DialogTitle>إعادة تسمية المادة</DialogTitle>
          </DialogHeader>
          <Input value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="اسم المادة" />
          <DialogFooter>
            <Button
              disabled={busy || !draft.trim()}
              onClick={async () => {
                if (!renameTarget) return
                const ok = await run(
                  () => api(`/api/subjects/${renameTarget.id}`, 'PATCH', { name: draft }),
                  'تم تغيير الاسم',
                )
                if (ok) setRenameTarget(null)
              }}
            >
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent dir="rtl" className="text-right">
          <DialogHeader>
            <DialogTitle>حذف {deleteTarget?.name}؟</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            سيتم حذف المادة وجميع منشوراتها وملفاتها نهائياً.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={async () => {
                if (!deleteTarget) return
                const ok = await run(
                  () => api(`/api/subjects/${deleteTarget.id}`, 'DELETE'),
                  'تم حذف المادة',
                )
                if (ok) setDeleteTarget(null)
              }}
            >
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
