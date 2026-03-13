'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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

const TOTAL_STEPS = 4

const STEP_LABELS = ['Gegevens', 'Branding', 'Fondsen', 'ANBI']

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
  { value: '#ec4899', label: 'Roze' },
  { value: '#14b8a6', label: 'Teal' },
]

// ---------------------------------------------------------------------------
// Shared input class
// ---------------------------------------------------------------------------

const inputClass =
  'w-full rounded-lg border border-[#e3dfd5] bg-white px-4 py-3 text-[14px] text-[#261b07] placeholder:text-[#b5b0a5] outline-none focus:border-[#261b07]/30 focus:ring-1 focus:ring-[#261b07]/10 transition-colors'

// ---------------------------------------------------------------------------
// Step dots
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

// ---------------------------------------------------------------------------
// Field error
// ---------------------------------------------------------------------------

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-[12px] text-red-600 mt-1">{message}</p>
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
  const [showSuccess, setShowSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Step 1: Basics
  const [mosqueName, setMosqueName] = useState('')
  const [city, setCity] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [nameError, setNameError] = useState('')
  const [cityError, setCityError] = useState('')
  const [slugError, setSlugError] = useState('')

  // Step 2: Branding
  const [primaryColor, setPrimaryColor] = useState('#10b981')
  const [customHex, setCustomHex] = useState('')
  const [welcomeMsg, setWelcomeMsg] = useState('')

  // Step 3: Funds
  const [funds, setFunds] = useState(DEFAULT_FUNDS.map((f) => ({ ...f })))
  const [fundToRemove, setFundToRemove] = useState<number | null>(null)
  const dragItem = useRef<number | null>(null)
  const dragOverItem = useRef<number | null>(null)

  // Step 4: ANBI
  const [anbiStatus, setAnbiStatus] = useState(false)
  const [rsin, setRsin] = useState('')

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

  function handleNameChange(name: string) {
    setMosqueName(name)
    if (nameError) setNameError('')
    if (!slugTouched) {
      setSlug(slugify(name))
      if (slugError) setSlugError('')
    }
  }

  function handleSlugChange(value: string) {
    const processed = slugify(value)
    setSlug(processed)
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

  // Fund management
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

  // Color picker
  function handleCustomHexChange(value: string) {
    let hex = value.startsWith('#') ? value : `#${value}`
    setCustomHex(value)
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      setPrimaryColor(hex.toLowerCase())
    }
  }

  const isCustomColor = !COLOR_PRESETS.some((p) => p.value === primaryColor)

  // Submit
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
            welcome_msg: welcomeMsg || null,
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

      setShowSuccess(true)
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is iets misgegaan')
      setLoading(false)
    }
  }

  // Success screen
  if (showSuccess) {
    return (
      <div className="w-full max-w-[480px] text-center py-20">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f0d4]">
          <svg className="w-8 h-8 text-[#6aab35]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2
          className="text-[24px] font-[584] tracking-[-0.48px] text-[#261b07] mb-2"
          style={{ fontFamily: 'var(--font-display), sans-serif' }}
        >
          Uw moskee is aangemaakt!
        </h2>
        <p className="text-[15px] text-[#a09888] mb-6">U wordt doorgestuurd naar het dashboard...</p>
        <div className="flex justify-center">
          <div className="w-5 h-5 rounded-full border-2 border-[#261b07] border-t-transparent animate-spin" />
        </div>
      </div>
    )
  }

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
        {/* STEP 1 — Mosque Basics                                           */}
        {/* ================================================================= */}
        {step === 1 && (
          <div className="text-center">
            {/* Step pill */}
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
        {/* STEP 2 — Branding                                                */}
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
              Personaliseer uw pagina
            </h1>
            <p className="text-[14px] text-[#a09888] mb-8">Kies een kleur en welkomstbericht.</p>

            <div className="text-left space-y-5">
              {/* Color presets */}
              <div>
                <label className="block text-[13px] font-medium text-[#261b07] mb-3">Primaire kleur</label>
                <div className="flex flex-wrap gap-3">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      title={preset.label}
                      className={`relative h-10 w-10 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                        primaryColor === preset.value ? 'border-[#261b07] scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: preset.value }}
                      onClick={() => {
                        setPrimaryColor(preset.value)
                        setCustomHex('')
                      }}
                    >
                      {primaryColor === preset.value && (
                        <svg className="absolute inset-0 m-auto h-5 w-5 text-white drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>

                {/* Custom hex */}
                <div className="flex items-center gap-3 mt-3">
                  <div
                    className="h-10 w-10 shrink-0 rounded-full border-2 transition-colors duration-200"
                    style={{
                      backgroundColor: primaryColor,
                      borderColor: isCustomColor ? '#261b07' : 'transparent',
                    }}
                  />
                  <input
                    placeholder="#1a2b3c"
                    value={customHex}
                    onChange={(e) => handleCustomHexChange(e.target.value)}
                    maxLength={7}
                    className={`${inputClass} font-mono`}
                  />
                  <span className="text-[12px] text-[#a09888] whitespace-nowrap hidden sm:inline">Eigen kleur</span>
                </div>
              </div>

              {/* Welcome message */}
              <div>
                <label className="block text-[13px] font-medium text-[#261b07] mb-1.5">
                  Welkomstbericht <span className="text-[#b5b0a5] font-normal">(optioneel)</span>
                </label>
                <input
                  type="text"
                  placeholder="bijv. Welkom bij onze moskee. Uw donatie maakt het verschil."
                  value={welcomeMsg}
                  onChange={(e) => setWelcomeMsg(e.target.value)}
                  className={inputClass}
                />
                <p className="text-[12px] text-[#a09888] mt-1">Dit bericht verschijnt bovenaan uw donatiepagina.</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => goTo(1)}
                className="flex-1 rounded-lg border border-[#e3dfd5] py-3 text-[14px] font-medium text-[#261b07] hover:bg-[#f0ede6] transition-colors"
              >
                Terug
              </button>
              <button onClick={() => goTo(3)} className="flex-1 rounded-lg bg-[#261b07] py-3 text-[14px] font-semibold text-[#f8f7f5] hover:bg-[#3a2c14] transition-colors">
                Doorgaan
              </button>
            </div>

            <StepDots current={2} total={TOTAL_STEPS} />
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 3 — Funds                                                   */}
        {/* ================================================================= */}
        {step === 3 && (
          <div className="text-center">
            <span className="inline-block rounded-full border border-[#e3dfd5] px-4 py-1 text-[12px] font-medium text-[#8a8478] mb-4">
              {STEP_LABELS[2]}
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

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => goTo(2)}
                className="flex-1 rounded-lg border border-[#e3dfd5] py-3 text-[14px] font-medium text-[#261b07] hover:bg-[#f0ede6] transition-colors"
              >
                Terug
              </button>
              <button
                onClick={() => goTo(4)}
                disabled={funds.every((f) => !f.name.trim())}
                className="flex-1 rounded-lg bg-[#261b07] py-3 text-[14px] font-semibold text-[#f8f7f5] hover:bg-[#3a2c14] disabled:opacity-50 transition-colors"
              >
                Doorgaan
              </button>
            </div>

            <StepDots current={3} total={TOTAL_STEPS} />
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 4 — ANBI                                                    */}
        {/* ================================================================= */}
        {step === 4 && (
          <div className="text-center">
            <span className="inline-block rounded-full border border-[#e3dfd5] px-4 py-1 text-[12px] font-medium text-[#8a8478] mb-4">
              {STEP_LABELS[3]}
            </span>

            <h1
              className="text-[24px] font-[584] tracking-[-0.48px] text-[#261b07] mb-1"
              style={{ fontFamily: 'var(--font-display), sans-serif' }}
            >
              Heeft u ANBI-status?
            </h1>
            <p className="text-[14px] text-[#a09888] mb-8">Donateurs kunnen hun gift dan aftrekken van de belasting.</p>

            <div className="text-left space-y-4">
              {/* ANBI toggle */}
              <label className="flex items-start gap-3.5 cursor-pointer rounded-lg border border-[#e3dfd5] bg-white p-4 transition-colors hover:border-[#d0cbc0]">
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
                  <p className="text-[14px] font-medium text-[#261b07]">Onze moskee heeft ANBI-status</p>
                  <p className="text-[12px] text-[#a09888] mt-0.5">
                    Donateurs ontvangen dan automatisch een fiscale ontvangstbevestiging
                  </p>
                </div>
              </label>

              {/* RSIN */}
              {anbiStatus && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
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

              {/* No ANBI */}
              {!anbiStatus && (
                <div className="rounded-lg border border-dashed border-[#d5cfb8] bg-[#f8f7f5] p-4 text-center">
                  <p className="text-[13px] text-[#a09888]">Geen ANBI-status? Geen probleem.</p>
                  <p className="text-[12px] text-[#b5b0a5] mt-1">U kunt dit later instellen via Instellingen.</p>
                </div>
              )}

              {/* Stripe info */}
              <div className="rounded-lg border border-[#e3dfd5] bg-[#f8f7f5] p-4">
                <p className="text-[13px] font-medium text-[#261b07]">Online betalingen</p>
                <p className="text-[12px] text-[#a09888] mt-1">
                  Betalingen worden veilig verwerkt via Stripe (iDEAL, creditcard, SEPA).
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-[13px] text-red-600">{error}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => goTo(3)}
                className="flex-1 rounded-lg border border-[#e3dfd5] py-3 text-[14px] font-medium text-[#261b07] hover:bg-[#f0ede6] transition-colors"
              >
                Terug
              </button>
              <button
                onClick={handleComplete}
                disabled={loading}
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

            <StepDots current={4} total={TOTAL_STEPS} />
          </div>
        )}
      </div>
    </div>
  )
}
