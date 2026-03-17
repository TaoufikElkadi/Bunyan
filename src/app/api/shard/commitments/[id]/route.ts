import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('mosque_id, role')
      .eq('id', user.id)
      .single()

    if (!profile?.mosque_id) return NextResponse.json({ error: 'Geen toestemming' }, { status: 403 })
    if (profile.role === 'viewer') return NextResponse.json({ error: 'Geen toestemming' }, { status: 403 })

    const body = await request.json()
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (body.monthly_amount !== undefined) updates.monthly_amount = body.monthly_amount
    if (body.status !== undefined) updates.status = body.status
    if (body.notes !== undefined) updates.notes = body.notes

    const admin = createAdminClient()

    const { error } = await admin
      .from('shard_commitments')
      .update(updates)
      .eq('id', id)
      .eq('mosque_id', profile.mosque_id)

    if (error) {
      console.error('Shard commitment update error:', error)
      return NextResponse.json({ error: 'Bijwerken mislukt' }, { status: 500 })
    }

    await admin.from('audit_log').insert({
      mosque_id: profile.mosque_id,
      user_id: user.id,
      action: body.status === 'cancelled' ? 'shard_commitment_cancelled' : 'shard_commitment_updated',
      entity_type: 'shard_commitment',
      entity_id: id,
      details: updates,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Shard commitment update error:', err)
    return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 })
  }
}
