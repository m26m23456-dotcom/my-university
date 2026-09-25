'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import { Inbox, Loader2, Pin, SearchX } from 'lucide-react'
import { useApp } from '@/components/app-provider'
import { Composer } from '@/components/composer'
import { PostBubble } from '@/components/post-bubble'
import { fetcher } from '@/lib/fetcher'
import { can, type Post, type Section } from '@/lib/types'

const dayFormat = new Intl.DateTimeFormat('ar-IQ', { weekday: 'long', day: 'numeric', month: 'long' })

function dayKey(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

export function Feed({
  section,
  subjectId,
  query = '',
  subjectNames,
  allowCompose = true,
}: {
  section: Section
  subjectId?: number
  query?: string
  subjectNames?: Map<number, string>
  allowCompose?: boolean
}) {
  const { user } = useApp()
  const params = new URLSearchParams({ section })
  if (subjectId) params.set('subject', String(subjectId))
  if (query.trim()) params.set('q', query.trim())
  const key = `/api/posts?${params.toString()}`

  const { data, isLoading, mutate } = useSWR<{ posts: Post[] }>(key, fetcher, {
    refreshInterval: 30000,
    keepPreviousData: true,
  })
  const posts = data?.posts ?? []
  const pinned = posts.filter((p) => p.pinned)
  const [pinIndex, setPinIndex] = useState(0)
  const [highlighted, setHighlighted] = useState<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastCount = useRef(0)

  useEffect(() => {
    const el = scrollRef.current
    if (!el || query) return
    if (posts.length !== lastCount.current) {
      el.scrollTop = el.scrollHeight
      lastCount.current = posts.length
    }
  }, [posts.length, query])

  const activePin = pinned.length ? pinned[pinIndex % pinned.length] : null

  function jumpToPin() {
    if (!activePin) return
    document
      .getElementById(`post-${activePin.id}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setHighlighted(activePin.id)
    window.setTimeout(() => setHighlighted(null), 1600)
    setPinIndex((i) => i + 1)
  }

  const showComposer = allowCompose && !query && can(user, section, 'post')

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {activePin && !query && (
        <button
          type="button"
          onClick={jumpToPin}
          className="flex items-center gap-2 border-b bg-card px-3 py-2 text-right hover:bg-secondary/60"
        >
          <span className="h-8 w-0.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
          <Pin className="size-4 shrink-0 text-gold" aria-hidden="true" />
          <span className="flex min-w-0 flex-col">
            <span className="text-xs font-semibold text-primary">
              رسالة مثبّتة {pinned.length > 1 ? `(${(pinIndex % pinned.length) + 1}/${pinned.length})` : ''}
            </span>
            <span className="truncate text-xs text-muted-foreground" dir="auto">
              {activePin.body ||
                (activePin.files.length ? `${activePin.files.length} ملف مرفق` : '')}
            </span>
          </span>
        </button>
      )}

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
        ) : posts.length === 0 ? (
          <div className="m-auto flex max-w-60 flex-col items-center gap-2 text-center text-sm text-muted-foreground">
            {query ? (
              <SearchX className="size-8 opacity-60" aria-hidden="true" />
            ) : (
              <Inbox className="size-8 opacity-60" aria-hidden="true" />
            )}
            {query ? 'لا توجد نتائج مطابقة لبحثك' : 'لا توجد منشورات بعد'}
          </div>
        ) : (
          posts.map((post, i) => {
            const newDay = i === 0 || dayKey(post.createdAt) !== dayKey(posts[i - 1].createdAt)
            return (
              <Fragment key={post.id}>
                {newDay && (
                  <div className="sticky top-0 z-10 flex justify-center py-1">
                    <span className="rounded-full bg-card/90 px-3 py-0.5 text-xs text-muted-foreground shadow-sm ring-1 ring-black/5 backdrop-blur">
                      {dayFormat.format(new Date(post.createdAt))}
                    </span>
                  </div>
                )}
                <PostBubble
                  post={post}
                  onChanged={() => mutate()}
                  highlight={highlighted === post.id}
                  subjectLabel={
                    query && post.subjectId ? subjectNames?.get(post.subjectId) : undefined
                  }
                />
              </Fragment>
            )
          })
        )}
      </div>

      {showComposer && <Composer section={section} subjectId={subjectId} onPosted={() => mutate()} />}
    </div>
  )
}
