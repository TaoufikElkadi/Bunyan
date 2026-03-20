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
import type { Campaign, Fund } from '@/types'

interface CampaignDialogProps {
  mode: 'create' | 'edit'
  campaign?: Campaign
  funds: Fund[]
  trigger: React.ReactNode
  onSuccess?: () => void
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function CampaignDialog({ mode, campaign, funds, trigger, onSuccess }: CampaignDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [fundId, setFundId] = useState('')
  const [goalAmount, setGoalAmount] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    if (open && mode === 'edit' && campaign) {
      setTitle(campaign.title)
      setSlug(campaign.slug)
      setDescription(campaign.description ?? '')
      setFundId(campaign.fund_id)
      setGoalAmount(campaign.goal_amount ? String(centsToEuros(campaign.goal_amount)) : '')
      setStartDate(campaign.start_date ?? '')
      setEndDate(campaign.end_date ?? '')
    } else if (open && mode === 'create') {
      setTitle('')
      setSlug('')
      setDescription('')
      setFundId(funds[0]?.id ?? '')
      setGoalAmount('')
      setStartDate('')
      setEndDate('')
    }
  }, [open, mode, campaign, funds])

  function handleTitleChange(value: string) {
    setTitle(value)
    // Auto-generate slug only in create mode and if user hasn't manually edited slug
    if (mode === 'create') {
      setSlug(generateSlug(value))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('Titel is verplicht')
      return
    }

    if (!fundId) {
      toast.error('Selecteer een fonds')
      return
    }

    setLoading(true)

    const payload = {
      title: title.trim(),
      slug: slug || generateSlug(title),
      description: description.trim() || null,
      fund_id: fundId,
      goal_amount: goalAmount ? eurosToCents(parseFloat(goalAmount)) : null,
      start_date: startDate || null,
      end_date: endDate || null,
    }

    try {
      const url = mode === 'create' ? '/api/campaigns' : `/api/campaigns/${campaign!.id}`
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

      toast.success(mode === 'create' ? 'Campagne aangemaakt' : 'Campagne bijgewerkt')
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
              {mode === 'create' ? 'Nieuwe campagne' : 'Campagne bewerken'}
            </DialogTitle>
            <DialogDescription>
              {mode === 'create'
                ? 'Maak een nieuwe campagne aan.'
                : 'Wijzig de gegevens van deze campagne.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="campaign-title">Titel *</Label>
              <Input
                id="campaign-title"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Bijv. Ramadan 2026"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="campaign-slug">URL-slug</Label>
              <Input
                id="campaign-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="ramadan-2026"
              />
              <p className="text-xs text-muted-foreground">
                Bereikbaar via bunyan.nl/doneren/[moskee]/{slug || '...'}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="campaign-desc">Beschrijving</Label>
              <Textarea
                id="campaign-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Beschrijf uw campagne"
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="campaign-fund">Fonds *</Label>
              <select
                id="campaign-fund"
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={fundId}
                onChange={(e) => setFundId(e.target.value)}
                required
              >
                {funds.map((fund) => (
                  <option key={fund.id} value={fund.id}>
                    {fund.icon ? `${fund.icon} ` : ''}{fund.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="campaign-goal">Doelbedrag (€)</Label>
              <Input
                id="campaign-goal"
                type="number"
                min="0"
                step="0.01"
                value={goalAmount}
                onChange={(e) => setGoalAmount(e.target.value)}
                placeholder="5000"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="campaign-start">Startdatum</Label>
                <Input
                  id="campaign-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="campaign-end">Einddatum</Label>
                <Input
                  id="campaign-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
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
