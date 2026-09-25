import { NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { cookies } from 'next/headers'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { visits } from '@/lib/db/schema'
import { cookieSecurity } from '@/lib/auth'
import { handle } from '@/lib/api'

const VISITOR_COOKIE = 'mu_vid'

export const POST = handle(async () => {
  const store = await cookies()
  let visitorId = store.get(VISITOR_COOKIE)?.value
  if (!visitorId || !/^[0-9a-f-]{36}$/.test(visitorId)) {
    visitorId = randomUUID()
    store.set(VISITOR_COOKIE, visitorId, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 365 * 2,
      ...cookieSecurity(),
    })
  }
  await db
    .insert(visits)
    .values({ visitorId, day: sql`CURRENT_DATE` as unknown as string })
    .onConflictDoUpdate({ target: [visits.visitorId, visits.day], set: { hits: sql`${visits.hits} + 1` } })
  return NextResponse.json({ ok: true })
})
