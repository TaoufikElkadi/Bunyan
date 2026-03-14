import { Suspense } from 'react'
import { getCachedProfile } from '@/lib/supabase/cached'
import { Skeleton } from '@/components/ui/skeleton'
import { formatMoney } from '@/lib/money'
import { MonthlyChart } from '@/components/dashboard/monthly-chart'
import { FundChart } from '@/components/dashboard/fund-chart'
import { UpgradeBanner } from '@/components/dashboard/upgrade-banner'
import { getPlanLimits } from '@/lib/plan'
import { TrendingUp, Repeat, Gift, UserPlus, ArrowUpRight, ArrowDownRight, Inbox, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export const revalidate = 60

type DashboardMetrics = {
  total_this_month: number
  monthly_count: number
  recurring_mrr: number
  new_donors: number
  recent_donations: {
    id: string
    amount: number
    method: string
    created_at: string
    fund_name: string | null
    donor_name: string | null
  }[]
}

type MonthlyTotal = { month: string; total: number }
type FundBreakdown = { name: string; total: number }

function KPISkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-[#e3dfd5] bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
          <Skeleton className="h-9 w-24 rounded-md" />
          <div className="mt-3 flex items-center gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-[#e3dfd5] bg-white p-6">
          <Skeleton className="h-5 w-44 rounded-md mb-1" />
          <Skeleton className="h-4 w-64 rounded-md mb-6" />
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </div>
      ))}
    </div>
  )
}

