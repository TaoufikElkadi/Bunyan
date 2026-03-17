import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('mosque_id')
      .eq('id', user.id)
      .single()

    if (!profile?.mosque_id) return NextResponse.json({ error: 'Geen toestemming' }, { status: 403 })

    const { data, error } = await supabase
      .from('shard_commitments')
      .select('*, donors(id, name, email, phone)')
      .eq('mosque_id', profile.mosque_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Shard commitments fetch error:', error)
      return NextResponse.json({ error: 'Fout bij ophalen' }, { status: 500 })
    }

    return NextResponse.json({ commitments: data })
  } catch (err) {
    console.error('Shard commitments error:', err)
    return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('mosque_id, role')
      .eq('id', user.id)
      .single()

    if (!profile?.mosque_id) return NextResponse.json({ error: 'Geen toestemming' }, { status: 403 })
    if (profile.role === 'viewer') return NextResponse.json({ error: 'Geen toestemming' }, { status: 403 })

    const { donor_id, monthly_amount, notes } = await request.json()

    if (!donor_id || !monthly_amount || monthly_amount <= 0) {
      return NextResponse.json({ error: 'Donor en bedrag zijn verplicht' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Verify donor belongs to this mosque
    const { data: donor } = await admin
      .from('donors')
      .select('id')
      .eq('id', donor_id)
      .eq('mosque_id', profile.mosque_id)
      .single()

    if (!donor) return NextResponse.json({ error: 'Lid niet gevonden' }, { status: 404 })

    const { data: commitment, error } = await admin
      .from('shard_commitments')
      .upsert({
        mosque_id: profile.mosque_id,
        donor_id,
        monthly_amount,
        status: 'active',
        start_date: new Date().toISOString().split('T')[0],
        notes: notes || null,
      }, { onConflict: 'mosque_id,donor_id' })
      .select('id')
      .single()

    if (error) {
      console.error('Shard commitment create error:', error)
      return NextResponse.json({ error: 'Contributie aanmaken mislukt' }, { status: 500 })
    }

    await admin.from('audit_log').insert({
      mosque_id: profile.mosque_id,
      user_id: user.id,
      action: 'shard_commitment_created',
      entity_type: 'shard_commitment',
      entity_id: commitment.id,
      details: { donor_id, monthly_amount },
    })

    return NextResponse.json({ success: true, commitment_id: commitment.id }, { status: 201 })
  } catch (err) {
    console.error('Shard commitment create error:', err)
    return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 })
  }
}
