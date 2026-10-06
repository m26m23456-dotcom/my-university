'use client'

import { useEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import {
  FileText,
  Loader2,
  MoreVertical,
  Paperclip,
  Pencil,
  SendHorizontal,
  Trash2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { useApp } from '@/components/app-provider'
import { MediaAlbum } from '@/components/media-album'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { api, fetcher, fileUrl, formatBytes, uploadFile } from '@/lib/fetcher'
import type { AbsenceMessage } from '@/lib/types'
import { cn } from '@/lib/utils'

const timeFormat = new Intl.DateTimeFormat('ar-IQ', { hour: 'numeric', minute: '2-digit' })
const ACCEPT = 'application/pdf,image/*,video/mp4,video/webm,video/quicktime'

type Pending = { key: string; file: File; preview: string | null; progress: number }

function Bubble({
  message,
  mine,
  onChanged,
}: {
  message: AbsenceMessage
  mine: boolean
  onChanged: () => void
}) {
  const { user } = useApp()
  const [editOpen, setEditOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [draft, setDraft] = useState(message.body)
  const [busy, setBusy] = useState(false)
  const canManage = mine || user?.role === 'owner'
  const media = message.files.filter((f) => f.mime.startsWith('image/') || f.mime.startsWith('video/'))
  const docs = message.files.filter((f) => !media.includes(f))

  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true)
    try {
      await action()
      toast.success(success)
      onChanged()
      return true
    } catch (error) {
      toast.error((error as Error).message)
      return false
    } finally {
      setBusy(false)
    }
  }

  return (
    <article
      className={cn(
        'group/msg relative flex w-full max-w-[min(100%,28rem)] flex-col gap-1 rounded-2xl p-2.5 shadow-sm ring-1 ring-black/5',
        mine
          ? 'self-start rounded-tr-sm bg-primary text-primary-foreground'
          : 'self-end rounded-tl-sm bg-secondary text-secondary-foreground',
      )}
    >
      {canManage && (
        <div className={cn('absolute top-1 z-10', mine ? 'left-1' : 'right-1')}>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  size="icon-xs"
                  variant="ghost"
                  aria-label="خيارات الرسالة"
                  className="opacity-100 hover:bg-black/10 md:opacity-0 md:group-hover/msg:opacity-100"
                />
              }
            >
              <MoreVertical aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-36">
              <DropdownMenuItem
                onClick={() => {
                  setDraft(message.body)
                  setEditOpen(true)
                }}
              >
                <Pencil aria-hidden="true" />
                تعديل
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setConfirmOpen(true)}>
                <Trash2 aria-hidden="true" />
                حذف
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {media.length > 0 && <MediaAlbum items={media} allowOffline={false} />}

      {docs.length > 0 && (
        <ul className={cn('flex flex-col gap-1.5', media.length > 0 && 'mt-1.5')}>
          {docs.map((doc) => (
            <li key={doc.id} className="flex items-center gap-3 rounded-xl bg-background/50 p-2">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background text-primary">
                <FileText className="size-4.5" aria-hidden="true" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium" dir="auto" title={doc.name}>
                  {doc.name}
                </span>
                <span className="text-xs opacity-70">{formatBytes(doc.size)}</span>
              </div>
              <a
                href={fileUrl(doc.id, true)}
                aria-label={`تنزيل ${doc.name}`}
                className="rounded-md p-1.5 hover:bg-background/60"
              >
                <FileText className="size-4" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      )}

      {message.body && (
        <p
          dir="auto"
          className="whitespace-pre-wrap break-words px-0.5 text-[0.9375rem] leading-relaxed"
        >
          {message.body}
        </p>
      )}

      <footer
        className={cn(
          'flex items-center gap-1.5 px-0.5 text-[0.7rem] opacity-70',
          mine ? 'justify-start' : 'justify-end',
        )}
      >
        {!mine && <span className="truncate font-medium">{message.authorName}</span>}
        {message.editedAt && <span>معدّل</span>}
        <time dateTime={message.createdAt}>{timeFormat.format(new Date(message.createdAt))}</time>
      </footer>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent dir="rtl" className="text-right sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>تعديل الرسالة</DialogTitle>
          </DialogHeader>
          <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={5} dir="auto" />
          <DialogFooter>
            <Button
              disabled={busy}
              onClick={async () => {
                const ok = await run(
                  () => api(`/api/absence/${message.id}`, 'PATCH', { body: draft }),
                  'تم حفظ التعديل',
                )
                if (ok) setEditOpen(false)
              }}
            >
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent dir="rtl" className="text-right">
          <DialogHeader>
            <DialogTitle>حذف الرسالة؟</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={async () => {
                const ok = await run(() => api(`/api/absence/${message.id}`, 'DELETE'), 'تم حذف الرسالة')
                if (ok) setConfirmOpen(false)
              }}
            >
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </article>
  )
}

export function AbsenceChat() {
  const { user } = useApp()
  const { data, isLoading, mutate } = useSWR<{ messages: AbsenceMessage[] }>('/api/absence', fetcher, {
    refreshInterval: 15000,
    keepPreviousData: true,
  })
  const messages = data?.messages ?? []
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastCount = useRef(0)

  const [text, setText] = useState('')
  const [pending, setPending] = useState<Pending[]>([])
  const [sending, setSending] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const textRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    if (messages.length !== lastCount.current) {
      el.scrollTop = el.scrollHeight
      lastCount.current = messages.length
    }
  }, [messages.length])

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
      await api('/api/absence', 'POST', { body: text, fileIds })
      pending.forEach((p) => p.preview && URL.revokeObjectURL(p.preview))
      setPending([])
      setText('')
      if (textRef.current) textRef.current.style.height = ''
      mutate()
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        className="chat-pattern scrollbar-thin flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-3 py-4"
        aria-live="polite"
        aria-busy={isLoading}
      >
        {isLoading && !data ? (
          <div className="m-auto flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            جارٍ التحميل...
          </div>
        ) : messages.length === 0 ? (
          <div className="m-auto text-sm text-muted-foreground">لا توجد رسائل بعد</div>
        ) : (
          messages.map((m) => (
            <Bubble key={m.id} message={m} mine={m.authorId === user?.id} onChanged={() => mutate()} />
          ))
        )}
      </div>

      <div className="shrink-0 border-t bg-card p-2">
        {pending.length > 0 && (
          <ul className="scrollbar-thin mb-2 flex gap-2 overflow-x-auto pb-1" aria-label="الملفات المرفقة">
            {pending.map((p) => (
              <li key={p.key} className="relative size-16 shrink-0 overflow-hidden rounded-lg border bg-muted">
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
            placeholder="اكتب رسالة..."
            aria-label="نص الرسالة"
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
            aria-label="إرسال"
            disabled={sending || (!text.trim() && !pending.length)}
            onClick={send}
            className="shrink-0 rounded-full"
          >
            {sending ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <SendHorizontal className="rotate-180" aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
