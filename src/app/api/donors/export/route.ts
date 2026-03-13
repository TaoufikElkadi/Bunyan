import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPlanLimits } from '@/lib/plan'
import { centsToEuros } from '@/lib/money'

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
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
      .select('mosque_id, role, mosques(plan)')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 })
    }

    const plan = (profile.mosques as any)?.plan ?? 'free'
    const limits = getPlanLimits(plan)

    if (!limits.hasCsvExport) {
      return NextResponse.json({ error: 'CSV export is alleen beschikbaar in het Growth-abonnement' }, { status: 403 })
    }

    const { data: donors, error } = await supabase
      .from('donors')
      .select('*')
      .eq('mosque_id', profile.mosque_id)
      .order('total_donated', { ascending: false })

    if (error) {
      console.error('Donors export query error:', error)
      return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 })
    }

    const header = 'Naam,E-mail,Telefoon,Totaal gedoneerd (€),Aantal donaties,Eerste donatie,Laatste donatie'
    const rows = (donors ?? []).map((d: any) => {
      const naam = escapeCsvField(d.name ?? 'Anoniem')
      const email = escapeCsvField(d.email ?? '')
      const telefoon = escapeCsvField(d.phone ?? '')
      const totaal = centsToEuros(d.total_donated).toFixed(2)
      const aantal = String(d.donation_count)
      const eerste = d.first_donated_at
        ? new Date(d.first_donated_at).toLocaleDateString('nl-NL')
        : ''
      const laatste = d.last_donated_at
        ? new Date(d.last_donated_at).toLocaleDateString('nl-NL')
        : ''
      return `${naam},${email},${telefoon},${totaal},${aantal},${eerste},${laatste}`
    })

    const today = new Date().toISOString().split('T')[0]
    const csv = '\uFEFF' + header + '\n' + rows.join('\n')

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="donateurs-export-${today}.csv"`,
      },
    })
  } catch (err) {
    console.error('Donors export error:', err)
    return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 })
  }
}
