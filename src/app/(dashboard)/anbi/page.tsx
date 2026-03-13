import { getCachedProfile } from '@/lib/supabase/cached'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { AnbiOverview } from '@/components/anbi/anbi-overview'
import { getPlanLimits } from '@/lib/plan'

export default async function AnbiPage() {
  const { mosque } = await getCachedProfile()

  const limits = getPlanLimits(mosque?.plan ?? 'free')
  if (!limits.hasAnbi) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">ANBI Jaaroverzicht</h1>
          <p className="text-muted-foreground mt-1">Genereer giftenverklaringen voor uw donateurs</p>
        </div>
        <Card className="border-dashed">
          <CardHeader className="text-center py-12">
            <CardTitle className="text-lg">Upgrade vereist</CardTitle>
            <CardDescription className="max-w-sm mx-auto">
              ANBI-giftenverklaringen zijn beschikbaar vanaf het Starter-abonnement. Upgrade om giftenverklaringen te genereren.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const hasRsin = !!mosque?.rsin

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">ANBI Jaaroverzicht</h1>
        <p className="text-muted-foreground mt-1">Genereer giftenverklaringen voor uw donateurs</p>
      </div>

      {!hasRsin && (
        <Card className="border-dashed">
          <CardHeader className="text-center py-12">
            <CardTitle className="text-lg">RSIN niet ingesteld</CardTitle>
            <CardDescription className="max-w-sm mx-auto">
              Om ANBI-giftenverklaringen te genereren moet eerst het RSIN-nummer
              van uw organisatie worden ingesteld. Ga naar Instellingen om dit te
              configureren.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {hasRsin && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Giftenverklaringen genereren</CardTitle>
              <CardDescription>
                Genereer ANBI-conforme giftenverklaringen voor uw donateurs per
                kalenderjaar. Contante donaties worden automatisch uitgesloten.
              </CardDescription>
            </CardHeader>
          </Card>

          <AnbiOverview />
        </>
      )}
    </div>
  )
}
