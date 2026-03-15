import { NextResponse } from 'next/server'
import { getCachedProfile } from '@/lib/supabase/cached'

const DUTCH_NAMES = [
  'Ahmed El Amrani', 'Fatima Bouazza', 'Mohammed Khalil', 'Youssef Bensaid',
  'Khadija El Idrissi', 'Ibrahim Tahiri', 'Amina Rachidi', 'Omar Benali',
  'Nadia Ziani', 'Hassan El Moussaoui', 'Sara Haddad', 'Rachid Amrani',
  'Layla Bouzidi', 'Tariq Mansouri', 'Hanan El Fassi', 'Bilal Ouahabi',
  'Samira Tazi', 'Karim Benchekroun', 'Zineb El Alaoui', 'Hamza Berrada',
]

const METHODS = ['ideal', 'card', 'sepa', 'cash', 'bank_transfer'] as const
const METHOD_WEIGHTS = [0.35, 0.2, 0.15, 0.2, 0.1] // probability distribution

function weightedRandom<T>(items: readonly T[], weights: number[]): T {
  const r = Math.random()
  let sum = 0
  for (let i = 0; i < items.length; i++) {
    sum += weights[i]
    if (r <= sum) return items[i]
  }
  return items[items.length - 1]
}

function randomAmount(): number {
  // Realistic donation amounts in cents: mostly €10-€100, occasional larger
  const ranges = [
    { min: 500, max: 1500, weight: 0.15 },
    { min: 1500, max: 3000, weight: 0.25 },
    { min: 3000, max: 5000, weight: 0.25 },
    { min: 5000, max: 10000, weight: 0.2 },
    { min: 10000, max: 25000, weight: 0.1 },
    { min: 25000, max: 50000, weight: 0.05 },
  ]
  const range = weightedRandom(ranges, ranges.map((r) => r.weight))
  // Round to nearest 50 cents
  const raw = range.min + Math.random() * (range.max - range.min)
  return Math.round(raw / 50) * 50
}

function randomDateThisMonth(): string {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const diff = now.getTime() - start.getTime()
  const date = new Date(start.getTime() + Math.random() * diff)
  return date.toISOString()
}

function randomDate(monthsBack: number): string {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1)
  const end = new Date(now.getFullYear(), now.getMonth(), 0) // last day of previous month
  const diff = end.getTime() - start.getTime()
  const date = new Date(start.getTime() + Math.random() * diff)
  return date.toISOString()
}

function generateIbanHint(): string {
  return String(Math.floor(1000 + Math.random() * 9000))
}

