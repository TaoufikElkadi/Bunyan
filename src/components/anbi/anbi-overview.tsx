'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { formatMoney } from '@/lib/money'
import { toast } from 'sonner'
import {
  CheckCircle2Icon,
  DownloadIcon,
  EyeIcon,
  FileTextIcon,
  Loader2Icon,
  MailIcon,
  SearchIcon,
  SendIcon,
} from 'lucide-react'

interface FundBreakdownItem {
  fund_name: string
  amount: number
  count: number
}

interface DonorPreview {
  donor_id: string
  donor_name: string
  donor_email: string | null
  donor_address: string | null
  total_amount: number
  fund_breakdown: FundBreakdownItem[]
  receipt_number: string | null
  generated_at: string | null
}

interface PreviewResponse {
  donors: DonorPreview[]
  summary: {
    total_donors: number
    total_amount: number
  }
}

interface ReceiptRecord {
  id: string
  donor_id: string
  donor_name: string
  donor_email: string | null
  year: number
  total_amount: number
  receipt_number: string | null
  pdf_path: string | null
  emailed_at: string | null
  created_at: string
}

export function AnbiOverview() {
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  const [selectedYear, setSelectedYear] = useState(currentYear - 1)
  const [preview, setPreview] = useState<PreviewResponse | null>(null)
  const [receipts, setReceipts] = useState<ReceiptRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [downloadingAll, setDownloadingAll] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [downloadingReceiptId, setDownloadingReceiptId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [sendingReceiptId, setSendingReceiptId] = useState<string | null>(null)

  const filteredDonors = useMemo(() => {
    if (!preview || !searchQuery.trim()) return preview?.donors ?? []
    const q = searchQuery.toLowerCase()
    return preview.donors.filter(
      (d) =>
        d.donor_name.toLowerCase().includes(q) ||
        d.donor_email?.toLowerCase().includes(q)
    )
  }, [preview, searchQuery])

  async function handleSendReceipt(receiptId: string) {
    setSendingReceiptId(receiptId)
    try {
      const res = await fetch('/api/anbi/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receipt_id: receiptId }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Fout bij versturen')
        return
      }
      toast.success('Giftenverklaring verstuurd naar donateur')
      // Refresh receipts to update emailed_at status
      const receiptsRes = await fetch(`/api/anbi/receipts?year=${selectedYear}`)
      if (receiptsRes.ok) {
        const receiptsData = await receiptsRes.json()
        setReceipts(receiptsData.receipts ?? [])
      }
    } catch {
      toast.error('Er is iets misgegaan')
    } finally {
      setSendingReceiptId(null)
    }
  }

  async function handleGenerateAndSend(donorId: string, donorName: string) {
    setSendingId(donorId)
    try {
      // First generate the receipt (this also stores it)
      const genRes = await fetch('/api/anbi/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: selectedYear, donor_id: donorId }),
      })
      if (!genRes.ok) {
        const data = await genRes.json()
        toast.error(data.error || 'Fout bij genereren PDF')
        return
      }

      // Refresh receipts to get the receipt_id
      const receiptsRes = await fetch(`/api/anbi/receipts?year=${selectedYear}`)
      if (!receiptsRes.ok) {
        toast.error('Verklaring gegenereerd maar kon niet worden verstuurd')
        return
      }
      const receiptsData = await receiptsRes.json()
      setReceipts(receiptsData.receipts ?? [])

      // Find the receipt for this donor
      const receipt = (receiptsData.receipts as ReceiptRecord[])?.find(
        (r) => r.donor_id === donorId
      )
      if (!receipt) {
        toast.error('Verklaring gegenereerd maar kon niet worden gevonden')
        return
      }

      // Send the email
      const sendRes = await fetch('/api/anbi/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receipt_id: receipt.id }),
      })
      const sendData = await sendRes.json()
      if (!sendRes.ok) {
        toast.error(sendData.error || 'Fout bij versturen')
        return
      }

      toast.success(`Giftenverklaring verstuurd naar ${donorName}`)

      // Refresh again to show emailed_at
      const finalRes = await fetch(`/api/anbi/receipts?year=${selectedYear}`)
      if (finalRes.ok) {
        const finalData = await finalRes.json()
        setReceipts(finalData.receipts ?? [])
      }
    } catch {
      toast.error('Er is iets misgegaan')
    } finally {
      setSendingId(null)
    }
  }

  /** Download a stored receipt PDF from Supabase Storage */
  async function handleDownloadStored(receipt: ReceiptRecord) {
    setDownloadingReceiptId(receipt.id)
    try {
      const res = await fetch(`/api/anbi/download?receipt_id=${receipt.id}`)
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Fout bij downloaden PDF')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${receipt.receipt_number ?? 'ANBI'}_${receipt.donor_name.replace(/\s+/g, '_')}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('PDF gedownload')
    } catch {
      toast.error('Er is iets misgegaan')
    } finally {
      setDownloadingReceiptId(null)
    }
  }

  async function handlePreview() {
    setLoading(true)
    setPreview(null)
    setReceipts([])

    try {
      const [previewRes, receiptsRes] = await Promise.all([
        fetch(`/api/anbi/preview?year=${selectedYear}`),
        fetch(`/api/anbi/receipts?year=${selectedYear}`),
      ])

      const previewData = await previewRes.json()
      const receiptsData = await receiptsRes.json()

      if (!previewRes.ok) {
        toast.error(previewData.error || 'Fout bij ophalen preview')
        return
      }

      setPreview(previewData)
      if (receiptsRes.ok && receiptsData.receipts) {
        setReceipts(receiptsData.receipts)
      }
    } catch {
      toast.error('Er is iets misgegaan')
    } finally {
      setLoading(false)
    }
  }

  async function handleDownloadSingle(donorId: string, donorName: string) {
    setDownloadingId(donorId)

    try {
      const res = await fetch('/api/anbi/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: selectedYear, donor_id: donorId }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Fout bij genereren PDF')
        return
      }

      // Download the PDF
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ANBI_${selectedYear}_${donorName.replace(/\s+/g, '_')}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('PDF gedownload')

      // Refresh receipts list
      const receiptsRes = await fetch(`/api/anbi/receipts?year=${selectedYear}`)
      if (receiptsRes.ok) {
        const receiptsData = await receiptsRes.json()
        setReceipts(receiptsData.receipts ?? [])
      }
    } catch {
      toast.error('Er is iets misgegaan')
    } finally {
      setDownloadingId(null)
    }
  }

  async function handleDownloadAll() {
    if (!preview || preview.donors.length === 0) return

    setDownloadingAll(true)

    try {
      const res = await fetch(`/api/anbi/download-zip?year=${selectedYear}`)

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Fout bij downloaden ZIP')
        return
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ANBI_${selectedYear}_giftenverklaringen.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('ZIP gedownload')
    } catch {
      toast.error('Er is iets misgegaan')
    } finally {
      setDownloadingAll(false)
    }
  }

  async function handleGenerateAll() {
    if (!preview || preview.donors.length === 0) return

    setGenerating(true)

    try {
      const res = await fetch('/api/anbi/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: selectedYear }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Fout bij genereren')
        return
      }

      toast.success(
        `${data.generated} giftenverklaring${data.generated === 1 ? '' : 'en'} gegenereerd`
      )

      // Refresh receipts list
      const receiptsRes = await fetch(`/api/anbi/receipts?year=${selectedYear}`)
      if (receiptsRes.ok) {
        const receiptsData = await receiptsRes.json()
        setReceipts(receiptsData.receipts ?? [])
      }
    } catch {
      toast.error('Er is iets misgegaan')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Year selector + preview button */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="anbi-year" className="text-sm font-medium">
            Jaar:
          </label>
          <select
            id="anbi-year"
            className="flex h-9 rounded-lg border border-input bg-transparent px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(parseInt(e.target.value, 10))
              setPreview(null)
              setReceipts([])
            }}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <Button onClick={handlePreview} disabled={loading} size="sm">
          {loading ? (
            <Loader2Icon className="size-4 mr-1 animate-spin" />
          ) : (
            <EyeIcon className="size-4 mr-1" />
          )}
          {loading ? 'Laden...' : 'Preview'}
        </Button>
      </div>

      {/* Summary card */}
      {preview && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Aantal donateurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{preview.summary.total_donors}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Totaal (excl. contant)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatMoney(preview.summary.total_amount)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Donors table */}
      {preview && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
            <CardTitle>In aanmerking komende donateurs</CardTitle>
            {preview.donors.length > 0 && (
              <div className="flex gap-2">
                <Button
                  onClick={handleDownloadAll}
                  disabled={downloadingAll}
                  size="sm"
                  variant="outline"
                >
                  {downloadingAll ? (
                    <Loader2Icon className="size-4 mr-1 animate-spin" />
                  ) : (
                    <DownloadIcon className="size-4 mr-1" />
                  )}
                  {downloadingAll ? 'Bezig...' : 'Download alles'}
                </Button>
                <Button
                  onClick={handleGenerateAll}
                  disabled={generating}
                  size="sm"
                >
                  {generating ? (
                    <Loader2Icon className="size-4 mr-1 animate-spin" />
                  ) : (
                    <FileTextIcon className="size-4 mr-1" />
                  )}
                  {generating ? 'Bezig...' : 'Alles genereren'}
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {preview.donors.length > 0 && (
              <div className="relative mb-4">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Zoek op naam of e-mail..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="!pl-9"
                />
              </div>
            )}
            {preview.donors.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Geen in aanmerking komende donaties gevonden voor {selectedYear}.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 font-medium">Naam</th>
                      <th className="pb-3 font-medium">E-mail</th>
                      <th className="pb-3 font-medium text-right">Fondsen</th>
                      <th className="pb-3 font-medium text-right">Totaal</th>
                      <th className="pb-3 font-medium text-center">Status</th>
                      <th className="pb-3 font-medium text-right">Actie</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDonors.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-muted-foreground">
                          Geen donateurs gevonden voor &ldquo;{searchQuery}&rdquo;
                        </td>
                      </tr>
                    ) : (
                      filteredDonors.map((donor) => (
                        <tr
                          key={donor.donor_id}
                          className="border-b last:border-0"
                        >
                          <td className="py-3 font-medium">{donor.donor_name}</td>
                          <td className="py-3 text-muted-foreground">
                            {donor.donor_email ?? '—'}
                          </td>
                          <td className="py-3 text-right">
                            <Badge variant="secondary">
                              {donor.fund_breakdown.length}
                            </Badge>
                          </td>
                          <td className="py-3 text-right font-medium">
                            {formatMoney(donor.total_amount)}
                          </td>
                          <td className="py-3 text-center">
                            {donor.receipt_number ? (
                              <Badge variant="default" className="gap-1">
                                <CheckCircle2Icon className="size-3" />
                                Gegenereerd
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleDownloadSingle(
                                    donor.donor_id,
                                    donor.donor_name
                                  )
                                }
                                disabled={downloadingId === donor.donor_id}
                              >
                                {downloadingId === donor.donor_id ? (
                                  <Loader2Icon className="size-4 animate-spin" />
                                ) : (
                                  <DownloadIcon className="size-4" />
                                )}
                                <span className="ml-1 hidden sm:inline">PDF</span>
                              </Button>
                              {donor.donor_email && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleGenerateAndSend(
                                      donor.donor_id,
                                      donor.donor_name
                                    )
                                  }
                                  disabled={sendingId === donor.donor_id}
                                  title="Verstuur naar donateur"
                                >
                                  {sendingId === donor.donor_id ? (
                                    <Loader2Icon className="size-4 animate-spin" />
                                  ) : (
                                    <SendIcon className="size-4" />
                                  )}
                                  <span className="ml-1 hidden sm:inline">Verstuur</span>
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Receipt history */}
      {receipts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Gegenereerde verklaringen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium">Referentie</th>
                    <th className="pb-3 font-medium">Donateur</th>
                    <th className="pb-3 font-medium text-right pr-6">Bedrag</th>
                    <th className="pb-3 font-medium pl-6">Aangemaakt</th>
                    <th className="pb-3 font-medium text-center">Status</th>
                    <th className="pb-3 font-medium text-right">Actie</th>
                  </tr>
                </thead>
                <tbody>
                  {receipts.map((receipt) => (
                    <tr
                      key={receipt.id}
                      className="border-b last:border-0"
                    >
                      <td className="py-3 font-mono text-xs">
                        {receipt.receipt_number ?? '—'}
                      </td>
                      <td className="py-3 font-medium">{receipt.donor_name}</td>
                      <td className="py-3 text-right font-medium pr-6">
                        {formatMoney(receipt.total_amount)}
                      </td>
                      <td className="py-3 text-muted-foreground pl-6">
                        {new Date(receipt.created_at).toLocaleDateString('nl-NL')}
                      </td>
                      <td className="py-3 text-center">
                        {receipt.emailed_at ? (
                          <Badge variant="default" className="gap-1">
                            <MailIcon className="size-3" />
                            Verstuurd
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <FileTextIcon className="size-3" />
                            Gegenereerd
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {receipt.pdf_path ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadStored(receipt)}
                              disabled={downloadingReceiptId === receipt.id}
                            >
                              {downloadingReceiptId === receipt.id ? (
                                <Loader2Icon className="size-4 animate-spin" />
                              ) : (
                                <DownloadIcon className="size-4" />
                              )}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleDownloadSingle(
                                  receipt.donor_id,
                                  receipt.donor_name
                                )
                              }
                              disabled={downloadingId === receipt.donor_id}
                            >
                              {downloadingId === receipt.donor_id ? (
                                <Loader2Icon className="size-4 animate-spin" />
                              ) : (
                                <DownloadIcon className="size-4" />
                              )}
                            </Button>
                          )}
                          {receipt.donor_email && receipt.pdf_path && (
                            <Button
                              size="sm"
                              variant={receipt.emailed_at ? 'ghost' : 'outline'}
                              onClick={() => handleSendReceipt(receipt.id)}
                              disabled={sendingReceiptId === receipt.id}
                              title={receipt.emailed_at ? 'Opnieuw versturen' : 'Verstuur naar donateur'}
                            >
                              {sendingReceiptId === receipt.id ? (
                                <Loader2Icon className="size-4 animate-spin" />
                              ) : (
                                <SendIcon className="size-4" />
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
          </CardContent>
        </Card>
      )}
    </div>
  )
}
