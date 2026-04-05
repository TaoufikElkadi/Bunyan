import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { buildTransferParams } from "@/lib/stripe-connect";
import crypto from "crypto";

type ExpandedInvoice = Stripe.Invoice & {
  payment_intent?: Stripe.PaymentIntent | string | null;
  confirmation_secret?: { client_secret: string } | null;
};

/**
 * Extracts the client_secret from an expanded invoice.
 *
 * Priority:
 * 1. confirmation_secret (newer Stripe API versions)
 * 2. Expanded payment_intent object
 * 3. Finalize draft invoice, then read PaymentIntent
 * 4. Retrieve PaymentIntent by ID (if only a string was returned)
 */
async function extractClientSecret(
  invoice: ExpandedInvoice,
): Promise<string | null> {
  // 1. Newer API: confirmation_secret on the invoice
  if (invoice.confirmation_secret?.client_secret) {
    return invoice.confirmation_secret.client_secret;
  }

  // 2. PaymentIntent already expanded as an object
  if (
    invoice.payment_intent &&
    typeof invoice.payment_intent === "object" &&
    invoice.payment_intent.client_secret
  ) {
    return invoice.payment_intent.client_secret;
  }

  // 3. Invoice is draft — finalize it so Stripe creates the PaymentIntent
  if (invoice.status === "draft") {
    const finalized = (await stripe.invoices.finalizeInvoice(invoice.id, {
      expand: ["payment_intent"],
    })) as ExpandedInvoice;

    if (
      finalized.payment_intent &&
      typeof finalized.payment_intent === "object" &&
      finalized.payment_intent.client_secret
    ) {
      return finalized.payment_intent.client_secret;
    }

    // After finalizing, payment_intent might be a string ID
    if (typeof finalized.payment_intent === "string") {
      const pi = await stripe.paymentIntents.retrieve(finalized.payment_intent);
      return pi.client_secret ?? null;
    }
  }

  // 4. PaymentIntent is a string ID — retrieve it
  if (typeof invoice.payment_intent === "string") {
    const pi = await stripe.paymentIntents.retrieve(invoice.payment_intent);
    return pi.client_secret ?? null;
  }

  return null;
}

/**
 * Creates a Stripe Subscription for recurring donations.
 * Public endpoint — donors are not logged in.
 */
