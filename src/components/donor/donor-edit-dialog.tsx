'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import type { Donor } from '@/types'

interface DonorEditDialogProps {
  donor: Donor
  trigger: React.ReactNode
  onSuccess?: () => void
}

export function DonorEditDialog({ donor, trigger, onSuccess }: DonorEditDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [tags, setTags] = useState('')

  useEffect(() => {
    if (open) {
      setName(donor.name ?? '')
      setEmail(donor.email ?? '')
      setPhone(donor.phone ?? '')
      setAddress(donor.address ?? '')
      setTags(donor.tags?.join(', ') ?? '')
    }
  }, [open, donor])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/donors/${donor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || null,
          email: email.trim() || null,
          phone: phone.trim() || null,
          address: address.trim() || null,
          tags: tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Er is iets misgegaan')
        return
      }

      toast.success('Donateur bijgewerkt')
      setOpen(false)
      onSuccess?.()
      router.refresh()
    } catch {
      toast.error('Er is iets misgegaan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <span onClick={() => setOpen(true)} style={{ display: 'contents' }}>{trigger}</span>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Donateur bewerken</DialogTitle>
            <DialogDescription>
              Wijzig de gegevens van deze donateur.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="donor-name">Naam</Label>
              <Input
                id="donor-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Naam"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="donor-email">E-mail</Label>
              <Input
                id="donor-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@voorbeeld.nl"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="donor-phone">Telefoon</Label>
              <Input
                id="donor-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+31 6 12345678"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="donor-address">Adres</Label>
              <Textarea
                id="donor-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Straat, Postcode, Stad"
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="donor-tags">Tags (komma-gescheiden)</Label>
              <Input
                id="donor-tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="vaste donateur, bestuurslid"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'Bezig...' : 'Opslaan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
