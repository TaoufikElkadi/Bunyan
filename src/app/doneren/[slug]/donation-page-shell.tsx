'use client'

import type { ReactNode } from 'react'
import type { Locale } from '@/types'
import { I18nProvider, useTranslation } from '@/lib/i18n/context'
import { LanguageSwitcher } from '@/components/donation/language-switcher'

type Props = {
  defaultLocale: Locale
  mosqueName: string
  welcomeMsg: string | null
  primaryColor: string | undefined
  children: ReactNode
}

export function DonationPageShell({ defaultLocale, mosqueName, welcomeMsg, primaryColor, children }: Props) {
  return (
    <I18nProvider defaultLocale={defaultLocale}>
      <DonationPageContent
        mosqueName={mosqueName}
        welcomeMsg={welcomeMsg}
        primaryColor={primaryColor}
      >
        {children}
      </DonationPageContent>
    </I18nProvider>
  )
}

function DonationPageContent({
  mosqueName,
  welcomeMsg,
  primaryColor,
  children,
}: {
  mosqueName: string
  welcomeMsg: string | null
  primaryColor: string | undefined
  children: ReactNode
}) {
  const { t, dir } = useTranslation()

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gray-50">
      <div className="mx-auto max-w-lg px-4 py-6 md:py-12 pb-[env(safe-area-inset-bottom)]">
        <div className="mb-6 md:mb-8 text-center" dir={dir}>
          <h1
            className="text-2xl md:text-3xl font-bold"
            style={{ color: primaryColor }}
          >
            {t('donate.title', { mosqueName })}
          </h1>
          {welcomeMsg && (
            <p className="mt-2 text-muted-foreground">{welcomeMsg}</p>
          )}
        </div>

        <div dir={dir}>
          {children}
        </div>

        <div className="mt-6 md:mt-8">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  )
}
