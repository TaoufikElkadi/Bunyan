import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatMoney } from '@/lib/money'

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  completed: { label: 'Voltooid', variant: 'default' },
  pending: { label: 'In afwachting', variant: 'secondary' },
  failed: { label: 'Mislukt', variant: 'destructive' },
  refunded: { label: 'Terugbetaald', variant: 'outline' },
}

const METHOD_LABELS: Record<string, string> = {
  ideal: 'iDEAL',
  card: 'Kaart',
  sepa: 'SEPA',
  cash: 'Contant',
  bank_transfer: 'Overboeking',
}

export default async function DonatiesPage() {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('users')
    .select('mosque_id')
    .single()

  if (!profile) return null

  const { data: donations } = await supabase
    .from('donations')
    .select('*, funds(name), donors(name, email)')
    .eq('mosque_id', profile.mosque_id)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Donaties</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alle donaties</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium">Datum</th>
                  <th className="pb-3 font-medium">Donateur</th>
                  <th className="pb-3 font-medium">Fonds</th>
                  <th className="pb-3 font-medium">Methode</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Bedrag</th>
                </tr>
              </thead>
              <tbody>
                {donations?.map((donation: any) => {
                  const status = STATUS_LABELS[donation.status] ?? { label: donation.status, variant: 'secondary' as const }
                  return (
                    <tr key={donation.id} className="border-b last:border-0">
                      <td className="py-3">
                        {new Date(donation.created_at).toLocaleDateString('nl-NL')}
                      </td>
                      <td className="py-3">
                        {donation.donors?.name ?? 'Anoniem'}
                      </td>
                      <td className="py-3">
                        {donation.funds?.name}
                      </td>
                      <td className="py-3">
                        {METHOD_LABELS[donation.method] ?? donation.method}
                      </td>
                      <td className="py-3">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </td>
                      <td className="py-3 text-right font-medium">
                        {formatMoney(donation.amount)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {(!donations || donations.length === 0) && (
            <p className="text-center text-muted-foreground py-8">Nog geen donaties.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
