export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { studyVotes } from '@/lib/db/schema'
import { HttpError, getCurrentUser } from '@/lib/auth'
import { handle, readJson } from '@/lib/api'
import { activeCheckinDay } from '@/lib/study'

export const POST = handle(async (req: Request) => {
  const user = await getCurrentUser()
  if (!user) throw new HttpError(401, 'يجب تسجيل الدخول')

  const body = await readJson<{ status?: string }>(req)
  if (body.status !== 'yes' && body.status !== 'no') throw new HttpError(400, 'طلب غير صالح')

  const day = activeCheckinDay()
  if (!day) throw new HttpError(400, 'لا يوجد تذكير نشط الآن')

  await db
    .insert(studyVotes)
    .values({ userId: user.id, day, status: body.status })
    .onConflictDoUpdate({ target: [studyVotes.userId, studyVotes.day], set: { status: body.status } })

  return NextResponse.json({ ok: true })
})
