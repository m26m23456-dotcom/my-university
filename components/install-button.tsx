'use client'

import { useEffect, useState } from 'react'
import { Download, Share, SquarePlus, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallButton() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  useEffect(() => {
    setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent))
    setInstalled(
      window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true,
    )
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setPromptEvent(e as InstallPromptEvent)
    }
    const onInstalled = () => setInstalled(true)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (installed) return null

  async function install() {
    if (promptEvent) {
      await promptEvent.prompt()
      const choice = await promptEvent.userChoice
      if (choice.outcome === 'accepted') setInstalled(true)
      setPromptEvent(null)
      return
    }
    setHelpOpen(true)
  }

  return (
    <>
      <Button size="sm" variant="secondary" onClick={install} className="gap-1.5">
        <Download aria-hidden="true" />
        <span>تثبيت التطبيق</span>
      </Button>
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent dir="rtl" className="text-right">
          <DialogHeader>
            <DialogTitle>تثبيت الموقع على جهازك</DialogTitle>
            <DialogDescription>
              ثبّت الموقع ليعمل كتطبيق مستقل على هاتفك أو حاسوبك وتصلك الإشعارات.
            </DialogDescription>
          </DialogHeader>
          {isIos ? (
            <ol className="flex flex-col gap-3 text-sm leading-relaxed">
              <li className="flex items-center gap-2">
                <Share className="size-4 shrink-0 text-primary" aria-hidden="true" />
                اضغط على زر المشاركة في متصفح Safari.
              </li>
              <li className="flex items-center gap-2">
                <SquarePlus className="size-4 shrink-0 text-primary" aria-hidden="true" />
                {'اختر "إضافة إلى الشاشة الرئيسية".'}
              </li>
            </ol>
          ) : (
            <ol className="flex flex-col gap-3 text-sm leading-relaxed">
              <li className="flex items-center gap-2">
                <MoreVertical className="size-4 shrink-0 text-primary" aria-hidden="true" />
                افتح قائمة المتصفح (النقاط الثلاث).
              </li>
              <li className="flex items-center gap-2">
                <Download className="size-4 shrink-0 text-primary" aria-hidden="true" />
                {'اختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية".'}
              </li>
            </ol>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
