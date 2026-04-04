import { getCachedProfile } from "@/lib/supabase/cached";
import { getPlanLimits } from "@/lib/plan";
import { formatMoney } from "@/lib/money";
import {
  computeMemberStatus,
  computeChurnRisk,
  daysSince,
} from "@/lib/member-status";
import { MemberStatusBadge } from "@/components/members/member-status-badge";
import { ChurnRiskIndicator } from "@/components/members/churn-risk-indicator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConversionFunnel } from "@/components/members/conversion-funnel";
import { SegmentCards } from "@/components/members/segment-cards";
import { AlertBanner } from "@/components/members/alert-banner";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Users, Lock, Download } from "lucide-react";
import type { MemberStatus, ChurnRisk } from "@/types";

interface EnrichedDonor {
  id: string;
  mosque_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  tags: string[] | null;
  total_donated: number;
  donation_count: number;
  first_donated_at: string | null;
  last_donated_at: string | null;
  created_at: string;
  updated_at: string;
  avg_donation_amount: number | null;
  donation_frequency: string | null;
  estimated_annual: number | null;
  iban_hint: string | null;
  has_active_recurring: boolean;
  has_active_periodic: boolean;
  total_count: number;
}

export const revalidate = 60;

const PAGE_SIZE = 50;

const STATUS_OPTIONS: { value: MemberStatus | ""; label: string }[] = [
  { value: "", label: "Alle statussen" },
  { value: "periodic", label: "Periodiek" },
  { value: "active", label: "Actief" },
  { value: "lapsed", label: "Vervallen" },
  { value: "inactive", label: "Inactief" },
  { value: "anonymous", label: "Anoniem" },
  { value: "identified", label: "Bekend" },
];

const RISK_OPTIONS: { value: ChurnRisk | ""; label: string }[] = [
  { value: "", label: "Alle risico's" },
  { value: "low", label: "Laag risico" },
  { value: "medium", label: "Gemiddeld risico" },
  { value: "high", label: "Hoog risico" },
];

