import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    if (!profile?.mosque_id || profile.role === 'viewer') {
      return NextResponse.json({ error: 'Geen toestemming' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''

    if (!name) {
      return NextResponse.json({ error: 'Naam is verplicht' }, { status: 400 })
    }

    const { error } = await supabase
      .from('households')
      .update({ name })
      .eq('id', id)
      .eq('mosque_id', profile.mosque_id)

    if (error) {
      console.error('Update household error:', error)
      return NextResponse.json({ error: 'Fout bij bijwerken huishouden' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Household update error:', err)
    return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 })
  }
}

export async function DELETE(
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
      .select('mosque_id, role')
      .eq('id', user.id)
      .single()

    if (!profile?.mosque_id || profile.role === 'viewer') {
      return NextResponse.json({ error: 'Geen toestemming' }, { status: 403 })
    }

    const { id } = await params

    // Unlink donors first
    await supabase
      .from('donors')
      .update({ household_id: null })
      .eq('household_id', id)
      .eq('mosque_id', profile.mosque_id)

    const { error } = await supabase
      .from('households')
      .delete()
      .eq('id', id)
      .eq('mosque_id', profile.mosque_id)

    if (error) {
      console.error('Delete household error:', error)
      return NextResponse.json({ error: 'Fout bij verwijderen huishouden' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Household delete error:', err)
    return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 })
  }
}
