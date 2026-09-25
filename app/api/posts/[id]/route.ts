import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { posts } from '@/lib/db/schema'
import { HttpError, requirePermission } from '@/lib/auth'
import { handle, readJson } from '@/lib/api'
import { deleteFilesForPosts } from '@/lib/posts'
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
  const body = await readJson<{ body?: string; pinned?: boolean }>(req)

  if (typeof body.pinned === 'boolean') {
    await requirePermission(post.section, 'pin')
    await db.update(posts).set({ pinned: body.pinned }).where(eq(posts.id, post.id))
  }
  if (typeof body.body === 'string') {
    await requirePermission(post.section, 'edit')
    await db
      .update(posts)
      .set({ body: body.body.trim().slice(0, 8000), editedAt: new Date() })
      .where(eq(posts.id, post.id))
  }
  return NextResponse.json({ ok: true })
})

export const DELETE = handle(async (_req: Request, ctx: Ctx) => {
  const post = await loadPost(ctx)
  await requirePermission(post.section, 'edit')
  await deleteFilesForPosts([post.id])
  await db.delete(posts).where(eq(posts.id, post.id))
  return NextResponse.json({ ok: true })
})
