'use client'

import { useState } from 'react'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { getStripe } from '@/lib/stripe-client'
import { formatMoney } from '@/lib/money'
import { Loader2Icon, ShieldCheckIcon, ArrowLeftIcon, ChevronDownIcon } from 'lucide-react'
import Link from 'next/link'

type Fund = {
  id: string
  name: string
}

type Props = {
  mosqueSlug: string
  mosqueName: string
  primaryColor: string
  funds: Fund[]
}

const AMOUNT_PRESETS = [10, 25, 50, 100]
const MIN_AMOUNT = 1
const MAX_AMOUNT = 10_000

export function SnelDonationForm({ mosqueSlug, mosqueName, primaryColor, funds }: Props) {
  const [step, setStep] = useState<'select' | 'payment'>('select')
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [selectedFund, setSelectedFund] = useState<string>(funds[0]?.id || '')
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const accent = primaryColor || '#D4A843'

  // Resolve the active amount in euros
  const activeAmount = showCustom
    ? parseFloat(customAmount) || 0
    : selectedAmount ?? 0

  const activeAmountCents = Math.round(activeAmount * 100)
  const isValidAmount = activeAmount >= MIN_AMOUNT && activeAmount <= MAX_AMOUNT

  async function handleDonate() {
    if (!isValidAmount || !selectedFund) return

    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/payments/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mosque_slug: mosqueSlug,
          fund_id: selectedFund,
          amount: activeAmount,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Betaling aanmaken mislukt')
      }

      const data = await res.json()
      setClientSecret(data.clientSecret)
      setStep('payment')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Betaling aanmaken mislukt')
    } finally {
      setLoading(false)
    }
  }

  // ─── Payment step ───────────────────────────────────────────────────
  if (step === 'payment' && clientSecret) {
    return (
      <Elements
        stripe={getStripe()}
        options={{
          clientSecret,
          appearance: {
            theme: 'stripe',
            variables: {
              colorPrimary: accent,
              borderRadius: '14px',
              fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
              colorBackground: '#FFFDF8',
            },
            rules: {
              '.Input': { boxShadow: 'none', borderColor: '#E8E0D4', backgroundColor: '#FFFDF8' },
              '.Input:focus': { borderColor: accent, boxShadow: `0 0 0 3px ${accent}20` },
              '.Label': { color: '#1E293B', fontWeight: '600', fontSize: '13px' },
            },
          },
        }}
      >
        <SnelPaymentStep
          mosqueName={mosqueName}
          mosqueSlug={mosqueSlug}
          totalCents={activeAmountCents}
          accent={accent}
          onBack={() => {
            setStep('select')
            setClientSecret(null)
          }}
        />
      </Elements>
    )
  }

  // ─── Amount selection step ──────────────────────────────────────────
  return (
    <div className="mx-auto max-w-lg w-full px-4 pt-6 md:pt-10 flex flex-col min-h-[calc(100dvh-120px)]">
      {/* Mosque name — subtle */}
      <p
        className="text-center text-xs font-semibold uppercase tracking-[0.1em] mb-6"
        style={{ color: '#9B8E7B' }}
      >
        {mosqueName}
      </p>

      {/* Amount grid */}
      <div className="grid grid-cols-2 gap-3">
        {AMOUNT_PRESETS.map((preset) => {
          const active = !showCustom && selectedAmount === preset
          return (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setSelectedAmount(preset)
                setShowCustom(false)
                setError(null)
              }}
              className="relative flex items-center justify-center rounded-2xl transition-all duration-200 active:scale-[0.97]"
              style={{
                height: '72px',
                background: active
                  ? `linear-gradient(135deg, ${accent}, ${accent}E6)`
                  : 'white',
                color: active ? '#1B2541' : '#1B2541',
                boxShadow: active
                  ? `0 4px 20px ${accent}35`
                  : '0 2px 8px rgba(27, 37, 65, 0.06)',
                border: active ? 'none' : '1px solid rgba(228, 220, 207, 0.5)',
              }}
              aria-pressed={active}
              aria-label={`Doneer ${preset} euro`}
            >
              <span
                className="text-2xl font-bold"
                style={{ fontFamily: 'var(--font-display), var(--font-sans), system-ui' }}
              >
                {'\u20AC'}{preset}
              </span>
            </button>
          )
        })}
      </div>

      {/* Custom amount toggle */}
      {!showCustom ? (
        <button
          type="button"
          onClick={() => {
            setShowCustom(true)
            setSelectedAmount(null)
          }}
          className="mt-3 flex items-center justify-center gap-1.5 rounded-2xl py-3 text-sm font-semibold transition-all duration-200"
          style={{ color: '#9B8E7B' }}
          aria-expanded={false}
        >
          <ChevronDownIcon className="size-4" />
          Ander bedrag
        </button>
      ) : (
        <div className="mt-3">
          <div
            className="flex items-center rounded-2xl h-[60px] px-4 transition-all duration-200"
            style={{
              background: '#FAFAF7',
              border: `1px solid ${accent}`,
              boxShadow: `0 0 0 3px ${accent}15`,
            }}
          >
            <span className="text-xl font-bold select-none" style={{ color: '#9B8E7B' }}>{'\u20AC'}</span>
            <input
              type="text"
              inputMode="decimal"
              value={customAmount}
              onChange={(e) => {
                const v = e.target.value
                if (v === '' || /^\d*[.,]?\d{0,2}$/.test(v)) {
                  setCustomAmount(v.replace(',', '.'))
                  setError(null)
                }
              }}
              placeholder="0"
              autoFocus
              aria-label="Aangepast bedrag in euro"
              className="flex-1 bg-transparent text-2xl font-bold outline-none ml-2 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              style={{ color: '#1B2541', fontFamily: 'var(--font-display), var(--font-sans), system-ui' }}
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setShowCustom(false)
              setCustomAmount('')
              setSelectedAmount(AMOUNT_PRESETS[1])
            }}
            className="mt-2 text-xs font-medium transition-colors"
            style={{ color: '#9B8E7B' }}
          >
            Terug naar standaard bedragen
          </button>
        </div>
      )}

      {/* Fund selector — only shown if >1 fund */}
      {funds.length > 1 && (
        <div className="mt-5">
          <label
            className="block text-[11px] font-bold uppercase tracking-[0.12em] mb-2"
            style={{ color: '#9B8E7B' }}
          >
            Bestemming
          </label>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Kies een fonds">
            {funds.map((fund) => {
              const active = selectedFund === fund.id
              return (
                <button
                  key={fund.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setSelectedFund(fund.id)}
                  className="rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 active:scale-[0.97]"
                  style={active ? {
                    background: '#1B2541',
                    color: 'white',
                    boxShadow: '0 2px 8px rgba(27, 37, 65, 0.15)',
                  } : {
                    background: 'white',
                    color: '#1B2541',
                    border: '1px solid #EDE8DF',
                  }}
                >
                  {fund.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div
          className="mt-4 rounded-2xl px-4 py-3 text-sm font-medium"
          style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Spacer to push CTA to bottom */}
      <div className="flex-1 min-h-6" />

      {/* Sticky CTA */}
      <div className="sticky bottom-0 pb-4 pt-3" style={{ background: 'linear-gradient(to top, #FDFBF7 60%, transparent)' }}>
        <button
          type="button"
          onClick={handleDonate}
          disabled={loading || !isValidAmount || !selectedFund}
          className="w-full h-[60px] rounded-2xl text-lg font-bold transition-all duration-200 active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-2.5"
          style={{
            background: `linear-gradient(135deg, ${accent}, ${accent}E6)`,
            color: '#1B2541',
            boxShadow: `0 4px 20px ${accent}35`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = `0 6px 28px ${accent}50`
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = `0 4px 20px ${accent}35`
            e.currentTarget.style.transform = 'translateY(0)'
          }}
          aria-label={isValidAmount ? `Doneer ${formatMoney(activeAmountCents)}` : 'Kies een bedrag'}
        >
          {loading && <Loader2Icon className="size-5 animate-spin" />}
          {loading
            ? 'Bezig...'
            : isValidAmount
              ? `Doneer ${formatMoney(activeAmountCents)}`
              : 'Kies een bedrag'}
        </button>

        {/* Trust badge */}
        <div className="flex items-center justify-center gap-1.5 mt-3">
          <ShieldCheckIcon className="size-3.5" style={{ color: '#C4B99A' }} />
          <span className="text-[11px] font-medium" style={{ color: '#B5AC98' }}>
            Veilig betalen via Stripe
          </span>
        </div>

        {/* Link to full form */}
        <p className="text-center mt-3">
          <Link
            href={`/doneren/${mosqueSlug}`}
            className="text-xs font-medium underline underline-offset-2 transition-colors"
            style={{ color: '#9B8E7B' }}
          >
            Meer opties? Ga naar het volledige formulier
          </Link>
        </p>
      </div>
    </div>
  )
}

// ─── Payment Step ──────────────────────────────────────────────────────────────

function SnelPaymentStep({
  mosqueName,
  mosqueSlug,
  totalCents,
  accent,
  onBack,
}: {
  mosqueName: string
  mosqueSlug: string
  totalCents: number
  accent: string
  onBack: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    setError(null)

    const returnUrl = `${window.location.origin}/doneren/${mosqueSlug}/bedankt`
    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
    })

    if (stripeError) {
      setError(stripeError.message || 'Betaling mislukt')
    }
    setLoading(false)
  }

  return (
    <div className="mx-auto max-w-lg w-full">
      {/* Header */}
      <div className="flex items-center gap-3.5 px-5 py-4" style={{ borderBottom: '1px solid #EDE8DF' }}>
        <button
          type="button"
          onClick={onBack}
          className="size-11 rounded-2xl flex items-center justify-center transition-colors"
          style={{ background: '#F7F3EC', color: '#1B2541' }}
          aria-label="Terug naar bedrag selectie"
          onMouseEnter={(e) => e.currentTarget.style.background = '#EDE8DF'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#F7F3EC'}
        >
          <ArrowLeftIcon className="size-5" />
        </button>
        <div className="flex-1">
          <p className="font-bold text-sm" style={{ color: '#1B2541' }}>
            Betaal {formatMoney(totalCents)}
          </p>
          <p className="text-xs" style={{ color: '#9B8E7B' }}>{mosqueName}</p>
        </div>
      </div>

      {/* Payment form */}
      <div className="px-5 pt-5 pb-6 space-y-5">
        <form onSubmit={handleSubmit} className="space-y-5">
          <PaymentElement />

          {error && (
            <div
              className="rounded-2xl px-4 py-3 text-sm font-medium"
              style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}
              role="alert"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !stripe}
            className="w-full h-[58px] rounded-2xl text-base font-bold transition-all duration-200 active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-2.5"
            style={{
              background: `linear-gradient(135deg, ${accent}, ${accent}E6)`,
              color: '#1B2541',
              boxShadow: `0 4px 20px ${accent}35`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = `0 6px 28px ${accent}50`
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = `0 4px 20px ${accent}35`
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            {loading ? (
              <>
                <Loader2Icon className="size-5 animate-spin" />
                Bezig...
              </>
            ) : (
              `Betaal ${formatMoney(totalCents)}`
            )}
          </button>

          {/* Trust badge */}
          <div className="flex items-center justify-center gap-1.5">
            <ShieldCheckIcon className="size-3.5" style={{ color: '#C4B99A' }} />
            <span className="text-[11px] font-medium" style={{ color: '#B5AC98' }}>
              Veilig betalen via Stripe
            </span>
          </div>
        </form>
      </div>
    </div>
  )
}
