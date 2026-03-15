'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SignaturePad } from '@/components/ui/signature-pad'
import { formatMoney } from '@/lib/money'
import { eurosToCents } from '@/lib/money'
import { toast } from 'sonner'
import {
  DownloadIcon,
  Loader2Icon,
  PlusIcon,
  XCircleIcon,
  PenLineIcon,
} from 'lucide-react'

interface Agreement {
  id: string
  donor_id: string
  donor_name: string
  donor_email: string | null
  donor_address: string | null
  annual_amount: number
  fund_id: string | null
  fund_name: string | null
  start_date: string
  end_date: string
  status: string
  donor_signed_at: string | null
  board_signed_at: string | null
  board_signer_name: string | null
  created_at: string
}

interface DonorOption {
  id: string
  name: string | null
  email: string | null
}

interface FundOption {
  id: string
  name: string
}

const statusLabels: Record<string, string> = {
  pending_board: 'Wacht op ondertekening',
  active: 'Actief',
  completed: 'Verlopen',
  cancelled: 'Geannuleerd',
}

const statusColors: Record<string, 'default' | 'secondary' | 'destructive'> = {
  pending_board: 'secondary',
  active: 'default',
  completed: 'secondary',
  cancelled: 'destructive',
}

export function PeriodicGifts() {
  const [agreements, setAgreements] = useState<Agreement[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  // Countersign state
  const [countersignId, setCountersignId] = useState<string | null>(null)
  const [countersignSig, setCountersignSig] = useState<string | null>(null)
  const [countersigning, setCountersigning] = useState(false)

  // Create form state
  const [donors, setDonors] = useState<DonorOption[]>([])
  const [funds, setFunds] = useState<FundOption[]>([])
  const [donorSearch, setDonorSearch] = useState('')
  const [selectedDonorId, setSelectedDonorId] = useState('')
  const [annualAmountEuros, setAnnualAmountEuros] = useState('')
  const [selectedFundId, setSelectedFundId] = useState('')
  const [startDate, setStartDate] = useState(() => `${new Date().getFullYear()}-01-01`)
  const [endDate, setEndDate] = useState(() => `${new Date().getFullYear() + 5}-01-01`)
  const [submitting, setSubmitting] = useState(false)

  const pendingCount = agreements.filter((a) => a.status === 'pending_board').length

  useEffect(() => {
    fetchAgreements()
  }, [])

  async function fetchAgreements() {
    setLoading(true)
    try {
      const res = await fetch('/api/anbi/periodic')
      if (res.ok) {
        const data = await res.json()
        setAgreements(data.agreements ?? [])
      }
    } catch {
      toast.error('Fout bij ophalen overeenkomsten')
    } finally {
      setLoading(false)
    }
  }

  async function fetchDonorsAndFunds() {
    try {
      const [donorsRes, fundsRes] = await Promise.all([
        fetch('/api/donors?limit=200'),
        fetch('/api/funds'),
      ])
      if (donorsRes.ok) {
        const data = await donorsRes.json()
        setDonors(
          (data.donors ?? data ?? [])
            .filter((d: DonorOption) => d.name)
            .map((d: DonorOption) => ({ id: d.id, name: d.name, email: d.email }))
        )
      }
      if (fundsRes.ok) {
        const data = await fundsRes.json()
        setFunds(
          (data.funds ?? data ?? []).map((f: FundOption) => ({ id: f.id, name: f.name }))
        )
      }
    } catch {
      // Non-critical
    }
  }

  function handleDialogOpen(open: boolean) {
    setDialogOpen(open)
    if (open) {
      fetchDonorsAndFunds()
      setSelectedDonorId('')
      setAnnualAmountEuros('')
      setSelectedFundId('')
      setDonorSearch('')
      const now = new Date()
      setStartDate(`${now.getFullYear()}-01-01`)
      setEndDate(`${now.getFullYear() + 5}-01-01`)
    }
  }

  function handleStartDateChange(value: string) {
    setStartDate(value)
    const start = new Date(value)
    if (!isNaN(start.getTime())) {
      const end = new Date(start)
      end.setFullYear(end.getFullYear() + 5)
      setEndDate(end.toISOString().split('T')[0])
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedDonorId || !annualAmountEuros || !startDate || !endDate) {
      toast.error('Vul alle verplichte velden in')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/anbi/periodic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donor_id: selectedDonorId,
          annual_amount: eurosToCents(parseFloat(annualAmountEuros)),
          fund_id: selectedFundId || undefined,
          start_date: startDate,
          end_date: endDate,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Fout bij aanmaken')
        return
      }
      toast.success('Overeenkomst aangemaakt')
      setDialogOpen(false)
      fetchAgreements()
    } catch {
      toast.error('Er is iets misgegaan')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDownloadPdf(agreementId: string, donorName: string) {
    setDownloadingId(agreementId)
    try {
      const res = await fetch(`/api/anbi/periodic/${agreementId}`)
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Fout bij genereren PDF')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Periodieke_gift_${donorName.replace(/\s+/g, '_')}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('PDF gedownload')
    } catch {
      toast.error('Er is iets misgegaan')
    } finally {
      setDownloadingId(null)
    }
  }

  async function handleCancel(agreementId: string) {
    setCancellingId(agreementId)
    try {
      const res = await fetch(`/api/anbi/periodic/${agreementId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Fout bij annuleren')
        return
      }
      toast.success('Overeenkomst geannuleerd')
      fetchAgreements()
    } catch {
      toast.error('Er is iets misgegaan')
    } finally {
      setCancellingId(null)
    }
  }

  async function handleCountersign() {
    if (!countersignId || !countersignSig) return
    setCountersigning(true)
    try {
      const res = await fetch(`/api/anbi/periodic/${countersignId}/countersign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature_base64: countersignSig }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Fout bij ondertekenen')
        return
      }
      toast.success('Overeenkomst ondertekend')
      setCountersignId(null)
      setCountersignSig(null)
      fetchAgreements()
    } catch {
      toast.error('Er is iets misgegaan')
    } finally {
      setCountersigning(false)
    }
  }

  const filteredDonors = donors.filter(
    (d) =>
      d.name?.toLowerCase().includes(donorSearch.toLowerCase()) ||
      d.email?.toLowerCase().includes(donorSearch.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const countersignAgreement = agreements.find((a) => a.id === countersignId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Periodieke giften (minimaal 5 jaar) zijn volledig aftrekbaar zonder drempel.
        </p>
        <Button size="sm" onClick={() => handleDialogOpen(true)}>
          <PlusIcon className="size-4 mr-1" />
          Nieuwe overeenkomst
        </Button>

        {/* Create dialog */}
        <Dialog open={dialogOpen} onOpenChange={handleDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nieuwe periodieke gift</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Donateur *</Label>
                <Input
                  placeholder="Zoek op naam of e-mail..."
                  value={donorSearch}
                  onChange={(e) => setDonorSearch(e.target.value)}
                />
                {donorSearch && !selectedDonorId && (
                  <div className="max-h-32 overflow-y-auto rounded-md border text-sm">
                    {filteredDonors.length === 0 ? (
                      <p className="p-2 text-muted-foreground">Geen resultaten</p>
                    ) : (
                      filteredDonors.slice(0, 10).map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-muted"
                          onClick={() => {
                            setSelectedDonorId(d.id)
                            setDonorSearch(d.name ?? '')
                          }}
                        >
                          <span className="font-medium">{d.name}</span>
                          {d.email && <span className="ml-2 text-muted-foreground">{d.email}</span>}
                        </button>
                      ))
                    )}
                  </div>
                )}
                {selectedDonorId && (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:underline"
                    onClick={() => { setSelectedDonorId(''); setDonorSearch('') }}
                  >
                    Wijzigen
                  </button>
                )}
              </div>
              <div className="space-y-2">
                <Label>Jaarlijks bedrag *</Label>
                <div className="flex items-center rounded-lg border border-input bg-transparent focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
                  <span className="pl-3 text-muted-foreground text-sm select-none">&euro;</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0,00"
                    className="flex-1 bg-transparent px-2 py-2 text-sm outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    value={annualAmountEuros}
                    onChange={(e) => setAnnualAmountEuros(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Fonds (optioneel)</Label>
                <select
                  className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  value={selectedFundId}
                  onChange={(e) => setSelectedFundId(e.target.value)}
                >
                  <option value="">Geen specifiek fonds</option>
                  {funds.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Startdatum *</Label>
                  <Input type="date" value={startDate} onChange={(e) => handleStartDateChange(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Einddatum *</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Minimaal 5 jaar looptijd vereist voor fiscale aftrek.
              </p>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2Icon className="size-4 mr-1 animate-spin" />}
                Overeenkomst aanmaken
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Countersign dialog */}
        <Dialog open={!!countersignId} onOpenChange={(open) => { if (!open) { setCountersignId(null); setCountersignSig(null) } }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Ondertekenen namens de moskee</DialogTitle>
            </DialogHeader>
            {countersignAgreement && (
              <div className="space-y-4">
                <div className="rounded-lg border p-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Donateur</span>
                    <span className="font-medium">{countersignAgreement.donor_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Jaarlijks</span>
                    <span className="font-medium">{formatMoney(countersignAgreement.annual_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Periode</span>
                    <span className="font-medium">
                      {new Date(countersignAgreement.start_date).toLocaleDateString('nl-NL')} – {new Date(countersignAgreement.end_date).toLocaleDateString('nl-NL')}
                    </span>
                  </div>
                </div>
                <SignaturePad
                  onSign={setCountersignSig}
                  onClear={() => setCountersignSig(null)}
                  disabled={countersigning}
                />
                <Button
                  className="w-full"
                  disabled={!countersignSig || countersigning}
                  onClick={handleCountersign}
                >
                  {countersigning ? (
                    <Loader2Icon className="size-4 mr-1 animate-spin" />
                  ) : (
                    <PenLineIcon className="size-4 mr-1" />
                  )}
                  Ondertekenen
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Pending notification */}
      {pendingCount > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          {pendingCount} overeenkomst{pendingCount > 1 ? 'en' : ''} wacht{pendingCount > 1 ? 'en' : ''} op uw ondertekening
        </div>
      )}

      {/* Agreements table */}
      <Card>
        <CardHeader>
          <CardTitle>Overeenkomsten</CardTitle>
        </CardHeader>
        <CardContent>
          {agreements.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nog geen periodieke overeenkomsten aangemaakt.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium pr-4">Donateur</th>
                    <th className="pb-3 font-medium pr-4">Fonds</th>
                    <th className="pb-3 font-medium text-right pr-6">Jaarlijks</th>
                    <th className="pb-3 font-medium pl-2">Periode</th>
                    <th className="pb-3 font-medium text-center px-4">Status</th>
                    <th className="pb-3 font-medium text-right">Acties</th>
                  </tr>
                </thead>
                <tbody>
                  {agreements.map((a) => (
                    <tr key={a.id} className="border-b last:border-0">
                      <td className="py-3 font-medium pr-4">{a.donor_name}</td>
                      <td className="py-3 text-muted-foreground pr-4">{a.fund_name ?? '—'}</td>
                      <td className="py-3 text-right font-medium pr-6">{formatMoney(a.annual_amount)}</td>
                      <td className="py-3 text-muted-foreground pl-2">
                        {new Date(a.start_date).toLocaleDateString('nl-NL')} – {new Date(a.end_date).toLocaleDateString('nl-NL')}
                      </td>
                      <td className="py-3 text-center">
                        <Badge variant={statusColors[a.status] ?? 'secondary'}>
                          {statusLabels[a.status] ?? a.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {a.status === 'pending_board' && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => setCountersignId(a.id)}
                              title="Ondertekenen"
                            >
                              <PenLineIcon className="size-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadPdf(a.id, a.donor_name)}
                            disabled={downloadingId === a.id}
                            title="Download PDF"
                          >
                            {downloadingId === a.id ? (
                              <Loader2Icon className="size-4 animate-spin" />
                            ) : (
                              <DownloadIcon className="size-4" />
                            )}
                          </Button>
                          {(a.status === 'active' || a.status === 'pending_board') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancel(a.id)}
                              disabled={cancellingId === a.id}
                              title="Annuleren"
                            >
                              {cancellingId === a.id ? (
                                <Loader2Icon className="size-4 animate-spin" />
                              ) : (
                                <XCircleIcon className="size-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
