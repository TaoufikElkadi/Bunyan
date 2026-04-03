import { NextResponse } from 'next/server'
import { getPlatformAdmin } from '@/lib/supabase/platform-admin'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getPlatformAdmin()
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { id } = await params

    const { data: users, error } = await admin.adminClient
      .from('users')
      .select('id, name, email, role, created_at')
      .eq('mosque_id', id)
      .order('created_at')

    if (error) {
      console.error('Fetch users error:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    return NextResponse.json(users)
  } catch (err) {
    console.error('List users error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getPlatformAdmin()
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { id } = await params
    const body = await request.json()
    const { email, name, role = 'admin' } = body

    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    if (role !== 'admin' && role !== 'viewer') {
      return NextResponse.json({ error: 'Role must be admin or viewer' }, { status: 400 })
    }

    // Verify mosque exists
    const { data: mosque } = await admin.adminClient
      .from('mosques')
      .select('id')
      .eq('id', id)
      .single()

    if (!mosque) {
      return NextResponse.json({ error: 'Mosque not found' }, { status: 404 })
    }

    // Find or create auth user by email
    const normalizedEmail = email.trim().toLowerCase()
    const { data: { users: authUsers }, error: authError } =
      await admin.adminClient.auth.admin.listUsers()

    if (authError) {
      console.error('Auth lookup error:', authError)
      return NextResponse.json({ error: 'Failed to look up user' }, { status: 500 })
    }

    let authUser = authUsers.find((u) => u.email === normalizedEmail)

    // If no auth account exists, create one directly.
    // We skip inviteUserByEmail because it requires SMTP/email to be fully
    // configured. Instead we create the user and let them use "Forgot password"
    // to set their password, or send a welcome email via Resend later.
    if (!authUser) {
      const { data: created, error: createError } =
        await admin.adminClient.auth.admin.createUser({
          email: normalizedEmail,
          email_confirm: true,
          user_metadata: { name: name?.trim() || normalizedEmail },
        })

      if (createError) {
        console.error('Create user error:', createError)
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
      }

      authUser = created.user
    }

    // Check if user is already assigned to a mosque
    const { data: existingUser } = await admin.adminClient
      .from('users')
      .select('id, mosque_id')
      .eq('id', authUser.id)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'User is already assigned to a mosque' },
        { status: 409 }
      )
    }

    // Create user record
    const { data: newUser, error: insertError } = await admin.adminClient
      .from('users')
      .insert({
        id: authUser.id,
        mosque_id: id,
        name: name?.trim() || authUser.email!,
        email: authUser.email!,
        role,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Add user error:', insertError)
      return NextResponse.json({ error: 'Failed to add user' }, { status: 500 })
    }

    return NextResponse.json(newUser, { status: 201 })
  } catch (err) {
    console.error('Add user error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getPlatformAdmin()
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId query param is required' },
        { status: 400 }
      )
    }

    // Verify user belongs to this mosque
    const { data: user } = await admin.adminClient
      .from('users')
      .select('id')
      .eq('id', userId)
      .eq('mosque_id', id)
      .single()

    if (!user) {
      return NextResponse.json(
        { error: 'User not found in this mosque' },
        { status: 404 }
      )
    }

    const { error } = await admin.adminClient
      .from('users')
      .delete()
      .eq('id', userId)

    if (error) {
      console.error('Remove user error:', error)
      return NextResponse.json({ error: 'Failed to remove user' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Remove user error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
