'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type { Mosque, MosquePlan } from '@/types'
import { SparklesIcon, Loader2Icon, ExternalLinkIcon } from 'lucide-react'

const PLAN_INFO: Record<string, { label: string; description: string; price: string; variant: 'default' | 'secondary' | 'outline' }> = {
  free: {
    label: 'Gratis',
    description: 'Tot 100 donaties per maand, 1 fonds, basisfunctionaliteit.',
    price: '€0',
    variant: 'secondary',
  },
  starter: {
    label: 'Starter',
    description: 'Onbeperkte donaties, 5 fondsen, team toegang.',
    price: '€49',
    variant: 'default',
  },
  growth: {
    label: 'Growth',
    description: 'Alles in Starter plus campagnes, QR-codes, ANBI rapporten en prioriteitsondersteuning.',
    price: '€99',
    variant: 'default',
  },
}

interface Props {
  mosque: Mosque
}

export function PlanCard({ mosque }: Props) {
  const info = PLAN_INFO[mosque.plan] ?? PLAN_INFO.free
  const [loadingPlan, setLoadingPlan] = useState<MosquePlan | null>(null)
  const [loadingPortal, setLoadingPortal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleUpgrade(plan: MosquePlan) {
    setLoadingPlan(plan)
    setError(null)

    try {
      const res = await fetch('/api/settings/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Er ging iets mis')
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setError('Er ging iets mis bij het aanmaken van de checkout sessie')
    } finally {
      setLoadingPlan(null)
    }
  }

  async function handleManage() {
    setLoadingPortal(true)
    setError(null)

    try {
      const res = await fetch('/api/settings/billing/portal', {
        method: 'POST',
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Er ging iets mis')
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setError('Er ging iets mis bij het openen van het billing portal')
    } finally {
      setLoadingPortal(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Abonnement</CardTitle>
        <CardDescription>Uw huidige plan en limieten</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
            <SparklesIcon className="size-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">{info.label}</p>
              <Badge variant={info.variant}>
                {info.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{info.description}</p>
          </div>
        </div>

        {mosque.plan_started_at && (
          <p className="text-xs text-muted-foreground">
            Actief sinds {new Date(mosque.plan_started_at).toLocaleDateString('nl-NL')}
          </p>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {mosque.plan === 'free' && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Upgrade voor meer functionaliteit:
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border p-3 space-y-2">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-medium">Starter</p>
                  <p className="text-sm font-semibold">{PLAN_INFO.starter.price}/mo</p>
                </div>
                <p className="text-xs text-muted-foreground">{PLAN_INFO.starter.description}</p>
                <Button
                  size="sm"
                  className="w-full"
                  disabled={loadingPlan !== null}
                  onClick={() => handleUpgrade('starter')}
                >
                  {loadingPlan === 'starter' ? (
                    <Loader2Icon className="size-4 animate-spin" />
                  ) : (
                    'Upgraden'
                  )}
                </Button>
              </div>
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-medium">Growth</p>
                  <p className="text-sm font-semibold">{PLAN_INFO.growth.price}/mo</p>
                </div>
                <p className="text-xs text-muted-foreground">{PLAN_INFO.growth.description}</p>
                <Button
                  size="sm"
                  className="w-full"
                  disabled={loadingPlan !== null}
                  onClick={() => handleUpgrade('growth')}
                >
                  {loadingPlan === 'growth' ? (
                    <Loader2Icon className="size-4 animate-spin" />
                  ) : (
                    'Upgraden'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {mosque.plan === 'starter' && (
          <div className="space-y-3">
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-medium">Upgrade naar Growth</p>
                <p className="text-sm font-semibold">{PLAN_INFO.growth.price}/mo</p>
              </div>
              <p className="text-xs text-muted-foreground">{PLAN_INFO.growth.description}</p>
              <Button
                size="sm"
                disabled={loadingPlan !== null}
                onClick={() => handleUpgrade('growth')}
              >
                {loadingPlan === 'growth' ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  'Upgraden naar Growth'
                )}
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={loadingPortal}
              onClick={handleManage}
            >
              {loadingPortal ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <>
                  <ExternalLinkIcon className="size-4" />
                  Abonnement beheren
                </>
              )}
            </Button>
          </div>
        )}

        {mosque.plan === 'growth' && (
          <Button
            variant="outline"
            size="sm"
            disabled={loadingPortal}
            onClick={handleManage}
          >
            {loadingPortal ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <>
                <ExternalLinkIcon className="size-4" />
                Abonnement beheren
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
