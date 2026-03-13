import { getCachedProfile } from '@/lib/supabase/cached'
import { getPlanLimits } from '@/lib/plan'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
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
  completed: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/20',
  pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400 dark:border-amber-500/20',
  failed: 'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400 dark:border-red-500/20',
  refunded: 'bg-stone-500/10 text-stone-500 border-stone-500/20 dark:text-stone-400 dark:border-stone-500/20',
}

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

  let donationQuery = supabase
    .from('donations')
    .select('*, funds(name), donors(name, email)', { count: 'exact' })
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
    donationQuery = donationQuery.not('donor_id', 'is', null)
  }

  donationQuery = donationQuery.range(from, to)

  const [{ data: donations, count }, { data: funds }] = await Promise.all([
    donationQuery,
    supabase
      .from('funds')
      .select('*')
      .eq('mosque_id', mosqueId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
  ])

  let filteredDonations = donations ?? []
  let filteredCount = count ?? 0

  if (searchQuery) {
    const q = searchQuery.toLowerCase()
    filteredDonations = filteredDonations.filter((d: Record<string, unknown>) => {
      const donors = d.donors as { name?: string; email?: string } | null
      const name = donors?.name?.toLowerCase() ?? ''
      const email = donors?.email?.toLowerCase() ?? ''
      return name.includes(q) || email.includes(q)
    })
    filteredCount = filteredDonations.length
  }

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
          <h1 className="text-3xl font-semibold tracking-tight">Donaties</h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Beheer en bekijk alle ontvangen donaties
          </p>
        </div>
        <div className="flex items-center gap-3">
          {limits.hasCsvExport && (
            <a
              href={`/api/donations/export?${new URLSearchParams(Object.entries(currentFilters).filter(([, v]) => v !== undefined) as [string, string][]).toString()}`}
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
              download
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              CSV exporteren
            </a>
          )}
          {canEdit && <ManualDonationDialog funds={funds ?? []} />}
        </div>
      </div>

      {/* Filters */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="pt-5 pb-5">
          <form action="/donaties" method="GET" className="grid grid-cols-2 md:flex md:flex-wrap items-center gap-2.5">
            <select
              name="status"
              defaultValue={statusFilter}
              className="h-9 rounded-lg border border-border/50 bg-background px-3 text-sm transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 hover:border-border"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <select
              name="method"
              defaultValue={methodFilter}
              className="h-9 rounded-lg border border-border/50 bg-background px-3 text-sm transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 hover:border-border"
            >
              {METHOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <select
              name="fund"
              defaultValue={fundFilter}
              className="h-9 rounded-lg border border-border/50 bg-background px-3 text-sm transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 hover:border-border"
            >
              <option value="">Alle fondsen</option>
              {(funds ?? []).map((f: { id: string; name: string }) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>

            <input
              type="date"
              name="from"
              defaultValue={fromDate}
              className="h-9 rounded-lg border border-border/50 bg-background px-3 text-sm transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 hover:border-border"
              placeholder="Van"
            />

            <input
              type="date"
              name="to"
              defaultValue={toDate}
              className="h-9 rounded-lg border border-border/50 bg-background px-3 text-sm transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 hover:border-border"
              placeholder="Tot"
            />

            <input
              type="text"
              name="q"
              defaultValue={searchQuery}
              placeholder="Zoek op naam of e-mail..."
              className="h-9 rounded-lg border border-border/50 bg-background px-3 text-sm col-span-2 md:w-56 transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 hover:border-border"
            />

            <button
              type="submit"
              className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Filteren
            </button>

            {hasActiveFilters && (
              <Link
                href="/donaties"
                className="h-9 px-3.5 rounded-lg border border-border/50 text-sm font-medium flex items-center justify-center hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
              >
                Wissen
              </Link>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-0 pt-5 px-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">Alle donaties</CardTitle>
            {filteredCount > 0 && (
              <span className="text-xs text-muted-foreground tabular-nums">{filteredCount} resultaten</span>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0 pt-4">
          {filteredDonations.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/50">
                    <TableHead className="h-10 px-6 text-sm font-medium text-muted-foreground">Datum</TableHead>
                    <TableHead className="h-10 px-4 text-sm font-medium text-muted-foreground">Donateur</TableHead>
                    <TableHead className="h-10 px-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">Fonds</TableHead>
                    <TableHead className="h-10 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Methode</TableHead>
                    <TableHead className="h-10 px-4 text-sm font-medium text-muted-foreground">Status</TableHead>
                    <TableHead className="h-10 px-6 text-sm font-medium text-muted-foreground text-right">Bedrag</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDonations.map((donation: Record<string, unknown>) => {
                    const status = STATUS_LABELS[donation.status as string] ?? { label: donation.status as string, variant: 'secondary' as const }
                    const donors = donation.donors as { name?: string } | null
                    const fundRecord = donation.funds as { name?: string } | null
                    const statusColor = STATUS_COLORS[donation.status as string] ?? STATUS_COLORS.pending
                    return (
                      <TableRow key={donation.id as string} className="hover:bg-muted/30 border-border/40">
                        <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                          {new Date(donation.created_at as string).toLocaleDateString('nl-NL', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </TableCell>
                        <TableCell className="px-4 py-4 text-sm font-medium">
                          {donors?.name ?? (
                            <span className="text-muted-foreground/70 italic">Anoniem</span>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-4 text-sm text-muted-foreground hidden sm:table-cell">
                          {fundRecord?.name ?? <span className="text-muted-foreground/40">-</span>}
                        </TableCell>
                        <TableCell className="px-4 py-4 text-sm text-muted-foreground hidden md:table-cell">
                          {METHOD_LABELS[donation.method as string] ?? (donation.method as string)}
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${statusColor}`}>
                            {status.label}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-sm text-right font-semibold tabular-nums">
                          {formatMoney(donation.amount as number)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-border/40">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{filteredCount}</span> donaties
                    <span className="mx-1.5 text-border">|</span>
                    pagina <span className="font-medium text-foreground">{page}</span> van <span className="font-medium text-foreground">{totalPages}</span>
                  </p>
                  <div className="flex gap-1.5">
                    {page > 1 && (
                      <Link
                        href={buildFilterUrl({ ...currentFilters, page: String(page - 1) })}
                        className="inline-flex items-center justify-center min-h-[44px] md:min-h-0 h-9 px-3.5 text-sm font-medium rounded-lg border border-border/50 bg-background hover:bg-muted/50 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5"><polyline points="15 18 9 12 15 6"/></svg>
                        Vorige
                      </Link>
                    )}
                    {page < totalPages && (
                      <Link
                        href={buildFilterUrl({ ...currentFilters, page: String(page + 1) })}
                        className="inline-flex items-center justify-center min-h-[44px] md:min-h-0 h-9 px-3.5 text-sm font-medium rounded-lg border border-border/50 bg-background hover:bg-muted/50 transition-colors"
                      >
                        Volgende
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1.5"><polyline points="9 18 15 12 9 6"/></svg>
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-20 px-6">
              <div className="rounded-full bg-muted/40 p-5 mb-5">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/50">
                  <rect x="2" y="5" width="20" height="14" rx="2"/>
                  <line x1="2" y1="10" x2="22" y2="10"/>
                </svg>
              </div>
              <h3 className="text-sm font-medium mb-1.5">Geen donaties gevonden</h3>
              <p className="text-sm text-muted-foreground/70 text-center max-w-xs leading-relaxed">
                {hasActiveFilters
                  ? 'Probeer andere filters of wis de huidige filters.'
                  : 'Zodra er donaties binnenkomen, verschijnen ze hier.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
