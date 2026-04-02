'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useTranslation } from '@/lib/i18n/context'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
const SignaturePad = dynamic(
  () => import('@/components/ui/signature-pad').then(m => ({ default: m.SignaturePad })),
  { ssr: false, loading: () => <Skeleton className="h-[160px] w-full rounded-2xl" /> }
)
import { PERIODIC_GIFT_ARTICLES } from '@/lib/anbi'
import { formatMoney } from '@/lib/money'
import {
  ArrowLeftIcon,
  Loader2Icon,
  HeartIcon,
  ShieldCheckIcon,
  CheckIcon,
  FileTextIcon,
  ChevronDownIcon,
  PenLineIcon,
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { getFundIcon, FUND_ICON_COLORS } from '@/components/fund/fund-cards'

type Fund = {
  id: string
  name: string
  description: string | null
  icon: string | null
  goal_amount: number | null
  raised: number
}

type Props = {
  mosqueSlug: string
  mosqueName: string
  logoUrl: string | null
  accent: string
  funds: Fund[]
  anbiEnabled?: boolean
  mosqueIban?: string | null
  mosqueRsin?: string | null
  onSwitchMode: () => void
}

type SubStep = 'details' | 'review' | 'sign' | 'confirmation'

// ─── Shared styles ──────────────────────────────────────────────────────────

const INPUT_STYLE = { background: '#FAFAF7', border: '1px solid #EDE8DF', color: '#1B2541' }
const INPUT_CLASS = 'w-full h-[52px] rounded-2xl px-4 text-sm font-medium outline-none transition-all duration-200'

function focusHandler(accent: string) {
  return (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = accent
    e.currentTarget.style.boxShadow = `0 0 0 3px ${accent}15`
  }
}

function blurHandler(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = '#EDE8DF'
  e.currentTarget.style.boxShadow = 'none'
}

// ─── Mode tabs (reused across sub-steps) ─────────────────────────────────────

function ModeTabs({
  onSwitchMode,
  t,
}: {
  onSwitchMode: () => void
  t: (key: string) => string
}) {
  return (
    <div
      className="flex rounded-2xl p-1 mb-4"
      style={{
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(228, 220, 207, 0.5)',
      }}
    >
      <button
        type="button"
        onClick={onSwitchMode}
        className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-semibold transition-all duration-200"
        style={{ color: '#9B8E7B' }}
      >
        <HeartIcon className="size-4" />
        {t('donate.tab_donate')}
      </button>
      <button
        type="button"
        className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-semibold transition-all duration-200"
        style={{ background: 'white', color: '#1B2541', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
      >
        <FileTextIcon className="size-4" />
        {t('donate.tab_periodic')}
      </button>
    </div>
  )
}

// ─── Card wrapper ────────────────────────────────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-3xl bg-white p-6 space-y-5"
      style={{
        boxShadow: '0 8px 40px rgba(27, 37, 65, 0.08), 0 1px 3px rgba(27, 37, 65, 0.06)',
        border: '1px solid rgba(228, 220, 207, 0.5)',
      }}
    >
      {children}
    </div>
  )
}

// ─── Primary button ──────────────────────────────────────────────────────────

function PrimaryButton({
  accent,
  loading,
  disabled,
  onClick,
  children,
}: {
  accent: string
  loading?: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
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
      {children}
    </button>
  )
}

// ─── Error banner ────────────────────────────────────────────────────────────

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      className="rounded-2xl px-4 py-3 text-sm font-medium"
      style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}
    >
      {message}
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export function PeriodicGiftStep({
  mosqueSlug,
  mosqueName,
  logoUrl,
  accent,
  funds,
  anbiEnabled,
  mosqueIban,
  mosqueRsin,
  onSwitchMode,
}: Props) {
  const { t, dir } = useTranslation()
  const [subStep, setSubStep] = useState<SubStep>('details')

  // Form state (persisted across sub-steps)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [annualAmount, setAnnualAmount] = useState('')
  const [selectedFund, setSelectedFund] = useState(funds[0]?.id || '')
  const [startDate, setStartDate] = useState(() => `${new Date().getFullYear()}-01-01`)
  const [endDate, setEndDate] = useState(() => `${new Date().getFullYear() + 5}-01-01`)

  // Signature state
  const [signatureBase64, setSignatureBase64] = useState<string | null>(null)
  const [consentChecked, setConsentChecked] = useState(false)

  // Submission state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const amountCents = Math.round((parseFloat(annualAmount) || 0) * 100)
  const selectedFundName = funds.find((f) => f.id === selectedFund)?.name ?? null

  function handleStartDateChange(value: string) {
    setStartDate(value)
    const start = new Date(value)
    if (!isNaN(start.getTime())) {
      const end = new Date(start)
      end.setFullYear(end.getFullYear() + 5)
      setEndDate(end.toISOString().split('T')[0])
    }
  }

  function validateDetails(): boolean {
    if (!name || !email || !address || !annualAmount) {
      setError(t('donate.periodic_fields_required'))
      return false
    }
    const numAmount = parseFloat(annualAmount)
    if (isNaN(numAmount) || numAmount < 1) {
      setError(t('donate.min_amount'))
      return false
    }
    setError(null)
    return true
  }

  function goToReview() {
    if (validateDetails()) setSubStep('review')
  }

  async function handleSign() {
    if (!signatureBase64 || !consentChecked) return
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/public/periodic-gift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mosque_slug: mosqueSlug,
          donor_name: name,
          donor_email: email,
          donor_address: address,
          annual_amount: parseFloat(annualAmount),
          fund_id: selectedFund || undefined,
          start_date: startDate,
          end_date: endDate,
          signature_base64: signatureBase64,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || t('donate.error'))
      }

      setSubStep('confirmation')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('donate.error'))
    } finally {
      setLoading(false)
    }
  }

  const handleFocus = focusHandler(accent)

  // ─── Confirmation with payment next steps ────────
  if (subStep === 'confirmation') {
    const formattedIban = mosqueIban
      ? mosqueIban.replace(/(.{4})/g, '$1 ').trim()
      : null

    // Build the link to the regular donation page with recurring pre-selected
    const donateUrl = `/doneren/${mosqueSlug}`

    return (
      <div dir={dir} className="mx-auto max-w-lg w-full px-4 pt-6 md:pt-10">
        {anbiEnabled && <ModeTabs onSwitchMode={onSwitchMode} t={t} />}
        <Card>
          <div className="text-center space-y-4">
            <div
              className="mx-auto size-16 rounded-2xl flex items-center justify-center"
              style={{ background: `${accent}15` }}
            >
              <CheckIcon className="size-8" style={{ color: accent }} strokeWidth={2.5} />
            </div>
            <h2 className="text-xl font-bold" style={{ color: '#1B2541' }}>
              {t('donate.periodic_confirmation_title')}
            </h2>
            <p className="text-sm" style={{ color: '#9B8E7B' }}>
              {t('donate.periodic_confirmation_desc')}
            </p>
          </div>

          {/* Payment next steps */}
          <div
            className="rounded-2xl p-4 space-y-3"
            style={{ background: `${accent}08`, border: `1px solid ${accent}20` }}
          >
            <p className="text-[13px] font-semibold" style={{ color: '#1B2541' }}>
              Hoe betaalt u?
            </p>
            <p className="text-[12px] leading-relaxed" style={{ color: '#6B5E4C' }}>
              Uw overeenkomst is ondertekend. Om de periodieke gift te activeren, kunt u op twee manieren betalen:
            </p>

            {/* Option 1: Bank transfer */}
            {formattedIban && (
              <div
                className="rounded-xl p-3 space-y-2"
                style={{ background: 'white', border: '1px solid #EDE8DF' }}
              >
                <div className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-full text-[11px] font-bold" style={{ background: `${accent}15`, color: accent }}>1</span>
                  <span className="text-[13px] font-semibold" style={{ color: '#1B2541' }}>Periodieke overschrijving</span>
                </div>
                <p className="text-[12px] leading-relaxed" style={{ color: '#6B5E4C' }}>
                  Stel een automatische overschrijving in bij uw bank naar:
                </p>
                <div
                  className="rounded-lg p-3 font-mono text-sm select-all"
                  style={{ background: '#FAFAF7', border: '1px solid #EDE8DF', color: '#1B2541' }}
                >
                  <div className="flex justify-between">
                    <span className="text-[11px] font-sans" style={{ color: '#9B8E7B' }}>IBAN</span>
                    <span className="font-semibold tracking-wide">{formattedIban}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[11px] font-sans" style={{ color: '#9B8E7B' }}>t.n.v.</span>
                    <span className="font-sans text-[13px]">{mosqueName}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[11px] font-sans" style={{ color: '#9B8E7B' }}>Bedrag</span>
                    <span className="font-sans text-[13px]">{formatMoney(amountCents)} / jaar</span>
                  </div>
                </div>
              </div>
            )}

            {/* Option 2: Online via Bunyan */}
            <div
              className="rounded-xl p-3 space-y-2"
              style={{ background: 'white', border: '1px solid #EDE8DF' }}
            >
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-full text-[11px] font-bold" style={{ background: `${accent}15`, color: accent }}>{formattedIban ? '2' : '1'}</span>
                <span className="text-[13px] font-semibold" style={{ color: '#1B2541' }}>Online betalen via iDEAL</span>
              </div>
              <p className="text-[12px] leading-relaxed" style={{ color: '#6B5E4C' }}>
                U kunt ook een terugkerende betaling instellen via onze donatiepagina.
              </p>
              <a
                href={donateUrl}
                className="inline-flex h-10 w-full items-center justify-center rounded-xl text-[13px] font-semibold transition-all duration-200"
                style={{ background: accent, color: '#1B2541' }}
              >
                Doneer via iDEAL
              </a>
            </div>
          </div>

          <div
            className="rounded-2xl p-3 text-center text-[11px] leading-relaxed"
            style={{ background: '#FAFAF7', border: '1px solid #EDE8DF', color: '#9B8E7B' }}
          >
            Contante giften zijn sinds 2025 niet meer fiscaal aftrekbaar. Alleen digitale betalingen komen in aanmerking voor de ANBI-aftrek.
          </div>

          <button
            type="button"
            onClick={onSwitchMode}
            className="w-full h-[52px] rounded-2xl text-sm font-semibold transition-all duration-200"
            style={{ background: '#F7F3EC', color: '#1B2541' }}
          >
            {t('donate.back')}
          </button>
        </Card>
      </div>
    )
  }

  // ─── Sign step ────────────────────────────────────
  if (subStep === 'sign') {
    return (
      <div dir={dir} className="mx-auto max-w-lg w-full px-4 pt-6 md:pt-10">
        {anbiEnabled && <ModeTabs onSwitchMode={onSwitchMode} t={t} />}
        <Card>
          {/* Back + title */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSubStep('review')}
              className="size-10 rounded-2xl flex items-center justify-center shrink-0 transition-colors"
              style={{ background: '#F7F3EC', color: '#1B2541' }}
            >
              <ArrowLeftIcon className="size-4" />
            </button>
            <h2 className="font-semibold text-base" style={{ color: '#1B2541' }}>
              {t('donate.periodic_sign_title')}
            </h2>
          </div>

          {/* Signature canvas */}
          <SignaturePad
            onSign={setSignatureBase64}
            onClear={() => setSignatureBase64(null)}
            disabled={loading}
          />

          {/* Consent checkbox */}
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              id="periodic-consent"
              checked={consentChecked}
              onCheckedChange={(v) => setConsentChecked(v === true)}
              className="mt-0.5"
            />
            <span className="text-[13px] leading-relaxed" style={{ color: '#6B5E4C' }}>
              {t('donate.periodic_consent')}
            </span>
          </label>

          {error && <ErrorBanner message={error} />}

          <PrimaryButton
            accent={accent}
            loading={loading}
            disabled={!signatureBase64 || !consentChecked}
            onClick={handleSign}
          >
            {loading ? t('donate.loading') : (
              <>
                <PenLineIcon className="size-5" />
                {t('donate.periodic_sign_submit')}
              </>
            )}
          </PrimaryButton>

          <div className="flex items-center justify-center gap-1.5 pt-1">
            <ShieldCheckIcon className="size-3.5" style={{ color: '#C4B99A' }} />
            <span className="text-[11px] font-medium" style={{ color: '#B5AC98' }}>
              ANBI-geregistreerde instelling
            </span>
          </div>
        </Card>
      </div>
    )
  }

  // ─── Review step ──────────────────────────────────
  if (subStep === 'review') {
    const formatDate = (d: string) =>
      new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })

    return (
      <div dir={dir} className="mx-auto max-w-lg w-full px-4 pt-6 md:pt-10">
        {anbiEnabled && <ModeTabs onSwitchMode={onSwitchMode} t={t} />}
        <Card>
          {/* Back + title */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSubStep('details')}
              className="size-10 rounded-2xl flex items-center justify-center shrink-0 transition-colors"
              style={{ background: '#F7F3EC', color: '#1B2541' }}
            >
              <ArrowLeftIcon className="size-4" />
            </button>
            <h2 className="font-semibold text-base" style={{ color: '#1B2541' }}>
              {t('donate.periodic_review_title')}
            </h2>
          </div>

          {/* Summary card */}
          <div
            className="rounded-2xl p-4 space-y-2.5"
            style={{ background: '#FAFAF7', border: '1px solid #EDE8DF' }}
          >
            <SummaryRow label={t('donate.name_placeholder')} value={name} />
            <SummaryRow label={t('donate.email_placeholder')} value={email} />
            <SummaryRow label={t('donate.periodic_address_placeholder').split(' (')[0]} value={address} />
            <SummaryRow label={t('donate.periodic_annual_amount')} value={formatMoney(amountCents)} />
            {selectedFundName && (
              <SummaryRow label={t('donate.fund_label')} value={selectedFundName} />
            )}
            <SummaryRow label={t('donate.periodic_period')} value={`${formatDate(startDate)} — ${formatDate(endDate)}`} />
          </div>

          {/* Expandable legal text */}
          <LegalTextAccordion
            accent={accent}
            amount={formatMoney(amountCents)}
            fundName={selectedFundName}
            startDate={formatDate(startDate)}
            endDate={formatDate(endDate)}
            rsin={mosqueRsin ?? ''}
            label={t('donate.periodic_review_legal')}
          />

          <PrimaryButton accent={accent} onClick={() => setSubStep('sign')}>
            {t('donate.periodic_next_to_sign')}
          </PrimaryButton>
        </Card>
      </div>
    )
  }

  // ─── Details step (default) ───────────────────────
  return (
    <div dir={dir} className="mx-auto max-w-lg w-full px-4 pt-6 md:pt-10">
      {anbiEnabled && <ModeTabs onSwitchMode={onSwitchMode} t={t} />}
      <Card>
        {/* Header */}
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
            <h2 className="font-semibold text-lg tracking-tight truncate" style={{ color: '#1B2541' }}>
              {t('donate.periodic_title')}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: '#9B8E7B' }}>{mosqueName}</p>
          </div>
        </div>

        {/* Info banner */}
        <div
          className="rounded-2xl p-4 text-xs leading-relaxed"
          style={{ background: `${accent}08`, border: `1px solid ${accent}20`, color: '#6B5E4C' }}
        >
          {t('donate.periodic_info')}
        </div>

        {/* Personal details */}
        <div className="space-y-3">
          <label className="block text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: '#9B8E7B' }}>
            {t('donate.periodic_personal')}
          </label>
          <input
            placeholder={t('donate.name_placeholder') + ' *'}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            className={INPUT_CLASS}
            style={INPUT_STYLE}
            onFocus={handleFocus}
            onBlur={blurHandler}
          />
          <input
            type="email"
            placeholder={t('donate.email_placeholder') + ' *'}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className={INPUT_CLASS}
            style={INPUT_STYLE}
            onFocus={handleFocus}
            onBlur={blurHandler}
          />
          <input
            placeholder={t('donate.periodic_address_placeholder') + ' *'}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            autoComplete="street-address"
            className={INPUT_CLASS}
            style={INPUT_STYLE}
            onFocus={handleFocus}
            onBlur={blurHandler}
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-[0.12em] mb-2.5" style={{ color: '#9B8E7B' }}>
            {t('donate.periodic_annual_amount')}
          </label>
          <div
            className="flex items-center rounded-2xl h-[56px] px-4 transition-all duration-200"
            style={{ background: '#FAFAF7', border: '1px solid #EDE8DF' }}
          >
            <span className="text-lg font-bold select-none" style={{ color: '#9B8E7B' }}>€</span>
            <input
              type="number"
              inputMode="decimal"
              min="1"
              step="0.01"
              value={annualAmount}
              onChange={(e) => setAnnualAmount(e.target.value)}
              placeholder="0"
              className="flex-1 bg-transparent text-2xl font-bold outline-none ml-2 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              style={{ color: '#1B2541' }}
              onFocus={(e) => {
                const w = e.currentTarget.parentElement!
                w.style.borderColor = accent
                w.style.boxShadow = `0 0 0 3px ${accent}15`
              }}
              onBlur={(e) => {
                const w = e.currentTarget.parentElement!
                w.style.borderColor = '#EDE8DF'
                w.style.boxShadow = 'none'
              }}
            />
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
                return (
                  <button
                    key={fund.id}
                    type="button"
                    onClick={() => setSelectedFund(fund.id)}
                    className="w-full flex items-center gap-3 rounded-2xl p-3 text-start transition-all duration-200"
                    style={active ? {
                      background: '#1B2541', color: 'white',
                      boxShadow: '0 4px 16px rgba(27, 37, 65, 0.2)',
                    } : {
                      background: '#FAFAF7', color: '#1B2541', border: '1px solid #EDE8DF',
                    }}
                  >
                    <div
                      className="flex size-8 items-center justify-center rounded-xl shrink-0"
                      style={{ background: active ? 'rgba(255,255,255,0.12)' : `${colorSet.hex}15` }}
                    >
                      <Icon className="size-4" strokeWidth={1.5} style={{ color: active ? 'white' : colorSet.hex }} />
                    </div>
                    <span className="font-semibold text-sm">{fund.name}</span>
                    <div
                      className="ml-auto size-5 rounded-full border-2 flex items-center justify-center shrink-0"
                      style={active ? { borderColor: accent, background: accent } : { borderColor: '#D4CFC5' }}
                    >
                      {active && <CheckIcon className="size-3 text-white" strokeWidth={3} />}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Dates */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-[0.12em] mb-2.5" style={{ color: '#9B8E7B' }}>
            {t('donate.periodic_period')}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className={INPUT_CLASS}
              style={INPUT_STYLE}
              onFocus={handleFocus}
              onBlur={blurHandler}
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={INPUT_CLASS}
              style={INPUT_STYLE}
              onFocus={handleFocus}
              onBlur={blurHandler}
            />
          </div>
          <p className="text-[11px] mt-2 px-1" style={{ color: '#9B8E7B' }}>
            {t('donate.periodic_min_years')}
          </p>
        </div>

        {error && <ErrorBanner message={error} />}

        <PrimaryButton accent={accent} onClick={goToReview}>
          {t('donate.periodic_next')}
        </PrimaryButton>

        <div className="flex items-center justify-center gap-1.5 pt-1">
          <ShieldCheckIcon className="size-3.5" style={{ color: '#C4B99A' }} />
          <span className="text-[11px] font-medium" style={{ color: '#B5AC98' }}>
            ANBI-geregistreerde instelling
          </span>
        </div>
      </Card>
    </div>
  )
}

