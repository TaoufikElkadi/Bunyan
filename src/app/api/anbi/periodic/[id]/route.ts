import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { PeriodicGiftAgreement } from '@/lib/pdf/periodic-gift-agreement'
import type { PeriodicGiftData } from '@/lib/pdf/periodic-gift-agreement'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Fetch agreement with donor and fund info
    const { data: agreement } = await supabase
      .from('periodic_gift_agreements')
      .select('*, donors(name, address), funds(name)')
      .eq('id', id)
      .eq('mosque_id', profile.mosque_id)
      .single()

    if (!agreement) {
      return NextResponse.json({ error: 'Overeenkomst niet gevonden' }, { status: 404 })
    }

    // Fetch mosque info
    const { data: mosque } = await supabase
      .from('mosques')
      .select('name, address, rsin, kvk')
      .eq('id', profile.mosque_id)
      .single()

    if (!mosque || !mosque.rsin) {
      return NextResponse.json({ error: 'Moskee of RSIN niet gevonden' }, { status: 404 })
    }

    const donor = agreement.donors as unknown as { name: string | null; address: string | null }
    const fund = agreement.funds as unknown as { name: string } | null

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
      donorName: donor?.name ?? 'Onbekend',
      donorAddress: donor?.address ?? null,
      annualAmount: agreement.annual_amount,
      fundName: fund?.name ?? null,
      startDate: formatDate(agreement.start_date),
      endDate: formatDate(agreement.end_date),
      issueDate: new Date().toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    }

    const pdfBuffer = await renderToBuffer(
      PeriodicGiftAgreement({ data: pdfData })
    )

    const donorName = (donor?.name ?? 'onbekend').replace(/\s+/g, '_')
    const fileName = `Periodieke_gift_${donorName}.pdf`

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (err) {
    console.error('Periodic gift PDF error:', err)
    return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
    const { status } = body as { status: string }

    if (!['active', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Ongeldige status' }, { status: 400 })
    }

    const { data: agreement, error } = await supabase
      .from('periodic_gift_agreements')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('mosque_id', profile.mosque_id)
      .select()
      .single()

    if (error || !agreement) {
      return NextResponse.json({ error: 'Overeenkomst niet gevonden' }, { status: 404 })
    }

    return NextResponse.json({ agreement })
  } catch (err) {
    console.error('Periodic gift update error:', err)
    return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 })
  }
}
