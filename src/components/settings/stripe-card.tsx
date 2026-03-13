'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { CreditCardIcon, CheckCircleIcon, AlertCircleIcon } from 'lucide-react'
import type { Mosque } from '@/types'

interface Props {
  mosque: Mosque & { stripe_account_id?: string | null; stripe_connected_at?: string | null }
  hasStripeKey: boolean
}

export function StripeCard({ mosque, hasStripeKey }: Props) {
  const isConnected = !!mosque.stripe_connected_at
  const isTestMode = !isConnected && hasStripeKey

  return (
    <Card>
      <CardHeader>
        <CardTitle>Betalingen</CardTitle>
        <CardDescription>Stripe betalingsverbinding</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
            <CreditCardIcon className="size-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Stripe</p>
            <p className="text-xs text-muted-foreground">
              {isConnected
                ? `Verbonden op ${new Date(mosque.stripe_connected_at!).toLocaleDateString('nl-NL')}`
                : isTestMode
                  ? 'Platform test modus actief'
                  : 'Niet geconfigureerd'}
            </p>
          </div>
          {isConnected ? (
            <Badge variant="default" className="gap-1">
              <CheckCircleIcon className="size-3" />
              Verbonden
            </Badge>
          ) : isTestMode ? (
            <Badge variant="secondary" className="gap-1">
              <AlertCircleIcon className="size-3" />
              Test modus
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1">
              <AlertCircleIcon className="size-3" />
              Niet actief
            </Badge>
          )}
        </div>

        <div className="rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
          {isConnected ? (
            <p>
              Stripe is verbonden. Donaties via iDEAL, creditcard en SEPA zijn actief.
            </p>
          ) : isTestMode ? (
            <p>
              Stripe is geconfigureerd in testmodus. U kunt testdonaties ontvangen via de
              donatiepagina. Schakel over naar productie wanneer u klaar bent om live te gaan.
            </p>
          ) : (
            <p>
              Stripe is nog niet geconfigureerd. Neem contact op met de platformbeheerder
              om betalingen in te schakelen.
            </p>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Donatiepagina:{' '}
          <a href={`/doneren/${mosque.slug}`} className="underline hover:text-foreground">
            /doneren/{mosque.slug}
          </a>
        </p>
      </CardContent>
    </Card>
  )
}