export default async function LedenPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    status?: string;
    risk?: string;
    anonymous?: string;
    periodic?: string;
  }>;
}) {
  const { mosqueId, mosque, supabase } = await getCachedProfile();

  if (!mosqueId) return null;

  const limits = getPlanLimits(mosque?.plan ?? "free");
  if (!limits.hasMemberIntelligence) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.5px] text-[#261b07]">
            Leden
          </h1>
          <p className="text-[14px] text-[#8a8478] mt-1">
            Ledenintelligentie en gemeenschapsinzichten
          </p>
        </div>
        <div className="rounded-xl border border-[#e3dfd5] bg-white">
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="rounded-full bg-[#f3f1ec] p-5 mb-5">
              <Lock className="h-7 w-7 text-[#a09888]" strokeWidth={1.5} />
            </div>
            <h3 className="text-[14px] font-medium text-[#261b07] mb-1.5">
              Upgrade vereist
            </h3>
            <p className="text-[13px] text-[#a09888] text-center max-w-sm leading-relaxed">
              Ledenintelligentie is beschikbaar vanaf het Starter-abonnement.
              Upgrade om inzichten in uw gemeenschap te krijgen.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const params = await searchParams;
  const statusFilter = (params.status ?? "") as MemberStatus | "";
  const riskFilter = (params.risk ?? "") as ChurnRisk | "";
  const showAnonymous =
    params.anonymous === "1" || statusFilter === "anonymous";

  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const hasComputedFilters =
    !!statusFilter || !!riskFilter || params.periodic === "no";

  type EnrichedMember = EnrichedDonor & {
    member_status: MemberStatus;
    churn_risk: ChurnRisk;
    days_since_last: number | null;
  };

  function enrichAndFilter(rows: EnrichedDonor[]): EnrichedMember[] {
    const enriched = rows.map((donor) => ({
      ...donor,
      member_status: computeMemberStatus({
        email: donor.email,
        name: donor.name,
        last_donated_at: donor.last_donated_at,
        has_active_recurring: donor.has_active_recurring,
        has_active_periodic: donor.has_active_periodic,
      }),
      churn_risk: computeChurnRisk({
        email: donor.email,
        name: donor.name,
        last_donated_at: donor.last_donated_at,
        has_active_recurring: donor.has_active_recurring,
        has_active_periodic: donor.has_active_periodic,
      }),
      days_since_last: daysSince(donor.last_donated_at),
    }));
    return enriched.filter((m) => {
      if (statusFilter && m.member_status !== statusFilter) return false;
      if (riskFilter && m.churn_risk !== riskFilter) return false;
      if (params.periodic === "no" && m.has_active_periodic) return false;
      return true;
    });
  }

  let members: EnrichedMember[];
  let filteredCount: number;

  if (!hasComputedFilters) {
    const dbOffset = (page - 1) * PAGE_SIZE;
    const { data: donors } = await supabase.rpc("get_enriched_donors", {
      p_mosque_id: mosqueId,
      p_include_anonymous: showAnonymous,
      p_limit: PAGE_SIZE,
      p_offset: dbOffset,
    });
    const rows = (donors ?? []) as unknown as EnrichedDonor[];
    filteredCount = Number(rows[0]?.total_count ?? 0) || rows.length;
    members = rows.map((donor) => ({
      ...donor,
      member_status: computeMemberStatus({
        email: donor.email,
        name: donor.name,
        last_donated_at: donor.last_donated_at,
        has_active_recurring: donor.has_active_recurring,
        has_active_periodic: donor.has_active_periodic,
      }),
      churn_risk: computeChurnRisk({
        email: donor.email,
        name: donor.name,
        last_donated_at: donor.last_donated_at,
        has_active_recurring: donor.has_active_recurring,
        has_active_periodic: donor.has_active_periodic,
      }),
      days_since_last: daysSince(donor.last_donated_at),
    }));
  } else {
    const BATCH_SIZE = 200;
    const skipTarget = (page - 1) * PAGE_SIZE;
    const collected: EnrichedMember[] = [];
    let totalMatched = 0;
    let dbOffset = 0;
    let exhausted = false;

    while (!exhausted) {
      const { data: donors } = await supabase.rpc("get_enriched_donors", {
        p_mosque_id: mosqueId,
        p_include_anonymous: showAnonymous,
        p_limit: BATCH_SIZE,
        p_offset: dbOffset,
      });
      const rows = (donors ?? []) as unknown as EnrichedDonor[];
      if (rows.length < BATCH_SIZE) exhausted = true;
      dbOffset += rows.length;

      const matched = enrichAndFilter(rows);
      for (const m of matched) {
        totalMatched++;
        if (totalMatched > skipTarget && collected.length < PAGE_SIZE) {
          collected.push(m);
        }
      }

      if (rows.length === 0) break;
      if (collected.length >= PAGE_SIZE && exhausted) break;
    }

    // If we filled the page but haven't exhausted the DB, scan remaining for count
    if (!exhausted && collected.length >= PAGE_SIZE) {
      while (!exhausted) {
        const { data: donors } = await supabase.rpc("get_enriched_donors", {
          p_mosque_id: mosqueId,
          p_include_anonymous: showAnonymous,
          p_limit: 500,
          p_offset: dbOffset,
        });
        const rows = (donors ?? []) as unknown as EnrichedDonor[];
        if (rows.length === 0) break;
        if (rows.length < 500) exhausted = true;
        dbOffset += rows.length;
        totalMatched += enrichAndFilter(rows).length;
      }
    }

    filteredCount = totalMatched;
    members = collected;
  }

  const totalPages = Math.ceil(filteredCount / PAGE_SIZE);

  // Build filter URL helper
  function filterUrl(overrides: Record<string, string>) {
    const p = new URLSearchParams();
    if (overrides.status ?? statusFilter)
      p.set("status", overrides.status ?? statusFilter);
    if (overrides.risk ?? riskFilter)
      p.set("risk", overrides.risk ?? riskFilter);
    if (showAnonymous && !overrides.anonymous) p.set("anonymous", "1");
    if (overrides.anonymous) p.set("anonymous", overrides.anonymous);
    if (overrides.page) p.set("page", overrides.page);
    const qs = p.toString();
    return `/leden${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.5px] text-[#261b07]">
            Leden
          </h1>
          <p className="text-[14px] text-[#8a8478] mt-1">
            Overzicht van uw gemeenschap en donateurs
          </p>
        </div>
        {limits.hasCsvExport && (
          <a
            href="/api/donors/export"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border border-[#e3dfd5] bg-white text-[13px] font-medium text-[#261b07] hover:bg-[#f3f1ec] transition-colors"
            download
          >
            <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
            Exporteren
          </a>
        )}
      </div>

      {/* Filters — scrollable on mobile */}
      <div className="-mx-6 px-6 md:mx-0 md:px-0 overflow-x-auto scrollbar-none">
        <div className="flex gap-2 min-w-max pb-1">
          {STATUS_OPTIONS.map((opt) => (
            <Link
              key={opt.value || "all-status"}
              href={filterUrl({ status: opt.value, page: "1" })}
              className={`inline-flex items-center h-9 sm:h-8 px-3.5 sm:px-3 rounded-lg border text-[12px] font-medium transition-colors whitespace-nowrap ${
                statusFilter === opt.value
                  ? "bg-[#261b07] text-white border-[#261b07]"
                  : "bg-white text-[#8a8478] border-[#e3dfd5] hover:bg-[#f3f1ec] hover:text-[#261b07]"
              }`}
            >
              {opt.label}
            </Link>
          ))}
          <div className="w-px h-8 sm:h-8 self-center bg-[#e3dfd5] shrink-0" />
          {RISK_OPTIONS.map((opt) => (
            <Link
              key={opt.value || "all-risk"}
              href={filterUrl({ risk: opt.value, page: "1" })}
              className={`inline-flex items-center h-9 sm:h-8 px-3.5 sm:px-3 rounded-lg border text-[12px] font-medium transition-colors whitespace-nowrap ${
                riskFilter === opt.value
                  ? "bg-[#261b07] text-white border-[#261b07]"
                  : "bg-white text-[#8a8478] border-[#e3dfd5] hover:bg-[#f3f1ec] hover:text-[#261b07]"
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Alerts (growth only) */}
      {limits.hasMemberAlerts && <AlertBanner />}

      {/* Funnel + Segments (growth only) */}
      {limits.hasMemberSegments && (
        <div className="grid gap-6 lg:grid-cols-2">
          <ConversionFunnel />
          <SegmentCards />
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-[#e3dfd5] bg-white overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <h3 className="text-[15px] font-semibold text-[#261b07]">
            {statusFilter || riskFilter ? "Gefilterde leden" : "Alle leden"}
          </h3>
          {filteredCount > 0 && (
            <span className="text-[12px] text-[#a09888] tabular-nums">
              {filteredCount} totaal
            </span>
          )}
        </div>

        {members.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-[#e3dfd5]">
                  <TableHead className="h-10 px-4 sm:px-6 text-[12px] font-medium text-[#a09888] uppercase tracking-wide">
                    Naam
                  </TableHead>
                  <TableHead className="h-10 px-4 text-[12px] font-medium text-[#a09888] uppercase tracking-wide hidden sm:table-cell">
                    Status
                  </TableHead>
                  <TableHead className="h-10 px-4 text-[12px] font-medium text-[#a09888] uppercase tracking-wide hidden md:table-cell">
                    Verloop
                  </TableHead>
                  <TableHead className="h-10 px-4 text-[12px] font-medium text-[#a09888] uppercase tracking-wide text-right hidden sm:table-cell">
                    Totaal
                  </TableHead>
                  <TableHead className="h-10 px-4 text-[12px] font-medium text-[#a09888] uppercase tracking-wide text-right hidden sm:table-cell">
                    Donaties
                  </TableHead>
                  <TableHead className="h-10 px-4 text-[12px] font-medium text-[#a09888] uppercase tracking-wide hidden lg:table-cell">
                    Frequentie
                  </TableHead>
                  <TableHead className="h-10 px-6 text-[12px] font-medium text-[#a09888] uppercase tracking-wide hidden md:table-cell">
                    Laatste donatie
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow
                    key={member.id}
                    className="hover:bg-[#fafaf8] border-[#e3dfd5]/60"
                  >
                    <TableCell className="px-4 sm:px-6 py-3 sm:py-4 text-[13px] font-medium">
                      <Link
                        href={`/leden/${member.id}`}
                        className="text-[#261b07] hover:text-[#C87D3A] underline-offset-4 hover:underline transition-colors"
                      >
                        {member.name ?? (
                          <span className="text-[#b5b0a5] italic">Anoniem</span>
                        )}
                      </Link>
                      {member.email && (
                        <p className="text-[11px] text-[#a09888] mt-0.5 truncate max-w-[180px]">
                          {member.email}
                        </p>
                      )}
                      {/* Mobile-only: show status + amount below name */}
                      <div className="flex items-center gap-2 mt-1.5 sm:hidden">
                        <MemberStatusBadge status={member.member_status} />
                        <span className="text-[12px] font-semibold text-[#261b07] tabular-nums">
                          {formatMoney(member.total_donated)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4 hidden sm:table-cell">
                      <MemberStatusBadge status={member.member_status} />
                    </TableCell>
                    <TableCell className="px-4 py-4 hidden md:table-cell">
                      <ChurnRiskIndicator risk={member.churn_risk} />
                    </TableCell>
                    <TableCell className="px-4 py-4 text-[13px] text-right font-semibold tabular-nums text-[#261b07] hidden sm:table-cell">
                      {formatMoney(member.total_donated)}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-right hidden sm:table-cell">
                      <span className="inline-flex items-center justify-center min-w-[1.75rem] rounded-md bg-[#f3f1ec] px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-[#8a8478]">
                        {member.donation_count}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-[12px] text-[#8a8478] hidden lg:table-cell capitalize">
                      {member.donation_frequency ?? "-"}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-[13px] text-[#8a8478] hidden md:table-cell">
                      {member.last_donated_at ? (
                        new Date(member.last_donated_at).toLocaleDateString(
                          "nl-NL",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )
                      ) : (
                        <span className="text-[#d5cfb8]">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-[#e3dfd5]">
                <p className="text-[13px] text-[#8a8478]">
                  <span className="font-medium text-[#261b07]">
                    {filteredCount}
                  </span>{" "}
                  leden
                  <span className="mx-1.5 text-[#e3dfd5]">|</span>
                  pagina{" "}
                  <span className="font-medium text-[#261b07]">
                    {page}
                  </span> van{" "}
                  <span className="font-medium text-[#261b07]">
                    {totalPages}
                  </span>
                </p>
                <div className="flex gap-1.5">
                  {page > 1 && (
                    <Link
                      href={filterUrl({ page: String(page - 1) })}
                      className="inline-flex items-center justify-center min-h-[44px] md:min-h-0 h-9 px-3.5 text-[13px] font-medium rounded-lg border border-[#e3dfd5] bg-white hover:bg-[#f3f1ec] transition-colors text-[#261b07]"
                    >
                      <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                      Vorige
                    </Link>
                  )}
                  {page < totalPages && (
                    <Link
                      href={filterUrl({ page: String(page + 1) })}
                      className="inline-flex items-center justify-center min-h-[44px] md:min-h-0 h-9 px-3.5 text-[13px] font-medium rounded-lg border border-[#e3dfd5] bg-white hover:bg-[#f3f1ec] transition-colors text-[#261b07]"
                    >
                      Volgende
                      <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="rounded-full bg-[#f3f1ec] p-5 mb-5">
              <Users className="h-7 w-7 text-[#a09888]" strokeWidth={1.5} />
            </div>
            <h3 className="text-[13px] font-medium text-[#261b07] mb-1.5">
              Geen leden gevonden
            </h3>
            <p className="text-[13px] text-[#a09888] text-center max-w-xs leading-relaxed">
              {statusFilter || riskFilter
                ? "Pas uw filters aan om leden te vinden."
                : "Zodra er donaties binnenkomen, verschijnen uw leden hier."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
