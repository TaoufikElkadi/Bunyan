'use client'

import { useTranslation } from '@/lib/i18n/context'
import type { Locale } from '@/types'

const LOCALES: { code: Locale; flag: string }[] = [
  { code: 'nl', flag: '🇳🇱' },
  { code: 'en', flag: '🇬🇧' },
  { code: 'tr', flag: '🇹🇷' },
  { code: 'ar', flag: '🇸🇦' },
]

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useTranslation()

  return (
    <div className="flex items-center justify-center gap-1">
      {LOCALES.map(({ code, flag }) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          className={`flex items-center gap-1.5 rounded-full px-3 py-2 md:px-2.5 md:py-1.5 text-sm md:text-xs min-h-[44px] md:min-h-0 transition-all duration-150 ${
            locale === code
              ? 'bg-neutral-100 font-medium text-neutral-900'
              : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50'
          }`}
          aria-label={t(`language.${code}`)}
          aria-current={locale === code ? 'true' : undefined}
        >
          <span className="text-base md:text-sm">{flag}</span>
          <span>{t(`language.${code}`)}</span>
        </button>
      ))}
    </div>
  )
}
