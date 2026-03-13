import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockQueryBuilder, createRoutedMockSupabase } from '../helpers/mock-supabase'

// ---------- Mocks ----------

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

import { POST } from '@/app/api/donations/route'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const mockCreateClient = createClient as ReturnType<typeof vi.fn>
const mockCreateAdminClient = createAdminClient as ReturnType<typeof vi.fn>

// ---------- Helpers ----------

function makeRequest(body: any) {
  return new Request('http://localhost/api/donations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function validBody(overrides: any = {}) {
  return {
    donor_name: 'Ahmad',
    donor_email: 'ahmad@example.com',
    amount: 2500,
    fund_id: 'fund-1',
    method: 'cash',
    notes: '',
    ...overrides,
  }
}

/**
 * Sets up the auth mock (supabase server client) to return a user + profile.
 */
function setupAuth(user: any, profile: any) {
  const usersBuilder = createMockQueryBuilder({
    data: profile,
    error: null,
  })

  const authClient: any = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
    from: vi.fn(() => usersBuilder),
  }

  // createClient is async in the real implementation
  mockCreateClient.mockResolvedValue(authClient)
  return authClient
}

// ---------- Tests ----------

describe('POST /api/donations (manual donation)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    const authClient: any = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    }
    mockCreateClient.mockResolvedValue(authClient)

    const res = await POST(makeRequest(validBody()))
    expect(res.status).toBe(401)
  })

  it('returns 403 when user has viewer role', async () => {
    setupAuth(
      { id: 'user-1' },
      { mosque_id: 'mosque-1', role: 'viewer' }
    )

    const res = await POST(makeRequest(validBody()))
    expect(res.status).toBe(403)
  })

  it('returns 400 when amount is missing', async () => {
    setupAuth(
      { id: 'user-1' },
      { mosque_id: 'mosque-1', role: 'admin' }
    )

    const res = await POST(makeRequest(validBody({ amount: 0 })))
    expect(res.status).toBe(400)
  })

  it('returns 400 when amount is negative', async () => {
    setupAuth(
      { id: 'user-1' },
      { mosque_id: 'mosque-1', role: 'admin' }
    )

    const res = await POST(makeRequest(validBody({ amount: -100 })))
    expect(res.status).toBe(400)
  })

  it('returns 400 when fund_id is missing', async () => {
    setupAuth(
      { id: 'user-1' },
      { mosque_id: 'mosque-1', role: 'admin' }
    )

    const res = await POST(makeRequest(validBody({ fund_id: '' })))
    expect(res.status).toBe(400)
  })

  it('returns 400 when payment method is invalid', async () => {
    setupAuth(
      { id: 'user-1' },
      { mosque_id: 'mosque-1', role: 'admin' }
    )

    const res = await POST(makeRequest(validBody({ method: 'bitcoin' })))
    expect(res.status).toBe(400)
  })

  it('returns 400 for stripe payment method (only cash/bank_transfer allowed)', async () => {
    setupAuth(
      { id: 'user-1' },
      { mosque_id: 'mosque-1', role: 'admin' }
    )

    const res = await POST(makeRequest(validBody({ method: 'stripe' })))
    expect(res.status).toBe(400)
  })

  it('accepts bank_transfer as valid payment method', async () => {
    setupAuth(
      { id: 'user-1' },
      { mosque_id: 'mosque-1', role: 'admin' }
    )

    // Fund lookup
    const fundsBuilder = createMockQueryBuilder({
      data: { id: 'fund-1' },
      error: null,
    })

    // Donor lookup by email (existing donor found)
    const donorsBuilder = createMockQueryBuilder({
      data: { id: 'donor-1' },
      error: null,
    })
    // The update for donor name (when existing donor found)
    donorsBuilder.update.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        is: vi.fn().mockResolvedValue({ error: null }),
      }),
    })

    // Donation insert
    const donationsBuilder = createMockQueryBuilder()
    donationsBuilder.insert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'don-1' },
          error: null,
        }),
      }),
    })

    // Audit log insert
    const auditBuilder = createMockQueryBuilder()
    auditBuilder.insert.mockResolvedValue({ error: null })

    const admin = createRoutedMockSupabase({
      funds: fundsBuilder,
      donors: donorsBuilder,
      donations: donationsBuilder,
      audit_log: auditBuilder,
    })
    mockCreateAdminClient.mockReturnValue(admin)

    const res = await POST(makeRequest(validBody({ method: 'bank_transfer' })))
    expect(res.status).toBe(200)
  })

  it('finds existing donor by email and creates donation', async () => {
    setupAuth(
      { id: 'user-1' },
      { mosque_id: 'mosque-1', role: 'admin' }
    )

    const fundsBuilder = createMockQueryBuilder({
      data: { id: 'fund-1' },
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
    donationsBuilder.insert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'don-new' },
          error: null,
        }),
      }),
    })

    const auditBuilder = createMockQueryBuilder()
    auditBuilder.insert.mockResolvedValue({ error: null })

    const admin = createRoutedMockSupabase({
      funds: fundsBuilder,
      donors: donorsBuilder,
      donations: donationsBuilder,
      audit_log: auditBuilder,
    })
    mockCreateAdminClient.mockReturnValue(admin)

    const res = await POST(makeRequest(validBody()))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.donation_id).toBe('don-new')
  })

  it('creates new donor when no email match is found', async () => {
    setupAuth(
      { id: 'user-1' },
      { mosque_id: 'mosque-1', role: 'admin' }
    )

    const fundsBuilder = createMockQueryBuilder({
      data: { id: 'fund-1' },
      error: null,
    })

    // No existing donor found by email
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
    // maybeSingle returns null too (no name match)
    donorsBuilder.maybeSingle.mockResolvedValue({ data: null, error: null })

    const donationsBuilder = createMockQueryBuilder()
    donationsBuilder.insert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'don-new' },
          error: null,
        }),
      }),
    })

    const auditBuilder = createMockQueryBuilder()
    auditBuilder.insert.mockResolvedValue({ error: null })

    const admin = createRoutedMockSupabase({
      funds: fundsBuilder,
      donors: donorsBuilder,
      donations: donationsBuilder,
      audit_log: auditBuilder,
    })
    mockCreateAdminClient.mockReturnValue(admin)

    const res = await POST(makeRequest(validBody()))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
  })

  it('creates donation with status completed', async () => {
    setupAuth(
      { id: 'user-1' },
      { mosque_id: 'mosque-1', role: 'admin' }
    )

    const fundsBuilder = createMockQueryBuilder({
      data: { id: 'fund-1' },
      error: null,
    })

    const donorsBuilder = createMockQueryBuilder({
      data: { id: 'donor-1' },
      error: null,
    })
    donorsBuilder.update.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        is: vi.fn().mockResolvedValue({ error: null }),
      }),
    })

    const donationsBuilder = createMockQueryBuilder()
    const insertSpy = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'don-1' },
          error: null,
        }),
      }),
    })
    donationsBuilder.insert = insertSpy

    const auditBuilder = createMockQueryBuilder()
    auditBuilder.insert.mockResolvedValue({ error: null })

    const admin = createRoutedMockSupabase({
      funds: fundsBuilder,
      donors: donorsBuilder,
      donations: donationsBuilder,
      audit_log: auditBuilder,
    })
    mockCreateAdminClient.mockReturnValue(admin)

    await POST(makeRequest(validBody()))
    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'completed' })
    )
  })

  it('creates an audit log entry after donation', async () => {
    setupAuth(
      { id: 'user-1' },
      { mosque_id: 'mosque-1', role: 'admin' }
    )

    const fundsBuilder = createMockQueryBuilder({
      data: { id: 'fund-1' },
      error: null,
    })

    const donorsBuilder = createMockQueryBuilder({
      data: { id: 'donor-1' },
      error: null,
    })
    donorsBuilder.update.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        is: vi.fn().mockResolvedValue({ error: null }),
      }),
    })

    const donationsBuilder = createMockQueryBuilder()
    donationsBuilder.insert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'don-1' },
          error: null,
        }),
      }),
    })

    const auditInsertSpy = vi.fn().mockResolvedValue({ error: null })
    const auditBuilder = createMockQueryBuilder()
    auditBuilder.insert = auditInsertSpy

    const admin = createRoutedMockSupabase({
      funds: fundsBuilder,
      donors: donorsBuilder,
      donations: donationsBuilder,
      audit_log: auditBuilder,
    })
    mockCreateAdminClient.mockReturnValue(admin)

    await POST(makeRequest(validBody()))
    expect(auditInsertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'manual_donation',
        entity_type: 'donation',
        entity_id: 'don-1',
      })
    )
  })
})
