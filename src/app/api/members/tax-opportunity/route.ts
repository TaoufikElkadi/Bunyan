import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TAX_RATE = 0.3697; // IB Box 1, first bracket (2025 tarief — update bij tariefwijziging)

export interface TaxOpportunityData {
  eligible_count: number;
  avg_estimated_annual: number;
  total_missed_savings: number;
  tax_rate: number;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Niet geautoriseerd" },
        { status: 401 },
      );
    }

    const { data: profile } = await supabase
      .from("users")
      .select("mosque_id")
      .eq("id", user.id)
      .single();

    if (!profile?.mosque_id) {
      return NextResponse.json({ error: "Geen toestemming" }, { status: 403 });
    }

    const mosqueId = profile.mosque_id;
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    // Get IDs of donors with active periodic gift agreements
    const { data: periodicDonorRows } = await supabase
      .from("periodic_gift_agreements")
      .select("donor_id")
      .eq("mosque_id", mosqueId)
      .eq("status", "active");

    const periodicDonorIds = (periodicDonorRows ?? []).map((r) => r.donor_id);

    // Get active identified donors without periodic gifts
    let query = supabase
      .from("donors")
      .select("estimated_annual")
      .eq("mosque_id", mosqueId)
      .or("email.not.is.null,name.not.is.null")
      .gt("estimated_annual", 0)
      .gte("last_donated_at", twelveMonthsAgo.toISOString());

    if (periodicDonorIds.length > 0) {
      // Exclude donors who already have a periodic gift
      // Supabase .not('id', 'in', ...) for filtering
      query = query.not("id", "in", `(${periodicDonorIds.join(",")})`);
    }

    const { data: eligibleDonors } = await query;

    const donors = eligibleDonors ?? [];
    const eligible_count = donors.length;
    const totalAnnual = donors.reduce(
      (sum, d) => sum + (d.estimated_annual ?? 0),
      0,
    );
    const avg_estimated_annual =
      eligible_count > 0 ? Math.round(totalAnnual / eligible_count) : 0;
    const total_missed_savings = Math.round(totalAnnual * TAX_RATE);

    return NextResponse.json({
      eligible_count,
      avg_estimated_annual,
      total_missed_savings,
      tax_rate: TAX_RATE,
    } satisfies TaxOpportunityData);
  } catch (err) {
    console.error("Tax opportunity error:", err);
    return NextResponse.json(
      { error: "Er is iets misgegaan" },
      { status: 500 },
    );
  }
}
