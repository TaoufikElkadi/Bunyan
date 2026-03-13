import { getCachedProfile } from '@/lib/supabase/cached'
import { Button } from '@/components/ui/button'
import { FundDialog } from '@/components/fund/fund-dialog'
import { FundCards } from '@/components/fund/fund-cards'
import { PlusIcon } from 'lucide-react'

export const revalidate = 60

export default async function FondsenPage() {
  const { mosqueId, supabase, profile } = await getCachedProfile()

  if (!mosqueId) return null

  const canEdit = profile.role !== 'viewer'

  const [{ data: funds }, { data: fundTotals }] = await Promise.all([
    supabase
      .from('funds')
      .select('*')
      .eq('mosque_id', mosqueId)
      .order('sort_order', { ascending: true }),
    supabase.rpc('get_fund_totals', { p_mosque_id: mosqueId }),
  ])

  const totals: Record<string, number> = {}
  fundTotals?.forEach((d: { fund_id: string; total: number }) => {
    totals[d.fund_id] = d.total
  })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Fondsen</h1>
          <p className="text-muted-foreground mt-1">Beheer uw fondsen en allocaties</p>
        </div>
        {canEdit && (
          <FundDialog
            mode="create"
            trigger={
              <Button size="sm">
                <PlusIcon className="size-4 mr-1" />
                Nieuw fonds
              </Button>
            }
          />
        )}
      </div>

      {funds && funds.length > 0 ? (
        <FundCards funds={funds} totals={totals} role={profile.role} />
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <p className="text-muted-foreground">Nog geen fondsen aangemaakt.</p>
        </div>
      )}
    </div>
  )
}
