import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Health check endpoint.
 * Verifies Supabase connectivity. Returns 200 if healthy, 503 if degraded.
 */
export async function GET() {
  const checks: Record<string, 'ok' | 'fail'> = {}

  // Check Supabase
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('mosques').select('id').limit(1)
    checks.supabase = error ? 'fail' : 'ok'
  } catch {
    checks.supabase = 'fail'
  }

  const healthy = Object.values(checks).every((v) => v === 'ok')

  return NextResponse.json(
    { status: healthy ? 'healthy' : 'degraded', checks },
    { status: healthy ? 200 : 503 },
  )
}
