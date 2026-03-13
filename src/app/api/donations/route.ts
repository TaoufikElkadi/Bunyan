import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
    }

    // Get user profile for mosque_id
    const { data: profile } = await supabase
      .from('users')
      .select('mosque_id, role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 })
    }

    if (profile.role === 'viewer') {
      return NextResponse.json({ error: 'Geen toestemming' }, { status: 403 })
    }

    const body = await request.json()
    const { donor_name, donor_email, amount, fund_id, method, notes, date } = body

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Bedrag is verplicht en moet groter zijn dan 0' }, { status: 400 })
    }

    if (!fund_id) {
      return NextResponse.json({ error: 'Fonds is verplicht' }, { status: 400 })
    }

    if (!method || !['cash', 'bank_transfer'].includes(method)) {
      return NextResponse.json({ error: 'Ongeldige betaalmethode' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Verify fund belongs to this mosque
    const { data: fund } = await admin
      .from('funds')
      .select('id')
      .eq('id', fund_id)
      .eq('mosque_id', profile.mosque_id)
      .single()

    if (!fund) {
      return NextResponse.json({ error: 'Fonds niet gevonden' }, { status: 404 })
    }

    // Find or create donor if name or email provided
    let donorId: string | null = null

    if (donor_email || donor_name) {
      if (donor_email) {
        // Match by email within this mosque
        const { data: existingDonor } = await admin
          .from('donors')
          .select('id')
          .eq('mosque_id', profile.mosque_id)
          .eq('email', donor_email)
          .single()

        if (existingDonor) {
          donorId = existingDonor.id
          // Update name if provided and donor had no name
          if (donor_name) {
            await admin
              .from('donors')
              .update({ name: donor_name, updated_at: new Date().toISOString() })
              .eq('id', donorId)
              .is('name', null)
          }
        }
      }

      if (!donorId && donor_name) {
        // Try matching by exact name within this mosque (only if no email match)
        const { data: existingDonor } = await admin
          .from('donors')
          .select('id')
          .eq('mosque_id', profile.mosque_id)
          .eq('name', donor_name)
          .is('email', null)
          .limit(1)
          .maybeSingle()

        if (existingDonor) {
          donorId = existingDonor.id
        }
      }

      // Create new donor if no match found
      if (!donorId) {
        const { data: newDonor, error: donorError } = await admin
          .from('donors')
          .insert({
            mosque_id: profile.mosque_id,
            name: donor_name || null,
            email: donor_email || null,
          })
          .select('id')
          .single()

        if (donorError) {
          console.error('Donor creation error:', donorError)
          return NextResponse.json({ error: 'Donateur aanmaken mislukt' }, { status: 500 })
        }

        donorId = newDonor.id
      }
    }

    // Create donation (status: completed for manual entries)
    const createdAt = date ? new Date(date).toISOString() : new Date().toISOString()

    const { data: donation, error: donationError } = await admin
      .from('donations')
      .insert({
        mosque_id: profile.mosque_id,
        donor_id: donorId,
        fund_id,
        amount,
        method,
        status: 'completed',
        notes: notes || null,
        created_by: user.id,
        created_at: createdAt,
      })
      .select('id')
      .single()

    if (donationError) {
      console.error('Donation creation error:', donationError)
      return NextResponse.json({ error: 'Donatie aanmaken mislukt' }, { status: 500 })
    }

    // Create audit log entry
    await admin.from('audit_log').insert({
      mosque_id: profile.mosque_id,
      user_id: user.id,
      action: 'manual_donation',
      entity_type: 'donation',
      entity_id: donation.id,
      details: {
        amount,
        method,
        fund_id,
        donor_id: donorId,
        donor_name: donor_name || null,
        donor_email: donor_email || null,
      },
    })

    return NextResponse.json({ success: true, donation_id: donation.id })
  } catch (err) {
    console.error('Manual donation error:', err)
    return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 })
  }
}
