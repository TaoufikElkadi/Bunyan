import { getCachedProfile } from '@/lib/supabase/cached'
import { Button } from '@/components/ui/button'
import { FundDialog } from '@/components/fund/fund-dialog'
import { FundCards } from '@/components/fund/fund-cards'
import { PlusIcon, Landmark } from 'lucide-react'

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
          <h1 className="text-[28px] font-bold tracking-[-0.5px] text-[#261b07]">Fondsen</h1>
          <p className="text-[14px] text-[#8a8478] mt-1">Beheer uw fondsen en allocaties</p>
        </div>
        {canEdit && (
          <FundDialog
            mode="create"
            trigger={
              <Button size="sm" className="bg-[#261b07] text-[#f8f7f5] hover:bg-[#3a2c14]">
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
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#e3dfd5] bg-white py-16">
          <div className="rounded-full bg-[#f3f1ec] p-5 mb-5">
            <Landmark className="h-7 w-7 text-[#a09888]" strokeWidth={1.5} />
          </div>
          <p className="text-[13px] text-[#8a8478]">Nog geen fondsen aangemaakt.</p>
        </div>
      )}
    </div>
  )
}
