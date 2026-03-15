import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validatePeriodicGift } from '@/lib/anbi'
import { renderToBuffer } from '@react-pdf/renderer'
import { PeriodicGiftAgreement } from '@/lib/pdf/periodic-gift-agreement'
import type { PeriodicGiftData } from '@/lib/pdf/periodic-gift-agreement'

/**
 * Public endpoint for donors to create a periodic gift agreement.
 * No auth required — creates/finds donor and generates the PDF.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      mosque_slug,
      donor_name,
      donor_email,
      donor_address,
      annual_amount,
      fund_id,
      start_date,
      end_date,
    } = body as {
      mosque_slug: string
      donor_name: string
      donor_email: string
      donor_address: string
      annual_amount: number // euros from frontend
      fund_id?: string
      start_date: string
      end_date: string
    }

    if (!mosque_slug || !donor_name || !donor_email || !donor_address || !annual_amount || !start_date || !end_date) {
      return NextResponse.json({ error: 'Vul alle verplichte velden in' }, { status: 400 })
    }

    const amountCents = Math.round(annual_amount * 100)

    const validationError = validatePeriodicGift({
      startDate: start_date,
      endDate: end_date,
      annualAmount: amountCents,
    })
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const admin = createAdminClient()

    // Fetch mosque (must be ANBI)
    const { data: mosque } = await admin
      .from('mosques')
      .select('id, name, address, rsin, kvk, anbi_status')
      .eq('slug', mosque_slug)
      .single()

    if (!mosque) {
      return NextResponse.json({ error: 'Moskee niet gevonden' }, { status: 404 })
    }
    if (!mosque.anbi_status || !mosque.rsin) {
      return NextResponse.json({ error: 'Deze moskee heeft geen ANBI-status' }, { status: 400 })
    }

    // Find or create donor
    let donorId: string
    const { data: existingDonor } = await admin
      .from('donors')
      .select('id')
      .eq('mosque_id', mosque.id)
      .eq('email', donor_email)
      .single()

    if (existingDonor) {
      donorId = existingDonor.id
      // Update name/address if provided
      await admin
        .from('donors')
        .update({ name: donor_name, address: donor_address })
        .eq('id', donorId)
    } else {
      const { data: newDonor, error: donorError } = await admin
        .from('donors')
        .insert({
          mosque_id: mosque.id,
          name: donor_name,
          email: donor_email,
          address: donor_address,
        })
        .select('id')
        .single()

      if (donorError || !newDonor) {
        console.error('Create donor error:', donorError)
        return NextResponse.json({ error: 'Fout bij aanmaken donateur' }, { status: 500 })
      }
      donorId = newDonor.id
    }

    // Get fund name if specified
    let fundName: string | null = null
    if (fund_id) {
      const { data: fund } = await admin
        .from('funds')
        .select('name')
        .eq('id', fund_id)
        .eq('mosque_id', mosque.id)
        .single()
      fundName = fund?.name ?? null
    }

    // Create agreement
    const { data: agreement, error: agreementError } = await admin
      .from('periodic_gift_agreements')
      .insert({
        mosque_id: mosque.id,
        donor_id: donorId,
        annual_amount: amountCents,
        fund_id: fund_id || null,
        start_date,
        end_date,
      })
      .select()
      .single()

    if (agreementError || !agreement) {
      console.error('Create agreement error:', agreementError)
      return NextResponse.json({ error: 'Fout bij aanmaken overeenkomst' }, { status: 500 })
    }

    // Generate PDF
    const formatDate = (dateStr: string) =>
      new Date(dateStr).toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })

    const pdfData: PeriodicGiftData = {
      mosqueName: mosque.name,
      mosqueAddress: mosque.address ?? '',
      rsin: mosque.rsin,
      kvk: mosque.kvk ?? null,
      donorName: donor_name,
      donorAddress: donor_address,
      annualAmount: amountCents,
      fundName,
      startDate: formatDate(start_date),
      endDate: formatDate(end_date),
      issueDate: new Date().toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    }

    const pdfBuffer = await renderToBuffer(
      PeriodicGiftAgreement({ data: pdfData })
    )

    const fileName = `Periodieke_gift_${donor_name.replace(/\s+/g, '_')}.pdf`

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 201,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (err) {
    console.error('Public periodic gift error:', err)
    return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 })
  }
}
