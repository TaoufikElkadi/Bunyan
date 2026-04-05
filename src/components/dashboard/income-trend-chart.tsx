"use client";

import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export type MonthlyTotalSplit = {
  month: string; // "YYYY-MM"
  total: number; // integer cents
  one_time: number; // integer cents
  recurring: number; // integer cents
};

interface Props {
  data: MonthlyTotalSplit[];
}

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

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

const MONTH_INDEX: Record<string, number> = {
  "01": 0,
  "02": 1,
  "03": 2,
  "04": 3,
  "05": 4,
  "06": 5,
  "07": 6,
  "08": 7,
  "09": 8,
  "10": 9,
  "11": 10,
  "12": 11,
};

const TIME_RANGES = [
  { key: "3M", label: "3M", months: 3 },
  { key: "6M", label: "6M", months: 6 },
  { key: "JTD", label: "JTD", months: 0, ytd: true },
  { key: "1J", label: "1J", months: 12 },
  { key: "Alles", label: "Alles", months: 0 },
] as const;

const SERIES = [
  { key: "total", label: "Totaal", color: "#C87D3A", width: 2.5 },
] as const;

const YEAR_COLORS = [
  "#C87D3A",
  "#6B8F71",
  "#7B8EAD",
  "#D4956A",
  "#9b6dbb",
  "#4a9ec2",
  "#8a8478",
  "#f9a600",
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function formatFullMonth(month: string): string {
  const [year, m] = month.split("-");
  return `${DUTCH_MONTHS[m] ?? m} ${year}`;
}

function formatEuros(cents: number): string {
  const euros = cents / 100;
  if (euros >= 1000) {
    return `\u20AC${(euros / 1000).toFixed(1).replace(".0", "")}k`;
  }
  return `\u20AC${euros.toLocaleString("nl-NL", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

const euroFormatter = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function formatEurosFull(cents: number): string {
  return euroFormatter.format(cents / 100);
}

/* ------------------------------------------------------------------ */
/*  Custom tooltip                                                    */
/* ------------------------------------------------------------------ */

type TooltipEntry = {
  dataKey: string;
  value: number;
  color: string;
  name: string;
  payload: Record<string, unknown>;
};

type YoYTooltipProps = {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
  yoyMode: boolean;
  checkedYears: number[];
};

function CustomTooltip({
  active,
  payload,
  label,
  yoyMode,
  checkedYears,
}: YoYTooltipProps) {
  if (!active || !payload?.length) return null;

  if (yoyMode && checkedYears.length > 1) {
    return (
      <div className="rounded-xl bg-[#261b07] px-4 py-3 shadow-lg min-w-[160px]">
        <p className="text-[12px] font-bold text-white mb-1.5">{label}</p>
        {payload.map((entry, i) => {
          const parts = (entry.dataKey as string).split("_");
          const year = parts[parts.length - 1];
          const yearIdx = checkedYears.indexOf(parseInt(year, 10));
          const color =
            yearIdx >= 0
              ? YEAR_COLORS[yearIdx % YEAR_COLORS.length]
              : entry.color;
          return (
            <div
              key={entry.dataKey}
              className="flex items-center justify-between gap-4 py-0.5"
            >
              <div className="flex items-center gap-1.5">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-[11px] text-[#d5cfb8]">{year}</span>
              </div>
              <span className="text-[11px] font-medium text-white tabular-nums">
                {formatEurosFull(entry.value)}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-[#261b07] px-4 py-3 shadow-lg min-w-[160px]">
      <p className="text-[12px] font-bold text-white mb-1.5">{label}</p>
      {payload.map((entry) => {
        const series = SERIES.find((s) => s.key === entry.dataKey);
        return (
          <div
            key={entry.dataKey}
            className="flex items-center justify-between gap-4 py-0.5"
          >
            <div className="flex items-center gap-1.5">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: series?.color ?? entry.color }}
              />
              <span className="text-[11px] text-[#d5cfb8]">
                {series?.label ?? entry.name}
              </span>
            </div>
            <span className="text-[11px] font-medium text-white tabular-nums">
              {formatEurosFull(entry.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function IncomeTrendChart({ data }: Props) {
  const [range, setRange] = useState<string>("1J");

  // Extract unique years from data
  const allYears = useMemo(() => {
    const years = new Set<number>();
    for (const d of data) {
      const y = parseInt(d.month.split("-")[0], 10);
      if (!isNaN(y)) years.add(y);
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [data]);

  const [checkedYears, setCheckedYears] = useState<Set<number>>(() => {
    const set = new Set<number>();
    if (allYears.length > 0) set.add(allYears[0]);
    if (allYears.length > 1) set.add(allYears[1]);
    return set;
  });

  const showYoYControls = allYears.length > 1;
  const yoyActive = showYoYControls && checkedYears.size >= 2;

  // Filter data by selected time range
  const visibleData = useMemo(() => {
    if (data.length === 0) return [];
    const selected = TIME_RANGES.find((r) => r.key === range);
    if (selected && "ytd" in selected && selected.ytd) {
      const currentYear = new Date().getFullYear().toString();
      return data.filter((d) => d.month.startsWith(currentYear));
    }
    const sliceCount = selected?.months || data.length;
    return data.slice(-sliceCount);
  }, [data, range]);

  // Period total
  const periodTotal = useMemo(
    () => visibleData.reduce((sum, d) => sum + d.total, 0),
    [visibleData],
  );

  // Previous period comparison
  const { prevTotal, pctChange, hasComparison } = useMemo(() => {
    if (visibleData.length === 0 || data.length === 0) {
      return { prevTotal: 0, pctChange: 0, hasComparison: false };
    }
    const periodLength = visibleData.length;
    const allIdx = data.indexOf(visibleData[0]);
    const prevSlice =
      allIdx > 0 ? data.slice(Math.max(0, allIdx - periodLength), allIdx) : [];
    const prev = prevSlice.reduce((sum, d) => sum + d.total, 0);
    const pct = prev > 0 ? ((periodTotal - prev) / prev) * 100 : 0;
    return {
      prevTotal: prev,
      pctChange: pct,
      hasComparison: prevSlice.length > 0 && prev > 0,
    };
  }, [data, visibleData, periodTotal]);

  // Build chart data
  type LineKeyDef = {
    dataKey: string;
    color: string;
    width: number;
    dashed: boolean;
    opacity: number;
  };

  const { chartData, lineKeys } = useMemo((): {
    chartData: Record<string, string | number>[];
    lineKeys: LineKeyDef[];
  } => {
    if (visibleData.length === 0) {
      return { chartData: [], lineKeys: [] };
    }

    const checkedArr = Array.from(checkedYears).sort((a, b) => b - a);

    if (yoyActive) {
      // YoY mode: x-axis is month index (0-11), overlay years
      const monthMap = new Map<number, Record<string, string | number>>();

      // Initialize all 12 months
      for (let i = 0; i < 12; i++) {
        const mm = String(i + 1).padStart(2, "0");
        monthMap.set(i, { monthLabel: DUTCH_MONTHS[mm] ?? mm });
      }

      // Fill in data for checked years
      for (const d of data) {
        const [yearStr, monthStr] = d.month.split("-");
        const year = parseInt(yearStr, 10);
        if (!checkedYears.has(year)) continue;
        const idx = MONTH_INDEX[monthStr];
        if (idx === undefined) continue;
        const entry = monthMap.get(idx)!;
        entry[`total_${year}`] = d.total;
        entry[`recurring_${year}`] = d.recurring;
        entry[`one_time_${year}`] = d.one_time;
      }

      const keys: LineKeyDef[] = [];

      for (let i = 0; i < checkedArr.length; i++) {
        const year = checkedArr[i];
        const yearColor = YEAR_COLORS[i % YEAR_COLORS.length];
        for (const s of SERIES) {
          keys.push({
            dataKey: `${s.key}_${year}`,
            color: yearColor,
            width: s.width,
            dashed: false,
            opacity: 1,
          });
        }
      }

      return {
        chartData: Array.from(monthMap.entries())
          .sort(([a], [b]) => a - b)
          .map(([, v]) => v),
        lineKeys: keys,
      };
    }

    // Normal mode
    const normal: Record<string, string | number>[] = visibleData.map((d) => ({
      label: formatFullMonth(d.month),
      total: d.total,
      recurring: d.recurring,
      one_time: d.one_time,
    }));

    const keys: LineKeyDef[] = SERIES.map((s) => ({
      dataKey: s.key,
      color: s.color,
      width: s.width,
      dashed: false,
      opacity: 1,
    }));

    return { chartData: normal, lineKeys: keys };
  }, [visibleData, data, yoyActive, checkedYears]);

  // Toggle a year checkbox
  function toggleYear(year: number) {
    setCheckedYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) {
        // Don't allow unchecking the last year
        if (next.size > 1) next.delete(year);
      } else {
        next.add(year);
      }
      return next;
    });
  }

  const xDataKey = yoyActive ? "monthLabel" : "label";
  const checkedArr = Array.from(checkedYears).sort((a, b) => b - a);

  // Empty state
  if (data.length === 0) {
    return (
      <div className="rounded-2xl bg-white border border-[#eae6de]/80 shadow-[0_1px_2px_rgba(38,27,7,0.03)] px-6 py-5">
        <div className="flex items-center justify-center h-[300px]">
          <p className="text-[13px] text-[#a09888]">
            Nog geen gegevens beschikbaar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white border border-[#eae6de]/80 shadow-[0_1px_2px_rgba(38,27,7,0.03)] px-6 py-5">
      {/* Header: title + range toggles */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] font-semibold text-[#261b07]">Inkomsten</h3>
        <div className="flex items-center gap-1 rounded-xl bg-[#f3f1ec] p-1">
          {TIME_RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors duration-150 ${
                range === r.key
                  ? "bg-[#261b07] text-white"
                  : "text-[#8a8478] hover:text-[#261b07]"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary number */}
      <div className="mb-4">
        <div className="flex items-baseline gap-3">
          <p className="text-[28px] font-bold text-[#261b07]">
            {formatEurosFull(periodTotal)}
          </p>
          {hasComparison && (
            <span className="text-[12px] text-[#8a8478]">
              vs {formatEurosFull(prevTotal)}{" "}
              <span
                className={pctChange >= 0 ? "text-emerald-600" : "text-red-500"}
              >
                {pctChange >= 0 ? "\u2191" : "\u2193"}
                {Math.abs(pctChange).toFixed(1)}%
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Year checkboxes for YoY overlay */}
      {showYoYControls && (
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[11px] text-[#a09888]">Vergelijk:</span>
          {allYears.map((year) => (
            <label
              key={year}
              className="flex items-center gap-1.5 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={checkedYears.has(year)}
                onChange={() => toggleYear(year)}
                className="h-3.5 w-3.5 rounded border-[#d5cfb8] text-[#C87D3A] accent-[#C87D3A]"
              />
              <span className="text-[11px] font-medium text-[#8a8478]">
                {year}
              </span>
            </label>
          ))}
        </div>
      )}

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e3dfd5"
            vertical={false}
          />
          <XAxis
            dataKey={xDataKey}
            tick={{ fontSize: 11, fill: "#a09888" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#a09888" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => formatEuros(v)}
            width={55}
          />
          <Tooltip
            content={
              <CustomTooltip yoyMode={yoyActive} checkedYears={checkedArr} />
            }
          />
          {lineKeys.map((lk) => (
            <Line
              key={lk.dataKey}
              type="monotone"
              dataKey={lk.dataKey}
              stroke={lk.color}
              strokeWidth={lk.width}
              strokeDasharray={lk.dashed ? "6 4" : undefined}
              strokeOpacity={lk.opacity}
              dot={false}
              activeDot={{
                r: 4,
                fill: lk.color,
                stroke: "#fff",
                strokeWidth: 2,
              }}
              animationDuration={500}
              connectNulls={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center gap-6 justify-center mt-4">
        {yoyActive
          ? checkedArr.map((year, i) => (
              <div
                key={year}
                className="flex items-center gap-1.5 text-[11px] text-[#8a8478]"
              >
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    backgroundColor: YEAR_COLORS[i % YEAR_COLORS.length],
                  }}
                />
                {year}
              </div>
            ))
          : SERIES.map((s) => (
              <div
                key={s.key}
                className="flex items-center gap-1.5 text-[11px] text-[#8a8478]"
              >
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                {s.label}
              </div>
            ))}
      </div>
    </div>
  );
}
