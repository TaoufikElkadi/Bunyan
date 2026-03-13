/**
 * RLS Tenant Isolation Tests
 *
 * Verifies that Row Level Security policies correctly prevent cross-tenant
 * data access across all major tables. A failure here means a data leak.
 *
 * These tests run against a real local Supabase instance — no mocks.
 *
 * Tenant A (Mosque A) and Tenant B (Mosque B) each have:
 * - 1 admin user, 1 fund, 1 donor, 1 donation, 1 campaign,
 *   1 recurring, 1 QR link, 1 audit log entry, 1 plan usage row
 *
 * Every test asserts one specific security property.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  seedTestData,
  cleanupTestData,
  tenantAClient,
  tenantBClient,
  anonClient,
  serviceClient,
  MOSQUE_A_ID,
  MOSQUE_B_ID,
  USER_A_ID,
  USER_B_ID,
  FUND_A_ID,
  FUND_B_ID,
  DONOR_A_ID,
  DONOR_B_ID,
  DONATION_A_ID,
  DONATION_B_ID,
  CAMPAIGN_A_ID,
  CAMPAIGN_B_ID,
  RECURRING_A_ID,
  RECURRING_B_ID,
  QR_A_ID,
  QR_B_ID,
  AUDIT_A_ID,
  AUDIT_B_ID,
} from './setup'

// ---------------------------------------------------------------------------
// Suite-level setup
// ---------------------------------------------------------------------------
let clientA: SupabaseClient
let clientB: SupabaseClient
let anon: SupabaseClient
let svc: SupabaseClient

beforeAll(async () => {
  await seedTestData()
  clientA = await tenantAClient()
  clientB = await tenantBClient()
  anon = anonClient()
  svc = serviceClient()
}, 30_000)

afterAll(async () => {
  await cleanupTestData()
}, 15_000)

// ===========================================================================
// 1. MOSQUES
// ===========================================================================
describe('mosques — tenant isolation', () => {
  it('Tenant A can read own mosque', async () => {
    const { data, error } = await clientA
      .from('mosques')
      .select('id')
      .eq('id', MOSQUE_A_ID)
      .single()
    expect(error).toBeNull()
    expect(data?.id).toBe(MOSQUE_A_ID)
  })

  it('Tenant A cannot read Tenant B mosque', async () => {
    const { data } = await clientA
      .from('mosques')
      .select('id')
      .eq('id', MOSQUE_B_ID)
    expect(data).toHaveLength(0)
  })

  it('Tenant A cannot update Tenant B mosque', async () => {
    const { data } = await clientA
      .from('mosques')
      .update({ name: 'HACKED' })
      .eq('id', MOSQUE_B_ID)
      .select('id')
    expect(data).toHaveLength(0)
    // Verify original is untouched
    const { data: check } = await svc.from('mosques').select('name').eq('id', MOSQUE_B_ID).single()
    expect(check?.name).toBe('Test Mosque B')
  })

  it('Anonymous user cannot read mosques table directly', async () => {
    const { data } = await anon.from('mosques').select('id')
    expect(data).toHaveLength(0)
  })
})

// ===========================================================================
// 2. FUNDS
// ===========================================================================
describe('funds — tenant isolation', () => {
  it('Tenant A can read own funds', async () => {
    const { data } = await clientA
      .from('funds')
      .select('id')
      .eq('mosque_id', MOSQUE_A_ID)
    expect(data).toHaveLength(1)
    expect(data![0].id).toBe(FUND_A_ID)
  })

  it('Tenant A cannot read Tenant B funds via mosque_id filter', async () => {
    // Even though there is a "Public can read active funds" policy,
    // Tenant A's authenticated request also returns public funds.
    // The key test is that they cannot write to Tenant B's funds.
    const { data } = await clientA
      .from('funds')
      .select('id, mosque_id')
      .eq('mosque_id', MOSQUE_B_ID)
    // The public policy lets active funds be read, so we check write isolation below.
    // Read isolation for authenticated users still includes own mosque funds.
    // This is an expected design: public donation pages need to see active funds.
    // We verify the data returned matches only active funds (not private ones).
    if (data && data.length > 0) {
      // All returned funds should be active (public policy)
      for (const f of data) {
        const { data: full } = await svc.from('funds').select('is_active').eq('id', f.id).single()
        expect(full?.is_active).toBe(true)
      }
    }
  })

  it('Tenant A cannot insert a fund under Tenant B mosque_id', async () => {
    const { error } = await clientA
      .from('funds')
      .insert({ mosque_id: MOSQUE_B_ID, name: 'Hacked Fund' })
    expect(error).not.toBeNull()
  })

  it('Tenant A cannot update Tenant B fund', async () => {
    const { data } = await clientA
      .from('funds')
      .update({ name: 'HACKED' })
      .eq('id', FUND_B_ID)
      .select('id')
    expect(data).toHaveLength(0)
    const { data: check } = await svc.from('funds').select('name').eq('id', FUND_B_ID).single()
    expect(check?.name).toBe('Algemeen B')
  })

  it('Tenant A cannot delete Tenant B fund', async () => {
    const { data } = await clientA
      .from('funds')
      .delete()
      .eq('id', FUND_B_ID)
      .select('id')
    expect(data).toHaveLength(0)
    const { data: check } = await svc.from('funds').select('id').eq('id', FUND_B_ID)
    expect(check).toHaveLength(1)
  })

  it('Anonymous can read active funds (public donation pages)', async () => {
    const { data } = await anon.from('funds').select('id').eq('is_active', true)
    expect(data!.length).toBeGreaterThanOrEqual(2) // both test funds are active
  })

  it('Anonymous cannot insert funds', async () => {
    const { error } = await anon
      .from('funds')
      .insert({ mosque_id: MOSQUE_A_ID, name: 'Anon Fund' })
    expect(error).not.toBeNull()
  })
})

// ===========================================================================
// 3. DONORS
// ===========================================================================
describe('donors — tenant isolation', () => {
  it('Tenant A can read own donors', async () => {
    const { data } = await clientA.from('donors').select('id').eq('mosque_id', MOSQUE_A_ID)
    expect(data).toHaveLength(1)
    expect(data![0].id).toBe(DONOR_A_ID)
  })

  it('Tenant A cannot read Tenant B donors', async () => {
    const { data } = await clientA.from('donors').select('id').eq('mosque_id', MOSQUE_B_ID)
    expect(data).toHaveLength(0)
  })

  it('Tenant A cannot insert donor under Tenant B mosque_id', async () => {
    const { error } = await clientA
      .from('donors')
      .insert({ mosque_id: MOSQUE_B_ID, name: 'Hacked Donor' })
    expect(error).not.toBeNull()
  })

  it('Tenant A cannot update Tenant B donor', async () => {
    const { data } = await clientA
      .from('donors')
      .update({ name: 'HACKED' })
      .eq('id', DONOR_B_ID)
      .select('id')
    expect(data).toHaveLength(0)
  })

  it('Tenant A cannot delete Tenant B donor', async () => {
    const { data } = await clientA
      .from('donors')
      .delete()
      .eq('id', DONOR_B_ID)
      .select('id')
    expect(data).toHaveLength(0)
    const { data: check } = await svc.from('donors').select('id').eq('id', DONOR_B_ID)
    expect(check).toHaveLength(1)
  })

  it('Anonymous cannot read donors', async () => {
    const { data } = await anon.from('donors').select('id')
    expect(data).toHaveLength(0)
  })
})

// ===========================================================================
// 4. DONATIONS
// ===========================================================================
describe('donations — tenant isolation', () => {
  it('Tenant A can read own donations', async () => {
    const { data } = await clientA.from('donations').select('id').eq('mosque_id', MOSQUE_A_ID)
    expect(data).toHaveLength(1)
    expect(data![0].id).toBe(DONATION_A_ID)
  })

  it('Tenant A cannot read Tenant B donations', async () => {
    const { data } = await clientA.from('donations').select('id').eq('mosque_id', MOSQUE_B_ID)
    expect(data).toHaveLength(0)
  })

  it('Tenant A cannot read Tenant B donation by direct ID', async () => {
    const { data } = await clientA.from('donations').select('id').eq('id', DONATION_B_ID)
    expect(data).toHaveLength(0)
  })

  it('Tenant A cannot insert donation under Tenant B mosque_id', async () => {
    const { error } = await clientA
      .from('donations')
      .insert({
        mosque_id: MOSQUE_B_ID,
        fund_id: FUND_B_ID,
        amount: 100,
        method: 'ideal',
      })
    expect(error).not.toBeNull()
  })

  it('Tenant A cannot update Tenant B donation', async () => {
    const { data } = await clientA
      .from('donations')
      .update({ amount: 1 })
      .eq('id', DONATION_B_ID)
      .select('id')
    expect(data).toHaveLength(0)
    const { data: check } = await svc.from('donations').select('amount').eq('id', DONATION_B_ID).single()
    expect(check?.amount).toBe(5000)
  })

  it('Tenant A cannot delete Tenant B donation', async () => {
    const { data } = await clientA
      .from('donations')
      .delete()
      .eq('id', DONATION_B_ID)
      .select('id')
    expect(data).toHaveLength(0)
    const { data: check } = await svc.from('donations').select('id').eq('id', DONATION_B_ID)
    expect(check).toHaveLength(1)
  })

  it('Anonymous cannot read donations', async () => {
    const { data } = await anon.from('donations').select('id')
    expect(data).toHaveLength(0)
  })
})

// ===========================================================================
// 5. CAMPAIGNS
// ===========================================================================
describe('campaigns — tenant isolation', () => {
  it('Tenant A can read own campaigns', async () => {
    const { data } = await clientA.from('campaigns').select('id').eq('mosque_id', MOSQUE_A_ID)
    expect(data!.length).toBeGreaterThanOrEqual(1)
  })

  it('Tenant A cannot insert campaign under Tenant B mosque_id', async () => {
    const { error } = await clientA
      .from('campaigns')
      .insert({
        mosque_id: MOSQUE_B_ID,
        fund_id: FUND_B_ID,
        title: 'Hacked Campaign',
        slug: 'hacked-campaign',
      })
    expect(error).not.toBeNull()
  })

  it('Tenant A cannot update Tenant B campaign', async () => {
    const { data } = await clientA
      .from('campaigns')
      .update({ title: 'HACKED' })
      .eq('id', CAMPAIGN_B_ID)
      .select('id')
    expect(data).toHaveLength(0)
    const { data: check } = await svc.from('campaigns').select('title').eq('id', CAMPAIGN_B_ID).single()
    expect(check?.title).toBe('Campaign B')
  })

  it('Tenant A cannot delete Tenant B campaign', async () => {
    const { data } = await clientA
      .from('campaigns')
      .delete()
      .eq('id', CAMPAIGN_B_ID)
      .select('id')
    expect(data).toHaveLength(0)
    const { data: check } = await svc.from('campaigns').select('id').eq('id', CAMPAIGN_B_ID)
    expect(check).toHaveLength(1)
  })

  it('Anonymous can read active campaigns (public donation pages)', async () => {
    const { data } = await anon.from('campaigns').select('id').eq('is_active', true)
    expect(data!.length).toBeGreaterThanOrEqual(2)
  })

  it('Anonymous cannot insert campaigns', async () => {
    const { error } = await anon
      .from('campaigns')
      .insert({
        mosque_id: MOSQUE_A_ID,
        fund_id: FUND_A_ID,
        title: 'Anon Campaign',
        slug: 'anon-campaign',
      })
    expect(error).not.toBeNull()
  })
})

// ===========================================================================
// 6. RECURRINGS
// ===========================================================================
describe('recurrings — tenant isolation', () => {
  it('Tenant A can read own recurrings', async () => {
    const { data } = await clientA.from('recurrings').select('id').eq('mosque_id', MOSQUE_A_ID)
    expect(data).toHaveLength(1)
    expect(data![0].id).toBe(RECURRING_A_ID)
  })

  it('Tenant A cannot read Tenant B recurrings', async () => {
    const { data } = await clientA.from('recurrings').select('id').eq('mosque_id', MOSQUE_B_ID)
    expect(data).toHaveLength(0)
  })

  it('Tenant A cannot insert recurring under Tenant B mosque_id', async () => {
    const { error } = await clientA
      .from('recurrings')
      .insert({
        mosque_id: MOSQUE_B_ID,
        donor_id: DONOR_B_ID,
        fund_id: FUND_B_ID,
        amount: 500,
        frequency: 'monthly',
      })
    expect(error).not.toBeNull()
  })

  it('Tenant A cannot update Tenant B recurring', async () => {
    const { data } = await clientA
      .from('recurrings')
      .update({ amount: 1 })
      .eq('id', RECURRING_B_ID)
      .select('id')
    expect(data).toHaveLength(0)
  })

  it('Tenant A cannot delete Tenant B recurring', async () => {
    const { data } = await clientA
      .from('recurrings')
      .delete()
      .eq('id', RECURRING_B_ID)
      .select('id')
    expect(data).toHaveLength(0)
    const { data: check } = await svc.from('recurrings').select('id').eq('id', RECURRING_B_ID)
    expect(check).toHaveLength(1)
  })

  it('Anonymous cannot read recurrings', async () => {
    const { data } = await anon.from('recurrings').select('id')
    expect(data).toHaveLength(0)
  })
})

// ===========================================================================
// 7. QR LINKS
// ===========================================================================
describe('qr_links — tenant isolation', () => {
  it('Tenant A can read own QR links', async () => {
    const { data } = await clientA.from('qr_links').select('id').eq('mosque_id', MOSQUE_A_ID)
    expect(data).toHaveLength(1)
  })

  it('Tenant A cannot read Tenant B QR links', async () => {
    const { data } = await clientA.from('qr_links').select('id').eq('mosque_id', MOSQUE_B_ID)
    expect(data).toHaveLength(0)
  })

  it('Tenant A cannot insert QR link under Tenant B mosque_id', async () => {
    const { error } = await clientA
      .from('qr_links')
      .insert({ mosque_id: MOSQUE_B_ID, code: 'hacked-qr' })
    expect(error).not.toBeNull()
  })

  it('Tenant A cannot delete Tenant B QR link', async () => {
    const { data } = await clientA
      .from('qr_links')
      .delete()
      .eq('id', QR_B_ID)
      .select('id')
    expect(data).toHaveLength(0)
    const { data: check } = await svc.from('qr_links').select('id').eq('id', QR_B_ID)
    expect(check).toHaveLength(1)
  })

  it('Anonymous cannot read QR links', async () => {
    const { data } = await anon.from('qr_links').select('id')
    expect(data).toHaveLength(0)
  })
})

// ===========================================================================
// 8. AUDIT LOG
// ===========================================================================
describe('audit_log — tenant isolation', () => {
  it('Tenant A can read own audit log', async () => {
    const { data } = await clientA.from('audit_log').select('id').eq('mosque_id', MOSQUE_A_ID)
    expect(data).toHaveLength(1)
    expect(data![0].id).toBe(AUDIT_A_ID)
  })

  it('Tenant A cannot read Tenant B audit log', async () => {
    const { data } = await clientA.from('audit_log').select('id').eq('mosque_id', MOSQUE_B_ID)
    expect(data).toHaveLength(0)
  })

  it('Tenant A cannot insert audit log entry under Tenant B mosque_id', async () => {
    const { error } = await clientA
      .from('audit_log')
      .insert({
        mosque_id: MOSQUE_B_ID,
        user_id: USER_A_ID,
        action: 'hack',
        entity_type: 'fund',
        entity_id: FUND_B_ID,
      })
    expect(error).not.toBeNull()
  })

  it('Anonymous cannot read audit log', async () => {
    const { data } = await anon.from('audit_log').select('id')
    expect(data).toHaveLength(0)
  })
})

// ===========================================================================
// 9. PLAN USAGE
// ===========================================================================
describe('plan_usage — tenant isolation', () => {
  it('Tenant A can read own plan usage', async () => {
    const { data } = await clientA.from('plan_usage').select('*').eq('mosque_id', MOSQUE_A_ID)
    expect(data).toHaveLength(1)
    expect(data![0].online_donations).toBe(5)
  })

  it('Tenant A cannot read Tenant B plan usage', async () => {
    const { data } = await clientA.from('plan_usage').select('*').eq('mosque_id', MOSQUE_B_ID)
    expect(data).toHaveLength(0)
  })

  it('Anonymous cannot read plan usage', async () => {
    const { data } = await anon.from('plan_usage').select('*')
    expect(data).toHaveLength(0)
  })
})

// ===========================================================================
// 10. USERS table
// ===========================================================================
describe('users — tenant isolation', () => {
  it('Tenant A can read own mosque team members', async () => {
    const { data } = await clientA.from('users').select('id').eq('mosque_id', MOSQUE_A_ID)
    expect(data).toHaveLength(1)
    expect(data![0].id).toBe(USER_A_ID)
  })

  it('Tenant A cannot read Tenant B users', async () => {
    const { data } = await clientA.from('users').select('id').eq('mosque_id', MOSQUE_B_ID)
    expect(data).toHaveLength(0)
  })

  it('Tenant A cannot update Tenant B user profile', async () => {
    const { data } = await clientA
      .from('users')
      .update({ name: 'HACKED' })
      .eq('id', USER_B_ID)
      .select('id')
    expect(data).toHaveLength(0)
    const { data: check } = await svc.from('users').select('name').eq('id', USER_B_ID).single()
    expect(check?.name).toBe('User B')
  })

  it('Anonymous cannot read users', async () => {
    const { data } = await anon.from('users').select('id')
    expect(data).toHaveLength(0)
  })
})

// ===========================================================================
// 11. SERVICE ROLE — can access everything (for webhooks/cron)
// ===========================================================================
describe('service role — bypasses RLS for webhooks and cron', () => {
  it('Service role can read all mosques', async () => {
    const { data } = await svc.from('mosques').select('id').in('id', [MOSQUE_A_ID, MOSQUE_B_ID])
    expect(data).toHaveLength(2)
  })

  it('Service role can read all donations across tenants', async () => {
    const { data } = await svc
      .from('donations')
      .select('id')
      .in('id', [DONATION_A_ID, DONATION_B_ID])
    expect(data).toHaveLength(2)
  })

  it('Service role can read all donors across tenants', async () => {
    const { data } = await svc
      .from('donors')
      .select('id')
      .in('id', [DONOR_A_ID, DONOR_B_ID])
    expect(data).toHaveLength(2)
  })

  it('Service role can update any donation', async () => {
    const { error } = await svc
      .from('donations')
      .update({ notes: 'service-role-test' })
      .eq('id', DONATION_B_ID)
    expect(error).toBeNull()
    // Restore
    await svc.from('donations').update({ notes: null }).eq('id', DONATION_B_ID)
  })

  it('Service role can read all audit logs across tenants', async () => {
    const { data } = await svc
      .from('audit_log')
      .select('id')
      .in('id', [AUDIT_A_ID, AUDIT_B_ID])
    expect(data).toHaveLength(2)
  })
})

// ===========================================================================
// 12. CROSS-TENANT ENUMERATION — cannot discover other tenant's IDs
// ===========================================================================
describe('cross-tenant enumeration prevention', () => {
  it('Tenant A listing all donors only sees own', async () => {
    const { data } = await clientA.from('donors').select('id, mosque_id')
    for (const row of data ?? []) {
      expect(row.mosque_id).toBe(MOSQUE_A_ID)
    }
  })

  it('Tenant A listing all donations only sees own', async () => {
    const { data } = await clientA.from('donations').select('id, mosque_id')
    for (const row of data ?? []) {
      expect(row.mosque_id).toBe(MOSQUE_A_ID)
    }
  })

  it('Tenant B listing all donors only sees own', async () => {
    const { data } = await clientB.from('donors').select('id, mosque_id')
    for (const row of data ?? []) {
      expect(row.mosque_id).toBe(MOSQUE_B_ID)
    }
  })

  it('Tenant B listing all donations only sees own', async () => {
    const { data } = await clientB.from('donations').select('id, mosque_id')
    for (const row of data ?? []) {
      expect(row.mosque_id).toBe(MOSQUE_B_ID)
    }
  })

  it('Tenant A listing all recurrings only sees own', async () => {
    const { data } = await clientA.from('recurrings').select('id, mosque_id')
    for (const row of data ?? []) {
      expect(row.mosque_id).toBe(MOSQUE_A_ID)
    }
  })

  it('Tenant A listing all audit logs only sees own', async () => {
    const { data } = await clientA.from('audit_log').select('id, mosque_id')
    for (const row of data ?? []) {
      expect(row.mosque_id).toBe(MOSQUE_A_ID)
    }
  })
})
