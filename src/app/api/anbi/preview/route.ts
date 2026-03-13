import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface FundBreakdownItem {
  fund_name: string
  amount: number
  count: number
}

interface DonorPreview {
  donor_id: string
  donor_name: string
  donor_email: string | null
  total_amount: number
  fund_breakdown: FundBreakdownItem[]
}

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

    const startDate = `${year}-01-01T00:00:00.000Z`
    const endDate = `${year + 1}-01-01T00:00:00.000Z`

    // Fetch all completed, non-cash donations for this mosque + year
    // Include donor and fund info
    const { data: donations, error } = await supabase
      .from('donations')
      .select('id, donor_id, fund_id, amount, funds(name), donors(id, name, email)')
      .eq('mosque_id', profile.mosque_id)
      .eq('status', 'completed')
      .neq('method', 'cash')
      .gte('created_at', startDate)
      .lt('created_at', endDate)
      .not('donor_id', 'is', null)

    if (error) {
      console.error('ANBI preview query error:', error)
      return NextResponse.json({ error: 'Fout bij ophalen donaties' }, { status: 500 })
    }

    // Group by donor, then by fund
    const donorMap = new Map<string, DonorPreview>()

    for (const donation of donations ?? []) {
      const donor = donation.donors as unknown as { id: string; name: string | null; email: string | null } | null
      if (!donor || !donor.name) continue // Skip anonymous donors

      const donorId = donor.id
      const fund = donation.funds as unknown as { name: string } | null
      const fundName = fund?.name ?? 'Onbekend fonds'

      if (!donorMap.has(donorId)) {
        donorMap.set(donorId, {
          donor_id: donorId,
          donor_name: donor.name,
          donor_email: donor.email,
          total_amount: 0,
          fund_breakdown: [],
        })
      }

      const entry = donorMap.get(donorId)!
      entry.total_amount += donation.amount

      const existingFund = entry.fund_breakdown.find((f) => f.fund_name === fundName)
      if (existingFund) {
        existingFund.amount += donation.amount
        existingFund.count += 1
      } else {
        entry.fund_breakdown.push({
          fund_name: fundName,
          amount: donation.amount,
          count: 1,
        })
      }
    }

    const donors = Array.from(donorMap.values()).sort(
      (a, b) => b.total_amount - a.total_amount
    )

    const totalAmount = donors.reduce((sum, d) => sum + d.total_amount, 0)

    return NextResponse.json({
      donors,
      summary: {
        total_donors: donors.length,
        total_amount: totalAmount,
      },
    })
  } catch (err) {
    console.error('ANBI preview error:', err)
    return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 })
  }
}
