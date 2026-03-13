'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function SetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [sessionReady, setSessionReady] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // On mount, Supabase client-side library auto-picks up the token
  // from the URL hash (after redirect from magic link). We wait for
  // the session to be established.
  useEffect(() => {
    async function checkSession() {
      // Listen for auth state change (magic link token exchange)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event) => {
          if (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') {
            setSessionReady(true)
            setChecking(false)
          }
        }
      )

      // Also check if already signed in
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setSessionReady(true)
        setChecking(false)
      } else {
        // Give it a moment for the magic link token exchange
        setTimeout(() => setChecking(false), 2000)
      }

      return () => subscription.unsubscribe()
    }

    checkSession()
  }, [supabase.auth])

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Wachtwoord moet minimaal 6 tekens bevatten')
      return
    }

    if (password !== confirmPassword) {
      setError('Wachtwoorden komen niet overeen')
      return
    }

    setLoading(true)

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    // Clear the invited_at flag to mark the user as active
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('users')
        .update({ invited_at: null })
        .eq('id', user.id)
    }

    router.push('/dashboard')
    router.refresh()
  }

  if (checking) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Laden...</p>
        </CardContent>
      </Card>
    )
  }

  if (!sessionReady) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ongeldige of verlopen link</CardTitle>
          <CardDescription>
            De uitnodigingslink is ongeldig of verlopen. Vraag de beheerder om
            een nieuwe uitnodiging te sturen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push('/login')} className="w-full">
            Naar inloggen
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Wachtwoord instellen</CardTitle>
        <CardDescription>
          Stel uw wachtwoord in om toegang te krijgen tot het dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSetPassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nieuw wachtwoord</Label>
            <Input
              id="password"
              type="password"
              placeholder="Minimaal 6 tekens"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Bevestig wachtwoord</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Herhaal uw wachtwoord"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Bezig...' : 'Wachtwoord instellen'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
