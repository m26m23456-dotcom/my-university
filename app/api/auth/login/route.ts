import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { appUsers } from '@/lib/db/schema'
import { createSession, HttpError, verifyPassword } from '@/lib/auth'
import { handle, readJson } from '@/lib/api'

export const POST = handle(async (req: Request) => {
  const { username, password } = await readJson<{ username?: string; password?: string }>(req)
  if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
    throw new HttpError(400, 'أدخل اسم المستخدم وكلمة المرور')
  }
  const rows = await db
    .select()
    .from(appUsers)
    .where(eq(appUsers.username, username.trim().toLowerCase()))
    .limit(1)
  const user = rows[0]
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new HttpError(401, 'اسم المستخدم أو كلمة المرور غير صحيحة')
  }
  await createSession(user.id)
  return NextResponse.json({ ok: true })
})
