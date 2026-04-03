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
      .select('mosque_id, role')
      .eq('id', user.id)
      .single()

    if (!profile?.mosque_id) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 })
    }

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const [{ data: monthly }, { data: byFund }] = await Promise.all([
      supabase.rpc('get_monthly_totals', { p_mosque_id: profile.mosque_id }),
      supabase.rpc('get_fund_breakdown', {
        p_mosque_id: profile.mosque_id,
        p_month_start: monthStart,
      }),
    ])

    return NextResponse.json(
      { monthly: monthly ?? [], byFund: byFund ?? [] },
      { headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=120' } },
    )
  } catch (err) {
    console.error('Chart data error:', err)
    return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 })
  }
}
