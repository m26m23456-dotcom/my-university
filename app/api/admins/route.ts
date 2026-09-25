import { NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { asc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { appUsers } from '@/lib/db/schema'
import { hashPassword, HttpError, requireOwner } from '@/lib/auth'
import { handle, readJson } from '@/lib/api'
import { sanitizePermissions } from './permissions'

export const GET = handle(async () => {
  await requireOwner()
  const rows = await db
    .select({
      id: appUsers.id,
      username: appUsers.username,
      displayName: appUsers.displayName,
      role: appUsers.role,
      permissions: appUsers.permissions,
      createdAt: appUsers.createdAt,
    })
    .from(appUsers)
    .where(eq(appUsers.role, 'admin'))
    .orderBy(asc(appUsers.createdAt))
  return NextResponse.json({ admins: rows })
})

export const POST = handle(async (req: Request) => {
  await requireOwner()
  const body = await readJson<{
    username?: string
    password?: string
    displayName?: string
    permissions?: unknown
  }>(req)
  const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : ''
  if (!/^[a-z0-9_.]{3,32}$/.test(username)) {
    throw new HttpError(400, 'اسم المستخدم يجب أن يكون بالأحرف الإنجليزية (3 أحرف على الأقل)')
  }
  if (typeof body.password !== 'string' || body.password.length < 8) {
    throw new HttpError(400, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
  }
  const exists = await db.select({ id: appUsers.id }).from(appUsers).where(eq(appUsers.username, username))
  if (exists.length) throw new HttpError(409, 'اسم المستخدم مستخدم مسبقاً')
  const displayName =
    (typeof body.displayName === 'string' && body.displayName.trim().slice(0, 60)) || username
  await db.insert(appUsers).values({
    id: randomUUID(),
    username,
    displayName,
    passwordHash: await hashPassword(body.password),
    role: 'admin',
    permissions: sanitizePermissions(body.permissions),
  })
  return NextResponse.json({ ok: true })
})
