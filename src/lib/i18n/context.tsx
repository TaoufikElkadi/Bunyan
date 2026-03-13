'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Locale } from '@/types'

// Import translations statically (small files, no dynamic import needed)
import nl from './translations/nl.json'
import en from './translations/en.json'
import tr from './translations/tr.json'
import ar from './translations/ar.json'

const translations: Record<Locale, Record<string, string>> = { nl, en, tr, ar }

type TranslationContext = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, vars?: Record<string, string>) => string
  dir: 'ltr' | 'rtl'
}

const I18nContext = createContext<TranslationContext | null>(null)

export function I18nProvider({ defaultLocale, children }: { defaultLocale: Locale; children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(defaultLocale)

  function t(key: string, vars?: Record<string, string>): string {
    let str = translations[locale]?.[key] ?? translations.nl[key] ?? key
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replace(`{{${k}}}`, v)
      }
    }
    return str
  }

  const dir = locale === 'ar' ? 'rtl' : 'ltr'

  return (
    <I18nContext value={{ locale, setLocale, t, dir }}>
      {children}
    </I18nContext>
  )
}

export function useTranslation() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useTranslation must be used within I18nProvider')
  return ctx
}
