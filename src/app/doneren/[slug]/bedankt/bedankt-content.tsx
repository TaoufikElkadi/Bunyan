'use client'

import { useState } from 'react'
import Link from 'next/link'
import { I18nProvider, useTranslation } from '@/lib/i18n/context'
import { LanguageSwitcher } from '@/components/donation/language-switcher'
import type { Locale } from '@/types'
import { CheckCircle2Icon } from 'lucide-react'

type BedanktContentProps = {
  defaultLocale: Locale
  mosqueName: string
  mosqueSlug: string
}

export function BedanktContent({
  defaultLocale,
  mosqueName,
  mosqueSlug,
}: BedanktContentProps) {
  return (
    <I18nProvider defaultLocale={defaultLocale}>
      <BedanktInner mosqueName={mosqueName} mosqueSlug={mosqueSlug} />
    </I18nProvider>
  )
}

function BedanktInner({ mosqueName, mosqueSlug }: { mosqueName: string; mosqueSlug: string }) {
  const { t, dir } = useTranslation()

  const donationPageUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/doneren/${mosqueSlug}`

  const whatsappMessage = `Ik heb gedoneerd aan ${mosqueName} \u{1F54C} Doe ook mee! ${donationPageUrl}`
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`

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

        {/* Share section */}
        <div className="mt-8">
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-3">
            Deel met uw gemeenschap
          </p>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Deel via WhatsApp"
            className="inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-xl text-sm font-semibold text-white transition-colors hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
            style={{ backgroundColor: '#25D366' }}
          >
            <WhatsAppIcon />
            Deel via WhatsApp
          </a>

          <CopyLinkButton url={donationPageUrl} />
        </div>

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
        <a
          href="https://bunyan.nl"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-neutral-400 transition-colors hover:text-neutral-500"
        >
          Powered by
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/logo_transparent.svg" alt="Bunyan" className="inline-block h-3 w-3" />
          <span className="font-semibold">Bunyan</span>
        </a>
      </div>
    </div>
  )
}

function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable — silently fail
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="Kopieer donatie link"
      className="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400"
    >
      {copied ? (
        <>
          <CheckCircle2Icon className="size-4 text-green-600" />
          <span className="text-green-600">Gekopieerd!</span>
        </>
      ) : (
        <>
          <CopyIcon />
          Kopieer link
        </>
      )}
    </button>
  )
}

function WhatsAppIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  )
}
