import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { sendWelcomeEmail } from '@/lib/email/templates/welcome'

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)
    const { success } = rateLimit(`onboarding:${ip}`, 3, 60_000)
    if (!success) {
      return NextResponse.json({ error: 'Te veel verzoeken. Probeer het later opnieuw.' }, { status: 429 })
    }

    // Verify the user is authenticated
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
    }

    // Check if user already has a mosque
    const admin = createAdminClient()
    const { data: existingUser } = await admin
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single()

    if (existingUser) {
      return NextResponse.json({ error: 'U heeft al een moskee account' }, { status: 400 })
    }

    const body = await request.json()
    const { mosque, funds, user: userData } = body

    // Validate slug uniqueness
    const { data: existingMosque } = await admin
      .from('mosques')
      .select('id')
      .eq('slug', mosque.slug)
      .single()

    if (existingMosque) {
      return NextResponse.json({ error: 'Deze URL is al in gebruik. Kies een andere slug.' }, { status: 400 })
    }

    // Create mosque
    const { data: newMosque, error: mosqueError } = await admin
      .from('mosques')
      .insert({
        name: mosque.name,
        slug: mosque.slug,
        city: mosque.city,
        primary_color: mosque.primary_color,
        welcome_msg: mosque.welcome_msg,
        anbi_status: mosque.anbi_status,
        rsin: mosque.rsin,
        language: 'nl',
      })
      .select()
      .single()

    if (mosqueError) {
      console.error('Mosque creation error:', mosqueError)
      return NextResponse.json({ error: 'Moskee aanmaken mislukt' }, { status: 500 })
    }

    // Create user profile linked to mosque
    const { error: userError } = await admin
      .from('users')
      .insert({
        id: user.id,
        mosque_id: newMosque.id,
        name: userData.name || user.email,
        email: userData.email || user.email!,
        role: 'admin',
      })

    if (userError) {
      console.error('User creation error:', userError)
      // Rollback mosque
      await admin.from('mosques').delete().eq('id', newMosque.id)
      return NextResponse.json({ error: 'Gebruiker aanmaken mislukt' }, { status: 500 })
    }

    // Create funds
    if (funds && funds.length > 0) {
      const fundRows = funds
        .filter((f: { name: string }) => f.name.trim())
        .map((f: { name: string; description: string; icon: string }, i: number) => ({
          mosque_id: newMosque.id,
          name: f.name.trim(),
          description: f.description || null,
          icon: f.icon || null,
          sort_order: i,
        }))

      const { error: fundsError } = await admin.from('funds').insert(fundRows)

      if (fundsError) {
        console.error('Funds creation error:', fundsError)
        // Non-critical — mosque is created, funds can be added later
      }
    }

    // Fire-and-forget welcome email
    const email = userData.email || user.email!
    const userName = userData.name || email
    void sendWelcomeEmail({
      to: email,
      name: userName,
      mosqueName: mosque.name,
      donationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/doneren/${mosque.slug}`,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/instellingen`,
    }).catch(err => console.error('Welcome email error:', err))

    return NextResponse.json({ success: true, mosque_id: newMosque.id })
  } catch (err) {
    console.error('Onboarding error:', err)
    return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 })
  }
}
