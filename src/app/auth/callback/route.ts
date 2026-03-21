import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const rawRedirect = searchParams.get('redirect') || '/dashboard'

  // Only allow relative paths — block protocol-relative (//evil.com) and absolute URLs
  const redirect = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
    ? rawRedirect
    : '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(new URL(redirect, origin))
    }
  }

  // If something went wrong, redirect to login
  return NextResponse.redirect(new URL('/login', origin))
}
