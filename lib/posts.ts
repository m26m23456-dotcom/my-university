import 'server-only'
import { and, asc, desc, eq, ilike, inArray, isNull, or, sql, type SQL } from 'drizzle-orm'
import { db } from '@/lib/db'
import { fileChunks, files, posts } from '@/lib/db/schema'
import type { Post, Section } from '@/lib/types'

export const CHUNK_SIZE = 2 * 1024 * 1024
export const MAX_FILE_SIZE = 150 * 1024 * 1024

export async function listPosts(opts: {
  section: Section
  subjectId?: number | null
  q?: string
}): Promise<Post[]> {
  const conditions: SQL[] = [eq(posts.section, opts.section)]
  const q = opts.q?.trim()
  if (opts.section === 'materials') {
    if (opts.subjectId) conditions.push(eq(posts.subjectId, opts.subjectId))
    else if (!q) conditions.push(isNull(posts.subjectId))
  }
  if (q) {
    const pattern = `%${q.replace(/[%_\\]/g, (m) => `\\${m}`)}%`
    conditions.push(
      or(
        ilike(posts.body, pattern),
        sql`exists (select 1 from ${files} f where f.post_id = ${posts.id} and f.name ilike ${pattern})`,
      )!,
    )
  }

  const rows = await db
    .select()
    .from(posts)
    .where(and(...conditions))
    .orderBy(desc(posts.createdAt))
    .limit(200)

  const ids = rows.map((r) => r.id)
  const fileRows = ids.length
    ? await db
        .select({ id: files.id, postId: files.postId, name: files.name, mime: files.mime, size: files.size })
        .from(files)
        .where(and(inArray(files.postId, ids), eq(files.complete, true)))
        .orderBy(asc(files.createdAt))
    : []

  return rows
    .map((r) => ({
      id: r.id,
      section: r.section as Section,
      subjectId: r.subjectId,
      body: r.body,
      pinned: r.pinned,
      authorName: r.authorName,
      createdAt: r.createdAt.toISOString(),
      editedAt: r.editedAt ? r.editedAt.toISOString() : null,
      files: fileRows
        .filter((f) => f.postId === r.id)
        .map((f) => ({ id: f.id, name: f.name, mime: f.mime, size: f.size })),
    }))
    .reverse()
}

export async function deleteFilesForPosts(postIds: number[]) {
  if (!postIds.length) return
  const fileRows = await db.select({ id: files.id }).from(files).where(inArray(files.postId, postIds))
  const fileIds = fileRows.map((f) => f.id)
  if (fileIds.length) {
    await db.delete(fileChunks).where(inArray(fileChunks.fileId, fileIds))
    await db.delete(files).where(inArray(files.id, fileIds))
  }
}

export async function cleanupOrphanFiles() {
  const stale = await db
    .select({ id: files.id })
    .from(files)
    .where(and(isNull(files.postId), sql`${files.createdAt} < now() - interval '1 day'`))
  const ids = stale.map((s) => s.id)
  if (!ids.length) return
  await db.delete(fileChunks).where(inArray(fileChunks.fileId, ids))
  await db.delete(files).where(inArray(files.id, ids))
}
