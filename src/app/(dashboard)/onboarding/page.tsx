'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

const DEFAULT_FUNDS = [
  { name: 'Algemeen', description: 'Algemene bijdrage aan de moskee', icon: '🕌' },
  { name: 'Zakat', description: 'Verplichte jaarlijkse aalmoes', icon: '💎' },
  { name: 'Sadaqah', description: 'Vrijwillige liefdadigheid', icon: '🤲' },
]

const COLOR_PRESETS = [
  '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6',
]

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Step 1: Basics
  const [mosqueName, setMosqueName] = useState('')
  const [city, setCity] = useState('')
  const [slug, setSlug] = useState('')

  // Step 2: Branding
  const [primaryColor, setPrimaryColor] = useState('#10b981')
  const [welcomeMsg, setWelcomeMsg] = useState('')

  // Step 3: Funds
  const [funds, setFunds] = useState(DEFAULT_FUNDS.map((f) => ({ ...f })))

  // Step 4: ANBI
  const [anbiStatus, setAnbiStatus] = useState(false)
  const [rsin, setRsin] = useState('')

  function handleNameChange(name: string) {
    setMosqueName(name)
    if (!slug || slug === slugify(mosqueName)) {
      setSlug(slugify(name))
    }
  }

  function addFund() {
    setFunds([...funds, { name: '', description: '', icon: '📦' }])
  }

  function removeFund(index: number) {
    setFunds(funds.filter((_, i) => i !== index))
  }

  function updateFund(index: number, field: string, value: string) {
    const updated = [...funds]
    updated[index] = { ...updated[index], [field]: value }
    setFunds(updated)
  }

  async function handleComplete() {
    setError(null)
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Niet ingelogd')

      // Create mosque via API route (uses service role for insert)
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mosque: {
            name: mosqueName,
            slug,
            city,
            primary_color: primaryColor,
            welcome_msg: welcomeMsg || null,
            anbi_status: anbiStatus,
            rsin: anbiStatus ? rsin : null,
          },
          funds: funds.filter((f) => f.name.trim()),
          user: {
            name: user.user_metadata?.name || user.email,
            email: user.email,
          },
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Er is iets misgegaan')
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is iets misgegaan')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Welkom bij Bunyan</h1>
          <p className="mt-2 text-muted-foreground">Stel uw moskee in — stap {step} van 4</p>
          <Progress value={(step / 4) * 100} className="mt-4" />
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Moskee gegevens</CardTitle>
              <CardDescription>De basisinformatie van uw moskee</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Naam moskee *</Label>
                <Input
                  id="name"
                  placeholder="bijv. Stichting Al-Fath"
                  value={mosqueName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Stad *</Label>
                <Input
                  id="city"
                  placeholder="bijv. Amsterdam"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">URL slug</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(slugify(e.target.value))}
                  />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">.bunyan.io</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button onClick={() => setStep(2)} disabled={!mosqueName || !city}>
                Volgende
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
              <CardDescription>Personaliseer uw donatiepagina</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Primaire kleur</Label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className="h-8 w-8 rounded-full border-2 transition-transform"
                      style={{
                        backgroundColor: color,
                        borderColor: primaryColor === color ? '#000' : 'transparent',
                        transform: primaryColor === color ? 'scale(1.2)' : 'scale(1)',
                      }}
                      onClick={() => setPrimaryColor(color)}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="welcome">Welkomstbericht (optioneel)</Label>
                <Input
                  id="welcome"
                  placeholder="bijv. Welkom bij onze moskee. Uw donatie maakt het verschil."
                  value={welcomeMsg}
                  onChange={(e) => setWelcomeMsg(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="ghost" onClick={() => setStep(1)}>Terug</Button>
              <Button onClick={() => setStep(3)}>Volgende</Button>
            </CardFooter>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Fondsen</CardTitle>
              <CardDescription>Richt fondsen in waar donateurs aan kunnen geven</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {funds.map((fund, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={fund.icon}
                    onChange={(e) => updateFund(i, 'icon', e.target.value)}
                    className="w-12 text-center"
                  />
                  <Input
                    value={fund.name}
                    onChange={(e) => updateFund(i, 'name', e.target.value)}
                    placeholder="Fondsnaam"
                    className="flex-1"
                  />
                  {funds.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => removeFund(i)}>
                      ✕
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addFund}>
                + Fonds toevoegen
              </Button>
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="ghost" onClick={() => setStep(2)}>Terug</Button>
              <Button onClick={() => setStep(4)} disabled={funds.every((f) => !f.name.trim())}>
                Volgende
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>ANBI & Betalingen</CardTitle>
              <CardDescription>Optioneel — u kunt dit later instellen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="anbi"
                  checked={anbiStatus}
                  onChange={(e) => setAnbiStatus(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="anbi">Onze moskee heeft ANBI-status</Label>
              </div>
              {anbiStatus && (
                <div className="space-y-2">
                  <Label htmlFor="rsin">RSIN nummer</Label>
                  <Input
                    id="rsin"
                    placeholder="123456789"
                    value={rsin}
                    onChange={(e) => setRsin(e.target.value)}
                  />
                </div>
              )}
              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="text-sm font-medium">Mollie betalingen</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Verbind uw Mollie account later via Instellingen om online donaties (iDEAL, creditcard) te ontvangen.
                </p>
              </div>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="ghost" onClick={() => setStep(3)}>Terug</Button>
              <Button onClick={handleComplete} disabled={loading}>
                {loading ? 'Bezig...' : 'Moskee aanmaken'}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  )
}
