"use client";

import useSWR from "swr";
import { Users, Heart, Gift, UserPlus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const SEGMENT_ICONS: Record<string, { icon: LucideIcon; color: string }> = {
  new_donors: { icon: UserPlus, color: "text-[#2563eb] bg-[#e0edff]" },
  loyal: { icon: Heart, color: "text-[#dc2626] bg-red-50" },
  ready_for_periodic: { icon: Gift, color: "text-[#7c3aed] bg-[#ede9fe]" },
  active: { icon: Users, color: "text-[#4a7c10] bg-[#e8f0d4]" },
};

type Segment = { key: string; label: string; count: number };

export function SegmentCards() {
  const { data, isLoading } = useSWR<{ segments: Segment[] }>(
    "/api/members/segments",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60_000,
    },
  );

  if (isLoading) {
    return (
      <div className="rounded-xl border border-[#e3dfd5] bg-white p-6">
        <div className="h-4 w-32 rounded bg-[#f3f1ec] animate-pulse mb-5" />
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-lg bg-[#f3f1ec] animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const segments = data?.segments;
  if (!segments) return null;

  return (
    <div className="rounded-xl border border-[#e3dfd5] bg-white p-6">
      <h3 className="text-[15px] font-semibold text-[#261b07] mb-1">
        Segmenten
      </h3>
      <p className="text-[12px] text-[#a09888] mb-5">
        Voorgedefinieerde groepen
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {segments.map((segment) => {
          const config = SEGMENT_ICONS[segment.key] ?? SEGMENT_ICONS.active;
          const Icon = config.icon;

          return (
            <div
              key={segment.key}
              className="flex items-center gap-3 rounded-lg border border-[#e3dfd5] p-3 hover:bg-[#fafaf8] transition-colors"
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${config.color}`}
              >
                <Icon className="h-4 w-4" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-[#8a8478] truncate">
                  {segment.label}
                </p>
                <p className="text-[18px] font-bold text-[#261b07] leading-tight tabular-nums">
                  {segment.count}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
