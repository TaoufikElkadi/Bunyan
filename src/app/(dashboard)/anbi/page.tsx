import { getCachedProfile } from '@/lib/supabase/cached'
import { AnbiOverview } from '@/components/anbi/anbi-overview'
import { PeriodicGifts } from '@/components/anbi/periodic-gifts'
import { getPlanLimits } from '@/lib/plan'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Lock, AlertTriangle } from 'lucide-react'

export default async function AnbiPage() {
  const { mosque } = await getCachedProfile()

  const limits = getPlanLimits(mosque?.plan ?? 'free')
  if (!limits.hasAnbi) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.5px] text-[#261b07]">ANBI Jaaroverzicht</h1>
          <p className="text-[14px] text-[#8a8478] mt-1">Genereer giftenverklaringen voor uw donateurs</p>
        </div>
        <div className="rounded-xl border border-dashed border-[#e3dfd5] bg-white">
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="rounded-full bg-[#f3f1ec] p-5 mb-5">
              <Lock className="h-7 w-7 text-[#a09888]" strokeWidth={1.5} />
            </div>
            <h3 className="text-[14px] font-medium text-[#261b07] mb-1.5">Upgrade vereist</h3>
            <p className="text-[13px] text-[#a09888] text-center max-w-sm leading-relaxed">
              ANBI-giftenverklaringen zijn beschikbaar vanaf het Starter-abonnement. Upgrade om giftenverklaringen te genereren.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const hasRsin = !!mosque?.rsin

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[28px] font-bold tracking-[-0.5px] text-[#261b07]">ANBI Jaaroverzicht</h1>
        <p className="text-[14px] text-[#8a8478] mt-1">Genereer giftenverklaringen en periodieke overeenkomsten</p>
      </div>

      {!hasRsin && (
        <div className="rounded-xl border border-dashed border-[#e3dfd5] bg-white">
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="rounded-full bg-[#fef3cd] p-5 mb-5">
              <AlertTriangle className="h-7 w-7 text-[#8a6d00]" strokeWidth={1.5} />
            </div>
            <h3 className="text-[14px] font-medium text-[#261b07] mb-1.5">RSIN niet ingesteld</h3>
            <p className="text-[13px] text-[#a09888] text-center max-w-sm leading-relaxed">
              Om ANBI-giftenverklaringen te genereren moet eerst het RSIN-nummer
              van uw organisatie worden ingesteld. Ga naar Instellingen om dit te
              configureren.
            </p>
          </div>
        </div>
      )}

      {hasRsin && (
        <Tabs defaultValue="receipts">
          <TabsList variant="line">
            <TabsTrigger value="receipts">Giftenverklaringen</TabsTrigger>
            <TabsTrigger value="periodic">Periodieke overeenkomsten</TabsTrigger>
          </TabsList>

          <TabsContent value="receipts" className="pt-6">
            <div className="rounded-xl border border-[#e3dfd5] bg-white p-6 mb-6">
              <h3 className="text-[15px] font-semibold text-[#261b07] tracking-tight">Giftenverklaringen genereren</h3>
              <p className="text-[13px] text-[#a09888] mt-1">
                Genereer ANBI-conforme giftenverklaringen voor uw donateurs per
                kalenderjaar. Contante donaties worden automatisch uitgesloten.
              </p>
            </div>
            <AnbiOverview />
          </TabsContent>

          <TabsContent value="periodic" className="pt-6">
            <PeriodicGifts />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
