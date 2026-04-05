import { getCachedProfile } from "@/lib/supabase/cached";
import { FundDialog } from "@/components/fund/fund-dialog";
import { FundCards } from "@/components/fund/fund-cards";
import { FundOverviewChart } from "@/components/fund/fund-overview-chart";
import { formatMoney } from "@/lib/money";
import {
  Plus,
  Landmark,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

export const revalidate = 60;

export default async function FondsenPage() {
  const { mosqueId, supabase, profile } = await getCachedProfile();

  if (!mosqueId) return null;

  const canEdit = profile.role !== "viewer";

  const now = new Date();
  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  ).toISOString();
  const startOfPrevMonth = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    1,
  ).toISOString();

  const [
    { data: funds },
    { data: fundTotals },
    { data: thisMonthDonations },
    { data: prevMonthDonations },
    { data: monthlyByFund },
  ] = await Promise.all([
    supabase
      .from("funds")
      .select("*")
      .eq("mosque_id", mosqueId)
      .order("sort_order", { ascending: true }),
    supabase.rpc("get_fund_totals", { p_mosque_id: mosqueId }),
    // This month total
    supabase
      .from("donations")
      .select("amount")
      .eq("mosque_id", mosqueId)
      .eq("status", "completed")
      .gte("created_at", startOfMonth),
    // Previous month total
    supabase
      .from("donations")
      .select("amount")
      .eq("mosque_id", mosqueId)
      .eq("status", "completed")
      .gte("created_at", startOfPrevMonth)
      .lt("created_at", startOfMonth),
    // Monthly totals per fund (last 12 months) for chart
    supabase
      .from("donations")
      .select("amount, fund_id, created_at")
      .eq("mosque_id", mosqueId)
      .eq("status", "completed")
      .gte(
        "created_at",
        new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString(),
      )
      .limit(10000),
  ]);

  // Compute totals
  const totals: Record<string, number> = {};
  fundTotals?.forEach((d: { fund_id: string; total: number }) => {
    totals[d.fund_id] = d.total;
  });

  const allTimeTotal = Object.values(totals).reduce((a, b) => a + b, 0);
  const thisMonthTotal = (thisMonthDonations ?? []).reduce(
    (sum, d) => sum + d.amount,
    0,
  );
  const prevMonthTotal = (prevMonthDonations ?? []).reduce(
    (sum, d) => sum + d.amount,
    0,
  );

  // Trend calculation
  const trendPct =
    prevMonthTotal > 0
      ? ((thisMonthTotal - prevMonthTotal) / prevMonthTotal) * 100
      : thisMonthTotal > 0
        ? 100
        : 0;
  const trendUp = trendPct >= 0;

  // Build monthly-by-fund chart data
  const fundMap: Record<string, string> = {};
  funds?.forEach((f) => {
    fundMap[f.id] = f.name;
  });

  const monthlyAgg: Record<string, Record<string, number>> = {};
  monthlyByFund?.forEach((d) => {
    const month = d.created_at.slice(0, 7); // YYYY-MM
    const fundName = fundMap[d.fund_id] ?? "Overig";
    if (!monthlyAgg[month]) monthlyAgg[month] = {};
    monthlyAgg[month][fundName] = (monthlyAgg[month][fundName] ?? 0) + d.amount;
  });

  const fundNames = [
    ...new Set(Object.values(monthlyAgg).flatMap((m) => Object.keys(m))),
  ];
  const chartData = Object.entries(monthlyAgg)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, byFund]) => ({ month, ...byFund }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold tracking-[-0.5px] text-[#261b07]">
            Fondsen
          </h1>
          <p className="text-[13px] text-[#a09888] mt-0.5">
            Beheer uw fondsen en bekijk de prestaties
          </p>
        </div>
        {canEdit && (
          <FundDialog
            mode="create"
            trigger={
              <button className="flex items-center gap-2 rounded-xl bg-[#261b07] px-4 py-2.5 text-[13px] font-medium text-white hover:bg-[#3a2c14] transition-colors">
                <Plus className="h-4 w-4" />
                Nieuw fonds
              </button>
            }
          />
        )}
      </div>

      {funds && funds.length > 0 ? (
        <>
          {/* Top Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            {/* All-time total */}
            <div className="rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(38,27,7,0.04),0_1px_2px_rgba(38,27,7,0.02)] sm:col-span-2">
              <p className="text-[11px] font-semibold text-[#a09888] uppercase tracking-[0.06em] mb-2">
                Totaal ontvangen
              </p>
              <p className="text-[36px] font-bold tracking-tight text-[#261b07] leading-none">
                {formatMoney(allTimeTotal)}
              </p>
              <p className="text-[12px] text-[#b5b0a5] mt-2">
                over alle fondsen · alle tijd
              </p>
            </div>

            {/* This month */}
            <div className="rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(38,27,7,0.04),0_1px_2px_rgba(38,27,7,0.02)]">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-semibold text-[#a09888] uppercase tracking-[0.06em]">
                  Deze maand
                </p>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C87D3A]/10">
                  <TrendingUp
                    className="h-4 w-4 text-[#C87D3A]"
                    strokeWidth={1.5}
                  />
                </div>
              </div>
              <p className="text-[28px] font-bold tracking-tight text-[#261b07] leading-none">
                {formatMoney(thisMonthTotal)}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    trendUp
                      ? "bg-[#e8f0d4] text-[#4a7c10]"
                      : "bg-red-50 text-red-500"
                  }`}
                >
                  {trendUp ? (
                    <ArrowUpRight className="h-2.5 w-2.5" />
                  ) : (
                    <ArrowDownRight className="h-2.5 w-2.5" />
                  )}
                  {trendUp ? "+" : ""}
                  {trendPct.toFixed(1)}%
                </span>
                <span className="text-[11px] text-[#b5b0a5]">
                  t.o.v. vorige maand
                </span>
              </div>
            </div>
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(38,27,7,0.04),0_1px_2px_rgba(38,27,7,0.02)]">
              <div className="px-6 pt-5 pb-1">
                <h3 className="text-[15px] font-semibold text-[#261b07] tracking-tight">
                  Donaties per fonds
                </h3>
                <p className="text-[12px] text-[#a09888] mt-0.5">
                  Maandelijks overzicht per fonds
                </p>
              </div>
              <div className="px-6 pb-5 pt-2">
                <FundOverviewChart data={chartData} fundNames={fundNames} />
              </div>
            </div>
          )}

          {/* Fund Cards */}
          <div>
            <h3 className="text-[15px] font-semibold text-[#261b07] tracking-tight mb-4">
              Alle fondsen ({funds.length})
            </h3>
            <FundCards funds={funds} totals={totals} role={profile.role} />
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#e3dfd5] bg-white py-16">
          <div className="rounded-full bg-[#f3f1ec] p-5 mb-5">
            <Landmark className="h-7 w-7 text-[#a09888]" strokeWidth={1.5} />
          </div>
          <p className="text-[14px] font-medium text-[#261b07]">
            Nog geen fondsen aangemaakt
          </p>
          <p className="text-[12px] text-[#b5b0a5] mt-1">
            Maak een fonds aan om donaties te ontvangen
          </p>
        </div>
      )}
    </div>
  );
}
