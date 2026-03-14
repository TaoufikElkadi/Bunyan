import { getCachedProfile } from '@/lib/supabase/cached'
import { buttonVariants } from '@/components/ui/button'
import { formatMoney } from '@/lib/money'
import { getPlanLimits } from '@/lib/plan'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import Link from 'next/link'
import { Download, ChevronLeft, ChevronRight, Users, Lock } from 'lucide-react'

export const revalidate = 60

const PAGE_SIZE = 20

export default async function DonateursPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { mosqueId, mosque, supabase } = await getCachedProfile()

  if (!mosqueId) return null

  const limits = getPlanLimits(mosque?.plan ?? 'free')
  if (!limits.hasDonorCRM) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.5px] text-[#261b07]">Donateurs</h1>
          <p className="text-[14px] text-[#8a8478] mt-1">
            Beheer uw donateurs en bekijk hun donaties
          </p>
        </div>
        <div className="rounded-xl border border-[#e3dfd5] bg-white">
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="rounded-full bg-[#f3f1ec] p-5 mb-5">
              <Lock className="h-7 w-7 text-[#a09888]" strokeWidth={1.5} />
            </div>
            <h3 className="text-[14px] font-medium text-[#261b07] mb-1.5">Upgrade vereist</h3>
            <p className="text-[13px] text-[#a09888] text-center max-w-sm leading-relaxed">
              Donateurbeheer is beschikbaar vanaf het Starter-abonnement. Upgrade om uw donateurs te beheren.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data: donors, count } = await supabase
    .from('donors')
    .select('*', { count: 'exact' })
    .eq('mosque_id', mosqueId)
    .order('total_donated', { ascending: false })
    .range(from, to)

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.5px] text-[#261b07]">Donateurs</h1>
          <p className="text-[14px] text-[#8a8478] mt-1">
            Beheer uw donateurs en bekijk hun donaties
          </p>
        </div>
        {limits.hasCsvExport && (
          <a
            href="/api/donors/export"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border border-[#e3dfd5] bg-white text-[13px] font-medium text-[#261b07] hover:bg-[#f3f1ec] transition-colors"
            download
          >
            <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
            CSV exporteren
          </a>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#e3dfd5] bg-white overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <h3 className="text-[15px] font-semibold text-[#261b07]">Alle donateurs</h3>
          {(count ?? 0) > 0 && (
            <span className="text-[12px] text-[#a09888] tabular-nums">{count} resultaten</span>
          )}
        </div>

        {donors && donors.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-[#e3dfd5]">
                  <TableHead className="h-10 px-6 text-[12px] font-medium text-[#a09888] uppercase tracking-wide">Naam</TableHead>
                  <TableHead className="h-10 px-4 text-[12px] font-medium text-[#a09888] uppercase tracking-wide hidden sm:table-cell">E-mail</TableHead>
                  <TableHead className="h-10 px-4 text-[12px] font-medium text-[#a09888] uppercase tracking-wide text-right">Totaal</TableHead>
                  <TableHead className="h-10 px-4 text-[12px] font-medium text-[#a09888] uppercase tracking-wide text-right hidden sm:table-cell">Donaties</TableHead>
                  <TableHead className="h-10 px-6 text-[12px] font-medium text-[#a09888] uppercase tracking-wide hidden md:table-cell">Laatste donatie</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {donors.map((donor: any) => (
                  <TableRow key={donor.id} className="hover:bg-[#fafaf8] border-[#e3dfd5]/60">
                    <TableCell className="px-6 py-4 text-[13px] font-medium">
                      <Link
                        href={`/donateurs/${donor.id}`}
                        className="text-[#261b07] hover:text-[#C87D3A] underline-offset-4 hover:underline transition-colors"
                      >
                        {donor.name ?? (
                          <span className="text-[#b5b0a5] italic">Anoniem</span>
                        )}
                      </Link>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-[13px] text-[#8a8478] hidden sm:table-cell">
                      {donor.email ?? <span className="text-[#d5cfb8]">-</span>}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-[13px] text-right font-semibold tabular-nums text-[#261b07]">
                      {formatMoney(donor.total_donated)}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-right hidden sm:table-cell">
                      <span className="inline-flex items-center justify-center min-w-[1.75rem] rounded-md bg-[#f3f1ec] px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-[#8a8478]">
                        {donor.donation_count}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-[13px] text-[#8a8478] hidden md:table-cell">
                      {donor.last_donated_at
                        ? new Date(donor.last_donated_at).toLocaleDateString('nl-NL', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : <span className="text-[#d5cfb8]">-</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-[#e3dfd5]">
                <p className="text-[13px] text-[#8a8478]">
                  <span className="font-medium text-[#261b07]">{count}</span> donateurs
                  <span className="mx-1.5 text-[#e3dfd5]">|</span>
                  pagina <span className="font-medium text-[#261b07]">{page}</span> van <span className="font-medium text-[#261b07]">{totalPages}</span>
                </p>
                <div className="flex gap-1.5">
                  {page > 1 && (
                    <Link
                      href={`/donateurs?page=${page - 1}`}
                      className="inline-flex items-center justify-center min-h-[44px] md:min-h-0 h-9 px-3.5 text-[13px] font-medium rounded-lg border border-[#e3dfd5] bg-white hover:bg-[#f3f1ec] transition-colors text-[#261b07]"
                    >
                      <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                      Vorige
                    </Link>
                  )}
                  {page < totalPages && (
                    <Link
                      href={`/donateurs?page=${page + 1}`}
                      className="inline-flex items-center justify-center min-h-[44px] md:min-h-0 h-9 px-3.5 text-[13px] font-medium rounded-lg border border-[#e3dfd5] bg-white hover:bg-[#f3f1ec] transition-colors text-[#261b07]"
                    >
                      Volgende
                      <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="rounded-full bg-[#f3f1ec] p-5 mb-5">
              <Users className="h-7 w-7 text-[#a09888]" strokeWidth={1.5} />
            </div>
            <h3 className="text-[13px] font-medium text-[#261b07] mb-1.5">Geen donateurs gevonden</h3>
            <p className="text-[13px] text-[#a09888] text-center max-w-xs leading-relaxed">
              Zodra er donateurs worden geregistreerd, verschijnen ze hier.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
