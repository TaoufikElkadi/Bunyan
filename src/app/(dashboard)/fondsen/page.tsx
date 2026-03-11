import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { formatMoney } from '@/lib/money'

export default async function FondsenPage() {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('users')
    .select('mosque_id')
    .single()

  if (!profile) return null

  const { data: funds } = await supabase
    .from('funds')
    .select('*')
    .eq('mosque_id', profile.mosque_id)
    .order('sort_order', { ascending: true })

  // Get donation totals per fund
  const { data: fundTotals } = await supabase
    .from('donations')
    .select('fund_id, amount')
    .eq('mosque_id', profile.mosque_id)
    .eq('status', 'completed')

  const totals: Record<string, number> = {}
  fundTotals?.forEach((d: { fund_id: string; amount: number }) => {
    totals[d.fund_id] = (totals[d.fund_id] ?? 0) + d.amount
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Fondsen</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {funds?.map((fund: any) => {
          const total = totals[fund.id] ?? 0
          const goalAmount = fund.goal_amount
          const progress = goalAmount ? Math.min(100, Math.round((total / goalAmount) * 100)) : null

          return (
            <Card key={fund.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {fund.icon} {fund.name}
                  </CardTitle>
                  <Badge variant={fund.is_active ? 'default' : 'secondary'}>
                    {fund.is_active ? 'Actief' : 'Inactief'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {fund.description && (
                  <p className="text-sm text-muted-foreground">{fund.description}</p>
                )}
                <p className="text-xl font-bold">{formatMoney(total)}</p>
                {progress !== null && (
                  <div className="space-y-1">
                    <Progress value={progress} />
                    <p className="text-xs text-muted-foreground">
                      {progress}% van {formatMoney(goalAmount!)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
      {(!funds || funds.length === 0) && (
        <p className="text-center text-muted-foreground py-8">Nog geen fondsen aangemaakt.</p>
      )}
    </div>
  )
}
