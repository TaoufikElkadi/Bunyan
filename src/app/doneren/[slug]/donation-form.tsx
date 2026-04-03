'use client'

import { useState } from 'react'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { getStripe } from '@/lib/stripe-client'
import { Checkbox } from '@/components/ui/checkbox'
import { calculateCoverFee } from '@/lib/fees'
import { formatMoney } from '@/lib/money'
import { useTranslation } from '@/lib/i18n/context'
import { ArrowLeftIcon, Loader2Icon, HeartIcon, ShieldCheckIcon, CheckIcon, FileTextIcon } from 'lucide-react'
import Image from 'next/image'
import { getFundIcon, FUND_ICON_COLORS } from '@/components/fund/fund-cards'
import { PeriodicGiftStep } from './periodic-gift-step'

type Fund = {
  id: string
  name: string
  description: string | null
  icon: string | null
  goal_amount: number | null
  raised: number // cents
}

type Props = {
  mosqueSlug: string
  mosqueName: string
  primaryColor: string
  welcomeMsg: string | null
  logoUrl: string | null
  funds: Fund[]
  preselectedFundId?: string
  campaignId?: string
  anbiEnabled?: boolean
  mosqueIban?: string | null
  mosqueRsin?: string | null
}

type Frequency = 'one-time' | 'weekly' | 'monthly' | 'yearly'

const AMOUNT_PRESETS = [10, 25, 50, 100]

const FREQUENCY_OPTIONS: { value: Frequency; key: string }[] = [
  { value: 'one-time', key: 'donate.frequency.one_time' },
  { value: 'weekly', key: 'donate.frequency.weekly' },
  { value: 'monthly', key: 'donate.frequency.monthly' },
  { value: 'yearly', key: 'donate.frequency.yearly' },
]

