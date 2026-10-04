import 'server-only'
import { and, asc, desc, eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { absenceMessages, files } from '@/lib/db/schema'
import type { AbsenceMessage } from '@/lib/types'

export async function listAbsenceMessages(): Promise<AbsenceMessage[]> {
  const rows = await db
    .select()
    .from(absenceMessages)
    .orderBy(desc(absenceMessages.createdAt))
    .limit(300)

  const ids = rows.map((r) => r.id)
  const fileRows = ids.length
    ? await db
        .select({ id: files.id, postId: files.postId, name: files.name, mime: files.mime, size: files.size })
        .from(files)
        .where(and(inArray(files.postId, ids), eq(files.kind, 'absence'), eq(files.complete, true)))
        .orderBy(asc(files.createdAt))
    : []

  return rows
    .map((r) => ({
      id: r.id,
      body: r.body,
      authorId: r.authorId,
      authorName: r.authorName,
      createdAt: r.createdAt.toISOString(),
      editedAt: r.editedAt ? r.editedAt.toISOString() : null,
      files: fileRows
        .filter((f) => f.postId === r.id)
        .map((f) => ({ id: f.id, name: f.name, mime: f.mime, size: f.size })),
    }))
    .reverse()
}
