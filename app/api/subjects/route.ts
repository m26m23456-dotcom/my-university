import { NextResponse, type NextRequest } from 'next/server'
import { asc, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { posts, subjects } from '@/lib/db/schema'
import { HttpError, requirePermission } from '@/lib/auth'
import { handle, readJson } from '@/lib/api'

export const GET = handle(async (req: NextRequest) => {
  const course = Number(req.nextUrl.searchParams.get('course'))
  if (course !== 1 && course !== 2) throw new HttpError(400, 'كورس غير صالح')
  const rows = await db
    .select({
      id: subjects.id,
      course: subjects.course,
      name: subjects.name,
      postCount: sql<number>`(select count(*)::int from ${posts} p where p.subject_id = ${subjects.id})`,
    })
    .from(subjects)
    .where(eq(subjects.course, course))
    .orderBy(asc(subjects.sortOrder), asc(subjects.id))
  return NextResponse.json({ subjects: rows })
})

export const POST = handle(async (req: Request) => {
  await requirePermission('materials', 'edit')
  const { course, name } = await readJson<{ course?: number; name?: string }>(req)
  if (course !== 1 && course !== 2) throw new HttpError(400, 'كورس غير صالح')
  const clean = typeof name === 'string' ? name.trim().slice(0, 80) : ''
  if (!clean) throw new HttpError(400, 'أدخل اسم المادة')
  const [row] = await db.insert(subjects).values({ course, name: clean }).returning()
  return NextResponse.json({ subject: row })
})
