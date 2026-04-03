import { Suspense } from 'react'
import { getCachedProfile } from '@/lib/supabase/cached'
import { Skeleton } from '@/components/ui/skeleton'
import { formatMoney } from '@/lib/money'
import { DonationTrendChart } from '@/components/dashboard/donation-trend-chart'
import { FundBars } from '@/components/dashboard/fund-bars'
import { UpgradeBanner } from '@/components/dashboard/upgrade-banner'
import { getPlanLimits } from '@/lib/plan'
import {
  TrendingUp,
  Repeat,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  Plus,
  ArrowRight,
  HandCoins,
} from 'lucide-react'
import Link from 'next/link'
import { DonationPageCopyButton } from '@/components/dashboard/donation-page-copy'
import { GenerateMockButton } from '@/components/dashboard/generate-mock-button'
import { MemberHealthCard } from '@/components/members/member-health-card'
import { TaxSavingsCard } from '@/components/members/tax-savings-card'
import { ShardCollectionCard } from '@/components/shard/shard-collection-card'

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

/* ------------------------------------------------------------------ */
/*  Skeletons                                                          */
/* ------------------------------------------------------------------ */

function DashboardSkeleton() {
  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0 space-y-6">
        {/* KPI row */}
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(38,27,7,0.04)]">
              <Skeleton className="h-3 w-20 rounded-md mb-4" />
              <Skeleton className="h-8 w-28 rounded-md mb-3" />
              <Skeleton className="h-4 w-36 rounded-full" />
            </div>
          ))}
        </div>
        {/* Chart */}
        <div className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(38,27,7,0.04)]">
          <Skeleton className="h-5 w-44 rounded-md mb-6" />
          <Skeleton className="h-[320px] w-full rounded-xl" />
        </div>
        {/* Summary row */}
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(38,27,7,0.04)]">
              <Skeleton className="h-3 w-16 rounded-md mb-3" />
              <Skeleton className="h-6 w-20 rounded-md" />
            </div>
          ))}
        </div>
      </div>
      <div className="hidden xl:block w-[340px] shrink-0 space-y-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(38,27,7,0.04)]">
            <Skeleton className="h-4 w-28 rounded-md mb-4" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-[26px] font-bold tracking-[-0.5px] text-[#261b07]">Dashboard</h1>
          <p className="mt-0.5 text-[13px] text-[#a09888]">
            Overzicht van uw donaties en activiteiten
          </p>
        </div>
      </div>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function calcTrend(current: number, previous: number): { value: string; up: boolean } {
  if (previous === 0) return { value: current > 0 ? '+100%' : '0%', up: current > 0 }
  const pct = ((current - previous) / previous) * 100
  const sign = pct >= 0 ? '+' : ''
  return { value: `${sign}${pct.toFixed(1)}%`, up: pct >= 0 }
}

function formatCompact(cents: number): string {
  const euros = cents / 100
  if (euros >= 1000) {
    return `€${(euros / 1000).toFixed(1).replace('.0', '')}k`
  }
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(euros)
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'zojuist'
  if (mins < 60) return `${mins}m geleden`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}u geleden`
  const days = Math.floor(hours / 24)
  return `${days}d geleden`
}

/* ------------------------------------------------------------------ */
/*  Content                                                            */
/* ------------------------------------------------------------------ */

async function DashboardContent() {
  const { mosqueId, mosque, supabase } = await getCachedProfile()

  if (!mosqueId) return null

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const monthStr = startOfMonth.slice(0, 10)

  const plan = mosque.plan ?? 'free'
  const limits = getPlanLimits(plan)

  const [
    { data: metrics },
    { data: monthly },
    { data: byFund },
    { data: usageRows },
    { data: activeCampaigns },
    {},  // recurringThisMonth — query kept for future use
    { count: activeRecurrings },
    { count: totalDonors },
  ] = await Promise.all([
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
    supabase
      .from('campaigns')
      .select('id, title, slug, goal_amount, is_active, funds(name)')
      .eq('mosque_id', mosqueId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('donations')
      .select('amount')
      .eq('mosque_id', mosqueId)
      .eq('status', 'completed')
      .eq('is_recurring', true)
      .gte('created_at', startOfMonth),
    supabase
      .from('recurrings')
      .select('*', { count: 'exact', head: true })
      .eq('mosque_id', mosqueId)
      .eq('status', 'active'),
    supabase
      .from('donors')
      .select('*', { count: 'exact', head: true })
      .eq('mosque_id', mosqueId),
  ])

  const m = (metrics ?? {}) as DashboardMetrics
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

  // Calculate trends from monthly totals data
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevMonthKey = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`
  const prevTotal = monthlyData.find((d) => d.month === prevMonthKey)?.total ?? 0

  // Use current month if it has data, otherwise show last month with data
  const thisMonthTotal = m.total_this_month ?? 0
  const hasCurrentMonthData = thisMonthTotal > 0
  const lastMonthWithData = [...monthlyData].reverse().find((d) => d.total > 0)
  const displayTotal = hasCurrentMonthData ? thisMonthTotal : (lastMonthWithData?.total ?? 0)
  const displayTotalLabel = hasCurrentMonthData ? 'Deze maand' : 'Laatste maand'
  const displayTotalSub = hasCurrentMonthData
    ? `van ${formatCompact(prevTotal)} · vorige maand`
    : lastMonthWithData
      ? `${lastMonthWithData.month.split('-').reverse().join('/')} · meest recente maand`
      : 'nog geen donaties'

  // Trend: compare displayed period to the one before it
  const displayIdx = lastMonthWithData ? monthlyData.indexOf(lastMonthWithData) : -1
  const compareTotal = displayIdx > 0 ? monthlyData[displayIdx - 1].total : 0
  // Only show trend when we have a real comparison point
  const trendTotal = displayIdx > 0 ? calcTrend(displayTotal, compareTotal) : null

  const donationPageUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://bunyan.nl'}/doneren/${mosque.slug}`

  const hasNoDonations =
    (m.total_this_month ?? 0) === 0 &&
    (m.monthly_count ?? 0) === 0 &&
    recentDonations.length === 0 &&
    monthlyData.every((d) => d.total === 0)

  // All-time stats from monthly totals (for summary row)
  const allTimeDonationTotal = monthlyData.reduce((sum, d) => sum + d.total, 0)
  const allTimeMonths = monthlyData.filter((d) => d.total > 0).length

  return (
    <div className="space-y-6">
      {upgradeBannerMessage && (
        <UpgradeBanner message={upgradeBannerMessage} plan={plan} />
      )}

      {hasNoDonations && (
        <div className="flex items-center justify-center py-16">
          <div className="rounded-2xl bg-white border border-[#eae6de]/80 shadow-[0_1px_2px_rgba(38,27,7,0.03)] p-10 text-center max-w-md w-full">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#C87D3A]/10">
              <HandCoins className="h-7 w-7 text-[#C87D3A]" strokeWidth={1.5} />
            </div>
            <h2 className="text-[18px] font-bold text-[#261b07] tracking-tight">
              Nog geen donaties ontvangen
            </h2>
            <p className="mt-2 text-[13px] text-[#a09888] leading-relaxed">
              Zodra uw eerste donatie binnenkomt, verschijnen hier uw statistieken.
              Deel uw donatiepagina om te beginnen.
            </p>
            <div className="mt-6 flex items-center gap-2 justify-center">
              <div className="flex-1 min-w-0 flex items-center gap-2 rounded-lg border border-[#e3dfd5] bg-[#fafaf8] px-3 py-2">
                <span className="text-[12px] text-[#8a8478] truncate">{donationPageUrl}</span>
              </div>
              <DonationPageCopyButton url={donationPageUrl} />
            </div>
            <Link
              href={`/doneren/${mosque.slug}`}
              target="_blank"
              className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#C87D3A] hover:text-[#a8632a] transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
              Bekijk donatiepagina
            </Link>
          </div>
        </div>
      )}

      {!hasNoDonations && <div className="flex gap-6">
        {/* ---- Main column ---- */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <KPICard
              label={displayTotalLabel}
              value={formatMoney(displayTotal)}
              trend={trendTotal}
              icon={<TrendingUp className="h-4 w-4" strokeWidth={1.5} />}
              iconBg="bg-[#C87D3A]/10"
              iconColor="text-[#C87D3A]"
              sub={displayTotalSub}
            />
            <KPICard
              label="Maandelijks terugkerend"
              value={formatMoney(m.recurring_mrr ?? 0)}
              icon={<Repeat className="h-4 w-4" strokeWidth={1.5} />}
              iconBg="bg-[#6B8F71]/10"
              iconColor="text-[#6B8F71]"
              sub={`${activeRecurrings ?? 0} actieve mandaten`}
            />
            <KPICard
              label="Donateurs"
              value={String(totalDonors ?? 0)}
              icon={<Users className="h-4 w-4" strokeWidth={1.5} />}
              iconBg="bg-[#7B8EAD]/10"
              iconColor="text-[#7B8EAD]"
              sub={m.new_donors > 0 ? `+${m.new_donors} nieuw deze maand` : 'totaal geregistreerd'}
            />
          </div>

          {/* Donation Trend Chart */}
          <div className="rounded-2xl bg-white border border-[#eae6de]/80 shadow-[0_1px_2px_rgba(38,27,7,0.03)]">
            <div className="flex items-center justify-between px-6 pt-5 pb-1">
              <div>
                <h3 className="text-[15px] font-semibold text-[#261b07] tracking-tight">Donatie overzicht</h3>
                <p className="text-[12px] text-[#a09888] mt-0.5">Maandelijkse donatie-inkomsten</p>
              </div>
            </div>
            <div className="px-6 pb-5 pt-2">
              <DonationTrendChart data={monthlyData} />
            </div>
          </div>

          {/* Summary Stats Row — all-time overview */}
          <div className="grid gap-3 sm:grid-cols-4">
            <SummaryCell
              label="Totaal ontvangen"
              value={formatCompact(allTimeDonationTotal)}
              sub="afgelopen 12 maanden"
              color="#C87D3A"
            />
            <SummaryCell
              label="Actieve maanden"
              value={String(allTimeMonths)}
              sub="met donaties"
              color="#6B8F71"
            />
            <SummaryCell
              label="Actieve mandaten"
              value={String(activeRecurrings ?? 0)}
              sub="terugkerend"
              color="#7B8EAD"
            />
            <SummaryCell
              label="Gem. per maand"
              value={formatCompact(allTimeMonths > 0 ? Math.round(allTimeDonationTotal / allTimeMonths) : 0)}
              sub="afgelopen 12 maanden"
              color="#D4956A"
            />
          </div>

          {/* Member Intelligence Row */}
          {limits.hasMemberIntelligence && (
            <div className="grid gap-4 sm:grid-cols-2">
              <MemberHealthCard />
              <TaxSavingsCard />
            </div>
          )}

          {/* Shard Collection */}
          {limits.hasShard && <ShardCollectionCard />}
        </div>

        {/* ---- Right sidebar ---- */}
        <div className="hidden xl:flex w-[340px] shrink-0 flex-col gap-5">

          {/* Quick Actions */}
          <div className="rounded-2xl bg-white border border-[#eae6de]/80 shadow-[0_1px_2px_rgba(38,27,7,0.03)] p-5">
            <h3 className="text-[13px] font-semibold text-[#261b07] mb-4">Snelle acties</h3>

            {/* Donation page link */}
            <div className="mb-3">
              <label className="text-[11px] font-medium text-[#a09888] uppercase tracking-wide">Donatiepagina</label>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="flex-1 min-w-0 flex items-center gap-2 rounded-lg border border-[#e3dfd5] bg-[#fafaf8] px-3 py-2">
                  <span className="text-[12px] text-[#8a8478] truncate">{donationPageUrl}</span>
                </div>
                <DonationPageCopyButton url={donationPageUrl} />
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2 mt-4">
              <Link
                href={`/doneren/${mosque.slug}`}
                target="_blank"
                className="flex items-center gap-2.5 rounded-xl border border-[#e3dfd5] px-4 py-2.5 text-[13px] font-medium text-[#261b07] hover:bg-[#fafaf8] transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5 text-[#a09888]" strokeWidth={1.5} />
                Bekijk donatiepagina
              </Link>
              <Link
                href="/campagnes"
                className="flex items-center gap-2.5 rounded-xl border border-[#e3dfd5] px-4 py-2.5 text-[13px] font-medium text-[#261b07] hover:bg-[#fafaf8] transition-colors"
              >
                <Plus className="h-3.5 w-3.5 text-[#a09888]" strokeWidth={1.5} />
                Nieuwe campagne
              </Link>
            </div>
          </div>

          {/* Active Campaigns */}
          {activeCampaigns && activeCampaigns.length > 0 && (
            <div className="rounded-2xl bg-white border border-[#eae6de]/80 shadow-[0_1px_2px_rgba(38,27,7,0.03)] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[13px] font-semibold text-[#261b07]">Actieve campagnes</h3>
                <Link
                  href="/campagnes"
                  className="text-[11px] font-medium text-[#a09888] hover:text-[#261b07] transition-colors flex items-center gap-0.5"
                >
                  Beheer
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="space-y-2.5">
                {activeCampaigns.map((campaign) => {
                  const campaignUrl = `${donationPageUrl.replace(/\/doneren\/.*/, '')}/doneren/${mosque.slug}/${campaign.slug}`
                  return (
                    <div key={campaign.id} className="rounded-xl border border-[#e3dfd5] p-3">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <p className="text-[13px] font-medium text-[#261b07] leading-tight">{campaign.title}</p>
                        {campaign.goal_amount && (
                          <span className="text-[11px] text-[#a09888] whitespace-nowrap">
                            {formatCompact(campaign.goal_amount)}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#b5b0a5] mb-2">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {(campaign.funds as any)?.name ?? 'Algemeen'}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 min-w-0 flex items-center rounded-md bg-[#fafaf8] border border-[#e3dfd5]/60 px-2 py-1">
                          <span className="text-[10px] text-[#a09888] truncate">/doneren/{mosque.slug}/{campaign.slug}</span>
                        </div>
                        <DonationPageCopyButton url={campaignUrl} />
                        <Link
                          href={`/doneren/${mosque.slug}/${campaign.slug}`}
                          target="_blank"
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[#e3dfd5] text-[#a09888] hover:bg-[#fafaf8] hover:text-[#261b07] transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Recent Donations */}
          <div className="rounded-2xl bg-white border border-[#eae6de]/80 shadow-[0_1px_2px_rgba(38,27,7,0.03)] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13px] font-semibold text-[#261b07]">Recente donaties</h3>
              <Link
                href="/donaties"
                className="text-[11px] font-medium text-[#a09888] hover:text-[#261b07] transition-colors flex items-center gap-0.5"
              >
                Alles
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {recentDonations.length > 0 ? (
              <div className="space-y-0">
                {recentDonations.slice(0, 5).map((donation) => {
                  const name = donation.donor_name ?? 'Anoniem'
                  const initials = name === 'Anoniem'
                    ? '?'
                    : name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

                  return (
                    <div
                      key={donation.id}
                      className="flex items-center gap-3 py-2.5 border-b border-[#e3dfd5]/50 last:border-0"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f3f1ec] text-[10px] font-semibold text-[#8a8478]">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-[#261b07] leading-none truncate">
                          {name}
                        </p>
                        <p className="text-[10px] text-[#b5b0a5] mt-0.5">
                          {timeAgo(donation.created_at)}
                        </p>
                      </div>
                      <p className="text-[12px] font-semibold text-[#261b07] tabular-nums whitespace-nowrap">
                        {formatMoney(donation.amount)}
                      </p>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-[12px] text-[#b5b0a5] py-6 text-center">
                Nog geen donaties ontvangen
              </p>
            )}
          </div>

          {/* Fund Distribution */}
          <div className="rounded-2xl bg-white border border-[#eae6de]/80 shadow-[0_1px_2px_rgba(38,27,7,0.03)] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13px] font-semibold text-[#261b07]">Fondsverdeling</h3>
              <Link
                href="/fondsen"
                className="text-[11px] font-medium text-[#a09888] hover:text-[#261b07] transition-colors"
              >
                Beheer
              </Link>
            </div>
            <FundBars data={fundData} />
          </div>

          {/* Mock Data Generator */}
          <GenerateMockButton />
        </div>
      </div>}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function KPICard({
  label,
  value,
  trend,
  icon,
  iconBg,
  iconColor,
  sub,
}: {
  label: string
  value: string
  trend?: { value: string; up: boolean } | null
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  sub: string
}) {
  return (
    <div className="group relative rounded-2xl bg-white p-5 border border-[#eae6de]/80 shadow-[0_1px_2px_rgba(38,27,7,0.03)] transition-all duration-200 hover:shadow-[0_4px_20px_rgba(38,27,7,0.06)] hover:border-[#e0dbd0]">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] font-semibold text-[#a09888] uppercase tracking-[0.08em]">
          {label}
        </p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconBg} ${iconColor} transition-transform duration-200 group-hover:scale-105`}>
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-2.5">
        <p className="text-[30px] font-extrabold tracking-[-0.02em] text-[#261b07] leading-none">{value}</p>
        {trend && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm ${
              trend.up
                ? 'bg-emerald-50/80 text-emerald-600'
                : 'bg-red-50/80 text-red-500'
            }`}
          >
            {trend.up ? (
              <ArrowUpRight className="h-2.5 w-2.5" />
            ) : (
              <ArrowDownRight className="h-2.5 w-2.5" />
            )}
            {trend.value}
          </span>
        )}
      </div>
      <p className="text-[11px] text-[#b5b0a5] mt-2.5">{sub}</p>
    </div>
  )
}

function SummaryCell({
  label,
  value,
  sub,
  color,
}: {
  label: string
  value: string
  sub: string
  color: string
}) {
  return (
    <div className="rounded-xl bg-white p-4 border border-[#eae6de]/80 shadow-[0_1px_2px_rgba(38,27,7,0.03)]">
      <div className="flex items-center gap-2 mb-2.5">
        <div className="h-2 w-2 rounded-full ring-2 ring-offset-1" style={{ backgroundColor: color, '--tw-ring-color': `${color}30` } as React.CSSProperties} />
        <p className="text-[10px] font-semibold text-[#a09888] uppercase tracking-[0.08em]">{label}</p>
      </div>
      <p className="text-[20px] font-extrabold text-[#261b07] tracking-[-0.01em] leading-none">{value}</p>
      <p className="text-[10px] text-[#c0bab0] mt-1.5">{sub}</p>
    </div>
  )
}
