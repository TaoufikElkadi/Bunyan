/**
 * Shared test helper for RLS integration tests.
 *
 * Creates two tenants (mosques) with one admin user each, plus provides
 * helpers for creating authenticated and anonymous Supabase clients.
 *
 * Requires a running local Supabase instance (supabase start).
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Local Supabase defaults (safe to hardcode — these are well-known dev keys)
// ---------------------------------------------------------------------------
const SUPABASE_URL = 'http://127.0.0.1:54321'
// The default anon key for local Supabase — public, not a secret
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
// The default service_role key for local Supabase — bypasses RLS
const SUPABASE_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

// ---------------------------------------------------------------------------
// Fixed UUIDs for deterministic test data
// ---------------------------------------------------------------------------
export const MOSQUE_A_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
export const MOSQUE_B_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
export const USER_A_ID = 'aaaaaaaa-0000-0000-0000-000000000001'
export const USER_B_ID = 'bbbbbbbb-0000-0000-0000-000000000001'
export const FUND_A_ID = 'aaaaaaaa-0000-0000-0000-f00000000001'
export const FUND_B_ID = 'bbbbbbbb-0000-0000-0000-f00000000001'
export const DONOR_A_ID = 'aaaaaaaa-0000-0000-0000-d00000000001'
export const DONOR_B_ID = 'bbbbbbbb-0000-0000-0000-d00000000001'
export const DONATION_A_ID = 'aaaaaaaa-0000-0000-0000-d00a00000001'
export const DONATION_B_ID = 'bbbbbbbb-0000-0000-0000-d00a00000001'
export const CAMPAIGN_A_ID = 'aaaaaaaa-0000-0000-0000-ca0000000001'
export const CAMPAIGN_B_ID = 'bbbbbbbb-0000-0000-0000-ca0000000001'
export const RECURRING_A_ID = 'aaaaaaaa-0000-0000-0000-rec000000001'
export const RECURRING_B_ID = 'bbbbbbbb-0000-0000-0000-rec000000001'
export const QR_A_ID = 'aaaaaaaa-0000-0000-0000-0q0000000001'
export const QR_B_ID = 'bbbbbbbb-0000-0000-0000-0q0000000001'
export const AUDIT_A_ID = 'aaaaaaaa-0000-0000-0000-aud000000001'
export const AUDIT_B_ID = 'bbbbbbbb-0000-0000-0000-aud000000001'

const USER_A_EMAIL = 'rls-test-a@bunyan.test'
const USER_B_EMAIL = 'rls-test-b@bunyan.test'
const TEST_PASSWORD = 'TestPassword123!'

// ---------------------------------------------------------------------------
// Client factories
// ---------------------------------------------------------------------------

/** Service-role client — bypasses RLS. Used for setup/teardown and assertions. */
export function serviceClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/** Anonymous client — uses anon key, no login. */
export function anonClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/** Authenticated client for a specific test user. */
export async function authedClient(
  email: string,
  password: string
): Promise<SupabaseClient> {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) {
    throw new Error(`Failed to sign in as ${email}: ${error.message}`)
  }
  return client
}

/** Convenience: authenticated client for Tenant A's admin. */
export async function tenantAClient(): Promise<SupabaseClient> {
  return authedClient(USER_A_EMAIL, TEST_PASSWORD)
}

/** Convenience: authenticated client for Tenant B's admin. */
export async function tenantBClient(): Promise<SupabaseClient> {
  return authedClient(USER_B_EMAIL, TEST_PASSWORD)
}

// ---------------------------------------------------------------------------
// Global setup: seed two isolated tenants with test data
// ---------------------------------------------------------------------------

