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

    // Look up the user's email
    const { data: userData, error: userError } = await admin.adminClient.auth.admin.getUserById(id)
    if (userError || !userData?.user?.email) {
      console.error('Get user error:', userError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Send a password reset email via Supabase Auth
    const { error } = await admin.adminClient.auth.admin.generateLink({
      type: 'recovery',
      email: userData.user.email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://bunyan.nl'}/set-password`,
      },
    })

    if (error) {
      console.error('Reset password error:', error)
      return NextResponse.json({ error: 'Failed to send reset email' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'A password reset email has been sent to the user.' })
  } catch (err) {
    console.error('Reset password error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
