'use client'

import { useRef, useState } from 'react'
import useSWR from 'swr'
import { FileText, Image as ImageIcon, Loader2, Plus, Video, X, type LucideIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useApp } from '@/components/app-provider'
import { Feed } from '@/components/feed'
import { Button } from '@/components/ui/button'
import { api, fetcher, formatBytes, uploadFile } from '@/lib/fetcher'
import { can, type Post } from '@/lib/types'
import { cn } from '@/lib/utils'

type Kind = 'pdf' | 'image' | 'video'

const KINDS: {
  key: Kind
  label: string
  icon: LucideIcon
  accept: string
  addLabel: string
  empty: string
}[] = [
  {
    key: 'pdf',
    label: 'ملفات PDF',
    icon: FileText,
    accept: 'application/pdf,.pdf',
    addLabel: 'إضافة ملف PDF',
    empty: 'لا توجد ملفات PDF بعد',
  },
  {
    key: 'image',
    label: 'الصور',
    icon: ImageIcon,
    accept: 'image/*',
    addLabel: 'إضافة صور',
    empty: 'لا توجد صور بعد',
  },
  {
    key: 'video',
    label: 'الفيديوهات',
    icon: Video,
    accept: 'video/mp4,video/webm,video/quicktime',
    addLabel: 'إضافة فيديو',
    empty: 'لا توجد فيديوهات بعد',
  },
]

function fileKind(mime: string): Kind {
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('video/')) return 'video'
  return 'pdf'
}

function fileMatches(file: File, kind: Kind) {
  const type = file.type
  if (kind === 'pdf') return type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  if (kind === 'image') return type.startsWith('image/')
  return type.startsWith('video/')
}

function filterByKind(posts: Post[], kind: Kind): Post[] {
  const out: Post[] = []
  for (const post of posts) {
    if (post.files.length === 0) {
      // منشورات نصية قديمة بلا ملفات: تبقى ظاهرة في أول تبويب حتى لا تختفي
      if (kind === 'pdf') out.push(post)
      continue
    }
    const files = post.files.filter((f) => fileKind(f.mime) === kind)
    if (files.length) out.push(files.length === post.files.length ? post : { ...post, files })
  }
  return out
}

function Uploader({
  kind,
  subjectId,
  onPosted,
}: {
  kind: Kind
  subjectId: number
  onPosted: () => void
}) {
  const cfg = KINDS.find((k) => k.key === kind)!
  const [pending, setPending] = useState<File[]>([])
  const [caption, setCaption] = useState('')
  const [sending, setSending] = useState(false)
  const [progress, setProgress] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  function pick(list: FileList | null) {
    if (!list) return
    const all = Array.from(list)
    const ok = all.filter((f) => fileMatches(f, kind))
    if (ok.length < all.length) {
      toast.error(`تم تجاهل ${all.length - ok.length} ملف لا يطابق نوع «${cfg.label}»`)
    }
    setPending((prev) => [...prev, ...ok].slice(0, 30))
  }

  async function send() {
    if (sending || !pending.length) return
    setSending(true)
    setProgress(0)
    try {
      const fileIds: string[] = []
      for (let i = 0; i < pending.length; i++) {
        const id = await uploadFile(pending[i], (ratio) =>
          setProgress((i + ratio) / pending.length),
        )
        fileIds.push(id)
      }
      await api('/api/posts', 'POST', { section: 'materials', subjectId, body: caption, fileIds })
      setPending([])
      setCaption('')
      onPosted()
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setSending(false)
      setProgress(0)
    }
  }

  return (
    <div className="shrink-0 border-t bg-card p-2">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={cfg.accept}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          pick(e.target.files)
          e.target.value = ''
        }}
      />

      {pending.length > 0 && (
        <div className="mb-2 flex flex-col gap-2">
          <ul className="scrollbar-thin flex max-h-32 flex-col gap-1 overflow-y-auto" aria-label="الملفات المختارة">
            {pending.map((file, i) => (
              <li
                key={`${file.name}-${file.size}-${i}`}
                className="flex items-center gap-2 rounded-lg border bg-background px-2 py-1.5 text-sm"
              >
                <cfg.icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate" dir="auto">
                  {file.name}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{formatBytes(file.size)}</span>
                {!sending && (
                  <button
                    type="button"
                    aria-label={`إزالة ${file.name}`}
                    onClick={() => setPending((prev) => prev.filter((_, idx) => idx !== i))}
                    className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
                  >
                    <X className="size-3" aria-hidden="true" />
                  </button>
                )}
              </li>
            ))}
          </ul>
          <input
            value={caption}
            dir="auto"
            disabled={sending}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="وصف اختياري..."
            aria-label="وصف المنشور"
            className="h-9 rounded-xl border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          />
          {sending && (
            <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={Math.round(progress * 100)}>
              <div className="h-full bg-primary transition-[width]" style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
          )}
          <div className="flex gap-2">
            <Button className="flex-1" disabled={sending} onClick={send}>
              {sending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
              {sending ? 'جارٍ الرفع...' : 'نشر'}
            </Button>
            <Button variant="outline" disabled={sending} onClick={() => setPending([])}>
              إلغاء
            </Button>
          </div>
        </div>
      )}

      <Button
        variant="outline"
        className="w-full border-dashed"
        disabled={sending}
        onClick={() => inputRef.current?.click()}
      >
        <Plus aria-hidden="true" />
        {cfg.addLabel}
      </Button>
    </div>
  )
}

export function SubjectView({ subjectId }: { subjectId: number }) {
  const { user } = useApp()
  const [kind, setKind] = useState<Kind>('pdf')

  // نفس مفتاح Feed حتى يشتركان بنفس الكاش
  const key = `/api/posts?section=materials&subject=${subjectId}`
  const { data, mutate } = useSWR<{ posts: Post[] }>(key, fetcher, {
    refreshInterval: 30000,
    keepPreviousData: true,
  })

  const counts: Record<Kind, number> = { pdf: 0, image: 0, video: 0 }
  for (const post of data?.posts ?? []) {
    for (const f of post.files) counts[fileKind(f.mime)]++
  }

  const cfg = KINDS.find((k) => k.key === kind)!

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div role="tablist" aria-label="أنواع الملفات" className="grid shrink-0 grid-cols-3 gap-1 border-b p-2">
        {KINDS.map((k) => {
          const active = k.key === kind
          return (
            <button
              key={k.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setKind(k.key)}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-xs font-medium transition-colors',
                active ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground hover:bg-muted/70',
              )}
            >
              <span className="flex items-center gap-1">
                <k.icon className="size-4" aria-hidden="true" />
                {k.label}
              </span>
              <span
                className={cn(
                  'rounded-full px-1.5 text-[0.65rem] leading-4',
                  active ? 'bg-primary-foreground/20' : 'bg-background',
                )}
              >
                {counts[k.key]}
              </span>
            </button>
          )
        })}
      </div>

      <Feed
        key={kind}
        section="materials"
        subjectId={subjectId}
        allowCompose={false}
        transform={(posts) => filterByKind(posts, kind)}
        emptyText={cfg.empty}
        footer={
          can(user, 'materials', 'post') ? (
            <Uploader key={kind} kind={kind} subjectId={subjectId} onPosted={() => mutate()} />
          ) : null
        }
      />
    </div>
  )
}
