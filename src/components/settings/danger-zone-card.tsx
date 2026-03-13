'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import type { Mosque } from '@/types'
import { Loader2Icon, Trash2Icon, AlertTriangleIcon } from 'lucide-react'

interface Props {
  mosque: Mosque
}

export function DangerZoneCard({ mosque }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [loading, setLoading] = useState(false)

  const confirmText = mosque.name
  const isConfirmed = confirmation === confirmText

  async function handleDelete() {
    if (!isConfirmed) return
    setLoading(true)

    try {
      const res = await fetch('/api/settings/delete-mosque', {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Verwijderen mislukt')
        setLoading(false)
        return
      }

      toast.success('Moskee verwijderd')
      router.push('/login')
    } catch {
      toast.error('Er is iets misgegaan')
      setLoading(false)
    }
  }

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangleIcon className="size-5 text-destructive" />
          <div>
            <CardTitle className="text-destructive">Gevarenzone</CardTitle>
            <CardDescription>Onomkeerbare acties</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <div>
            <p className="text-sm font-medium">Moskee verwijderen</p>
            <p className="text-xs text-muted-foreground">
              Verwijdert alle gegevens: donaties, donateurs, fondsen, teamleden en instellingen.
              Dit kan niet ongedaan worden gemaakt.
            </p>
          </div>
          <Dialog open={open} onOpenChange={(val) => { setOpen(val); setConfirmation('') }}>
            <DialogTrigger render={<Button variant="destructive" size="sm" />}>
              <Trash2Icon className="size-3" />
              Verwijderen
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Moskee definitief verwijderen?</DialogTitle>
                <DialogDescription>
                  Deze actie is <strong>onomkeerbaar</strong>. Alle gegevens van{' '}
                  <strong>{mosque.name}</strong> worden permanent verwijderd, inclusief
                  donaties, donateurs, fondsen en teamleden.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-2 py-2">
                <Label htmlFor="delete-confirm">
                  Typ <span className="font-mono font-bold">{confirmText}</span> om te bevestigen
                </Label>
                <Input
                  id="delete-confirm"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  placeholder={confirmText}
                  autoComplete="off"
                />
              </div>

              <DialogFooter>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={!isConfirmed || loading}
                >
                  {loading && <Loader2Icon className="size-4 animate-spin" />}
                  {loading ? 'Verwijderen...' : 'Definitief verwijderen'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}
