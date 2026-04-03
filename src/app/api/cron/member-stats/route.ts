import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Nightly cron: recompute donor intelligence fields.
 * Calculates avg_donation_amount, donation_frequency, estimated_annual.
 * Scheduled via Vercel Cron alongside reconcile at 02:15 UTC.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  let updated = 0
  let errors = 0

  try {
    // Fetch all donors who have donations
    const { data: donors, error } = await admin
      .from('donors')
      .select('id, mosque_id')
      .gt('donation_count', 0)

    if (error || !donors) {
      console.error('Member stats cron: failed to fetch donors', error)
      return NextResponse.json({ error: 'Failed to fetch donors' }, { status: 500 })
    }

    for (const donor of donors) {
      try {
        // Get donation timestamps and amounts for this donor
        const { data: donations } = await admin
          .from('donations')
          .select('amount, created_at')
          .eq('donor_id', donor.id)
          .eq('status', 'completed')
          .order('created_at', { ascending: true })

        if (!donations || donations.length === 0) continue

        const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0)
        const avgAmount = Math.round(totalAmount / donations.length)

        // Compute frequency from donation intervals
        const frequency = computeFrequency(donations.map((d) => d.created_at))

        // Estimate annual based on frequency
        const multiplier = getFrequencyMultiplier(frequency)
        const estimatedAnnual = Math.round(avgAmount * multiplier)

        await admin
          .from('donors')
          .update({
            avg_donation_amount: avgAmount,
            donation_frequency: frequency,
            estimated_annual: estimatedAnnual,
            last_computed_at: new Date().toISOString(),
          })
          .eq('id', donor.id)

        updated++
      } catch (err) {
        console.error(`Member stats cron: error for donor ${donor.id}:`, err)
        errors++
      }
    }
  } catch (err) {
    console.error('Member stats cron: fatal error', err)
    return NextResponse.json({ error: 'Cron failed', details: String(err) }, { status: 500 })
  }

  const summary = { updated, errors }
  console.log('Member stats cron: complete', summary)
  return NextResponse.json(summary)
}

function computeFrequency(dates: string[]): string | null {
  if (dates.length < 2) return null

  // Calculate median interval in days
  const intervals: number[] = []
  for (let i = 1; i < dates.length; i++) {
    const diff = new Date(dates[i]).getTime() - new Date(dates[i - 1]).getTime()
    intervals.push(diff / (24 * 60 * 60 * 1000))
  }

  intervals.sort((a, b) => a - b)
  const median = intervals[Math.floor(intervals.length / 2)]

  if (median <= 10) return 'weekly'
  if (median <= 45) return 'monthly'
  if (median <= 120) return 'quarterly'
  if (median <= 400) return 'yearly'
  return 'irregular'
}

function getFrequencyMultiplier(frequency: string | null): number {
  switch (frequency) {
    case 'weekly': return 52
    case 'monthly': return 12
    case 'quarterly': return 4
    case 'yearly': return 1
    default: return 1
  }
}
