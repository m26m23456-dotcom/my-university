'use client'

import { Bell, BellOff, Loader2 } from 'lucide-react'
import { usePush } from '@/components/push-provider'
import { Button } from '@/components/ui/button'
import type { Section } from '@/lib/types'
import { cn } from '@/lib/utils'

export function NotifyToggle({ section, label }: { section: Section; label: string }) {
  const { topics, busy, toggle } = usePush()
  const enabled = topics.includes(section)
  const loading = busy === section
  return (
    <Button
      type="button"
      size="icon-sm"
      variant={enabled ? 'default' : 'ghost'}
      aria-pressed={enabled}
      aria-label={enabled ? `إيقاف إشعارات ${label}` : `تفعيل إشعارات ${label}`}
      title={enabled ? 'الإشعارات مفعّلة' : 'تفعيل الإشعارات'}
      disabled={loading}
      onClick={() => toggle(section, label)}
      className={cn(!enabled && 'text-muted-foreground')}
    >
      {loading ? (
        <Loader2 className="animate-spin" aria-hidden="true" />
      ) : enabled ? (
        <Bell aria-hidden="true" />
      ) : (
        <BellOff aria-hidden="true" />
      )}
    </Button>
  )
}