export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const { success } = await rateLimit(`subscribe:${ip}`, 5, 60_000);
    if (!success) {
      return NextResponse.json(
        { error: "Te veel verzoeken, probeer later opnieuw" },
        { status: 429 },
      );
    }

    const body = await request.json();
    const {
      mosque_slug,
      fund_id,
      amount,
      frequency,
      donor_name,
      campaign_id,
      periodic_gift_agreement_id,
    } = body;
    const donor_email =
      typeof body.donor_email === "string"
        ? body.donor_email.trim().toLowerCase()
        : undefined;

    // Validate required fields
    if (!mosque_slug || !fund_id || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "mosque_slug, fund_id, and amount are required" },
        { status: 400 },
      );
    }

    if (!donor_email) {
      return NextResponse.json(
        { error: "E-mailadres is vereist voor terugkerende donaties" },
        { status: 400 },
      );
    }

    const validFrequencies = ["weekly", "monthly", "yearly"] as const;
    if (!validFrequencies.includes(frequency)) {
      return NextResponse.json(
        { error: "Ongeldige frequentie" },
        { status: 400 },
      );
    }

    const amountCents = Math.round(amount * 100);
    if (amountCents < 100) {
      return NextResponse.json(
        { error: "Minimum donatie is €1,00" },
        { status: 400 },
      );
    }

    if (amountCents > 10_000_00) {
      return NextResponse.json(
        { error: "Maximum donatie is €10.000" },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    // Map frequency to Stripe interval
    const intervalMap: Record<string, "week" | "month" | "year"> = {
      weekly: "week",
      monthly: "month",
      yearly: "year",
    };

    // --- Batch 1: DB lookups + Stripe customer search in parallel ---
    const [mosqueResult, customerResult] = await Promise.all([
      (async () => {
        const { data: mosque } = await admin
          .from("mosques")
          .select("id, name, status")
          .eq("slug", mosque_slug)
          .single();

        if (!mosque || mosque.status !== "active")
          return { error: "Moskee niet gevonden" as const };

        const [fundResult, campaignResult, transferParams] = await Promise.all([
          admin
            .from("funds")
            .select("id, name")
            .eq("id", fund_id)
            .eq("mosque_id", mosque.id)
            .eq("is_active", true)
            .single(),
          campaign_id
            ? admin
                .from("campaigns")
                .select("id")
                .eq("id", campaign_id)
                .eq("mosque_id", mosque.id)
                .single()
            : Promise.resolve({ data: true }),
          buildTransferParams(mosque.id),
        ]);

        if (!fundResult.data) return { error: "Fonds niet gevonden" as const };
        if (!campaignResult.data)
          return { error: "Campagne niet gevonden" as const };
        if (!transferParams)
          return {
            error:
              "Deze moskee kan nog geen donaties ontvangen. Neem contact op met de beheerder." as const,
          };

        return { mosque, fund: fundResult.data, transferParams };
      })(),
      stripe.customers.list({ email: donor_email, limit: 1 }),
    ]);

    if ("error" in mosqueResult && mosqueResult.error) {
      const status = mosqueResult.error.includes("niet gevonden") ? 404 : 422;
      return NextResponse.json({ error: mosqueResult.error }, { status });
    }

    const { mosque, fund, transferParams } = mosqueResult;

    // --- Batch 2: Donor + Customer + Product (need mosque.id) ---
    const [donorId, customerId, productId] = await Promise.all([
      // Find or create donor
      (async () => {
        const { data: existingDonor } = await admin
          .from("donors")
          .select("id")
          .eq("mosque_id", mosque.id)
          .eq("email", donor_email)
          .single();

        if (existingDonor) {
          if (donor_name) {
            // Fire-and-forget name update
            admin
              .from("donors")
              .update({
                name: donor_name,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existingDonor.id)
              .is("name", null)
              .then(() => {});
          }
          return existingDonor.id;
        }

        const { data: newDonor, error: donorError } = await admin
          .from("donors")
          .insert({
            mosque_id: mosque.id,
            name: donor_name || null,
            email: donor_email,
          })
          .select("id")
          .single();

        if (donorError || !newDonor) throw new Error("Donor aanmaken mislukt");
        return newDonor.id;
      })(),

      // Find or create Stripe customer
      (async () => {
        if (customerResult.data.length > 0) return customerResult.data[0].id;

        const customer = await stripe.customers.create({
          email: donor_email,
          name: donor_name || undefined,
          metadata: { mosque_id: mosque.id },
        });
        return customer.id;
      })(),

      // Find or create Stripe product (use deterministic ID to avoid slow search)
      (async () => {
        const deterministicId = `donation_${mosque.id}_${fund.id}`;
        try {
          const existing = await stripe.products.retrieve(deterministicId);
          return existing.id;
        } catch {
          // Product doesn't exist — create it with deterministic ID
          const product = await stripe.products.create({
            id: deterministicId,
            name: `Donatie aan ${mosque.name} — ${fund.name}`,
            metadata: { mosque_id: mosque.id, fund_id: fund.id },
          });
          return product.id;
        }
      })(),
    ]);

    // Create Stripe Subscription
    // Uses automatic_payment_methods so Stripe handles:
    // - iDEAL -> SEPA Direct Debit mandate conversion for recurring
    // - Apple Pay / Google Pay via card wallets
    // - Link, Bancontact, etc. based on customer location

    // For periodic gift agreements, anchor billing to the 1st of next month.
    // This gives the board time to countersign before the first charge.
    const anchorParams: Partial<Stripe.SubscriptionCreateParams> = {};
    if (periodic_gift_agreement_id) {
      const now = new Date();
      const firstOfNextMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        1,
      );
      anchorParams.billing_cycle_anchor = Math.floor(
        firstOfNextMonth.getTime() / 1000,
      );
      anchorParams.proration_behavior = "none";
    }

    const subscription = (await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price_data: {
            currency: "eur",
            product: productId,
            unit_amount: amountCents,
            recurring: {
              interval: intervalMap[frequency],
            },
          },
        },
      ],
      payment_behavior: "default_incomplete",
      payment_settings: {
        save_default_payment_method: "on_subscription",
      },
      expand: [
        "latest_invoice",
        "latest_invoice.payment_intent",
        "latest_invoice.confirmation_secret",
      ],
      metadata: {
        mosque_id: mosque.id,
        fund_id,
        donor_id: donorId,
        campaign_id: campaign_id || "",
        periodic_gift_agreement_id: periodic_gift_agreement_id || "",
      },
      ...anchorParams,
      ...transferParams,
    })) as Stripe.Subscription & {
      latest_invoice: ExpandedInvoice;
    };

    // Generate cancel token
    const cancelToken = crypto.randomUUID();

    // Create recurrings record
    const { error: recurringError } = await admin.from("recurrings").insert({
      mosque_id: mosque.id,
      donor_id: donorId,
      fund_id,
      amount: amountCents,
      frequency,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      status: "active",
      cancel_token: cancelToken,
      ...(periodic_gift_agreement_id ? { periodic_gift_agreement_id } : {}),
    });

    if (recurringError) {
      console.error("Failed to create recurring record:", recurringError);
      // Don't fail — subscription is created, webhook will handle payments
    }

    // Extract client_secret from the expanded invoice's PaymentIntent.
    const clientSecret = await extractClientSecret(subscription.latest_invoice);

    if (!clientSecret) {
      console.error(
        "Failed to extract client_secret from subscription",
        subscription.id,
        "invoice status:",
        subscription.latest_invoice.status,
      );
      return NextResponse.json(
        {
          error:
            "Betalingsgegevens konden niet worden opgehaald. Probeer het opnieuw.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      clientSecret,
      subscriptionId: subscription.id,
    });
  } catch (err) {
    console.error("Subscription creation error:", err);
    return NextResponse.json(
      { error: "Abonnement aanmaken mislukt" },
      { status: 500 },
    );
  }
}
