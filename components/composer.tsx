'use client'

import { useRef, useState } from 'react'
import { FileText, Loader2, Paperclip, SendHorizontal, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { api, formatBytes, uploadFile } from '@/lib/fetcher'
import type { Section } from '@/lib/types'
import { cn } from '@/lib/utils'

type Pending = { key: string; file: File; preview: string | null; progress: number }

const ACCEPT = 'application/pdf,image/*,video/mp4,video/webm,video/quicktime'

export function Composer({
  section,
  subjectId,
  onPosted,
}: {
  section: Section
  subjectId?: number
  onPosted: () => void
}) {
  const [text, setText] = useState('')
  const [pending, setPending] = useState<Pending[]>([])
  const [sending, setSending] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const textRef = useRef<HTMLTextAreaElement>(null)

  function addFiles(list: FileList | null) {
    if (!list) return
    const next: Pending[] = Array.from(list).map((file) => ({
      key: `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`,
      file,
      preview:
        file.type.startsWith('image/') || file.type.startsWith('video/')
          ? URL.createObjectURL(file)
          : null,
      progress: 0,
    }))
    setPending((prev) => [...prev, ...next].slice(0, 30))
  }

  function remove(key: string) {
    setPending((prev) => {
      const item = prev.find((p) => p.key === key)
      if (item?.preview) URL.revokeObjectURL(item.preview)
      return prev.filter((p) => p.key !== key)
    })
  }

  async function send() {
    if (sending || (!text.trim() && !pending.length)) return
    setSending(true)
    try {
      const fileIds: string[] = []
      for (const item of pending) {
        const id = await uploadFile(item.file, (ratio) =>
          setPending((prev) => prev.map((p) => (p.key === item.key ? { ...p, progress: ratio } : p))),
        )
        fileIds.push(id)
      }
      await api('/api/posts', 'POST', { section, subjectId, body: text, fileIds })
      pending.forEach((p) => p.preview && URL.revokeObjectURL(p.preview))
      setPending([])
      setText('')
      if (textRef.current) textRef.current.style.height = ''
      onPosted()
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="border-t bg-card p-2">
      {pending.length > 0 && (
        <ul className="scrollbar-thin mb-2 flex gap-2 overflow-x-auto pb-1" aria-label="الملفات المرفقة">
          {pending.map((p) => (
            <li
              key={p.key}
              className="relative size-16 shrink-0 overflow-hidden rounded-lg border bg-muted"
            >
              {p.preview && p.file.type.startsWith('image/') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.preview || '/placeholder.svg'} alt={p.file.name} className="size-full object-cover" />
              ) : p.preview ? (
                <video src={p.preview} muted className="size-full object-cover" />
              ) : (
                <div className="flex size-full flex-col items-center justify-center gap-0.5 p-1 text-primary">
                  <FileText className="size-5" aria-hidden="true" />
                  <span className="w-full truncate text-center text-[0.6rem] text-muted-foreground">
                    {formatBytes(p.file.size)}
                  </span>
                </div>
              )}
              {sending ? (
                <div className="absolute inset-x-0 bottom-0 h-1 bg-black/20">
                  <div
                    className="h-full bg-primary transition-[width]"
                    style={{ width: `${Math.round(p.progress * 100)}%` }}
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => remove(p.key)}
                  aria-label={`إزالة ${p.file.name}`}
                  className="absolute top-0.5 left-0.5 flex size-5 items-center justify-center rounded-full bg-black/60 text-white"
                >
                  <X className="size-3" aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-end gap-1.5">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            addFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="shrink-0 text-muted-foreground"
          aria-label="إرفاق ملفات (PDF، صور، فيديو)"
          disabled={sending}
          onClick={() => inputRef.current?.click()}
        >
          <Paperclip aria-hidden="true" />
        </Button>
        <textarea
          ref={textRef}
          value={text}
          dir="auto"
          rows={1}
          placeholder="اكتب رسالة للنشر..."
          aria-label="نص المنشور"
          disabled={sending}
          onChange={(e) => {
            setText(e.target.value)
            e.target.style.height = 'auto'
            e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              if (e.nativeEvent.isComposing || e.keyCode === 229) return
              e.preventDefault()
              send()
            }
          }}
          className="max-h-40 min-h-9 flex-1 resize-none rounded-xl border bg-background px-3 py-2 text-sm leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        />
        <Button
          type="button"
          size="icon"
          aria-label="نشر"
          disabled={sending || (!text.trim() && !pending.length)}
          onClick={send}
          className={cn('shrink-0 rounded-full')}
        >
          {sending ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : (
            <SendHorizontal className="rotate-180" aria-hidden="true" />
          )}
        </Button>
      </div>
    </div>
  )
}
