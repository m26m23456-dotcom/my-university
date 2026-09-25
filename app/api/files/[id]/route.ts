import { NextResponse, type NextRequest } from 'next/server'
import { and, asc, between, eq, isNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { fileChunks, files } from '@/lib/db/schema'
import { getCurrentUser, HttpError } from '@/lib/auth'
import { handle } from '@/lib/api'
import { CHUNK_SIZE } from '@/lib/posts'

type Ctx = { params: Promise<{ id: string }> }

export const PUT = handle(async (req: NextRequest, ctx: Ctx) => {
  const user = await getCurrentUser()
  if (!user) throw new HttpError(401, 'يجب تسجيل الدخول')
  const { id } = await ctx.params
  const idx = Number(req.nextUrl.searchParams.get('idx'))
  const rows = await db
    .select()
    .from(files)
    .where(and(eq(files.id, id), eq(files.uploadedBy, user.id), isNull(files.postId)))
    .limit(1)
  const file = rows[0]
  if (!file) throw new HttpError(404, 'الملف غير موجود')
  if (!Number.isInteger(idx) || idx < 0 || idx >= file.chunkCount) {
    throw new HttpError(400, 'جزء غير صالح')
  }
  const data = Buffer.from(await req.arrayBuffer())
  const expected = idx === file.chunkCount - 1 ? file.size - idx * CHUNK_SIZE : CHUNK_SIZE
  if (data.length !== expected) throw new HttpError(400, 'حجم الجزء غير صحيح')
  await db
    .insert(fileChunks)
    .values({ fileId: id, idx, data })
    .onConflictDoUpdate({ target: [fileChunks.fileId, fileChunks.idx], set: { data } })
  return NextResponse.json({ ok: true })
})

function parseRange(header: string | null, size: number) {
  if (!header) return null
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim())
  if (!match) return null
  let start: number
  let end: number
  if (match[1] === '') {
    const suffix = Number(match[2])
    start = Math.max(0, size - suffix)
    end = size - 1
  } else {
    start = Number(match[1])
    end = match[2] === '' ? size - 1 : Math.min(Number(match[2]), size - 1)
  }
  if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= size) return 'invalid'
  return { start, end }
}

export const GET = handle(async (req: NextRequest, ctx: Ctx) => {
  const { id } = await ctx.params
  const rows = await db.select().from(files).where(eq(files.id, id)).limit(1)
  const file = rows[0]
  if (!file) return new NextResponse('Not found', { status: 404 })

  const range = parseRange(req.headers.get('range'), file.size)
  if (range === 'invalid') {
    return new NextResponse(null, { status: 416, headers: { 'Content-Range': `bytes */${file.size}` } })
  }
  const start = range?.start ?? 0
  const end = range?.end ?? file.size - 1
  const firstChunk = Math.floor(start / CHUNK_SIZE)
  const lastChunk = Math.floor(end / CHUNK_SIZE)
  let current = firstChunk

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (current > lastChunk) {
        controller.close()
        return
      }
      const batchEnd = Math.min(current + 1, lastChunk)
      const chunkRows = await db
        .select({ idx: fileChunks.idx, data: fileChunks.data })
        .from(fileChunks)
        .where(and(eq(fileChunks.fileId, id), between(fileChunks.idx, current, batchEnd)))
        .orderBy(asc(fileChunks.idx))
      if (!chunkRows.length) {
        controller.close()
        return
      }
      for (const row of chunkRows) {
        const chunkStart = row.idx * CHUNK_SIZE
        const from = Math.max(0, start - chunkStart)
        const to = Math.min(row.data.length, end - chunkStart + 1)
        controller.enqueue(new Uint8Array(row.data.subarray(from, to)))
      }
      current = batchEnd + 1
    },
  })

  const download = req.nextUrl.searchParams.get('download') === '1'
  const headers: Record<string, string> = {
    'Content-Type': file.mime,
    'Content-Length': String(end - start + 1),
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(file.name)}`,
    'X-Content-Type-Options': 'nosniff',
  }
  if (range) headers['Content-Range'] = `bytes ${start}-${end}/${file.size}`
  return new NextResponse(stream, { status: range ? 206 : 200, headers })
})
