import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const DASHBOARD_ROUTES = [
  '/dashboard',
  '/donaties',
  '/donateurs',
  '/fondsen',
  '/campagnes',
  '/anbi',
  '/instellingen',
  '/onboarding',
  '/admin',
  '/audit',
]

const AUTH_ROUTES = ['/login', '/signup']
const SETUP_ROUTES = ['/set-password'] // Authenticated-only, no redirect

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)
  const { pathname } = request.nextUrl

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
    url.pathname = isPlatformAdmin ? '/admin' : '/dashboard'
    return NextResponse.redirect(url)
  }

  // Platform admin without a mosque profile hitting /onboarding → /admin
  if (pathname.startsWith('/onboarding') && user?.app_metadata?.platform_role === 'platform_admin') {
    const url = request.nextUrl.clone()
    url.pathname = '/admin'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
