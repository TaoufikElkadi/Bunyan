import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockQueryBuilder, createRoutedMockSupabase } from '../helpers/mock-supabase'

// ---------- Mocks ----------

vi.mock('@/lib/stripe', () => ({
  stripe: {
    paymentIntents: {
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

vi.mock('@/lib/stripe-connect', () => ({
  buildTransferParams: vi.fn().mockResolvedValue({}),
}))

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn().mockReturnValue({ success: true }),
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}))

import { POST } from '@/app/api/payments/intent/route'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

const mockPaymentIntentsCreate = stripe.paymentIntents.create as ReturnType<typeof vi.fn>
const mockCreateAdminClient = createAdminClient as ReturnType<typeof vi.fn>

// ---------- Helpers ----------

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/payments/intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    mosque_slug: 'al-fatiha',
    fund_id: 'fund-1',
    amount: 25, // euros
    donor_name: 'Fatima',
    donor_email: 'fatima@example.com',
    cover_fee: false,
    fee_amount: 0,
    ...overrides,
  }
}

function setupAdminWithMosqueAndFund() {
  const mosquesBuilder = createMockQueryBuilder({
    data: { id: 'mosque-1', name: 'Al-Fatiha Moskee', status: 'active' },
    error: null,
  })

  const fundsBuilder = createMockQueryBuilder({
    data: { id: 'fund-1', name: 'Algemeen Fonds' },
    error: null,
  })

  // Donor lookup by email — no existing donor found
  const donorsBuilder = createMockQueryBuilder({ data: null, error: null })
  // Insert new donor
  donorsBuilder.insert.mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: { id: 'donor-new' },
        error: null,
      }),
    }),
  })

  // Donation insert
  const donationsBuilder = createMockQueryBuilder()
  donationsBuilder.insert.mockResolvedValue({ error: null })

  const admin = createRoutedMockSupabase({
    mosques: mosquesBuilder,
    funds: fundsBuilder,
    donors: donorsBuilder,
    donations: donationsBuilder,
  })
  mockCreateAdminClient.mockReturnValue(admin)

  return admin
}

// ---------- Tests ----------

