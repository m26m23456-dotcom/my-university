import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { pushSubscriptions } from '@/lib/db/schema'
import { HttpError } from '@/lib/auth'
import { handle, readJson } from '@/lib/api'
import { getVapidKeys } from '@/lib/push'
import { isSection } from '@/lib/types'

export const GET = handle(async () => {
  const { publicKey } = await getVapidKeys()
  return NextResponse.json({ publicKey })
})

type Body = {
  action?: 'status' | 'save'
  subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } }
  topics?: unknown[]
}

export const POST = handle(async (req: Request) => {
  const body = await readJson<Body>(req)
  const endpoint = body.subscription?.endpoint
  if (typeof endpoint !== 'string' || !endpoint.startsWith('https://') || endpoint.length > 1000) {
    throw new HttpError(400, 'اشتراك غير صالح')
  }

  if (body.action === 'status') {
    const rows = await db
      .select({ topics: pushSubscriptions.topics })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint))
      .limit(1)
    return NextResponse.json({ topics: rows[0]?.topics ?? [] })
  }

  const p256dh = body.subscription?.keys?.p256dh
  const auth = body.subscription?.keys?.auth
  if (typeof p256dh !== 'string' || typeof auth !== 'string') throw new HttpError(400, 'اشتراك غير صالح')
  const topics = Array.from(new Set((body.topics ?? []).filter(isSection)))
  await db
    .insert(pushSubscriptions)
    .values({ endpoint, p256dh, auth, topics })
    .onConflictDoUpdate({ target: pushSubscriptions.endpoint, set: { p256dh, auth, topics } })
  return NextResponse.json({ topics })
})
