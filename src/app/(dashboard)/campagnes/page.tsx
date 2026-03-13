import { getCachedProfile } from '@/lib/supabase/cached'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { CampaignDialog } from '@/components/campaign/campaign-dialog'
import { CampaignCards } from '@/components/campaign/campaign-cards'
import { PlusIcon } from 'lucide-react'
import { getPlanLimits } from '@/lib/plan'

export const revalidate = 60

export default async function CampagnesPage() {
  const { mosqueId, mosque, supabase, profile } = await getCachedProfile()

  if (!mosqueId) return null

  const limits = getPlanLimits(mosque?.plan ?? 'free')
  if (!limits.hasCampaigns) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Campagnes</h1>
          <p className="text-muted-foreground mt-1">Beheer uw donatiecampagnes</p>
        </div>
        <Card className="border-dashed">
          <CardHeader className="text-center py-12">
            <CardTitle className="text-lg">Upgrade vereist</CardTitle>
            <CardDescription className="max-w-sm mx-auto">
              Campagnebeheer is beschikbaar vanaf het Starter-abonnement. Upgrade om campagnes te beheren.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const canEdit = profile.role !== 'viewer'

  const [{ data: campaigns }, { data: funds }] = await Promise.all([
    supabase
      .from('campaigns')
      .select('*, funds(name)')
      .eq('mosque_id', mosqueId)
      .order('created_at', { ascending: false }),
    supabase
      .from('funds')
      .select('*')
      .eq('mosque_id', mosqueId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
  ])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Campagnes</h1>
          <p className="text-muted-foreground mt-1">Beheer uw donatiecampagnes</p>
        </div>
        {canEdit && funds && funds.length > 0 && (
          <CampaignDialog
            mode="create"
            funds={funds}
            trigger={
              <Button size="sm">
                <PlusIcon className="size-4 mr-1" />
                Nieuwe campagne
              </Button>
            }
          />
        )}
      </div>

      {campaigns && campaigns.length > 0 ? (
        <CampaignCards campaigns={campaigns} funds={funds ?? []} role={profile.role} />
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <p className="text-muted-foreground">Nog geen campagnes.</p>
        </div>
      )}
    </div>
  )
}
