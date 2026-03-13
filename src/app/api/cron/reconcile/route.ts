import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Nightly reconciliation cron job.
 * Checks Stripe PaymentIntents from the last 48 hours against the donations
 * table to catch any missed webhooks.
 *
 * Protected by CRON_SECRET header. Scheduled via Vercel Cron at 02:00 UTC.
 */
export async function GET(request: Request) {
  // Auth: verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const fortyEightHoursAgo = Math.floor((Date.now() - 48 * 60 * 60 * 1000) / 1000)

  let checked = 0
  let updated = 0
  let missing = 0

  try {
    // Auto-paginate through all PaymentIntents from the last 48 hours
    for await (const pi of stripe.paymentIntents.list({
      created: { gte: fortyEightHoursAgo },
      limit: 100,
    })) {
      checked++

      try {
        // Look up donation by stripe_payment_intent_id
        const { data: donation, error } = await admin
          .from('donations')
          .select('id, status')
          .eq('stripe_payment_intent_id', pi.id)
          .single()

        if (error || !donation) {
          console.warn(`Reconcile: Stripe PI ${pi.id} (${pi.status}) not found in donations table`)
          missing++
          continue
        }

        // Check for status mismatches
        if (pi.status === 'succeeded' && donation.status !== 'completed') {
          await admin
            .from('donations')
            .update({
              status: 'completed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', donation.id)

          console.log(`Reconcile: Updated donation ${donation.id} to completed (was ${donation.status})`)
          updated++
        } else if (
          (pi.status === 'canceled' || pi.status === 'requires_payment_method') &&
          donation.status === 'pending'
        ) {
          await admin
            .from('donations')
            .update({
              status: 'failed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', donation.id)

          console.log(`Reconcile: Updated donation ${donation.id} to failed (was pending, Stripe status: ${pi.status})`)
          updated++
        }
        // else: statuses match, no action needed
      } catch (err) {
        // One bad payment shouldn't stop the whole reconciliation
        console.error(`Reconcile: Error processing PI ${pi.id}:`, err)
      }
    }
  } catch (err) {
    console.error('Reconcile: Fatal error fetching PaymentIntents:', err)
    return NextResponse.json(
      { error: 'Reconciliation failed', details: String(err) },
      { status: 500 }
    )
  }

  const summary = { checked, updated, missing }
  console.log('Reconcile: Complete', summary)

  return NextResponse.json(summary)
}
