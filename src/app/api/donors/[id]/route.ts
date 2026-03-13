import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('mosque_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 })
    }

    const { id } = await params

    const { data: donor, error } = await supabase
      .from('donors')
      .select('*')
      .eq('id', id)
      .eq('mosque_id', profile.mosque_id)
      .single()

    if (error || !donor) {
      return NextResponse.json({ error: 'Donateur niet gevonden' }, { status: 404 })
    }

    return NextResponse.json(donor)
  } catch (err) {
    console.error('Donor fetch error:', err)
    return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    if (!profile || profile.role === 'viewer') {
      return NextResponse.json({ error: 'Geen toestemming' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, email, phone, address, tags } = body

    const { data: donor, error } = await supabase
      .from('donors')
      .update({
        name: name?.trim() || null,
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        tags: tags ?? [],
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('mosque_id', profile.mosque_id)
      .select()
      .single()

    if (error) {
      console.error('Donor update error:', error)
      return NextResponse.json({ error: 'Donateur bijwerken mislukt' }, { status: 500 })
    }

    if (!donor) {
      return NextResponse.json({ error: 'Donateur niet gevonden' }, { status: 404 })
    }

    return NextResponse.json({ success: true, donor })
  } catch (err) {
    console.error('Donor update error:', err)
    return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 })
  }
}
