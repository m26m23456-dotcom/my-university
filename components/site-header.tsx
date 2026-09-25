'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LayoutDashboard, LogIn, LogOut, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { useApp } from '@/components/app-provider'
import { InstallButton } from '@/components/install-button'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { api } from '@/lib/fetcher'

export function SiteHeader() {
  const { settings, user, refreshUser } = useApp()
  const router = useRouter()

  async function logout() {
    try {
      await api('/api/auth/logout', 'POST')
      await refreshUser()
      router.refresh()
      toast.success('تم تسجيل الخروج')
    } catch (error) {
      toast.error((error as Error).message)
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/75">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <Image
            src="/logo.png"
            alt="شعار كلية الإدارة والاقتصاد - جامعة بغداد"
            width={40}
            height={40}
            className="size-10 shrink-0 rounded-full"
            priority
          />
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate font-semibold text-primary" dir="auto">
              {settings.siteName}
            </span>
            <span className="truncate text-xs text-muted-foreground">{settings.stageLabel}</span>
          </div>
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <InstallButton />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="outline" size="icon" aria-label="حساب المستخدم" />}
              >
                <UserRound aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-48">
                <DropdownMenuLabel className="text-right">
                  <span className="block font-medium text-foreground">{user.displayName}</span>
                  <span className="text-xs text-muted-foreground">
                    {user.role === 'owner' ? 'مالك الموقع' : 'مشرف'}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user.role === 'owner' && (
                  <DropdownMenuItem onClick={() => router.push('/admin')}>
                    <LayoutDashboard aria-hidden="true" />
                    لوحة التحكم
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={logout} variant="destructive">
                  <LogOut aria-hidden="true" />
                  تسجيل الخروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href="/login"
              aria-label="دخول المشرفين"
              className={buttonVariants({ variant: 'ghost', size: 'icon' })}
            >
              <LogIn aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
