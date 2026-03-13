import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockQueryBuilder, createRoutedMockSupabase } from '../helpers/mock-supabase'

// ---------- Mocks ----------

vi.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
  },
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

// Import after mocks are registered
import { POST } from '@/app/api/webhooks/stripe/route'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

const mockConstructEvent = stripe.webhooks.constructEvent as ReturnType<typeof vi.fn>
const mockCreateAdminClient = createAdminClient as ReturnType<typeof vi.fn>

// ---------- Helpers ----------

function makeRequest(body = 'raw-body') {
  return new Request('http://localhost/api/webhooks/stripe', {
    method: 'POST',
    headers: { 'stripe-signature': 'sig_test' },
    body,
  })
}

function makeEvent(type: string, dataObject: any) {
  return { type, data: { object: dataObject } }
}

// ---------- Tests ----------

describe('Stripe Webhook POST handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ---- Signature verification ----

  it('returns 400 when stripe-signature header is missing', async () => {
    const req = new Request('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      body: 'body',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Missing signature')
  })

  it('returns 400 when signature verification fails', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('Invalid signature')
    })
    const res = await POST(makeRequest())
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Invalid signature')
  })

  // ---- payment_intent.succeeded ----

  describe('payment_intent.succeeded', () => {
    const piId = 'pi_test_123'

    it('marks a pending donation as completed', async () => {
      const donationsBuilder = createMockQueryBuilder({
        data: { id: 'don-1', status: 'pending' },
        error: null,
      })
      // update().eq() should resolve with no error
      donationsBuilder.update.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })

      const admin = createRoutedMockSupabase({ donations: donationsBuilder })
      admin.rpc = vi.fn().mockResolvedValue({ error: null })
      mockCreateAdminClient.mockReturnValue(admin)

      mockConstructEvent.mockReturnValue(
        makeEvent('payment_intent.succeeded', {
          id: piId,
          metadata: { mosque_id: 'mosque-1' },
        })
      )

      const res = await POST(makeRequest())
      expect(res.status).toBe(200)
      expect(donationsBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'completed' })
      )
    })

    it('skips update when donation is already completed (idempotency)', async () => {
      const donationsBuilder = createMockQueryBuilder({
        data: { id: 'don-1', status: 'completed' },
        error: null,
      })
      const admin = createRoutedMockSupabase({ donations: donationsBuilder })
      admin.rpc = vi.fn().mockResolvedValue({ error: null })
      mockCreateAdminClient.mockReturnValue(admin)

      mockConstructEvent.mockReturnValue(
        makeEvent('payment_intent.succeeded', {
          id: piId,
          metadata: {},
        })
      )

      const res = await POST(makeRequest())
      expect(res.status).toBe(200)
      expect(donationsBuilder.update).not.toHaveBeenCalled()
    })

    it('logs error and does not throw when donation is not found', async () => {
      const donationsBuilder = createMockQueryBuilder({ data: null, error: null })
      const admin = createRoutedMockSupabase({ donations: donationsBuilder })
      admin.rpc = vi.fn().mockResolvedValue({ error: null })
      mockCreateAdminClient.mockReturnValue(admin)

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      mockConstructEvent.mockReturnValue(
        makeEvent('payment_intent.succeeded', {
          id: 'pi_nonexistent',
          metadata: {},
        })
      )

      const res = await POST(makeRequest())
      expect(res.status).toBe(200)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('pi_nonexistent')
      )
      consoleSpy.mockRestore()
    })

    it('increments plan usage when mosque_id is in metadata', async () => {
      const donationsBuilder = createMockQueryBuilder({
        data: { id: 'don-1', status: 'pending' },
        error: null,
      })
      donationsBuilder.update.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })

      const admin = createRoutedMockSupabase({ donations: donationsBuilder })
      admin.rpc = vi.fn().mockResolvedValue({ error: null })
      mockCreateAdminClient.mockReturnValue(admin)

      mockConstructEvent.mockReturnValue(
        makeEvent('payment_intent.succeeded', {
          id: piId,
          metadata: { mosque_id: 'mosque-42' },
        })
      )

      const res = await POST(makeRequest())
      expect(res.status).toBe(200)
      expect(admin.rpc).toHaveBeenCalledWith('increment_plan_usage', {
        p_mosque_id: 'mosque-42',
        p_month: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      })
    })

    it('does not call rpc when mosque_id is missing from metadata', async () => {
      const donationsBuilder = createMockQueryBuilder({
        data: { id: 'don-1', status: 'pending' },
        error: null,
      })
      donationsBuilder.update.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })

      const admin = createRoutedMockSupabase({ donations: donationsBuilder })
      admin.rpc = vi.fn().mockResolvedValue({ error: null })
      mockCreateAdminClient.mockReturnValue(admin)

      mockConstructEvent.mockReturnValue(
        makeEvent('payment_intent.succeeded', {
          id: piId,
          metadata: {},
        })
      )

      const res = await POST(makeRequest())
      expect(res.status).toBe(200)
      expect(admin.rpc).not.toHaveBeenCalled()
    })
  })

  // ---- payment_intent.payment_failed ----

  describe('payment_intent.payment_failed', () => {
    const piId = 'pi_fail_123'

    it('marks a pending donation as failed', async () => {
      const donationsBuilder = createMockQueryBuilder({
        data: { id: 'don-2', status: 'pending' },
        error: null,
      })
      donationsBuilder.update.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })

      const admin = createRoutedMockSupabase({ donations: donationsBuilder })
      mockCreateAdminClient.mockReturnValue(admin)

      mockConstructEvent.mockReturnValue(
        makeEvent('payment_intent.payment_failed', { id: piId })
      )

      const res = await POST(makeRequest())
      expect(res.status).toBe(200)
      expect(donationsBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'failed' })
      )
    })

    it('skips update when donation is already failed (idempotency)', async () => {
      const donationsBuilder = createMockQueryBuilder({
        data: { id: 'don-2', status: 'failed' },
        error: null,
      })

      const admin = createRoutedMockSupabase({ donations: donationsBuilder })
      mockCreateAdminClient.mockReturnValue(admin)

      mockConstructEvent.mockReturnValue(
        makeEvent('payment_intent.payment_failed', { id: piId })
      )

      const res = await POST(makeRequest())
      expect(res.status).toBe(200)
      expect(donationsBuilder.update).not.toHaveBeenCalled()
    })

    it('does nothing when donation is not found', async () => {
      const donationsBuilder = createMockQueryBuilder({ data: null, error: null })
      const admin = createRoutedMockSupabase({ donations: donationsBuilder })
      mockCreateAdminClient.mockReturnValue(admin)

      mockConstructEvent.mockReturnValue(
        makeEvent('payment_intent.payment_failed', { id: 'pi_ghost' })
      )

      const res = await POST(makeRequest())
      expect(res.status).toBe(200)
      expect(donationsBuilder.update).not.toHaveBeenCalled()
    })
  })

  // ---- invoice.payment_succeeded ----

  describe('invoice.payment_succeeded', () => {
    const subId = 'sub_recurring_1'
    const invoiceId = 'in_test_123'

    function makeInvoice(overrides: any = {}) {
      return {
        id: invoiceId,
        parent: {
          subscription_details: {
            subscription: subId,
          },
        },
        ...overrides,
      }
    }

    it('creates a new donation for a valid recurring subscription', async () => {
      const recurringsBuilder = createMockQueryBuilder({
        data: {
          id: 'rec-1',
          mosque_id: 'mosque-1',
          donor_id: 'donor-1',
          fund_id: 'fund-1',
          amount: 2500,
          frequency: 'monthly',
        },
        error: null,
      })

      // For idempotency check on donations (no existing donation)
      const donationsBuilder = createMockQueryBuilder({ data: null, error: null })
      // insert().select() not needed for donations insert — it resolves directly
      // But the handler calls insert without .select().single()
      donationsBuilder.insert.mockReturnValue(
        Promise.resolve({ error: null })
      )

      // For recurrings update
      recurringsBuilder.update.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })

      const admin = createRoutedMockSupabase({
        recurrings: recurringsBuilder,
        donations: donationsBuilder,
      })
      admin.rpc = vi.fn().mockResolvedValue({ error: null })
      mockCreateAdminClient.mockReturnValue(admin)

      mockConstructEvent.mockReturnValue(
        makeEvent('invoice.payment_succeeded', makeInvoice())
      )

      const res = await POST(makeRequest())
      expect(res.status).toBe(200)

      // Check that from('donations') was called
      expect(admin.from).toHaveBeenCalledWith('donations')
    })

    it('skips when donation for this invoice already exists (idempotency)', async () => {
      const recurringsBuilder = createMockQueryBuilder({
        data: {
          id: 'rec-1',
          mosque_id: 'mosque-1',
          donor_id: 'donor-1',
          fund_id: 'fund-1',
          amount: 2500,
          frequency: 'monthly',
        },
        error: null,
      })

      // Existing donation found for idempotency check
      const donationsBuilder = createMockQueryBuilder({
        data: { id: 'existing-don' },
        error: null,
      })

      const admin = createRoutedMockSupabase({
        recurrings: recurringsBuilder,
        donations: donationsBuilder,
      })
      admin.rpc = vi.fn().mockResolvedValue({ error: null })
      mockCreateAdminClient.mockReturnValue(admin)

      mockConstructEvent.mockReturnValue(
        makeEvent('invoice.payment_succeeded', makeInvoice())
      )

      const res = await POST(makeRequest())
      expect(res.status).toBe(200)
      // insert should NOT be called since donation already exists
      expect(donationsBuilder.insert).not.toHaveBeenCalled()
    })

    it('does nothing when subscription is not found in recurrings', async () => {
      const recurringsBuilder = createMockQueryBuilder({ data: null, error: null })
      const admin = createRoutedMockSupabase({ recurrings: recurringsBuilder })
      admin.rpc = vi.fn().mockResolvedValue({ error: null })
      mockCreateAdminClient.mockReturnValue(admin)

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      mockConstructEvent.mockReturnValue(
        makeEvent('invoice.payment_succeeded', makeInvoice())
      )

      const res = await POST(makeRequest())
      expect(res.status).toBe(200)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(subId)
      )
      consoleSpy.mockRestore()
    })

    it('does nothing when invoice has no subscription details', async () => {
      const admin = createRoutedMockSupabase({})
      admin.rpc = vi.fn().mockResolvedValue({ error: null })
      mockCreateAdminClient.mockReturnValue(admin)

      mockConstructEvent.mockReturnValue(
        makeEvent('invoice.payment_succeeded', {
          id: invoiceId,
          parent: null,
        })
      )

      const res = await POST(makeRequest())
      expect(res.status).toBe(200)
      expect(admin.from).not.toHaveBeenCalled()
    })
  })

  // ---- customer.subscription.deleted ----

  describe('customer.subscription.deleted', () => {
    const subId = 'sub_cancel_1'

    it('marks an active recurring as cancelled', async () => {
      const recurringsBuilder = createMockQueryBuilder({
        data: { id: 'rec-2', status: 'active' },
        error: null,
      })
      recurringsBuilder.update.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })

      const admin = createRoutedMockSupabase({ recurrings: recurringsBuilder })
      mockCreateAdminClient.mockReturnValue(admin)

      mockConstructEvent.mockReturnValue(
        makeEvent('customer.subscription.deleted', { id: subId })
      )

      const res = await POST(makeRequest())
      expect(res.status).toBe(200)
      expect(recurringsBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'cancelled' })
      )
    })

    it('skips update when recurring is already cancelled (idempotency)', async () => {
      const recurringsBuilder = createMockQueryBuilder({
        data: { id: 'rec-2', status: 'cancelled' },
        error: null,
      })

      const admin = createRoutedMockSupabase({ recurrings: recurringsBuilder })
      mockCreateAdminClient.mockReturnValue(admin)

      mockConstructEvent.mockReturnValue(
        makeEvent('customer.subscription.deleted', { id: subId })
      )

      const res = await POST(makeRequest())
      expect(res.status).toBe(200)
      expect(recurringsBuilder.update).not.toHaveBeenCalled()
    })

    it('does nothing when recurring is not found', async () => {
      const recurringsBuilder = createMockQueryBuilder({ data: null, error: null })
      const admin = createRoutedMockSupabase({ recurrings: recurringsBuilder })
      mockCreateAdminClient.mockReturnValue(admin)

      mockConstructEvent.mockReturnValue(
        makeEvent('customer.subscription.deleted', { id: 'sub_ghost' })
      )

      const res = await POST(makeRequest())
      expect(res.status).toBe(200)
      expect(recurringsBuilder.update).not.toHaveBeenCalled()
    })
  })

  // ---- Unknown event type ----

  it('returns 200 for unknown event types', async () => {
    const admin = createRoutedMockSupabase({})
    mockCreateAdminClient.mockReturnValue(admin)

    mockConstructEvent.mockReturnValue(
      makeEvent('charge.refunded', { id: 'ch_123' })
    )

    const res = await POST(makeRequest())
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.received).toBe(true)
  })
})
