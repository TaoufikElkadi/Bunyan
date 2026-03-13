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
    const { title, description, slug, fund_id, goal_amount, start_date, end_date, is_active } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Titel is verplicht' }, { status: 400 })
    }

    const campaignSlug = (slug?.trim() || title.trim())
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    const { data: campaign, error } = await supabase
      .from('campaigns')
      .update({
        title: title.trim(),
        description: description?.trim() || null,
        slug: campaignSlug,
        fund_id: fund_id || undefined,
        goal_amount: goal_amount || null,
        start_date: start_date || null,
        end_date: end_date || null,
        is_active: is_active ?? undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('mosque_id', profile.mosque_id)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Deze slug is al in gebruik' }, { status: 400 })
      }
      console.error('Campaign update error:', error)
      return NextResponse.json({ error: 'Campagne bijwerken mislukt' }, { status: 500 })
    }

    if (!campaign) {
      return NextResponse.json({ error: 'Campagne niet gevonden' }, { status: 404 })
    }

    return NextResponse.json({ success: true, campaign })
  } catch (err) {
    console.error('Campaign update error:', err)
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

    const { error } = await supabase
      .from('campaigns')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('mosque_id', profile.mosque_id)

    if (error) {
      console.error('Campaign archive error:', error)
      return NextResponse.json({ error: 'Campagne archiveren mislukt' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Campaign archive error:', err)
    return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 })
  }
}
