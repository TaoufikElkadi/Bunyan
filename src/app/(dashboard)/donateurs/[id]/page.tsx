import { getCachedProfile } from '@/lib/supabase/cached'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatMoney } from '@/lib/money'
import { DonorEditDialog } from '@/components/donor/donor-edit-dialog'
import { ArrowLeftIcon, PencilIcon } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const revalidate = 60

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
  stripe: 'Online',
}

export default async function DonorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { mosqueId, supabase } = await getCachedProfile()

  if (!mosqueId) return null

  const { id } = await params

  const [{ data: donor }, { data: donations }] = await Promise.all([
    supabase
      .from('donors')
      .select('*')
      .eq('id', id)
      .eq('mosque_id', mosqueId)
      .single(),
    supabase
      .from('donations')
      .select('*, funds(name)')
      .eq('donor_id', id)
      .eq('mosque_id', mosqueId)
      .order('created_at', { ascending: false }),
  ])

  if (!donor) {
    notFound()
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/donateurs">
          <Button variant="outline" size="icon" className="size-9 shrink-0">
            <ArrowLeftIcon className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{donor.name ?? 'Anoniem'}</h1>
          <p className="text-muted-foreground mt-1">Donateur profiel en historie</p>
        </div>
      </div>

      {/* Donor info card */}
      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Gegevens</CardTitle>
              <DonorEditDialog
                donor={donor}
                trigger={
                  <Button variant="outline" size="sm">
                    <PencilIcon className="size-3 mr-1" />
                    Bewerken
                  </Button>
                }
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">E-mail</span>
              <span className="font-medium">{donor.email ?? '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Telefoon</span>
              <span className="font-medium">{donor.phone ?? '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Adres</span>
              <span className="font-medium">{donor.address ?? '-'}</span>
            </div>
            {donor.iban_hint && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">IBAN hint</span>
                <span className="font-medium font-mono">****{donor.iban_hint}</span>
              </div>
            )}
            {donor.tags && donor.tags.length > 0 && (
              <div className="flex justify-between items-start">
                <span className="text-muted-foreground">Tags</span>
                <div className="flex flex-wrap gap-1 justify-end">
                  {donor.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Statistieken</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Totaal gedoneerd</span>
              <span className="font-semibold text-lg">{formatMoney(donor.total_donated)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Aantal donaties</span>
              <span className="font-medium">{donor.donation_count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Eerste donatie</span>
              <span className="font-medium">
                {donor.first_donated_at
                  ? new Date(donor.first_donated_at).toLocaleDateString('nl-NL')
                  : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Laatste donatie</span>
              <span className="font-medium">
                {donor.last_donated_at
                  ? new Date(donor.last_donated_at).toLocaleDateString('nl-NL')
                  : '-'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Donation history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Donatie geschiedenis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium text-muted-foreground">Datum</th>
                  <th className="pb-3 font-medium text-muted-foreground">Fonds</th>
                  <th className="pb-3 font-medium text-muted-foreground">Methode</th>
                  <th className="pb-3 font-medium text-muted-foreground">Status</th>
                  <th className="pb-3 font-medium text-muted-foreground text-right">Bedrag</th>
                </tr>
              </thead>
              <tbody>
                {donations?.map((donation: any) => {
                  const status = STATUS_LABELS[donation.status] ?? { label: donation.status, variant: 'secondary' as const }
                  return (
                    <tr key={donation.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="py-3">
                        {new Date(donation.created_at).toLocaleDateString('nl-NL')}
                      </td>
                      <td className="py-3">{donation.funds?.name}</td>
                      <td className="py-3">{METHOD_LABELS[donation.method] ?? donation.method}</td>
                      <td className="py-3">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </td>
                      <td className="py-3 text-right font-semibold">
                        {formatMoney(donation.amount)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {(!donations || donations.length === 0) && (
            <div className="flex flex-col items-center justify-center py-16">
              <p className="text-muted-foreground">Geen donaties gevonden.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
