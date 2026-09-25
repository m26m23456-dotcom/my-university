import { after, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { db } from '@/lib/db'
import { files } from '@/lib/db/schema'
import { getCurrentUser, HttpError } from '@/lib/auth'
import { handle, readJson } from '@/lib/api'
import { CHUNK_SIZE, cleanupOrphanFiles, MAX_FILE_SIZE } from '@/lib/posts'
import { can, SECTIONS } from '@/lib/types'

const ALLOWED = /^(image\/(jpeg|png|webp|gif|heic|heif)|video\/(mp4|webm|quicktime|x-m4v)|application\/pdf)$/

export const POST = handle(async (req: Request) => {
  const user = await getCurrentUser()
  if (!user || !SECTIONS.some((s) => can(user, s, 'post'))) {
    throw new HttpError(403, 'ليس لديك صلاحية رفع الملفات')
  }
  const { name, mime, size } = await readJson<{ name?: string; mime?: string; size?: number }>(req)
  if (typeof name !== 'string' || typeof mime !== 'string' || typeof size !== 'number') {
    throw new HttpError(400, 'بيانات الملف غير صالحة')
  }
  if (!ALLOWED.test(mime)) throw new HttpError(400, 'نوع الملف غير مدعوم (PDF، صور، فيديو فقط)')
  if (size <= 0 || size > MAX_FILE_SIZE) {
    throw new HttpError(400, `الحد الأقصى لحجم الملف ${MAX_FILE_SIZE / 1024 / 1024} ميغابايت`)
  }

  const id = randomUUID()
  const chunkCount = Math.ceil(size / CHUNK_SIZE)
  await db.insert(files).values({
    id,
    name: name.slice(0, 200),
    mime,
    size,
    chunkCount,
    uploadedBy: user.id,
  })
  after(cleanupOrphanFiles)
  return NextResponse.json({ id, chunkSize: CHUNK_SIZE, chunkCount })
})
