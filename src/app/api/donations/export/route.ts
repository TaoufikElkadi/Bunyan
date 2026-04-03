import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPlanLimits } from '@/lib/plan'
import { centsToEuros } from '@/lib/money'

const METHOD_LABELS: Record<string, string> = {
  ideal: 'iDEAL',
  card: 'Kaart',
  sepa: 'SEPA',
  cash: 'Contant',
  bank_transfer: 'Overboeking',
}

const STATUS_LABELS: Record<string, string> = {
  completed: 'Voltooid',
  pending: 'In afwachting',
  failed: 'Mislukt',
  refunded: 'Terugbetaald',
}

function escapeCsvField(value: string): string {
  // Prevent CSV formula injection: prefix with ' if starts with =, +, -, @, tab, or CR
  const FORMULA_CHARS = ['=', '+', '-', '@', '\t', '\r']
  let safe = value
  if (safe.length > 0 && FORMULA_CHARS.includes(safe[0])) {
    safe = `'${safe}`
  }
  if (safe.includes(',') || safe.includes('"') || safe.includes('\n')) {
    return `"${safe.replace(/"/g, '""')}"`
  }
  return safe
}

export async function GET(request: NextRequest) {
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const plan = (profile.mosques as any)?.plan ?? 'free'
    const limits = getPlanLimits(plan)

    if (!limits.hasCsvExport) {
      return NextResponse.json({ error: 'CSV export is alleen beschikbaar in het Growth-abonnement' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const fundId = searchParams.get('fund')

    let query = supabase
      .from('donations')
      .select('*, funds(name), donors(name, email)')
      .eq('mosque_id', profile.mosque_id)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }
    if (from) {
      query = query.gte('created_at', `${from}T00:00:00`)
    }
    if (to) {
      query = query.lte('created_at', `${to}T23:59:59`)
    }
    if (fundId) {
      query = query.eq('fund_id', fundId)
    }

    // Safety cap: limit to 10K rows to prevent timeouts on large mosques.
    // CSV exports beyond this size should use a background job instead.
    query = query.limit(10000)

    const { data: donations, error } = await query

    if (error) {
      console.error('Donations export query error:', error)
      return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 })
    }

    const header = 'Datum,Donateur,E-mail,Fonds,Methode,Bedrag (€),Status'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = (donations ?? []).map((d: any) => {
      const datum = new Date(d.created_at).toLocaleDateString('nl-NL')
      const donateur = escapeCsvField(d.donors?.name ?? 'Anoniem')
      const email = escapeCsvField(d.donors?.email ?? '')
      const fonds = escapeCsvField(d.funds?.name ?? '')
      const methode = METHOD_LABELS[d.method] ?? d.method
      const bedrag = centsToEuros(d.amount).toFixed(2)
      const statusLabel = STATUS_LABELS[d.status] ?? d.status
      return `${datum},${donateur},${email},${fonds},${methode},${bedrag},${statusLabel}`
    })

    const today = new Date().toISOString().split('T')[0]
    const csv = '\uFEFF' + header + '\n' + rows.join('\n')

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="donaties-export-${today}.csv"`,
      },
    })
  } catch (err) {
    console.error('Donations export error:', err)
    return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 })
  }
}
