export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { studyReminders, studyVotes } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/auth'
import { handle } from '@/lib/api'
import { activeCheckinDay } from '@/lib/study'

export const GET = handle(async () => {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ active: false })

  const day = activeCheckinDay()
  if (!day) return NextResponse.json({ active: false })

  const reminder = await db
    .select({ day: studyReminders.day })
    .from(studyReminders)
    .where(eq(studyReminders.day, day))
    .limit(1)
  if (!reminder[0]) return NextResponse.json({ active: false })

  const vote = await db
    .select({ status: studyVotes.status })
    .from(studyVotes)
    .where(and(eq(studyVotes.userId, user.id), eq(studyVotes.day, day)))
    .limit(1)
  if (vote[0]) return NextResponse.json({ active: false })

  return NextResponse.json({ active: true, day })
})
