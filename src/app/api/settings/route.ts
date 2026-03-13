import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/
const RSIN_RE = /^\d{9}$/
const KVK_RE = /^\d{8}$/

export async function PUT(request: Request) {
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

    const body = await request.json()
    const { name, city, address, primary_color, welcome_msg, anbi_status, rsin, kvk, language } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Naam is verplicht' }, { status: 400 })
    }

    if (primary_color && !HEX_COLOR_RE.test(primary_color)) {
      return NextResponse.json({ error: 'Ongeldige kleurcode (gebruik #RRGGBB)' }, { status: 400 })
    }

    const validLanguages = ['nl', 'en', 'tr', 'ar']
    if (language && !validLanguages.includes(language)) {
      return NextResponse.json({ error: 'Ongeldige taal' }, { status: 400 })
    }

    if (rsin && rsin.trim() && !RSIN_RE.test(rsin.trim())) {
      return NextResponse.json({ error: 'RSIN moet exact 9 cijfers zijn' }, { status: 400 })
    }

    if (kvk && kvk.trim() && !KVK_RE.test(kvk.trim())) {
      return NextResponse.json({ error: 'KVK moet exact 8 cijfers zijn' }, { status: 400 })
    }

    const { data: mosque, error } = await supabase
      .from('mosques')
      .update({
        name: name.trim(),
        city: city?.trim() || null,
        address: address?.trim() || null,
        primary_color: primary_color || '#10b981',
        welcome_msg: welcome_msg?.trim() || null,
        anbi_status: anbi_status ?? false,
        rsin: rsin?.trim() || null,
        kvk: kvk?.trim() || null,
        language: language || 'nl',
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.mosque_id)
      .select()
      .single()

    if (error) {
      console.error('Settings update error:', error)
      return NextResponse.json({ error: 'Instellingen bijwerken mislukt' }, { status: 500 })
    }

    return NextResponse.json({ success: true, mosque })
  } catch (err) {
    console.error('Settings update error:', err)
    return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 })
  }
}
