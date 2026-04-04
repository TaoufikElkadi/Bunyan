import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validatePeriodicGift } from "@/lib/anbi";

export async function GET(request: Request) {
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
      .select("mosque_id, role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Geen toestemming" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const donorId = searchParams.get("donor_id");

    let query = supabase
      .from("periodic_gift_agreements")
      .select("*, donors(name, email, address), funds(name)")
      .eq("mosque_id", profile.mosque_id)
      .order("created_at", { ascending: false });

    if (donorId) {
      query = query.eq("donor_id", donorId);
    }

    const { data: agreements, error } = await query;

    if (error) {
      console.error("Periodic gifts query error:", error);
      return NextResponse.json(
        { error: "Fout bij ophalen overeenkomsten" },
        { status: 500 },
      );
    }

    const formatted = (agreements ?? []).map((a) => {
      const donor = a.donors as unknown as {
        name: string | null;
        email: string | null;
        address: string | null;
      } | null;
      const fund = a.funds as unknown as { name: string } | null;
      return {
        id: a.id,
        donor_id: a.donor_id,
        donor_name: donor?.name ?? "Onbekend",
        donor_email: donor?.email ?? null,
        donor_address: donor?.address ?? null,
        annual_amount: a.annual_amount,
        fund_id: a.fund_id,
        fund_name: fund?.name ?? null,
        start_date: a.start_date,
        end_date: a.end_date,
        status: a.status,
        notes: a.notes,
        donor_signed_at: a.donor_signed_at,
        board_signed_at: a.board_signed_at,
        board_signer_name: a.board_signer_name,
        created_at: a.created_at,
      };
    });

    return NextResponse.json({ agreements: formatted });
  } catch (err) {
    console.error("Periodic gifts error:", err);
    return NextResponse.json(
      { error: "Er is iets misgegaan" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
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
      .select("mosque_id, role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Geen toestemming" }, { status: 403 });
    }

    const body = await request.json();
    const {
      donor_id,
      donor_bsn,
      annual_amount,
      fund_id,
      start_date,
      end_date,
      notes,
    } = body as {
      donor_id: string;
      donor_bsn?: string;
      annual_amount: number;
      fund_id?: string;
      start_date: string;
      end_date: string;
      notes?: string;
    };

    if (!donor_id || !annual_amount || !start_date || !end_date) {
      return NextResponse.json(
        { error: "Verplichte velden ontbreken" },
        { status: 400 },
      );
    }

    if (donor_bsn && !/^\d{9}$/.test(donor_bsn)) {
      return NextResponse.json(
        { error: "BSN moet uit 9 cijfers bestaan" },
        { status: 400 },
      );
    }

    // Validate
    const validationError = validatePeriodicGift({
      startDate: start_date,
      endDate: end_date,
      annualAmount: annual_amount,
    });

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Verify donor exists and belongs to this mosque
    const { data: donor } = await supabase
      .from("donors")
      .select("id")
      .eq("id", donor_id)
      .eq("mosque_id", profile.mosque_id)
      .single();

    if (!donor) {
      return NextResponse.json(
        { error: "Donateur niet gevonden" },
        { status: 404 },
      );
    }

    const { data: agreement, error } = await supabase
      .from("periodic_gift_agreements")
      .insert({
        mosque_id: profile.mosque_id,
        donor_id,
        donor_bsn: donor_bsn || null,
        annual_amount,
        fund_id: fund_id || null,
        start_date,
        end_date,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Create periodic gift error:", error);
      return NextResponse.json(
        { error: "Fout bij aanmaken overeenkomst" },
        { status: 500 },
      );
    }

    return NextResponse.json({ agreement }, { status: 201 });
  } catch (err) {
    console.error("Periodic gift create error:", err);
    return NextResponse.json(
      { error: "Er is iets misgegaan" },
      { status: 500 },
    );
  }
}
