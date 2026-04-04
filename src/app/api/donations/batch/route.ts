import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

interface BatchLine {
  fund_id: string;
  amount: number; // cents
  label?: string;
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const { success } = await rateLimit(`donations-batch:${ip}`, 5, 60_000);
    if (!success) {
      return NextResponse.json(
        { error: "Te veel verzoeken. Probeer het later opnieuw." },
        { status: 429 },
      );
    }

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
      .select("mosque_id, role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "Gebruiker niet gevonden" },
        { status: 404 },
      );
    }

    if (profile.role === "viewer") {
      return NextResponse.json({ error: "Geen toestemming" }, { status: 403 });
    }

    const body = await request.json();
    const { lines, date, notes } = body as {
      lines: BatchLine[];
      date: string;
      notes?: string;
    };

    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json(
        { error: "Geen donaties opgegeven" },
        { status: 400 },
      );
    }

    if (!date) {
      return NextResponse.json(
        { error: "Datum is verplicht" },
        { status: 400 },
      );
    }

    // Filter out lines with zero amount
    const validLines = lines.filter((l) => l.amount > 0);

    if (validLines.length === 0) {
      return NextResponse.json(
        { error: "Vul minimaal één bedrag in" },
        { status: 400 },
      );
    }

    const admin = createAdminClient();
    const mosqueId = profile.mosque_id;

    // Verify all fund_ids belong to this mosque in one query
    const fundIds = [...new Set(validLines.map((l) => l.fund_id))];
    const { data: funds } = await admin
      .from("funds")
      .select("id")
      .eq("mosque_id", mosqueId)
      .in("id", fundIds);

    const validFundIds = new Set((funds ?? []).map((f) => f.id));
    const invalidFunds = fundIds.filter((id) => !validFundIds.has(id));

    if (invalidFunds.length > 0) {
      return NextResponse.json(
        { error: "Een of meer fondsen zijn ongeldig" },
        { status: 400 },
      );
    }

    // Build donation rows
    const createdAt = new Date(date).toISOString();
    const batchNote = notes?.trim() ? `collecte: ${notes.trim()}` : "collecte";

    const donationRows = validLines.map((line) => ({
      mosque_id: mosqueId,
      donor_id: null, // anonymous cash
      fund_id: line.fund_id,
      amount: line.amount,
      method: "cash" as const,
      status: "completed" as const,
      notes: line.label ? `${batchNote} — ${line.label}` : batchNote,
      created_by: user.id,
      created_at: createdAt,
    }));

    const { data: donations, error: insertError } = await admin
      .from("donations")
      .insert(donationRows)
      .select("id");

    if (insertError) {
      console.error("Batch donation error:", insertError);
      return NextResponse.json(
        { error: "Donaties aanmaken mislukt" },
        { status: 500 },
      );
    }

    const totalAmount = validLines.reduce((sum, l) => sum + l.amount, 0);

    // Audit log
    await admin.from("audit_log").insert({
      mosque_id: mosqueId,
      user_id: user.id,
      action: "batch_collection",
      entity_type: "donation",
      entity_id: donations?.[0]?.id ?? null,
      details: {
        count: validLines.length,
        total_amount: totalAmount,
        date,
        notes: batchNote,
      },
    });

    return NextResponse.json({
      success: true,
      count: validLines.length,
      total_amount: totalAmount,
    });
  } catch (err) {
    console.error("Batch donation error:", err);
    return NextResponse.json(
      { error: "Er is iets misgegaan" },
      { status: 500 },
    );
  }
}
