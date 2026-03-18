import { NextResponse } from 'next/server'
import { getCachedProfile } from '@/lib/supabase/cached'

/* ------------------------------------------------------------------ */
/*  REALISTIC NAME POOLS (Dutch Muslim community)                      */
/* ------------------------------------------------------------------ */

// Moroccan-Dutch (largest group in most Dutch mosques)
const MOROCCAN_FIRST_M = ['Mohammed', 'Ahmed', 'Youssef', 'Ibrahim', 'Omar', 'Hassan', 'Rachid', 'Karim', 'Bilal', 'Hamza', 'Tariq', 'Said', 'Khalid', 'Noureddine', 'Abdel', 'Fouad', 'Driss', 'Mustapha', 'Jamal', 'Aziz', 'Mehdi', 'Soufiane', 'Amine', 'Zakaria', 'Ismail', 'Brahim', 'Redouan', 'Samir', 'Mounir', 'Abdelkader']
const MOROCCAN_FIRST_F = ['Fatima', 'Khadija', 'Amina', 'Nadia', 'Sara', 'Layla', 'Hanan', 'Samira', 'Zineb', 'Naima', 'Houria', 'Malika', 'Souad', 'Aisha', 'Latifa', 'Hayat', 'Imane', 'Soukaina', 'Rachida', 'Karima']
const MOROCCAN_LAST = ['El Amrani', 'Bouazza', 'Khalil', 'Bensaid', 'El Idrissi', 'Tahiri', 'Rachidi', 'Benali', 'Ziani', 'El Moussaoui', 'Haddad', 'Amrani', 'Bouzidi', 'Mansouri', 'El Fassi', 'Ouahabi', 'Tazi', 'Benchekroun', 'El Alaoui', 'Berrada', 'Bouhali', 'El Khattabi', 'Chahbi', 'Daoudi', 'El Bakkali', 'Fikri', 'Ghazi', 'Hajji', 'Ait Brahim', 'Jabri', 'Kabbaj', 'Lahlou', 'Moussaid', 'Naciri', 'Oujdi', 'Rifi', 'Seddiki', 'Talbi', 'Yaacoubi', 'Zerhouni']

// Turkish-Dutch
const TURKISH_FIRST_M = ['Mehmet', 'Ali', 'Mustafa', 'Hasan', 'Ahmet', 'Emre', 'Burak', 'Yusuf', 'Murat', 'Serkan', 'Fatih', 'Kemal', 'Omer', 'Eren', 'Selim']
const TURKISH_FIRST_F = ['Ayse', 'Fatma', 'Elif', 'Zeynep', 'Merve', 'Esra', 'Sema', 'Hatice', 'Derya', 'Tugba']
const TURKISH_LAST = ['Yilmaz', 'Kaya', 'Demir', 'Celik', 'Sahin', 'Ozturk', 'Arslan', 'Dogan', 'Kilic', 'Aydin', 'Erdogan', 'Gunes', 'Polat', 'Kaplan', 'Tekin']

// Somali-Dutch
const SOMALI_FIRST_M = ['Abdi', 'Mohamed', 'Yusuf', 'Abdullahi', 'Mahad', 'Hamse', 'Bashir', 'Farah', 'Liban', 'Dahir']
const SOMALI_FIRST_F = ['Hodan', 'Amina', 'Fadumo', 'Halimo', 'Sahra', 'Ayan', 'Nasra', 'Ifrah', 'Deeqa', 'Fartun']
const SOMALI_LAST = ['Abdi', 'Mohamed', 'Ali', 'Hassan', 'Hussein', 'Omar', 'Warsame', 'Jama', 'Adan', 'Mohamud']

// Indonesian/Surinamese-Dutch
const INDO_FIRST_M = ['Rizal', 'Arif', 'Fajar', 'Dian', 'Budi', 'Agus', 'Wahyu', 'Hendra']
const INDO_FIRST_F = ['Siti', 'Dewi', 'Nur', 'Putri', 'Rani', 'Ayu']
const INDO_LAST = ['Hakim', 'Sulaiman', 'Rahman', 'Bakri', 'Sjamsuddin', 'Kartodikromo', 'Prawiro', 'Hadiningrat']

