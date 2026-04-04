"use client";

import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const DUTCH_MONTHS: Record<string, string> = {
  "01": "jan",
  "02": "feb",
  "03": "mrt",
  "04": "apr",
  "05": "mei",
  "06": "jun",
  "07": "jul",
  "08": "aug",
  "09": "sep",
  "10": "okt",
  "11": "nov",
  "12": "dec",
};

const FUND_COLORS = [
  "#C87D3A",
  "#6B8F71",
  "#7B8EAD",
  "#D4956A",
  "#f9a600",
  "#8a8478",
  "#9b6dbb",
  "#4a9ec2",
];

type MonthlyData = { month: string; total: number };
type MonthlyByFund = { month: string; fund_name: string; total: number };

const TIME_RANGES = [
  { key: "3M", label: "3M", months: 3 },
  { key: "6M", label: "6M", months: 6 },
  { key: "JTD", label: "JTD", months: 0, ytd: true },
  { key: "1J", label: "1J", months: 12 },
  { key: "Alles", label: "Alles", months: 0 },
] as const;

function formatMonth(month: string): string {
  const parts = month.split("-");
  return DUTCH_MONTHS[parts[1]] ?? parts[1];
}

function formatFullMonth(month: string): string {
  const [year, m] = month.split("-");
  const monthName = DUTCH_MONTHS[m] ?? m;
  return `${monthName} ${year}`;
}

