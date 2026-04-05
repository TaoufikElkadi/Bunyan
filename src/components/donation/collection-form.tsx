"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { eurosToCents, formatMoney } from "@/lib/money";
import { Check, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

interface FundOption {
  id: string;
  name: string;
  icon: string | null;
}

interface CollectionLine {
  fund_id: string;
  amount: string;
  label: string;
}

function getLastFriday(): string {
  const now = new Date();
  const day = now.getDay();
  // 0=Sun, 5=Fri. If today is Friday use today, otherwise go back
  const diff = day >= 5 ? day - 5 : day + 2;
  const friday = new Date(now);
  friday.setDate(now.getDate() - diff);
  return friday.toISOString().split("T")[0];
}

export function CollectionForm({ funds }: { funds: FundOption[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [date, setDate] = useState(getLastFriday);
  const [notes, setNotes] = useState("");

  // Initialize with one line per fund
  const [lines, setLines] = useState<CollectionLine[]>(
    funds.map((f) => ({ fund_id: f.id, amount: "", label: "" })),
  );

  // Extra lines (envelopes, loose cash, etc.)
  const [extraLines, setExtraLines] = useState<CollectionLine[]>([]);

  function updateLine(
    index: number,
    field: keyof CollectionLine,
    value: string,
  ) {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: value };
    setLines(updated);
  }

  function addExtraLine() {
    setExtraLines([
      ...extraLines,
      { fund_id: funds[0]?.id ?? "", amount: "", label: "" },
    ]);
  }

  function updateExtraLine(
    index: number,
    field: keyof CollectionLine,
    value: string,
  ) {
    const updated = [...extraLines];
    updated[index] = { ...updated[index], [field]: value };
    setExtraLines(updated);
  }

  function removeExtraLine(index: number) {
    setExtraLines(extraLines.filter((_, i) => i !== index));
  }

  const allLines = [...lines, ...extraLines];
  const totalCents = allLines.reduce((sum, line) => {
    const val = parseFloat(line.amount);
    return sum + (val > 0 ? eurosToCents(val) : 0);
  }, 0);

  const hasAnyAmount = allLines.some((l) => parseFloat(l.amount) > 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hasAnyAmount) {
      toast.error("Vul minimaal één bedrag in");
      return;
    }

    setLoading(true);

    try {
      const apiLines = allLines
        .filter((l) => parseFloat(l.amount) > 0)
        .map((l) => ({
          fund_id: l.fund_id,
          amount: eurosToCents(parseFloat(l.amount)),
          label: l.label.trim() || undefined,
        }));

      const res = await fetch("/api/donations/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: apiLines,
          date,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Er is iets misgegaan");
        return;
      }

      setSuccess(true);
      toast.success(`${data.count} donatie(s) geregistreerd`);
      router.refresh();
    } catch {
      toast.error("Er is iets misgegaan");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(38,27,7,0.04)] p-8">
        <div className="flex flex-col items-center text-center py-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e8f0d4] mb-4">
            <Check className="h-7 w-7 text-[#4a7c10]" strokeWidth={2} />
          </div>
          <h2 className="text-[20px] font-bold text-[#261b07] mb-1">
            Inzameling geregistreerd
          </h2>
          <p className="text-[14px] text-[#a09888] mb-1">
            Totaal:{" "}
            <span className="font-semibold text-[#261b07]">
              {formatMoney(totalCents)}
            </span>
          </p>
          <p className="text-[13px] text-[#b5b0a5] mb-6">{date}</p>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setSuccess(false);
                setLines(
                  funds.map((f) => ({ fund_id: f.id, amount: "", label: "" })),
                );
                setExtraLines([]);
                setNotes("");
                setDate(getLastFriday());
              }}
              className="inline-flex items-center justify-center rounded-lg border border-[#e3dfd5] bg-white px-5 py-2.5 text-[13px] font-medium text-[#261b07] hover:bg-[#f3f1ec] transition-colors"
            >
              Nog een inzameling
            </button>
            <Link
              href="/donaties"
              className="inline-flex items-center justify-center rounded-lg bg-[#261b07] px-5 py-2.5 text-[13px] font-semibold text-[#f8f7f5] hover:bg-[#3a2c14] transition-colors"
            >
              Bekijk donaties
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(38,27,7,0.04)] overflow-hidden">
        {/* Date + notes header */}
        <div className="px-6 pt-6 pb-5 border-b border-[#e3dfd5]/60">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[12px] font-medium text-[#8a8478] uppercase tracking-wide mb-1.5">
                Datum
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-[#e3dfd5] bg-white px-4 py-2.5 text-[14px] text-[#261b07] outline-none focus:border-[#261b07]/30 focus:ring-1 focus:ring-[#261b07]/10 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#8a8478] uppercase tracking-wide mb-1.5">
                Omschrijving (optioneel)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="bijv. Jummah, Ramadan dag 15"
                className="w-full rounded-lg border border-[#e3dfd5] bg-white px-4 py-2.5 text-[14px] text-[#261b07] placeholder:text-[#b5b0a5] outline-none focus:border-[#261b07]/30 focus:ring-1 focus:ring-[#261b07]/10 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Fund lines */}
        <div className="px-6 py-5">
          <label className="block text-[12px] font-medium text-[#8a8478] uppercase tracking-wide mb-3">
            Opbrengst per fonds
          </label>

          <div className="space-y-3">
            {lines.map((line, i) => {
              const fund = funds.find((f) => f.id === line.fund_id);
              return (
                <div key={line.fund_id} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 w-[160px] shrink-0">
                    {fund?.icon && (
                      <span className="text-[16px]">{fund.icon}</span>
                    )}
                    <span className="text-[14px] font-medium text-[#261b07] truncate">
                      {fund?.name}
                    </span>
                  </div>
                  <div className="relative flex-1 max-w-[200px]">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-[#b5b0a5]">
                      €
                    </span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      value={line.amount}
                      onChange={(e) => updateLine(i, "amount", e.target.value)}
                      placeholder="0,00"
                      className="w-full rounded-lg border border-[#e3dfd5] bg-white pl-8 pr-4 py-2.5 text-[14px] text-[#261b07] tabular-nums outline-none focus:border-[#261b07]/30 focus:ring-1 focus:ring-[#261b07]/10 transition-colors"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Extra lines (envelopes, loose cash) */}
        {extraLines.length > 0 && (
          <div className="px-6 pb-5 pt-0">
            <label className="block text-[12px] font-medium text-[#8a8478] uppercase tracking-wide mb-3">
              Extra posten
            </label>
            <div className="space-y-3">
              {extraLines.map((line, i) => (
                <div key={i} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={line.label}
                    onChange={(e) =>
                      updateExtraLine(i, "label", e.target.value)
                    }
                    placeholder="bijv. Enveloppen, Losse giften"
                    className="w-[160px] shrink-0 rounded-lg border border-[#e3dfd5] bg-white px-3 py-2.5 text-[13px] text-[#261b07] placeholder:text-[#b5b0a5] outline-none focus:border-[#261b07]/30 focus:ring-1 focus:ring-[#261b07]/10 transition-colors"
                  />
                  <select
                    value={line.fund_id}
                    onChange={(e) =>
                      updateExtraLine(i, "fund_id", e.target.value)
                    }
                    className="rounded-lg border border-[#e3dfd5] bg-white px-3 py-2.5 text-[13px] text-[#261b07] outline-none focus:border-[#261b07]/30 transition-colors"
                  >
                    {funds.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.icon ? `${f.icon} ` : ""}
                        {f.name}
                      </option>
                    ))}
                  </select>
                  <div className="relative flex-1 max-w-[200px]">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-[#b5b0a5]">
                      €
                    </span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      value={line.amount}
                      onChange={(e) =>
                        updateExtraLine(i, "amount", e.target.value)
                      }
                      placeholder="0,00"
                      className="w-full rounded-lg border border-[#e3dfd5] bg-white pl-8 pr-4 py-2.5 text-[14px] text-[#261b07] tabular-nums outline-none focus:border-[#261b07]/30 focus:ring-1 focus:ring-[#261b07]/10 transition-colors"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeExtraLine(i)}
                    className="p-1.5 text-[#b5b0a5] hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add extra line button */}
        <div className="px-6 pb-5">
          <button
            type="button"
            onClick={addExtraLine}
            className="flex items-center gap-1.5 text-[13px] font-medium text-[#8a8478] hover:text-[#261b07] transition-colors"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
            Extra post toevoegen
          </button>
        </div>

        {/* Footer with total + submit */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#fafaf8] border-t border-[#e3dfd5]/60">
          <div>
            <p className="text-[12px] font-medium text-[#8a8478] uppercase tracking-wide">
              Totaal
            </p>
            <p className="text-[24px] font-bold text-[#261b07] tracking-tight tabular-nums leading-none mt-1">
              {formatMoney(totalCents)}
            </p>
          </div>
          <button
            type="submit"
            disabled={loading || !hasAnyAmount}
            className="inline-flex items-center justify-center rounded-lg bg-[#261b07] px-6 py-2.5 text-[14px] font-semibold text-[#f8f7f5] hover:bg-[#3a2c14] disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-[#f8f7f5] border-t-transparent animate-spin" />
                Bezig...
              </span>
            ) : (
              "Registreren"
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
