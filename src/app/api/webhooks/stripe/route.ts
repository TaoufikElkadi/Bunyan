import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail, sendMosqueEmail } from '@/lib/email/send'
import { donationConfirmationEmail } from '@/lib/email/templates/donation-confirmation'
import { recurringCancelledEmail } from '@/lib/email/templates/recurring-cancelled'
import { webhookAlertEmail } from '@/lib/email/templates/webhook-alert'

type AdminClient = ReturnType<typeof createAdminClient>

// ---------------------------------------------------------------------------
// In-memory cooldown: max 1 alert per event type per 5 minutes
// ---------------------------------------------------------------------------
const alertCooldowns = new Map<string, number>()
const ALERT_COOLDOWN_MS = 5 * 60 * 1000

function shouldSendAlert(eventType: string): boolean {
  const now = Date.now()
  const lastSent = alertCooldowns.get(eventType)
  if (lastSent && now - lastSent < ALERT_COOLDOWN_MS) return false
  alertCooldowns.set(eventType, now)
  return true
}

function sendWebhookAlert(eventType: string, errorMessage: string, eventId?: string) {
  const alertEmail = process.env.ALERT_EMAIL
  if (!alertEmail) return
  if (!shouldSendAlert(eventType)) return

  const html = webhookAlertEmail({ eventType, errorMessage, eventId })
  // Fire-and-forget — don't block the webhook response
  void sendEmail({
    to: alertEmail,
    subject: `⚠️ Webhook fout — Bunyan [${eventType}]`,
    html,
  }).catch((emailErr) => {
    console.error('Failed to send webhook alert email:', emailErr)
  })
}

/** Bust ISR cache for donation-related dashboard pages. */
function revalidateDonationPages() {
  revalidatePath('/dashboard')
  revalidatePath('/donaties')
}

/**
 * Verify that a mosque_id from Stripe metadata refers to a real, active mosque.
 * Returns true if the mosque exists and is active; false otherwise.
 */
async function verifyActiveMosque(admin: AdminClient, mosqueId: string): Promise<boolean> {
  const { data } = await admin
    .from('mosques')
    .select('id')
    .eq('id', mosqueId)
    .eq('status', 'active')
    .single()

  return !!data
}

/**
 * Stripe webhook handler.
 * Verifies signature, then updates donation/recurring status.
 */
