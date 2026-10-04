export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { and, eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { absenceMessages, fileChunks, files } from '@/lib/db/schema'
import { HttpError, getCurrentUser } from '@/lib/auth'
import { handle, readJson } from '@/lib/api'

type Ctx = { params: Promise<{ id: string }> }

async function loadMessage(id: number) {
  if (!Number.isInteger(id)) return null
  const rows = await db.select().from(absenceMessages).where(eq(absenceMessages.id, id)).limit(1)
  return rows[0] ?? null
}

export const PATCH = handle(async (req: Request, ctx: Ctx) => {
  const user = await getCurrentUser()
  if (!user) throw new HttpError(401, 'يجب تسجيل الدخول')

  const msgId = Number((await ctx.params).id)
  const msg = await loadMessage(msgId)
  if (!msg) throw new HttpError(404, 'الرسالة غير موجودة')
  if (user.role !== 'owner' && msg.authorId !== user.id) {
    throw new HttpError(403, 'لا يمكنك تعديل رسالة شخص آخر')
  }

  const body = await readJson<{ body?: string }>(req)
  const text = typeof body.body === 'string' ? body.body.trim().slice(0, 8000) : ''
  await db
    .update(absenceMessages)
    .set({ body: text, editedAt: new Date() })
    .where(eq(absenceMessages.id, msgId))
  return NextResponse.json({ ok: true })
})

export const DELETE = handle(async (_req: Request, ctx: Ctx) => {
  const user = await getCurrentUser()
  if (!user) throw new HttpError(401, 'يجب تسجيل الدخول')

  const msgId = Number((await ctx.params).id)
  const msg = await loadMessage(msgId)
  if (!msg) throw new HttpError(404, 'الرسالة غير موجودة')
  if (user.role !== 'owner' && msg.authorId !== user.id) {
    throw new HttpError(403, 'لا يمكنك حذف رسالة شخص آخر')
  }

  const fileRows = await db
    .select({ id: files.id })
    .from(files)
    .where(and(eq(files.postId, msgId), eq(files.kind, 'absence')))
  const fileIds = fileRows.map((f) => f.id)
  if (fileIds.length) {
    await db.delete(fileChunks).where(inArray(fileChunks.fileId, fileIds))
    await db.delete(files).where(inArray(files.id, fileIds))
  }

  await db.delete(absenceMessages).where(eq(absenceMessages.id, msgId))
  return NextResponse.json({ ok: true })
})
