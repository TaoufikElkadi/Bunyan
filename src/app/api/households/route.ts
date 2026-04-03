import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
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

    if (!profile?.mosque_id) {
      return NextResponse.json({ error: 'Geen toestemming' }, { status: 403 })
    }

    const { data: households, error } = await supabase
      .from('households')
      .select('*, donors(id, name, total_donated)')
      .eq('mosque_id', profile.mosque_id)
      .order('name')

    if (error) {
      console.error('Households error:', error)
      return NextResponse.json({ error: 'Fout bij ophalen huishoudens' }, { status: 500 })
    }

    return NextResponse.json(
      { households: households ?? [] },
      { headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' } },
    )
  } catch (err) {
    console.error('Households error:', err)
    return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 })
  }
}

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

    if (!profile?.mosque_id || profile.role === 'viewer') {
      return NextResponse.json({ error: 'Geen toestemming' }, { status: 403 })
    }

    const body = await request.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''

    if (!name) {
      return NextResponse.json({ error: 'Naam is verplicht' }, { status: 400 })
    }

    const { data: household, error } = await supabase
      .from('households')
      .insert({ mosque_id: profile.mosque_id, name })
      .select()
      .single()

    if (error) {
      console.error('Create household error:', error)
      return NextResponse.json({ error: 'Fout bij aanmaken huishouden' }, { status: 500 })
    }

    return NextResponse.json({ household }, { status: 201 })
  } catch (err) {
    console.error('Households error:', err)
    return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 })
  }
}
