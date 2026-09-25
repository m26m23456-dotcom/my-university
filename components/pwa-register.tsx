'use client'

import { useEffect, useRef } from 'react'

export function PwaRegister() {
  const tracked = useRef(false)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
    if (!tracked.current) {
      tracked.current = true
      fetch('/api/visit', { method: 'POST', credentials: 'include', keepalive: true }).catch(() => {})
    }
  }, [])

  return null
}