// ─── Helper components ───────────────────────────────────────────────────────

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span style={{ color: '#9B8E7B' }}>{label}</span>
      <span className="font-medium text-end" style={{ color: '#1B2541' }}>{value}</span>
    </div>
  )
}

function LegalTextAccordion({
  accent,
  amount,
  fundName,
  startDate,
  endDate,
  rsin,
  label,
}: {
  accent: string
  amount: string
  fundName: string | null
  startDate: string
  endDate: string
  rsin: string
  label: string
}) {
  const [open, setOpen] = useState(false)

  const fundClause = fundName ? `, ten behoeve van het fonds "${fundName}"` : ''

  const replacements: Record<string, string> = {
    '{amount}': amount,
    '{fundClause}': fundClause,
    '{startDate}': startDate,
    '{endDate}': endDate,
    '{rsin}': rsin,
  }

  function interpolate(text: string) {
    return Object.entries(replacements).reduce((t, [key, val]) => t.replace(key, val), text)
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #EDE8DF' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors"
        style={{ color: '#6B5E4C', background: open ? '#FAFAF7' : 'transparent' }}
      >
        {label}
        <ChevronDownIcon
          className="size-4 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)' }}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3">
          {PERIODIC_GIFT_ARTICLES.map((article) => (
            <div key={article.title}>
              <p className="text-[12px] font-semibold mb-1" style={{ color: '#1B2541' }}>
                {article.title}
              </p>
              <p className="text-[11px] leading-relaxed whitespace-pre-line" style={{ color: '#6B5E4C' }}>
                {interpolate(article.text)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