export async function seedTestData(): Promise<void> {
  const svc = serviceClient()

  // Clean up any previous test data (in reverse dependency order)
  await svc.from('audit_log').delete().in('mosque_id', [MOSQUE_A_ID, MOSQUE_B_ID])
  await svc.from('anbi_receipts').delete().in('mosque_id', [MOSQUE_A_ID, MOSQUE_B_ID])
  await svc.from('qr_links').delete().in('mosque_id', [MOSQUE_A_ID, MOSQUE_B_ID])
  await svc.from('donations').delete().in('mosque_id', [MOSQUE_A_ID, MOSQUE_B_ID])
  await svc.from('recurrings').delete().in('mosque_id', [MOSQUE_A_ID, MOSQUE_B_ID])
  await svc.from('campaigns').delete().in('mosque_id', [MOSQUE_A_ID, MOSQUE_B_ID])
  await svc.from('donors').delete().in('mosque_id', [MOSQUE_A_ID, MOSQUE_B_ID])
  await svc.from('funds').delete().in('mosque_id', [MOSQUE_A_ID, MOSQUE_B_ID])
  await svc.from('plan_usage').delete().in('mosque_id', [MOSQUE_A_ID, MOSQUE_B_ID])
  await svc.from('users').delete().in('mosque_id', [MOSQUE_A_ID, MOSQUE_B_ID])
  await svc.from('mosques').delete().in('id', [MOSQUE_A_ID, MOSQUE_B_ID])

  // Delete auth users if they exist
  await svc.auth.admin.deleteUser(USER_A_ID).catch(() => {})
  await svc.auth.admin.deleteUser(USER_B_ID).catch(() => {})

  // ------ Mosques ------
  await insertOrThrow(svc, 'mosques', [
    { id: MOSQUE_A_ID, name: 'Test Mosque A', slug: 'test-mosque-a', city: 'Amsterdam', plan: 'free' },
    { id: MOSQUE_B_ID, name: 'Test Mosque B', slug: 'test-mosque-b', city: 'Rotterdam', plan: 'free' },
  ])

  // ------ Auth users ------
  await createAuthUser(svc, USER_A_ID, USER_A_EMAIL, 'User A')
  await createAuthUser(svc, USER_B_ID, USER_B_EMAIL, 'User B')

  // ------ Public users table (links auth.users → mosque) ------
  await insertOrThrow(svc, 'users', [
    { id: USER_A_ID, mosque_id: MOSQUE_A_ID, name: 'User A', email: USER_A_EMAIL, role: 'admin' },
    { id: USER_B_ID, mosque_id: MOSQUE_B_ID, name: 'User B', email: USER_B_EMAIL, role: 'admin' },
  ])

  // ------ Funds ------
  await insertOrThrow(svc, 'funds', [
    { id: FUND_A_ID, mosque_id: MOSQUE_A_ID, name: 'Algemeen A', is_active: true },
    { id: FUND_B_ID, mosque_id: MOSQUE_B_ID, name: 'Algemeen B', is_active: true },
  ])

  // ------ Donors ------
  await insertOrThrow(svc, 'donors', [
    { id: DONOR_A_ID, mosque_id: MOSQUE_A_ID, name: 'Donor A', email: 'donor-a@test.nl' },
    { id: DONOR_B_ID, mosque_id: MOSQUE_B_ID, name: 'Donor B', email: 'donor-b@test.nl' },
  ])

  // ------ Campaigns ------
  await insertOrThrow(svc, 'campaigns', [
    { id: CAMPAIGN_A_ID, mosque_id: MOSQUE_A_ID, fund_id: FUND_A_ID, title: 'Campaign A', slug: 'campaign-a', is_active: true },
    { id: CAMPAIGN_B_ID, mosque_id: MOSQUE_B_ID, fund_id: FUND_B_ID, title: 'Campaign B', slug: 'campaign-b', is_active: true },
  ])

  // ------ Recurrings ------
  await insertOrThrow(svc, 'recurrings', [
    { id: RECURRING_A_ID, mosque_id: MOSQUE_A_ID, donor_id: DONOR_A_ID, fund_id: FUND_A_ID, amount: 1000, frequency: 'monthly' },
    { id: RECURRING_B_ID, mosque_id: MOSQUE_B_ID, donor_id: DONOR_B_ID, fund_id: FUND_B_ID, amount: 2000, frequency: 'monthly' },
  ])

  // ------ Donations ------
  await insertOrThrow(svc, 'donations', [
    { id: DONATION_A_ID, mosque_id: MOSQUE_A_ID, donor_id: DONOR_A_ID, fund_id: FUND_A_ID, amount: 2500, method: 'ideal', status: 'completed' },
    { id: DONATION_B_ID, mosque_id: MOSQUE_B_ID, donor_id: DONOR_B_ID, fund_id: FUND_B_ID, amount: 5000, method: 'ideal', status: 'completed' },
  ])

  // ------ QR links ------
  await insertOrThrow(svc, 'qr_links', [
    { id: QR_A_ID, mosque_id: MOSQUE_A_ID, code: 'rls-test-qr-a', fund_id: FUND_A_ID },
    { id: QR_B_ID, mosque_id: MOSQUE_B_ID, code: 'rls-test-qr-b', fund_id: FUND_B_ID },
  ])

  // ------ Audit log ------
  await insertOrThrow(svc, 'audit_log', [
    { id: AUDIT_A_ID, mosque_id: MOSQUE_A_ID, user_id: USER_A_ID, action: 'create', entity_type: 'fund', entity_id: FUND_A_ID },
    { id: AUDIT_B_ID, mosque_id: MOSQUE_B_ID, user_id: USER_B_ID, action: 'create', entity_type: 'fund', entity_id: FUND_B_ID },
  ])

  // ------ Plan usage ------
  await insertOrThrow(svc, 'plan_usage', [
    { mosque_id: MOSQUE_A_ID, month: '2026-03-01', online_donations: 5 },
    { mosque_id: MOSQUE_B_ID, month: '2026-03-01', online_donations: 10 },
  ])
}

