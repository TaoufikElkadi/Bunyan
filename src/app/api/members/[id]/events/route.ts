import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const PAGE_SIZE = 30

export async function GET(
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
      .select('mosque_id')
      .eq('id', user.id)
      .single()

    if (!profile?.mosque_id) {
      return NextResponse.json({ error: 'Geen toestemming' }, { status: 403 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    const { data: events, count } = await supabase
      .from('member_events')
      .select('*', { count: 'exact' })
      .eq('donor_id', id)
      .eq('mosque_id', profile.mosque_id)
      .order('created_at', { ascending: false })
      .range(from, to)

    return NextResponse.json({
      events: events ?? [],
      total: count ?? 0,
      page,
      pages: Math.ceil((count ?? 0) / PAGE_SIZE),
    })
  } catch (err) {
    console.error('Member events error:', err)
    return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 })
  }
}
