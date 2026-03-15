'use client'

import Link from 'next/link'
import { I18nProvider, useTranslation } from '@/lib/i18n/context'
import { LanguageSwitcher } from '@/components/donation/language-switcher'
import type { Locale } from '@/types'
import { CheckCircle2Icon } from 'lucide-react'

export function BedanktContent({
  defaultLocale,
  primaryColor,
}: {
  defaultLocale: Locale
  primaryColor?: string
}) {
  return (
    <I18nProvider defaultLocale={defaultLocale}>
      <BedanktInner />
    </I18nProvider>
  )
}

function BedanktInner() {
  const { t, dir } = useTranslation()

  return (
    <div className="min-h-screen min-h-[100dvh] bg-white flex flex-col items-center justify-center px-4" dir={dir}>
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-6 size-16 rounded-full bg-neutral-100 flex items-center justify-center">
          <CheckCircle2Icon className="size-8 text-neutral-900" />
        </div>

        <p className="text-neutral-400 text-sm mb-2">﷽</p>
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">{t('confirm.title')}</h1>
        <p className="text-lg font-medium text-neutral-700 mb-2">{t('confirm.subtitle')}</p>
        <p className="text-sm text-neutral-500 leading-relaxed">{t('confirm.message')}</p>

        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-neutral-100 px-6 text-sm font-medium text-neutral-900 hover:bg-neutral-200 transition-colors"
          >
            {t('confirm.back')}
          </Link>
        </div>
      </div>

      <div className="mt-12">
        <LanguageSwitcher />
        <p className="mt-3 text-center text-[11px] text-neutral-400">Powered by Bunyan</p>
      </div>
    </div>
  )
}
