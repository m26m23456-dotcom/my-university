export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { reminderDecisions, studyReminders } from '@/lib/db/schema'
import { HttpError, requirePermission } from '@/lib/auth'
import { handle, readJson } from '@/lib/api'
import { baghdadToday } from '@/lib/study'

export const POST = handle(async (req: Request) => {
  const user = await requirePermission('announcements', 'post')
  const body = await readJson<{ postId?: number; activate?: boolean }>(req)
  const postId = Number(body.postId)
  if (!postId) throw new HttpError(400, 'طلب غير صالح')

  const day = baghdadToday()
  const decision = body.activate ? 'yes' : 'no'

  await db.insert(reminderDecisions).values({ userId: user.id, day, decision })

  if (body.activate) {
    await db
      .insert(studyReminders)
      .values({ day, postId })
      .onConflictDoUpdate({ target: studyReminders.day, set: { postId } })
  }

  return NextResponse.json({ ok: true })
})
