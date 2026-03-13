import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { AnbiReceipt } from '@/lib/pdf/anbi-receipt'
import type { AnbiReceiptData } from '@/lib/pdf/anbi-receipt'
import JSZip from 'jszip'

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

    // Fetch all completed, non-cash donations for this mosque + year
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
      console.error('ANBI download-zip query error:', error)
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

    // Generate PDFs and bundle into ZIP
    const zip = new JSZip()

    for (const [, donorData] of donorMap) {
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

      const fileName = `ANBI_${year}_${donorData.name.replace(/\s+/g, '_')}.pdf`
      zip.file(fileName, pdfBuffer)
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="ANBI_${year}_giftenverklaringen.zip"`,
      },
    })
  } catch (err) {
    console.error('ANBI download-zip error:', err)
    return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 })
  }
}
