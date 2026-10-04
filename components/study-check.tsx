'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { toast } from 'sonner'
import { useApp } from '@/components/app-provider'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { api, fetcher } from '@/lib/fetcher'

// يظهر لكل مشرف/مالك سؤال "هل درست اليوم؟" مرّة واحدة لكل يوم تذكير نشط،
// ضمن نافذة 12 ظهراً - 3 فجراً، ويُغلق لهذا المستخدم بعد أن يصوّت.
export function StudyCheck() {
  const { user } = useApp()
  const [dismissed, setDismissed] = useState(false)
  const [sending, setSending] = useState(false)

  const { data, mutate } = useSWR<{ active: boolean; day?: string }>(
    user ? '/api/study/today' : null,
    fetcher,
    { refreshInterval: 5 * 60 * 1000, revalidateOnFocus: true },
  )

  const open = Boolean(user && data?.active && !dismissed)

  async function vote(status: 'yes' | 'no') {
    if (sending) return
    setSending(true)
    try {
      await api('/api/study/vote', 'POST', { status })
      setDismissed(true)
      mutate()
      toast.success(status === 'yes' ? 'تم تسجيل: درستَ اليوم' : 'تم تسجيل: لم تدرس اليوم')
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setSending(false)
    }
  }

  return (
    // onOpenChange هنا تجاهل مؤقت فقط (×  أو الضغط خارج النافذة): لا يُسجَّل أي
    // تصويت ولا يُحفظ أي شيء، فتعود النافذة تظهر من جديد عند أي تحديث/دخول
    // جديد طالما التذكير نشط والمستخدم لم يضغط أحد زرّي التصويت فعلياً.
    <Dialog open={open} onOpenChange={(next) => !next && setDismissed(true)}>
      <DialogContent dir="rtl" className="text-right">
        <DialogHeader>
          <DialogTitle>هل درست اليوم؟</DialogTitle>
          <DialogDescription>تم تفعيل تذكير الدراسة اليوم، سجّل إجابتك.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" disabled={sending} onClick={() => vote('no')}>
            لم ادرس
          </Button>
          <Button disabled={sending} onClick={() => vote('yes')}>
            نعم درست
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
