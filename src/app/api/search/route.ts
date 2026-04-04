import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sanitizeSearch } from "@/lib/sanitize-search";

export async function GET(request: Request) {
  try {
    const ip = getClientIp(request);
    const { success } = await rateLimit(`search:${ip}`, 30, 60_000);
    if (!success) {
      return NextResponse.json(
        { error: "Te veel verzoeken, probeer later opnieuw." },
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
      .select("mosque_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Geen toestemming" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";

    if (q.length < 2) {
      return NextResponse.json(
        { error: "Minimaal 2 tekens vereist" },
        { status: 400 },
      );
    }

    const mosqueId = profile.mosque_id;
    const safe = sanitizeSearch(q);
    const pattern = `%${safe}%`;

    const [donorsRes, fundsRes, campaignsRes] = await Promise.all([
      supabase
        .from("donors")
        .select("id, name, email, total_donated")
        .eq("mosque_id", mosqueId)
        .or(`name.ilike.${pattern},email.ilike.${pattern}`)
        .limit(5),
      supabase
        .from("funds")
        .select("id, name, is_active")
        .eq("mosque_id", mosqueId)
        .ilike("name", pattern)
        .limit(5),
      supabase
        .from("campaigns")
        .select("id, title, slug, is_active")
        .eq("mosque_id", mosqueId)
        .ilike("title", pattern)
        .limit(5),
    ]);

    return NextResponse.json({
      donors: donorsRes.data ?? [],
      funds: fundsRes.data ?? [],
      campaigns: campaignsRes.data ?? [],
    });
  } catch {
    return NextResponse.json({ error: "Er ging iets mis" }, { status: 500 });
  }
}
