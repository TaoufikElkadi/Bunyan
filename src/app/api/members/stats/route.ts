import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { MemberStats } from '@/types'

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

    const { data, error } = await supabase.rpc('get_member_stats', {
      p_mosque_id: profile.mosque_id,
    })

    if (error) {
      console.error('Member stats error:', error)
      return NextResponse.json({ error: 'Fout bij ophalen statistieken' }, { status: 500 })
    }

    return NextResponse.json({ stats: data as MemberStats })
  } catch (err) {
    console.error('Member stats error:', err)
    return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 })
  }
}
