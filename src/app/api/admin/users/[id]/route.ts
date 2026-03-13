import { NextResponse } from 'next/server'
import { getPlatformAdmin } from '@/lib/supabase/platform-admin'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getPlatformAdmin()
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { id } = await params
    const body = await request.json()

    // Role change: { role, mosqueId }
    if (body.role) {
      const { role, mosqueId } = body

      if (role !== 'admin' && role !== 'viewer') {
        return NextResponse.json(
          { error: "Role must be 'admin' or 'viewer'" },
          { status: 400 }
        )
      }

      if (!mosqueId) {
        return NextResponse.json({ error: 'mosqueId is required' }, { status: 400 })
      }

      const { error } = await admin.adminClient
        .from('users')
        .update({ role })
        .eq('id', id)
        .eq('mosque_id', mosqueId)

      if (error) {
        console.error('Update user role error:', error)
        return NextResponse.json({ error: 'Failed to update role' }, { status: 500 })
      }

      return NextResponse.json({ success: true, role })
    }

    // Ban/unban: { action: 'ban' | 'unban' }
    const { action } = body

    if (action !== 'ban' && action !== 'unban') {
      return NextResponse.json(
        { error: "Invalid action. Must be 'ban' or 'unban'" },
        { status: 400 }
      )
    }

    const ban_duration = action === 'ban' ? '876000h' : 'none'

    const { error } = await admin.adminClient.auth.admin.updateUserById(id, {
      ban_duration,
    })

    if (error) {
      console.error('Ban/unban user error:', error)
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }

    return NextResponse.json({ success: true, banned: action === 'ban' })
  } catch (err) {
    console.error('Update user error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
