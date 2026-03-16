import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeMemberStatus, computeChurnRisk, daysSince } from '@/lib/member-status'
import type { MemberStatus, ChurnRisk } from '@/types'

const PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('mosque_id, role')
      .eq('id', user.id)
      .single()

    if (!profile?.mosque_id) {
      return NextResponse.json({ error: 'Geen toestemming' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
    const limit = Math.min(parseInt(searchParams.get('limit') ?? String(PAGE_SIZE), 10), MAX_PAGE_SIZE)
    const search = searchParams.get('search') ?? ''
    const statusFilter = searchParams.get('status') as MemberStatus | null
    const riskFilter = searchParams.get('risk') as ChurnRisk | null
    const tagFilter = searchParams.get('tag') ?? ''
    const sortBy = searchParams.get('sort') ?? 'total_donated'
    const sortDir = searchParams.get('dir') === 'asc' ? true : false
    const showAnonymous = searchParams.get('anonymous') === '1'

    const from = (page - 1) * limit
    const to = from + limit - 1

    // Fetch donors with related recurring & periodic gift status
    let query = supabase
      .from('donors')
      .select('*', { count: 'exact' })
      .eq('mosque_id', profile.mosque_id)

    // Hide anonymous by default
    if (!showAnonymous) {
      query = query.or('email.not.is.null,name.not.is.null')
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    if (tagFilter) {
      query = query.contains('tags', [tagFilter])
    }

    // Sort
    const validSorts = ['total_donated', 'donation_count', 'last_donated_at', 'name', 'created_at']
    const sortColumn = validSorts.includes(sortBy) ? sortBy : 'total_donated'
    query = query.order(sortColumn, { ascending: sortDir, nullsFirst: false })
    query = query.range(from, to)

    const { data: donors, count, error } = await query

    if (error) {
      console.error('Members list error:', error)
      return NextResponse.json({ error: 'Fout bij ophalen leden' }, { status: 500 })
    }

    if (!donors || donors.length === 0) {
      return NextResponse.json({ members: [], total: count ?? 0, page, pages: 0 })
    }

    // Batch-fetch active recurrings and periodic gifts for these donors
    const donorIds = donors.map((d) => d.id)

    const [{ data: activeRecurrings }, { data: activePeriodics }] = await Promise.all([
      supabase
        .from('recurrings')
        .select('donor_id')
        .eq('mosque_id', profile.mosque_id)
        .eq('status', 'active')
        .in('donor_id', donorIds),
      supabase
        .from('periodic_gift_agreements')
        .select('donor_id')
        .eq('mosque_id', profile.mosque_id)
        .eq('status', 'active')
        .in('donor_id', donorIds),
    ])

    const recurringSet = new Set((activeRecurrings ?? []).map((r) => r.donor_id))
    const periodicSet = new Set((activePeriodics ?? []).map((p) => p.donor_id))

    // Enrich with computed status
    let members = donors.map((donor) => {
      const input = {
        email: donor.email,
        name: donor.name,
        last_donated_at: donor.last_donated_at,
        has_active_recurring: recurringSet.has(donor.id),
        has_active_periodic: periodicSet.has(donor.id),
      }
      return {
        ...donor,
        member_status: computeMemberStatus(input),
        churn_risk: computeChurnRisk(input),
        has_active_recurring: input.has_active_recurring,
        has_active_periodic: input.has_active_periodic,
        days_since_last: daysSince(donor.last_donated_at),
      }
    })

    // Client-side filters for computed fields
    if (statusFilter) {
      members = members.filter((m) => m.member_status === statusFilter)
    }
    if (riskFilter) {
      members = members.filter((m) => m.churn_risk === riskFilter)
    }

    const totalPages = Math.ceil((count ?? 0) / limit)

    return NextResponse.json({
      members,
      total: count ?? 0,
      page,
      pages: totalPages,
    })
  } catch (err) {
    console.error('Members error:', err)
    return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 })
  }
}
