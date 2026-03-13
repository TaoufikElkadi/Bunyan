'use client'

import { useState, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'

  const supabase = useMemo(() => createClient(), [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const isPlatformAdmin = data.user?.app_metadata?.platform_role === 'platform_admin'
    router.push(isPlatformAdmin ? '/admin' : redirect)
    router.refresh()
  }

  async function handleMagicLink() {
    if (!email) {
      setError('Vul een e-mailadres in')
      return
    }
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setMagicLinkSent(true)
    setLoading(false)
  }

  if (magicLinkSent) {
    return (
      <div>
        <h1
          className="text-[28px] font-[584] tracking-[-0.56px] text-[#261b07] mb-2"
          style={{ fontFamily: "var(--font-display), sans-serif" }}
        >
          Controleer uw e-mail
        </h1>
        <p className="text-[15px] text-[#a09888] mb-8">
          We hebben een inloglink gestuurd naar {email}
        </p>
        <p className="text-[14px] text-[#a09888] mb-6">
          Klik op de link in de e-mail om in te loggen. Controleer ook uw spam folder.
        </p>
        <button
          onClick={() => setMagicLinkSent(false)}
          className="w-full py-3 rounded-lg border border-[#e3dfd5] text-[14px] font-medium text-[#261b07] hover:bg-[#f0ede6] transition-colors"
        >
          Opnieuw proberen
        </button>
      </div>
    )
  }

  return (
    <div>
      <h1
        className="text-[28px] font-[584] tracking-[-0.56px] text-[#261b07] mb-8"
        style={{ fontFamily: "var(--font-display), sans-serif" }}
      >
        Inloggen
      </h1>

      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          inputMode="email"
          placeholder="uw@email.nl"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          autoCapitalize="none"
          className="w-full rounded-lg border border-[#e3dfd5] bg-white px-4 py-3 text-[14px] text-[#261b07] placeholder:text-[#b5b0a5] outline-none focus:border-[#261b07]/30 focus:ring-1 focus:ring-[#261b07]/10 transition-colors"
        />
        <input
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="w-full rounded-lg border border-[#e3dfd5] bg-white px-4 py-3 text-[14px] text-[#261b07] placeholder:text-[#b5b0a5] outline-none focus:border-[#261b07]/30 focus:ring-1 focus:ring-[#261b07]/10 transition-colors"
        />

        {error && (
          <p className="text-[13px] text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#261b07] py-3 text-[14px] font-semibold text-[#f8f7f5] hover:bg-[#3a2c14] disabled:opacity-50 transition-colors"
        >
          {loading ? 'Bezig...' : 'Inloggen met e-mail'}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#e3dfd5]" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-[#f8f7f5] px-3 text-[12px] uppercase tracking-wide text-[#b5b0a5]">of</span>
        </div>
      </div>

      {/* Magic link button */}
      <button
        onClick={handleMagicLink}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#e3dfd5] bg-white py-3 text-[14px] font-medium text-[#261b07] hover:bg-[#f8f7f5] disabled:opacity-50 transition-colors"
      >
        <svg className="w-4 h-4 text-[#a09888]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
        Inloggen met e-mail link
      </button>

      {/* Help + legal */}
      <p className="mt-6 text-center text-[13px] text-[#a09888]">
        Hulp nodig?{' '}
        <Link href="/set-password" className="text-[#261b07] underline underline-offset-2">
          Wachtwoord resetten
        </Link>
      </p>
      <p className="mt-4 text-center text-[12px] text-[#b5b0a5]">
        Door Bunyan te gebruiken gaat u akkoord met onze{' '}
        <a href="#" className="underline underline-offset-2">Voorwaarden</a>
        {' '}en{' '}
        <a href="#" className="underline underline-offset-2">Privacybeleid</a>.
      </p>
    </div>
  )
}
