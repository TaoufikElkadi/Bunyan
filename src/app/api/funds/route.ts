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
    const { name, description, icon, goal_amount, goal_deadline } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Naam is verplicht' }, { status: 400 })
    }

    if (goal_amount !== undefined && goal_amount !== null && goal_amount < 0) {
      return NextResponse.json({ error: 'Doelbedrag moet positief zijn' }, { status: 400 })
    }

    // Get highest sort_order for this mosque
    const { data: lastFund } = await supabase
      .from('funds')
      .select('sort_order')
      .eq('mosque_id', profile.mosque_id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextSortOrder = (lastFund?.sort_order ?? -1) + 1

    const { data: fund, error } = await supabase
      .from('funds')
      .insert({
        mosque_id: profile.mosque_id,
        name: name.trim(),
        description: description?.trim() || null,
        icon: icon?.trim() || null,
        goal_amount: goal_amount || null,
        goal_deadline: goal_deadline || null,
        sort_order: nextSortOrder,
      })
      .select()
      .single()

    if (error) {
      console.error('Fund creation error:', error)
      return NextResponse.json({ error: 'Fonds aanmaken mislukt' }, { status: 500 })
    }

    return NextResponse.json({ success: true, fund })
  } catch (err) {
    console.error('Fund creation error:', err)
    return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 })
  }
}
