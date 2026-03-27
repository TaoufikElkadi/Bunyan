import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/anbi/download?receipt_id=xxx
 * Downloads a stored ANBI receipt PDF from Supabase Storage.
 */
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
    const receiptId = searchParams.get('receipt_id')

    if (!receiptId) {
      return NextResponse.json({ error: 'receipt_id is verplicht' }, { status: 400 })
    }

    // Fetch the receipt record (scoped to the user's mosque via RLS)
    const { data: receipt, error } = await supabase
      .from('anbi_receipts')
      .select('pdf_path, receipt_number, donors(name)')
      .eq('id', receiptId)
      .eq('mosque_id', profile.mosque_id)
      .single()

    if (error || !receipt) {
      return NextResponse.json({ error: 'Verklaring niet gevonden' }, { status: 404 })
    }

    if (!receipt.pdf_path) {
      return NextResponse.json({ error: 'PDF is nog niet gegenereerd' }, { status: 404 })
    }

    // Download from Supabase Storage using admin client (storage policies are separate)
    const admin = createAdminClient()
    const { data: fileData, error: downloadError } = await admin.storage
      .from('anbi-receipts')
      .download(receipt.pdf_path)

    if (downloadError || !fileData) {
      console.error('ANBI download storage error:', downloadError)
      return NextResponse.json({ error: 'PDF kon niet worden opgehaald' }, { status: 500 })
    }

    const donor = receipt.donors as unknown as { name: string | null } | null
    const donorName = donor?.name?.replace(/\s+/g, '_') ?? 'donor'
    const fileName = `${receipt.receipt_number ?? 'ANBI'}_${donorName}.pdf`

    const buffer = await fileData.arrayBuffer()

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (err) {
    console.error('ANBI download error:', err)
    return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 })
  }
}
