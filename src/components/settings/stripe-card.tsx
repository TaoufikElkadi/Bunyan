'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  AlertTriangle,
  ArrowRight,
  BanknoteIcon,
  ShieldCheck,
} from 'lucide-react'
import type { Mosque } from '@/types'

interface ConnectStatus {
  status: 'not_connected' | 'onboarding_incomplete' | 'connected' | 'already_connected'
  accountId?: string
  connectedAt?: string
  chargesEnabled: boolean
  payoutsEnabled: boolean
  detailsSubmitted: boolean
  requirements?: {
    currently_due?: string[]
    eventually_due?: string[]
    past_due?: string[]
  }
}

interface Props {
  mosque: Mosque
  hasStripeKey: boolean
  isAdmin?: boolean
}

export function StripeCard({ mosque, hasStripeKey, isAdmin = true }: Props) {
  const searchParams = useSearchParams()
  const [connectStatus, setConnectStatus] = useState<ConnectStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/settings/stripe/connect')
      if (res.ok) {
        setConnectStatus(await res.json())
      }
    } catch {
      // Silently fail — UI shows fallback
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  // Re-fetch when returning from Stripe onboarding
  useEffect(() => {
    if (searchParams.get('stripe') === 'complete') {
      setLoading(true)
      fetchStatus()
    }
  }, [searchParams, fetchStatus])

  async function handleConnect() {
    setConnecting(true)
    try {
      const res = await fetch('/api/settings/stripe/connect', { method: 'POST' })
      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
      } else if (data.status === 'already_connected') {
        fetchStatus()
      } else {
        alert(data.error || 'Verbinding mislukt')
      }
    } catch {
      alert('Er is iets misgegaan')
    } finally {
      setConnecting(false)
    }
  }

  const isConnected = connectStatus?.status === 'connected' || connectStatus?.status === 'already_connected'
  const isIncomplete = connectStatus?.status === 'onboarding_incomplete'
  const hasPendingRequirements = (connectStatus?.requirements?.currently_due?.length ?? 0) > 0

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-[#a09888]" />
        </CardContent>
      </Card>
    )
  }

  // Connected state
  if (isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Betalingen</CardTitle>
          <CardDescription>Stripe is verbonden met uw moskee</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Status banner */}
          <div className="flex items-start gap-3 rounded-xl border border-[#d4e4b8] bg-[#f4f9ec] p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#4a7c10]" />
            <div>
              <p className="text-[14px] font-medium text-[#2e5a0a]">Stripe verbonden</p>
              <p className="text-[13px] text-[#5a8a2a] mt-0.5">
                Donaties via iDEAL, creditcard en SEPA worden rechtstreeks naar uw rekening overgemaakt.
              </p>
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-[#e3dfd5] p-3">
              <div className="flex items-center gap-2 mb-1">
                <BanknoteIcon className="h-3.5 w-3.5 text-[#8a8478]" />
                <span className="text-[11px] font-medium text-[#a09888] uppercase tracking-wide">Betalingen</span>
              </div>
              <p className="text-[14px] font-semibold text-[#261b07]">
                {connectStatus?.chargesEnabled ? 'Actief' : 'Inactief'}
              </p>
            </div>
            <div className="rounded-lg border border-[#e3dfd5] p-3">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="h-3.5 w-3.5 text-[#8a8478]" />
                <span className="text-[11px] font-medium text-[#a09888] uppercase tracking-wide">Uitbetalingen</span>
              </div>
              <p className="text-[14px] font-semibold text-[#261b07]">
                {connectStatus?.payoutsEnabled ? 'Actief' : 'Inactief'}
              </p>
            </div>
          </div>

          {/* Pending requirements warning */}
          {hasPendingRequirements && (
            <div className="flex items-start gap-3 rounded-xl border border-[#f9a600]/30 bg-[#f9a600]/5 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#f9a600]" />
              <div>
                <p className="text-[14px] font-medium text-[#8a6d00]">Actie vereist</p>
                <p className="text-[13px] text-[#a08800] mt-0.5">
                  Stripe heeft aanvullende informatie nodig om betalingen te blijven verwerken.
                </p>
                {isAdmin && (
                  <button
                    onClick={handleConnect}
                    disabled={connecting}
                    className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#8a6d00] hover:text-[#6d5500] transition-colors"
                  >
                    {connecting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ExternalLink className="h-3.5 w-3.5" />
                    )}
                    Informatie aanvullen
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Connected at */}
          {connectStatus?.connectedAt && (
            <p className="text-[12px] text-[#b5b0a5]">
              Verbonden op {new Date(connectStatus.connectedAt).toLocaleDateString('nl-NL', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          )}

          {/* Donation page link */}
          <p className="text-[12px] text-[#a09888]">
            Donatiepagina:{' '}
            <a href={`/doneren/${mosque.slug}`} className="underline hover:text-[#261b07] transition-colors">
              /doneren/{mosque.slug}
            </a>
          </p>
        </CardContent>
      </Card>
    )
  }

  // Not connected / onboarding incomplete state
  return (
    <Card>
      <CardHeader>
        <CardTitle>Betalingen</CardTitle>
        <CardDescription>Verbind Stripe om donaties te ontvangen</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Explainer */}
        <div className="rounded-xl border border-[#e3dfd5] bg-[#fafaf8] p-5">
          <h3 className="text-[15px] font-semibold text-[#261b07] mb-2">
            Ontvang donaties rechtstreeks op uw rekening
          </h3>
          <p className="text-[13px] text-[#8a8478] leading-relaxed mb-4">
            Verbind uw bankrekening via Stripe om iDEAL, creditcard en SEPA-betalingen te ontvangen.
            Het instellen duurt slechts enkele minuten.
          </p>

          <div className="space-y-2.5 mb-5">
            {[
              'iDEAL, creditcard en SEPA-incasso',
              'Automatische uitbetalingen naar uw rekening',
              'Geen technische kennis vereist',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#4a7c10]" />
                <span className="text-[13px] text-[#261b07]">{feature}</span>
              </div>
            ))}
          </div>

          {isAdmin ? (
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-[#261b07] text-[14px] font-medium text-[#f8f7f5] hover:bg-[#3a2c14] transition-colors disabled:opacity-50"
            >
              {connecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              {isIncomplete ? 'Onboarding voltooien' : 'Stripe verbinden'}
            </button>
          ) : (
            <p className="text-[13px] text-[#a09888]">
              Vraag een beheerder om Stripe te verbinden.
            </p>
          )}
        </div>

        {/* Incomplete onboarding warning */}
        {isIncomplete && (
          <div className="flex items-start gap-3 rounded-xl border border-[#f9a600]/30 bg-[#f9a600]/5 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#f9a600]" />
            <div>
              <p className="text-[14px] font-medium text-[#8a6d00]">Onboarding niet voltooid</p>
              <p className="text-[13px] text-[#a08800] mt-0.5">
                U bent begonnen met het verbinden van Stripe, maar het proces is nog niet afgerond.
                Klik op de knop hierboven om verder te gaan.
              </p>
            </div>
          </div>
        )}

        {!hasStripeKey && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <div>
              <p className="text-[14px] font-medium text-red-700">Stripe niet geconfigureerd</p>
              <p className="text-[13px] text-red-600 mt-0.5">
                De platform Stripe-sleutels zijn nog niet ingesteld. Neem contact op met de platformbeheerder.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
