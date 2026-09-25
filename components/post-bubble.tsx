'use client'

import { useState } from 'react'
import {
  Copy,
  Download,
  ExternalLink,
  FileText,
  MoreVertical,
  Pencil,
  Pin,
  PinOff,
  Trash2,
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
import { api, fileUrl, formatBytes } from '@/lib/fetcher'
import { can, type Post } from '@/lib/types'
import { cn } from '@/lib/utils'

const timeFormat = new Intl.DateTimeFormat('ar-IQ', { hour: 'numeric', minute: '2-digit' })

function Linkified({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g)
  return (
    <>
      {parts.map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-primary underline underline-offset-2"
          >
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  )
}

export function PostBubble({
  post,
  onChanged,
  subjectLabel,
  highlight,
}: {
  post: Post
  onChanged: () => void
  subjectLabel?: string
  highlight?: boolean
}) {
  const { user } = useApp()
  const [editOpen, setEditOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [draft, setDraft] = useState(post.body)
  const [busy, setBusy] = useState(false)

  const media = post.files.filter((f) => f.mime.startsWith('image/') || f.mime.startsWith('video/'))
  const docs = post.files.filter((f) => !media.includes(f))
  const canEdit = can(user, post.section, 'edit')
  const canPin = can(user, post.section, 'pin')

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
      id={`post-${post.id}`}
      className={cn(
        'group/post relative w-full max-w-[min(100%,28rem)] self-start rounded-2xl rounded-tr-sm bg-bubble p-1.5 shadow-sm ring-1 ring-black/5 transition-shadow',
        highlight && 'ring-2 ring-gold',
      )}
    >
      {(canEdit || canPin || post.body) && (
        <div className="absolute top-1.5 left-1.5 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  size="icon-xs"
                  variant="ghost"
                  aria-label="خيارات المنشور"
                  className={cn(
                    'bg-card/80 text-muted-foreground opacity-100 backdrop-blur md:opacity-0 md:group-hover/post:opacity-100 md:focus-visible:opacity-100 aria-expanded:opacity-100',
                  )}
                />
              }
            >
              <MoreVertical aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-40">
              {post.body && (
                <DropdownMenuItem
                  onClick={() => {
                    navigator.clipboard.writeText(post.body)
                    toast.success('تم نسخ النص')
                  }}
                >
                  <Copy aria-hidden="true" />
                  نسخ النص
                </DropdownMenuItem>
              )}
              {canPin && (
                <DropdownMenuItem
                  disabled={busy}
                  onClick={() =>
                    run(
                      () => api(`/api/posts/${post.id}`, 'PATCH', { pinned: !post.pinned }),
                      post.pinned ? 'تم إلغاء التثبيت' : 'تم تثبيت المنشور',
                    )
                  }
                >
                  {post.pinned ? <PinOff aria-hidden="true" /> : <Pin aria-hidden="true" />}
                  {post.pinned ? 'إلغاء التثبيت' : 'تثبيت'}
                </DropdownMenuItem>
              )}
              {canEdit && (
                <>
                  <DropdownMenuItem
                    onClick={() => {
                      setDraft(post.body)
                      setEditOpen(true)
                    }}
                  >
                    <Pencil aria-hidden="true" />
                    تعديل النص
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={() => setConfirmOpen(true)}>
                    <Trash2 aria-hidden="true" />
                    حذف
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {subjectLabel && (
        <p className="px-2 pt-1 text-xs font-semibold text-gold">{subjectLabel}</p>
      )}

      {media.length > 0 && <MediaAlbum items={media} />}

      {docs.length > 0 && (
        <ul className={cn('flex flex-col gap-1.5', media.length > 0 && 'mt-1.5')}>
          {docs.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center gap-3 rounded-xl bg-secondary/70 p-2.5"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <FileText className="size-5" aria-hidden="true" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium" dir="auto" title={doc.name}>
                  {doc.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  PDF · {formatBytes(doc.size)}
                </span>
              </div>
              <div className="flex shrink-0 items-center">
                <a
                  href={fileUrl(doc.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`فتح ${doc.name}`}
                  className="rounded-md p-1.5 text-primary hover:bg-card"
                >
                  <ExternalLink className="size-4" aria-hidden="true" />
                </a>
                <a
                  href={fileUrl(doc.id, true)}
                  aria-label={`تنزيل ${doc.name}`}
                  className="rounded-md p-1.5 text-primary hover:bg-card"
                >
                  <Download className="size-4" aria-hidden="true" />
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}

      {post.body && (
        <p
          dir="auto"
          className="whitespace-pre-wrap break-words px-2 pt-1.5 text-[0.9375rem] leading-relaxed text-foreground"
        >
          <Linkified text={post.body} />
        </p>
      )}

      <footer className="flex items-center justify-end gap-1.5 px-2 pt-1 pb-0.5 text-[0.7rem] text-muted-foreground">
        {post.pinned && <Pin className="size-3 text-gold" aria-label="مثبّت" />}
        {post.authorName && <span className="truncate">{post.authorName}</span>}
        {post.editedAt && <span>معدّل</span>}
        <time dateTime={post.createdAt}>{timeFormat.format(new Date(post.createdAt))}</time>
      </footer>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent dir="rtl" className="text-right sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>تعديل المنشور</DialogTitle>
          </DialogHeader>
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={6}
            dir="auto"
            aria-label="نص المنشور"
          />
          <DialogFooter>
            <Button
              disabled={busy}
              onClick={async () => {
                const ok = await run(
                  () => api(`/api/posts/${post.id}`, 'PATCH', { body: draft }),
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
            <DialogTitle>حذف المنشور؟</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            سيتم حذف المنشور وجميع الملفات المرفقة به نهائياً.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={async () => {
                const ok = await run(() => api(`/api/posts/${post.id}`, 'DELETE'), 'تم حذف المنشور')
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
