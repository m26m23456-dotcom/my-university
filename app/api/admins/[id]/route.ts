import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { appSessions, appUsers } from '@/lib/db/schema'
import { hashPassword, HttpError, requireOwner } from '@/lib/auth'
import { handle, readJson } from '@/lib/api'
import { sanitizePermissions } from '../permissions'

type Ctx = { params: Promise<{ id: string }> }

export const PATCH = handle(async (req: Request, ctx: Ctx) => {
  await requireOwner()
  const { id } = await ctx.params
  const body = await readJson<{ displayName?: string; password?: string; permissions?: unknown }>(req)
  const updates: Partial<typeof appUsers.$inferInsert> = {}
  if (body.permissions !== undefined) updates.permissions = sanitizePermissions(body.permissions)
  if (typeof body.displayName === 'string' && body.displayName.trim()) {
    updates.displayName = body.displayName.trim().slice(0, 60)
  }
  if (typeof body.password === 'string' && body.password.length) {
    if (body.password.length < 8) throw new HttpError(400, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    updates.passwordHash = await hashPassword(body.password)
  }
  if (!Object.keys(updates).length) throw new HttpError(400, 'لا توجد تغييرات')
  await db
    .update(appUsers)
    .set(updates)
    .where(and(eq(appUsers.id, id), eq(appUsers.role, 'admin')))
  if (updates.passwordHash) await db.delete(appSessions).where(eq(appSessions.userId, id))
  return NextResponse.json({ ok: true })
})

export const DELETE = handle(async (_req: Request, ctx: Ctx) => {
  await requireOwner()
  const { id } = await ctx.params
  await db.delete(appUsers).where(and(eq(appUsers.id, id), eq(appUsers.role, 'admin')))
  await db.delete(appSessions).where(eq(appSessions.userId, id))
  return NextResponse.json({ ok: true })
})
