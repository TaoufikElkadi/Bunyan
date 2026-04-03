import { NextResponse } from 'next/server'
import { getPlatformAdmin } from '@/lib/supabase/platform-admin'

export async function GET() {
  try {
    const admin = await getPlatformAdmin()
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { data: mosques, error } = await admin.adminClient
      .from('mosques')
      .select('id, name, slug, city, plan, created_at')
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) {
      console.error('Fetch mosques error:', error)
      return NextResponse.json({ error: 'Failed to fetch mosques' }, { status: 500 })
    }

    // Fetch admin users for each mosque
    type MosqueRow = { id: string; [key: string]: unknown }
    type UserRow = { id: string; name: string; email: string; role: string; mosque_id: string }
    const mosqueIds = mosques.map((m: MosqueRow) => m.id)
    let users: UserRow[] = []
    if (mosqueIds.length > 0) {
      const { data } = await admin.adminClient
        .from('users')
        .select('id, name, email, role, mosque_id')
        .in('mosque_id', mosqueIds)
      users = (data ?? []) as UserRow[]
    }

    // Group users by mosque_id
    const usersByMosque = users.reduce((acc: Record<string, UserRow[]>, u: UserRow) => {
      if (!acc[u.mosque_id]) acc[u.mosque_id] = []
      acc[u.mosque_id].push(u)
      return acc
    }, {})

    const result = mosques.map((m: MosqueRow) => ({
      ...m,
      users: usersByMosque[m.id] ?? [],
    }))

    return NextResponse.json(result)
  } catch (err) {
    console.error('List mosques error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getPlatformAdmin()
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const body = await request.json()
    const { name, slug, city } = body

    if (!name?.trim() || !slug?.trim()) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
    }

    // Check slug uniqueness
    const { data: existing } = await admin.adminClient
      .from('mosques')
      .select('id')
      .eq('slug', slug.trim().toLowerCase())
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Slug already in use' }, { status: 409 })
    }

    const { data: mosque, error } = await admin.adminClient
      .from('mosques')
      .insert({
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        city: city?.trim() || null,
        plan: 'free',
        primary_color: '#10b981',
        language: 'nl',
      })
      .select()
      .single()

    if (error) {
      console.error('Create mosque error:', error)
      return NextResponse.json({ error: 'Failed to create mosque' }, { status: 500 })
    }

    return NextResponse.json(mosque, { status: 201 })
  } catch (err) {
    console.error('Create mosque error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
