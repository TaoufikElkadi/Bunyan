import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { formatMoney } from '@/lib/money'

export default async function CampagnesPage() {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('users')
    .select('mosque_id')
    .single()

  if (!profile) return null

  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*, funds(name)')
    .eq('mosque_id', profile.mosque_id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Campagnes</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        {campaigns?.map((campaign: any) => (
          <Card key={campaign.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{campaign.title}</CardTitle>
                <Badge variant={campaign.is_active ? 'default' : 'secondary'}>
                  {campaign.is_active ? 'Actief' : 'Inactief'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {campaign.description && (
                <p className="text-sm text-muted-foreground">{campaign.description}</p>
              )}
              <p className="text-sm">
                Fonds: {campaign.funds?.name}
              </p>
              {campaign.goal_amount && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Doel: {formatMoney(campaign.goal_amount)}
                  </p>
                </div>
              )}
              {campaign.start_date && campaign.end_date && (
                <p className="text-xs text-muted-foreground">
                  {new Date(campaign.start_date).toLocaleDateString('nl-NL')} -{' '}
                  {new Date(campaign.end_date).toLocaleDateString('nl-NL')}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      {(!campaigns || campaigns.length === 0) && (
        <p className="text-center text-muted-foreground py-8">Nog geen campagnes.</p>
      )}
    </div>
  )
}