export async function cleanupTestData(): Promise<void> {
  const svc = serviceClient()

  await svc.from('audit_log').delete().in('mosque_id', [MOSQUE_A_ID, MOSQUE_B_ID])
  await svc.from('anbi_receipts').delete().in('mosque_id', [MOSQUE_A_ID, MOSQUE_B_ID])
  await svc.from('qr_links').delete().in('mosque_id', [MOSQUE_A_ID, MOSQUE_B_ID])
  await svc.from('donations').delete().in('mosque_id', [MOSQUE_A_ID, MOSQUE_B_ID])
  await svc.from('recurrings').delete().in('mosque_id', [MOSQUE_A_ID, MOSQUE_B_ID])
  await svc.from('campaigns').delete().in('mosque_id', [MOSQUE_A_ID, MOSQUE_B_ID])
  await svc.from('donors').delete().in('mosque_id', [MOSQUE_A_ID, MOSQUE_B_ID])
  await svc.from('funds').delete().in('mosque_id', [MOSQUE_A_ID, MOSQUE_B_ID])
  await svc.from('plan_usage').delete().in('mosque_id', [MOSQUE_A_ID, MOSQUE_B_ID])
  await svc.from('users').delete().in('mosque_id', [MOSQUE_A_ID, MOSQUE_B_ID])
  await svc.from('mosques').delete().in('id', [MOSQUE_A_ID, MOSQUE_B_ID])

  await svc.auth.admin.deleteUser(USER_A_ID).catch(() => {})
  await svc.auth.admin.deleteUser(USER_B_ID).catch(() => {})
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function createAuthUser(
  svc: SupabaseClient,
  id: string,
  email: string,
  name: string
): Promise<void> {
  const { error } = await svc.auth.admin.createUser({
    id,
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: { name },
  })
  if (error) throw new Error(`Failed to create auth user ${email}: ${error.message}`)
}

async function insertOrThrow(
  svc: SupabaseClient,
  table: string,
  rows: Record<string, unknown>[]
): Promise<void> {
  const { error } = await svc.from(table).insert(rows)
  if (error) throw new Error(`Failed to seed ${table}: ${error.message}`)
}
