import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const rawRedirect = searchParams.get('redirect') || '/dashboard'

  // Only allow relative paths — block protocol-relative (//evil.com) and absolute URLs
  const redirect = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
    ? rawRedirect
    : '/dashboard'

  const supabase = await createClient()

  // Handle PKCE flow (code exchange)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL(redirect, origin))
    }
  }

  // Handle magic link / email OTP flow (token_hash verification)
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as 'magiclink' | 'email',
    })
    if (!error) {
      return NextResponse.redirect(new URL(redirect, origin))
    }
  }

  // If something went wrong, redirect to login
  return NextResponse.redirect(new URL('/login', origin))
}
