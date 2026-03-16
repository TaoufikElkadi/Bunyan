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
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const twelveMonthsAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString()

    // Run all segment counts in parallel
    const [
      { count: newDonors },
      { count: loyalDonors },
      { count: activeDonors },
    ] = await Promise.all([
      // New donors in last 30 days
      supabase
        .from('donors')
        .select('id', { count: 'exact', head: true })
        .eq('mosque_id', mosqueId)
        .gte('first_donated_at', thirtyDaysAgo),
      // Loyal: 6+ donations and active
      supabase
        .from('donors')
        .select('id', { count: 'exact', head: true })
        .eq('mosque_id', mosqueId)
        .gte('donation_count', 6)
        .gte('last_donated_at', twelveMonthsAgo),
      // Active (donated in last 12 months)
      supabase
        .from('donors')
        .select('id', { count: 'exact', head: true })
        .eq('mosque_id', mosqueId)
        .gte('last_donated_at', twelveMonthsAgo),
    ])

    // Donors eligible for periodic gift (active, 3+ donations, no periodic)
    const { data: activeIds } = await supabase
      .from('donors')
      .select('id')
      .eq('mosque_id', mosqueId)
      .gte('donation_count', 3)
      .gte('last_donated_at', twelveMonthsAgo)
      .not('email', 'is', null)

    let readyForPeriodic = 0
    if (activeIds && activeIds.length > 0) {
      const { data: withPeriodic } = await supabase
        .from('periodic_gift_agreements')
        .select('donor_id')
        .eq('mosque_id', mosqueId)
        .eq('status', 'active')
        .in('donor_id', activeIds.map((d) => d.id))

      const periodicDonorIds = new Set((withPeriodic ?? []).map((p) => p.donor_id))
      readyForPeriodic = activeIds.filter((d) => !periodicDonorIds.has(d.id)).length
    }

    return NextResponse.json({
      segments: [
        { key: 'new_donors', label: 'Nieuwe donateurs (30d)', count: newDonors ?? 0 },
        { key: 'loyal', label: 'Trouwe donateurs (6+)', count: loyalDonors ?? 0 },
        { key: 'ready_for_periodic', label: 'Klaar voor periodieke gift', count: readyForPeriodic },
        { key: 'active', label: 'Actieve leden', count: activeDonors ?? 0 },
      ],
    })
  } catch (err) {
    console.error('Segments error:', err)
    return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 })
  }
}
