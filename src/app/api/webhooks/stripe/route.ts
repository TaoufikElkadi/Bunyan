import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

type AdminClient = ReturnType<typeof createAdminClient>

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
    console.error(`Webhook handler error for ${event.type}:`, err)
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
    console.error(`Webhook: payment ${pi.id} not found in database`)
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

  // Increment plan usage counter for online donations
  if (pi.metadata.mosque_id) {
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    const monthStr = monthStart.toISOString().slice(0, 10)

    const { error: rpcError } = await admin.rpc('increment_plan_usage', {
      p_mosque_id: pi.metadata.mosque_id,
      p_month: monthStr,
    })

    if (rpcError) {
      console.error(`Failed to increment plan usage for mosque ${pi.metadata.mosque_id}:`, rpcError)
    }
  }

  // Donor aggregates are updated automatically via DB trigger
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

  if (!subscriptionId) return

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

  // Create a new donation record for this recurring payment
  const { error: insertError } = await admin
    .from('donations')
    .insert({
      mosque_id: recurring.mosque_id,
      donor_id: recurring.donor_id,
      fund_id: recurring.fund_id,
      amount: recurring.amount,
      method: 'stripe',
      status: 'completed',
      is_recurring: true,
      recurring_id: recurring.id,
      stripe_payment_intent_id: paymentIntentId,
    })

  if (insertError) {
    throw new Error(`Failed to insert recurring donation: ${insertError.message}`)
  }

  // Increment plan usage counter for online donations
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)
  const monthStr = monthStart.toISOString().slice(0, 10)

  const { error: rpcError } = await admin.rpc('increment_plan_usage', {
    p_mosque_id: recurring.mosque_id,
    p_month: monthStr,
  })

  if (rpcError) {
    console.error(`Failed to increment plan usage for mosque ${recurring.mosque_id}:`, rpcError)
  }

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

async function handleAccountUpdated(
  admin: AdminClient,
  account: Stripe.Account
) {
  const mosqueId = account.metadata?.mosque_id
  if (!mosqueId) return

  // Only mark as connected when charges are enabled (onboarding complete)
  if (!account.charges_enabled) return

  // Find the mosque and check if already marked as connected
  const { data: mosque } = await admin
    .from('mosques')
    .select('id, stripe_connected_at')
    .eq('id', mosqueId)
    .eq('stripe_account_id', account.id)
    .single()

  if (!mosque) return

  // Idempotency: skip if already connected
  if (mosque.stripe_connected_at) return

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
}
