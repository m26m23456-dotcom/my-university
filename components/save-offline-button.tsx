'use client'

import { useEffect, useState } from 'react'
import { Check, CloudDownload, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// اسم الذخيرة (Cache) نفسه المستخدَم في public/sw.js — يجب أن يتطابقا.
const FILES_CACHE = 'offline-files'

// زر "حفظ للعرض بدون نت" يُستخدم على ملفات المواد/التبليغات/المهمات فقط
// (وليس سجل الغياب). الحفظ والحذف يحصلان مباشرة من الصفحة عبر Cache API؛
// لا حاجة لإرسال رسالة لـ Service Worker، فهو متاح هنا مباشرة أيضاً.
// عند فقد الشبكة لاحقاً، الـ Service Worker (sw.js) هو من يعيد الملف المحفوظ
// تلقائياً عند أي طلب لعنوانه، فتظهر الصورة/الفيديو/الـ PDF بدون أي تغيير آخر.
export function SaveOfflineButton({ url, className }: { url: string; className?: string }) {
  const [supported, setSupported] = useState(false)
  const [checked, setChecked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !('caches' in window)) return
    setSupported(true)
    let active = true
    caches
      .open(FILES_CACHE)
      .then((cache) => cache.match(url))
      .then((match) => {
        if (active) {
          setSaved(!!match)
          setChecked(true)
        }
      })
      .catch(() => active && setChecked(true))
    return () => {
      active = false
    }
  }, [url])

  if (!supported || !checked) return null

  async function toggle() {
    if (busy) return
    setBusy(true)
    try {
      const cache = await caches.open(FILES_CACHE)
      if (saved) {
        await cache.delete(url)
        setSaved(false)
      } else {
        const res = await fetch(url)
        if (!res.ok) throw new Error('fetch failed')
        await cache.put(url, res)
        setSaved(true)
      }
    } catch {
      // إجراء ثانوي — نتجاهل الفشل بصمت، يقدر المستخدم يعيد المحاولة.
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={saved}
      aria-label={saved ? 'إزالة الحفظ للعرض بدون نت' : 'حفظ للعرض بدون نت'}
      title={saved ? 'محفوظ للعرض بدون نت — اضغط للإزالة' : 'حفظ للعرض بدون نت'}
      className={cn(
        'inline-flex size-8 shrink-0 items-center justify-center rounded-full transition-colors',
        saved
          ? 'text-green-600 hover:bg-green-600/10'
          : 'text-muted-foreground hover:bg-secondary hover:text-primary',
        className,
      )}
    >
      {busy ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : saved ? (
        <Check className="size-4" aria-hidden="true" />
      ) : (
        <CloudDownload className="size-4" aria-hidden="true" />
      )}
    </button>
  )
}
