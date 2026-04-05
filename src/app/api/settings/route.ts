import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;
const RSIN_RE = /^\d{9}$/;
const KVK_RE = /^\d{8}$/;
const IBAN_RE = /^[A-Z]{2}\d{2}[A-Z0-9]{4,30}$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SLUG_MIN_LENGTH = 2;
const SLUG_MAX_LENGTH = 60;
const SLUG_CHANGE_COOLDOWN_DAYS = 30;

function isValidSlug(slug: string): boolean {
  return (
    slug.length >= SLUG_MIN_LENGTH &&
    slug.length <= SLUG_MAX_LENGTH &&
    SLUG_RE.test(slug)
  );
}

export async function PUT(request: Request) {
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
      name,
      slug,
      city,
      address,
      primary_color,
      welcome_msg,
      anbi_status,
      rsin,
      kvk,
      language,
      iban,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Naam is verplicht" }, { status: 400 });
    }

    if (primary_color && !HEX_COLOR_RE.test(primary_color)) {
      return NextResponse.json(
        { error: "Ongeldige kleurcode (gebruik #RRGGBB)" },
        { status: 400 },
      );
    }

    const validLanguages = ["nl", "en", "tr", "ar"];
    if (language && !validLanguages.includes(language)) {
      return NextResponse.json({ error: "Ongeldige taal" }, { status: 400 });
    }

    if (rsin && rsin.trim() && !RSIN_RE.test(rsin.trim())) {
      return NextResponse.json(
        { error: "RSIN moet exact 9 cijfers zijn" },
        { status: 400 },
      );
    }

    if (kvk && kvk.trim() && !KVK_RE.test(kvk.trim())) {
      return NextResponse.json(
        { error: "KVK moet exact 8 cijfers zijn" },
        { status: 400 },
      );
    }

    // Validate IBAN: strip spaces, uppercase, then check format
    const cleanIban = iban?.replace(/\s/g, "").toUpperCase() || null;
    if (cleanIban && !IBAN_RE.test(cleanIban)) {
      return NextResponse.json(
        { error: "Ongeldig IBAN-formaat" },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    // Handle slug change
    const newSlug = slug?.trim().toLowerCase();
    let slugUpdate: Record<string, string> = {};

    if (newSlug) {
      if (!isValidSlug(newSlug)) {
        return NextResponse.json(
          {
            error:
              "Ongeldige slug (alleen kleine letters, cijfers en streepjes, minimaal 2 tekens)",
          },
          { status: 400 },
        );
      }

      // Fetch current mosque to check if slug actually changed
      const { data: currentMosque } = await admin
        .from("mosques")
        .select("slug, slug_changed_at")
        .eq("id", profile.mosque_id)
        .single();

      if (currentMosque && newSlug !== currentMosque.slug) {
        // Rate limit: one slug change per 30 days
        if (currentMosque.slug_changed_at) {
          const lastChange = new Date(currentMosque.slug_changed_at);
          const cooldownEnd = new Date(
            lastChange.getTime() +
              SLUG_CHANGE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000,
          );
          if (new Date() < cooldownEnd) {
            const daysLeft = Math.ceil(
              (cooldownEnd.getTime() - Date.now()) / (24 * 60 * 60 * 1000),
            );
            return NextResponse.json(
              {
                error: `Slug kan pas over ${daysLeft} dagen opnieuw gewijzigd worden`,
              },
              { status: 429 },
            );
          }
        }

        // Check uniqueness against both mosques and existing redirects
        const [{ data: existingMosque }, { data: existingRedirect }] =
          await Promise.all([
            admin.from("mosques").select("id").eq("slug", newSlug).single(),
            admin
              .from("mosque_slug_redirects")
              .select("id")
              .eq("old_slug", newSlug)
              .single(),
          ]);

        if (
          (existingMosque && existingMosque.id !== profile.mosque_id) ||
          existingRedirect
        ) {
          return NextResponse.json(
            { error: "Deze slug is al in gebruik" },
            { status: 409 },
          );
        }

        // Insert old slug as redirect
        const { error: redirectError } = await admin
          .from("mosque_slug_redirects")
          .insert({
            mosque_id: profile.mosque_id,
            old_slug: currentMosque.slug,
          });

        if (redirectError) {
          console.error("Redirect insert error:", redirectError);
          return NextResponse.json(
            { error: "Slug wijzigen mislukt" },
            { status: 500 },
          );
        }

        slugUpdate = {
          slug: newSlug,
          slug_changed_at: new Date().toISOString(),
        };
      }
    }

    const updatePayload: Record<string, unknown> = {
      name: name.trim(),
      city: city?.trim() || null,
      address: address?.trim() || null,
      primary_color: primary_color || "#10b981",
      welcome_msg: welcome_msg?.trim() || null,
      anbi_status: anbi_status ?? false,
      iban: cleanIban,
      language: language || "nl",
      updated_at: new Date().toISOString(),
      ...slugUpdate,
    };

    // Only update rsin/kvk if explicitly provided in the request
    if (rsin !== undefined) updatePayload.rsin = rsin?.trim() || null;
    if (kvk !== undefined) updatePayload.kvk = kvk?.trim() || null;

    const { data: mosque, error } = await supabase
      .from("mosques")
      .update(updatePayload)
      .eq("id", profile.mosque_id)
      .select()
      .single();

    if (error) {
      console.error("Settings update error:", error);
      // If slug update failed due to unique constraint, clean up the redirect
      if (error.code === "23505" && slugUpdate.slug) {
        await admin
          .from("mosque_slug_redirects")
          .delete()
          .eq("mosque_id", profile.mosque_id)
          .eq("old_slug", newSlug);
      }
      return NextResponse.json(
        { error: "Instellingen bijwerken mislukt" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, mosque });
  } catch (err) {
    console.error("Settings update error:", err);
    return NextResponse.json(
      { error: "Er is iets misgegaan" },
      { status: 500 },
    );
  }
}
