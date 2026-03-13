import { getCachedProfile } from '@/lib/supabase/cached'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatMoney } from '@/lib/money'
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

const ACTION_LABELS: Record<string, string> = {
  manual_donation: 'Handmatige donatie',
  donor_link: 'Donateur gekoppeld',
  donor_merge: 'Donateurs samengevoegd',
  donor_update: 'Donateur bijgewerkt',
  fund_create: 'Fonds aangemaakt',
  fund_update: 'Fonds bijgewerkt',
  fund_archive: 'Fonds gearchiveerd',
}

const ENTITY_LABELS: Record<string, string> = {
  donation: 'Donatie',
  donor: 'Donateur',
  fund: 'Fonds',
  campaign: 'Campagne',
}

function formatDetails(action: string, details: Record<string, unknown> | null): string {
  if (!details) return '-'

  if (action === 'manual_donation' && typeof details.amount === 'number') {
    return formatMoney(details.amount as number)
  }

  if (details.name) return String(details.name)

  return '-'
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { mosqueId, supabase, profile } = await getCachedProfile()

  if (!mosqueId) return null

  const isAdmin = profile.role === 'admin'

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Activiteitenlog</h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Bekijk alle activiteiten binnen uw organisatie
          </p>
        </div>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 px-6">
            <div className="rounded-full bg-muted/40 p-5 mb-5">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/50">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <h3 className="text-sm font-medium mb-1.5">Geen toestemming</h3>
            <p className="text-sm text-muted-foreground/70 text-center max-w-xs leading-relaxed">
              Alleen beheerders hebben toegang tot de activiteitenlog.
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

  const { data: entries, count } = await supabase
    .from('audit_log')
    .select('*, users(name, email)', { count: 'exact' })
    .eq('mosque_id', mosqueId)
    .order('created_at', { ascending: false })
    .range(from, to)

  const logs = entries ?? []
  const totalCount = count ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Activiteitenlog</h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          Bekijk alle activiteiten binnen uw organisatie
        </p>
      </div>

      {/* Table */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-0 pt-5 px-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">Alle activiteiten</CardTitle>
            {totalCount > 0 && (
              <span className="text-xs text-muted-foreground tabular-nums">{totalCount} resultaten</span>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0 pt-4">
          {logs.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/50">
                    <TableHead className="h-10 px-6 text-sm font-medium text-muted-foreground">Datum</TableHead>
                    <TableHead className="h-10 px-4 text-sm font-medium text-muted-foreground">Gebruiker</TableHead>
                    <TableHead className="h-10 px-4 text-sm font-medium text-muted-foreground">Actie</TableHead>
                    <TableHead className="h-10 px-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">Type</TableHead>
                    <TableHead className="h-10 px-6 text-sm font-medium text-muted-foreground hidden md:table-cell">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((entry: Record<string, unknown>) => {
                    const user = entry.users as { name?: string; email?: string } | null
                    const action = entry.action as string
                    const entityType = entry.entity_type as string
                    const details = entry.details as Record<string, unknown> | null
                    return (
                      <TableRow key={entry.id as string} className="hover:bg-muted/30 border-border/40">
                        <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                          {new Date(entry.created_at as string).toLocaleString('nl-NL', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </TableCell>
                        <TableCell className="px-4 py-4 text-sm font-medium">
                          {user?.name ?? user?.email ?? <span className="text-muted-foreground/70 italic">Onbekend</span>}
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <Badge variant="secondary" className="font-medium">
                            {ACTION_LABELS[action] ?? action}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-4 text-sm text-muted-foreground hidden sm:table-cell">
                          {ENTITY_LABELS[entityType] ?? entityType}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-sm text-muted-foreground/70 hidden md:table-cell">
                          {formatDetails(action, details)}
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
                    <span className="font-medium text-foreground">{totalCount}</span> activiteiten
                    <span className="mx-1.5 text-border">|</span>
                    pagina <span className="font-medium text-foreground">{page}</span> van <span className="font-medium text-foreground">{totalPages}</span>
                  </p>
                  <div className="flex gap-1.5">
                    {page > 1 && (
                      <Link
                        href={`/audit?page=${page - 1}`}
                        className="inline-flex items-center justify-center min-h-[44px] md:min-h-0 h-9 px-3.5 text-sm font-medium rounded-lg border border-border/50 bg-background hover:bg-muted/50 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5"><polyline points="15 18 9 12 15 6"/></svg>
                        Vorige
                      </Link>
                    )}
                    {page < totalPages && (
                      <Link
                        href={`/audit?page=${page + 1}`}
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
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              </div>
              <h3 className="text-sm font-medium mb-1.5">Nog geen activiteiten</h3>
              <p className="text-sm text-muted-foreground/70 text-center max-w-xs leading-relaxed">
                Zodra er activiteiten worden geregistreerd, verschijnen ze hier.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
