'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { PlusIcon, DownloadIcon } from 'lucide-react'

type Fund = { id: string; name: string }
type Campaign = { id: string; title: string }

type QRLink = {
  id: string
  code: string
  fund_id: string | null
  campaign_id: string | null
  scan_count: number
  created_at: string
  funds: { name: string } | null
  campaigns: { title: string } | null
}

type Props = {
  funds: Fund[]
  campaigns: Campaign[]
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function QRManagement({ funds, campaigns }: Props) {
  const { data: qrLinks, mutate } = useSWR<QRLink[]>('/api/qr', fetcher)
  const [open, setOpen] = useState(false)
  const [fundId, setFundId] = useState('')
  const [campaignId, setCampaignId] = useState('')
  const [loading, setLoading] = useState(false)
  const [createdQR, setCreatedQR] = useState<{ code: string; qr_data_url: string; url: string } | null>(null)

  async function handleCreate() {
    setLoading(true)
    try {
      const res = await fetch('/api/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fund_id: fundId || undefined,
          campaign_id: campaignId || undefined,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setCreatedQR(data)
      mutate()
    } catch {
      // error handled silently
    } finally {
      setLoading(false)
    }
  }

  async function handleDownloadQR(code: string) {
    const url = `${window.location.origin}/go/${code}`
    const QRCode = (await import('qrcode')).default
    const dataUrl = await QRCode.toDataURL(url, { width: 400, margin: 2 })
    downloadDataUrl(dataUrl, `qr-${code}.png`)
  }

  function handleClose() {
    setOpen(false)
    setFundId('')
    setCampaignId('')
    setCreatedQR(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">QR Codes</h1>
        <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : handleClose())}>
          <DialogTrigger render={
            <Button size="sm">
              <PlusIcon className="size-4 mr-1" />
              Nieuwe QR code
            </Button>
          } />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {createdQR ? 'QR Code aangemaakt' : 'Nieuwe QR code'}
              </DialogTitle>
            </DialogHeader>

            {createdQR ? (
              <div className="space-y-4 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={createdQR.qr_data_url}
                  alt={`QR code voor ${createdQR.code}`}
                  className="mx-auto w-48 h-48"
                />
                <p className="text-sm text-muted-foreground break-all">
                  {createdQR.url}
                </p>
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => downloadDataUrl(createdQR.qr_data_url, `qr-${createdQR.code}.png`)}
                  >
                    <DownloadIcon className="size-4 mr-1" />
                    Download
                  </Button>
                  <Button onClick={handleClose}>Sluiten</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="qr-fund">Fonds (optioneel)</Label>
                  <select
                    id="qr-fund"
                    value={fundId}
                    onChange={(e) => setFundId(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Geen fonds</option>
                    {funds.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qr-campaign">Campagne (optioneel)</Label>
                  <select
                    id="qr-campaign"
                    value={campaignId}
                    onChange={(e) => setCampaignId(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Geen campagne</option>
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <Button onClick={handleCreate} disabled={loading} className="w-full">
                  {loading ? 'Bezig...' : 'QR code aanmaken'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overzicht</CardTitle>
        </CardHeader>
        <CardContent>
          {!qrLinks ? (
            <p className="text-sm text-muted-foreground">Laden...</p>
          ) : qrLinks.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nog geen QR codes aangemaakt.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Fonds / Campagne</TableHead>
                  <TableHead className="text-right">Scans</TableHead>
                  <TableHead>Aangemaakt</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {qrLinks.map((qr) => (
                  <TableRow key={qr.id}>
                    <TableCell className="font-mono text-sm">{qr.code}</TableCell>
                    <TableCell>
                      {qr.campaigns?.title || qr.funds?.name || '—'}
                    </TableCell>
                    <TableCell className="text-right">{qr.scan_count}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(qr.created_at).toLocaleDateString('nl-NL')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadQR(qr.code)}
                      >
                        <DownloadIcon className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
