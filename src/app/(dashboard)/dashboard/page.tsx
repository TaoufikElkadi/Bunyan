import { Suspense } from 'react'
import { getCachedProfile } from '@/lib/supabase/cached'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatMoney } from '@/lib/money'
import { MonthlyChart } from '@/components/dashboard/monthly-chart'
import { FundChart } from '@/components/dashboard/fund-chart'
import { UpgradeBanner } from '@/components/dashboard/upgrade-banner'
import { getPlanLimits } from '@/lib/plan'
import { TrendingUp, Repeat, Gift, UserPlus, ArrowUpRight, ArrowDownRight, Inbox } from 'lucide-react'

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
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="relative overflow-hidden">
          <CardContent className="py-7 px-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
            <Skeleton className="h-9 w-24 rounded-md" />
            <div className="mt-3 flex items-center gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-44 rounded-md" />
          <Skeleton className="h-4 w-64 rounded-md mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40 rounded-md" />
          <Skeleton className="h-4 w-56 rounded-md mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </CardContent>
      </Card>
    </div>
  )
}

function RecentSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-40 rounded-md" />
        <Skeleton className="h-4 w-52 rounded-md mt-1" />
      </CardHeader>
      <CardContent className="space-y-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-xl px-4 py-4">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-3 w-40 rounded-md" />
            </div>
            <Skeleton className="h-5 w-20 rounded-md" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Overzicht van uw donaties en activiteiten
        </p>
      </div>
      <Suspense fallback={<div className="space-y-10"><KPISkeleton /><ChartSkeleton /><RecentSkeleton /></div>}>
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
  },
  {
    title: 'Maandelijks terugkerend',
    icon: Repeat,
    trend: '+4.2%',
    trendUp: true,
  },
  {
    title: 'Gemiddelde gift',
    icon: Gift,
    trend: '-2.1%',
    trendUp: false,
  },
  {
    title: 'Nieuwe donateurs',
    icon: UserPlus,
    trend: '+8.3%',
    trendUp: true,
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
    <div className="space-y-10">
      {upgradeBannerMessage && (
        <UpgradeBanner message={upgradeBannerMessage} plan={plan} />
      )}

      {/* KPI Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {KPI_CONFIG.map((kpi, index) => {
          const Icon = kpi.icon
          return (
            <Card
              key={kpi.title}
              className="group relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              {/* Subtle gradient overlay */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-foreground/[0.02] to-transparent" />
              <CardContent className="relative py-7 px-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-muted-foreground tracking-wide">
                    {kpi.title}
                  </p>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted/60">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <p className="text-3xl font-bold tracking-tight">{kpiValues[index]}</p>
                <div className="mt-3 flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      kpi.trendUp
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : 'bg-red-500/10 text-red-500'
                    }`}
                  >
                    {kpi.trendUp ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {kpi.trend}
                  </span>
                  <span className="text-[11px] text-muted-foreground">t.o.v. vorige maand</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold tracking-tight">Donaties per maand</CardTitle>
            <CardDescription className="text-xs">Overzicht van maandelijkse donatie-inkomsten</CardDescription>
          </CardHeader>
          <CardContent>
            <MonthlyChart data={monthlyData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold tracking-tight">Verdeling per fonds</CardTitle>
            <CardDescription className="text-xs">Hoe donaties verdeeld zijn over fondsen</CardDescription>
          </CardHeader>
          <CardContent>
            <FundChart data={fundData} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Donations */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold tracking-tight">Recente donaties</CardTitle>
          <CardDescription className="text-xs">De laatste ontvangen donaties</CardDescription>
        </CardHeader>
        <CardContent>
          {recentDonations.length > 0 ? (
            <div className="space-y-1">
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
                    className="flex items-center gap-4 rounded-xl px-4 py-3.5 transition-colors hover:bg-muted/40"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted/70 text-xs font-semibold text-muted-foreground">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="text-sm font-medium leading-none truncate">
                        {name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {donation.fund_name} &middot; {donation.method}
                      </p>
                    </div>
                    <p className="text-sm font-semibold tabular-nums whitespace-nowrap">
                      {formatMoney(donation.amount)}
                    </p>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/60 mb-3">
                <Inbox className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Nog geen donaties ontvangen</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Donaties verschijnen hier zodra ze binnenkomen</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
