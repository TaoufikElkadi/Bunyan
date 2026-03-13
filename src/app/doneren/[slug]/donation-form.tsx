'use client'

import { useState } from 'react'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { getStripe } from '@/lib/stripe-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { calculateCoverFee } from '@/lib/fees'
import { formatMoney } from '@/lib/money'
import { useTranslation } from '@/lib/i18n/context'

type Fund = {
  id: string
  name: string
  description: string | null
  icon: string | null
}

type Props = {
  mosqueSlug: string
  mosqueName: string
  primaryColor: string
  funds: Fund[]
  preselectedFundId?: string
}

type Frequency = 'one-time' | 'weekly' | 'monthly' | 'yearly'

const AMOUNT_PRESETS = [5, 10, 25, 50, 100]

const FREQUENCY_KEYS: { value: Frequency; key: string }[] = [
  { value: 'one-time', key: 'donate.frequency.one_time' },
  { value: 'weekly', key: 'donate.frequency.weekly' },
  { value: 'monthly', key: 'donate.frequency.monthly' },
  { value: 'yearly', key: 'donate.frequency.yearly' },
]

export function DonationForm({ mosqueSlug, mosqueName, primaryColor, funds, preselectedFundId }: Props) {
  const { t } = useTranslation()
  const [step, setStep] = useState<'details' | 'payment'>('details')
  const [selectedFund, setSelectedFund] = useState<string>(preselectedFundId || funds[0]?.id || '')
  const [amount, setAmount] = useState<string>('25')
  const [customAmount, setCustomAmount] = useState(false)
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

  async function handleContinue() {
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
      if (isRecurring) {
        // Create subscription
        const res = await fetch('/api/payments/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mosque_slug: mosqueSlug,
            fund_id: selectedFund,
            amount: numAmount,
            frequency,
            donor_name: donorName || undefined,
            donor_email: donorEmail,
          }),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || t('donate.error'))
        }

        const data = await res.json()
        setClientSecret(data.clientSecret)
        setStep('payment')
      } else {
        // One-time payment
        const res = await fetch('/api/payments/intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mosque_slug: mosqueSlug,
            fund_id: selectedFund,
            amount: numAmount,
            donor_name: donorName || undefined,
            donor_email: donorEmail || undefined,
            cover_fee: coverFee,
            fee_amount: coverFee ? feeCents : 0,
          }),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || t('donate.error'))
        }

        const data = await res.json()
        setClientSecret(data.clientSecret)
        setStep('payment')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('donate.error'))
    } finally {
      setLoading(false)
    }
  }

  if (step === 'payment' && clientSecret) {
    return (
      <Elements
        stripe={getStripe()}
        options={{
          clientSecret,
          appearance: {
            theme: 'stripe',
            variables: { colorPrimary: primaryColor },
          },
        }}
      >
        <PaymentStep
          mosqueName={mosqueName}
          mosqueSlug={mosqueSlug}
          amount={amount}
          frequency={frequency}
          primaryColor={primaryColor}
          onBack={() => {
            setStep('details')
            setClientSecret(null)
          }}
        />
      </Elements>
    )
  }

  function getButtonText() {
    if (loading) return t('donate.loading')
    if (totalCents <= 0) return t('donate.submit', { amount: '€...' })
    if (isRecurring) {
      const freqLabel = t(`donate.frequency.${frequency.replace('-', '_')}`)
      return t('donate.submit_recurring', {
        frequency: freqLabel.toLowerCase(),
        amount: formatMoney(totalCents),
      })
    }
    return t('donate.submit', { amount: formatMoney(totalCents) })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('donate.title', { mosqueName })}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Fund selection */}
        {funds.length > 1 && (
          <div className="scroll-mt-4 space-y-2">
            <Label>{t('donate.fund_label')}</Label>
            <div className="grid gap-2">
              {funds.map((fund) => (
                <button
                  key={fund.id}
                  type="button"
                  onClick={() => setSelectedFund(fund.id)}
                  className={`flex items-center gap-3 rounded-lg border p-4 md:p-3 text-start transition-colors min-h-[44px] ${
                    selectedFund === fund.id
                      ? 'border-2 bg-muted/50'
                      : 'hover:bg-muted/30'
                  }`}
                  style={
                    selectedFund === fund.id
                      ? { borderColor: primaryColor }
                      : undefined
                  }
                >
                  <span className="text-xl">{fund.icon || '📦'}</span>
                  <div>
                    <div className="font-medium">{fund.name}</div>
                    {fund.description && (
                      <div className="text-sm text-muted-foreground">
                        {fund.description}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Amount */}
        <div className="scroll-mt-4 space-y-2">
          <Label>{t('donate.amount_label')}</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {AMOUNT_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setAmount(String(preset))
                  setCustomAmount(false)
                }}
                className={`min-h-[44px] rounded-lg border px-4 py-2.5 text-base md:text-sm font-medium transition-colors ${
                  amount === String(preset) && !customAmount
                    ? 'text-white'
                    : 'hover:bg-muted/50'
                }`}
                style={
                  amount === String(preset) && !customAmount
                    ? { backgroundColor: primaryColor, borderColor: primaryColor }
                    : undefined
                }
              >
                €{preset}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setCustomAmount(true)
                setAmount('')
              }}
              className={`min-h-[44px] rounded-lg border px-4 py-2.5 text-base md:text-sm font-medium transition-colors ${
                customAmount ? 'text-white' : 'hover:bg-muted/50'
              }`}
              style={
                customAmount
                  ? { backgroundColor: primaryColor, borderColor: primaryColor }
                  : undefined
              }
            >
              {t('donate.amount_other')}
            </button>
          </div>
          {customAmount && (
            <div className="relative mt-2">
              <span className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                €
              </span>
              <Input
                type="number"
                inputMode="decimal"
                min="1"
                step="0.01"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="ps-7 text-xl md:text-base"
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Frequency selector */}
        <div className="scroll-mt-4 space-y-2">
          <Label>{t('donate.frequency.one_time')}</Label>
          <div className="grid grid-cols-2 gap-2">
            {FREQUENCY_KEYS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFrequency(opt.value)}
                className={`min-h-[44px] rounded-lg border px-4 py-2.5 text-base md:text-sm font-medium transition-colors ${
                  frequency === opt.value
                    ? 'text-white'
                    : 'hover:bg-muted/50'
                }`}
                style={
                  frequency === opt.value
                    ? { backgroundColor: primaryColor, borderColor: primaryColor }
                    : undefined
                }
              >
                {t(opt.key)}
              </button>
            ))}
          </div>
        </div>

        {/* Cover fees (one-time only) */}
        {!isRecurring && amountCents >= 100 && (
          <label className="flex items-start gap-3 cursor-pointer rounded-lg border p-4 md:p-3 min-h-[48px] md:min-h-[44px]">
            <Checkbox
              checked={coverFee}
              onCheckedChange={(checked) => setCoverFee(checked === true)}
              className="mt-0.5"
            />
            <div className="text-sm leading-normal">
              <span className="font-medium">{t('donate.cover_fees')}</span>
              <span className="block text-muted-foreground">
                {t('donate.cover_fees_desc', { fee: formatMoney(feeCents) })}
              </span>
            </div>
          </label>
        )}

        {/* Donor info */}
        <div className="scroll-mt-4 space-y-3">
          <Label className="text-muted-foreground">
            {isRecurring
              ? t('donate.info_label').replace(/\s*\(.*\)/, '')
              : t('donate.info_label')}
          </Label>
          <Input
            placeholder={t('donate.name_placeholder')}
            value={donorName}
            onChange={(e) => setDonorName(e.target.value)}
            autoComplete="name"
            autoCapitalize="words"
          />
          <div>
            <Input
              type="email"
              inputMode="email"
              placeholder={t('donate.email_placeholder')}
              value={donorEmail}
              onChange={(e) => setDonorEmail(e.target.value)}
              required={isRecurring}
              autoComplete="email"
            />
            {isRecurring && (
              <p className="mt-1 text-xs text-muted-foreground">
                {t('donate.email_required')}
              </p>
            )}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </CardContent>
      <CardFooter>
        <Button
          className="w-full min-h-[48px] text-base md:text-sm md:min-h-0"
          style={{ backgroundColor: primaryColor }}
          onClick={handleContinue}
          disabled={loading || !selectedFund || !amount}
        >
          {getButtonText()}
        </Button>
      </CardFooter>
    </Card>
  )
}

