'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import QRCode from 'qrcode'
import { Copy, Check, ExternalLink } from 'lucide-react'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function isValidSlug(slug: string): boolean {
  return slug.length >= 2 && SLUG_REGEX.test(slug)
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOTAL_STEPS = 3

const STEP_LABELS = ['Gegevens', 'Fondsen', 'Live!']

const DEFAULT_FUNDS = [
  { name: 'Algemeen', description: 'Algemene bijdrage aan de moskee', icon: '\u{1F54C}' },
  { name: 'Zakat', description: 'Verplichte jaarlijkse aalmoes', icon: '\u{1F48E}' },
  { name: 'Sadaqah', description: 'Vrijwillige liefdadigheid', icon: '\u{1F932}' },
]

const COLOR_PRESETS = [
  { value: '#10b981', label: 'Groen' },
  { value: '#3b82f6', label: 'Blauw' },
  { value: '#8b5cf6', label: 'Paars' },
  { value: '#f59e0b', label: 'Goud' },
  { value: '#ef4444', label: 'Rood' },
  { value: '#06b6d4', label: 'Cyaan' },
]

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://bunyan.io'

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const inputClass =
  'w-full rounded-lg border border-[#e3dfd5] bg-white px-4 py-3 text-[14px] text-[#261b07] placeholder:text-[#b5b0a5] outline-none focus:border-[#261b07]/30 focus:ring-1 focus:ring-[#261b07]/10 transition-colors'

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      {Array.from({ length: total }, (_, i) => {
        const stepNum = i + 1
        const isCurrent = stepNum === current
        const isCompleted = stepNum < current
        return (
          <div
            key={stepNum}
            className={`rounded-full transition-all duration-300 ${
              isCurrent
                ? 'w-6 h-2 bg-[#f9a600]'
                : isCompleted
                  ? 'w-2 h-2 bg-[#261b07]/30'
                  : 'w-2 h-2 bg-[#261b07]/10'
            }`}
          />
        )
      })}
    </div>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-[12px] text-red-600 mt-1">{message}</p>
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#e3dfd5] bg-white text-[#8a8478] hover:bg-[#f3f1ec] hover:text-[#261b07] transition-colors"
      aria-label="Kopieer link"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-[#4a7c10]" strokeWidth={2} />
      ) : (
        <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />
      )}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  const [isAnimating, setIsAnimating] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Step 1: Basics + branding
  const [mosqueName, setMosqueName] = useState('')
  const [city, setCity] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [nameError, setNameError] = useState('')
  const [cityError, setCityError] = useState('')
  const [slugError, setSlugError] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#10b981')

  // Step 2: Funds + ANBI
  const [funds, setFunds] = useState(DEFAULT_FUNDS.map((f) => ({ ...f })))
  const [fundToRemove, setFundToRemove] = useState<number | null>(null)
  const dragItem = useRef<number | null>(null)
  const dragOverItem = useRef<number | null>(null)
  const [anbiStatus, setAnbiStatus] = useState(false)
  const [rsin, setRsin] = useState('')

  // Step 3: Live — generated after submit
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  // Navigation
  const goTo = useCallback(
    (target: number) => {
      if (isAnimating) return
      setDirection(target > step ? 'forward' : 'back')
      setIsAnimating(true)
      setTimeout(() => {
        setStep(target)
        setIsAnimating(false)
      }, 150)
    },
    [step, isAnimating]
  )

  // Step 1 handlers
  function handleNameChange(name: string) {
    setMosqueName(name)
    if (nameError) setNameError('')
    if (!slugTouched) {
      setSlug(slugify(name))
      if (slugError) setSlugError('')
    }
  }

  function handleSlugChange(value: string) {
    setSlug(slugify(value))
    setSlugTouched(true)
    if (slugError) setSlugError('')
  }

  function validateStep1(): boolean {
    let valid = true
    if (!mosqueName.trim()) {
      setNameError('Vul de naam van uw moskee in')
      valid = false
    } else if (mosqueName.trim().length < 2) {
      setNameError('Naam moet minimaal 2 tekens bevatten')
      valid = false
    } else {
      setNameError('')
    }
    if (!city.trim()) {
      setCityError('Vul de stad in')
      valid = false
    } else {
      setCityError('')
    }
    if (!slug) {
      setSlugError('Vul een URL-slug in')
      valid = false
    } else if (!isValidSlug(slug)) {
      setSlugError('Alleen kleine letters, cijfers en streepjes. Min. 2 tekens.')
      valid = false
    } else {
      setSlugError('')
    }
    return valid
  }

  // Step 2 handlers — funds
  function addFund() {
    setFunds([...funds, { name: '', description: '', icon: '\u{1F4E6}' }])
  }

  function removeFund(index: number) {
    if (funds.length <= 1) return
    setFunds(funds.filter((_, i) => i !== index))
    setFundToRemove(null)
  }

  function updateFund(index: number, field: string, value: string) {
    const updated = [...funds]
    updated[index] = { ...updated[index], [field]: value }
    setFunds(updated)
  }

  function handleDragStart(index: number) {
    dragItem.current = index
  }

  function handleDragEnter(index: number) {
    dragOverItem.current = index
  }

  function handleDragEnd() {
    if (dragItem.current === null || dragOverItem.current === null) return
    const updated = [...funds]
    const draggedItem = updated[dragItem.current]
    updated.splice(dragItem.current, 1)
    updated.splice(dragOverItem.current, 0, draggedItem)
    setFunds(updated)
    dragItem.current = null
    dragOverItem.current = null
  }

  // Submit — creates mosque, then transitions to step 3
  async function handleComplete() {
    setError(null)
    setLoading(true)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('Niet ingelogd')
      const user = session.user

      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mosque: {
            name: mosqueName,
            slug,
            city,
            primary_color: primaryColor,
            welcome_msg: null,
            anbi_status: anbiStatus,
            rsin: anbiStatus ? rsin : null,
          },
          funds: funds.filter((f) => f.name.trim()),
          user: {
            name: user.user_metadata?.name || user.email,
            email: user.email,
          },
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Er is iets misgegaan')
      }

      // Generate QR code for the donation page
      const donationUrl = `${APP_URL}/doneren/${slug}`
      const dataUrl = await QRCode.toDataURL(donationUrl, {
        width: 300,
        margin: 2,
        color: { dark: '#261b07', light: '#ffffff' },
      })
      setQrDataUrl(dataUrl)

      setLoading(false)
      goTo(3)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is iets misgegaan')
      setLoading(false)
    }
  }

  const donationUrl = `${APP_URL}/doneren/${slug}`

  // Transition
  const transitionClass = isAnimating
    ? direction === 'forward'
      ? 'opacity-0 translate-x-4'
      : 'opacity-0 -translate-x-4'
    : 'opacity-100 translate-x-0'

  return (
    <div className="w-full max-w-[480px] py-8">
      <div className={`transition-all duration-300 ease-in-out ${transitionClass}`}>

        {/* ================================================================= */}
        {/* STEP 1 — Basics + Branding                                       */}
        {/* ================================================================= */}
        {step === 1 && (
          <div className="text-center">
            <span className="inline-block rounded-full border border-[#e3dfd5] px-4 py-1 text-[12px] font-medium text-[#8a8478] mb-4">
              {STEP_LABELS[0]}
            </span>

            <h1
              className="text-[24px] font-[584] tracking-[-0.48px] text-[#261b07] mb-1"
              style={{ fontFamily: 'var(--font-display), sans-serif' }}
            >
              Hoe heet uw moskee?
            </h1>
            <p className="text-[14px] text-[#a09888] mb-8">De basisinformatie van uw organisatie.</p>

            <div className="text-left space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-[#261b07] mb-1.5">Naam moskee</label>
                <input
                  type="text"
                  placeholder="bijv. Stichting Al-Fath"
                  value={mosqueName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className={inputClass}
                  autoFocus
                />
                <FieldError message={nameError} />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#261b07] mb-1.5">Stad</label>
                <input
                  type="text"
                  placeholder="bijv. Amsterdam"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value)
                    if (cityError) setCityError('')
                  }}
                  className={inputClass}
                />
                <FieldError message={cityError} />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#261b07] mb-1.5">URL-slug</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="uw-moskee"
                  className={inputClass}
                />
                <FieldError message={slugError} />
                {slug && !slugError && (
                  <p className="text-[12px] text-[#a09888] mt-1">
                    Uw donatiepagina:{' '}
                    <span className="font-medium text-[#261b07]">bunyan.io/doneren/{slug}</span>
                  </p>
                )}
              </div>

              {/* Color picker — compact */}
              <div>
                <label className="block text-[13px] font-medium text-[#261b07] mb-2.5">Kleur</label>
                <div className="flex flex-wrap gap-2.5">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      title={preset.label}
                      className={`relative h-9 w-9 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                        primaryColor === preset.value ? 'border-[#261b07] scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: preset.value }}
                      onClick={() => setPrimaryColor(preset.value)}
                    >
                      {primaryColor === preset.value && (
                        <svg className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (validateStep1()) goTo(2)
              }}
              className="w-full mt-6 rounded-lg bg-[#261b07] py-3 text-[14px] font-semibold text-[#f8f7f5] hover:bg-[#3a2c14] transition-colors"
            >
              Doorgaan
            </button>

            <StepDots current={1} total={TOTAL_STEPS} />
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 2 — Funds + ANBI                                            */}
        {/* ================================================================= */}
        {step === 2 && (
          <div className="text-center">
            <span className="inline-block rounded-full border border-[#e3dfd5] px-4 py-1 text-[12px] font-medium text-[#8a8478] mb-4">
              {STEP_LABELS[1]}
            </span>

            <h1
              className="text-[24px] font-[584] tracking-[-0.48px] text-[#261b07] mb-1"
              style={{ fontFamily: 'var(--font-display), sans-serif' }}
            >
              Richt uw fondsen in
            </h1>
            <p className="text-[14px] text-[#a09888] mb-8">Donateurs kiezen waar hun gift naartoe gaat.</p>

            <div className="text-left space-y-2.5">
              {funds.map((fund, i) => (
                <div
                  key={i}
                  className="group flex items-center gap-2.5 rounded-lg border border-[#e3dfd5] bg-white p-2.5 transition-colors hover:border-[#d0cbc0]"
                  draggable
                  onDragStart={() => handleDragStart(i)}
                  onDragEnter={() => handleDragEnter(i)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                >
                  {/* Drag handle */}
                  <button
                    type="button"
                    className="cursor-grab touch-none p-0.5 text-[#b5b0a5] hover:text-[#8a8478] active:cursor-grabbing"
                    tabIndex={-1}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="9" cy="6" r="1.5" />
                      <circle cx="15" cy="6" r="1.5" />
                      <circle cx="9" cy="12" r="1.5" />
                      <circle cx="15" cy="12" r="1.5" />
                      <circle cx="9" cy="18" r="1.5" />
                      <circle cx="15" cy="18" r="1.5" />
                    </svg>
                  </button>

                  {/* Icon */}
                  <input
                    value={fund.icon}
                    onChange={(e) => updateFund(i, 'icon', e.target.value)}
                    className="w-10 text-center rounded-md border border-[#e3dfd5] bg-[#f8f7f5] py-1.5 text-[14px] outline-none focus:border-[#261b07]/30"
                  />

                  {/* Name */}
                  <input
                    value={fund.name}
                    onChange={(e) => updateFund(i, 'name', e.target.value)}
                    placeholder="Fondsnaam"
                    className="flex-1 rounded-md border border-[#e3dfd5] bg-white px-3 py-1.5 text-[13px] text-[#261b07] placeholder:text-[#b5b0a5] outline-none focus:border-[#261b07]/30"
                  />

                  {/* Remove */}
                  {funds.length > 1 && (
                    <>
                      {fundToRemove === i ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => removeFund(i)}
                            className="rounded px-2 py-1 text-[11px] font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          >
                            Ja
                          </button>
                          <button
                            onClick={() => setFundToRemove(null)}
                            className="rounded px-2 py-1 text-[11px] font-medium text-[#8a8478] hover:bg-[#f0ede6] transition-colors"
                          >
                            Nee
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setFundToRemove(i)}
                          className="p-1 text-[#b5b0a5] hover:text-red-500 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </>
                  )}
                </div>
              ))}

              <button
                onClick={addFund}
                className="w-full rounded-lg border border-dashed border-[#d5cfb8] py-2.5 text-[13px] font-medium text-[#8a8478] hover:bg-[#f0ede6] hover:border-[#c0b9a6] transition-colors"
              >
                + Fonds toevoegen
              </button>
            </div>

            {/* ANBI toggle — compact, at bottom of step 2 */}
            <div className="mt-6 pt-5 border-t border-[#e3dfd5]">
              <label className="flex items-start gap-3.5 cursor-pointer text-left rounded-lg border border-[#e3dfd5] bg-white p-4 transition-colors hover:border-[#d0cbc0]">
                <div className="pt-0.5">
                  <div
                    onClick={(e) => {
                      e.preventDefault()
                      setAnbiStatus(!anbiStatus)
                    }}
                    className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                      anbiStatus ? 'bg-[#261b07] border-[#261b07]' : 'border-[#d5cfb8] bg-white'
                    }`}
                  >
                    {anbiStatus && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-[14px] font-medium text-[#261b07]">Wij hebben ANBI-status</p>
                  <p className="text-[12px] text-[#a09888] mt-0.5">
                    Donateurs ontvangen automatisch een fiscale jaaropgave
                  </p>
                </div>
              </label>

              {anbiStatus && (
                <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-300 text-left">
                  <label className="block text-[13px] font-medium text-[#261b07] mb-1.5">RSIN nummer</label>
                  <input
                    placeholder="123456789"
                    value={rsin}
                    onChange={(e) => setRsin(e.target.value.replace(/\D/g, '').slice(0, 9))}
                    inputMode="numeric"
                    maxLength={9}
                    className={inputClass}
                  />
                  <p className="text-[12px] text-[#a09888] mt-1">
                    9 cijfers, te vinden op de ANBI-beschikking van de Belastingdienst
                  </p>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 mt-4">
                <p className="text-[13px] text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => goTo(1)}
                className="flex-1 rounded-lg border border-[#e3dfd5] py-3 text-[14px] font-medium text-[#261b07] hover:bg-[#f0ede6] transition-colors"
              >
                Terug
              </button>
              <button
                onClick={handleComplete}
                disabled={loading || funds.every((f) => !f.name.trim())}
                className="flex-1 rounded-lg bg-[#261b07] py-3 text-[14px] font-semibold text-[#f8f7f5] hover:bg-[#3a2c14] disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-[#f8f7f5] border-t-transparent animate-spin" />
                    Bezig...
                  </span>
                ) : (
                  'Moskee aanmaken'
                )}
              </button>
            </div>

            <StepDots current={2} total={TOTAL_STEPS} />
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 3 — "U bent live!" share moment                             */}
        {/* ================================================================= */}
        {step === 3 && (
          <div className="text-center">
            {/* Success icon */}
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f0d4]">
              <svg className="w-8 h-8 text-[#6aab35]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1
              className="text-[24px] font-[584] tracking-[-0.48px] text-[#261b07] mb-1"
              style={{ fontFamily: 'var(--font-display), sans-serif' }}
            >
              {mosqueName} is live!
            </h1>
            <p className="text-[14px] text-[#a09888] mb-8">
              Uw donatiepagina is klaar. Deel de link met uw gemeenschap.
            </p>

            {/* Donation page link */}
            <div className="text-left mb-5">
              <label className="block text-[11px] font-medium text-[#a09888] uppercase tracking-wide mb-1.5">Donatiepagina</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0 flex items-center rounded-lg border border-[#e3dfd5] bg-[#fafaf8] px-4 py-3">
                  <span className="text-[13px] text-[#261b07] font-medium truncate">{donationUrl}</span>
                </div>
                <CopyButton text={donationUrl} />
              </div>
            </div>

            {/* QR code */}
            {qrDataUrl && (
              <div className="mx-auto mb-5 flex flex-col items-center">
                <div className="rounded-xl border border-[#e3dfd5] bg-white p-4">
                  <img
                    src={qrDataUrl}
                    alt="QR code voor donatiepagina"
                    className="w-[180px] h-[180px]"
                  />
                </div>
                <p className="text-[11px] text-[#b5b0a5] mt-2">Scan om te doneren</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-2.5">
              {/* Try it yourself */}
              <a
                href={donationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full rounded-lg border-2 border-dashed border-[#C87D3A]/40 bg-[#C87D3A]/5 py-3.5 text-[14px] font-semibold text-[#C87D3A] hover:bg-[#C87D3A]/10 hover:border-[#C87D3A]/60 transition-colors"
              >
                Probeer het: doneer €1 aan uzelf
                <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
              </a>

              {/* WhatsApp share */}
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Doneer aan ${mosqueName}: ${donationUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full rounded-lg bg-[#25D366] py-3 text-[14px] font-semibold text-white hover:bg-[#20bd5a] transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Deel via WhatsApp
              </a>
            </div>

            {/* Stripe info note */}
            <div className="mt-6 rounded-lg border border-[#e3dfd5] bg-[#fafaf8] p-4">
              <p className="text-[12px] text-[#8a8478] leading-relaxed">
                Betalingen worden veilig verwerkt via Stripe (iDEAL, creditcard, SEPA). Na de pilot helpen wij u met het koppelen van uw eigen bankrekening.
              </p>
            </div>

            {/* Go to dashboard */}
            <button
              onClick={() => {
                router.push('/dashboard')
                router.refresh()
              }}
              className="w-full mt-5 rounded-lg bg-[#261b07] py-3 text-[14px] font-semibold text-[#f8f7f5] hover:bg-[#3a2c14] transition-colors"
            >
              Ga naar het dashboard
            </button>

            <StepDots current={3} total={TOTAL_STEPS} />
          </div>
        )}
      </div>
    </div>
  )
}
