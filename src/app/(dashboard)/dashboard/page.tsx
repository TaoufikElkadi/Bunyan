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
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevMonthKey = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`
  const prevTotal = monthlyData.find((d) => d.month === prevMonthKey)?.total ?? 0
  const trendTotal = calcTrend(m.total_this_month ?? 0, prevTotal)
  const trendMrr = calcTrend(m.recurring_mrr ?? 0, 0) // no historical MRR tracking
  const trendDonors = calcTrend(m.new_donors ?? 0, 0) // no historical new-donor tracking

  const donationPageUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://bunyan.nl'}/doneren/${mosque.slug}`

  // Compute one-time vs recurring donation totals for this month
  const [{ data: recurringThisMonth }, { count: activeRecurrings }] = await Promise.all([
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
  ])

  const recurringTotal = (recurringThisMonth ?? []).reduce((sum, d) => sum + d.amount, 0)
  const totalOneTime = (m.total_this_month ?? 0) - recurringTotal

  return (
    <div className="space-y-6">
      {upgradeBannerMessage && (
        <UpgradeBanner message={upgradeBannerMessage} plan={plan} />
      )}

      <div className="flex gap-6">
        {/* ---- Main column ---- */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <KPICard
              label="Deze maand"
              value={formatMoney(m.total_this_month ?? 0)}
              trend={trendTotal}
              icon={<TrendingUp className="h-4 w-4" strokeWidth={1.5} />}
              iconBg="bg-[#C87D3A]/10"
              iconColor="text-[#C87D3A]"
              sub={`van ${formatCompact(prevTotal)} · vorige maand`}
            />
            <KPICard
              label="Maandelijks terugkerend"
              value={formatMoney(m.recurring_mrr ?? 0)}
              trend={trendMrr}
              icon={<Repeat className="h-4 w-4" strokeWidth={1.5} />}
              iconBg="bg-[#6B8F71]/10"
              iconColor="text-[#6B8F71]"
              sub={`${activeRecurrings ?? 0} actieve mandaten`}
            />
            <KPICard
              label="Nieuwe donateurs"
              value={String(m.new_donors ?? 0)}
              trend={trendDonors}
              icon={<Users className="h-4 w-4" strokeWidth={1.5} />}
              iconBg="bg-[#7B8EAD]/10"
              iconColor="text-[#7B8EAD]"
              sub="eerste donatie deze maand"
            />
          </div>

          {/* Donation Trend Chart */}
          <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(38,27,7,0.04),0_1px_2px_rgba(38,27,7,0.02)]">
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

          {/* Summary Stats Row */}
          <div className="grid gap-4 sm:grid-cols-4">
            <SummaryCell
              label="Totaal donaties"
              value={String(m.monthly_count ?? 0)}
              color="#C87D3A"
            />
            <SummaryCell
              label="Terugkerend"
              value={formatMoney(recurringTotal)}
              color="#6B8F71"
            />
            <SummaryCell
              label="Eenmalig"
              value={formatMoney(totalOneTime > 0 ? totalOneTime : 0)}
              color="#7B8EAD"
            />
            <SummaryCell
              label="Gemiddeld"
              value={formatMoney(avgGift)}
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
          <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(38,27,7,0.04),0_1px_2px_rgba(38,27,7,0.02)] p-5">
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

          {/* Recent Donations */}
          <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(38,27,7,0.04),0_1px_2px_rgba(38,27,7,0.02)] p-5">
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
          <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(38,27,7,0.04),0_1px_2px_rgba(38,27,7,0.02)] p-5">
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
      </div>
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
  trend: { value: string; up: boolean }
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  sub: string
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(38,27,7,0.04),0_1px_2px_rgba(38,27,7,0.02)] transition-shadow duration-200 hover:shadow-[0_4px_16px_rgba(38,27,7,0.06)]">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-semibold text-[#a09888] uppercase tracking-[0.06em]">
          {label}
        </p>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg} ${iconColor}`}>
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-2.5">
        <p className="text-[28px] font-bold tracking-tight text-[#261b07] leading-none">{value}</p>
        <span
          className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
            trend.up
              ? 'bg-[#e8f0d4] text-[#4a7c10]'
              : 'bg-red-50 text-red-500'
          }`}
        >
          {trend.up ? (
            <ArrowUpRight className="h-2.5 w-2.5" />
          ) : (
            <ArrowDownRight className="h-2.5 w-2.5" />
          )}
          {trend.value}
        </span>
      </div>
      <p className="text-[11px] text-[#b5b0a5] mt-2">{sub}</p>
    </div>
  )
}

function SummaryCell({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color: string
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(38,27,7,0.04),0_1px_2px_rgba(38,27,7,0.02)]">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        <p className="text-[11px] font-medium text-[#a09888] uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-[20px] font-bold text-[#261b07] tracking-tight leading-none">{value}</p>
    </div>
  )
}
