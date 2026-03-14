import { getCachedProfile } from '@/lib/supabase/cached'
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

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-[#e8f0d4] text-[#4a7c10] border-[#d4e4b8]',
  pending: 'bg-[#fef3cd] text-[#8a6d00] border-[#fde68a]',
  failed: 'bg-red-50 text-red-600 border-red-200',
  refunded: 'bg-[#f3f1ec] text-[#8a8478] border-[#e3dfd5]',
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
          <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#e3dfd5] bg-white text-[#8a8478] hover:bg-[#f3f1ec] hover:text-[#261b07] transition-colors">
            <ArrowLeftIcon className="size-4" />
          </button>
        </Link>
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.5px] text-[#261b07]">{donor.name ?? 'Anoniem'}</h1>
          <p className="text-[14px] text-[#8a8478] mt-0.5">Donateur profiel en historie</p>
        </div>
      </div>

      {/* Donor info cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[#e3dfd5] bg-white p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[15px] font-semibold text-[#261b07]">Gegevens</h3>
            <DonorEditDialog
              donor={donor}
              trigger={
                <button className="inline-flex items-center gap-1 h-8 px-3 rounded-lg border border-[#e3dfd5] bg-white text-[12px] font-medium text-[#8a8478] hover:bg-[#f3f1ec] hover:text-[#261b07] transition-colors">
                  <PencilIcon className="size-3" />
                  Bewerken
                </button>
              }
            />
          </div>
          <div className="space-y-3.5 text-[13px]">
            <div className="flex justify-between">
              <span className="text-[#a09888]">E-mail</span>
              <span className="font-medium text-[#261b07]">{donor.email ?? '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#a09888]">Telefoon</span>
              <span className="font-medium text-[#261b07]">{donor.phone ?? '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#a09888]">Adres</span>
              <span className="font-medium text-[#261b07]">{donor.address ?? '-'}</span>
            </div>
            {donor.iban_hint && (
              <div className="flex justify-between">
                <span className="text-[#a09888]">IBAN hint</span>
                <span className="font-medium font-mono text-[#261b07]">****{donor.iban_hint}</span>
              </div>
            )}
            {donor.tags && donor.tags.length > 0 && (
              <div className="flex justify-between items-start">
                <span className="text-[#a09888]">Tags</span>
                <div className="flex flex-wrap gap-1 justify-end">
                  {donor.tags.map((tag: string) => (
                    <span key={tag} className="inline-flex items-center rounded-md bg-[#f3f1ec] px-2 py-0.5 text-[11px] font-medium text-[#261b07]">{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-[#e3dfd5] bg-white p-6">
          <h3 className="text-[15px] font-semibold text-[#261b07] mb-5">Statistieken</h3>
          <div className="space-y-3.5 text-[13px]">
            <div className="flex justify-between items-center">
              <span className="text-[#a09888]">Totaal gedoneerd</span>
              <span className="font-bold text-[20px] text-[#261b07]">{formatMoney(donor.total_donated)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#a09888]">Aantal donaties</span>
              <span className="font-medium text-[#261b07]">{donor.donation_count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#a09888]">Eerste donatie</span>
              <span className="font-medium text-[#261b07]">
                {donor.first_donated_at
                  ? new Date(donor.first_donated_at).toLocaleDateString('nl-NL')
                  : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#a09888]">Laatste donatie</span>
              <span className="font-medium text-[#261b07]">
                {donor.last_donated_at
                  ? new Date(donor.last_donated_at).toLocaleDateString('nl-NL')
                  : '-'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Donation history */}
      <div className="rounded-xl border border-[#e3dfd5] bg-white overflow-hidden">
        <div className="px-6 pt-6 pb-4">
          <h3 className="text-[15px] font-semibold text-[#261b07]">Donatie geschiedenis</h3>
        </div>
        <div className="px-6 pb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[#e3dfd5] text-left">
                  <th className="pb-3 font-medium text-[12px] text-[#a09888] uppercase tracking-wide">Datum</th>
                  <th className="pb-3 font-medium text-[12px] text-[#a09888] uppercase tracking-wide">Fonds</th>
                  <th className="pb-3 font-medium text-[12px] text-[#a09888] uppercase tracking-wide">Methode</th>
                  <th className="pb-3 font-medium text-[12px] text-[#a09888] uppercase tracking-wide">Status</th>
                  <th className="pb-3 font-medium text-[12px] text-[#a09888] uppercase tracking-wide text-right">Bedrag</th>
                </tr>
              </thead>
              <tbody>
                {donations?.map((donation: any) => {
                  const status = STATUS_LABELS[donation.status] ?? { label: donation.status, variant: 'secondary' as const }
                  const statusColor = STATUS_COLORS[donation.status] ?? STATUS_COLORS.pending
                  return (
                    <tr key={donation.id} className="border-b border-[#e3dfd5]/60 last:border-0 hover:bg-[#fafaf8] transition-colors">
                      <td className="py-3 text-[#8a8478]">
                        {new Date(donation.created_at).toLocaleDateString('nl-NL')}
                      </td>
                      <td className="py-3 text-[#8a8478]">{donation.funds?.name}</td>
                      <td className="py-3 text-[#8a8478]">{METHOD_LABELS[donation.method] ?? donation.method}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${statusColor}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="py-3 text-right font-semibold text-[#261b07]">
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
              <p className="text-[13px] text-[#a09888]">Geen donaties gevonden.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
