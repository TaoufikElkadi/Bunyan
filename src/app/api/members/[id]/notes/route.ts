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
    const notes = typeof body.notes === 'string' ? body.notes.trim() : null

    const { error } = await supabase
      .from('donors')
      .update({ notes })
      .eq('id', id)
      .eq('mosque_id', profile.mosque_id)

    if (error) {
      console.error('Update notes error:', error)
      return NextResponse.json({ error: 'Fout bij opslaan notities' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Notes error:', err)
    return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 })
  }
}
