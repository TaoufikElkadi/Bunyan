import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { parseSignatureBase64 } from '@/lib/signatures'

/**
 * Board member countersigns a periodic gift agreement.
 * Requires admin role. Flips status from pending_board → active.
 */
export async function POST(
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
      .select('mosque_id, role, name')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Geen toestemming' }, { status: 403 })
    }

    // Verify agreement exists, belongs to this mosque, and is pending
    const { data: agreement } = await supabase
      .from('periodic_gift_agreements')
      .select('id, status')
      .eq('id', id)
      .eq('mosque_id', profile.mosque_id)
      .single()

    if (!agreement) {
      return NextResponse.json({ error: 'Overeenkomst niet gevonden' }, { status: 404 })
    }

    if (agreement.status !== 'pending_board') {
      return NextResponse.json({ error: 'Overeenkomst is al ondertekend of geannuleerd' }, { status: 400 })
    }

    // Validate signature
    const body = await request.json()
    let rawBase64: string
    try {
      rawBase64 = parseSignatureBase64(body.signature_base64)
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 400 })
    }

    // Upload board signature (use admin client for storage)
    const admin = createAdminClient()
    const signaturePath = `${id}/board.png`
    const { error: uploadError } = await admin.storage
      .from('signatures')
      .upload(signaturePath, Buffer.from(rawBase64, 'base64'), {
        contentType: 'image/png',
        upsert: true,
      })

    if (uploadError) {
      console.error('Board signature upload error:', uploadError)
      return NextResponse.json({ error: 'Fout bij opslaan handtekening' }, { status: 500 })
    }

    // Activate the agreement
    const now = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('periodic_gift_agreements')
      .update({
        board_signature_url: signaturePath,
        board_signed_at: now,
        board_signer_id: user.id,
        board_signer_name: profile.name,
        status: 'active',
        updated_at: now,
      })
      .eq('id', id)

    if (updateError) {
      console.error('Countersign update error:', updateError)
      return NextResponse.json({ error: 'Fout bij ondertekenen' }, { status: 500 })
    }

    // TODO: Send confirmation email to donor with final PDF (Resend blocked)
    console.log(`[email-stub] Agreement countersigned: ${id}, by ${profile.name}`)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Countersign error:', err)
    return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 })
  }
}
