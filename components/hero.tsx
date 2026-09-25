'use client'

import Image from 'next/image'
import { useApp } from '@/components/app-provider'

export function Hero() {
  const { settings } = useApp()
  return (
    <section
      aria-labelledby="welcome-title"
      className="relative overflow-hidden border-b bg-primary text-primary-foreground"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, currentColor 0 1px, transparent 1px 14px)',
        }}
      />
      <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-10 text-center md:flex-row md:gap-8 md:py-12 md:text-right">
        <div className="shrink-0 rounded-full bg-white p-1.5 shadow-lg ring-4 ring-white/15">
          <Image
            src="/logo.png"
            alt="شعار كلية الإدارة والاقتصاد - جامعة بغداد"
            width={112}
            height={112}
            className="size-24 rounded-full md:size-28"
            priority
          />
        </div>
        <div className="flex flex-col items-center gap-2 md:items-start">
          <p className="text-sm font-medium text-[color-mix(in_oklch,var(--brand-accent),white_45%)]">{settings.welcomeTitle}</p>
          <h1
            id="welcome-title"
            dir="auto"
            className="text-balance text-4xl font-bold tracking-tight md:text-5xl"
          >
            {settings.siteName}
          </h1>
          <p className="text-sm text-primary-foreground/80">
            {settings.stageLabel} <span aria-hidden="true">·</span> {settings.collegeName}
          </p>
          <p className="max-w-2xl text-pretty text-sm leading-relaxed text-primary-foreground/85 md:text-base">
            {settings.welcomeText}
          </p>
          <p className="mt-1 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs">
            <span className="text-primary-foreground/70">إعداد</span>
            <span className="font-semibold">{settings.authorName}</span>
          </p>
        </div>
      </div>
    </section>
  )
}
