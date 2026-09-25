import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AuthForm } from '@/components/auth-form'
import { getCurrentUser, hasOwner } from '@/lib/auth'

export const metadata: Metadata = { title: 'تسجيل الدخول' }

export default async function LoginPage() {
  const user = await getCurrentUser()
  if (user) redirect(user.role === 'owner' ? '/admin' : '/')
  const ownerExists = await hasOwner()
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <AuthForm mode={ownerExists ? 'login' : 'setup'} />
    </main>
  )
}
