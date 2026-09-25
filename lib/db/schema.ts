import {
  bigint,
  boolean,
  customType,
  date,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'
import type { Permissions } from '@/lib/types'

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return 'bytea'
  },
})

export const siteSettings = pgTable('site_settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const appUsers = pgTable('app_users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  displayName: text('display_name').notNull(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('admin'),
  permissions: jsonb('permissions').$type<Permissions>().notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const appSessions = pgTable('app_sessions', {
  tokenHash: text('token_hash').primaryKey(),
  userId: text('user_id').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const subjects = pgTable('subjects', {
  id: serial('id').primaryKey(),
  course: integer('course').notNull(),
  name: text('name').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  section: text('section').notNull(),
  subjectId: integer('subject_id'),
  body: text('body').notNull().default(''),
  pinned: boolean('pinned').notNull().default(false),
  authorId: text('author_id'),
  authorName: text('author_name').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  editedAt: timestamp('edited_at', { withTimezone: true }),
})

export const files = pgTable('files', {
  id: text('id').primaryKey(),
  postId: integer('post_id'),
  name: text('name').notNull(),
  mime: text('mime').notNull(),
  size: bigint('size', { mode: 'number' }).notNull().default(0),
  chunkCount: integer('chunk_count').notNull().default(0),
  complete: boolean('complete').notNull().default(false),
  uploadedBy: text('uploaded_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const fileChunks = pgTable(
  'file_chunks',
  {
    fileId: text('file_id').notNull(),
    idx: integer('idx').notNull(),
    data: bytea('data').notNull(),
  },
  (t) => [primaryKey({ columns: [t.fileId, t.idx] })],
)

export const visits = pgTable(
  'visits',
  {
    visitorId: text('visitor_id').notNull(),
    day: date('day', { mode: 'string' }).notNull(),
    hits: integer('hits').notNull().default(1),
  },
  (t) => [primaryKey({ columns: [t.visitorId, t.day] })],
)

export const pushSubscriptions = pgTable('push_subscriptions', {
  endpoint: text('endpoint').primaryKey(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  topics: text('topics').array().notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
