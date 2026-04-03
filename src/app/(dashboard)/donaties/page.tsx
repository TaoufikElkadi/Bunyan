import { getCachedProfile } from '@/lib/supabase/cached'
import { getPlanLimits } from '@/lib/plan'
import { formatMoney } from '@/lib/money'
import { ManualDonationDialog } from '@/components/donation/manual-donation-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import Link from 'next/link'
import { Download, ChevronLeft, ChevronRight, X } from 'lucide-react'

export const revalidate = 60

const PAGE_SIZE = 20

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

const STATUS_OPTIONS = [
  { value: '', label: 'Alle statussen' },
  { value: 'completed', label: 'Voltooid' },
  { value: 'pending', label: 'In afwachting' },
  { value: 'failed', label: 'Mislukt' },
  { value: 'refunded', label: 'Terugbetaald' },
]

const METHOD_OPTIONS = [
  { value: '', label: 'Alle methodes' },
  { value: 'stripe', label: 'Online' },
  { value: 'cash', label: 'Contant' },
  { value: 'bank_transfer', label: 'Overboeking' },
]

function buildFilterUrl(params: Record<string, string | undefined>): string {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value) searchParams.set(key, value)
  }
  const qs = searchParams.toString()
  return `/donaties${qs ? `?${qs}` : ''}`
}

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-[#e8f0d4] text-[#4a7c10] border-[#d4e4b8]',
  pending: 'bg-[#fef3cd] text-[#8a6d00] border-[#fde68a]',
  failed: 'bg-red-50 text-red-600 border-red-200',
  refunded: 'bg-[#f3f1ec] text-[#8a8478] border-[#e3dfd5]',
}

const selectClasses = "h-9 rounded-lg border border-[#e3dfd5] bg-white px-3 text-[13px] text-[#261b07] transition-all focus:border-[#261b07]/30 focus:outline-none focus:ring-1 focus:ring-[#261b07]/10 hover:border-[#d5cfb8]"
const inputClasses = "h-9 rounded-lg border border-[#e3dfd5] bg-white px-3 text-[13px] text-[#261b07] placeholder:text-[#b5b0a5] transition-all focus:border-[#261b07]/30 focus:outline-none focus:ring-1 focus:ring-[#261b07]/10 hover:border-[#d5cfb8]"

