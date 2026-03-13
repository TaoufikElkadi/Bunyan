import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    if (!profile || profile.role === 'viewer') {
      return NextResponse.json({ error: 'Geen toestemming' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, slug, fund_id, goal_amount, start_date, end_date } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Titel is verplicht' }, { status: 400 })
    }

    if (!fund_id) {
      return NextResponse.json({ error: 'Fonds is verplicht' }, { status: 400 })
    }

    // Generate slug from title if not provided
    const campaignSlug = (slug?.trim() || title.trim())
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    if (!campaignSlug) {
      return NextResponse.json({ error: 'Ongeldige slug' }, { status: 400 })
    }

    // Verify fund belongs to this mosque
    const { data: fund } = await supabase
      .from('funds')
      .select('id')
      .eq('id', fund_id)
      .eq('mosque_id', profile.mosque_id)
      .single()

    if (!fund) {
      return NextResponse.json({ error: 'Fonds niet gevonden' }, { status: 404 })
    }

    const { data: campaign, error } = await supabase
      .from('campaigns')
      .insert({
        mosque_id: profile.mosque_id,
        fund_id,
        title: title.trim(),
        description: description?.trim() || null,
        slug: campaignSlug,
        goal_amount: goal_amount || null,
        start_date: start_date || null,
        end_date: end_date || null,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Deze slug is al in gebruik' }, { status: 400 })
      }
      console.error('Campaign creation error:', error)
      return NextResponse.json({ error: 'Campagne aanmaken mislukt' }, { status: 500 })
    }

    return NextResponse.json({ success: true, campaign })
  } catch (err) {
    console.error('Campaign creation error:', err)
    return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 })
  }
}
