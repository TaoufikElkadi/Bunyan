import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Geen toestemming' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const yearStr = searchParams.get('year')

    if (!yearStr) {
      return NextResponse.json({ error: 'Jaar is verplicht' }, { status: 400 })
    }

    const year = parseInt(yearStr, 10)
    if (isNaN(year) || year < 2000 || year > 2100) {
      return NextResponse.json({ error: 'Ongeldig jaar' }, { status: 400 })
    }

    const { data: receipts, error } = await supabase
      .from('anbi_receipts')
      .select('id, donor_id, year, total_amount, fund_breakdown, receipt_number, emailed_at, created_at, donors(name, email)')
      .eq('mosque_id', profile.mosque_id)
      .eq('year', year)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('ANBI receipts query error:', error)
      return NextResponse.json({ error: 'Fout bij ophalen verklaringen' }, { status: 500 })
    }

    const formatted = (receipts ?? []).map((r) => {
      const donor = r.donors as unknown as { name: string | null; email: string | null } | null
      return {
        id: r.id,
        donor_id: r.donor_id,
        donor_name: donor?.name ?? 'Onbekend',
        donor_email: donor?.email ?? null,
        year: r.year,
        total_amount: r.total_amount,
        fund_breakdown: r.fund_breakdown,
        receipt_number: r.receipt_number,
        emailed_at: r.emailed_at,
        created_at: r.created_at,
      }
    })

    return NextResponse.json({ receipts: formatted })
  } catch (err) {
    console.error('ANBI receipts error:', err)
    return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 })
  }
}
