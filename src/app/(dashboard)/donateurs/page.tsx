import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatMoney } from '@/lib/money'

export default async function DonateursPage() {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('users')
    .select('mosque_id')
    .single()

  if (!profile) return null

  const { data: donors } = await supabase
    .from('donors')
    .select('*')
    .eq('mosque_id', profile.mosque_id)
    .order('total_donated', { ascending: false })
    .limit(100)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Donateurs</h1>

      <Card>
        <CardHeader>
          <CardTitle>Alle donateurs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium">Naam</th>
                  <th className="pb-3 font-medium">E-mail</th>
                  <th className="pb-3 font-medium text-right">Totaal gedoneerd</th>
                  <th className="pb-3 font-medium text-right">Donaties</th>
                  <th className="pb-3 font-medium">Laatste donatie</th>
                </tr>
              </thead>
              <tbody>
                {donors?.map((donor: any) => (
                  <tr key={donor.id} className="border-b last:border-0">
                    <td className="py-3 font-medium">{donor.name ?? 'Anoniem'}</td>
                    <td className="py-3 text-muted-foreground">{donor.email ?? '-'}</td>
                    <td className="py-3 text-right font-medium">{formatMoney(donor.total_donated)}</td>
                    <td className="py-3 text-right">{donor.donation_count}</td>
                    <td className="py-3 text-muted-foreground">
                      {donor.last_donated_at
                        ? new Date(donor.last_donated_at).toLocaleDateString('nl-NL')
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(!donors || donors.length === 0) && (
            <p className="text-center text-muted-foreground py-8">Nog geen donateurs.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
