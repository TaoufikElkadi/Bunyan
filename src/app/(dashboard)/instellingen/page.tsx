import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function InstellingenPage() {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('users')
    .select('*, mosques(*)')
    .single()

  if (!profile) return null

  const mosque = profile.mosques as any

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Instellingen</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Moskee gegevens</CardTitle>
            <CardDescription>Algemene informatie over uw moskee</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div><span className="text-muted-foreground">Naam:</span> {mosque.name}</div>
            <div><span className="text-muted-foreground">Slug:</span> {mosque.slug}</div>
            <div><span className="text-muted-foreground">Stad:</span> {mosque.city ?? '-'}</div>
            <div><span className="text-muted-foreground">Adres:</span> {mosque.address ?? '-'}</div>
          </CardContent>
        </Card>

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
            <CardTitle>Mollie</CardTitle>
            <CardDescription>Betalingsverbinding</CardDescription>
          </CardHeader>
          <CardContent>
            {mosque.mollie_connected_at ? (
              <Badge variant="default">Verbonden</Badge>
            ) : (
              <p className="text-muted-foreground">Niet verbonden. Verbind uw Mollie account om online donaties te ontvangen.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ANBI</CardTitle>
            <CardDescription>Belastingstatus</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-muted-foreground">ANBI status:</span>{' '}
              {mosque.anbi_status ? <Badge variant="default">Actief</Badge> : <Badge variant="secondary">Niet actief</Badge>}
            </div>
            {mosque.rsin && <div><span className="text-muted-foreground">RSIN:</span> {mosque.rsin}</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
