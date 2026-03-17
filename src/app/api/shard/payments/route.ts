import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('mosque_id')
      .eq('id', user.id)
      .single()

    if (!profile?.mosque_id) return NextResponse.json({ error: 'Geen toestemming' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const monthsBack = parseInt(searchParams.get('months') ?? '6', 10)

    // Generate month list
    const now = new Date()
    const months: string[] = []
    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push(d.toISOString().split('T')[0])
    }

    // Fetch active commitments with donor info
    const { data: commitments } = await supabase
      .from('shard_commitments')
      .select('id, donor_id, monthly_amount, start_date, donors(name, email)')
      .eq('mosque_id', profile.mosque_id)
      .eq('status', 'active')
      .order('created_at')

    if (!commitments || commitments.length === 0) {
      return NextResponse.json({ members: [], months, payments: {} })
    }

    // Fetch all payments in range
    const { data: payments } = await supabase
      .from('shard_payments')
      .select('commitment_id, month, status, amount_paid, method, paid_at')
      .eq('mosque_id', profile.mosque_id)
      .in('month', months)

    // Build payment lookup: { commitment_id: { month: payment } }
    const paymentMap: Record<string, Record<string, { status: string; amount_paid: number; method: string | null }>> = {}
    for (const p of payments ?? []) {
      if (!paymentMap[p.commitment_id]) paymentMap[p.commitment_id] = {}
      paymentMap[p.commitment_id][p.month] = {
        status: p.status,
        amount_paid: p.amount_paid,
        method: p.method,
      }
    }

    const members = commitments.map((c) => {
      const donor = c.donors as unknown as { name: string | null; email: string | null } | null
      return {
        commitment_id: c.id,
        donor_id: c.donor_id,
        name: donor?.name ?? null,
        email: donor?.email ?? null,
        monthly_amount: c.monthly_amount,
        start_date: c.start_date,
      }
    })

    return NextResponse.json({ members, months, payments: paymentMap })
  } catch (err) {
    console.error('Shard grid error:', err)
    return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 })
  }
}

interface PaymentMark {
  donor_id: string
  month: string
  method?: string
  amount_paid?: number
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('mosque_id, role')
      .eq('id', user.id)
      .single()

    if (!profile?.mosque_id) return NextResponse.json({ error: 'Geen toestemming' }, { status: 403 })
    if (profile.role === 'viewer') return NextResponse.json({ error: 'Geen toestemming' }, { status: 403 })

    const { payments } = await request.json() as { payments: PaymentMark[] }

    if (!payments || payments.length === 0) {
      return NextResponse.json({ error: 'Geen betalingen opgegeven' }, { status: 400 })
    }

    const admin = createAdminClient()
    const mosqueId = profile.mosque_id
    let marked = 0

    for (const p of payments) {
      // Find the commitment for this donor
      const { data: commitment } = await admin
        .from('shard_commitments')
        .select('id, monthly_amount')
        .eq('mosque_id', mosqueId)
        .eq('donor_id', p.donor_id)
        .eq('status', 'active')
        .single()

      if (!commitment) continue

      const amountPaid = p.amount_paid ?? commitment.monthly_amount

      const { error } = await admin
        .from('shard_payments')
        .upsert({
          mosque_id: mosqueId,
          commitment_id: commitment.id,
          donor_id: p.donor_id,
          month: p.month,
          amount_paid: amountPaid,
          status: amountPaid >= commitment.monthly_amount ? 'paid' : 'partial',
          method: p.method ?? 'cash',
          paid_at: new Date().toISOString(),
          marked_by: user.id,
        }, { onConflict: 'commitment_id,month' })

      if (error) {
        console.error('Shard payment upsert error:', error)
        continue
      }
      marked++
    }

    return NextResponse.json({ success: true, marked })
  } catch (err) {
    console.error('Shard payment error:', err)
    return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 })
  }
}
