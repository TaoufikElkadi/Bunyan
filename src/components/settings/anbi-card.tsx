'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import type { Mosque } from '@/types'
import { Loader2Icon, ShieldCheckIcon } from 'lucide-react'

const RSIN_RE = /^\d{9}$/
const KVK_RE = /^\d{8}$/

interface Props {
  mosque: Mosque
  isAdmin: boolean
}

export function AnbiCard({ mosque, isAdmin }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [anbiStatus, setAnbiStatus] = useState(mosque.anbi_status)
  const [rsin, setRsin] = useState(mosque.rsin ?? '')
  const [kvk, setKvk] = useState(mosque.kvk ?? '')

  const isDirty =
    anbiStatus !== mosque.anbi_status ||
    rsin !== (mosque.rsin ?? '') ||
    kvk !== (mosque.kvk ?? '')

  const rsinValid = !rsin.trim() || RSIN_RE.test(rsin.trim())
  const kvkValid = !kvk.trim() || KVK_RE.test(kvk.trim())
  const formValid = rsinValid && kvkValid

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isAdmin || !formValid) return
    setLoading(true)

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: mosque.name,
          city: mosque.city,
          address: mosque.address,
          primary_color: mosque.primary_color,
          welcome_msg: mosque.welcome_msg,
          language: mosque.language,
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

      toast.success('ANBI instellingen opgeslagen')
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>ANBI</CardTitle>
            <CardDescription>Belastingvoordeel voor donateurs</CardDescription>
          </div>
          {mosque.anbi_status ? (
            <Badge variant="default" className="gap-1">
              <ShieldCheckIcon className="size-3" />
              Geregistreerd
            </Badge>
          ) : (
            <Badge variant="secondary">Niet actief</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-3">
            <Checkbox
              id="anbi-toggle"
              checked={anbiStatus}
              onCheckedChange={(val) => setAnbiStatus(val as boolean)}
              disabled={!isAdmin}
            />
            <Label htmlFor="anbi-toggle" className="cursor-pointer">
              ANBI geregistreerd bij de Belastingdienst
            </Label>
          </div>

          {anbiStatus && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="anbi-rsin">RSIN nummer</Label>
                <Input
                  id="anbi-rsin"
                  value={rsin}
                  onChange={(e) => {
                    // Only allow digits
                    const v = e.target.value.replace(/\D/g, '').slice(0, 9)
                    setRsin(v)
                  }}
                  placeholder="123456789"
                  maxLength={9}
                  disabled={!isAdmin}
                  aria-invalid={!rsinValid}
                />
                {!rsinValid && (
                  <p className="text-xs text-destructive">RSIN moet exact 9 cijfers zijn</p>
                )}
                <p className="text-xs text-muted-foreground">
                  9-cijferig Rechtspersonen en Samenwerkingsverbanden Informatie Nummer
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="anbi-kvk">KVK nummer</Label>
                <Input
                  id="anbi-kvk"
                  value={kvk}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 8)
                    setKvk(v)
                  }}
                  placeholder="12345678"
                  maxLength={8}
                  disabled={!isAdmin}
                  aria-invalid={!kvkValid}
                />
                {!kvkValid && (
                  <p className="text-xs text-destructive">KVK moet exact 8 cijfers zijn</p>
                )}
                <p className="text-xs text-muted-foreground">
                  8-cijferig Kamer van Koophandel nummer
                </p>
              </div>
            </div>
          )}

          {isAdmin && isDirty && (
            <div className="flex justify-end">
              <Button type="submit" disabled={loading || !formValid}>
                {loading && <Loader2Icon className="size-4 animate-spin" />}
                {loading ? 'Opslaan...' : 'Opslaan'}
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
