import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']

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

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Geen toestemming' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const type = formData.get('type') as string | null // 'logo' or 'banner'

    if (!file) {
      return NextResponse.json({ error: 'Geen bestand geselecteerd' }, { status: 400 })
    }

    if (!type || !['logo', 'banner'].includes(type)) {
      return NextResponse.json({ error: 'Ongeldig uploadtype' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Alleen JPG, PNG, WebP en SVG zijn toegestaan' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Bestand mag niet groter zijn dan 2MB' }, { status: 400 })
    }

    const mosqueId = profile.mosque_id
    const ext = file.name.split('.').pop() || 'png'
    const filePath = `${mosqueId}/${type}.${ext}`

    // Upload to Supabase Storage (bucket: branding)
    const { error: uploadError } = await supabase.storage
      .from('branding')
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Upload mislukt' }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('branding')
      .getPublicUrl(filePath)

    const publicUrl = urlData.publicUrl

    // Update mosque record
    const column = type === 'logo' ? 'logo_url' : 'banner_url'
    const { error: updateError } = await supabase
      .from('mosques')
      .update({ [column]: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', mosqueId)

    if (updateError) {
      console.error('DB update error:', updateError)
      return NextResponse.json({ error: 'URL opslaan mislukt' }, { status: 500 })
    }

    return NextResponse.json({ success: true, url: publicUrl })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 })
  }
}
