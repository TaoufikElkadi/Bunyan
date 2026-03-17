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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { eurosToCents } from '@/lib/money'
import { Plus, Search } from 'lucide-react'

interface Props {
  defaultAmount: number // cents
  onSuccess: () => void
}

interface DonorOption {
  id: string
  name: string | null
  email: string | null
}

export function AddCommitmentDialog({ defaultAmount, onSuccess }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [donors, setDonors] = useState<DonorOption[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedDonor, setSelectedDonor] = useState<DonorOption | null>(null)
  const [amount, setAmount] = useState(String(defaultAmount / 100))

  // Search donors
  useEffect(() => {
    if (search.length < 2) {
      setDonors([])
      return
    }

    const timeout = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/members?search=${encodeURIComponent(search)}&limit=10`)
        const data = await res.json()
        setDonors((data.members ?? []).map((m: { id: string; name: string | null; email: string | null }) => ({
          id: m.id,
          name: m.name,
          email: m.email,
        })))
      } catch {
        setDonors([])
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => clearTimeout(timeout)
  }, [search])

  function reset() {
    setSearch('')
    setDonors([])
    setSelectedDonor(null)
    setAmount(String(defaultAmount / 100))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedDonor) {
      toast.error('Selecteer een lid')
      return
    }

    const amountNum = parseFloat(amount)
    if (!amountNum || amountNum <= 0) {
      toast.error('Voer een geldig bedrag in')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/shard/commitments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donor_id: selectedDonor.id,
          monthly_amount: eurosToCents(amountNum),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Er is iets misgegaan')
        return
      }

      toast.success(`${selectedDonor.name ?? 'Lid'} toegevoegd aan contributie`)
      setOpen(false)
      reset()
      onSuccess()
      router.refresh()
    } catch {
      toast.error('Er is iets misgegaan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="size-4 mr-1" />
        Lid toevoegen
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Lid toevoegen aan contributie</DialogTitle>
            <DialogDescription>
              Zoek een bestaand lid en stel het maandbedrag in.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Donor search */}
            <div className="grid gap-2">
              <Label>Lid zoeken</Label>
              {selectedDonor ? (
                <div className="flex items-center justify-between rounded-lg border border-[#e3dfd5] bg-[#fafaf8] px-4 py-2.5">
                  <div>
                    <p className="text-[13px] font-medium text-[#261b07]">{selectedDonor.name ?? 'Naamloos'}</p>
                    {selectedDonor.email && (
                      <p className="text-[11px] text-[#a09888]">{selectedDonor.email}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelectedDonor(null); setSearch('') }}
                    className="text-[12px] text-[#a09888] hover:text-[#261b07] transition-colors"
                  >
                    Wijzig
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#b5b0a5]" strokeWidth={1.5} />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Zoek op naam of e-mail..."
                    className="pl-9"
                  />
                  {(donors.length > 0 || searching) && (
                    <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-[#e3dfd5] bg-white shadow-lg z-50 max-h-[200px] overflow-y-auto">
                      {searching ? (
                        <p className="px-4 py-3 text-[12px] text-[#a09888]">Zoeken...</p>
                      ) : (
                        donors.map((d) => (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => {
                              setSelectedDonor(d)
                              setSearch('')
                              setDonors([])
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-[#fafaf8] transition-colors border-b border-[#e3dfd5]/50 last:border-0"
                          >
                            <p className="text-[13px] font-medium text-[#261b07]">{d.name ?? 'Naamloos'}</p>
                            {d.email && <p className="text-[11px] text-[#a09888]">{d.email}</p>}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Amount */}
            <div className="grid gap-2">
              <Label htmlFor="shard-amount">Maandbedrag (€)</Label>
              <Input
                id="shard-amount"
                type="number"
                inputMode="decimal"
                min="1"
                step="0.50"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading || !selectedDonor}>
              {loading ? 'Bezig...' : 'Toevoegen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
