import { getCachedProfile } from '@/lib/supabase/cached'
import { getPlanLimits } from '@/lib/plan'
import { ShardGrid } from '@/components/shard/shard-grid'
import { Lock } from 'lucide-react'

export const revalidate = 60

export default async function ContributiePage() {
  const { mosqueId, mosque } = await getCachedProfile()

  if (!mosqueId) return null

  const limits = getPlanLimits(mosque?.plan ?? 'free')

  if (!limits.hasShard) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.5px] text-[#261b07]">Contributie</h1>
          <p className="text-[14px] text-[#8a8478] mt-1">Maandelijkse ledenbijdrage beheren</p>
        </div>
        <div className="rounded-xl border border-[#e3dfd5] bg-white">
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="rounded-full bg-[#f3f1ec] p-5 mb-5">
              <Lock className="h-7 w-7 text-[#a09888]" strokeWidth={1.5} />
            </div>
            <h3 className="text-[14px] font-medium text-[#261b07] mb-1.5">Upgrade vereist</h3>
            <p className="text-[13px] text-[#a09888] text-center max-w-sm leading-relaxed">
              Contributiebeheer is beschikbaar vanaf het Starter-abonnement.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const defaultAmount = mosque?.shard_default_amount ?? 2500

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-bold tracking-[-0.5px] text-[#261b07]">Contributie</h1>
        <p className="text-[14px] text-[#8a8478] mt-1">
          Beheer de maandelijkse ledenbijdrage en zie wie betaald heeft.
        </p>
      </div>
      <ShardGrid defaultAmount={defaultAmount} />
    </div>
  )
}
