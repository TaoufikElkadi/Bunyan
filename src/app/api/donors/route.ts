import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeSearch } from "@/lib/sanitize-search";

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

    if (!profile) {
      return NextResponse.json({ error: "Geen toestemming" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";
    const limit = Math.min(
      parseInt(searchParams.get("limit") ?? "50", 10),
      200,
    );

    let query = supabase
      .from("donors")
      .select("id, name, email, address")
      .eq("mosque_id", profile.mosque_id)
      .not("name", "is", null)
      .order("name")
      .limit(limit);

    if (search) {
      const safe = sanitizeSearch(search);
      query = query.or(`name.ilike.%${safe}%,email.ilike.%${safe}%`);
    }

    const { data: donors, error } = await query;

    if (error) {
      console.error("Donors list error:", error);
      return NextResponse.json(
        { error: "Fout bij ophalen donateurs" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { donors: donors ?? [] },
      {
        headers: {
          "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
        },
      },
    );
  } catch (err) {
    console.error("Donors error:", err);
    return NextResponse.json(
      { error: "Er is iets misgegaan" },
      { status: 500 },
    );
  }
}
