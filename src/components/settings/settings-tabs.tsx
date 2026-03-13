'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { MosqueSettingsForm } from '@/components/settings/mosque-settings-form'
import { TeamSection } from '@/components/settings/team-section'
import type { Mosque } from '@/types'

type Props = {
  mosque: Mosque & { stripe_connected_at?: string | null }
  hasStripeKey: boolean
}

export function SettingsTabs({ mosque, hasStripeKey }: Props) {
  return (
    <Tabs defaultValue={0}>
      <TabsList>
        <TabsTrigger value={0}>Algemeen</TabsTrigger>
        <TabsTrigger value={1}>Team</TabsTrigger>
        <TabsTrigger value={2}>Abonnement</TabsTrigger>
      </TabsList>

      <TabsContent value={0}>
        <MosqueSettingsForm mosque={mosque} />
      </TabsContent>

      <TabsContent value={1}>
        <TeamSection />
      </TabsContent>

      <TabsContent value={2}>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Abonnement</CardTitle>
              <CardDescription>Uw huidige plan</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge className="text-lg px-3 py-1">
                {mosque.plan?.charAt(0).toUpperCase() + mosque.plan?.slice(1)}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stripe</CardTitle>
              <CardDescription>Betalingsverbinding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {mosque.stripe_connected_at ? (
                <Badge variant="default">Verbonden</Badge>
              ) : hasStripeKey ? (
                <Badge variant="default">Test modus</Badge>
              ) : (
                <p className="text-muted-foreground">Niet verbonden. Stel Stripe in om online donaties te ontvangen.</p>
              )}
              <p className="text-sm text-muted-foreground">
                Donatiepagina: <a href={`/doneren/${mosque.slug}`} className="underline">/doneren/{mosque.slug}</a>
              </p>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  )
}
