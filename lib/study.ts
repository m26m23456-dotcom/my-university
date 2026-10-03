import 'server-only'

// الكلمات التي إذا وردت في نص التبليغ تُعتبر "تحضير/تحظير لبكرة"
export const STUDY_KEYWORDS = [
  'باجر تحظير',
  'باجر تحضير',
  'تحضير',
  'تحظير',
  'تحاظير باجر',
  'تحاضير باجر',
]

export function matchesStudyKeyword(text: string): boolean {
  if (!text) return false
  return STUDY_KEYWORDS.some((k) => text.includes(k))
}

// بغداد = UTC+3 طوال السنة (لا يوجد توقيت صيفي)
const BAGHDAD_OFFSET_MS = 3 * 60 * 60 * 1000

function baghdadNow(): Date {
  return new Date(Date.now() + BAGHDAD_OFFSET_MS)
}

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10)
}

// تاريخ اليوم الحالي بتوقيت بغداد (يُستخدم عند تفعيل التذكير وقت النشر)
export function baghdadToday(): string {
  return isoDay(baghdadNow())
}

// اليوم الذي تخصّه نافذة المتابعة الحالية، أو null إذا كنا خارج النافذة.
// النافذة: من الساعة 12:00 ظهراً وحتى 3:00 فجراً اليوم التالي، وتُحسب
// بالكامل على أنها تابعة لليوم الذي بدأت فيه (نفس يوم الظهر).
export function activeCheckinDay(): string | null {
  const now = baghdadNow()
  const hour = now.getUTCHours()
  if (hour >= 12) {
    return isoDay(now)
  }
  if (hour < 3) {
    const prevDay = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    return isoDay(prevDay)
  }
  return null
}

export function monthRange(month: string): { from: string; to: string } {
  const [y, m] = month.split('-').map(Number)
  const lastDay = new Date(y, m, 0).getDate()
  return { from: `${month}-01`, to: `${month}-${String(lastDay).padStart(2, '0')}` }
}
