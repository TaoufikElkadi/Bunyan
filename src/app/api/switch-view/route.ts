import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * Toggles the view mode for platform admins between 'admin' and 'mosque'.
 * Sets a cookie and redirects to the appropriate dashboard.
 */
export async function POST(request: Request) {
  const { mode } = await request.json() as { mode: 'admin' | 'mosque' }
  const cookieStore = await cookies()

  cookieStore.set('bunyan-view', mode, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  })

  return NextResponse.json({ ok: true, redirect: mode === 'admin' ? '/admin' : '/dashboard' })
}
