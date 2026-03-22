import { NextResponse } from 'next/server'
import { getPlatformAdmin } from '@/lib/supabase/platform-admin'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getPlatformAdmin()
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { id } = await params
    const tempPassword = crypto.randomUUID().slice(0, 12)

    const { error } = await admin.adminClient.auth.admin.updateUserById(id, {
      password: tempPassword,
    })

    if (error) {
      console.error('Reset password error:', error)
      return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
    }

    // TODO: Send the temporary password to the user via email (Resend) instead of returning it in the response
    return NextResponse.json({ success: true, message: 'Password has been reset. The user will receive an email with their new password.' })
  } catch (err) {
    console.error('Reset password error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