describe('POST /api/payments/intent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPaymentIntentsCreate.mockResolvedValue({
      id: 'pi_test_1',
      client_secret: 'pi_test_1_secret_abc',
    })
  })

  // ---- Validation ----

  it('returns 400 when mosque_slug is missing', async () => {
    const res = await POST(makeRequest(validBody({ mosque_slug: '' })))
    expect(res.status).toBe(400)
  })

  it('returns 400 when fund_id is missing', async () => {
    const res = await POST(makeRequest(validBody({ fund_id: '' })))
    expect(res.status).toBe(400)
  })

  it('returns 400 when amount is missing', async () => {
    const res = await POST(makeRequest(validBody({ amount: 0 })))
    expect(res.status).toBe(400)
  })

  it('returns 400 when amount is negative', async () => {
    const res = await POST(makeRequest(validBody({ amount: -5 })))
    expect(res.status).toBe(400)
  })

  it('returns 400 when amount is below minimum (less than 1 euro)', async () => {
    setupAdminWithMosqueAndFund()
    const res = await POST(makeRequest(validBody({ amount: 0.5 })))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('1')
  })

  // ---- Mosque / fund lookup ----

  it('returns 404 when mosque is not found by slug', async () => {
    const mosquesBuilder = createMockQueryBuilder({ data: null, error: null })
    const admin = createRoutedMockSupabase({ mosques: mosquesBuilder })
    mockCreateAdminClient.mockReturnValue(admin)

    const res = await POST(makeRequest(validBody()))
    expect(res.status).toBe(404)
  })

  it('returns 404 when fund is not found for this mosque', async () => {
    const mosquesBuilder = createMockQueryBuilder({
      data: { id: 'mosque-1', name: 'Test', status: 'active' },
      error: null,
    })
    const fundsBuilder = createMockQueryBuilder({ data: null, error: null })
    const admin = createRoutedMockSupabase({
      mosques: mosquesBuilder,
      funds: fundsBuilder,
    })
    mockCreateAdminClient.mockReturnValue(admin)

    const res = await POST(makeRequest(validBody()))
    expect(res.status).toBe(404)
  })

  // ---- Donor handling ----

  it('finds existing donor by email', async () => {
    const mosquesBuilder = createMockQueryBuilder({
      data: { id: 'mosque-1', name: 'Test', status: 'active' },
      error: null,
    })
    const fundsBuilder = createMockQueryBuilder({
      data: { id: 'fund-1', name: 'General' },
      error: null,
    })
    const donorsBuilder = createMockQueryBuilder({
      data: { id: 'donor-existing' },
      error: null,
    })
    donorsBuilder.update.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        is: vi.fn().mockResolvedValue({ error: null }),
      }),
    })
    const donationsBuilder = createMockQueryBuilder()
    donationsBuilder.insert.mockResolvedValue({ error: null })

    const admin = createRoutedMockSupabase({
      mosques: mosquesBuilder,
      funds: fundsBuilder,
      donors: donorsBuilder,
      donations: donationsBuilder,
    })
    mockCreateAdminClient.mockReturnValue(admin)

    const res = await POST(makeRequest(validBody()))
    expect(res.status).toBe(200)

    // PaymentIntent metadata should include existing donor id
    expect(mockPaymentIntentsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          donor_id: 'donor-existing',
        }),
      })
    )
  })

  it('creates new donor when no email match is found', async () => {
    setupAdminWithMosqueAndFund()

    const res = await POST(makeRequest(validBody()))
    expect(res.status).toBe(200)

    expect(mockPaymentIntentsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          donor_id: 'donor-new',
        }),
      })
    )
  })

  // ---- PaymentIntent creation ----

  it('creates PaymentIntent with correct amount in cents', async () => {
    setupAdminWithMosqueAndFund()

    const res = await POST(makeRequest(validBody({ amount: 25 })))
    expect(res.status).toBe(200)

    expect(mockPaymentIntentsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 2500, // 25 euros = 2500 cents
        currency: 'eur',
      })
    )
  })

  it('includes server-calculated fee coverage in PaymentIntent amount', async () => {
    setupAdminWithMosqueAndFund()

    const res = await POST(
      makeRequest(validBody({ amount: 25, cover_fee: true }))
    )
    expect(res.status).toBe(200)

    // Fee is recalculated server-side: stripe method = 30 cents fixed
    expect(mockPaymentIntentsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 2530, // 2500 + 30 cents (server-calculated)
      })
    )
  })

  it('ignores client fee_amount — server recalculates', async () => {
    setupAdminWithMosqueAndFund()

    const res = await POST(
      makeRequest(validBody({ amount: 25, cover_fee: false, fee_amount: 9999 }))
    )
    expect(res.status).toBe(200)

    expect(mockPaymentIntentsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 2500, // no fee added even though client sent fee_amount
      })
    )
  })

  // ---- Pending donation row ----

  it('creates a pending donation row in the database', async () => {
    const mosquesBuilder = createMockQueryBuilder({
      data: { id: 'mosque-1', name: 'Test', status: 'active' },
      error: null,
    })
    const fundsBuilder = createMockQueryBuilder({
      data: { id: 'fund-1', name: 'General' },
      error: null,
    })
    const donorsBuilder = createMockQueryBuilder({ data: null, error: null })
    donorsBuilder.insert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'donor-1' },
          error: null,
        }),
      }),
    })

    const donationsInsertSpy = vi.fn().mockResolvedValue({ error: null })
    const donationsBuilder = createMockQueryBuilder()
    donationsBuilder.insert = donationsInsertSpy

    const admin = createRoutedMockSupabase({
      mosques: mosquesBuilder,
      funds: fundsBuilder,
      donors: donorsBuilder,
      donations: donationsBuilder,
    })
    mockCreateAdminClient.mockReturnValue(admin)

    await POST(makeRequest(validBody()))

    expect(donationsInsertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        mosque_id: 'mosque-1',
        fund_id: 'fund-1',
        amount: 2500,
        method: 'stripe',
        status: 'pending',
        stripe_payment_intent_id: 'pi_test_1',
      })
    )
  })

  // ---- Response ----

  it('returns clientSecret and paymentIntentId on success', async () => {
    setupAdminWithMosqueAndFund()

    const res = await POST(makeRequest(validBody()))
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.clientSecret).toBe('pi_test_1_secret_abc')
    expect(json.paymentIntentId).toBe('pi_test_1')
  })

  it('returns 500 when Stripe PaymentIntent creation fails', async () => {
    setupAdminWithMosqueAndFund()
    mockPaymentIntentsCreate.mockRejectedValue(new Error('Stripe error'))

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const res = await POST(makeRequest(validBody()))
    expect(res.status).toBe(500)

    consoleSpy.mockRestore()
  })
})
