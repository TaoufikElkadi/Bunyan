import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatMoney } from '@/lib/money'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('users')
    .select('mosque_id')
    .single()

  if (!profile) return null

  const mosqueId = profile.mosque_id
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  // KPI: Total this month
  const { data: monthlyDonations } = await supabase
    .from('donations')
    .select('amount')
    .eq('mosque_id', mosqueId)
    .eq('status', 'completed')
    .gte('created_at', startOfMonth)

  const totalThisMonth = monthlyDonations?.reduce((sum, d) => sum + d.amount, 0) ?? 0

  // KPI: Recurring MRR
  const { data: recurrings } = await supabase
    .from('recurrings')
    .select('amount, frequency')
    .eq('mosque_id', mosqueId)
    .eq('status', 'active')

  const recurringMRR = recurrings?.reduce((sum, r) => {
    if (r.frequency === 'weekly') return sum + r.amount * 4
    if (r.frequency === 'monthly') return sum + r.amount
    if (r.frequency === 'yearly') return sum + Math.round(r.amount / 12)
    return sum
  }, 0) ?? 0

  // KPI: Average gift
  const avgGift = monthlyDonations && monthlyDonations.length > 0
    ? Math.round(totalThisMonth / monthlyDonations.length)
    : 0

  // KPI: New donors
  const { count: newDonors } = await supabase
    .from('donors')
    .select('*', { count: 'exact', head: true })
    .eq('mosque_id', mosqueId)
    .gte('first_donated_at', startOfMonth)

  // Recent donations
  const { data: recentDonations } = await supabase
    .from('donations')
    .select('*, funds(name), donors(name)')
    .eq('mosque_id', mosqueId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(10)

  const kpis = [
    { title: 'Deze maand', value: formatMoney(totalThisMonth) },
    { title: 'Maandelijks terugkerend', value: formatMoney(recurringMRR) },
    { title: 'Gemiddelde gift', value: formatMoney(avgGift) },
    { title: 'Nieuwe donateurs', value: String(newDonors ?? 0) },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recente donaties</CardTitle>
        </CardHeader>
        <CardContent>
          {recentDonations && recentDonations.length > 0 ? (
            <div className="space-y-3">
              {recentDonations.map((donation: any) => (
                <div key={donation.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div>
                    <p className="font-medium">
                      {donation.donors?.name ?? 'Anoniem'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {donation.funds?.name} &middot; {donation.method}
                    </p>
                  </div>
                  <p className="font-semibold">{formatMoney(donation.amount)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Nog geen donaties ontvangen.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
