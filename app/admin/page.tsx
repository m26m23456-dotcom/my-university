import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AdminDashboard } from '@/components/admin/admin-dashboard'
import { SiteHeader } from '@/components/site-header'
import { getCurrentUser } from '@/lib/auth'

export const metadata: Metadata = { title: 'لوحة التحكم' }

export default async function AdminPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role !== 'owner') redirect('/')
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:py-10">
        <AdminDashboard />
      </main>
    </div>
  )
}
