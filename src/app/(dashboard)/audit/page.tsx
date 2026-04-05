import { getCachedProfile } from "@/lib/supabase/cached";
import { formatMoney } from "@/lib/money";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Lock, ClipboardList } from "lucide-react";

export const revalidate = 60;

const PAGE_SIZE = 20;

const ACTION_LABELS: Record<string, string> = {
  manual_donation: "Handmatige donatie",
  donor_link: "Donateur gekoppeld",
  donor_merge: "Donateurs samengevoegd",
  donor_update: "Donateur bijgewerkt",
  fund_create: "Fonds aangemaakt",
  fund_update: "Fonds bijgewerkt",
  fund_archive: "Fonds gearchiveerd",
};

const ENTITY_LABELS: Record<string, string> = {
  donation: "Donatie",
  donor: "Donateur",
  fund: "Fonds",
  campaign: "Campagne",
};

function formatDetails(
  action: string,
  details: Record<string, unknown> | null,
): string {
  if (!details) return "-";

  if (action === "manual_donation" && typeof details.amount === "number") {
    return formatMoney(details.amount as number);
  }

  if (details.name) return String(details.name);

  return "-";
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { mosqueId, supabase, profile } = await getCachedProfile();

  if (!mosqueId) return null;

  const isAdmin = profile.role === "admin";

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.5px] text-[#261b07]">
            Activiteitenlog
          </h1>
          <p className="text-[14px] text-[#8a8478] mt-1">
            Bekijk alle activiteiten binnen uw organisatie
          </p>
        </div>
        <div className="rounded-xl border border-[#e3dfd5] bg-white">
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="rounded-full bg-[#f3f1ec] p-5 mb-5">
              <Lock className="h-7 w-7 text-[#a09888]" strokeWidth={1.5} />
            </div>
            <h3 className="text-[14px] font-medium text-[#261b07] mb-1.5">
              Geen toestemming
            </h3>
            <p className="text-[13px] text-[#a09888] text-center max-w-xs leading-relaxed">
              Alleen beheerders hebben toegang tot de activiteitenlog.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: entries, count } = await supabase
    .from("audit_log")
    .select("*, users(name, email)", { count: "exact" })
    .eq("mosque_id", mosqueId)
    .order("created_at", { ascending: false })
    .range(from, to);

  const logs = entries ?? [];
  const totalCount = count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-[28px] font-bold tracking-[-0.5px] text-[#261b07]">
          Activiteitenlog
        </h1>
        <p className="text-[14px] text-[#8a8478] mt-1">
          Bekijk alle activiteiten binnen uw organisatie
        </p>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#e3dfd5] bg-white overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <h3 className="text-[15px] font-semibold text-[#261b07]">
            Alle activiteiten
          </h3>
          {totalCount > 0 && (
            <span className="text-[12px] text-[#a09888] tabular-nums">
              {totalCount} resultaten
            </span>
          )}
        </div>

        {logs.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-[#e3dfd5]">
                    <TableHead className="h-10 px-4 sm:px-6 text-[12px] font-medium text-[#a09888] uppercase tracking-wide">
                      Datum
                    </TableHead>
                    <TableHead className="h-10 px-4 text-[12px] font-medium text-[#a09888] uppercase tracking-wide">
                      Gebruiker
                    </TableHead>
                    <TableHead className="h-10 px-4 text-[12px] font-medium text-[#a09888] uppercase tracking-wide">
                      Actie
                    </TableHead>
                    <TableHead className="h-10 px-4 text-[12px] font-medium text-[#a09888] uppercase tracking-wide hidden sm:table-cell">
                      Type
                    </TableHead>
                    <TableHead className="h-10 px-4 sm:px-6 text-[12px] font-medium text-[#a09888] uppercase tracking-wide hidden md:table-cell">
                      Details
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((entry: Record<string, unknown>) => {
                    const user = entry.users as {
                      name?: string;
                      email?: string;
                    } | null;
                    const action = entry.action as string;
                    const entityType = entry.entity_type as string;
                    const details = entry.details as Record<
                      string,
                      unknown
                    > | null;
                    return (
                      <TableRow
                        key={entry.id as string}
                        className="hover:bg-[#fafaf8] border-[#e3dfd5]/60"
                      >
                        <TableCell className="px-6 py-4 text-[13px] text-[#8a8478]">
                          {new Date(entry.created_at as string).toLocaleString(
                            "nl-NL",
                            {
                              dateStyle: "short",
                              timeStyle: "short",
                            },
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-4 text-[13px] font-medium text-[#261b07]">
                          {user?.name ?? user?.email ?? (
                            <span className="text-[#b5b0a5] italic">
                              Onbekend
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <span className="inline-flex items-center rounded-md bg-[#f3f1ec] px-2 py-0.5 text-[11px] font-medium text-[#261b07]">
                            {ACTION_LABELS[action] ?? action}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-4 text-[13px] text-[#8a8478] hidden sm:table-cell">
                          {ENTITY_LABELS[entityType] ?? entityType}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-[13px] text-[#a09888] hidden md:table-cell">
                          {formatDetails(action, details)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-[#e3dfd5]">
                <p className="text-[13px] text-[#8a8478]">
                  <span className="font-medium text-[#261b07]">
                    {totalCount}
                  </span>{" "}
                  activiteiten
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
                      href={`/audit?page=${page - 1}`}
                      className="inline-flex items-center justify-center min-h-[44px] md:min-h-0 h-9 px-3.5 text-[13px] font-medium rounded-lg border border-[#e3dfd5] bg-white hover:bg-[#f3f1ec] transition-colors text-[#261b07]"
                    >
                      <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                      Vorige
                    </Link>
                  )}
                  {page < totalPages && (
                    <Link
                      href={`/audit?page=${page + 1}`}
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
              <ClipboardList
                className="h-7 w-7 text-[#a09888]"
                strokeWidth={1.5}
              />
            </div>
            <h3 className="text-[13px] font-medium text-[#261b07] mb-1.5">
              Nog geen activiteiten
            </h3>
            <p className="text-[13px] text-[#a09888] text-center max-w-xs leading-relaxed">
              Zodra er activiteiten worden geregistreerd, verschijnen ze hier.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
