'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'form' | 'verify'>('form')
  const router = useRouter()

  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=/onboarding`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // If email confirmation is required, session will be null
    if (!data.session) {
      setStep('verify')
      setLoading(false)
      return
    }

    router.push('/onboarding')
    router.refresh()
  }

  if (step === 'verify') {
    return (
      <div>
        <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#261b07]/5">
          <svg className="h-6 w-6 text-[#261b07]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>
        <h1
          className="text-[28px] font-[584] tracking-[-0.56px] text-[#261b07] mb-2"
          style={{ fontFamily: "var(--font-display), sans-serif" }}
        >
          Controleer uw e-mail
        </h1>
        <p className="text-[15px] text-[#a09888] mb-6">
          We hebben een bevestigingslink gestuurd naar{' '}
          <span className="font-medium text-[#261b07]">{email}</span>.
          Klik op de link om uw account te activeren.
        </p>
        <p className="text-[13px] text-[#b5b0a5] mb-6">
          Controleer ook uw spam folder als u de e-mail niet ziet.
        </p>
        <button
          onClick={() => {
            setStep('form')
            setPassword('')
          }}
          className="w-full py-3 rounded-lg border border-[#e3dfd5] text-[14px] font-medium text-[#261b07] hover:bg-[#f0ede6] transition-colors"
        >
          Ander e-mailadres gebruiken
        </button>
      </div>
    )
  }

  return (
    <div>
      <h1
        className="text-[28px] font-[584] tracking-[-0.56px] text-[#261b07] mb-2"
        style={{ fontFamily: "var(--font-display), sans-serif" }}
      >
        Account aanmaken
      </h1>
      <p className="text-[15px] text-[#a09888] mb-8">
        Leer uw gemeenschap kennen — begin met donaties
      </p>

      <form onSubmit={handleSignup} className="space-y-4">
        <input
          type="text"
          placeholder="Volledige naam"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
          autoCapitalize="words"
          className="w-full rounded-lg border border-[#e3dfd5] bg-white px-4 py-3 text-[14px] text-[#261b07] placeholder:text-[#b5b0a5] outline-none focus:border-[#261b07]/30 focus:ring-1 focus:ring-[#261b07]/10 transition-colors"
        />
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
          placeholder="Minimaal 6 tekens"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
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
          {loading ? 'Bezig...' : 'Account aanmaken'}
        </button>
      </form>

      <p className="mt-6 text-center text-[13px] text-[#a09888]">
        Al een account?{' '}
        <Link href="/login" className="text-[#261b07] underline underline-offset-2">
          Inloggen
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