export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const admin = createAdminClient()

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object
        await handlePaymentSuccess(admin, pi)
        break
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object
        await handlePaymentFailed(admin, pi)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object
        await handleInvoicePaymentSucceeded(admin, invoice)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        await handleSubscriptionDeleted(admin, subscription)
        break
      }

      case 'checkout.session.completed': {
        const session = event.data.object
        await handleCheckoutSessionCompleted(admin, session)
        break
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account
        await handleAccountUpdated(admin, account)
        break
      }

      default:
        break
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error(`Webhook handler error for ${event.type}:`, err)
    sendWebhookAlert(event.type, errorMessage, event.id)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function handlePaymentSuccess(
  admin: AdminClient,
  pi: { id: string; metadata: Record<string, string> }
) {
  // Find donation by stripe_payment_intent_id
  const { data: donation } = await admin
    .from('donations')
    .select('id, status')
    .eq('stripe_payment_intent_id', pi.id)
    .single()

  if (!donation) {
    // This PI might be the first payment of a subscription.
    // Look up via Stripe to check if it belongs to an invoice/subscription.
    await handleFirstSubscriptionPayment(admin, pi.id)
    return
  }

  // Idempotency: skip if already completed
  if (donation.status === 'completed') return

  const { error: updateError } = await admin
    .from('donations')
    .update({
      status: 'completed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', donation.id)

  if (updateError) {
    throw new Error(`Failed to update donation ${donation.id}: ${updateError.message}`)
  }

  revalidateDonationPages()

  // Increment plan usage counter for online donations
  if (pi.metadata.mosque_id) {
    await incrementPlanUsage(admin, pi.metadata.mosque_id)
  }

  // Send donation confirmation email (non-blocking — don't fail the webhook)
  try {
    await sendDonationConfirmation(admin, pi.id, pi.metadata)
  } catch (emailErr) {
    console.error('Donation confirmation email error:', emailErr)
  }

  // Donor aggregates are updated automatically via DB trigger
}

/**
 * Handles the first payment of a subscription.
 * When a subscription is created with payment_behavior: 'default_incomplete',
 * the first charge triggers payment_intent.succeeded (not invoice.payment_succeeded).
 * We create the first donation row here.
 */
async function handleFirstSubscriptionPayment(
  admin: AdminClient,
  paymentIntentId: string
) {
  // Retrieve the PI from Stripe to find the subscription
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId) as any

  let subscriptionId: string | null = null

  // Path 1: PI is linked to an invoice (standard subscription flow)
  const invoiceId = typeof pi.invoice === 'string' ? pi.invoice : pi.invoice?.id
  if (invoiceId) {
    const invoice = await stripe.invoices.retrieve(invoiceId) as any
    subscriptionId =
      invoice.subscription
      ?? invoice.parent?.subscription_details?.subscription
      ?? null
  }

  // Path 2: Standalone PI with subscription_id in metadata (Method 5 fallback)
  if (!subscriptionId && pi.metadata?.subscription_id) {
    subscriptionId = pi.metadata.subscription_id
  }

  if (!subscriptionId) return

  // Find the recurring record
  const { data: recurring } = await admin
    .from('recurrings')
    .select('id, mosque_id, donor_id, fund_id, amount, frequency')
    .eq('stripe_subscription_id', subscriptionId)
    .single()

  if (!recurring) {
    // Recurring record may not exist yet (race condition between subscribe API and webhook).
    // Fall back to PI metadata to avoid losing the donation.
    console.error(`Webhook: subscription ${subscriptionId} not found in recurrings, falling back to PI metadata`)

    if (pi.metadata?.mosque_id && pi.metadata?.fund_id) {
      // Verify mosque exists and is active before inserting from metadata
      const mosqueValid = await verifyActiveMosque(admin, pi.metadata.mosque_id)
      if (!mosqueValid) {
        console.warn(
          `Webhook: skipping fallback donation insert — mosque ${pi.metadata.mosque_id} not found or not active (PI ${paymentIntentId})`
        )
        return
      }

      const { data: existing } = await admin
        .from('donations')
        .select('id')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .single()

      if (existing) return

      const { error: fallbackError } = await admin
        .from('donations')
        .insert({
          mosque_id: pi.metadata.mosque_id,
          donor_id: pi.metadata.donor_id || null,
          fund_id: pi.metadata.fund_id,
          amount: pi.amount,
          campaign_id: pi.metadata.campaign_id || null,
          method: 'stripe',
          status: 'completed',
          is_recurring: true,
          stripe_payment_intent_id: paymentIntentId,
        })

      if (fallbackError) {
        throw new Error(`Failed to insert fallback recurring donation: ${fallbackError.message}`)
      }

      revalidateDonationPages()

      if (pi.metadata.mosque_id) {
        await incrementPlanUsage(admin, pi.metadata.mosque_id)
      }
    }
    return
  }

  // Idempotency: check if donation for this PI already exists
  const { data: existing } = await admin
    .from('donations')
    .select('id')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .single()

  if (existing) return

  // Get campaign_id from PI metadata or subscription metadata
  const campaignId = pi.metadata?.campaign_id || null

  // Create the first donation record
  const { error: insertError } = await admin
    .from('donations')
    .insert({
      mosque_id: recurring.mosque_id,
      donor_id: recurring.donor_id,
      fund_id: recurring.fund_id,
      amount: recurring.amount,
      campaign_id: campaignId || null,
      method: 'stripe',
      status: 'completed',
      is_recurring: true,
      recurring_id: recurring.id,
      stripe_payment_intent_id: paymentIntentId,
    })

  if (insertError) {
    throw new Error(`Failed to insert first recurring donation: ${insertError.message}`)
  }

  revalidateDonationPages()

  await incrementPlanUsage(admin, recurring.mosque_id)

  // Send confirmation email (non-blocking)
  try {
    await sendRecurringPaymentConfirmation(admin, recurring)
  } catch (emailErr) {
    console.error('First recurring payment confirmation email error:', emailErr)
  }
}

async function incrementPlanUsage(admin: AdminClient, mosqueId: string) {
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)
  const monthStr = monthStart.toISOString().slice(0, 10)

  const { error } = await admin.rpc('increment_plan_usage', {
    p_mosque_id: mosqueId,
    p_month: monthStr,
  })

  if (error) {
    console.error(`Failed to increment plan usage for mosque ${mosqueId}:`, error)
  }
}

