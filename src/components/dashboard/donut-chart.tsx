"use client";

import { useState } from "react";

type Segment = { label: string; value: number; color: string };

const FUND_COLORS = [
  "#C87D3A",
  "#6B8F71",
  "#3d3d3d",
  "#D4956A",
  "#7B8EAD",
  "#8a8478",
];

function formatEuros(cents: number): string {
  const euros = cents / 100;
  if (euros >= 1000) {
    return `€ ${new Intl.NumberFormat("nl-NL", { maximumFractionDigits: 0 }).format(euros)}`;
  }
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(euros);
}

function DonutSVG({
  segments,
  centerTop,
  centerBottom,
  hovered,
  onHover,
  size = 160,
  thickness = 32,
}: {
  segments: Segment[];
  centerTop: string;
  centerBottom: string;
  hovered: string | null;
  onHover: (label: string | null) => void;
  size?: number;
  thickness?: number;
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return null;

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const gapAngle = 0.012;
  const gapLength = gapAngle * circumference;

  let accumulated = 0;
  const arcs = segments
    .filter((s) => s.value > 0)
    .map((seg) => {
      const fraction = seg.value / total;
      const dashLength = Math.max(fraction * circumference - gapLength, 0);
      const gap = circumference - dashLength;
      const offset = -accumulated * circumference + circumference * 0.25;
      accumulated += fraction;
      return { ...seg, dashLength, gap, offset, fraction };
    });

  const activeArc = hovered ? arcs.find((a) => a.label === hovered) : null;

  return (
    <svg
      width={size + 12}
      height={size + 12}
      viewBox={`-6 -6 ${size + 12} ${size + 12}`}
      className="overflow-visible"
    >
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="#f3f1ec"
        strokeWidth={thickness}
      />
      {arcs.map((arc) => {
        const isHovered = hovered === arc.label;
        const isDimmed = hovered !== null && !isHovered;
        return (
          <circle
            key={arc.label}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={arc.color}
            strokeWidth={isHovered ? thickness + 6 : thickness}
            strokeDasharray={`${arc.dashLength} ${arc.gap}`}
            strokeDashoffset={arc.offset}
            className="transition-all duration-200 cursor-pointer"
            style={{
              opacity: isDimmed ? 0.25 : 1,
              filter: isHovered ? "brightness(1.1)" : "none",
            }}
            onMouseEnter={() => onHover(arc.label)}
            onMouseLeave={() => onHover(null)}
          />
        );
      })}
      <text
        x={center}
        y={center - 8}
        textAnchor="middle"
        className="fill-[#a09888]"
        style={{ fontSize: 11, fontWeight: 500 }}
      >
        {activeArc ? activeArc.label : centerTop}
      </text>
      <text
        x={center}
        y={center + 14}
        textAnchor="middle"
        className="fill-[#261b07]"
        style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.02em" }}
      >
        {activeArc ? formatEuros(activeArc.value) : centerBottom}
      </text>
    </svg>
  );
}

/* ── Legend row ──────────────────────────────────────────── */

function Legend({
  segments,
  total,
  hovered,
  onHover,
}: {
  segments: Segment[];
  total: number;
  hovered: string | null;
  onHover: (label: string | null) => void;
}) {
  return (
    <div className="space-y-2.5">
      {segments
        .filter((s) => s.value > 0)
        .map((seg) => {
          const pct = Math.round((seg.value / total) * 100);
          const isDimmed = hovered !== null && hovered !== seg.label;
          return (
            <button
              key={seg.label}
              className="flex items-center gap-2.5 w-full text-left transition-opacity duration-200 cursor-pointer"
              style={{ opacity: isDimmed ? 0.3 : 1 }}
              onMouseEnter={() => onHover(seg.label)}
              onMouseLeave={() => onHover(null)}
            >
              <span
                className="w-3 h-3 rounded-[3px] shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-[13px] text-[#261b07] font-medium truncate">
                {seg.label}
              </span>
              <span className="text-[12px] text-[#a09888] ml-auto shrink-0 tabular-nums">
                ({pct}%)
              </span>
            </button>
          );
        })}
    </div>
  );
}

/* ── Donation Distribution Card ─────────────────────────── */

type FundData = { name: string; total: number };

export function DonationDistributionCard({ data }: { data: FundData[] }) {
  const [hovered, setHovered] = useState<string | null>(null);

  const allTimeTotal = data.reduce((s, d) => s + d.total, 0);

  if (data.length === 0 || allTimeTotal === 0) {
    return (
      <div className="rounded-2xl bg-white border border-[#eae6de]/80 shadow-[0_1px_2px_rgba(38,27,7,0.03)] p-6">
        <h3 className="text-[13px] font-semibold text-[#261b07] mb-4">
          Donatieverdeling
        </h3>
        <p className="text-[12px] text-[#b5b0a5] py-8 text-center">
          Nog geen donaties om te verdelen
        </p>
      </div>
    );
  }

  const segments: Segment[] = data.slice(0, 6).map((fund, i) => ({
    label: fund.name,
    value: fund.total,
    color: FUND_COLORS[i % FUND_COLORS.length],
  }));

  return (
    <div className="rounded-2xl bg-white border border-[#eae6de]/80 shadow-[0_1px_2px_rgba(38,27,7,0.03)] p-6">
      <h3 className="text-[13px] font-semibold text-[#261b07] mb-5">
        Donatieverdeling
      </h3>
      <div className="flex items-center gap-8">
        <div className="shrink-0">
          <DonutSVG
            segments={segments}
            centerTop="Totaal"
            centerBottom={formatEuros(allTimeTotal)}
            hovered={hovered}
            onHover={setHovered}
          />
        </div>
        <Legend
          segments={segments}
          total={allTimeTotal}
          hovered={hovered}
          onHover={setHovered}
        />
      </div>
    </div>
  );
}

/* ── Fund Utilization Card ──────────────────────────────── */

export function FundUtilizationCard({
  data,
  recurringTotal,
}: {
  data: FundData[];
  recurringTotal: number;
}) {
  const [hovered, setHovered] = useState<string | null>(null);

  const allTimeTotal = data.reduce((s, d) => s + d.total, 0);
  const oneTimeTotal = allTimeTotal - recurringTotal;

  if (allTimeTotal === 0) {
    return (
      <div className="rounded-2xl bg-white border border-[#eae6de]/80 shadow-[0_1px_2px_rgba(38,27,7,0.03)] p-6">
        <h3 className="text-[13px] font-semibold text-[#261b07] mb-4">
          Donatietype
        </h3>
        <p className="text-[12px] text-[#b5b0a5] py-8 text-center">
          Nog geen donaties ontvangen
        </p>
      </div>
    );
  }

  const segments: Segment[] = [
    { label: "Terugkerend", value: recurringTotal, color: "#C87D3A" },
    { label: "Eenmalig", value: Math.max(oneTimeTotal, 0), color: "#6B8F71" },
  ];

  return (
    <div className="rounded-2xl bg-white border border-[#eae6de]/80 shadow-[0_1px_2px_rgba(38,27,7,0.03)] p-6">
      <h3 className="text-[13px] font-semibold text-[#261b07] mb-5">
        Donatietype
      </h3>
      <div className="flex items-center gap-8">
        <div className="shrink-0">
          <DonutSVG
            segments={segments}
            centerTop="Totaal"
            centerBottom={formatEuros(allTimeTotal)}
            hovered={hovered}
            onHover={setHovered}
          />
        </div>
        <Legend
          segments={segments}
          total={allTimeTotal}
          hovered={hovered}
          onHover={setHovered}
        />
      </div>
    </div>
  );
}
