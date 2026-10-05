import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { posts } from '@/lib/db/schema'
import { HttpError, requirePermission } from '@/lib/auth'
import { handle, readJson } from '@/lib/api'
import { deleteFilesForPosts } from '@/lib/posts'
import { matchesStudyKeyword } from '@/lib/study'
import { isSection } from '@/lib/types'

type Ctx = { params: Promise<{ id: string }> }

async function loadPost(ctx: Ctx) {
  const id = Number((await ctx.params).id)
  const rows = await db.select().from(posts).where(eq(posts.id, id)).limit(1)
  const post = rows[0]
  if (!post || !isSection(post.section)) throw new HttpError(404, 'المنشور غير موجود')
  return { ...post, section: post.section }
}

export const PATCH = handle(async (req: Request, ctx: Ctx) => {
  const post = await loadPost(ctx)
  const body = await readJson<{ body?: string; pinned?: boolean; createdAt?: string }>(req)
  // نفس شرط النشر: تعديل تبليغ ليتضمّن كلمة التحضير/التحظير يطلب تفعيل
  // تذكير الدراسة أيضاً، وليس فقط عند إنشاء منشور جديد.
  let reminderPrompt = false

  if (typeof body.pinned === 'boolean') {
    await requirePermission(post.section, 'pin')
    await db.update(posts).set({ pinned: body.pinned }).where(eq(posts.id, post.id))
  }
  if (typeof body.createdAt === 'string') {
    await requirePermission(post.section, 'edit')
    await db.update(posts).set({ createdAt: new Date(body.createdAt) }).where(eq(posts.id, post.id))
  }

  if (typeof body.body === 'string') {
    await requirePermission(post.section, 'edit')
    const text = body.body.trim().slice(0, 8000)
    await db.update(posts).set({ body: text, editedAt: new Date() }).where(eq(posts.id, post.id))
    reminderPrompt = post.section === 'announcements' && matchesStudyKeyword(text)
  }
  return NextResponse.json({ ok: true, reminderPrompt })
})

export const DELETE = handle(async (_req: Request, ctx: Ctx) => {
  const post = await loadPost(ctx)
  await requirePermission(post.section, 'edit')
  await deleteFilesForPosts([post.id])
  await db.delete(posts).where(eq(posts.id, post.id))
  return NextResponse.json({ ok: true })
})
