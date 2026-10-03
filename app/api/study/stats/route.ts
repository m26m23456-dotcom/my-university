export const dynamic = 'force-dynamic'

import { NextResponse, type NextRequest } from 'next/server'
import { and, gte, lte } from 'drizzle-orm'
import { db } from '@/lib/db'
import { appUsers, reminderDecisions, studyReminders, studyVotes } from '@/lib/db/schema'
import { HttpError, getCurrentUser } from '@/lib/auth'
import { handle } from '@/lib/api'
import { baghdadToday, monthRange } from '@/lib/study'

export const GET = handle(async (req: NextRequest) => {
  const user = await getCurrentUser()
  if (!user) throw new HttpError(401, 'يجب تسجيل الدخول')

  const month = req.nextUrl.searchParams.get('month') || baghdadToday().slice(0, 7)
  if (!/^\d{4}-\d{2}$/.test(month)) throw new HttpError(400, 'شهر غير صالح')
  const { from, to } = monthRange(month)

  const users = await db
    .select({ id: appUsers.id, displayName: appUsers.displayName, role: appUsers.role })
    .from(appUsers)

  const reminders = await db
    .select({ day: studyReminders.day })
    .from(studyReminders)
    .where(and(gte(studyReminders.day, from), lte(studyReminders.day, to)))
  const activeDays = [...new Set(reminders.map((r) => r.day))].sort()

  const decisions = await db
    .select()
    .from(reminderDecisions)
    .where(and(gte(reminderDecisions.day, from), lte(reminderDecisions.day, to)))

  const votes = activeDays.length
    ? await db
        .select()
        .from(studyVotes)
        .where(and(gte(studyVotes.day, from), lte(studyVotes.day, to)))
    : []

  const data = users.map((u) => {
    const userDecisions = decisions.filter((d) => d.userId === u.id)
    const decisionTotals = {
      yes: userDecisions.filter((d) => d.decision === 'yes').length,
      no: userDecisions.filter((d) => d.decision === 'no').length,
    }

    const days = activeDays.map((day) => {
      const v = votes.find((vt) => vt.userId === u.id && vt.day === day)
      const status: 'yes' | 'no' | 'pending' = v ? (v.status as 'yes' | 'no') : 'pending'
      return { day, status }
    })

    const totals = {
      yes: days.filter((d) => d.status === 'yes').length,
      no: days.filter((d) => d.status === 'no').length,
      pending: days.filter((d) => d.status === 'pending').length,
    }

    return { id: u.id, name: u.displayName, role: u.role, decisions: decisionTotals, days, totals }
  })

  return NextResponse.json({ month, activeDays, users: data })
})