// Dutch converts
const DUTCH_FIRST_M = ['Jan', 'Willem', 'Thomas', 'Pieter', 'Joost', 'Martijn', 'Sander', 'Jeroen']
const DUTCH_FIRST_F = ['Anna', 'Sophie', 'Lisa', 'Esther', 'Mirjam', 'Marieke']
const DUTCH_LAST = ['de Vries', 'van den Berg', 'Bakker', 'Jansen', 'de Jong', 'Smit', 'Meijer', 'Bos']

// Dutch cities + postal codes
const ADDRESSES = [
  // Amsterdam
  { street: 'Eerste van Swindenstraat', city: 'Amsterdam', postcode: '1093' },
  { street: 'Javastraat', city: 'Amsterdam', postcode: '1094' },
  { street: 'Dapperstraat', city: 'Amsterdam', postcode: '1093' },
  { street: 'Molukkenstraat', city: 'Amsterdam', postcode: '1098' },
  { street: 'Balistraat', city: 'Amsterdam', postcode: '1094' },
  { street: 'Insulindeweg', city: 'Amsterdam', postcode: '1094' },
  { street: 'Pretoriusstraat', city: 'Amsterdam', postcode: '1092' },
  { street: 'Linnaeusstraat', city: 'Amsterdam', postcode: '1093' },
  { street: 'Celebesstraat', city: 'Amsterdam', postcode: '1095' },
  { street: 'Sumatrastraat', city: 'Amsterdam', postcode: '1094' },
  // Rotterdam
  { street: 'Katendrechtse Lagedijk', city: 'Rotterdam', postcode: '3082' },
  { street: 'Beijerlandselaan', city: 'Rotterdam', postcode: '3072' },
  { street: 'Dorpsweg', city: 'Rotterdam', postcode: '3083' },
  { street: 'Dordtselaan', city: 'Rotterdam', postcode: '3073' },
  { street: 'Groene Hilledijk', city: 'Rotterdam', postcode: '3073' },
  // Den Haag
  { street: 'Hoefkade', city: 'Den Haag', postcode: '2526' },
  { street: 'Schilderswijk', city: 'Den Haag', postcode: '2525' },
  { street: 'Transvaalstraat', city: 'Den Haag', postcode: '2518' },
  // Utrecht
  { street: 'Kanaalstraat', city: 'Utrecht', postcode: '3531' },
  { street: 'Lombok', city: 'Utrecht', postcode: '3531' },
  { street: 'Kanaleneiland', city: 'Utrecht', postcode: '3527' },
]

const TAGS_POOL = [
  'bestuurslid', 'vrijwilliger', 'ramadan', 'qurbani', 'jongeren',
  'vrouwen', 'onderwijs', 'bouw', 'vaste-donateur', 'zakaat',
]

const METHODS = ['ideal', 'card', 'sepa', 'cash', 'bank_transfer'] as const

