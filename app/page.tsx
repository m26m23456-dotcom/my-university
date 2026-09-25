import { Board } from '@/components/board'
import { Hero } from '@/components/hero'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { isSection } from '@/lib/types'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <Hero />
        <Board initialTab={isSection(tab) ? tab : 'materials'} />
      </main>
      <SiteFooter />
    </div>
  )
}
