import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE() {
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

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Geen toestemming' }, { status: 403 })
    }

    // Use admin client to bypass RLS for cascade delete
    const adminSupabase = createAdminClient()

    // Delete the mosque — cascade will remove users, funds, donations, etc.
    const { error } = await adminSupabase
      .from('mosques')
      .delete()
      .eq('id', profile.mosque_id)

    if (error) {
      console.error('Delete mosque error:', error)
      return NextResponse.json({ error: 'Moskee verwijderen mislukt' }, { status: 500 })
    }

    // Clean up storage
    const { data: files } = await adminSupabase.storage
      .from('branding')
      .list(profile.mosque_id)

    if (files?.length) {
      const paths = files.map((f) => `${profile.mosque_id}/${f.name}`)
      await adminSupabase.storage.from('branding').remove(paths)
    }

    // Sign out the user since their profile is deleted
    await supabase.auth.signOut()

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Delete mosque error:', err)
    return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 })
  }
}
