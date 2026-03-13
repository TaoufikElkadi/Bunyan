import { createClient } from './server'
import { createAdminClient } from './admin'

/**
 * Verifies the current user is a platform admin via app_metadata.
 * Returns the admin Supabase client (service role) if authorized, null otherwise.
 */
export async function getPlatformAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const isPlatformAdmin = user.app_metadata?.platform_role === 'platform_admin'
  if (!isPlatformAdmin) return null

  return { user, adminClient: createAdminClient() }
}
