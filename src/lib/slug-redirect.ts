import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

/**
 * If the given slug belongs to an old redirect, redirect to the current mosque slug.
 * Call this when a mosque lookup by slug returns no result.
 */
export async function redirectIfOldSlug(oldSlug: string, buildPath: (currentSlug: string) => string): Promise<void> {
  const admin = createAdminClient()

  const { data: redir } = await admin
    .from('mosque_slug_redirects')
    .select('mosque_id')
    .eq('old_slug', oldSlug)
    .single()

  if (!redir) return

  const { data: mosque } = await admin
    .from('mosques')
    .select('slug')
    .eq('id', redir.mosque_id)
    .eq('status', 'active')
    .single()

  if (mosque) {
    redirect(buildPath(mosque.slug))
  }
}
