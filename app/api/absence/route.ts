export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { and, eq, inArray, isNull, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { absenceMessages, fileChunks, files } from '@/lib/db/schema'
import { listAbsenceMessages } from '@/lib/absence'
import { HttpError, getCurrentUser } from '@/lib/auth'
import { handle, readJson } from '@/lib/api'

export const GET = handle(async () => {
  const user = await getCurrentUser()
  if (!user) throw new HttpError(401, 'يجب تسجيل الدخول')
  const messages = await listAbsenceMessages()
  return NextResponse.json({ messages })
})

export const POST = handle(async (req: Request) => {
  const user = await getCurrentUser()
  if (!user) throw new HttpError(401, 'يجب تسجيل الدخول')

  const body = await readJson<{ body?: string; fileIds?: string[] }>(req)
  const text = typeof body.body === 'string' ? body.body.trim().slice(0, 8000) : ''
  const fileIds = Array.isArray(body.fileIds)
    ? body.fileIds.filter((f): f is string => typeof f === 'string').slice(0, 30)
    : []
  if (!text && !fileIds.length) throw new HttpError(400, 'لا يمكن إرسال رسالة فارغة')

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

  const [msg] = await db
    .insert(absenceMessages)
    .values({ body: text, authorId: user.id, authorName: user.displayName })
    .returning()

  if (fileIds.length) {
    await db
      .update(files)
      .set({ postId: msg.id, kind: 'absence', complete: true })
      .where(inArray(files.id, fileIds))
  }

  return NextResponse.json({ id: msg.id })
})
