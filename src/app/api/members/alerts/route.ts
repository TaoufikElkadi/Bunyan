import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('mosque_id')
      .eq('id', user.id)
      .single()

    if (!profile?.mosque_id) {
      return NextResponse.json({ error: 'Geen toestemming' }, { status: 403 })
    }

    const mosqueId = profile.mosque_id
    const now = new Date()
    const twelveMonthsAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString()
    const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

    const [{ data: lapsed }, { data: expiringPeriodic }, { data: recentlyCancelled }] =
      await Promise.all([
        // Donors who were active (donated >=2 times) but last donation > 12 months ago
        supabase
          .from('donors')
          .select('id, name, email, last_donated_at, total_donated, donation_count')
          .eq('mosque_id', mosqueId)
          .lt('last_donated_at', twelveMonthsAgo)
          .gte('donation_count', 2)
          .order('last_donated_at', { ascending: false })
          .limit(25),
        // Periodic gifts expiring within 60 days
        supabase
          .from('periodic_gift_agreements')
          .select('id, donor_id, annual_amount, end_date, donors(name, email)')
          .eq('mosque_id', mosqueId)
          .eq('status', 'active')
          .lte('end_date', sixtyDaysFromNow)
          .order('end_date', { ascending: true })
          .limit(25),
        // Recurrings cancelled in last 30 days
        supabase
          .from('recurrings')
          .select('id, donor_id, amount, frequency, updated_at, donors(name, email)')
          .eq('mosque_id', mosqueId)
          .eq('status', 'cancelled')
          .gte('updated_at', new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .order('updated_at', { ascending: false })
          .limit(25),
      ])

    return NextResponse.json(
      {
        alerts: {
          lapsed_donors: lapsed ?? [],
          expiring_periodic: expiringPeriodic ?? [],
          recently_cancelled: recentlyCancelled ?? [],
        },
      },
      { headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=120' } },
    )
  } catch (err) {
    console.error('Member alerts error:', err)
    return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 })
  }
}
