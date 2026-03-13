import { cache } from 'react'
import { headers } from 'next/headers'
import { createClient } from './server'

/**
 * Request-scoped cached profile fetch.
 * React cache() deduplicates across layout + page in the same request.
 *
 * Reads the authenticated user ID from the x-user-id header set by proxy.ts,
 * eliminating a redundant auth call (getSession/getUser) during render.
 */
export const getCachedProfile = cache(async () => {
  const supabase = await createClient()
  const headerStore = await headers()
  const userId = headerStore.get('x-user-id')
  const isPlatformAdmin = headerStore.get('x-platform-admin') === '1'

  if (!userId) {
    return { user: null, profile: null, mosque: null, mosqueId: null, isPlatformAdmin: false, supabase }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*, mosques(*)')
    .eq('id', userId)
    .single()

  return {
    user: { id: userId },
    profile,
    mosque: profile?.mosques ?? null,
    mosqueId: profile?.mosque_id ?? null,
    isPlatformAdmin,
    supabase,
  }
})
