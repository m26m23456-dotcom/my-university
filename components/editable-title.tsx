'use client'

import { useState } from 'react'
import { Check, Pencil, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function EditableTitle({
  value,
  canEdit,
  onSave,
  className,
  as: Tag = 'h2',
  id,
}: {
  value: string
  canEdit: boolean
  onSave: (next: string) => Promise<void>
  className?: string
  as?: 'h2' | 'h3' | 'span'
  id?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)

  async function save() {
    const next = draft.trim()
    if (!next || next === value) {
      setEditing(false)
      return
    }
    setSaving(true)
    try {
      await onSave(next)
      toast.success('تم حفظ التسمية')
      setEditing(false)
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <form
        className="flex min-w-0 flex-1 items-center gap-1"
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
      >
        <Input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={40}
          aria-label="التسمية الجديدة"
          className="h-8 min-w-0"
          onKeyDown={(e) => e.key === 'Escape' && setEditing(false)}
        />
        <Button type="submit" size="icon-sm" disabled={saving} aria-label="حفظ">
          <Check aria-hidden="true" />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          onClick={() => setEditing(false)}
          aria-label="إلغاء"
        >
          <X aria-hidden="true" />
        </Button>
      </form>
    )
  }

  return (
    <div className="flex min-w-0 items-center gap-1">
      <Tag id={id} className={cn('truncate', className)}>
        {value}
      </Tag>
      {canEdit && (
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          className="text-muted-foreground"
          aria-label={`تعديل تسمية ${value}`}
          onClick={() => {
            setDraft(value)
            setEditing(true)
          }}
        >
          <Pencil aria-hidden="true" />
        </Button>
      )}
    </div>
  )
}
