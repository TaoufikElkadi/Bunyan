import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'
import QRCode from 'qrcode'

export async function POST(request: Request) {
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

    if (!profile || profile.role === 'viewer') {
      return NextResponse.json({ error: 'Geen toestemming' }, { status: 403 })
    }

    const body = await request.json()
    const { fund_id, campaign_id } = body

    // Verify fund belongs to this mosque if provided
    if (fund_id) {
      const { data: fund } = await supabase
        .from('funds')
        .select('id')
        .eq('id', fund_id)
        .eq('mosque_id', profile.mosque_id)
        .maybeSingle()

      if (!fund) {
        return NextResponse.json({ error: 'Fonds niet gevonden' }, { status: 404 })
      }
    }

    // Verify campaign belongs to this mosque if provided
    if (campaign_id) {
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('id')
        .eq('id', campaign_id)
        .eq('mosque_id', profile.mosque_id)
        .maybeSingle()

      if (!campaign) {
        return NextResponse.json({ error: 'Campagne niet gevonden' }, { status: 404 })
      }
    }

    // Generate random 8-char code
    const code = crypto.randomBytes(6).toString('base64url').slice(0, 8)

    const { error } = await supabase
      .from('qr_links')
      .insert({
        mosque_id: profile.mosque_id,
        code,
        fund_id: fund_id || null,
        campaign_id: campaign_id || null,
      })
      .select()
      .single()

    if (error) {
      console.error('QR link creation error:', error)
      return NextResponse.json({ error: 'QR code aanmaken mislukt' }, { status: 500 })
    }

    const url = `${process.env.NEXT_PUBLIC_APP_URL}/go/${code}`
    const qr_data_url = await QRCode.toDataURL(url, {
      width: 400,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    })

    return NextResponse.json({ code, qr_data_url, url })
  } catch (err) {
    console.error('QR link creation error:', err)
    return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 })
  }
}

export async function GET() {
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

    if (!profile) {
      return NextResponse.json({ error: 'Geen toestemming' }, { status: 403 })
    }

    const { data: qrLinks, error } = await supabase
      .from('qr_links')
      .select('*, funds(name), campaigns(title)')
      .eq('mosque_id', profile.mosque_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('QR links fetch error:', error)
      return NextResponse.json({ error: 'QR codes ophalen mislukt' }, { status: 500 })
    }

    return NextResponse.json(qrLinks || [])
  } catch (err) {
    console.error('QR links fetch error:', err)
    return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 })
  }
}
