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

  // ── Plan Usage Reconciliation ─────────────────────────────
  // Count actual completed online donations per mosque this month
  // and fix any drift in plan_usage caused by webhook failures/retries.
  let usageChecked = 0
  let usageCorrected = 0

  try {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthStr = monthStart.toISOString().slice(0, 10) // e.g. "2026-04-01"

    // Get all active mosques
    const { data: mosques, error: mosqueErr } = await admin
      .from('mosques')
      .select('id')
      .eq('status', 'active')

    if (mosqueErr) {
      console.error('Reconcile: Failed to fetch mosques for plan_usage:', mosqueErr)
    } else if (mosques) {
      for (const mosque of mosques) {
        usageChecked++

        try {
          // Count actual completed online donations this month
          // Online = NOT cash and NOT bank_transfer
          const { count: actualCount, error: countErr } = await admin
            .from('donations')
            .select('id', { count: 'exact', head: true })
            .eq('mosque_id', mosque.id)
            .eq('status', 'completed')
            .not('method', 'in', '("cash","bank_transfer")')
            .gte('created_at', monthStart.toISOString())

          if (countErr) {
            console.error(`Reconcile: Failed to count donations for mosque ${mosque.id}:`, countErr)
            continue
          }

          const actual = actualCount ?? 0

          // Get current plan_usage value
          const { data: usage } = await admin
            .from('plan_usage')
            .select('online_donations')
            .eq('mosque_id', mosque.id)
            .eq('month', monthStr)
            .single()

          const recorded = usage?.online_donations ?? 0

          if (actual !== recorded) {
            // Upsert the corrected value
            const { error: upsertErr } = await admin
              .from('plan_usage')
              .upsert(
                { mosque_id: mosque.id, month: monthStr, online_donations: actual },
                { onConflict: 'mosque_id,month' }
              )

            if (upsertErr) {
              console.error(`Reconcile: Failed to correct plan_usage for mosque ${mosque.id}:`, upsertErr)
              continue
            }

            console.log(
              `Reconcile: Corrected plan_usage for mosque ${mosque.id} — ` +
              `was ${recorded}, actual ${actual} (month ${monthStr})`
            )
            usageCorrected++
          }
        } catch (err) {
          console.error(`Reconcile: Error reconciling plan_usage for mosque ${mosque.id}:`, err)
        }
      }
    }
  } catch (err) {
    console.error('Reconcile: Fatal error in plan_usage reconciliation:', err)
  }

  const summary = {
    checked,
    updated,
    missing,
    planUsage: { checked: usageChecked, corrected: usageCorrected },
  }
  console.log('Reconcile: Complete', summary)

  return NextResponse.json(summary)
}
