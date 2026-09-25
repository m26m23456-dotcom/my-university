import 'server-only'
import webpush from 'web-push'
import { eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { pushSubscriptions, siteSettings } from '@/lib/db/schema'
import type { Section } from '@/lib/types'

type Vapid = { publicKey: string; privateKey: string }

let cachedVapid: Vapid | null = null

export async function getVapidKeys(): Promise<Vapid> {
  if (cachedVapid) return cachedVapid
  const existing = await db.select().from(siteSettings).where(eq(siteSettings.key, 'vapid')).limit(1)
  if (existing[0]) {
    cachedVapid = existing[0].value as Vapid
    return cachedVapid
  }
  const generated = webpush.generateVAPIDKeys()
  await db.insert(siteSettings).values({ key: 'vapid', value: generated }).onConflictDoNothing()
  const saved = await db.select().from(siteSettings).where(eq(siteSettings.key, 'vapid')).limit(1)
  cachedVapid = saved[0].value as Vapid
  return cachedVapid
}

export async function notifySection(
  section: Section,
  payload: { title: string; body: string; url: string },
) {
  try {
    const vapid = await getVapidKeys()
    const subs = await db
      .select()
      .from(pushSubscriptions)
      .where(sql`${section} = ANY(${pushSubscriptions.topics})`)
    if (!subs.length) return
    const message = JSON.stringify({ ...payload, tag: section })
    await Promise.allSettled(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            message,
            {
              vapidDetails: {
                subject: 'mailto:admin@myuniversity.app',
                publicKey: vapid.publicKey,
                privateKey: vapid.privateKey,
              },
              TTL: 60 * 60 * 24,
            },
          )
        } catch (error) {
          const status = (error as { statusCode?: number }).statusCode
          if (status === 404 || status === 410) {
            await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, s.endpoint))
          }
        }
      }),
    )
  } catch (error) {
    console.error('Push notification failed', error)
  }
}