/* ------------------------------------------------------------------ */
/*  HELPERS                                                            */
/* ------------------------------------------------------------------ */

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickN<T>(arr: readonly T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

function weightedRandom<T>(items: readonly T[], weights: number[]): T {
  const r = Math.random()
  let sum = 0
  for (let i = 0; i < items.length; i++) {
    sum += weights[i]
    if (r <= sum) return items[i]
  }
  return items[items.length - 1]
}

function generateIbanHint(): string {
  return String(Math.floor(1000 + Math.random() * 9000))
}

function randomDate(from: Date, to: Date): Date {
  return new Date(from.getTime() + Math.random() * (to.getTime() - from.getTime()))
}

function generatePhone(): string | null {
  if (Math.random() > 0.6) return null
  return `06${Math.floor(10000000 + Math.random() * 90000000)}`
}

function generateAddress(): string | null {
  if (Math.random() > 0.45) return null
  const addr = pick(ADDRESSES)
  const num = Math.floor(1 + Math.random() * 200)
  return `${addr.street} ${num}, ${addr.postcode} ${addr.city}`
}

/* ------------------------------------------------------------------ */
/*  DONOR PROFILE ARCHETYPES                                           */
/* ------------------------------------------------------------------ */

type DonorArchetype = {
  name: string
  /** Weight for how many donors of this archetype */
  weight: number
  /** How to generate donation history */
  donationPattern: {
    countRange: [number, number]
    amountRange: [number, number] // cents
    monthsBack: number
    methodWeights: number[] // ideal, card, sepa, cash, bank_transfer
    frequency: 'weekly' | 'monthly' | 'bimonthly' | 'quarterly' | 'ramadan_only' | 'irregular' | 'one_time'
  }
  hasEmail: boolean
  hasRecurring: boolean
  periodicGiftChance: number
  tagChance: number
}

const ARCHETYPES: DonorArchetype[] = [
  {
    name: 'weekly_regular',
    weight: 0.08,
    donationPattern: {
      countRange: [30, 52],
      amountRange: [500, 2000],
      monthsBack: 12,
      methodWeights: [0.1, 0.05, 0.05, 0.75, 0.05],
      frequency: 'weekly',
    },
    hasEmail: true,
    hasRecurring: false,
    periodicGiftChance: 0.3,
    tagChance: 0.5,
  },
  {
    name: 'monthly_steady',
    weight: 0.18,
    donationPattern: {
      countRange: [8, 14],
      amountRange: [2000, 7500],
      monthsBack: 14,
      methodWeights: [0.45, 0.2, 0.2, 0.1, 0.05],
      frequency: 'monthly',
    },
    hasEmail: true,
    hasRecurring: true,
    periodicGiftChance: 0.4,
    tagChance: 0.4,
  },
  {
    name: 'quarterly_donor',
    weight: 0.12,
    donationPattern: {
      countRange: [3, 5],
      amountRange: [5000, 15000],
      monthsBack: 14,
      methodWeights: [0.5, 0.25, 0.15, 0.05, 0.05],
      frequency: 'quarterly',
    },
    hasEmail: true,
    hasRecurring: false,
    periodicGiftChance: 0.25,
    tagChance: 0.3,
  },
  {
    name: 'ramadan_only',
    weight: 0.15,
    donationPattern: {
      countRange: [1, 3],
      amountRange: [5000, 25000],
      monthsBack: 13,
      methodWeights: [0.5, 0.3, 0.05, 0.1, 0.05],
      frequency: 'ramadan_only',
    },
    hasEmail: true,
    hasRecurring: false,
    periodicGiftChance: 0.05,
    tagChance: 0.6,
  },
  {
    name: 'big_annual',
    weight: 0.04,
    donationPattern: {
      countRange: [1, 2],
      amountRange: [25000, 100000],
      monthsBack: 14,
      methodWeights: [0.2, 0.1, 0.1, 0.1, 0.5],
      frequency: 'irregular',
    },
    hasEmail: true,
    hasRecurring: false,
    periodicGiftChance: 0.5,
    tagChance: 0.7,
  },
  {
    name: 'lapsed_donor',
    weight: 0.12,
    donationPattern: {
      countRange: [3, 10],
      amountRange: [1500, 5000],
      monthsBack: 24,
      methodWeights: [0.35, 0.2, 0.15, 0.2, 0.1],
      frequency: 'irregular',
    },
    hasEmail: true,
    hasRecurring: false,
    periodicGiftChance: 0.05,
    tagChance: 0.2,
  },
  {
    name: 'churned',
    weight: 0.08,
    donationPattern: {
      countRange: [2, 6],
      amountRange: [1000, 4000],
      monthsBack: 30,
      methodWeights: [0.3, 0.2, 0.1, 0.3, 0.1],
      frequency: 'irregular',
    },
    hasEmail: true,
    hasRecurring: false,
    periodicGiftChance: 0,
    tagChance: 0.1,
  },
  {
    name: 'cash_anonymous',
    weight: 0.08,
    donationPattern: {
      countRange: [1, 8],
      amountRange: [500, 5000],
      monthsBack: 12,
      methodWeights: [0, 0, 0, 1, 0],
      frequency: 'irregular',
    },
    hasEmail: false,
    hasRecurring: false,
    periodicGiftChance: 0,
    tagChance: 0,
  },
  {
    name: 'new_donor',
    weight: 0.10,
    donationPattern: {
      countRange: [1, 3],
      amountRange: [1000, 5000],
      monthsBack: 2,
      methodWeights: [0.5, 0.3, 0.05, 0.1, 0.05],
      frequency: 'one_time',
    },
    hasEmail: true,
    hasRecurring: false,
    periodicGiftChance: 0,
    tagChance: 0.1,
  },
  {
    name: 'bimonthly_steady',
    weight: 0.05,
    donationPattern: {
      countRange: [4, 7],
      amountRange: [3000, 10000],
      monthsBack: 14,
      methodWeights: [0.4, 0.2, 0.25, 0.05, 0.1],
      frequency: 'bimonthly',
    },
    hasEmail: true,
    hasRecurring: false,
    periodicGiftChance: 0.3,
    tagChance: 0.3,
  },
]

/* ------------------------------------------------------------------ */
/*  NAME GENERATION                                                    */
/* ------------------------------------------------------------------ */

function generateName(usedNames: Set<string>): { name: string | null; origin: string } {
  // Distribution: 50% Moroccan, 25% Turkish, 12% Somali, 8% Indonesian, 5% Dutch convert
  const origin = weightedRandom(
    ['moroccan', 'turkish', 'somali', 'indonesian', 'dutch'] as const,
    [0.50, 0.25, 0.12, 0.08, 0.05]
  )

  let first: string
  let last: string
  const isMale = Math.random() > 0.35

  switch (origin) {
    case 'moroccan':
      first = isMale ? pick(MOROCCAN_FIRST_M) : pick(MOROCCAN_FIRST_F)
      last = pick(MOROCCAN_LAST)
      break
    case 'turkish':
      first = isMale ? pick(TURKISH_FIRST_M) : pick(TURKISH_FIRST_F)
      last = pick(TURKISH_LAST)
      break
    case 'somali':
      first = isMale ? pick(SOMALI_FIRST_M) : pick(SOMALI_FIRST_F)
      last = pick(SOMALI_LAST)
      break
    case 'indonesian':
      first = isMale ? pick(INDO_FIRST_M) : pick(INDO_FIRST_F)
      last = pick(INDO_LAST)
      break
    case 'dutch':
      first = isMale ? pick(DUTCH_FIRST_M) : pick(DUTCH_FIRST_F)
      last = pick(DUTCH_LAST)
      break
  }

  let fullName = `${first} ${last}`

  // Ensure unique
  let attempts = 0
  while (usedNames.has(fullName) && attempts < 20) {
    // Add a suffix or re-pick
    switch (origin) {
      case 'moroccan':
        first = isMale ? pick(MOROCCAN_FIRST_M) : pick(MOROCCAN_FIRST_F)
        last = pick(MOROCCAN_LAST)
        break
      case 'turkish':
        first = isMale ? pick(TURKISH_FIRST_M) : pick(TURKISH_FIRST_F)
        last = pick(TURKISH_LAST)
        break
      case 'somali':
        first = isMale ? pick(SOMALI_FIRST_M) : pick(SOMALI_FIRST_F)
        last = pick(SOMALI_LAST)
        break
      case 'indonesian':
        first = isMale ? pick(INDO_FIRST_M) : pick(INDO_FIRST_F)
        last = pick(INDO_LAST)
        break
      case 'dutch':
        first = isMale ? pick(DUTCH_FIRST_M) : pick(DUTCH_FIRST_F)
        last = pick(DUTCH_LAST)
        break
    }
    fullName = `${first} ${last}`
    attempts++
  }

  usedNames.add(fullName)
  return { name: fullName, origin }
}

function nameToEmail(name: string): string {
  return `${name.toLowerCase().replace(/ /g, '.').replace(/[^a-z.]/g, '')}@example.com`
}

/* ------------------------------------------------------------------ */
/*  DONATION GENERATION                                                */
/* ------------------------------------------------------------------ */

function generateDonationDates(
  archetype: DonorArchetype,
  count: number,
): Date[] {
  const now = new Date()
  const { frequency, monthsBack } = archetype.donationPattern
  const dates: Date[] = []

  // For lapsed/churned, stop donations before recent months
  const isLapsed = archetype.name === 'lapsed_donor'
  const isChurned = archetype.name === 'churned'
  const latestOffset = isChurned ? 18 : isLapsed ? 12 : 0

  const earliest = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1)
  const latest = new Date(now.getFullYear(), now.getMonth() - latestOffset, now.getDate())

  switch (frequency) {
    case 'weekly': {
      // Generate roughly weekly dates
      const startDate = new Date(latest)
      startDate.setDate(startDate.getDate() - count * 7)
      for (let i = 0; i < count; i++) {
        const d = new Date(startDate)
        d.setDate(d.getDate() + i * 7 + Math.floor(Math.random() * 3) - 1) // +/- 1 day jitter
        if (d <= latest && d >= earliest) dates.push(d)
      }
      break
    }
    case 'monthly': {
      const startMonth = latest.getMonth() - count
      for (let i = 0; i < count; i++) {
        const d = new Date(latest.getFullYear(), startMonth + i, 1 + Math.floor(Math.random() * 28))
        if (d <= latest && d >= earliest) dates.push(d)
      }
      break
    }
    case 'bimonthly': {
      const startMonth = latest.getMonth() - count * 2
      for (let i = 0; i < count; i++) {
        const d = new Date(latest.getFullYear(), startMonth + i * 2, 1 + Math.floor(Math.random() * 28))
        if (d <= latest && d >= earliest) dates.push(d)
      }
      break
    }
    case 'quarterly': {
      const startMonth = latest.getMonth() - count * 3
      for (let i = 0; i < count; i++) {
        const d = new Date(latest.getFullYear(), startMonth + i * 3, 1 + Math.floor(Math.random() * 28))
        if (d <= latest && d >= earliest) dates.push(d)
      }
      break
    }
    case 'ramadan_only': {
      // Ramadan 2025: ~Mar 1 – Mar 30, Ramadan 2026: ~Feb 18 – Mar 20
      const ramadanWindows = [
        { start: new Date(2025, 2, 1), end: new Date(2025, 2, 30) },
        { start: new Date(2026, 1, 18), end: new Date(2026, 2, 20) },
      ]
      for (let i = 0; i < count; i++) {
        const window = pick(ramadanWindows)
        dates.push(randomDate(window.start, window.end))
      }
      break
    }
    case 'one_time':
    case 'irregular':
    default: {
      for (let i = 0; i < count; i++) {
        dates.push(randomDate(earliest, latest))
      }
      break
    }
  }

  return dates.sort((a, b) => a.getTime() - b.getTime())
}

