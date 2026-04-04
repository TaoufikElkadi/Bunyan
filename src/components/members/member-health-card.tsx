"use client";

import useSWR from "swr";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { AlertTriangle, ArrowRight, Users } from "lucide-react";
import type { MemberStats } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function MemberHealthCard() {
  const { data, isLoading } = useSWR<{ stats: MemberStats }>(
    "/api/members/stats",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60_000,
    },
  );

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(38,27,7,0.04),0_1px_2px_rgba(38,27,7,0.02)]">
        <div className="h-4 w-32 rounded bg-[#f3f1ec] animate-pulse mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-3 rounded bg-[#f3f1ec] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const stats = data?.stats;
  if (!stats || stats.total_donors === 0) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(38,27,7,0.04),0_1px_2px_rgba(38,27,7,0.02)]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[13px] font-semibold text-[#261b07]">
            Betrokkenheid
          </h3>
        </div>
        <div className="flex flex-col items-center py-4">
          <Users className="h-5 w-5 text-[#b5b0a5] mb-2" strokeWidth={1.5} />
          <p className="text-[11px] text-[#a09888] text-center">
            Nog geen leden. Zodra er donaties binnenkomen, verschijnen hier
            inzichten.
          </p>
        </div>
      </div>
    );
  }

  const totalIdentified = stats.total_donors - stats.anonymous;
  const retentionRate =
    totalIdentified > 0
      ? Math.round((stats.active / totalIdentified) * 100)
      : 0;

  const bars = [
    { label: "Actief", count: stats.active, color: "bg-[#4a7c10]" },
    { label: "Vervallen", count: stats.lapsed, color: "bg-[#f59e0b]" },
    { label: "Inactief", count: stats.inactive, color: "bg-red-400" },
    { label: "Anoniem", count: stats.anonymous, color: "bg-[#d5cfb8]" },
  ];

  const maxCount = Math.max(...bars.map((b) => b.count), 1);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(38,27,7,0.04),0_1px_2px_rgba(38,27,7,0.02)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-semibold text-[#261b07]">
          Betrokkenheid
        </h3>
        <Link
          href="/leden"
          className="text-[11px] font-medium text-[#a09888] hover:text-[#261b07] transition-colors flex items-center gap-0.5"
        >
          Bekijk
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="space-y-2.5">
        {bars.map((bar) => (
          <div key={bar.label} className="flex items-center gap-3">
            <div className="w-[60px] text-[11px] text-[#8a8478] shrink-0">
              {bar.label}
            </div>
            <div className="flex-1 h-2.5 rounded-full bg-[#f3f1ec] overflow-hidden">
              <div
                className={`h-full rounded-full ${bar.color} transition-all duration-500`}
                style={{
                  width: `${Math.max((bar.count / maxCount) * 100, bar.count > 0 ? 4 : 0)}%`,
                }}
              />
            </div>
            <span className="text-[11px] font-medium text-[#261b07] tabular-nums w-[28px] text-right">
              {bar.count}
            </span>
          </div>
        ))}
      </div>

      {stats.high_churn_risk > 0 && (
        <Link
          href="/leden?risk=high"
          className="flex items-center gap-2 mt-4 px-3 py-2 rounded-lg bg-[#fef3cd]/50 border border-[#fde68a]/60 hover:bg-[#fef3cd] transition-colors"
        >
          <AlertTriangle
            className="h-3.5 w-3.5 text-[#8a6d00] shrink-0"
            strokeWidth={1.5}
          />
          <span className="text-[11px] text-[#8a6d00]">
            <span className="font-semibold">{stats.high_churn_risk}</span> leden
            dreigen te stoppen
          </span>
        </Link>
      )}

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#e3dfd5]/60">
        <div className="text-[11px] text-[#a09888]">
          Trouwe gevers{" "}
          <span className="font-semibold text-[#261b07]">{retentionRate}%</span>
        </div>
        <div className="text-[11px] text-[#a09888]">
          Gem. gift{" "}
          <span className="font-semibold text-[#261b07]">
            {formatMoney(stats.avg_donation)}
          </span>
        </div>
      </div>
    </div>
  );
}