export function DonationForm({
  mosqueSlug,
  mosqueName,
  primaryColor,
  welcomeMsg,
  logoUrl,
  funds,
  preselectedFundId,
  campaignId,
  anbiEnabled,
  mosqueIban,
  mosqueRsin,
}: Props) {
  const { t, dir } = useTranslation()
  const [mode, setMode] = useState<'donate' | 'periodic'>('donate')
  const [step, setStep] = useState<'details' | 'payment'>('details')
  const [selectedFund, setSelectedFund] = useState<string>(preselectedFundId || funds[0]?.id || '')
  const [amount, setAmount] = useState<string>('25')
  const [frequency, setFrequency] = useState<Frequency>('one-time')
  const [donorName, setDonorName] = useState('')
  const [donorEmail, setDonorEmail] = useState('')
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [coverFee, setCoverFee] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isRecurring = frequency !== 'one-time'
  const amountCents = Math.round((parseFloat(amount) || 0) * 100)
  const feeCents = amountCents > 0 ? calculateCoverFee(amountCents, 'stripe') : 0
  const totalCents = coverFee ? amountCents + feeCents : amountCents

  // Derive warm accent from primaryColor or fallback to amber
  const accent = primaryColor || '#D4A843'

  async function handleContinueToPayment() {
    setError(null)
    setLoading(true)

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount < 1) {
      setError(t('donate.min_amount'))
      setLoading(false)
      return
    }
    if (isRecurring && !donorEmail) {
      setError(t('donate.email_required'))
      setLoading(false)
      return
    }

    try {
      const endpoint = isRecurring ? '/api/payments/subscribe' : '/api/payments/intent'
      const body = isRecurring
        ? { mosque_slug: mosqueSlug, fund_id: selectedFund, amount: numAmount, frequency, donor_name: donorName || undefined, donor_email: donorEmail, campaign_id: campaignId || undefined }
        : { mosque_slug: mosqueSlug, fund_id: selectedFund, amount: numAmount, donor_name: donorName || undefined, donor_email: donorEmail || undefined, cover_fee: coverFee, fee_amount: coverFee ? feeCents : 0, campaign_id: campaignId || undefined }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || t('donate.error'))
      }
      const data = await res.json()
      setClientSecret(data.clientSecret)
      setStep('payment')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('donate.error'))
    } finally {
      setLoading(false)
    }
  }

  // ─── Periodic gift mode ──────────────────────────────────────────────
  if (mode === 'periodic') {
    return (
      <PeriodicGiftStep
        mosqueSlug={mosqueSlug}
        mosqueName={mosqueName}
        logoUrl={logoUrl}
        accent={accent}
        funds={funds}
        anbiEnabled={anbiEnabled}
        mosqueIban={mosqueIban}
        mosqueRsin={mosqueRsin}
        onSwitchMode={() => setMode('donate')}
      />
    )
  }

  // ─── Payment step ─────────────────────────────────────────────────────
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
        <PaymentStep
          mosqueName={mosqueName}
          mosqueSlug={mosqueSlug}
          totalCents={totalCents}
          frequency={frequency}
          logoUrl={logoUrl}
          accent={accent}
          onBack={() => { setStep('details'); setClientSecret(null) }}
        />
      </Elements>
    )
  }

  // ─── Details step ─────────────────────────────────────────────────────
  return (
    <div dir={dir} className="mx-auto max-w-lg w-full px-4 pt-6 md:pt-10">
      {/* Mode tabs — wallet-style toggle */}
      {anbiEnabled && (
        <div className="flex rounded-2xl p-1 mb-4" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)', border: '1px solid rgba(228, 220, 207, 0.5)' }}>
          <button
            type="button"
            onClick={() => setMode('donate')}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-semibold transition-all duration-200"
            style={{
              background: 'white',
              color: '#1B2541',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
          >
            <HeartIcon className="size-4" />
            {t('donate.tab_donate')}
          </button>
          <button
            type="button"
            onClick={() => setMode('periodic')}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-semibold transition-all duration-200"
            style={{ color: '#9B8E7B' }}
          >
            <FileTextIcon className="size-4" />
            {t('donate.tab_periodic')}
          </button>
        </div>
      )}

      <div
        className="rounded-3xl bg-white p-6 space-y-6"
        style={{
          boxShadow: '0 8px 40px rgba(27, 37, 65, 0.08), 0 1px 3px rgba(27, 37, 65, 0.06)',
          border: '1px solid rgba(228, 220, 207, 0.5)',
        }}
      >
        {/* Mosque branding */}
        <div className="flex items-center gap-3.5">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={mosqueName}
              width={48}
              height={48}
              className="size-12 rounded-2xl object-cover"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
            />
          ) : (
            <div
              className="size-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg"
              style={{ background: `linear-gradient(135deg, ${accent}, ${accent}CC)` }}
            >
              {mosqueName.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-lg tracking-tight truncate" style={{ color: '#1B2541', fontFamily: 'var(--font-display), var(--font-sans), system-ui' }}>
              {mosqueName}
            </h1>
            {welcomeMsg && (
              <p className="text-xs mt-0.5 line-clamp-1" style={{ color: '#9B8E7B' }}>{welcomeMsg}</p>
            )}
          </div>
        </div>

        {/* Frequency tabs */}
        <div className="flex rounded-2xl p-1" style={{ background: '#F7F3EC' }}>
          {FREQUENCY_OPTIONS.map((opt) => {
            const active = frequency === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFrequency(opt.value)}
                className="flex-1 rounded-xl py-2.5 text-[13px] font-semibold transition-all duration-200"
                style={active ? {
                  background: 'white',
                  color: '#1B2541',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                } : {
                  color: '#9B8E7B',
                }}
              >
                {t(opt.key)}
              </button>
            )
          })}
        </div>

        {/* Amount input + presets */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-[0.12em] mb-2.5" style={{ color: '#9B8E7B' }}>
            {t('donate.amount_label')}
          </label>
          <div
            className="flex items-center rounded-2xl h-[56px] px-4 transition-all duration-200"
            style={{
              background: '#FAFAF7',
              border: '1px solid #EDE8DF',
            }}
          >
            <span className="text-lg font-bold select-none" style={{ color: '#9B8E7B' }}>€</span>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                const v = e.target.value
                if (v === '' || /^\d*[.,]?\d{0,2}$/.test(v)) {
                  setAmount(v.replace(',', '.'))
                }
              }}
              placeholder="0"
              className="flex-1 bg-transparent text-2xl font-bold outline-none ml-2 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              style={{ color: '#1B2541', fontFamily: 'var(--font-display), var(--font-sans), system-ui' }}
              onFocus={(e) => {
                const wrapper = e.currentTarget.parentElement!
                wrapper.style.borderColor = accent
                wrapper.style.boxShadow = `0 0 0 3px ${accent}15`
              }}
              onBlur={(e) => {
                const wrapper = e.currentTarget.parentElement!
                wrapper.style.borderColor = '#EDE8DF'
                wrapper.style.boxShadow = 'none'
              }}
            />
          </div>
          <div className="flex gap-2 mt-3">
            {AMOUNT_PRESETS.map((preset) => {
              const active = amount === String(preset)
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(String(preset))}
                  className="flex-1 h-10 rounded-xl text-sm font-semibold transition-all duration-200"
                  style={active ? {
                    background: accent,
                    color: '#1B2541',
                    boxShadow: `0 2px 10px ${accent}35`,
                  } : {
                    background: '#F7F3EC',
                    color: '#9B8E7B',
                  }}
                >
                  €{preset}
                </button>
              )
            })}
          </div>
        </div>

        {/* Fund selection */}
        {funds.length > 1 && (
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[0.12em] mb-2.5" style={{ color: '#9B8E7B' }}>
              {t('donate.fund_label')}
            </label>
            <div className="space-y-2">
              {funds.map((fund, index) => {
                const active = selectedFund === fund.id
                const Icon = getFundIcon(fund.icon, fund.name)
                const colorSet = FUND_ICON_COLORS[index % FUND_ICON_COLORS.length]
                const hasGoal = fund.goal_amount && fund.goal_amount > 0
                const pct = hasGoal ? Math.min((fund.raised / fund.goal_amount!) * 100, 100) : null
                return (
                  <button
                    key={fund.id}
                    type="button"
                    onClick={() => setSelectedFund(fund.id)}
                    className="w-full rounded-2xl p-3.5 text-start transition-all duration-200"
                    style={active ? {
                      background: '#1B2541',
                      color: 'white',
                      boxShadow: '0 4px 16px rgba(27, 37, 65, 0.2)',
                    } : {
                      background: '#FAFAF7',
                      color: '#1B2541',
                      border: '1px solid #EDE8DF',
                    }}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className="flex size-9 items-center justify-center rounded-xl shrink-0"
                        style={{
                          background: active ? 'rgba(255,255,255,0.12)' : `${colorSet.hex}15`,
                        }}
                      >
                        <Icon
                          className="size-[18px]"
                          strokeWidth={1.5}
                          style={{ color: active ? 'white' : colorSet.hex }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm">{fund.name}</div>
                        {fund.description && (
                          <div className="text-xs mt-0.5 line-clamp-1" style={{ color: active ? '#8B9CC0' : '#9B8E7B' }}>
                            {fund.description}
                          </div>
                        )}
                      </div>
                      <div
                        className="size-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                        style={active ? {
                          borderColor: accent,
                          background: accent,
                        } : {
                          borderColor: '#D4CFC5',
                        }}
                      >
                        {active && <CheckIcon className="size-3 text-white" strokeWidth={3} />}
                      </div>
                    </div>
                    {/* Progress bar */}
                    {hasGoal && (
                      <div className="mt-3">
                        <div
                          className="h-1.5 rounded-full overflow-hidden"
                          style={{ background: active ? 'rgba(255,255,255,0.12)' : '#EDE8DF' }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              background: active
                                ? accent
                                : `linear-gradient(90deg, ${colorSet.hex}, ${colorSet.hex}CC)`,
                            }}
                          />
                        </div>
                        <div className="flex justify-between mt-1.5">
                          <span className="text-[11px] font-medium" style={{ color: active ? '#8B9CC0' : '#9B8E7B' }}>
                            {formatMoney(fund.raised)}
                          </span>
                          <span className="text-[11px] font-medium" style={{ color: active ? '#8B9CC0' : '#9B8E7B' }}>
                            {formatMoney(fund.goal_amount!)}
                          </span>
                        </div>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Cover transaction fees */}
        {!isRecurring && amountCents >= 100 && (
          <label
            className="flex items-center gap-3.5 cursor-pointer rounded-2xl p-4 transition-all duration-200"
            style={{
              background: coverFee ? `${accent}10` : '#FAFAF7',
              border: `1px solid ${coverFee ? `${accent}30` : '#EDE8DF'}`,
            }}
          >
            <Checkbox
              id="cover-fee"
              checked={coverFee}
              onCheckedChange={(checked) => setCoverFee(checked === true)}
            />
            <div className="flex-1">
              <span className="text-sm font-medium" style={{ color: '#1B2541' }}>
                {t('donate.cover_fees')}
              </span>
              <span className="text-sm ml-1.5" style={{ color: '#9B8E7B' }}>
                (+{formatMoney(feeCents)})
              </span>
            </div>
            <HeartIcon className="size-4" style={{ color: coverFee ? accent : '#D4CFC5' }} />
          </label>
        )}

        {/* Donor information */}
        <div className="space-y-3">
          <label className="block text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: '#9B8E7B' }}>
            {isRecurring
              ? t('donate.info_label').replace(/\s*\(.*\)/, '')
              : t('donate.info_label')}
          </label>
          <input
            placeholder={t('donate.name_placeholder')}
            value={donorName}
            onChange={(e) => setDonorName(e.target.value)}
            autoComplete="name"
            autoCapitalize="words"
            className="w-full h-[52px] rounded-2xl px-4 text-sm font-medium outline-none transition-all duration-200"
            style={{
              background: '#FAFAF7',
              border: '1px solid #EDE8DF',
              color: '#1B2541',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = accent
              e.currentTarget.style.boxShadow = `0 0 0 3px ${accent}15`
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#EDE8DF'
              e.currentTarget.style.boxShadow = 'none'
            }}
          />
          <div>
            <input
              type="email"
              inputMode="email"
              placeholder={t('donate.email_placeholder')}
              value={donorEmail}
              onChange={(e) => setDonorEmail(e.target.value)}
              required={isRecurring}
              autoComplete="email"
              className="w-full h-[52px] rounded-2xl px-4 text-sm font-medium outline-none transition-all duration-200"
              style={{
                background: '#FAFAF7',
                border: '1px solid #EDE8DF',
                color: '#1B2541',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = accent
                e.currentTarget.style.boxShadow = `0 0 0 3px ${accent}15`
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#EDE8DF'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
            {isRecurring && (
              <p className="text-xs mt-1.5 px-1" style={{ color: '#9B8E7B' }}>{t('donate.email_required')}</p>
            )}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div
            className="rounded-2xl px-4 py-3 text-sm font-medium"
            style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}
          >
            {error}
          </div>
        )}

        {/* Donate CTA */}
        <button
          type="button"
          onClick={handleContinueToPayment}
          disabled={loading || !selectedFund || !amount}
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
          {loading && <Loader2Icon className="size-5 animate-spin" />}
          {loading
            ? t('donate.loading')
            : totalCents > 0
              ? t('donate.submit', { amount: formatMoney(totalCents) })
              : t('donate.submit', { amount: '€...' })}
        </button>

        {/* Trust indicator */}
        <div className="flex items-center justify-center gap-1.5 pt-1">
          <ShieldCheckIcon className="size-3.5" style={{ color: '#C4B99A' }} />
          <span className="text-[11px] font-medium" style={{ color: '#B5AC98' }}>
            Veilig betalen via Stripe
          </span>
        </div>

      </div>
    </div>
  )
}

// ─── Payment Step ─────────────────────────────────────────────────────────────

function PaymentStep({
  mosqueName,
  mosqueSlug,
  totalCents,
  frequency,
  logoUrl,
  accent,
  onBack,
}: {
  mosqueName: string
  mosqueSlug: string
  totalCents: number
  frequency: Frequency
  logoUrl: string | null
  accent: string
  onBack: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const { t, dir } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isRecurring = frequency !== 'one-time'

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
    if (stripeError) setError(stripeError.message || t('donate.error'))
    setLoading(false)
  }

  return (
    <div dir={dir} className="mx-auto max-w-lg">
      {/* Header bar */}
      <div className="flex items-center gap-3.5 px-5 py-4" style={{ borderBottom: '1px solid #EDE8DF' }}>
        <button
          type="button"
          onClick={onBack}
          className="size-11 rounded-2xl flex items-center justify-center transition-colors"
          style={{ background: '#F7F3EC', color: '#1B2541' }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#EDE8DF'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#F7F3EC'}
        >
          <ArrowLeftIcon className="size-5" />
        </button>
        <div className="flex-1">
          <p className="font-bold text-sm" style={{ color: '#1B2541' }}>
            {t('donate.payment_title', { amount: formatMoney(totalCents) })}
          </p>
          <p className="text-xs" style={{ color: '#9B8E7B' }}>{mosqueName}</p>
        </div>
      </div>

      {/* Summary + payment form */}
      <div className="px-5 pt-5 pb-6 space-y-5">
        {/* Donation summary card */}
        <div
          className="rounded-2xl p-4"
          style={{
            background: 'linear-gradient(135deg, #FDFBF7 0%, #FBF8F1 100%)',
            border: '1px solid #EDE8DF',
          }}
        >
          <div className="flex items-center gap-3.5">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={mosqueName}
                width={44}
                height={44}
                className="size-11 rounded-2xl object-cover"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
              />
            ) : (
              <div
                className="size-11 rounded-2xl flex items-center justify-center text-white text-sm font-bold"
                style={{ background: `linear-gradient(135deg, ${accent}, ${accent}CC)` }}
              >
                {mosqueName.charAt(0)}
              </div>
            )}
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ color: '#1B2541' }}>{mosqueName}</p>
              {isRecurring && (
                <p className="text-xs" style={{ color: '#9B8E7B' }}>{t(`donate.frequency.${frequency.replace('-', '_')}`)}</p>
              )}
            </div>
            <p className="text-xl font-bold" style={{ color: accent }}>
              {formatMoney(totalCents)}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <PaymentElement />

          {error && (
            <div className="space-y-3">
              <div
                className="rounded-2xl px-4 py-3 text-sm font-medium"
                style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}
              >
                {error}
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="w-full h-11 rounded-2xl text-sm font-semibold transition-all duration-200"
                style={{
                  background: 'transparent',
                  color: '#1B2541',
                  border: '1px solid #EDE8DF',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#F7F3EC'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                Opnieuw proberen
              </button>
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
                {t('donate.loading')}
              </>
            ) : (
              t('donate.pay')
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
