'use client'

import { useTranslation } from '@/lib/i18n/context'
import type { Locale } from '@/types'

const LOCALES: Locale[] = ['nl', 'en', 'tr', 'ar']

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useTranslation()

  return (
    <div className="flex items-center justify-center gap-1">
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          className={`rounded px-3 py-2 md:px-2 md:py-1 text-sm md:text-xs min-h-[44px] md:min-h-0 transition-colors ${
            locale === code
              ? 'bg-gray-200 font-medium text-gray-900'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
          aria-label={t(`language.${code}`)}
          aria-current={locale === code ? 'true' : undefined}
        >
          {t(`language.${code}`)}
        </button>
      ))}
    </div>
  )
}
