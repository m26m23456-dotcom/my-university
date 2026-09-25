'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Download, Play } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { fileUrl } from '@/lib/fetcher'
import type { FileItem } from '@/lib/types'
import { cn } from '@/lib/utils'

function Tile({
  file,
  onOpen,
  className,
  overlay,
}: {
  file: FileItem
  onOpen: () => void
  className?: string
  overlay?: number
}) {
  const isVideo = file.mime.startsWith('video/')
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn('group relative block overflow-hidden bg-muted', className)}
      aria-label={isVideo ? `تشغيل الفيديو ${file.name}` : `عرض الصورة ${file.name}`}
    >
      {isVideo ? (
        <video
          src={`${fileUrl(file.id)}#t=0.1`}
          preload="metadata"
          muted
          playsInline
          className="size-full object-cover"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={fileUrl(file.id) || '/placeholder.svg'}
          alt={file.name}
          loading="lazy"
          className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      )}
      {isVideo && (
        <span className="absolute inset-0 flex items-center justify-center bg-black/15">
          <span className="flex size-11 items-center justify-center rounded-full bg-black/55 text-white">
            <Play className="size-5 translate-x-[-1px] fill-current" aria-hidden="true" />
          </span>
        </span>
      )}
      {overlay ? (
        <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-2xl font-semibold text-white">
          +{overlay}
        </span>
      ) : null}
    </button>
  )
}

const MAX_VISIBLE = 9

export function MediaAlbum({ items }: { items: FileItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  if (!items.length) return null

  const visible = items.slice(0, MAX_VISIBLE)
  const hidden = items.length - visible.length
  const n = visible.length

  let layout: React.ReactNode
  if (n === 1) {
    layout = (
      <Tile
        file={visible[0]}
        onOpen={() => setOpenIndex(0)}
        className="aspect-[4/3] max-h-80 w-full"
      />
    )
  } else if (n === 2) {
    layout = (
      <div className="grid grid-cols-2 gap-0.5">
        {visible.map((f, i) => (
          <Tile key={f.id} file={f} onOpen={() => setOpenIndex(i)} className="aspect-[3/4]" />
        ))}
      </div>
    )
  } else if (n === 3) {
    layout = (
      <div className="grid grid-cols-2 gap-0.5">
        <Tile
          file={visible[0]}
          onOpen={() => setOpenIndex(0)}
          className="col-span-2 aspect-[16/9]"
        />
        {visible.slice(1).map((f, i) => (
          <Tile key={f.id} file={f} onOpen={() => setOpenIndex(i + 1)} className="aspect-square" />
        ))}
      </div>
    )
  } else if (n === 4) {
    layout = (
      <div className="grid grid-cols-2 gap-0.5">
        {visible.map((f, i) => (
          <Tile key={f.id} file={f} onOpen={() => setOpenIndex(i)} className="aspect-square" />
        ))}
      </div>
    )
  } else {
    layout = (
      <div className="flex flex-col gap-0.5">
        <div className="grid grid-cols-2 gap-0.5">
          {visible.slice(0, 2).map((f, i) => (
            <Tile key={f.id} file={f} onOpen={() => setOpenIndex(i)} className="aspect-[4/3]" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-0.5">
          {visible.slice(2).map((f, i) => (
            <Tile
              key={f.id}
              file={f}
              onOpen={() => setOpenIndex(i + 2)}
              className="aspect-square"
              overlay={i + 2 === n - 1 && hidden > 0 ? hidden : undefined}
            />
          ))}
        </div>
      </div>
    )
  }

  const current = openIndex !== null ? items[openIndex] : null

  return (
    <>
      <div className="overflow-hidden rounded-xl">{layout}</div>
      <Dialog open={openIndex !== null} onOpenChange={(open) => !open && setOpenIndex(null)}>
        <DialogContent
          dir="rtl"
          className="max-w-[calc(100%-1rem)] gap-3 border-0 bg-black/95 p-3 text-white ring-0 sm:max-w-4xl"
        >
          <DialogTitle className="sr-only">{current?.name ?? 'عرض الوسائط'}</DialogTitle>
          {current && (
            <div className="flex max-h-[75vh] items-center justify-center">
              {current.mime.startsWith('video/') ? (
                <video
                  key={current.id}
                  src={fileUrl(current.id)}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[75vh] w-full rounded-lg"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={current.id}
                  src={fileUrl(current.id) || '/placeholder.svg'}
                  alt={current.name}
                  className="max-h-[75vh] w-auto rounded-lg object-contain"
                />
              )}
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/10 hover:text-white"
                disabled={openIndex === null || openIndex <= 0}
                onClick={() => setOpenIndex((i) => (i === null ? i : i - 1))}
                aria-label="السابق"
              >
                <ChevronRight aria-hidden="true" />
              </Button>
              <span className="min-w-12 text-center text-sm tabular-nums text-white/80">
                {openIndex !== null ? `${openIndex + 1} / ${items.length}` : ''}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/10 hover:text-white"
                disabled={openIndex === null || openIndex >= items.length - 1}
                onClick={() => setOpenIndex((i) => (i === null ? i : i + 1))}
                aria-label="التالي"
              >
                <ChevronLeft aria-hidden="true" />
              </Button>
            </div>
            {current && (
              <a
                href={fileUrl(current.id, true)}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-white/90 hover:bg-white/10"
              >
                <Download className="size-4" aria-hidden="true" />
                تنزيل
              </a>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
