'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckIcon, PlusIcon, Trash2Icon, GripVerticalIcon, ArrowRightIcon, ArrowLeftIcon, Loader2Icon, PartyPopperIcon } from 'lucide-react'

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

const STEP_LABELS = [
  'Gegevens',
  'Branding',
  'Fondsen',
  'ANBI',
]

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
// Step indicator
// ---------------------------------------------------------------------------

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="mb-8">
      <div className="text-center mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Welkom bij Bunyan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Stel uw moskee in — stap {current} van {total}
        </p>
      </div>

      {/* Step dots + connecting lines */}
      <div className="flex items-center justify-center gap-0 mx-auto max-w-xs">
        {Array.from({ length: total }, (_, i) => {
          const stepNum = i + 1
          const isCompleted = stepNum < current
          const isCurrent = stepNum === current
          return (
            <div key={stepNum} className="flex items-center">
              {/* Dot */}
              <div
                className={[
                  'flex items-center justify-center rounded-full text-xs font-semibold transition-all duration-300',
                  'min-w-8 min-h-8 w-8 h-8 sm:min-w-9 sm:min-h-9 sm:w-9 sm:h-9',
                  isCompleted
                    ? 'bg-primary text-primary-foreground'
                    : isCurrent
                      ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                      : 'bg-muted text-muted-foreground',
                ].join(' ')}
              >
                {isCompleted ? <CheckIcon className="size-4" /> : stepNum}
              </div>

              {/* Connector line */}
              {stepNum < total && (
                <div
                  className={[
                    'h-0.5 w-8 sm:w-12 transition-colors duration-300',
                    stepNum < current ? 'bg-primary' : 'bg-muted',
                  ].join(' ')}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Step label */}
      <p className="text-center mt-2 text-xs text-muted-foreground">
        {STEP_LABELS[current - 1]}
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Inline field error
// ---------------------------------------------------------------------------

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="text-xs text-destructive mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
      {message}
    </p>
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
  const [showSuccess, setShowSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Step 1: Basics
  const [mosqueName, setMosqueName] = useState('')
  const [city, setCity] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)

  // Step 1 validation
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

  // Drag state for fund reorder
  const dragItem = useRef<number | null>(null)
  const dragOverItem = useRef<number | null>(null)

  // Step 4: ANBI
  const [anbiStatus, setAnbiStatus] = useState(false)
  const [rsin, setRsin] = useState('')

  // -------------------------------------------------------------------------
  // Navigation with transitions
  // -------------------------------------------------------------------------

  const goTo = useCallback((target: number) => {
    if (isAnimating) return
    setDirection(target > step ? 'forward' : 'back')
    setIsAnimating(true)
    // Small delay to let exit animation start, then switch step
    setTimeout(() => {
      setStep(target)
      setIsAnimating(false)
    }, 150)
  }, [step, isAnimating])

  function handleNameChange(name: string) {
    setMosqueName(name)
    if (nameError) setNameError('')
    // Auto-generate slug only if user hasn't manually edited it
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

  // -------------------------------------------------------------------------
  // Step 1 validation
  // -------------------------------------------------------------------------

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

  // -------------------------------------------------------------------------
  // Fund management
  // -------------------------------------------------------------------------

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

  // -------------------------------------------------------------------------
  // Color picker
  // -------------------------------------------------------------------------

  function handleCustomHexChange(value: string) {
    // Allow typing with or without #
    let hex = value.startsWith('#') ? value : `#${value}`
    setCustomHex(value)
    // Apply when we have a valid 7-char hex
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      setPrimaryColor(hex.toLowerCase())
    }
  }

  const isCustomColor = !COLOR_PRESETS.some((p) => p.value === primaryColor)

  // -------------------------------------------------------------------------
  // Submit
  // -------------------------------------------------------------------------

  async function handleComplete() {
    setError(null)
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
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

      // Show success state briefly before redirect
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

  // -------------------------------------------------------------------------
  // Success screen
  // -------------------------------------------------------------------------

  if (showSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <PartyPopperIcon className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Uw moskee is aangemaakt!</h2>
          <p className="mt-2 text-muted-foreground">
            U wordt doorgestuurd naar het dashboard...
          </p>
          <div className="mt-4 flex justify-center">
            <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // Transition wrapper
  // -------------------------------------------------------------------------

  const transitionClass = isAnimating
    ? direction === 'forward'
      ? 'opacity-0 translate-x-4'
      : 'opacity-0 -translate-x-4'
    : 'opacity-100 translate-x-0'

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-lg">
        <StepIndicator current={step} total={TOTAL_STEPS} />

        <div className={`transition-all duration-300 ease-in-out ${transitionClass}`}>
          {/* ============================================================= */}
          {/* STEP 1 — Mosque Basics                                        */}
          {/* ============================================================= */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Moskee gegevens</CardTitle>
                <CardDescription>De basisinformatie van uw moskee</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Naam moskee <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="bijv. Stichting Al-Fath"
                    value={mosqueName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    aria-invalid={!!nameError}
                    autoFocus
                  />
                  <FieldError message={nameError} />
                </div>

                {/* City */}
                <div className="space-y-2">
                  <Label htmlFor="city">
                    Stad <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="city"
                    placeholder="bijv. Amsterdam"
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value)
                      if (cityError) setCityError('')
                    }}
                    aria-invalid={!!cityError}
                  />
                  <FieldError message={cityError} />
                </div>

                {/* Slug */}
                <div className="space-y-2">
                  <Label htmlFor="slug">
                    URL-slug <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="uw-moskee"
                    aria-invalid={!!slugError}
                  />
                  <FieldError message={slugError} />
                  {/* Live URL preview */}
                  {slug && !slugError && (
                    <p className="text-xs text-muted-foreground animate-in fade-in duration-200">
                      Uw donatiepagina:{' '}
                      <span className="font-medium text-foreground">
                        bunyan.io/doneren/{slug}
                      </span>
                    </p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="justify-end">
                <Button
                  size="lg"
                  onClick={() => {
                    if (validateStep1()) goTo(2)
                  }}
                >
                  Volgende
                  <ArrowRightIcon className="ml-1 size-4" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* ============================================================= */}
          {/* STEP 2 — Branding                                             */}
          {/* ============================================================= */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Branding</CardTitle>
                <CardDescription>Personaliseer uw donatiepagina</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Color presets */}
                <div className="space-y-3">
                  <Label>Primaire kleur</Label>
                  <div className="flex flex-wrap gap-3">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        title={preset.label}
                        className={[
                          'relative h-10 w-10 rounded-full border-2 transition-all duration-200',
                          'hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                          primaryColor === preset.value
                            ? 'border-foreground scale-110'
                            : 'border-transparent',
                        ].join(' ')}
                        style={{ backgroundColor: preset.value }}
                        onClick={() => {
                          setPrimaryColor(preset.value)
                          setCustomHex('')
                        }}
                      >
                        {primaryColor === preset.value && (
                          <CheckIcon className="absolute inset-0 m-auto h-5 w-5 text-white drop-shadow-sm" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Custom hex input */}
                  <div className="flex items-center gap-2 mt-2">
                    <div
                      className="h-10 w-10 shrink-0 rounded-full border-2 transition-colors duration-200"
                      style={{
                        backgroundColor: primaryColor,
                        borderColor: isCustomColor ? 'var(--foreground)' : 'transparent',
                      }}
                    />
                    <div className="flex-1">
                      <Input
                        placeholder="#1a2b3c"
                        value={customHex}
                        onChange={(e) => handleCustomHexChange(e.target.value)}
                        maxLength={7}
                        className="font-mono text-sm"
                      />
                    </div>
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      Eigen kleur
                    </span>
                  </div>
                </div>

                {/* Welcome message */}
                <div className="space-y-2">
                  <Label htmlFor="welcome">Welkomstbericht (optioneel)</Label>
                  <Input
                    id="welcome"
                    placeholder="bijv. Welkom bij onze moskee. Uw donatie maakt het verschil."
                    value={welcomeMsg}
                    onChange={(e) => setWelcomeMsg(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Dit bericht verschijnt bovenaan uw donatiepagina.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="justify-between">
                <Button variant="ghost" size="lg" onClick={() => goTo(1)}>
                  <ArrowLeftIcon className="mr-1 size-4" />
                  Terug
                </Button>
                <Button size="lg" onClick={() => goTo(3)}>
                  Volgende
                  <ArrowRightIcon className="ml-1 size-4" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* ============================================================= */}
          {/* STEP 3 — Funds                                                */}
          {/* ============================================================= */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Fondsen</CardTitle>
                <CardDescription>
                  Richt fondsen in waar donateurs aan kunnen geven. Versleep om de volgorde te wijzigen.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {funds.map((fund, i) => (
                  <div
                    key={i}
                    className="group flex items-center gap-2 rounded-lg border bg-card p-2 transition-colors hover:bg-muted/50"
                    draggable
                    onDragStart={() => handleDragStart(i)}
                    onDragEnter={() => handleDragEnter(i)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    {/* Drag handle */}
                    <button
                      type="button"
                      className="cursor-grab touch-none p-1 text-muted-foreground hover:text-foreground active:cursor-grabbing"
                      aria-label="Versleep om te herordenen"
                      tabIndex={-1}
                    >
                      <GripVerticalIcon className="size-4" />
                    </button>

                    {/* Icon */}
                    <Input
                      value={fund.icon}
                      onChange={(e) => updateFund(i, 'icon', e.target.value)}
                      className="w-12 text-center px-1"
                      aria-label="Icoon"
                    />

                    {/* Name */}
                    <Input
                      value={fund.name}
                      onChange={(e) => updateFund(i, 'name', e.target.value)}
                      placeholder="Fondsnaam"
                      className="flex-1"
                      aria-label={`Fonds ${i + 1} naam`}
                    />

                    {/* Remove button */}
                    {funds.length > 1 && (
                      <>
                        {fundToRemove === i ? (
                          <div className="flex items-center gap-1 animate-in fade-in duration-200">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeFund(i)}
                              className="text-xs"
                            >
                              Ja
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setFundToRemove(null)}
                              className="text-xs"
                            >
                              Nee
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setFundToRemove(i)}
                            aria-label={`Verwijder ${fund.name || 'fonds'}`}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2Icon className="size-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                ))}

                <Button variant="outline" size="sm" onClick={addFund} className="w-full mt-2">
                  <PlusIcon className="mr-1 size-4" />
                  Fonds toevoegen
                </Button>
              </CardContent>
              <CardFooter className="justify-between">
                <Button variant="ghost" size="lg" onClick={() => goTo(2)}>
                  <ArrowLeftIcon className="mr-1 size-4" />
                  Terug
                </Button>
                <Button
                  size="lg"
                  onClick={() => goTo(4)}
                  disabled={funds.every((f) => !f.name.trim())}
                >
                  Volgende
                  <ArrowRightIcon className="ml-1 size-4" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* ============================================================= */}
          {/* STEP 4 — ANBI                                                 */}
          {/* ============================================================= */}
          {step === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>ANBI-status</CardTitle>
                <CardDescription>
                  Als uw moskee een ANBI-instelling is, kunnen donateurs hun gift aftrekken van de belasting.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* ANBI checkbox */}
                <label className="flex items-center gap-3 cursor-pointer rounded-lg border p-4 transition-colors hover:bg-muted/50">
                  <Checkbox
                    checked={anbiStatus}
                    onCheckedChange={(checked) => setAnbiStatus(checked === true)}
                  />
                  <div>
                    <p className="text-sm font-medium">Onze moskee heeft ANBI-status</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Donateurs ontvangen dan automatisch een fiscale ontvangstbevestiging
                    </p>
                  </div>
                </label>

                {/* RSIN input — appears when ANBI is checked */}
                {anbiStatus && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Label htmlFor="rsin">RSIN nummer</Label>
                    <Input
                      id="rsin"
                      placeholder="123456789"
                      value={rsin}
                      onChange={(e) => setRsin(e.target.value.replace(/\D/g, '').slice(0, 9))}
                      inputMode="numeric"
                      maxLength={9}
                    />
                    <p className="text-xs text-muted-foreground">
                      9 cijfers, te vinden op de ANBI-beschikking van de Belastingdienst
                    </p>
                  </div>
                )}

                {/* Skip affordance */}
                {!anbiStatus && (
                  <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      Geen ANBI-status? Geen probleem.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Je kunt dit later instellen via Instellingen.
                    </p>
                  </div>
                )}

                {/* Stripe info */}
                <div className="rounded-lg border bg-muted/50 p-4">
                  <p className="text-sm font-medium">Online betalingen</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Betalingen worden veilig verwerkt via Stripe (iDEAL, creditcard, SEPA).
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 animate-in fade-in duration-200">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="justify-between">
                <Button variant="ghost" size="lg" onClick={() => goTo(3)}>
                  <ArrowLeftIcon className="mr-1 size-4" />
                  Terug
                </Button>
                <Button size="lg" onClick={handleComplete} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2Icon className="mr-1 size-4 animate-spin" />
                      Bezig...
                    </>
                  ) : (
                    'Moskee aanmaken'
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
