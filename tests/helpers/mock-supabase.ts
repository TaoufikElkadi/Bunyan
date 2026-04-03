import { vi } from 'vitest'

/**
 * Creates a chainable mock Supabase query builder.
 *
 * By default, `.single()` and `.maybeSingle()` resolve with `{ data: null, error: null }`.
 * Pass `resolveWith` to override the final resolution.
 *
 * For tests that need different responses per `.from()` table, use `createRoutedMockSupabase`.
 */
export function createMockQueryBuilder(
  resolveWith: { data?: unknown; error?: unknown; count?: number } = { data: null, error: null }
) {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {
    from: vi.fn(() => builder),
    select: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    neq: vi.fn(() => builder),
    is: vi.fn(() => builder),
    not: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    order: vi.fn(() => builder),
    range: vi.fn(() => builder),
    single: vi.fn(() => Promise.resolve(resolveWith)),
    maybeSingle: vi.fn(() => Promise.resolve(resolveWith)),
    rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
  }
  return builder
}

/**
 * Creates a mock Supabase client that returns different query builders
 * depending on which table is queried via `.from()`.
 *
 * Usage:
 *   const admin = createRoutedMockSupabase({
 *     donations: createMockQueryBuilder({ data: { id: '1', status: 'pending' }, error: null }),
 *     recurrings: createMockQueryBuilder({ data: null, error: null }),
 *   })
 */
export function createRoutedMockSupabase(
  routes: Record<string, ReturnType<typeof createMockQueryBuilder>>
) {
  const fallback = createMockQueryBuilder()

  const client: Record<string, ReturnType<typeof vi.fn>> = {
    from: vi.fn((table: string) => {
      return routes[table] || fallback
    }),
    rpc: vi.fn(() => {
      return Promise.resolve({ data: null, error: null })
    }),
  }
  return client
}