function formatEuros(cents: number): string {
  const euros = cents / 100;
  if (euros >= 1000) {
    return `€${(euros / 1000).toFixed(1).replace(".0", "")}k`;
  }
  return `€${euros.toLocaleString("nl-NL", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatEurosFull(cents: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce(
    (sum: number, p: { value: number }) => sum + p.value,
    0,
  );
  return (
    <div className="rounded-lg bg-[#261b07] px-3 py-2.5 shadow-lg min-w-[140px]">
      <p className="text-[11px] text-[#b5b0a5] mb-1.5">{label}</p>
      {payload.map((p: { name: string; value: number; color: string }) => (
        <div
          key={p.name}
          className="flex items-center justify-between gap-3 py-0.5"
        >
          <div className="flex items-center gap-1.5">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: p.color }}
            />
            <span className="text-[11px] text-[#d5cfb8]">{p.name}</span>
          </div>
          <span className="text-[11px] font-medium text-white tabular-nums">
            {formatEurosFull(p.value)}
          </span>
        </div>
      ))}
      {payload.length > 1 && (
        <div className="flex items-center justify-between gap-3 pt-1.5 mt-1 border-t border-white/10">
          <span className="text-[11px] text-[#b5b0a5]">Totaal</span>
          <span className="text-[12px] font-semibold text-white tabular-nums">
            {formatEurosFull(total)}
          </span>
        </div>
      )}
    </div>
  );
}

type Props = {
  data: MonthlyData[];
  dataByFund?: MonthlyByFund[];
};

export function DonationTrendChart({ data, dataByFund }: Props) {
  const [range, setRange] = useState<string>("1J");

  const fundNames = useMemo(() => {
    if (!dataByFund || dataByFund.length === 0) return [];
    const names = new Set(dataByFund.map((d) => d.fund_name));
    return Array.from(names);
  }, [dataByFund]);

  const hasMultipleFunds = fundNames.length > 1;

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <p className="text-[13px] text-[#a09888]">
          Nog geen gegevens beschikbaar.
        </p>
      </div>
    );
  }

  const selected = TIME_RANGES.find((r) => r.key === range);
  let visibleData: MonthlyData[];

  if (selected && "ytd" in selected && selected.ytd) {
    const currentYear = new Date().getFullYear().toString();
    visibleData = data.filter((d) => d.month.startsWith(currentYear));
  } else {
    const sliceCount = selected?.months || data.length;
    visibleData = data.slice(-sliceCount);
  }

  const visibleMonths = new Set(visibleData.map((d) => d.month));
  const periodTotal = visibleData.reduce((sum, d) => sum + d.total, 0);

  const periodLength = visibleData.length;
  const allIdx = data.indexOf(visibleData[0]);
  const prevSlice =
    allIdx > 0 ? data.slice(Math.max(0, allIdx - periodLength), allIdx) : [];
  const prevTotal = prevSlice.reduce((sum, d) => sum + d.total, 0);
  const pctChange =
    prevTotal > 0 ? ((periodTotal - prevTotal) / prevTotal) * 100 : 0;
  const hasComparison = prevSlice.length > 0 && prevTotal > 0;

  const rangeStart = visibleData[0];
  const rangeEnd = visibleData[visibleData.length - 1];
  const dateRangeLabel =
    rangeStart && rangeEnd
      ? `${formatFullMonth(rangeStart.month)} – ${formatFullMonth(rangeEnd.month)}`
      : "";

  const useByFund = hasMultipleFunds && dataByFund && dataByFund.length > 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let chartData: any[];

  if (useByFund) {
    const monthMap = new Map<string, Record<string, number>>();
    for (const d of visibleData) {
      monthMap.set(d.month, { month_key: 0 });
    }
    for (const d of dataByFund) {
      if (!visibleMonths.has(d.month)) continue;
      const entry = monthMap.get(d.month) ?? {};
      entry[d.fund_name] = d.total;
      monthMap.set(d.month, entry);
    }
    chartData = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, funds]) => ({
        month: formatMonth(month),
        ...funds,
      }));
  } else {
    chartData = visibleData.map((d) => ({
      month: formatMonth(d.month),
      total: d.total,
    }));
  }

  return (
    <div>
      {/* Period selector + date range */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-1">
          {TIME_RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all duration-150 ${
                range === r.key
                  ? "bg-[#261b07] text-white"
                  : "text-[#8a8478] hover:bg-[#f3f1ec] hover:text-[#261b07]"
              }`}
            >
              {r.label}
            </button>
          ))}
          <span className="text-[12px] text-[#b5b0a5] ml-3">
            {dateRangeLabel}
          </span>
        </div>
      </div>

      {/* Period total + comparison */}
      <div className="mb-5">
        <p className="text-[12px] font-medium text-[#8a8478] mb-1">Donaties</p>
        <div className="flex items-baseline gap-3">
          <p className="text-[28px] font-bold tracking-[-0.02em] text-[#261b07]">
            {formatEurosFull(periodTotal)}
          </p>
          {hasComparison && (
            <span className="text-[12px] text-[#8a8478]">
              {formatEurosFull(prevTotal)} vorige periode{" "}
              <span
                className={pctChange >= 0 ? "text-emerald-600" : "text-red-500"}
              >
                {pctChange >= 0 ? "+" : ""}
                {pctChange.toFixed(1)}%
              </span>
            </span>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} barCategoryGap="20%">
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#f0ede6"
          />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "#b5b0a5", fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
            dy={8}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#b5b0a5", fontWeight: 500 }}
            tickFormatter={(v: number) => formatEuros(v)}
            width={55}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "#f3f1ec", radius: 4 }}
          />
          {useByFund ? (
            fundNames.map((name, i) => (
              <Bar
                key={name}
                dataKey={name}
                fill={FUND_COLORS[i % FUND_COLORS.length]}
                radius={[4, 4, 0, 0]}
                maxBarSize={24}
              />
            ))
          ) : (
            <Bar
              dataKey="total"
              fill="#C87D3A"
              radius={[4, 4, 0, 0]}
              maxBarSize={48}
            />
          )}
          {useByFund && (
            <Legend
              content={({ payload }) => (
                <div className="flex items-center gap-4 justify-center mt-3">
                  {payload?.map((entry) => (
                    <div
                      key={entry.value}
                      className="flex items-center gap-1.5"
                    >
                      <div
                        className="h-2.5 w-2.5 rounded-sm"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-[11px] text-[#8a8478]">
                        {entry.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
