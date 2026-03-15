import { describe, it, expect } from 'vitest'
import {
  groupDonationsByDonor,
  formatReceiptNumber,
  parseReceiptSequence,
  validatePeriodicGift,
  type RawDonation,
} from '@/lib/anbi'

describe('formatReceiptNumber', () => {
  it('formats with zero-padded sequence', () => {
    expect(formatReceiptNumber(2025, 1)).toBe('ANBI-2025-000001')
  })

  it('formats larger sequence numbers', () => {
    expect(formatReceiptNumber(2025, 123)).toBe('ANBI-2025-000123')
  })

  it('handles sequence beyond 6 digits', () => {
    expect(formatReceiptNumber(2025, 1234567)).toBe('ANBI-2025-1234567')
  })
})

describe('parseReceiptSequence', () => {
  it('parses valid receipt number', () => {
    expect(parseReceiptSequence('ANBI-2025-000001')).toBe(1)
  })

  it('parses larger numbers', () => {
    expect(parseReceiptSequence('ANBI-2025-000123')).toBe(123)
  })

  it('returns 0 for invalid format', () => {
    expect(parseReceiptSequence('INVALID')).toBe(0)
    expect(parseReceiptSequence('')).toBe(0)
    expect(parseReceiptSequence('ANBI-2025-')).toBe(0)
  })
})

describe('groupDonationsByDonor', () => {
  const makeDonation = (overrides: Partial<RawDonation> = {}): RawDonation => ({
    id: 'don-1',
    donor_id: 'donor-1',
    fund_id: 'fund-1',
    amount: 1000,
    method: 'ideal',
    donors: { id: 'donor-1', name: 'Ahmed', email: 'ahmed@example.com', address: 'Straat 1' },
    funds: { name: 'Algemeen' },
    ...overrides,
  })

  it('groups a single donation', () => {
    const result = groupDonationsByDonor([makeDonation()])

    expect(result.size).toBe(1)
    const donor = result.get('donor-1')!
    expect(donor.name).toBe('Ahmed')
    expect(donor.totalAmount).toBe(1000)
    expect(donor.funds.size).toBe(1)
    expect(donor.funds.get('fund-1')!.count).toBe(1)
  })

  it('sums amounts for same donor', () => {
    const donations = [
      makeDonation({ id: 'don-1', amount: 1000 }),
      makeDonation({ id: 'don-2', amount: 2500 }),
    ]

    const result = groupDonationsByDonor(donations)
    const donor = result.get('donor-1')!
    expect(donor.totalAmount).toBe(3500)
    expect(donor.funds.get('fund-1')!.count).toBe(2)
    expect(donor.funds.get('fund-1')!.amount).toBe(3500)
  })

  it('groups by fund within a donor', () => {
    const donations = [
      makeDonation({ id: 'don-1', fund_id: 'fund-1', amount: 1000, funds: { name: 'Algemeen' } }),
      makeDonation({ id: 'don-2', fund_id: 'fund-2', amount: 2000, funds: { name: 'Zakat' } }),
    ]

    const result = groupDonationsByDonor(donations)
    const donor = result.get('donor-1')!
    expect(donor.totalAmount).toBe(3000)
    expect(donor.funds.size).toBe(2)
    expect(donor.funds.get('fund-1')!.fundName).toBe('Algemeen')
    expect(donor.funds.get('fund-2')!.fundName).toBe('Zakat')
  })

  it('groups multiple donors separately', () => {
    const donations = [
      makeDonation({
        id: 'don-1',
        donor_id: 'donor-1',
        amount: 1000,
        donors: { id: 'donor-1', name: 'Ahmed', email: null, address: null },
      }),
      makeDonation({
        id: 'don-2',
        donor_id: 'donor-2',
        amount: 5000,
        donors: { id: 'donor-2', name: 'Fatima', email: null, address: null },
      }),
    ]

    const result = groupDonationsByDonor(donations)
    expect(result.size).toBe(2)
    expect(result.get('donor-1')!.totalAmount).toBe(1000)
    expect(result.get('donor-2')!.totalAmount).toBe(5000)
  })

  it('excludes anonymous donors (no name)', () => {
    const donations = [
      makeDonation({
        donors: { id: 'donor-1', name: null, email: 'anon@test.com', address: null },
      }),
    ]

    const result = groupDonationsByDonor(donations)
    expect(result.size).toBe(0)
  })

  it('excludes donations with null donor', () => {
    const donations = [
      makeDonation({ donors: null }),
    ]

    const result = groupDonationsByDonor(donations)
    expect(result.size).toBe(0)
  })

  it('handles empty donations array', () => {
    const result = groupDonationsByDonor([])
    expect(result.size).toBe(0)
  })

  it('preserves donor address', () => {
    const donations = [
      makeDonation({
        donors: { id: 'donor-1', name: 'Ahmed', email: null, address: 'Kerkstraat 12, Amsterdam' },
      }),
    ]

    const result = groupDonationsByDonor(donations)
    expect(result.get('donor-1')!.address).toBe('Kerkstraat 12, Amsterdam')
  })

  it('uses "Onbekend fonds" when fund is null', () => {
    const donations = [
      makeDonation({ funds: null }),
    ]

    const result = groupDonationsByDonor(donations)
    const donor = result.get('donor-1')!
    const fundEntry = Array.from(donor.funds.values())[0]
    expect(fundEntry.fundName).toBe('Onbekend fonds')
  })
})

describe('validatePeriodicGift', () => {
  it('returns null for valid 5-year gift', () => {
    const result = validatePeriodicGift({
      startDate: '2025-01-01',
      endDate: '2030-01-01',
      annualAmount: 1000,
    })
    expect(result).toBeNull()
  })

  it('returns null for longer than 5 years', () => {
    const result = validatePeriodicGift({
      startDate: '2025-01-01',
      endDate: '2035-01-01',
      annualAmount: 1000,
    })
    expect(result).toBeNull()
  })

  it('rejects less than 5 years', () => {
    const result = validatePeriodicGift({
      startDate: '2025-01-01',
      endDate: '2029-06-01',
      annualAmount: 1000,
    })
    expect(result).toContain('minimaal 5 jaar')
  })

  it('rejects end date before start date', () => {
    const result = validatePeriodicGift({
      startDate: '2025-01-01',
      endDate: '2024-01-01',
      annualAmount: 1000,
    })
    expect(result).toContain('na startdatum')
  })

  it('rejects zero amount', () => {
    const result = validatePeriodicGift({
      startDate: '2025-01-01',
      endDate: '2030-01-01',
      annualAmount: 0,
    })
    expect(result).toContain('groter zijn dan 0')
  })

  it('rejects negative amount', () => {
    const result = validatePeriodicGift({
      startDate: '2025-01-01',
      endDate: '2030-01-01',
      annualAmount: -100,
    })
    expect(result).toContain('groter zijn dan 0')
  })

  it('rejects invalid dates', () => {
    const result = validatePeriodicGift({
      startDate: 'not-a-date',
      endDate: '2030-01-01',
      annualAmount: 1000,
    })
    expect(result).toContain('Ongeldige datum')
  })
})
