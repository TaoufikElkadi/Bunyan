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

    if (!profile || profile.role === 'viewer') {
      return NextResponse.json({ error: 'Geen toestemming' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, description, icon, goal_amount, goal_deadline } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Naam is verplicht' }, { status: 400 })
    }

    const { data: fund, error } = await supabase
      .from('funds')
      .update({
        name: name.trim(),
        description: description?.trim() || null,
        icon: icon?.trim() || null,
        goal_amount: goal_amount || null,
        goal_deadline: goal_deadline || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('mosque_id', profile.mosque_id)
      .select()
      .single()

    if (error) {
      console.error('Fund update error:', error)
      return NextResponse.json({ error: 'Fonds bijwerken mislukt' }, { status: 500 })
    }

    if (!fund) {
      return NextResponse.json({ error: 'Fonds niet gevonden' }, { status: 404 })
    }

    return NextResponse.json({ success: true, fund })
  } catch (err) {
    console.error('Fund update error:', err)
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

    if (!profile || profile.role === 'viewer') {
      return NextResponse.json({ error: 'Geen toestemming' }, { status: 403 })
    }

    const { id } = await params

    // Archive (set is_active = false), don't actually delete
    const { error } = await supabase
      .from('funds')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('mosque_id', profile.mosque_id)

    if (error) {
      console.error('Fund archive error:', error)
      return NextResponse.json({ error: 'Fonds archiveren mislukt' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Fund archive error:', err)
    return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 })
  }
}