function PaymentStep({
  mosqueName,
  mosqueSlug,
  amount,
  frequency,
  primaryColor,
  onBack,
}: {
  mosqueName: string
  mosqueSlug: string
  amount: string
  frequency: Frequency
  primaryColor: string
  onBack: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const { t } = useTranslation()
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

    // Only reaches here if there's an error (otherwise redirects)
    if (stripeError) {
      setError(stripeError.message || t('donate.error'))
    }

    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isRecurring
            ? t('donate.submit_recurring', {
                frequency: t(`donate.frequency.${frequency.replace('-', '_')}`).toLowerCase(),
                amount: `€${amount}`,
              })
            : t('donate.payment_title', { amount: `€${amount}` })}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <PaymentElement />
          {error && <p className="text-sm text-red-600">{error}</p>}
        </CardContent>
        <CardFooter className="flex gap-3 md:gap-2">
          <Button type="button" variant="outline" onClick={onBack} className="min-h-[48px] md:min-h-0">
            {t('donate.back')}
          </Button>
          <Button
            type="submit"
            className="flex-1 min-h-[48px] text-base md:text-sm md:min-h-0"
            style={{ backgroundColor: primaryColor }}
            disabled={loading || !stripe}
          >
            {loading ? t('donate.loading') : t('donate.pay')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
