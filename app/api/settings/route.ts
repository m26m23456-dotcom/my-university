import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireOwner } from '@/lib/auth'
import { handle, readJson } from '@/lib/api'
import { DEFAULT_SETTINGS, getSettings, sanitizeSettings, saveSettings } from '@/lib/settings'

export const GET = handle(async () => {
  return NextResponse.json({ settings: await getSettings() })
})

export const PUT = handle(async (req: Request) => {
  await requireOwner()
  const body = await readJson<{ settings?: unknown; reset?: boolean }>(req)
  const current = await getSettings()
  const next = body.reset ? DEFAULT_SETTINGS : sanitizeSettings(body.settings, current)
  await saveSettings(next)
  revalidatePath('/', 'layout')
  return NextResponse.json({ settings: next })
})
