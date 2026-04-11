import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { TeamMember, TeamMemberStatus } from "@/types";

/**
 * GET /api/settings/team
 * List all team members for the current user's mosque.
 */
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

    if (!profile) {
      return NextResponse.json(
        { error: "Gebruikersprofiel niet gevonden" },
        { status: 404 },
      );
    }

    const { data: members, error } = await supabase
      .from("users")
      .select(
        "id, mosque_id, name, email, role, invited_at, invited_by, has_seen_tour, created_at",
      )
      .eq("mosque_id", profile.mosque_id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Team list error:", error);
      return NextResponse.json(
        { error: "Fout bij ophalen teamleden" },
        { status: 500 },
      );
    }

    // Determine active/pending status based on whether the user has
    // confirmed their auth account (invited users who haven't set a
    // password yet have an invited_at but their auth.users record may
    // still show as unconfirmed). We use a simple heuristic: if the
    // user has an invited_at date and was not the original admin
    // (invited_by is not null), check if they have logged in by
    // comparing created_at with invited_at (they will be close for
    // invited users who haven't completed setup).
    const teamMembers: TeamMember[] = (members ?? []).map((m) => {
      let status: TeamMemberStatus = "active";
      // If user was invited (has invited_at), they're pending until
      // they set their password. We check via the Supabase Admin API
      // separately in the component if needed, but for now we use
      // a simpler approach: invited_at is set, and we mark as pending.
      // Once the user sets their password via /set-password, the
      // invited_at is cleared by the set-password API.
      if (m.invited_at) {
        status = "pending";
      }
      return { ...m, status };
    });

    return NextResponse.json({ members: teamMembers });
  } catch (err) {
    console.error("Team list error:", err);
    return NextResponse.json(
      { error: "Er is iets misgegaan" },
      { status: 500 },
    );
  }
}
