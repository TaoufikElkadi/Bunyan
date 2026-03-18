import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

/**
 * Cancels a recurring donation by cancel_token.
 * Public endpoint — donors use a unique link.
 */
export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)
    const { success } = rateLimit(`cancel:${ip}`, 5, 60_000)
    if (!success) {
      return NextResponse.json({ error: 'Te veel verzoeken, probeer later opnieuw' }, { status: 429 })
    }

    const body = await request.json()
    const { cancel_token } = body

    if (!cancel_token) {
      return NextResponse.json(
        { error: 'Cancel token is vereist' },
        { status: 400 }
      )
    }

    const admin = createAdminClient()

    // Look up recurring by cancel_token
    const { data: recurring } = await admin
      .from('recurrings')
      .select('id, status, stripe_subscription_id')
      .eq('cancel_token', cancel_token)
      .single()

    if (!recurring) {
      return NextResponse.json(
        { error: 'Terugkerende donatie niet gevonden' },
        { status: 404 }
      )
    }

    if (recurring.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Deze donatie is al geannuleerd' },
        { status: 400 }
      )
    }

    // Cancel the Stripe subscription
    if (recurring.stripe_subscription_id) {
      await stripe.subscriptions.cancel(recurring.stripe_subscription_id)
    }

    // Update status in database
    await admin
      .from('recurrings')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', recurring.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Cancel recurring error:', err)
    return NextResponse.json(
      { error: 'Annulering mislukt' },
      { status: 500 }
    )
  }
}
