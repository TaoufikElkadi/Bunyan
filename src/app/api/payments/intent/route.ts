import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Creates a Stripe PaymentIntent + a pending donation row.
 * Public endpoint — no auth required (donors are not logged in).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { mosque_slug, fund_id, amount, donor_name, donor_email, cover_fee, fee_amount } = body

    // Validate
    if (!mosque_slug || !fund_id || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'mosque_slug, fund_id, and amount are required' },
        { status: 400 }
      )
    }

    // Amount comes in as euros (e.g. 25.00), convert to cents
    const amountCents = Math.round(amount * 100)

    // Add fee if donor opted to cover it
    const feeCents = cover_fee && typeof fee_amount === 'number' && fee_amount > 0
      ? Math.round(fee_amount)
      : 0
    const chargeCents = amountCents + feeCents

    if (amountCents < 100) {
      return NextResponse.json(
        { error: 'Minimum donatie is €1,00' },
        { status: 400 }
      )
    }

    const admin = createAdminClient()

    // Look up mosque by slug
    const { data: mosque } = await admin
      .from('mosques')
      .select('id, name')
      .eq('slug', mosque_slug)
      .single()

    if (!mosque) {
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

    // Find or create donor
    let donorId: string | null = null

    if (donor_email || donor_name) {
      if (donor_email) {
        const { data: existing } = await admin
          .from('donors')
          .select('id')
          .eq('mosque_id', mosque.id)
          .eq('email', donor_email)
          .single()

        if (existing) {
          donorId = existing.id
          if (donor_name) {
            await admin
              .from('donors')
              .update({ name: donor_name, updated_at: new Date().toISOString() })
              .eq('id', donorId)
              .is('name', null)
          }
        }
      }

      if (!donorId) {
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
    }

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: chargeCents,
      currency: 'eur',
      metadata: {
        mosque_id: mosque.id,
        mosque_slug,
        fund_id,
        fund_name: fund.name,
        donor_id: donorId || '',
        donor_name: donor_name || '',
        donor_email: donor_email || '',
      },
      // Enable common Dutch payment methods
      automatic_payment_methods: { enabled: true },
      description: `Donatie aan ${mosque.name} — ${fund.name}`,
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
