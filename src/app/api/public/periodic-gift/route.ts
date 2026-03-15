import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validatePeriodicGift } from '@/lib/anbi'
import { parseSignatureBase64, getClientIp } from '@/lib/signatures'

/**
 * Public endpoint for donors to submit a signed periodic gift agreement.
 * No auth required — creates/finds donor, stores signature, returns JSON.
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
      signature_base64,
    } = body as {
      mosque_slug: string
      donor_name: string
      donor_email: string
      donor_address: string
      annual_amount: number
      fund_id?: string
      start_date: string
      end_date: string
      signature_base64: string
    }

    if (!mosque_slug || !donor_name || !donor_email || !donor_address || !annual_amount || !start_date || !end_date || !signature_base64) {
      return NextResponse.json({ error: 'Vul alle verplichte velden in' }, { status: 400 })
    }

    // Validate signature
    let rawBase64: string
    try {
      rawBase64 = parseSignatureBase64(signature_base64)
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 400 })
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

    // Create agreement (defaults to pending_board)
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
      .select('id')
      .single()

    if (agreementError || !agreement) {
      console.error('Create agreement error:', agreementError)
      return NextResponse.json({ error: 'Fout bij aanmaken overeenkomst' }, { status: 500 })
    }

    // Upload donor signature to storage
    const signaturePath = `${agreement.id}/donor.png`
    const { error: uploadError } = await admin.storage
      .from('signatures')
      .upload(signaturePath, Buffer.from(rawBase64, 'base64'), {
        contentType: 'image/png',
        upsert: true,
      })

    if (uploadError) {
      console.error('Signature upload error:', uploadError)
      return NextResponse.json({ error: 'Fout bij opslaan handtekening' }, { status: 500 })
    }

    // Record signature metadata
    const now = new Date().toISOString()
    const clientIp = getClientIp(request)

    await admin
      .from('periodic_gift_agreements')
      .update({
        donor_signature_url: signaturePath,
        donor_signed_at: now,
        donor_ip: clientIp,
      })
      .eq('id', agreement.id)

    // TODO: Send notification email to mosque admin (Resend blocked)
    console.log(`[email-stub] Periodic gift pending: agreement=${agreement.id}, mosque=${mosque.name}, donor=${donor_name}`)

    return NextResponse.json({ success: true, agreement_id: agreement.id }, { status: 201 })
  } catch (err) {
    console.error('Public periodic gift error:', err)
    return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 })
  }
}