export async function POST() {
  const { mosqueId, supabase, profile } = await getCachedProfile()

  if (!mosqueId || !profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Check if mock data already exists (prevent duplicates)
  const { count } = await supabase
    .from('donations')
    .select('*', { count: 'exact', head: true })
    .eq('mosque_id', mosqueId)
    .eq('notes', '__mock__')

  if (count && count > 0) {
    return NextResponse.json({ error: 'Mock data already exists. Delete existing mock data first.' }, { status: 409 })
  }

  // Get existing funds for this mosque
  const { data: funds } = await supabase
    .from('funds')
    .select('id, name')
    .eq('mosque_id', mosqueId)
    .eq('is_active', true)
    .order('sort_order')

  if (!funds || funds.length === 0) {
    return NextResponse.json({ error: 'No funds found. Create at least one fund first.' }, { status: 400 })
  }

  // 1. Create donors (~18 donors)
  const donorInserts = DUTCH_NAMES.slice(0, 18).map((name) => ({
    mosque_id: mosqueId,
    name,
    email: `${name.toLowerCase().replace(/ /g, '.').replace(/[^a-z.]/g, '')}@example.com`,
    iban_hint: Math.random() > 0.3 ? generateIbanHint() : null,
  }))

  const { data: donors, error: donorError } = await supabase
    .from('donors')
    .insert(donorInserts)
    .select('id, name')

  if (donorError || !donors) {
    return NextResponse.json({ error: `Donor creation failed: ${donorError?.message}` }, { status: 500 })
  }

  // 2. Create ~50 donations spread across last 12 months
  // Ensure ~10-15 land in the current month for visible KPIs
  // Reserve first 5 donors as "new this month" (only get donations this month)
  const newDonors = donors.slice(0, 5)
  const existingDonors = donors.slice(5)
  const donationInserts = []
  const targetCount = 50

  for (let i = 0; i < targetCount; i++) {
    let monthsBack: number
    let donor: typeof donors[0]

    const isThisMonth = i < 12
    if (isThisMonth) {
      // First 12 donations: this month (ensures good current-month data)
      // First 5 go to "new" donors so they have first_donated_at this month
      donor = i < 5 ? newDonors[i] : existingDonors[Math.floor(Math.random() * existingDonors.length)]
    } else {
      // Rest: spread across 1-12 months ago
      donor = existingDonors[Math.floor(Math.random() * existingDonors.length)]
    }

    const fund = funds[Math.floor(Math.random() * funds.length)]
    const method = weightedRandom(METHODS, METHOD_WEIGHTS)
    const amount = randomAmount()
    const isRecurring = Math.random() < 0.2 // 20% chance of being recurring
    const createdAt = isThisMonth
      ? randomDateThisMonth()
      : randomDate(1 + Math.floor(Math.random() * 11))

    donationInserts.push({
      mosque_id: mosqueId,
      donor_id: donor.id,
      fund_id: fund.id,
      amount,
      fee_covered: Math.random() > 0.7 ? Math.round(amount * 0.029 + 30) : 0, // 30% cover fees
      currency: 'EUR',
      method,
      status: 'completed',
      is_recurring: isRecurring,
      notes: '__mock__', // tag for easy cleanup
      created_at: createdAt,
    })
  }

  // Sort by date for consistent insertion
  donationInserts.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  const { error: donationError } = await supabase
    .from('donations')
    .insert(donationInserts)

  if (donationError) {
    return NextResponse.json({ error: `Donation creation failed: ${donationError.message}` }, { status: 500 })
  }

  // 3. Create a few active recurring mandates (~4)
  const recurringDonors = donors.slice(0, 4)
  const recurringInserts = recurringDonors.map((donor, i) => ({
    mosque_id: mosqueId,
    donor_id: donor.id,
    fund_id: funds[i % funds.length].id,
    amount: [2500, 5000, 1500, 10000][i], // €25, €50, €15, €100
    frequency: 'monthly' as const,
    status: 'active' as const,
    next_charge_at: new Date(Date.now() + (7 + i * 7) * 86400000).toISOString(),
    cancel_token: `mock_cancel_${Date.now()}_${i}`,
  }))

  const { error: recurringError } = await supabase
    .from('recurrings')
    .insert(recurringInserts)

  if (recurringError) {
    return NextResponse.json({ error: `Recurring creation failed: ${recurringError.message}` }, { status: 500 })
  }

  // 4. Update donor cached aggregates manually since trigger may not fire for bulk inserts
  for (const donor of donors) {
    const { data: agg } = await supabase
      .from('donations')
      .select('amount, created_at')
      .eq('donor_id', donor.id)
      .eq('status', 'completed')
      .eq('mosque_id', mosqueId)

    if (agg && agg.length > 0) {
      const totalDonated = agg.reduce((sum, d) => sum + d.amount, 0)
      const dates = agg.map((d) => new Date(d.created_at).getTime())
      await supabase
        .from('donors')
        .update({
          total_donated: totalDonated,
          donation_count: agg.length,
          first_donated_at: new Date(Math.min(...dates)).toISOString(),
          last_donated_at: new Date(Math.max(...dates)).toISOString(),
        })
        .eq('id', donor.id)
    }
  }

  return NextResponse.json({
    success: true,
    created: {
      donors: donors.length,
      donations: donationInserts.length,
      recurrings: recurringInserts.length,
    },
  })
}

// DELETE endpoint to clean up mock data
export async function DELETE() {
  const { mosqueId, supabase, profile } = await getCachedProfile()

  if (!mosqueId || !profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Get donor IDs that only have mock donations (safe to delete)
  const { data: mockDonations } = await supabase
    .from('donations')
    .select('donor_id')
    .eq('mosque_id', mosqueId)
    .eq('notes', '__mock__')

  const mockDonorIds = [...new Set((mockDonations ?? []).map((d) => d.donor_id).filter(Boolean))] as string[]

  // Delete mock donations
  await supabase
    .from('donations')
    .delete()
    .eq('mosque_id', mosqueId)
    .eq('notes', '__mock__')

  // Delete mock recurring mandates
  await supabase
    .from('recurrings')
    .delete()
    .eq('mosque_id', mosqueId)
    .like('cancel_token', 'mock_cancel_%')

  // Delete donors that were created for mock data (only if they have no non-mock donations left)
  for (const donorId of mockDonorIds) {
    const { count } = await supabase
      .from('donations')
      .select('*', { count: 'exact', head: true })
      .eq('donor_id', donorId)

    if (count === 0) {
      await supabase.from('donors').delete().eq('id', donorId)
    }
  }

  return NextResponse.json({ success: true })
}
