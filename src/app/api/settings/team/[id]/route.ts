import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * DELETE /api/settings/team/[id]
 * Remove a team member from the mosque.
 *
 * Guards:
 * - Only admins can remove members
 * - Cannot remove yourself
 * - Can only remove members of your own mosque (enforced by RLS + explicit check)
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: memberId } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
    }

    // Verify caller is an admin
    const { data: caller } = await supabase
      .from('users')
      .select('id, mosque_id, role')
      .eq('id', user.id)
      .single()

    if (!caller || caller.role !== 'admin') {
      return NextResponse.json(
        { error: 'Alleen beheerders kunnen teamleden verwijderen' },
        { status: 403 }
      )
    }

    // Prevent self-removal
    if (memberId === caller.id) {
      return NextResponse.json(
        { error: 'U kunt uzelf niet verwijderen' },
        { status: 400 }
      )
    }

    const admin = createAdminClient()

    // Verify the target member belongs to the same mosque
    const { data: targetMember } = await admin
      .from('users')
      .select('id, mosque_id, email')
      .eq('id', memberId)
      .eq('mosque_id', caller.mosque_id)
      .single()

    if (!targetMember) {
      return NextResponse.json(
        { error: 'Teamlid niet gevonden' },
        { status: 404 }
      )
    }

    // Delete the public.users row (cascade will not touch auth.users)
    const { error: deleteError } = await admin
      .from('users')
      .delete()
      .eq('id', memberId)
      .eq('mosque_id', caller.mosque_id)

    if (deleteError) {
      console.error('Team member delete error:', deleteError)
      return NextResponse.json(
        { error: 'Teamlid verwijderen mislukt' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Team member delete error:', err)
    return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 })
  }
}
