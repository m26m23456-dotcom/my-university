'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import useSWR from 'swr'
import { toast } from 'sonner'
import { api, fetcher } from '@/lib/fetcher'
import type { Section } from '@/lib/types'

type PushContextValue = {
  supported: boolean
  topics: Section[]
  busy: Section | null
  toggle: (section: Section, label: string) => Promise<void>
}

const PushContext = createContext<PushContextValue | null>(null)

function isPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

async function getRegistration() {
  const existing = await navigator.serviceWorker.getRegistration()
  if (existing) return existing
  return navigator.serviceWorker.register('/sw.js')
}

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

async function loadTopics(): Promise<Section[]> {
  if (!isPushSupported() || Notification.permission !== 'granted') return []
  const reg = await getRegistration()
  const sub = await reg.pushManager.getSubscription()
  if (!sub) return []
  const res = await api<{ topics: Section[] }>('/api/push', 'POST', {
    action: 'status',
    subscription: sub.toJSON(),
  })
  return res.topics
}

export function PushProvider({ children }: { children: ReactNode }) {
  const [busy, setBusy] = useState<Section | null>(null)
  const { data: topics = [], mutate } = useSWR('push-topics', loadTopics, {
    revalidateOnFocus: false,
  })

  async function toggle(section: Section, label: string) {
    if (!isPushSupported()) {
      const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
      toast.error(
        isIos
          ? 'لتفعيل الإشعارات على الآيفون: ثبّت الموقع على الشاشة الرئيسية أولاً ثم افتحه من هناك.'
          : 'متصفحك لا يدعم الإشعارات.',
      )
      return
    }
    setBusy(section)
    try {
      const enabling = !topics.includes(section)
      if (enabling && Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
          toast.error('تم رفض إذن الإشعارات. يمكنك السماح بها من إعدادات المتصفح.')
          return
        }
      }
      const reg = await getRegistration()
      let sub = await reg.pushManager.getSubscription()
      if (!sub) {
        if (!enabling) return
        const { publicKey } = await fetcher<{ publicKey: string }>('/api/push')
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        })
      }
      const next = enabling ? [...topics, section] : topics.filter((t) => t !== section)
      const res = await api<{ topics: Section[] }>('/api/push', 'POST', {
        action: 'save',
        subscription: sub.toJSON(),
        topics: next,
      })
      await mutate(res.topics, { revalidate: false })
      toast.success(enabling ? `تم تفعيل إشعارات ${label}` : `تم إيقاف إشعارات ${label}`)
    } catch (error) {
      console.error(error)
      toast.error('تعذر تغيير إعداد الإشعارات. جرّب فتح الموقع مباشرة في المتصفح.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <PushContext.Provider value={{ supported: isPushSupported(), topics, busy, toggle }}>
      {children}
    </PushContext.Provider>
  )
}

export function usePush() {
  const ctx = useContext(PushContext)
  if (!ctx) throw new Error('usePush must be used inside PushProvider')
  return ctx
}
