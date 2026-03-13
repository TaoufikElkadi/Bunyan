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
  const router = useRouter()

  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signUp({
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

    router.push('/onboarding')
    router.refresh()
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
        Start met het beheren van donaties voor uw moskee
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
