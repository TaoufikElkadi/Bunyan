import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendMosqueEmail } from '@/lib/email/send'
import { anbiReceiptEmail } from '@/lib/email/templates/anbi-receipt'

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

    const { receipt_id } = (await request.json()) as { receipt_id: string }

    if (!receipt_id) {
      return NextResponse.json({ error: 'receipt_id is verplicht' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Fetch receipt with donor info
    const { data: receipt, error: receiptError } = await admin
      .from('anbi_receipts')
      .select('id, donor_id, year, total_amount, receipt_number, pdf_path, emailed_at, donors(name, email)')
      .eq('id', receipt_id)
      .eq('mosque_id', profile.mosque_id)
      .single()

    if (receiptError || !receipt) {
      return NextResponse.json({ error: 'Verklaring niet gevonden' }, { status: 404 })
    }

    const donor = receipt.donors as unknown as { name: string | null; email: string | null } | null

    if (!donor?.email) {
      return NextResponse.json(
        { error: 'Donateur heeft geen e-mailadres' },
        { status: 400 }
      )
    }

    if (!receipt.pdf_path) {
      return NextResponse.json(
        { error: 'PDF is nog niet gegenereerd. Genereer eerst de verklaring.' },
        { status: 400 }
      )
    }

    // Download PDF from storage
    const { data: pdfData, error: downloadError } = await admin.storage
      .from('anbi-receipts')
      .download(receipt.pdf_path)

    if (downloadError || !pdfData) {
      console.error('ANBI PDF download error:', downloadError)
      return NextResponse.json({ error: 'PDF kon niet worden opgehaald' }, { status: 500 })
    }

    // Get mosque info for email
    const { data: mosque } = await supabase
      .from('mosques')
      .select('name, contact_email')
      .eq('id', profile.mosque_id)
      .single()

    const mosqueName = mosque?.name ?? 'Moskee'
    const donorName = donor.name ?? 'Donateur'
    const pdfBuffer = Buffer.from(await pdfData.arrayBuffer())

    const html = anbiReceiptEmail({
      mosqueName,
      donorName,
      year: receipt.year,
      totalAmount: receipt.total_amount,
    })

    await sendMosqueEmail({
      to: donor.email,
      subject: `Jaaroverzicht giften ${receipt.year} - ${mosqueName}`,
      html,
      mosqueName,
      mosqueContactEmail: mosque?.contact_email,
      attachments: [
        {
          filename: `${receipt.receipt_number ?? 'ANBI'}_${donorName.replace(/\s+/g, '_')}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    })

    // Mark as emailed
    await admin
      .from('anbi_receipts')
      .update({ emailed_at: new Date().toISOString() })
      .eq('id', receipt_id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('ANBI send error:', err)
    return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 })
  }
}
