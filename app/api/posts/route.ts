import { after, NextResponse, type NextRequest } from 'next/server'
import { and, eq, inArray, isNull, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { fileChunks, files, posts, subjects } from '@/lib/db/schema'
import { HttpError, requirePermission } from '@/lib/auth'
import { handle, readJson } from '@/lib/api'
import { listPosts } from '@/lib/posts'
import { notifySection } from '@/lib/push'
import { getSettings } from '@/lib/settings'
import { isSection } from '@/lib/types'

export const GET = handle(async (req: NextRequest) => {
  const params = req.nextUrl.searchParams
  const section = params.get('section')
  if (!isSection(section)) throw new HttpError(400, 'قسم غير صالح')
  const subject = Number(params.get('subject')) || null
  const result = await listPosts({ section, subjectId: subject, q: params.get('q') ?? '' })
  return NextResponse.json({ posts: result })
})

export const POST = handle(async (req: Request) => {
  const body = await readJson<{
    section?: string
    subjectId?: number
    body?: string
    fileIds?: string[]
  }>(req)
  if (!isSection(body.section)) throw new HttpError(400, 'قسم غير صالح')
  const section = body.section
  const user = await requirePermission(section, 'post')

  const text = typeof body.body === 'string' ? body.body.trim().slice(0, 8000) : ''
  const fileIds = Array.isArray(body.fileIds)
    ? body.fileIds.filter((f): f is string => typeof f === 'string').slice(0, 30)
    : []
  if (!text && !fileIds.length) throw new HttpError(400, 'لا يمكن نشر رسالة فارغة')

  let subjectId: number | null = null
  let subjectName = ''
  if (section === 'materials') {
    subjectId = Number(body.subjectId) || null
    if (!subjectId) throw new HttpError(400, 'اختر المادة أولاً')
    const s = await db.select().from(subjects).where(eq(subjects.id, subjectId)).limit(1)
    if (!s[0]) throw new HttpError(404, 'المادة غير موجودة')
    subjectName = s[0].name
  }

  if (fileIds.length) {
    const owned = await db
      .select({
        id: files.id,
        chunkCount: files.chunkCount,
        uploaded: sql<number>`(select count(*)::int from ${fileChunks} c where c.file_id = ${files.id})`,
      })
      .from(files)
      .where(and(inArray(files.id, fileIds), eq(files.uploadedBy, user.id), isNull(files.postId)))
    if (owned.length !== fileIds.length || owned.some((f) => f.uploaded !== f.chunkCount)) {
      throw new HttpError(400, 'لم يكتمل رفع بعض الملفات')
    }
  }

  const [post] = await db
    .insert(posts)
    .values({ section, subjectId, body: text, authorId: user.id, authorName: user.displayName })
    .returning()

  if (fileIds.length) {
    await db.update(files).set({ postId: post.id, complete: true }).where(inArray(files.id, fileIds))
  }

  after(async () => {
    const settings = await getSettings()
    const column = settings.columns[section]
    await notifySection(section, {
      title: `${settings.siteName} - ${column}${subjectName ? ` / ${subjectName}` : ''}`,
      body: text ? text.slice(0, 140) : `تم نشر ${fileIds.length} ملف جديد`,
      url: `/?tab=${section}`,
    })
  })

  return NextResponse.json({ id: post.id })
})
