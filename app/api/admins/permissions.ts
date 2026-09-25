import { SECTIONS, type Permissions } from '@/lib/types'

export function sanitizePermissions(input: unknown): Permissions {
  const source = (input ?? {}) as Record<string, Record<string, unknown> | undefined>
  const result: Permissions = {}
  for (const section of SECTIONS) {
    const p = source[section] ?? {}
    result[section] = { post: p.post === true, edit: p.edit === true, pin: p.pin === true }
  }
  return result
}
