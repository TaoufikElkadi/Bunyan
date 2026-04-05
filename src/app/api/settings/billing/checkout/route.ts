import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import type { MosquePlan } from "@/types";

const PLAN_PRICES: Record<string, { amount: number; name: string }> = {
  starter: { amount: 6900, name: "Bunyan Starter" },
  compleet: { amount: 14900, name: "Bunyan Compleet" },
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("mosque_id, role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
    }

    const body = await request.json();
    const plan = body.plan as string;

    if (!plan || !PLAN_PRICES[plan]) {
      return NextResponse.json(
        { error: "Ongeldig plan. Kies starter of compleet." },
        { status: 400 },
      );
    }

    const priceInfo = PLAN_PRICES[plan];

    // Get mosque for existing Stripe customer ID
    const { data: mosque } = await supabase
      .from("mosques")
      .select("id, name, stripe_customer_id")
      .eq("id", profile.mosque_id)
      .single();

    if (!mosque) {
      return NextResponse.json(
        { error: "Moskee niet gevonden" },
        { status: 404 },
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Find or create a Stripe Price for this plan
    const price = await getOrCreatePrice(plan as MosquePlan, priceInfo);

    const sessionParams: Record<string, unknown> = {
      mode: "subscription",
      line_items: [{ price: price.id, quantity: 1 }],
      success_url: `${appUrl}/instellingen?billing=success`,
      cancel_url: `${appUrl}/instellingen?billing=cancelled`,
      metadata: {
        mosque_id: mosque.id,
        plan,
      },
      subscription_data: {
        metadata: {
          mosque_id: mosque.id,
          plan,
        },
      },
    };

    // Reuse existing Stripe customer if available
    if (mosque.stripe_customer_id) {
      sessionParams.customer = mosque.stripe_customer_id;
    } else {
      sessionParams.customer_email = user.email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Billing checkout error:", err);
    return NextResponse.json(
      { error: "Kon checkout sessie niet aanmaken" },
      { status: 500 },
    );
  }
}

/**
 * Find existing Stripe Price by lookup_key, or create one.
 */
async function getOrCreatePrice(
  plan: MosquePlan,
  info: { amount: number; name: string },
) {
  const lookupKey = `bunyan_${plan}_monthly`;

  // Try to find existing price by lookup key
  const { data: existing } = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 1,
  });

  if (existing.length > 0) {
    return existing[0];
  }

  // Create product + price
  const product = await stripe.products.create({
    name: info.name,
    metadata: { plan },
  });

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: info.amount,
    currency: "eur",
    recurring: { interval: "month" },
    lookup_key: lookupKey,
  });

  return price;
}
