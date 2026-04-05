import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getConnectAccountStatus } from "@/lib/stripe-connect";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * GET - Returns the current Stripe Connect status for the mosque.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("mosque_id, role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const admin = createAdminClient();
    const { data: mosque } = await admin
      .from("mosques")
      .select("stripe_account_id, stripe_connected_at")
      .eq("id", profile.mosque_id)
      .single();

    if (!mosque?.stripe_account_id) {
      return NextResponse.json({
        status: "not_connected",
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
      });
    }

    const accountStatus = await getConnectAccountStatus(
      mosque.stripe_account_id,
    );

    // If Stripe says charges are enabled but we haven't recorded it yet,
    // update the DB now (catches missed webhooks / local dev without stripe listen)
    if (accountStatus.chargesEnabled && !mosque.stripe_connected_at) {
      const now = new Date().toISOString();
      await admin
        .from("mosques")
        .update({ stripe_connected_at: now, updated_at: now })
        .eq("id", profile.mosque_id);

      return NextResponse.json({
        status: "connected",
        accountId: mosque.stripe_account_id,
        connectedAt: now,
        ...accountStatus,
      });
    }

    return NextResponse.json({
      status: mosque.stripe_connected_at
        ? "connected"
        : "onboarding_incomplete",
      accountId: mosque.stripe_account_id,
      connectedAt: mosque.stripe_connected_at,
      ...accountStatus,
    });
  } catch (err) {
    console.error("Stripe Connect status error:", err);
    return NextResponse.json(
      { error: "Status ophalen mislukt" },
      { status: 500 },
    );
  }
}

/**
 * POST - Creates a Stripe Connect Express account and returns an onboarding link.
 * If account already exists but onboarding is incomplete, returns a fresh link.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("mosque_id, role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json(
        { error: "Alleen beheerders kunnen Stripe verbinden" },
        { status: 403 },
      );
    }

    const admin = createAdminClient();
    const { data: mosque } = await admin
      .from("mosques")
      .select("id, name, stripe_account_id, stripe_connected_at")
      .eq("id", profile.mosque_id)
      .single();

    if (!mosque) {
      return NextResponse.json(
        { error: "Moskee niet gevonden" },
        { status: 404 },
      );
    }

    let accountId = mosque.stripe_account_id;

    // If already connected, check if Stripe needs more info
    if (mosque.stripe_connected_at && accountId) {
      const account = await stripe.accounts.retrieve(accountId);
      const hasPendingRequirements =
        (account.requirements?.currently_due?.length ?? 0) > 0 ||
        (account.requirements?.eventually_due?.length ?? 0) > 0;

      if (!hasPendingRequirements) {
        return NextResponse.json({
          status: "already_connected",
          connectedAt: mosque.stripe_connected_at,
        });
      }

      // Has pending requirements — generate a link to update info
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${APP_URL}/instellingen?tab=betalingen&stripe=refresh`,
        return_url: `${APP_URL}/instellingen?tab=betalingen&stripe=complete`,
        type: "account_update",
      });

      return NextResponse.json({ url: accountLink.url, accountId });
    }

    // Create Express account if none exists
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "NL",
        capabilities: {
          transfers: { requested: true },
        },
        business_type: "non_profit",
        business_profile: {
          name: mosque.name,
          mcc: "8661", // Religious organizations
        },
        metadata: {
          mosque_id: mosque.id,
          platform: "bunyan",
        },
      });

      accountId = account.id;

      // Save account ID immediately
      await admin
        .from("mosques")
        .update({
          stripe_account_id: accountId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", mosque.id);
    }

    // Generate onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${APP_URL}/instellingen?tab=betalingen&stripe=refresh`,
      return_url: `${APP_URL}/instellingen?tab=betalingen&stripe=complete`,
      type: "account_onboarding",
    });

    return NextResponse.json({
      url: accountLink.url,
      accountId,
    });
  } catch (err) {
    console.error("Stripe Connect onboarding error:", err);
    return NextResponse.json(
      { error: "Stripe verbinding mislukt" },
      { status: 500 },
    );
  }
}
