import 'server-only'
import { cache } from 'react'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { siteSettings } from '@/lib/db/schema'
import type { SiteSettings } from '@/lib/types'

export const DEFAULT_SETTINGS: SiteSettings = {
  siteName: 'My university',
  stageLabel: 'المرحلة الثانية',
  collegeName: 'كلية الإدارة والاقتصاد - جامعة بغداد',
  welcomeTitle: 'أهلاً وسهلاً بكم',
  welcomeText:
    'منصة طلبة المرحلة الثانية في كلية الإدارة والاقتصاد - جامعة بغداد. تجدون هنا المواد الدراسية والتبليغات والمهمات في مكان واحد.',
  authorName: 'محمد عادل',
  colors: {
    primary: '#1e4d5c',
    accent: '#a8864f',
    background: '#f5f3ee',
  },
  columns: {
    materials: 'المواد',
    announcements: 'التبليغات',
    tasks: 'المهمات',
  },
  courses: { 1: 'الكورس الأول', 2: 'الكورس الثاني' },
}

function merge(value: Partial<SiteSettings> | null | undefined): SiteSettings {
  const v = value ?? {}
  return {
    ...DEFAULT_SETTINGS,
    ...v,
    colors: { ...DEFAULT_SETTINGS.colors, ...(v.colors ?? {}) },
    columns: { ...DEFAULT_SETTINGS.columns, ...(v.columns ?? {}) },
    courses: { ...DEFAULT_SETTINGS.courses, ...(v.courses ?? {}) },
  }
}

export const getSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const rows = await db.select().from(siteSettings).where(eq(siteSettings.key, 'site')).limit(1)
    return merge(rows[0]?.value as Partial<SiteSettings> | undefined)
  } catch (error) {
    console.error('Failed to load settings', error)
    return DEFAULT_SETTINGS
  }
})

const HEX = /^#[0-9a-fA-F]{6}$/

function str(value: unknown, fallback: string, max = 300) {
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim().slice(0, max)
  return trimmed.length ? trimmed : fallback
}

function color(value: unknown, fallback: string) {
  return typeof value === 'string' && HEX.test(value) ? value : fallback
}

export function sanitizeSettings(input: unknown, current: SiteSettings): SiteSettings {
  const v = (input ?? {}) as Partial<SiteSettings>
  return {
    siteName: str(v.siteName, current.siteName, 60),
    stageLabel: str(v.stageLabel, current.stageLabel, 60),
    collegeName: str(v.collegeName, current.collegeName, 120),
    welcomeTitle: str(v.welcomeTitle, current.welcomeTitle, 120),
    welcomeText: str(v.welcomeText, current.welcomeText, 600),
    authorName: str(v.authorName, current.authorName, 60),
    colors: {
      primary: color(v.colors?.primary, current.colors.primary),
      accent: color(v.colors?.accent, current.colors.accent),
      background: color(v.colors?.background, current.colors.background),
    },
    columns: {
      materials: str(v.columns?.materials, current.columns.materials, 40),
      announcements: str(v.columns?.announcements, current.columns.announcements, 40),
      tasks: str(v.columns?.tasks, current.columns.tasks, 40),
    },
    courses: {
      1: str(v.courses?.[1], current.courses[1], 40),
      2: str(v.courses?.[2], current.courses[2], 40),
    },
  }
}

export async function saveSettings(next: SiteSettings) {
  await db
    .insert(siteSettings)
    .values({ key: 'site', value: next })
    .onConflictDoUpdate({ target: siteSettings.key, set: { value: next, updatedAt: new Date() } })
}
