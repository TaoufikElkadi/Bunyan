import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { isOriginAllowed } from '@/lib/csrf'

// --- CSRF Protection ---
// Methods that change state and need origin validation.
const STATE_CHANGING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']

// Public paths exempt from CSRF checks. These are either:
// - Called by external services (Stripe webhooks, cron)
// - Public-facing payment endpoints used from donor pages on other domains
// - Short-link redirects
const CSRF_EXEMPT_PATHS = [
  '/api/payments/intent',
  '/api/payments/subscribe',
  '/api/webhooks/stripe',
  '/api/recurring/cancel',
  '/api/public/',
  '/api/cron/',
  '/go/',
]

const DASHBOARD_ROUTES = [
  '/dashboard',
  '/donaties',
  '/donateurs',
  '/fondsen',
  '/campagnes',
  '/collecte',
  '/contributie',
  '/anbi',
  '/instellingen',
  '/onboarding',
  '/admin',
  '/audit',
]

const AUTH_ROUTES = ['/login', '/signup']
const SETUP_ROUTES = ['/set-password'] // Authenticated-only, no redirect

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // --- CSRF validation for state-changing requests ---
  if (STATE_CHANGING_METHODS.includes(request.method)) {
    const isExempt = CSRF_EXEMPT_PATHS.some((path) => pathname.startsWith(path))
    if (!isExempt && !isOriginAllowed(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const { supabaseResponse, user } = await updateSession(request)

  const isDashboardRoute = DASHBOARD_ROUTES.some((route) => pathname.startsWith(route))
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route))
  const isSetupRoute = SETUP_ROUTES.some((route) => pathname.startsWith(route))

  // Setup routes require auth but don't redirect to dashboard/onboarding
  if (isSetupRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (isDashboardRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone()
    const isPlatformAdmin = user.app_metadata?.platform_role === 'platform_admin'
    const viewMode = request.cookies.get('bunyan-view')?.value
    // Platform admins who chose mosque view go to dashboard, not admin
    if (isPlatformAdmin && viewMode === 'mosque') {
      url.pathname = '/dashboard'
    } else {
      url.pathname = isPlatformAdmin ? '/admin' : '/dashboard'
    }
    return NextResponse.redirect(url)
  }

  // Platform admin without a mosque profile hitting /onboarding → /admin
  if (pathname.startsWith('/onboarding') && user?.app_metadata?.platform_role === 'platform_admin') {
    const viewMode = request.cookies.get('bunyan-view')?.value
    if (viewMode !== 'mosque') {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
