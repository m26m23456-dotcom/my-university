export const SECTIONS = ['materials', 'announcements', 'tasks'] as const
export type Section = (typeof SECTIONS)[number]

export type SectionPermission = {
  post: boolean
  edit: boolean
  pin: boolean
}

export type Permissions = Partial<Record<Section, SectionPermission>>

export type Role = 'owner' | 'admin'

export type PublicUser = {
  id: string
  username: string
  displayName: string
  role: Role
  permissions: Permissions
}

export type SiteSettings = {
  siteName: string
  stageLabel: string
  collegeName: string
  welcomeTitle: string
  welcomeText: string
  authorName: string
  colors: {
    primary: string
    accent: string
    background: string
  }
  columns: Record<Section, string>
  courses: { 1: string; 2: string }
}

export type FileItem = {
  id: string
  name: string
  mime: string
  size: number
}

export type Post = {
  id: number
  section: Section
  subjectId: number | null
  body: string
  pinned: boolean
  authorName: string
  createdAt: string
  editedAt: string | null
  files: FileItem[]
}

export type Subject = {
  id: number
  course: number
  name: string
  postCount: number
}

export const SECTION_ACTIONS: { key: keyof SectionPermission; label: string }[] = [
  { key: 'post', label: 'النشر' },
  { key: 'edit', label: 'التعديل والحذف' },
  { key: 'pin', label: 'التثبيت' },
]

export function isSection(value: unknown): value is Section {
  return typeof value === 'string' && (SECTIONS as readonly string[]).includes(value)
}

export function can(
  user: PublicUser | null | undefined,
  section: Section,
  action: keyof SectionPermission,
): boolean {
  if (!user) return false
  if (user.role === 'owner') return true
  return Boolean(user.permissions?.[section]?.[action])
}