function randomAmountInRange(min: number, max: number): number {
  const raw = min + Math.random() * (max - min)
  // Round to nearest 50 cents for realistic amounts
  return Math.round(raw / 50) * 50
}

/* ------------------------------------------------------------------ */
/*  ROUTE HANDLERS                                                     */
/* ------------------------------------------------------------------ */

const TARGET_DONORS = 320
const BATCH_SIZE = 50 // Supabase insert batch size

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Mock data is not available in production' }, { status: 403 })
  }

  const { mosqueId, supabase, profile } = await getCachedProfile()

  if (!mosqueId || !profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Check if mock data already exists
  const { count } = await supabase
    .from('donations')
    .select('*', { count: 'exact', head: true })
    .eq('mosque_id', mosqueId)
    .eq('notes', '__mock__')

  if (count && count > 0) {
    return NextResponse.json({ error: 'Mock data already exists. Delete existing mock data first.' }, { status: 409 })
  }

  // Get existing funds
  const { data: funds } = await supabase
    .from('funds')
    .select('id, name')
    .eq('mosque_id', mosqueId)
    .eq('is_active', true)
    .order('sort_order')

  if (!funds || funds.length === 0) {
    return NextResponse.json({ error: 'No funds found. Create at least one fund first.' }, { status: 400 })
  }

  // Fund weighting: first fund (usually "Algemeen") gets most donations
  const fundWeights = funds.map((_, i) => i === 0 ? 0.5 : 0.5 / (funds.length - 1))

  // ── 1. Generate donor profiles ──
  const usedNames = new Set<string>()
  const usedEmails = new Set<string>()

  interface DonorProfile {
    archetype: DonorArchetype
    name: string | null
    email: string | null
    phone: string | null
    address: string | null
    iban_hint: string | null
    tags: string[]
  }

  const donorProfiles: DonorProfile[] = []

  // Assign archetypes based on weights
  for (let i = 0; i < TARGET_DONORS; i++) {
    const archetype = weightedRandom(ARCHETYPES, ARCHETYPES.map(a => a.weight))
    const isAnonymous = !archetype.hasEmail

    let name: string | null = null
    let email: string | null = null

    if (!isAnonymous) {
      const { name: genName } = generateName(usedNames)
      name = genName

      if (name) {
        email = nameToEmail(name)
        // Handle email collisions
        let emailBase = email
        let suffix = 2
        while (usedEmails.has(email)) {
          email = emailBase.replace('@', `${suffix}@`)
          suffix++
        }
        usedEmails.add(email)
      }
    } else {
      // Anonymous: ~40% have a name but no email (cash with name), ~60% fully anonymous
      if (Math.random() > 0.6) {
        const { name: genName } = generateName(usedNames)
        name = genName
      }
    }

    const tags: string[] = []
    if (Math.random() < archetype.tagChance) {
      const numTags = 1 + Math.floor(Math.random() * 2)
      tags.push(...pickN(TAGS_POOL, numTags))
    }

    donorProfiles.push({
      archetype,
      name,
      email,
      phone: isAnonymous ? null : generatePhone(),
      address: isAnonymous ? null : generateAddress(),
      iban_hint: isAnonymous ? null : (Math.random() > 0.3 ? generateIbanHint() : null),
      tags,
    })
  }

  // Insert donors in batches
  const donorInserts = donorProfiles.map(p => ({
    mosque_id: mosqueId,
    name: p.name,
    email: p.email,
    phone: p.phone,
    address: p.address,
    iban_hint: p.iban_hint,
    tags: p.tags,
  }))

  const allDonors: { id: string; name: string | null }[] = []

  for (let i = 0; i < donorInserts.length; i += BATCH_SIZE) {
    const batch = donorInserts.slice(i, i + BATCH_SIZE)
    const { data, error } = await supabase
      .from('donors')
      .insert(batch)
      .select('id, name')

    if (error || !data) {
      return NextResponse.json({ error: `Donor creation failed at batch ${i}: ${error?.message}` }, { status: 500 })
    }
    allDonors.push(...data)
  }

  // ── 2. Generate donations ──
  const allDonationInserts: {
    mosque_id: string
    donor_id: string
    fund_id: string
    amount: number
    fee_covered: number
    currency: string
    method: string
    status: string
    is_recurring: boolean
    notes: string
    created_at: string
  }[] = []

  for (let i = 0; i < allDonors.length; i++) {
    const donor = allDonors[i]
    const profile = donorProfiles[i]
    const { archetype } = profile
    const pattern = archetype.donationPattern

    const donationCount = pattern.countRange[0] +
      Math.floor(Math.random() * (pattern.countRange[1] - pattern.countRange[0] + 1))

    const dates = generateDonationDates(archetype, donationCount)

    for (const date of dates) {
      const fund = weightedRandom(funds, fundWeights)
      const method = weightedRandom(METHODS, pattern.methodWeights)
      const amount = randomAmountInRange(pattern.amountRange[0], pattern.amountRange[1])
      const feeCovered = method !== 'cash' && Math.random() > 0.7
        ? Math.round(amount * 0.029 + 30)
        : 0

      allDonationInserts.push({
        mosque_id: mosqueId,
        donor_id: donor.id,
        fund_id: fund.id,
        amount,
        fee_covered: feeCovered,
        currency: 'EUR',
        method,
        status: 'completed',
        is_recurring: archetype.hasRecurring && method !== 'cash',
        notes: '__mock__',
        created_at: date.toISOString(),
      })
    }
  }

  // Sort by date
  allDonationInserts.sort((a, b) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  // Insert donations in batches
  for (let i = 0; i < allDonationInserts.length; i += BATCH_SIZE) {
    const batch = allDonationInserts.slice(i, i + BATCH_SIZE)
    const { error } = await supabase.from('donations').insert(batch)
    if (error) {
      return NextResponse.json({
        error: `Donation creation failed at batch ${i}: ${error.message}`,
      }, { status: 500 })
    }
  }

  // ── 3. Create recurring mandates for monthly_steady donors ──
  const recurringDonors = allDonors
    .filter((_, i) => donorProfiles[i].archetype.hasRecurring)
    .slice(0, 25) // cap at 25 active recurrings

  const recurringInserts = recurringDonors.map((donor, i) => ({
    mosque_id: mosqueId,
    donor_id: donor.id,
    fund_id: funds[i % funds.length].id,
    amount: pick([1500, 2000, 2500, 3500, 5000, 7500, 10000]),
    frequency: 'monthly' as const,
    status: 'active' as const,
    next_charge_at: new Date(Date.now() + (1 + i * 2) * 86400000).toISOString(),
    cancel_token: `mock_cancel_${Date.now()}_${i}`,
  }))

  if (recurringInserts.length > 0) {
    const { error } = await supabase.from('recurrings').insert(recurringInserts)
    if (error) {
      return NextResponse.json({ error: `Recurring creation failed: ${error.message}` }, { status: 500 })
    }
  }

  // ── 4. Create periodic gift agreements ──
  const periodicDonors = allDonors
    .filter((_, i) => Math.random() < donorProfiles[i].archetype.periodicGiftChance)
    .slice(0, 35) // realistic number

  const periodicInserts = periodicDonors.map((donor) => {
    const startDate = randomDate(
      new Date(2024, 0, 1),
      new Date(2025, 11, 31)
    )
    const years = pick([5, 5, 5, 10]) // most are 5-year agreements
    const endDate = new Date(startDate)
    endDate.setFullYear(endDate.getFullYear() + years)
    const annualAmount = pick([12000, 18000, 24000, 30000, 36000, 48000, 60000])

    return {
      mosque_id: mosqueId,
      donor_id: donor.id,
      annual_amount: annualAmount,
      fund_id: funds[0].id, // Algemeen
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      status: 'active' as const,
      notes: '__mock__',
    }
  })

  if (periodicInserts.length > 0) {
    for (let i = 0; i < periodicInserts.length; i += BATCH_SIZE) {
      const batch = periodicInserts.slice(i, i + BATCH_SIZE)
      const { error } = await supabase.from('periodic_gift_agreements').insert(batch)
      if (error) {
        return NextResponse.json({ error: `Periodic gift creation failed: ${error.message}` }, { status: 500 })
      }
    }
  }

  // ── 5. Update donor aggregates (triggers may not fire for bulk inserts) ──
  for (const donor of allDonors) {
    const { data: agg } = await supabase
      .from('donations')
      .select('amount, created_at')
      .eq('donor_id', donor.id)
      .eq('status', 'completed')
      .eq('mosque_id', mosqueId)

    if (agg && agg.length > 0) {
      const totalDonated = agg.reduce((sum, d) => sum + d.amount, 0)
      const dates = agg.map((d) => new Date(d.created_at).getTime())
      const avgAmount = Math.round(totalDonated / agg.length)

      // Compute frequency from intervals
      const sortedDates = [...dates].sort((a, b) => a - b)
      const intervals: number[] = []
      for (let i = 1; i < sortedDates.length; i++) {
        intervals.push((sortedDates[i] - sortedDates[i - 1]) / 86400000) // days
      }

      let frequency: string | null = null
      if (intervals.length > 0) {
        intervals.sort((a, b) => a - b)
        const median = intervals[Math.floor(intervals.length / 2)]
        if (median <= 10) frequency = 'weekly'
        else if (median <= 45) frequency = 'monthly'
        else if (median <= 120) frequency = 'quarterly'
        else if (median <= 400) frequency = 'yearly'
        else frequency = 'irregular'
      }

      const multiplier =
        frequency === 'weekly' ? 52 :
        frequency === 'monthly' ? 12 :
        frequency === 'quarterly' ? 4 :
        frequency === 'yearly' ? 1 : 1

      await supabase
        .from('donors')
        .update({
          total_donated: totalDonated,
          donation_count: agg.length,
          avg_donation_amount: avgAmount,
          donation_frequency: frequency,
          estimated_annual: avgAmount * multiplier,
          first_donated_at: new Date(Math.min(...dates)).toISOString(),
          last_donated_at: new Date(Math.max(...dates)).toISOString(),
          last_computed_at: new Date().toISOString(),
        })
        .eq('id', donor.id)
    }
  }

  return NextResponse.json({
    success: true,
    created: {
      donors: allDonors.length,
      donations: allDonationInserts.length,
      recurrings: recurringInserts.length,
      periodic_gifts: periodicInserts.length,
    },
  })
}

// DELETE endpoint to clean up mock data
export async function DELETE() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Mock data is not available in production' }, { status: 403 })
  }

  const { mosqueId, supabase, profile } = await getCachedProfile()

  if (!mosqueId || !profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Get donor IDs that have mock donations
  const { data: mockDonations } = await supabase
    .from('donations')
    .select('donor_id')
    .eq('mosque_id', mosqueId)
    .eq('notes', '__mock__')

  const mockDonorIds = Array.from(new Set((mockDonations ?? []).map((d: { donor_id: string }) => d.donor_id).filter(Boolean)))

  // Delete mock periodic gift agreements
  await supabase
    .from('periodic_gift_agreements')
    .delete()
    .eq('mosque_id', mosqueId)
    .eq('notes', '__mock__')

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

  // Delete member_events for mock donors
  for (let i = 0; i < mockDonorIds.length; i++) {
    await supabase
      .from('member_events')
      .delete()
      .eq('donor_id', mockDonorIds[i])
      .eq('mosque_id', mosqueId)
  }

  // Delete donors that have no non-mock donations left
  for (let i = 0; i < mockDonorIds.length; i++) {
    const donorId = mockDonorIds[i]
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
