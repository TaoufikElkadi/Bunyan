import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeMemberStatus, computeChurnRisk, daysSince } from '@/lib/member-status'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    const [{ data: donor }, { data: recurrings }, { data: periodics }, { data: recentEvents }] =
      await Promise.all([
        supabase
          .from('donors')
          .select('*, households(id, name)')
          .eq('id', id)
          .eq('mosque_id', profile.mosque_id)
          .single(),
        supabase
          .from('recurrings')
          .select('id, status, amount, frequency')
          .eq('donor_id', id)
          .eq('mosque_id', profile.mosque_id),
        supabase
          .from('periodic_gift_agreements')
          .select('id, status, annual_amount, start_date, end_date')
          .eq('donor_id', id)
          .eq('mosque_id', profile.mosque_id),
        supabase
          .from('member_events')
          .select('*')
          .eq('donor_id', id)
          .eq('mosque_id', profile.mosque_id)
          .order('created_at', { ascending: false })
          .limit(50),
      ])

    if (!donor) {
      return NextResponse.json({ error: 'Lid niet gevonden' }, { status: 404 })
    }

    const hasActiveRecurring = (recurrings ?? []).some((r) => r.status === 'active')
    const hasActivePeriodic = (periodics ?? []).some((p) => p.status === 'active')

    const input = {
      email: donor.email,
      name: donor.name,
      last_donated_at: donor.last_donated_at,
      has_active_recurring: hasActiveRecurring,
      has_active_periodic: hasActivePeriodic,
    }

    return NextResponse.json({
      member: {
        ...donor,
        member_status: computeMemberStatus(input),
        churn_risk: computeChurnRisk(input),
        has_active_recurring: hasActiveRecurring,
        has_active_periodic: hasActivePeriodic,
        days_since_last: daysSince(donor.last_donated_at),
        recurrings: recurrings ?? [],
        periodic_gifts: periodics ?? [],
        events: recentEvents ?? [],
      },
    })
  } catch (err) {
    console.error('Member detail error:', err)
    return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 })
  }
}
