'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { KeyRound, Loader2, Plus, ShieldCheck, Trash2, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { useApp } from '@/components/app-provider'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { api, fetcher } from '@/lib/fetcher'
import { SECTION_ACTIONS, SECTIONS, type Permissions, type SectionPermission } from '@/lib/types'

type Admin = {
  id: string
  username: string
  displayName: string
  permissions: Permissions
  createdAt: string
}

function emptyPermissions(): Permissions {
  return Object.fromEntries(
    SECTIONS.map((s) => [s, { post: false, edit: false, pin: false }]),
  ) as Permissions
}

function PermissionMatrix({
  value,
  onChange,
  idPrefix,
}: {
  value: Permissions
  onChange: (next: Permissions) => void
  idPrefix: string
}) {
  const { settings } = useApp()
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead className="bg-muted/60">
          <tr>
            <th scope="col" className="px-3 py-2 text-right font-medium">
              العمود
            </th>
            {SECTION_ACTIONS.map((a) => (
              <th key={a.key} scope="col" className="px-3 py-2 text-center font-medium">
                {a.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SECTIONS.map((s) => (
            <tr key={s} className="border-t">
              <th scope="row" className="px-3 py-2.5 text-right font-medium">
                {settings.columns[s]}
              </th>
              {SECTION_ACTIONS.map((a) => {
                const id = `${idPrefix}-${s}-${a.key}`
                const checked = Boolean(value[s]?.[a.key])
                return (
                  <td key={a.key} className="px-3 py-2.5 text-center">
                    <Switch
                      id={id}
                      checked={checked}
                      aria-label={`${a.label} في ${settings.columns[s]}`}
                      onCheckedChange={(next: boolean) => {
                        const current: SectionPermission = value[s] ?? {
                          post: false,
                          edit: false,
                          pin: false,
                        }
                        onChange({ ...value, [s]: { ...current, [a.key]: next } })
                      }}
                    />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AdminCard({ admin, onChanged }: { admin: Admin; onChanged: () => void }) {
  const [permissions, setPermissions] = useState<Permissions>({
    ...emptyPermissions(),
    ...admin.permissions,
  })
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [password, setPassword] = useState('')

  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true)
    try {
      await action()
      toast.success(success)
      onChanged()
      return true
    } catch (error) {
      toast.error((error as Error).message)
      return false
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-primary">
            <UserRound className="size-5" aria-hidden="true" />
          </span>
          <div className="flex flex-col">
            <span className="font-semibold">{admin.displayName}</span>
            <span className="text-xs text-muted-foreground" dir="ltr">
              @{admin.username}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => setPasswordOpen(true)}>
            <KeyRound aria-hidden="true" />
            كلمة المرور
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-destructive"
            aria-label={`حذف ${admin.displayName}`}
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      </div>

      <PermissionMatrix
        idPrefix={admin.id}
        value={permissions}
        onChange={(next) => {
          setPermissions(next)
          setDirty(true)
        }}
      />

      {dirty && (
        <div className="flex justify-end">
          <Button
            size="sm"
            disabled={busy}
            onClick={async () => {
              const ok = await run(
                () => api(`/api/admins/${admin.id}`, 'PATCH', { permissions }),
                'تم حفظ الصلاحيات',
              )
              if (ok) setDirty(false)
            }}
          >
            {busy && <Loader2 className="animate-spin" aria-hidden="true" />}
            حفظ الصلاحيات
          </Button>
        </div>
      )}

      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent dir="rtl" className="text-right">
          <DialogHeader>
            <DialogTitle>تغيير كلمة مرور {admin.displayName}</DialogTitle>
          </DialogHeader>
          <Input
            type="password"
            dir="ltr"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8 أحرف على الأقل"
            aria-label="كلمة المرور الجديدة"
            autoComplete="new-password"
          />
          <DialogFooter>
            <Button
              disabled={busy || password.length < 8}
              onClick={async () => {
                const ok = await run(
                  () => api(`/api/admins/${admin.id}`, 'PATCH', { password }),
                  'تم تغيير كلمة المرور',
                )
                if (ok) {
                  setPassword('')
                  setPasswordOpen(false)
                }
              }}
            >
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent dir="rtl" className="text-right">
          <DialogHeader>
            <DialogTitle>حذف المشرف {admin.displayName}؟</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            لن يتمكن من تسجيل الدخول بعد الآن. تبقى منشوراته السابقة كما هي.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() => run(() => api(`/api/admins/${admin.id}`, 'DELETE'), 'تم حذف المشرف')}
            >
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </li>
  )
}

export function AdminsPanel() {
  const { data, isLoading, mutate } = useSWR<{ admins: Admin[] }>('/api/admins', fetcher)
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ displayName: '', username: '', password: '' })
  const [permissions, setPermissions] = useState<Permissions>(emptyPermissions())
  const [saving, setSaving] = useState(false)

  async function add(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await api('/api/admins', 'POST', { ...form, permissions })
      toast.success('تمت إضافة المشرف')
      setForm({ displayName: '', username: '', password: '' })
      setPermissions(emptyPermissions())
      setAddOpen(false)
      mutate()
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const admins = data?.admins ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <h2 className="font-semibold">المشرفون</h2>
            <p className="text-sm text-muted-foreground">
              أضف مشرفين وحدد لكل منهم صلاحيات النشر والتعديل والتثبيت في كل عمود.
            </p>
          </div>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus aria-hidden="true" />
          إضافة مشرف
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          جارٍ التحميل...
        </div>
      ) : admins.length === 0 ? (
        <p className="rounded-2xl border border-dashed py-12 text-center text-sm text-muted-foreground">
          لا يوجد مشرفون بعد
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {admins.map((a) => (
            <AdminCard key={a.id} admin={a} onChanged={() => mutate()} />
          ))}
        </ul>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent dir="rtl" className="text-right sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>إضافة مشرف جديد</DialogTitle>
          </DialogHeader>
          <form onSubmit={add} className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-name">الاسم الظاهر</Label>
                <Input
                  id="new-name"
                  required
                  value={form.displayName}
                  onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-username">اسم المستخدم</Label>
                <Input
                  id="new-username"
                  required
                  dir="ltr"
                  autoCapitalize="none"
                  pattern="[a-zA-Z0-9_.]{3,32}"
                  title="أحرف إنجليزية وأرقام فقط (3 أحرف على الأقل)"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-password">كلمة المرور</Label>
                <Input
                  id="new-password"
                  required
                  type="password"
                  dir="ltr"
                  minLength={8}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">الصلاحيات</span>
              <PermissionMatrix idPrefix="new" value={permissions} onChange={setPermissions} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="animate-spin" aria-hidden="true" />}
                إضافة
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
