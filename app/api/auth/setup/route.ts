import { NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { db } from '@/lib/db'
import { appUsers } from '@/lib/db/schema'
import { createSession, hashPassword, hasOwner, HttpError } from '@/lib/auth'
import { handle, readJson } from '@/lib/api'

export const POST = handle(async (req: Request) => {
  if (await hasOwner()) throw new HttpError(409, 'تم إنشاء حساب المالك مسبقاً')
  const { username, password, displayName } = await readJson<{
    username?: string
    password?: string
    displayName?: string
  }>(req)
  const cleanUsername = typeof username === 'string' ? username.trim().toLowerCase() : ''
  if (!/^[a-z0-9_.]{3,32}$/.test(cleanUsername)) {
    throw new HttpError(400, 'اسم المستخدم يجب أن يكون بالأحرف الإنجليزية (3 أحرف على الأقل)')
  }
  if (typeof password !== 'string' || password.length < 8) {
    throw new HttpError(400, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
  }
  const id = randomUUID()
  await db.insert(appUsers).values({
    id,
    username: cleanUsername,
    displayName: (typeof displayName === 'string' && displayName.trim().slice(0, 60)) || 'المالك',
    passwordHash: await hashPassword(password),
    role: 'owner',
    permissions: {},
  })
  await createSession(id)
  return NextResponse.json({ ok: true })
})
