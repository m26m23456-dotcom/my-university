'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2 } from 'lucide-react'
import { useApp } from '@/components/app-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/fetcher'

export function AuthForm({ mode }: { mode: 'login' | 'setup' }) {
  const { settings, refreshUser } = useApp()
  const router = useRouter()
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setError('')
    setPending(true)
    try {
      await api(mode === 'setup' ? '/api/auth/setup' : '/api/auth/login', 'POST', {
        username: form.get('username'),
        password: form.get('password'),
        displayName: form.get('displayName'),
      })
      const res = (await refreshUser()) as { user?: { role?: string } } | undefined
      router.replace(res?.user?.role === 'owner' ? '/admin' : '/')
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
      setPending(false)
    }
  }

  return (
    <div className="w-full max-w-sm">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowRight className="size-4" aria-hidden="true" />
        العودة للرئيسية
      </Link>
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Image
            src="/logo.png"
            alt="شعار كلية الإدارة والاقتصاد - جامعة بغداد"
            width={64}
            height={64}
            className="size-16 rounded-full"
          />
          <div>
            <h1 className="text-xl font-bold text-primary">
              {mode === 'setup' ? 'إنشاء حساب المالك' : 'دخول المشرفين'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === 'setup'
                ? `أنشئ حساب المالك لإدارة ${settings.siteName}. يمكن إنشاء هذا الحساب مرة واحدة فقط.`
                : 'هذه الصفحة مخصصة للمالك والمشرفين فقط.'}
            </p>
          </div>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {mode === 'setup' && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="displayName">الاسم الظاهر</Label>
              <Input id="displayName" name="displayName" defaultValue={settings.authorName} required />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="username">اسم المستخدم</Label>
            <Input
              id="username"
              name="username"
              dir="ltr"
              autoComplete="username"
              autoCapitalize="none"
              required
              className="text-left"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">كلمة المرور</Label>
            <Input
              id="password"
              name="password"
              type="password"
              dir="ltr"
              autoComplete={mode === 'setup' ? 'new-password' : 'current-password'}
              minLength={mode === 'setup' ? 8 : undefined}
              required
              className="text-left"
            />
          </div>
          {error && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" disabled={pending} className="mt-1">
            {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
            {mode === 'setup' ? 'إنشاء الحساب' : 'تسجيل الدخول'}
          </Button>
        </form>
      </div>
    </div>
  )
}
