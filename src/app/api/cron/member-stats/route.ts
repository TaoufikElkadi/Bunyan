import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Nightly cron: recompute donor intelligence fields.
 * Calculates avg_donation_amount, donation_frequency, estimated_annual.
 * Scheduled via Vercel Cron alongside reconcile at 02:15 UTC.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    !process.env.CRON_SECRET ||
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  let updated = 0;
  let errors = 0;

  const BATCH_SIZE = 100;

  try {
    const { data: donors, error } = await admin
      .from("donors")
      .select("id")
      .gt("donation_count", 0);

    if (error || !donors) {
      console.error("Member stats cron: failed to fetch donors", error);
      return NextResponse.json(
        { error: "Failed to fetch donors" },
        { status: 500 },
      );
    }

    for (let i = 0; i < donors.length; i += BATCH_SIZE) {
      const chunk = donors.slice(i, i + BATCH_SIZE);
      const chunkIds = chunk.map((d) => d.id);

      try {
        const { data: donations } = await admin
          .from("donations")
          .select("donor_id, amount, created_at")
          .in("donor_id", chunkIds)
          .eq("status", "completed")
          .order("created_at", { ascending: true });

        const byDonor = new Map<
          string,
          { amount: number; created_at: string }[]
        >();
        for (const d of donations ?? []) {
          const list = byDonor.get(d.donor_id);
          if (list) list.push(d);
          else byDonor.set(d.donor_id, [d]);
        }

        const now = new Date().toISOString();
        const updates: {
          id: string;
          avg_donation_amount: number;
          donation_frequency: string | null;
          estimated_annual: number;
          last_computed_at: string;
        }[] = [];

        for (const donor of chunk) {
          const donorDonations = byDonor.get(donor.id);
          if (!donorDonations || donorDonations.length === 0) continue;

          const totalAmount = donorDonations.reduce(
            (sum, d) => sum + d.amount,
            0,
          );
          const avgAmount = Math.round(totalAmount / donorDonations.length);
          const frequency = computeFrequency(
            donorDonations.map((d) => d.created_at),
          );
          const multiplier = getFrequencyMultiplier(frequency);
          const estimatedAnnual = Math.round(avgAmount * multiplier);

          updates.push({
            id: donor.id,
            avg_donation_amount: avgAmount,
            donation_frequency: frequency,
            estimated_annual: estimatedAnnual,
            last_computed_at: now,
          });
        }

        if (updates.length > 0) {
          const { error: upsertError } = await admin
            .from("donors")
            .upsert(updates, { onConflict: "id", ignoreDuplicates: false });

          if (upsertError) {
            console.error("Member stats cron: batch upsert error", upsertError);
            errors += updates.length;
          } else {
            updated += updates.length;
          }
        }
      } catch (err) {
        console.error(
          `Member stats cron: error in batch starting at index ${i}:`,
          err,
        );
        errors += chunk.length;
      }
    }
  } catch (err) {
    console.error("Member stats cron: fatal error", err);
    return NextResponse.json(
      { error: "Cron failed", details: String(err) },
      { status: 500 },
    );
  }

  const summary = { updated, errors };
  console.log("Member stats cron: complete", summary);
  return NextResponse.json(summary);
}

function computeFrequency(dates: string[]): string | null {
  if (dates.length < 2) return null;

  // Calculate median interval in days
  const intervals: number[] = [];
  for (let i = 1; i < dates.length; i++) {
    const diff =
      new Date(dates[i]).getTime() - new Date(dates[i - 1]).getTime();
    intervals.push(diff / (24 * 60 * 60 * 1000));
  }

  intervals.sort((a, b) => a - b);
  const median = intervals[Math.floor(intervals.length / 2)];

  if (median <= 10) return "weekly";
  if (median <= 45) return "monthly";
  if (median <= 120) return "quarterly";
  if (median <= 400) return "yearly";
  return "irregular";
}

function getFrequencyMultiplier(frequency: string | null): number {
  switch (frequency) {
    case "weekly":
      return 52;
    case "monthly":
      return 12;
    case "quarterly":
      return 4;
    case "yearly":
      return 1;
    default:
      return 1;
  }
}