async function handlePaymentFailed(
  admin: AdminClient,
  pi: { id: string }
) {
  const { data: donation } = await admin
    .from('donations')
    .select('id, status')
    .eq('stripe_payment_intent_id', pi.id)
    .single()

  if (!donation) return
  if (donation.status === 'failed') return

  const { error: updateError } = await admin
    .from('donations')
    .update({
      status: 'failed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', donation.id)

  if (updateError) {
    throw new Error(`Failed to update donation ${donation.id}: ${updateError.message}`)
  }

  revalidateDonationPages()
}

async function handleInvoicePaymentSucceeded(
  admin: AdminClient,
  invoice: Stripe.Invoice
) {
  // Extract subscription ID from parent.subscription_details (Stripe SDK v20+)
  const subDetails = invoice.parent?.subscription_details
  const subscriptionId =
    typeof subDetails?.subscription === 'string'
      ? subDetails.subscription
      : subDetails?.subscription?.id ?? null

  if (!subscriptionId) {
    console.log('Webhook invoice.payment_succeeded: no subscriptionId found', {
      invoiceId: invoice.id,
      parent: JSON.stringify(invoice.parent),
      subscription: (invoice as any).subscription,
    })
    return
  }

  // Extract payment_intent ID from the invoice's payments list
  // In Stripe v20, payment_intent is not directly on Invoice
  // We use the invoice ID as a fallback idempotency key
  const paymentIntentId = invoice.id

  // Find recurring by stripe_subscription_id
  const { data: recurring } = await admin
    .from('recurrings')
    .select('id, mosque_id, donor_id, fund_id, amount, frequency')
    .eq('stripe_subscription_id', subscriptionId)
    .single()

  if (!recurring) {
    console.error(`Webhook: subscription ${subscriptionId} not found in recurrings`)
    return
  }

  // Idempotency: check if donation for this invoice already exists
  if (paymentIntentId) {
    const { data: existingDonation } = await admin
      .from('donations')
      .select('id')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .single()

    if (existingDonation) return // Already processed
  }

  // Get campaign_id from the subscription metadata
  let campaignId: string | null = null
  try {
    const sub = await stripe.subscriptions.retrieve(subscriptionId) as any
    campaignId = sub.metadata?.campaign_id || null
  } catch {
    // Non-critical — proceed without campaign tracking
  }

  // Create a new donation record for this recurring payment
  const { error: insertError } = await admin
    .from('donations')
    .insert({
      mosque_id: recurring.mosque_id,
      donor_id: recurring.donor_id,
      fund_id: recurring.fund_id,
      amount: recurring.amount,
      campaign_id: campaignId || null,
      method: 'stripe',
      status: 'completed',
      is_recurring: true,
      recurring_id: recurring.id,
      stripe_payment_intent_id: paymentIntentId,
    })

  if (insertError) {
    throw new Error(`Failed to insert recurring donation: ${insertError.message}`)
  }

  revalidateDonationPages()

  await incrementPlanUsage(admin, recurring.mosque_id)

  // Calculate next_charge_at based on frequency
  const now = new Date()
  let nextCharge: Date

  switch (recurring.frequency) {
    case 'weekly':
      nextCharge = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      break
    case 'monthly':
      nextCharge = new Date(now)
      nextCharge.setMonth(nextCharge.getMonth() + 1)
      break
    case 'yearly':
      nextCharge = new Date(now)
      nextCharge.setFullYear(nextCharge.getFullYear() + 1)
      break
    default:
      nextCharge = new Date(now)
      nextCharge.setMonth(nextCharge.getMonth() + 1)
  }

  const { error: recurringUpdateError } = await admin
    .from('recurrings')
    .update({
      next_charge_at: nextCharge.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', recurring.id)

  if (recurringUpdateError) {
    throw new Error(`Failed to update recurring ${recurring.id}: ${recurringUpdateError.message}`)
  }

  // Send recurring payment confirmation email (non-blocking)
  try {
    await sendRecurringPaymentConfirmation(admin, recurring)
  } catch (emailErr) {
    console.error('Recurring payment confirmation email error:', emailErr)
  }
}

async function handleSubscriptionDeleted(
  admin: AdminClient,
  subscription: { id: string }
) {
  const { data: recurring } = await admin
    .from('recurrings')
    .select('id, status')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  if (!recurring) return
  if (recurring.status === 'cancelled') return

  const { error: updateError } = await admin
    .from('recurrings')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', recurring.id)

  if (updateError) {
    throw new Error(`Failed to cancel recurring ${recurring.id}: ${updateError.message}`)
  }

  revalidateDonationPages()

  // Send cancellation confirmation email (non-blocking)
  try {
    await sendRecurringCancelEmail(admin, recurring.id)
  } catch (emailErr) {
    console.error('Recurring cancel email error:', emailErr)
  }
}

async function handleCheckoutSessionCompleted(
  admin: AdminClient,
  session: Stripe.Checkout.Session
) {
  const mosqueId = session.metadata?.mosque_id
  const plan = session.metadata?.plan

  if (!mosqueId || !plan) {
    console.error('Webhook: checkout.session.completed missing mosque_id or plan metadata')
    return
  }

  // Verify mosque exists and is active before updating plan from metadata
  const mosqueValid = await verifyActiveMosque(admin, mosqueId)
  if (!mosqueValid) {
    console.warn(
      `Webhook: skipping checkout plan update — mosque ${mosqueId} not found or not active (session ${session.id})`
    )
    return
  }

  const customerId =
    typeof session.customer === 'string'
      ? session.customer
      : session.customer?.id ?? null

  if (!customerId) {
    console.error('Webhook: checkout.session.completed missing customer ID')
    return
  }

  const { error: updateError } = await admin
    .from('mosques')
    .update({
      plan,
      plan_started_at: new Date().toISOString(),
      stripe_customer_id: customerId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', mosqueId)

  if (updateError) {
    throw new Error(`Failed to update mosque ${mosqueId} plan to ${plan}: ${updateError.message}`)
  }
}

async function sendDonationConfirmation(
  admin: AdminClient,
  paymentIntentId: string,
  metadata: Record<string, string>
) {
  const { mosque_id, donor_id, fund_id } = metadata
  if (!mosque_id) return

  // Look up donor from database instead of metadata (GDPR: no PII in Stripe metadata)
  let donorName: string | undefined
  let donorEmail: string | undefined
  if (donor_id) {
    const { data: donor } = await admin
      .from('donors')
      .select('name, email')
      .eq('id', donor_id)
      .single()

    donorName = donor?.name || undefined
    donorEmail = donor?.email || undefined
  }

  if (!donorEmail) return

  const { data: mosque } = await admin
    .from('mosques')
    .select('name, contact_email')
    .eq('id', mosque_id)
    .single()

  if (!mosque) return

  // Look up fund name from database instead of metadata
  let fundName = 'Algemeen'
  if (fund_id) {
    const { data: fund } = await admin
      .from('funds')
      .select('name')
      .eq('id', fund_id)
      .single()

    if (fund?.name) fundName = fund.name
  }

  // Fetch the donation record for accurate amount + recurring info
  const { data: donation } = await admin
    .from('donations')
    .select('amount, is_recurring, recurring_id')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .single()

  // If recurring, look up cancel token and frequency
  let cancelUrl: string | undefined
  let frequency: string | undefined
  if (donation?.is_recurring && donation.recurring_id) {
    const { data: recurring } = await admin
      .from('recurrings')
      .select('cancel_token, frequency')
      .eq('id', donation.recurring_id)
      .single()

    if (recurring?.cancel_token) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      cancelUrl = `${appUrl}/annuleren/${recurring.cancel_token}`
      frequency = recurring.frequency
    }
  }

  const html = donationConfirmationEmail({
    mosqueName: mosque.name,
    donorName: donorName,
    amount: donation?.amount ?? 0,
    fundName,
    method: 'Online',
    date: new Date().toLocaleDateString('nl-NL'),
    isRecurring: !!donation?.is_recurring,
    frequency,
    cancelUrl,
  })

  await sendMosqueEmail({
    to: donorEmail,
    subject: `Donatiebevestiging — ${mosque.name}`,
    html,
    mosqueName: mosque.name,
    mosqueContactEmail: mosque.contact_email,
  })
}

async function sendRecurringPaymentConfirmation(
  admin: AdminClient,
  recurring: { id: string; mosque_id: string; donor_id: string; fund_id: string; amount: number; frequency: string }
) {
  const { data: donor } = await admin
    .from('donors')
    .select('name, email')
    .eq('id', recurring.donor_id)
    .single()

  if (!donor?.email) return

  const { data: mosque } = await admin
    .from('mosques')
    .select('name, contact_email')
    .eq('id', recurring.mosque_id)
    .single()

  if (!mosque) return

  const { data: fund } = await admin
    .from('funds')
    .select('name')
    .eq('id', recurring.fund_id)
    .single()

  const { data: rec } = await admin
    .from('recurrings')
    .select('cancel_token')
    .eq('id', recurring.id)
    .single()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const cancelUrl = rec?.cancel_token ? `${appUrl}/annuleren/${rec.cancel_token}` : undefined

  const html = donationConfirmationEmail({
    mosqueName: mosque.name,
    donorName: donor.name || undefined,
    amount: recurring.amount,
    fundName: fund?.name || 'Algemeen',
    method: 'Online',
    date: new Date().toLocaleDateString('nl-NL'),
    isRecurring: true,
    frequency: recurring.frequency,
    cancelUrl,
  })

  await sendMosqueEmail({
    to: donor.email,
    subject: `Donatiebevestiging — ${mosque.name}`,
    html,
    mosqueName: mosque.name,
    mosqueContactEmail: mosque.contact_email,
  })
}

async function sendRecurringCancelEmail(
  admin: AdminClient,
  recurringId: string
) {
  const { data: recurring } = await admin
    .from('recurrings')
    .select('amount, frequency, fund_id, donor_id, mosque_id, funds(name), donors(name, email), mosques(name, contact_email)')
    .eq('id', recurringId)
    .single()

  if (!recurring) return

  const donor = recurring.donors as any
  const mosque = recurring.mosques as any
  const fund = recurring.funds as any

  if (!donor?.email) return

  const html = recurringCancelledEmail({
    mosqueName: mosque?.name || 'Uw moskee',
    donorName: donor.name || undefined,
    amount: recurring.amount,
    frequency: recurring.frequency,
    fundName: fund?.name || 'Algemeen',
  })

  await sendMosqueEmail({
    to: donor.email,
    subject: `Donatie stopgezet — ${mosque?.name || 'Bunyan'}`,
    html,
    mosqueName: mosque?.name || 'Bunyan',
    mosqueContactEmail: mosque?.contact_email,
  })
}

async function handleAccountUpdated(
  admin: AdminClient,
  account: Stripe.Account
) {
  const mosqueId = account.metadata?.mosque_id
  if (!mosqueId) return

  // Find the mosque to check current state
  const { data: mosque } = await admin
    .from('mosques')
    .select('id, stripe_connected_at')
    .eq('id', mosqueId)
    .eq('stripe_account_id', account.id)
    .single()

  if (!mosque) return

  const isConnected = !!mosque.stripe_connected_at
  const chargesEnabled = !!account.charges_enabled

  // Log pending requirements for visibility (common with Dutch non-profits)
  if (account.requirements?.currently_due?.length) {
    console.warn(
      `[Stripe Connect] Mosque ${mosque.id} has pending requirements:`,
      account.requirements.currently_due
    )
  }
  if (account.requirements?.past_due?.length) {
    console.warn(
      `[Stripe Connect] Mosque ${mosque.id} has PAST DUE requirements:`,
      account.requirements.past_due
    )
  }

  // Idempotency: only write if state actually changed
  if (chargesEnabled && isConnected) return
  if (!chargesEnabled && !isConnected) return

  if (chargesEnabled) {
    // charges_enabled became true → mark as connected
    const { error: updateError } = await admin
      .from('mosques')
      .update({
        stripe_connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', mosque.id)

    if (updateError) {
      throw new Error(`Failed to mark mosque ${mosque.id} as Stripe connected: ${updateError.message}`)
    }
    console.log(`[Stripe Connect] Mosque ${mosque.id} is now connected (charges enabled)`)
  } else {
    // charges_enabled became false → clear connected status so
    // buildTransferParams stops routing payments and dashboard reflects reality
    const { error: updateError } = await admin
      .from('mosques')
      .update({
        stripe_connected_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', mosque.id)

    if (updateError) {
      throw new Error(`Failed to clear Stripe connected status for mosque ${mosque.id}: ${updateError.message}`)
    }
    console.warn(
      `[Stripe Connect] Mosque ${mosque.id} charges DISABLED — stripe_connected_at cleared. ` +
      `Payouts enabled: ${account.payouts_enabled}, ` +
      `Disabled reason: ${account.requirements?.disabled_reason || 'none'}`
    )
  }
}
