import 'server-only'
import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { and, eq, gt } from 'drizzle-orm'
import { db } from '@/lib/db'
import { appSessions, appUsers } from '@/lib/db/schema'
import type { PublicUser, Role, Section, SectionPermission } from '@/lib/types'
import { can } from '@/lib/types'

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>

export const SESSION_COOKIE = 'mu_session'
const SESSION_DAYS = 30

export function cookieSecurity() {
  const isDev = process.env.NODE_ENV === 'development'
  return isDev
    ? ({ sameSite: 'none', secure: true } as const)
    : ({ sameSite: 'lax', secure: true } as const)
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16)
  const hash = await scrypt(password, salt, 64)
  return `${salt.toString('hex')}:${hash.toString('hex')}`
}

export async function verifyPassword(password: string, stored: string) {
  const [saltHex, hashHex] = stored.split(':')
  if (!saltHex || !hashHex) return false
  const expected = Buffer.from(hashHex, 'hex')
  const actual = await scrypt(password, Buffer.from(saltHex, 'hex'), expected.length)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
  await db.insert(appSessions).values({ tokenHash: hashToken(token), userId, expiresAt })
  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    path: '/',
    expires: expiresAt,
    ...cookieSecurity(),
  })
}

export async function destroySession() {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (token) await db.delete(appSessions).where(eq(appSessions.tokenHash, hashToken(token)))
  store.delete(SESSION_COOKIE)
}

export const getCurrentUser = cache(async (): Promise<PublicUser | null> => {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null
  try {
    const rows = await db
      .select({
        id: appUsers.id,
        username: appUsers.username,
        displayName: appUsers.displayName,
        role: appUsers.role,
        permissions: appUsers.permissions,
      })
      .from(appSessions)
      .innerJoin(appUsers, eq(appUsers.id, appSessions.userId))
      .where(and(eq(appSessions.tokenHash, hashToken(token)), gt(appSessions.expiresAt, new Date())))
      .limit(1)
    const row = rows[0]
    if (!row) return null
    return { ...row, role: row.role as Role, permissions: row.permissions ?? {} }
  } catch (error) {
    console.error('Failed to load session', error)
    return null
  }
})

export async function hasOwner() {
  const rows = await db
    .select({ id: appUsers.id })
    .from(appUsers)
    .where(eq(appUsers.role, 'owner'))
    .limit(1)
  return rows.length > 0
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

export async function requireOwner() {
  const user = await getCurrentUser()
  if (!user) throw new HttpError(401, 'يجب تسجيل الدخول')
  if (user.role !== 'owner') throw new HttpError(403, 'هذه الصلاحية للمالك فقط')
  return user
}

export async function requirePermission(section: Section, action: keyof SectionPermission) {
  const user = await getCurrentUser()
  if (!user) throw new HttpError(401, 'يجب تسجيل الدخول')
  if (!can(user, section, action)) throw new HttpError(403, 'ليس لديك صلاحية لهذا الإجراء')
  return user
}
