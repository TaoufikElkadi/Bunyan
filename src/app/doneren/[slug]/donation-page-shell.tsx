'use client'

import type { ReactNode } from 'react'
import type { Locale } from '@/types'
import { I18nProvider } from '@/lib/i18n/context'
import { LanguageSwitcher } from '@/components/donation/language-switcher'

type Props = {
  defaultLocale: Locale
  mosqueName: string
  welcomeMsg: string | null
  primaryColor: string | undefined
  logoUrl?: string | null
  children: ReactNode
}

export function DonationPageShell({
  defaultLocale,
  children,
}: Props) {
  return (
    <I18nProvider defaultLocale={defaultLocale}>
      <div
        className="min-h-screen min-h-[100dvh] flex flex-col relative"
        style={{ background: '#FDFBF7' }}
      >
        <div
          className="absolute inset-0 opacity-[0.60] pointer-events-none"
          style={{
            backgroundImage: 'url(/patterns/5540829-1.png)',
            backgroundSize: '500px',
            backgroundRepeat: 'repeat',
          }}
        />
        <div className="relative flex flex-col flex-1">
        {children}
        <div className="mx-auto max-w-lg w-full px-5 pb-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] mt-auto pt-8">
          <LanguageSwitcher />
          <p className="mt-3 text-center text-[11px] font-medium" style={{ color: '#C4B99A' }}>
            Powered by Bunyan
          </p>
        </div>
        </div>
      </div>
    </I18nProvider>
  )
}
