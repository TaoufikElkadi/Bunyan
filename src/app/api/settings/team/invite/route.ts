import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTeamInviteEmail } from '@/lib/email/team-invite'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import type { UserRole } from '@/types'

const VALID_ROLES: UserRole[] = ['admin', 'treasurer', 'viewer']

interface InviteBody {
  email: string
  name: string
  role: UserRole
}

/**
 * POST /api/settings/team/invite
 * Invite a new team member to the mosque.
 *
 * Flow:
 * 1. Validate the current user is an admin
 * 2. Check for duplicate invite (same email + same mosque)
 * 3. Create or find a Supabase Auth user via admin API
 * 4. Generate a magic link for password setup
 * 5. Insert a row in public.users with invited_at timestamp
 * 6. Return the invite link (for dev/fallback when email isn't configured)
 */
export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)
    const { success } = await rateLimit(`team-invite:${ip}`, 10, 60_000)
    if (!success) {
      return NextResponse.json({ error: 'Te veel verzoeken. Probeer het later opnieuw.' }, { status: 429 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
    }

    // Verify caller is an admin
    const { data: caller } = await supabase
      .from('users')
      .select('id, mosque_id, role, name, mosques(name)')
      .eq('id', user.id)
      .single()

    if (!caller || caller.role !== 'admin') {
      return NextResponse.json(
        { error: 'Alleen beheerders kunnen teamleden uitnodigen' },
        { status: 403 }
      )
    }

    const body: InviteBody = await request.json()
    const { email, name, role } = body

    // Validate inputs
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Ongeldig e-mailadres' }, { status: 400 })
    }
    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Naam is verplicht (minimaal 2 tekens)' }, { status: 400 })
    }
    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Ongeldige rol' }, { status: 400 })
    }

    const admin = createAdminClient()
    const normalizedEmail = email.toLowerCase().trim()

    // Check for duplicate: same email already in this mosque
    const { data: existingMember } = await admin
      .from('users')
      .select('id, email')
      .eq('mosque_id', caller.mosque_id)
      .eq('email', normalizedEmail)
      .single()

    if (existingMember) {
      return NextResponse.json(
        { error: 'Dit e-mailadres is al toegevoegd aan uw moskee' },
        { status: 409 }
      )
    }

    // Try to create a new Supabase Auth user. If the email already exists
    // in auth.users (e.g., they belong to another mosque or signed up
    // independently), the createUser call will fail — we handle that by
    // looking up the existing user via generateLink (which returns user info).
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const tempPassword = crypto.randomUUID() + crypto.randomUUID()
    let authUserId: string

    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
      email: normalizedEmail,
      password: tempPassword,
      email_confirm: true, // Skip email verification — admin is inviting
      user_metadata: { name: name.trim(), invited: true },
    })

    if (createError) {
      // If user already exists, try to get their ID via generateLink
      // which will work for existing users and return their info
      const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
        type: 'magiclink',
        email: normalizedEmail,
        options: {
          redirectTo: `${appUrl}/auth/callback?redirect=/set-password`,
        },
      })

      if (linkError || !linkData?.user?.id) {
        console.error('Auth user creation error:', createError)
        console.error('Fallback link generation error:', linkError)
        return NextResponse.json(
          { error: 'Uitnodiging aanmaken mislukt. Controleer het e-mailadres.' },
          { status: 500 }
        )
      }

      authUserId = linkData.user.id
    } else {
      authUserId = newUser.user.id
    }

    // Generate a magic link for the invited user to set their password
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: normalizedEmail,
      options: {
        redirectTo: `${appUrl}/auth/callback?redirect=/set-password`,
      },
    })

    if (linkError) {
      console.error('Generate link error:', linkError)
      // Non-fatal — we still create the team member row
    }

    // Insert team member row
    const { error: insertError } = await admin
      .from('users')
      .insert({
        id: authUserId,
        mosque_id: caller.mosque_id,
        name: name.trim(),
        email: normalizedEmail,
        role,
        invited_at: new Date().toISOString(),
        invited_by: caller.id,
      })

    if (insertError) {
      console.error('Team member insert error:', insertError.message, insertError)
      return NextResponse.json(
        { error: 'Teamlid toevoegen mislukt. Probeer het opnieuw.' },
        { status: 500 }
      )
    }

    // Build invite URL using our own domain (not Supabase's action_link)
    let inviteUrl: string | null = null
    if (linkData?.properties?.hashed_token) {
      const params = new URLSearchParams({
        token_hash: linkData.properties.hashed_token,
        type: 'magiclink',
        redirect: '/set-password',
      })
      inviteUrl = `${appUrl}/auth/callback?${params.toString()}`
    }

    if (!inviteUrl) {
      console.error('[Team Invite] No invite URL generated. linkData:', JSON.stringify(linkData))
    }

    // Send invite email
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mosqueName = (caller.mosques as any)?.name || 'Uw moskee'
    const inviterName = caller.name || 'Een beheerder'
    let emailSent = false
    if (inviteUrl) {
      try {
        await sendTeamInviteEmail({
          to: normalizedEmail,
          name: name.trim(),
          mosqueName,
          inviterName,
          role,
          inviteUrl,
        })
        emailSent = true
      } catch (emailErr) {
        console.error('[Team Invite] Email send failed:', emailErr)
      }
    }

    return NextResponse.json({
      success: true,
      member_id: authUserId,
      email_sent: emailSent,
    })
  } catch (err) {
    console.error('Team invite error:', err)
    return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 })
  }
}
