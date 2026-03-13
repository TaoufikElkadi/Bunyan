import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { renderToBuffer } from '@react-pdf/renderer'
import { AnbiReceipt } from '@/lib/pdf/anbi-receipt'
import type { AnbiReceiptData } from '@/lib/pdf/anbi-receipt'

interface FundRow {
  name: string
}

interface DonorRow {
  id: string
  name: string | null
  email: string | null
}

interface DonationRow {
  id: string
  donor_id: string
  fund_id: string
  amount: number
  funds: FundRow | null
  donors: DonorRow | null
}

export async function POST(request: Request) {
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

    const body = await request.json()
    const { year, donor_id } = body as { year: number; donor_id?: string }

    if (!year || year < 2000 || year > 2100) {
      return NextResponse.json({ error: 'Ongeldig jaar' }, { status: 400 })
    }

    // Get mosque info for the receipt
    const { data: mosque } = await supabase
      .from('mosques')
      .select('name, address, rsin, anbi_status')
      .eq('id', profile.mosque_id)
      .single()

    if (!mosque) {
      return NextResponse.json({ error: 'Moskee niet gevonden' }, { status: 404 })
    }

    if (!mosque.rsin) {
      return NextResponse.json(
        { error: 'RSIN is niet ingesteld. Configureer dit eerst bij Instellingen.' },
        { status: 400 }
      )
    }

    const startDate = `${year}-01-01T00:00:00.000Z`
    const endDate = `${year + 1}-01-01T00:00:00.000Z`

    // Build query for completed, non-cash donations
    let query = supabase
      .from('donations')
      .select('id, donor_id, fund_id, amount, funds(name), donors(id, name, email)')
      .eq('mosque_id', profile.mosque_id)
      .eq('status', 'completed')
      .neq('method', 'cash')
      .gte('created_at', startDate)
      .lt('created_at', endDate)
      .not('donor_id', 'is', null)

    if (donor_id) {
      query = query.eq('donor_id', donor_id)
    }

    const { data: donations, error } = await query

    if (error) {
      console.error('ANBI generate query error:', error)
      return NextResponse.json({ error: 'Fout bij ophalen donaties' }, { status: 500 })
    }

    // Group donations by donor, then by fund
    const donorMap = new Map<
      string,
      {
        name: string
        email: string | null
        totalAmount: number
        funds: Map<string, { fundName: string; amount: number; count: number }>
      }
    >()

    for (const donation of (donations ?? []) as unknown as DonationRow[]) {
      const donor = donation.donors
      if (!donor || !donor.name) continue

      const donorId = donor.id
      const fundName = donation.funds?.name ?? 'Onbekend fonds'

      if (!donorMap.has(donorId)) {
        donorMap.set(donorId, {
          name: donor.name,
          email: donor.email,
          totalAmount: 0,
          funds: new Map(),
        })
      }

      const entry = donorMap.get(donorId)!
      entry.totalAmount += donation.amount

      const fundKey = donation.fund_id
      if (!entry.funds.has(fundKey)) {
        entry.funds.set(fundKey, { fundName, amount: 0, count: 0 })
      }
      const fundEntry = entry.funds.get(fundKey)!
      fundEntry.amount += donation.amount
      fundEntry.count += 1
    }

    if (donorMap.size === 0) {
      return NextResponse.json(
        { error: 'Geen in aanmerking komende donaties gevonden' },
        { status: 404 }
      )
    }

    const issueDate = new Date().toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    const admin = createAdminClient()

    // Single donor: return PDF directly
    if (donor_id && donorMap.size === 1) {
      const [donorId, donorData] = Array.from(donorMap.entries())[0]

      const receiptData: AnbiReceiptData = {
        mosqueName: mosque.name,
        mosqueAddress: mosque.address ?? '',
        rsin: mosque.rsin,
        donorName: donorData.name,
        year,
        fundBreakdown: Array.from(donorData.funds.values()),
        totalAmount: donorData.totalAmount,
        issueDate,
      }

      const pdfBuffer = await renderToBuffer(
        AnbiReceipt({ data: receiptData })
      )

      // Upsert the receipt record
      const fundBreakdown: Record<string, number> = {}
      for (const [, fund] of donorData.funds) {
        fundBreakdown[fund.fundName] = fund.amount
      }

      await admin
        .from('anbi_receipts')
        .upsert(
          {
            mosque_id: profile.mosque_id,
            donor_id: donorId,
            year,
            total_amount: donorData.totalAmount,
            fund_breakdown: fundBreakdown,
          },
          { onConflict: 'mosque_id,donor_id,year' }
        )

      const fileName = `ANBI_${year}_${donorData.name.replace(/\s+/g, '_')}.pdf`

      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      })
    }

    // Bulk generation: generate all and upsert records
    let generatedCount = 0

    for (const [donorId, donorData] of donorMap) {
      const receiptData: AnbiReceiptData = {
        mosqueName: mosque.name,
        mosqueAddress: mosque.address ?? '',
        rsin: mosque.rsin,
        donorName: donorData.name,
        year,
        fundBreakdown: Array.from(donorData.funds.values()),
        totalAmount: donorData.totalAmount,
        issueDate,
      }

      // Generate PDF (we don't store the file for MVP, just record the receipt)
      await renderToBuffer(AnbiReceipt({ data: receiptData }))

      const fundBreakdown: Record<string, number> = {}
      for (const [, fund] of donorData.funds) {
        fundBreakdown[fund.fundName] = fund.amount
      }

      await admin
        .from('anbi_receipts')
        .upsert(
          {
            mosque_id: profile.mosque_id,
            donor_id: donorId,
            year,
            total_amount: donorData.totalAmount,
            fund_breakdown: fundBreakdown,
          },
          { onConflict: 'mosque_id,donor_id,year' }
        )

      generatedCount++
    }

    return NextResponse.json({
      success: true,
      generated: generatedCount,
      year,
    })
  } catch (err) {
    console.error('ANBI generate error:', err)
    return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 })
  }
}
