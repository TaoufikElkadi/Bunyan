import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { buildTransferParams } from '@/lib/stripe-connect'
import crypto from 'crypto'

/**
 * Creates a Stripe Subscription for recurring donations.
 * Public endpoint — donors are not logged in.
 */
export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)
    const { success } = rateLimit(`subscribe:${ip}`, 5, 60_000)
    if (!success) {
      return NextResponse.json({ error: 'Te veel verzoeken, probeer later opnieuw' }, { status: 429 })
    }

    const body = await request.json()
    const { mosque_slug, fund_id, amount, frequency, donor_name, donor_email, campaign_id } = body

    // Validate required fields
    if (!mosque_slug || !fund_id || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'mosque_slug, fund_id, and amount are required' },
        { status: 400 }
      )
    }

    if (!donor_email) {
      return NextResponse.json(
        { error: 'E-mailadres is vereist voor terugkerende donaties' },
        { status: 400 }
      )
    }

    const validFrequencies = ['weekly', 'monthly', 'yearly'] as const
    if (!validFrequencies.includes(frequency)) {
      return NextResponse.json(
        { error: 'Ongeldige frequentie' },
        { status: 400 }
      )
    }

    const amountCents = Math.round(amount * 100)
    if (amountCents < 100) {
      return NextResponse.json(
        { error: 'Minimum donatie is €1,00' },
        { status: 400 }
      )
    }

    if (amountCents > 10_000_00) {
      return NextResponse.json(
        { error: 'Maximum donatie is €10.000' },
        { status: 400 }
      )
    }

    const admin = createAdminClient()

    // Look up mosque by slug (must be approved)
    const { data: mosque } = await admin
      .from('mosques')
      .select('id, name, status')
      .eq('slug', mosque_slug)
      .single()

    if (!mosque || mosque.status !== 'active') {
      return NextResponse.json({ error: 'Moskee niet gevonden' }, { status: 404 })
    }

    // Verify fund belongs to this mosque and is active
    const { data: fund } = await admin
      .from('funds')
      .select('id, name')
      .eq('id', fund_id)
      .eq('mosque_id', mosque.id)
      .eq('is_active', true)
      .single()

    if (!fund) {
      return NextResponse.json({ error: 'Fonds niet gevonden' }, { status: 404 })
    }

    // Find or create donor (email is required for recurring)
    let donorId: string

    const { data: existingDonor } = await admin
      .from('donors')
      .select('id')
      .eq('mosque_id', mosque.id)
      .eq('email', donor_email)
      .single()

    if (existingDonor) {
      donorId = existingDonor.id
      // Update name if provided and donor has no name yet
      if (donor_name) {
        await admin
          .from('donors')
          .update({ name: donor_name, updated_at: new Date().toISOString() })
          .eq('id', donorId)
          .is('name', null)
      }
    } else {
      const { data: newDonor, error: donorError } = await admin
        .from('donors')
        .insert({
          mosque_id: mosque.id,
          name: donor_name || null,
          email: donor_email,
        })
        .select('id')
        .single()

      if (donorError || !newDonor) {
        console.error('Failed to create donor:', donorError)
        return NextResponse.json(
          { error: 'Donor aanmaken mislukt' },
          { status: 500 }
        )
      }
      donorId = newDonor.id
    }

    // Find or create Stripe Customer
    const existingCustomers = await stripe.customers.list({
      email: donor_email,
      limit: 1,
    })

    let customerId: string

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id
    } else {
      const customer = await stripe.customers.create({
        email: donor_email,
        name: donor_name || undefined,
        metadata: {
          mosque_id: mosque.id,
          donor_id: donorId,
        },
      })
      customerId = customer.id
    }

    // Map frequency to Stripe interval
    const intervalMap: Record<string, 'week' | 'month' | 'year'> = {
      weekly: 'week',
      monthly: 'month',
      yearly: 'year',
    }

    // Find or create a Stripe Product for this mosque+fund combo
    const productName = `Donatie aan ${mosque.name} — ${fund.name}`
    // Search for matching product by metadata
    const matchingProducts = await stripe.products.search({
      query: `metadata["mosque_id"]:"${mosque.id}" AND metadata["fund_id"]:"${fund.id}"`,
      limit: 1,
    })

    let productId: string
    if (matchingProducts.data.length > 0) {
      productId = matchingProducts.data[0].id
    } else {
      const product = await stripe.products.create({
        name: productName,
        metadata: {
          mosque_id: mosque.id,
          fund_id: fund.id,
        },
      })
      productId = product.id
    }

    // Build Connect transfer params (routes funds to mosque's Stripe account)
    const transferParams = await buildTransferParams(mosque.id)

    // Create Stripe Subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price_data: {
            currency: 'eur',
            product: productId,
            unit_amount: amountCents,
            recurring: {
              interval: intervalMap[frequency],
            },
          },
        },
      ],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice', 'latest_invoice.payment_intent'],
      metadata: {
        mosque_id: mosque.id,
        fund_id,
        donor_id: donorId,
        campaign_id: campaign_id || '',
      },
      ...transferParams,
    }) as Stripe.Subscription & {
      latest_invoice: Stripe.Invoice & {
        payment_intent?: Stripe.PaymentIntent | string | null
        confirmation_secret?: { client_secret: string } | null
      }
    }

    // Generate cancel token
    const cancelToken = crypto.randomUUID()

    // Create recurrings record
    const { error: recurringError } = await admin
      .from('recurrings')
      .insert({
        mosque_id: mosque.id,
        donor_id: donorId,
        fund_id,
        amount: amountCents,
        frequency,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customerId,
        status: 'active',
        cancel_token: cancelToken,
      })

    if (recurringError) {
      console.error('Failed to create recurring record:', recurringError)
      // Don't fail — subscription is created, webhook will handle payments
    }

    // Extract client_secret from the subscription's latest invoice.
    // In newer Stripe API versions, the invoice may be draft or may not
    // have a PaymentIntent until finalized.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let invoice = subscription.latest_invoice as any
    let clientSecret: string | null | undefined

    // Method 1: confirmation_secret (newer API versions)
    if (invoice.confirmation_secret?.client_secret) {
      clientSecret = invoice.confirmation_secret.client_secret
    }

    // Method 2: payment_intent already expanded on invoice
    if (!clientSecret && invoice.payment_intent) {
      if (typeof invoice.payment_intent === 'object') {
        clientSecret = invoice.payment_intent.client_secret
      } else if (typeof invoice.payment_intent === 'string') {
        const pi = await stripe.paymentIntents.retrieve(invoice.payment_intent)
        clientSecret = pi.client_secret
      }
    }

    // Method 3: invoice is draft — finalize it to create the PaymentIntent
    if (!clientSecret && invoice.status === 'draft') {
      const finalized = await stripe.invoices.finalizeInvoice(invoice.id, {
        expand: ['payment_intent'],
      }) as any
      invoice = finalized
      if (finalized.payment_intent) {
        if (typeof finalized.payment_intent === 'object') {
          clientSecret = finalized.payment_intent.client_secret
        } else if (typeof finalized.payment_intent === 'string') {
          const pi = await stripe.paymentIntents.retrieve(finalized.payment_intent)
          clientSecret = pi.client_secret
        }
      }
    }

    // Method 4: invoice is open but no PI — retrieve it with expansion
    if (!clientSecret && invoice.status === 'open') {
      const retrieved = await stripe.invoices.retrieve(invoice.id, {
        expand: ['payment_intent'],
      }) as any
      if (retrieved.payment_intent) {
        if (typeof retrieved.payment_intent === 'object') {
          clientSecret = retrieved.payment_intent.client_secret
        } else if (typeof retrieved.payment_intent === 'string') {
          const pi = await stripe.paymentIntents.retrieve(retrieved.payment_intent)
          clientSecret = pi.client_secret
        }
      }
    }

    // Method 5: last resort — create a standalone PaymentIntent linked to the sub
    if (!clientSecret) {
      const pi = await stripe.paymentIntents.create({
        amount: invoice.amount_due,
        currency: invoice.currency,
        customer: customerId,
        setup_future_usage: 'off_session',
        metadata: {
          invoice_id: invoice.id,
          subscription_id: subscription.id,
          mosque_id: mosque.id,
          fund_id,
          donor_id: donorId,
          campaign_id: campaign_id || '',
        },
      })
      clientSecret = pi.client_secret
    }

    return NextResponse.json({
      clientSecret,
      subscriptionId: subscription.id,
    })
  } catch (err) {
    console.error('Subscription creation error:', err)
    return NextResponse.json(
      { error: 'Abonnement aanmaken mislukt' },
      { status: 500 }
    )
  }
}
