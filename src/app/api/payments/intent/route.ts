import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { buildTransferParams } from '@/lib/stripe-connect'
import { calculateCoverFee } from '@/lib/fees'

/**
 * Creates a Stripe PaymentIntent + a pending donation row.
 * Public endpoint — no auth required (donors are not logged in).
 */
export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)
    const { success } = await rateLimit(`payment-intent:${ip}`, 10, 60_000)
    if (!success) {
      return NextResponse.json({ error: 'Te veel verzoeken, probeer later opnieuw' }, { status: 429 })
    }

    const body = await request.json()
    const { mosque_slug, fund_id, amount, donor_name, cover_fee, campaign_id } = body
    const donor_email = typeof body.donor_email === 'string'
      ? body.donor_email.trim().toLowerCase()
      : undefined

    // Validate
    if (!mosque_slug || !fund_id || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'mosque_slug, fund_id, and amount are required' },
        { status: 400 }
      )
    }

    // Amount comes in as euros (e.g. 25.00), convert to cents
    const amountCents = Math.round(amount * 100)

    // Recalculate fee server-side — never trust client-provided fee_amount
    const feeCents = cover_fee ? calculateCoverFee(amountCents, 'stripe') : 0
    const chargeCents = amountCents + feeCents

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

    // Parallelize: fund + campaign + donor lookup + transfer params
    // All depend on mosque.id but are independent of each other
    const [fundResult, campaignResult, transferParams, donorResult] = await Promise.all([
      admin
        .from('funds')
        .select('id, name')
        .eq('id', fund_id)
        .eq('mosque_id', mosque.id)
        .eq('is_active', true)
        .single(),
      campaign_id
        ? admin
            .from('campaigns')
            .select('id')
            .eq('id', campaign_id)
            .eq('mosque_id', mosque.id)
            .single()
        : Promise.resolve({ data: { id: null } }),
      buildTransferParams(mosque.id),
      donor_email
        ? admin
            .from('donors')
            .select('id')
            .eq('mosque_id', mosque.id)
            .eq('email', donor_email)
            .single()
        : Promise.resolve({ data: null }),
    ])

    const fund = fundResult.data
    if (!fund) {
      return NextResponse.json({ error: 'Fonds niet gevonden' }, { status: 404 })
    }

    if (campaign_id && !campaignResult.data) {
      return NextResponse.json({ error: 'Campagne niet gevonden' }, { status: 404 })
    }

    if (!transferParams) {
      return NextResponse.json(
        { error: 'Deze moskee kan nog geen donaties ontvangen. Neem contact op met de beheerder.' },
        { status: 422 }
      )
    }

    // Resolve donor: use existing or create new
    let donorId: string | null = null

    if (donorResult.data) {
      donorId = donorResult.data.id
      if (donor_name) {
        await admin
          .from('donors')
          .update({ name: donor_name, updated_at: new Date().toISOString() })
          .eq('id', donorId)
          .is('name', null)
      }
    } else if (donor_email || donor_name) {
      const { data: newDonor } = await admin
        .from('donors')
        .insert({
          mosque_id: mosque.id,
          name: donor_name || null,
          email: donor_email || null,
        })
        .select('id')
        .single()

      if (newDonor) donorId = newDonor.id
    }

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: chargeCents,
      currency: 'eur',
      metadata: {
        mosque_id: mosque.id,
        fund_id,
        donor_id: donorId || '',
        campaign_id: campaign_id || '',
      },
      // Enable common Dutch payment methods
      automatic_payment_methods: { enabled: true },
      description: `Donatie aan ${mosque.name} — ${fund.name}`,
      ...transferParams,
    })

    // Create pending donation row
    const { error: donationError } = await admin
      .from('donations')
      .insert({
        mosque_id: mosque.id,
        donor_id: donorId,
        fund_id,
        amount: amountCents,
        fee_covered: feeCents,
        campaign_id: campaign_id || null,
        method: 'stripe',
        status: 'pending',
        stripe_payment_intent_id: paymentIntent.id,
      })

    if (donationError) {
      console.error('Failed to create donation row:', donationError)
      // Don't fail — the webhook will handle it
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (err) {
    console.error('Payment intent error:', err)
    return NextResponse.json(
      { error: 'Betaling aanmaken mislukt' },
      { status: 500 }
    )
  }
}
