import { getCachedProfile } from '@/lib/supabase/cached'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
          <h1 className="text-3xl font-semibold tracking-tight">Donateurs</h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Beheer uw donateurs en bekijk hun donaties
          </p>
        </div>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 px-6">
            <div className="rounded-full bg-muted/40 p-5 mb-5">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/50">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4-4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <h3 className="text-sm font-medium mb-1.5">Upgrade vereist</h3>
            <p className="text-sm text-muted-foreground/70 text-center max-w-sm leading-relaxed">
              Donateurbeheer is beschikbaar vanaf het Starter-abonnement. Upgrade om uw donateurs te beheren.
            </p>
          </CardContent>
        </Card>
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
          <h1 className="text-3xl font-semibold tracking-tight">Donateurs</h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Beheer uw donateurs en bekijk hun donaties
          </p>
        </div>
        {limits.hasCsvExport && (
          <a
            href="/api/donors/export"
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
            download
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            CSV exporteren
          </a>
        )}
      </div>

      {/* Table */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-0 pt-5 px-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">Alle donateurs</CardTitle>
            {(count ?? 0) > 0 && (
              <span className="text-xs text-muted-foreground tabular-nums">{count} resultaten</span>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0 pt-4">
          {donors && donors.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/50">
                    <TableHead className="h-10 px-6 text-sm font-medium text-muted-foreground">Naam</TableHead>
                    <TableHead className="h-10 px-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">E-mail</TableHead>
                    <TableHead className="h-10 px-4 text-sm font-medium text-muted-foreground text-right">Totaal</TableHead>
                    <TableHead className="h-10 px-4 text-sm font-medium text-muted-foreground text-right hidden sm:table-cell">Donaties</TableHead>
                    <TableHead className="h-10 px-6 text-sm font-medium text-muted-foreground hidden md:table-cell">Laatste donatie</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donors.map((donor: any) => (
                    <TableRow key={donor.id} className="hover:bg-muted/30 border-border/40">
                      <TableCell className="px-6 py-4 text-sm font-medium">
                        <Link
                          href={`/donateurs/${donor.id}`}
                          className="hover:underline text-primary underline-offset-4"
                        >
                          {donor.name ?? (
                            <span className="text-muted-foreground/70 italic">Anoniem</span>
                          )}
                        </Link>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-sm text-muted-foreground hidden sm:table-cell">
                        {donor.email ?? <span className="text-muted-foreground/40">-</span>}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-sm text-right font-semibold tabular-nums">
                        {formatMoney(donor.total_donated)}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-right text-muted-foreground hidden sm:table-cell">
                        <span className="inline-flex items-center justify-center min-w-[1.75rem] rounded-md bg-muted/50 px-1.5 py-0.5 text-xs font-medium tabular-nums">
                          {donor.donation_count}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm text-muted-foreground hidden md:table-cell">
                        {donor.last_donated_at
                          ? new Date(donor.last_donated_at).toLocaleDateString('nl-NL', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : <span className="text-muted-foreground/40">-</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-border/40">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{count}</span> donateurs
                    <span className="mx-1.5 text-border">|</span>
                    pagina <span className="font-medium text-foreground">{page}</span> van <span className="font-medium text-foreground">{totalPages}</span>
                  </p>
                  <div className="flex gap-1.5">
                    {page > 1 && (
                      <Link
                        href={`/donateurs?page=${page - 1}`}
                        className="inline-flex items-center justify-center min-h-[44px] md:min-h-0 h-9 px-3.5 text-sm font-medium rounded-lg border border-border/50 bg-background hover:bg-muted/50 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5"><polyline points="15 18 9 12 15 6"/></svg>
                        Vorige
                      </Link>
                    )}
                    {page < totalPages && (
                      <Link
                        href={`/donateurs?page=${page + 1}`}
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
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4-4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <h3 className="text-sm font-medium mb-1.5">Geen donateurs gevonden</h3>
              <p className="text-sm text-muted-foreground/70 text-center max-w-xs leading-relaxed">
                Zodra er donateurs worden geregistreerd, verschijnen ze hier.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
