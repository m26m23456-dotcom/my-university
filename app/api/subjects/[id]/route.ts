import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { posts, subjects } from '@/lib/db/schema'
import { HttpError, requirePermission } from '@/lib/auth'
import { handle, readJson } from '@/lib/api'
import { deleteFilesForPosts } from '@/lib/posts'

type Ctx = { params: Promise<{ id: string }> }

export const PATCH = handle(async (req: Request, ctx: Ctx) => {
  await requirePermission('materials', 'edit')
  const id = Number((await ctx.params).id)
  const { name } = await readJson<{ name?: string }>(req)
  const clean = typeof name === 'string' ? name.trim().slice(0, 80) : ''
  if (!clean) throw new HttpError(400, 'أدخل اسم المادة')
  await db.update(subjects).set({ name: clean }).where(eq(subjects.id, id))
  return NextResponse.json({ ok: true })
})

export const DELETE = handle(async (_req: Request, ctx: Ctx) => {
  await requirePermission('materials', 'edit')
  const id = Number((await ctx.params).id)
  const postRows = await db.select({ id: posts.id }).from(posts).where(eq(posts.subjectId, id))
  await deleteFilesForPosts(postRows.map((p) => p.id))
  await db.delete(posts).where(eq(posts.subjectId, id))
  await db.delete(subjects).where(eq(subjects.id, id))
  return NextResponse.json({ ok: true })
})