function RecentSkeleton() {
  return (
    <div className="rounded-xl border border-[#e3dfd5] bg-white p-6">
      <Skeleton className="h-5 w-40 rounded-md mb-1" />
      <Skeleton className="h-4 w-52 rounded-md mb-6" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-4">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-3 w-40 rounded-md" />
          </div>
          <Skeleton className="h-5 w-20 rounded-md" />
        </div>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[28px] font-bold tracking-[-0.5px] text-[#261b07]">Dashboard</h1>
        <p className="mt-1 text-[14px] text-[#8a8478]">
          Overzicht van uw donaties en activiteiten
        </p>
      </div>
      <Suspense fallback={<div className="space-y-8"><KPISkeleton /><ChartSkeleton /><RecentSkeleton /></div>}>
        <DashboardContent />
      </Suspense>
    </div>
  )
}

const KPI_CONFIG = [
  {
    title: 'Deze maand',
    icon: TrendingUp,
    trend: '+12.5%',
    trendUp: true,
    subtitle: 'totaal ontvangen',
  },
  {
    title: 'Maandelijks terugkerend',
    icon: Repeat,
    trend: '+4.2%',
    trendUp: true,
    subtitle: 'MRR',
  },
  {
    title: 'Gemiddelde gift',
    icon: Gift,
    trend: '-2.1%',
    trendUp: false,
    subtitle: 'per donatie',
  },
  {
    title: 'Nieuwe donateurs',
    icon: UserPlus,
    trend: '+8.3%',
    trendUp: true,
    subtitle: 'deze maand',
  },
] as const

async function DashboardContent() {
  const { mosqueId, mosque, supabase } = await getCachedProfile()

  if (!mosqueId) return null

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const monthStr = startOfMonth.slice(0, 10)

  const plan = mosque.plan ?? 'free'
  const limits = getPlanLimits(plan)

  const [{ data: metrics }, { data: monthly }, { data: byFund }, { data: usageRows }] = await Promise.all([
    supabase.rpc('get_dashboard_metrics', {
      p_mosque_id: mosqueId,
      p_month_start: startOfMonth,
    }),
    supabase.rpc('get_monthly_totals', { p_mosque_id: mosqueId }),
    supabase.rpc('get_fund_breakdown', {
      p_mosque_id: mosqueId,
      p_month_start: startOfMonth,
    }),
    supabase
      .from('plan_usage')
      .select('online_donations')
      .eq('mosque_id', mosqueId)
      .eq('month', monthStr)
      .maybeSingle(),
  ])

  const m = (metrics ?? {}) as DashboardMetrics
  const avgGift = m.monthly_count > 0 ? Math.round(m.total_this_month / m.monthly_count) : 0

  const kpiValues = [
    formatMoney(m.total_this_month ?? 0),
    formatMoney(m.recurring_mrr ?? 0),
    formatMoney(avgGift),
    String(m.new_donors ?? 0),
  ]

  const recentDonations = m.recent_donations ?? []
  const monthlyData = (monthly ?? []) as MonthlyTotal[]
  const fundData = (byFund ?? []) as FundBreakdown[]

  const onlineDonations = usageRows?.online_donations ?? 0
  const maxOnline = limits.maxOnlineDonations

  let upgradeBannerMessage: string | null = null
  if (plan === 'free' && maxOnline !== null) {
    if (onlineDonations >= maxOnline) {
      upgradeBannerMessage = `U heeft het limiet van ${maxOnline} online donaties deze maand bereikt. Upgrade naar Starter voor onbeperkte donaties.`
    } else if (onlineDonations >= maxOnline - 3) {
      upgradeBannerMessage = `U heeft ${onlineDonations} van ${maxOnline} gratis online donaties deze maand gebruikt. Upgrade naar Starter voor onbeperkte donaties.`
    }
  }

  return (
    <div className="space-y-8">
      {upgradeBannerMessage && (
        <UpgradeBanner message={upgradeBannerMessage} plan={plan} />
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPI_CONFIG.map((kpi, index) => {
          const Icon = kpi.icon
          return (
            <div
              key={kpi.title}
              className="group relative rounded-xl border border-[#e3dfd5] bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_24px_rgba(38,27,7,0.06)] hover:border-[#d5cfb8]"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-[12px] font-medium text-[#a09888] uppercase tracking-wide">
                  {kpi.title}
                </p>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f3f1ec]">
                  <Icon className="h-4 w-4 text-[#8a8478]" strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-[28px] font-bold tracking-tight text-[#261b07] leading-none">{kpiValues[index]}</p>
              <div className="mt-3 flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    kpi.trendUp
                      ? 'bg-[#e8f0d4] text-[#4a7c10]'
                      : 'bg-red-50 text-red-500'
                  }`}
                >
                  {kpi.trendUp ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {kpi.trend}
                </span>
                <span className="text-[11px] text-[#b5b0a5]">t.o.v. vorige maand</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-[#e3dfd5] bg-white p-6">
          <div className="mb-6">
            <h3 className="text-[15px] font-semibold text-[#261b07] tracking-tight">Donaties per maand</h3>
            <p className="text-[12px] text-[#a09888] mt-0.5">Overzicht van maandelijkse donatie-inkomsten</p>
          </div>
          <MonthlyChart data={monthlyData} />
        </div>
        <div className="rounded-xl border border-[#e3dfd5] bg-white p-6">
          <div className="mb-6">
            <h3 className="text-[15px] font-semibold text-[#261b07] tracking-tight">Verdeling per fonds</h3>
            <p className="text-[12px] text-[#a09888] mt-0.5">Hoe donaties verdeeld zijn over fondsen</p>
          </div>
          <FundChart data={fundData} />
        </div>
      </div>

      {/* Recent Donations */}
      <div className="rounded-xl border border-[#e3dfd5] bg-white">
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <div>
            <h3 className="text-[15px] font-semibold text-[#261b07] tracking-tight">Recente donaties</h3>
            <p className="text-[12px] text-[#a09888] mt-0.5">De laatste ontvangen donaties</p>
          </div>
          {recentDonations.length > 0 && (
            <Link
              href="/donaties"
              className="inline-flex items-center gap-1 text-[12px] font-medium text-[#8a8478] hover:text-[#261b07] transition-colors"
            >
              Bekijk alles
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
        <div className="px-6 pb-6">
          {recentDonations.length > 0 ? (
            <div className="divide-y divide-[#e3dfd5]/60">
              {recentDonations.map((donation) => {
                const name = donation.donor_name ?? 'Anoniem'
                const initials = name === 'Anoniem'
                  ? '?'
                  : name
                      .split(' ')
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()

                return (
                  <div
                    key={donation.id}
                    className="flex items-center gap-4 py-3.5 first:pt-2"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f3f1ec] text-[11px] font-semibold text-[#8a8478]">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="text-[13px] font-medium text-[#261b07] leading-none truncate">
                        {name}
                      </p>
                      <p className="text-[11px] text-[#a09888]">
                        {donation.fund_name} &middot; {donation.method}
                      </p>
                    </div>
                    <p className="text-[13px] font-semibold text-[#261b07] tabular-nums whitespace-nowrap">
                      {formatMoney(donation.amount)}
                    </p>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f3f1ec] mb-3">
                <Inbox className="h-5 w-5 text-[#a09888]" strokeWidth={1.5} />
              </div>
              <p className="text-[13px] font-medium text-[#8a8478]">Nog geen donaties ontvangen</p>
              <p className="text-[11px] text-[#b5b0a5] mt-1">Donaties verschijnen hier zodra ze binnenkomen</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