export default async function DonatiesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; method?: string; q?: string; fund?: string; from?: string; to?: string }>
}) {
  const { mosqueId, mosque, supabase, profile } = await getCachedProfile()

  if (!mosqueId) return null

  const canEdit = profile.role !== 'viewer'
  const limits = getPlanLimits(mosque?.plan ?? 'free')

  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1)
  const statusFilter = params.status ?? ''
  const methodFilter = params.method ?? ''
  const searchQuery = params.q ?? ''
  const fundFilter = params.fund ?? ''
  const fromDate = params.from ?? ''
  const toDate = params.to ?? ''
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  // Use !inner join on donors when searching, so we can filter on donor fields
  const donorJoin = searchQuery ? 'donors!inner(name, email)' : 'donors(name, email)'

  let donationQuery = supabase
    .from('donations')
    .select(`*, funds(name), ${donorJoin}`, { count: 'exact' })
    .eq('mosque_id', mosqueId)
    .order('created_at', { ascending: false })

  if (statusFilter) {
    donationQuery = donationQuery.eq('status', statusFilter)
  }

  if (methodFilter) {
    donationQuery = donationQuery.eq('method', methodFilter)
  }

  if (fundFilter) {
    donationQuery = donationQuery.eq('fund_id', fundFilter)
  }

  if (fromDate) {
    donationQuery = donationQuery.gte('created_at', fromDate)
  }

  if (toDate) {
    donationQuery = donationQuery.lte('created_at', toDate + 'T23:59:59')
  }

  if (searchQuery) {
    donationQuery = donationQuery.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`, { referencedTable: 'donors' })
  }

  donationQuery = donationQuery.range(from, to)

  const [{ data: donations, count }, { data: funds }] = await Promise.all([
    donationQuery,
    supabase
      .from('funds')
      .select('id, name, icon')
      .eq('mosque_id', mosqueId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
  ])

  const filteredDonations = donations ?? []
  const filteredCount = count ?? 0

  const totalPages = Math.ceil(filteredCount / PAGE_SIZE)

  const currentFilters = {
    status: statusFilter || undefined,
    method: methodFilter || undefined,
    q: searchQuery || undefined,
    fund: fundFilter || undefined,
    from: fromDate || undefined,
    to: toDate || undefined,
  }

  const hasActiveFilters = statusFilter || methodFilter || searchQuery || fundFilter || fromDate || toDate

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.5px] text-[#261b07]">Donaties</h1>
          <p className="text-[14px] text-[#8a8478] mt-1">
            Beheer en bekijk alle ontvangen donaties
          </p>
        </div>
        <div className="flex items-center gap-3">
          {limits.hasCsvExport && (
            <a
              href={`/api/donations/export?${new URLSearchParams(Object.entries(currentFilters).filter(([, v]) => v !== undefined) as [string, string][]).toString()}`}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border border-[#e3dfd5] bg-white text-[13px] font-medium text-[#261b07] hover:bg-[#f3f1ec] transition-colors"
              download
            >
              <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
              CSV exporteren
            </a>
          )}
          {canEdit && <ManualDonationDialog funds={funds ?? []} />}
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-[#e3dfd5] bg-white p-5">
        <form action="/donaties" method="GET" className="grid grid-cols-2 md:flex md:flex-wrap items-center gap-2.5">
          <select name="status" defaultValue={statusFilter} className={selectClasses}>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <select name="method" defaultValue={methodFilter} className={selectClasses}>
            {METHOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <select name="fund" defaultValue={fundFilter} className={selectClasses}>
            <option value="">Alle fondsen</option>
            {(funds ?? []).map((f: { id: string; name: string }) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>

          <input type="date" name="from" defaultValue={fromDate} className={inputClasses} placeholder="Van" />
          <input type="date" name="to" defaultValue={toDate} className={inputClasses} placeholder="Tot" />

          <input
            type="text"
            name="q"
            defaultValue={searchQuery}
            placeholder="Zoek op naam of e-mail..."
            className={`${inputClasses} col-span-2 md:w-56`}
          />

          <button
            type="submit"
            className="h-9 px-4 rounded-lg bg-[#261b07] text-[#f8f7f5] text-[13px] font-medium hover:bg-[#3a2c14] transition-colors"
          >
            Filteren
          </button>

          {hasActiveFilters && (
            <Link
              href="/donaties"
              className="h-9 px-3 rounded-lg border border-[#e3dfd5] text-[13px] font-medium flex items-center justify-center gap-1 hover:bg-[#f3f1ec] transition-colors text-[#8a8478] hover:text-[#261b07]"
            >
              <X className="h-3.5 w-3.5" />
              Wissen
            </Link>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#e3dfd5] bg-white overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <h3 className="text-[15px] font-semibold text-[#261b07]">Alle donaties</h3>
          {filteredCount > 0 && (
            <span className="text-[12px] text-[#a09888] tabular-nums">{filteredCount} resultaten</span>
          )}
        </div>

        {filteredDonations.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-[#e3dfd5]">
                  <TableHead className="h-10 px-6 text-[12px] font-medium text-[#a09888] uppercase tracking-wide">Datum</TableHead>
                  <TableHead className="h-10 px-4 text-[12px] font-medium text-[#a09888] uppercase tracking-wide">Donateur</TableHead>
                  <TableHead className="h-10 px-4 text-[12px] font-medium text-[#a09888] uppercase tracking-wide hidden sm:table-cell">Fonds</TableHead>
                  <TableHead className="h-10 px-4 text-[12px] font-medium text-[#a09888] uppercase tracking-wide hidden md:table-cell">Methode</TableHead>
                  <TableHead className="h-10 px-4 text-[12px] font-medium text-[#a09888] uppercase tracking-wide">Status</TableHead>
                  <TableHead className="h-10 px-6 text-[12px] font-medium text-[#a09888] uppercase tracking-wide text-right">Bedrag</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDonations.map((donation: Record<string, unknown>) => {
                  const status = STATUS_LABELS[donation.status as string] ?? { label: donation.status as string, variant: 'secondary' as const }
                  const donors = donation.donors as { name?: string } | null
                  const fundRecord = donation.funds as { name?: string } | null
                  const statusColor = STATUS_COLORS[donation.status as string] ?? STATUS_COLORS.pending
                  return (
                    <TableRow key={donation.id as string} className="hover:bg-[#fafaf8] border-[#e3dfd5]/60">
                      <TableCell className="px-6 py-4 text-[13px] text-[#8a8478]">
                        {new Date(donation.created_at as string).toLocaleDateString('nl-NL', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-[13px] font-medium text-[#261b07]">
                        {donors?.name ?? (
                          <span className="text-[#b5b0a5] italic">Anoniem</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-[13px] text-[#8a8478] hidden sm:table-cell">
                        {fundRecord?.name ?? <span className="text-[#d5cfb8]">-</span>}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-[13px] text-[#8a8478] hidden md:table-cell">
                        {METHOD_LABELS[donation.method as string] ?? (donation.method as string)}
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${statusColor}`}>
                          {status.label}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-[13px] text-right font-semibold tabular-nums text-[#261b07]">
                        {formatMoney(donation.amount as number)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-[#e3dfd5]">
                <p className="text-[13px] text-[#8a8478]">
                  <span className="font-medium text-[#261b07]">{filteredCount}</span> donaties
                  <span className="mx-1.5 text-[#e3dfd5]">|</span>
                  pagina <span className="font-medium text-[#261b07]">{page}</span> van <span className="font-medium text-[#261b07]">{totalPages}</span>
                </p>
                <div className="flex gap-1.5">
                  {page > 1 && (
                    <Link
                      href={buildFilterUrl({ ...currentFilters, page: String(page - 1) })}
                      className="inline-flex items-center justify-center min-h-[44px] md:min-h-0 h-9 px-3.5 text-[13px] font-medium rounded-lg border border-[#e3dfd5] bg-white hover:bg-[#f3f1ec] transition-colors text-[#261b07]"
                    >
                      <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                      Vorige
                    </Link>
                  )}
                  {page < totalPages && (
                    <Link
                      href={buildFilterUrl({ ...currentFilters, page: String(page + 1) })}
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
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#a09888]">
                <rect x="2" y="5" width="20" height="14" rx="2"/>
                <line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
            </div>
            <h3 className="text-[13px] font-medium text-[#261b07] mb-1.5">Geen donaties gevonden</h3>
            <p className="text-[13px] text-[#a09888] text-center max-w-xs leading-relaxed">
              {hasActiveFilters
                ? 'Probeer andere filters of wis de huidige filters.'
                : 'Zodra er donaties binnenkomen, verschijnen ze hier.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
