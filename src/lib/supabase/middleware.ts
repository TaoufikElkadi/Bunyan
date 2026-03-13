import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Track cookies set during auth (token refresh)
  const cookiesToApply: { name: string; value: string; options: any }[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          cookiesToApply.length = 0
          cookiesToApply.push(...cookiesToSet)
        },
      },
    }
  )

  // Use getUser() — validates JWT with auth server (secure, no stale tokens).
  // This is the ONLY auth call per request; downstream reads the header instead.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Pass authenticated user ID and platform role to server components via
  // request headers so they can skip redundant auth calls.
  const requestHeaders = new Headers(request.headers)
  if (user) {
    requestHeaders.set('x-user-id', user.id)
    if (user.app_metadata?.platform_role === 'platform_admin') {
      requestHeaders.set('x-platform-admin', '1')
    }
  }

  // Create response with modified request headers
  const supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  })

  // Re-apply any auth cookies (token refresh) to the response
  cookiesToApply.forEach(({ name, value, options }) =>
    supabaseResponse.cookies.set(name, value, options)
  )

  return { supabaseResponse, user, supabase }
}
