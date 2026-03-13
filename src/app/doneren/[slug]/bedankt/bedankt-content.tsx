'use client'

import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { I18nProvider, useTranslation } from '@/lib/i18n/context'
import { LanguageSwitcher } from '@/components/donation/language-switcher'
import type { Locale } from '@/types'

export function BedanktContent({ defaultLocale }: { defaultLocale: Locale }) {
  return (
    <I18nProvider defaultLocale={defaultLocale}>
      <BedanktInner />
    </I18nProvider>
  )
}

function BedanktInner() {
  const { t, dir } = useTranslation()

  return (
    <div className="flex min-h-screen min-h-[100dvh] items-center justify-center bg-gray-50 px-4 pb-[env(safe-area-inset-bottom)]">
      <div className="w-full max-w-md space-y-6">
        <Card className="text-center" dir={dir}>
          <CardHeader>
            <CardTitle className="text-2xl">{t('confirm.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-lg font-medium">{t('confirm.subtitle')}</p>
            <p className="text-muted-foreground">{t('confirm.message')}</p>
          </CardContent>
          <CardFooter className="justify-center">
            <Link
              href="/"
              className="inline-flex min-h-[44px] md:h-8 items-center justify-center rounded-lg border border-border bg-background px-6 md:px-4 text-base md:text-sm font-medium transition-colors hover:bg-muted"
            >
              {t('confirm.back')}
            </Link>
          </CardFooter>
        </Card>
        <LanguageSwitcher />
      </div>
    </div>
  )
}
