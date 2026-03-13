'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import type { Mosque, Locale } from '@/types'

interface MosqueSettingsFormProps {
  mosque: Mosque
}

const LANGUAGES: { value: Locale; label: string }[] = [
  { value: 'nl', label: 'Nederlands' },
  { value: 'en', label: 'English' },
  { value: 'tr', label: 'Turkce' },
  { value: 'ar', label: 'العربية' },
]

export function MosqueSettingsForm({ mosque }: MosqueSettingsFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [name, setName] = useState(mosque.name)
  const [city, setCity] = useState(mosque.city ?? '')
  const [address, setAddress] = useState(mosque.address ?? '')
  const [primaryColor, setPrimaryColor] = useState(mosque.primary_color)
  const [welcomeMsg, setWelcomeMsg] = useState(mosque.welcome_msg ?? '')
  const [language, setLanguage] = useState<Locale>(mosque.language)
  const [anbiStatus, setAnbiStatus] = useState(mosque.anbi_status)
  const [rsin, setRsin] = useState(mosque.rsin ?? '')
  const [kvk, setKvk] = useState(mosque.kvk ?? '')

  const isDirty =
    name !== mosque.name ||
    city !== (mosque.city ?? '') ||
    address !== (mosque.address ?? '') ||
    primaryColor !== mosque.primary_color ||
    welcomeMsg !== (mosque.welcome_msg ?? '') ||
    language !== mosque.language ||
    anbiStatus !== mosque.anbi_status ||
    rsin !== (mosque.rsin ?? '') ||
    kvk !== (mosque.kvk ?? '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          city: city.trim() || null,
          address: address.trim() || null,
          primary_color: primaryColor,
          welcome_msg: welcomeMsg.trim() || null,
          language,
          anbi_status: anbiStatus,
          rsin: rsin.trim() || null,
          kvk: kvk.trim() || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Er is iets misgegaan')
        return
      }

      toast.success('Instellingen opgeslagen')
      router.refresh()
    } catch {
      toast.error('Er is iets misgegaan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Moskee gegevens</CardTitle>
        <CardDescription>Algemene informatie en instellingen van uw moskee</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="mosque-name">Naam *</Label>
              <Input
                id="mosque-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="mosque-city">Stad</Label>
              <Input
                id="mosque-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="mosque-address">Adres</Label>
            <Input
              id="mosque-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="mosque-color">Primaire kleur</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  id="mosque-color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded border border-input p-1"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  pattern="^#[0-9a-fA-F]{6}$"
                  placeholder="#10b981"
                  className="font-mono"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="mosque-language">Taal</Label>
              <select
                id="mosque-language"
                value={language}
                onChange={(e) => setLanguage(e.target.value as Locale)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="mosque-welcome">Welkomstbericht (donatiepagina)</Label>
            <Textarea
              id="mosque-welcome"
              value={welcomeMsg}
              onChange={(e) => setWelcomeMsg(e.target.value)}
              placeholder="Welkom bij onze moskee. Uw donatie maakt het verschil."
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="mosque-kvk">KVK nummer</Label>
            <Input
              id="mosque-kvk"
              value={kvk}
              onChange={(e) => setKvk(e.target.value)}
              placeholder="12345678"
            />
          </div>

          <div className="space-y-4 rounded-md border p-4">
            <div className="flex items-center gap-3">
              <Checkbox
                id="mosque-anbi"
                checked={anbiStatus}
                onCheckedChange={(val) => setAnbiStatus(val === true)}
              />
              <Label htmlFor="mosque-anbi" className="cursor-pointer">
                ANBI geregistreerd
              </Label>
            </div>

            {anbiStatus && (
              <div className="grid gap-2">
                <Label htmlFor="mosque-rsin">RSIN nummer</Label>
                <Input
                  id="mosque-rsin"
                  value={rsin}
                  onChange={(e) => setRsin(e.target.value)}
                  placeholder="123456789"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading || !isDirty}>
              {loading ? 'Bezig...' : 'Opslaan'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
