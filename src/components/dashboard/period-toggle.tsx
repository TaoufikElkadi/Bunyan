"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

const PERIODS = [
  { key: "month", label: "Maand" },
  { key: "year", label: "Kalenderjaar" },
  { key: "all", label: "Totaal" },
] as const;

export function PeriodToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const current = searchParams.get("period") ?? "month";

  function handleClick(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (key === "month") {
      params.delete("period");
    } else {
      params.set("period", key);
    }
    const qs = params.toString();
    router.push(pathname + (qs ? "?" + qs : ""), { scroll: false });
  }

  return (
    <div className="flex items-center gap-1 rounded-xl bg-[#f3f1ec] p-1">
      {PERIODS.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => handleClick(key)}
          className={`px-3 py-1.5 text-[12px] font-medium rounded-lg transition-colors duration-150 ${
            current === key
              ? "bg-[#261b07] text-white"
              : "text-[#8a8478] hover:text-[#261b07]"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
