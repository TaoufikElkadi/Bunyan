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
import { eurosToCents, centsToEuros } from '@/lib/money'
import {
  Landmark,
  Heart,
  BookOpen,
  Hammer,
  HandHeart,
  Wallet,
  Home,
  Users,
  Star,
  type LucideIcon,
} from 'lucide-react'
import type { Fund } from '@/types'

/* ------------------------------------------------------------------ */
/*  Icon options                                                       */
/* ------------------------------------------------------------------ */

const ICON_OPTIONS: { key: string; icon: LucideIcon; label: string }[] = [
  { key: 'landmark', icon: Landmark, label: 'Moskee' },
  { key: 'heart', icon: Heart, label: 'Liefdadigheid' },
  { key: 'book', icon: BookOpen, label: 'Onderwijs' },
  { key: 'hammer', icon: Hammer, label: 'Bouw' },
  { key: 'hand_heart', icon: HandHeart, label: 'Zakat' },
  { key: 'wallet', icon: Wallet, label: 'Algemeen' },
  { key: 'home', icon: Home, label: 'Huisvesting' },
  { key: 'users', icon: Users, label: 'Gemeenschap' },
  { key: 'star', icon: Star, label: 'Speciaal' },
]

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface FundDialogProps {
  mode: 'create' | 'edit'
  fund?: Fund
  trigger: React.ReactNode
  onSuccess?: () => void
}

export function FundDialog({ mode, fund, trigger, onSuccess }: FundDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('landmark')
  const [goalAmount, setGoalAmount] = useState('')
  const [goalDeadline, setGoalDeadline] = useState('')

  useEffect(() => {
    if (open && mode === 'edit' && fund) {
      setName(fund.name)
      setDescription(fund.description ?? '')
      setIcon(fund.icon ?? 'landmark')
      setGoalAmount(fund.goal_amount ? String(centsToEuros(fund.goal_amount)) : '')
      setGoalDeadline(fund.goal_deadline ?? '')
    } else if (open && mode === 'create') {
      setName('')
      setDescription('')
      setIcon('landmark')
      setGoalAmount('')
      setGoalDeadline('')
    }
  }, [open, mode, fund])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Naam is verplicht')
      return
    }

    setLoading(true)

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      icon: icon || null,
      goal_amount: goalAmount ? eurosToCents(parseFloat(goalAmount)) : null,
      goal_deadline: goalDeadline || null,
    }

    try {
      const url = mode === 'create' ? '/api/funds' : `/api/funds/${fund!.id}`
      const res = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Er is iets misgegaan')
        return
      }

      toast.success(mode === 'create' ? 'Fonds aangemaakt' : 'Fonds bijgewerkt')
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
            <DialogTitle>
              {mode === 'create' ? 'Nieuw fonds' : 'Fonds bewerken'}
            </DialogTitle>
            <DialogDescription>
              {mode === 'create'
                ? 'Maak een nieuw fonds aan voor uw moskee.'
                : 'Wijzig de gegevens van dit fonds.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="fund-name">Naam *</Label>
              <Input
                id="fund-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Bijv. Zakat"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="fund-desc">Beschrijving</Label>
              <Textarea
                id="fund-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Korte beschrijving van het fonds"
                rows={2}
              />
            </div>

            {/* Icon picker */}
            <div className="grid gap-2">
              <Label>Icoon</Label>
              <div className="flex flex-wrap gap-1.5">
                {ICON_OPTIONS.map((opt) => {
                  const IconComp = opt.icon
                  const isSelected = icon === opt.key
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setIcon(opt.key)}
                      title={opt.label}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-all duration-150 ${
                        isSelected
                          ? 'border-[#261b07] bg-[#261b07] text-white'
                          : 'border-[#e3dfd5] bg-white text-[#8a8478] hover:border-[#261b07]/30 hover:text-[#261b07]'
                      }`}
                    >
                      <IconComp className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fund-goal">Doelbedrag (&euro;)</Label>
                <Input
                  id="fund-goal"
                  type="number"
                  min="0"
                  step="0.01"
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(e.target.value)}
                  placeholder="10000"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fund-deadline">Deadline</Label>
                <Input
                  id="fund-deadline"
                  type="date"
                  value={goalDeadline}
                  onChange={(e) => setGoalDeadline(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'Bezig...' : mode === 'create' ? 'Aanmaken' : 'Opslaan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
