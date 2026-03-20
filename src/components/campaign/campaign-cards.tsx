'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { CampaignDialog } from '@/components/campaign/campaign-dialog'
import { formatMoney } from '@/lib/money'
import { PencilIcon, ArchiveIcon, ExternalLink, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import type { Campaign, Fund } from '@/types'

interface CampaignCardsProps {
  campaigns: (Campaign & { funds?: { name: string } })[]
  funds: Fund[]
  mosqueSlug: string
  role?: string
}

export function CampaignCards({ campaigns, funds, mosqueSlug, role }: CampaignCardsProps) {
  const isAdmin = role === 'admin'
  const router = useRouter()
  const [archiveTarget, setArchiveTarget] = useState<Campaign | null>(null)
  const [archiving, setArchiving] = useState(false)

  async function handleArchive() {
    if (!archiveTarget) return
    setArchiving(true)

    try {
      const res = await fetch(`/api/campaigns/${archiveTarget.id}`, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Er is iets misgegaan')
        return
      }

      toast.success('Campagne gearchiveerd')
      setArchiveTarget(null)
      router.refresh()
    } catch {
      toast.error('Er is iets misgegaan')
    } finally {
      setArchiving(false)
    }
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {campaigns.map((campaign) => (
          <Card key={campaign.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{campaign.title}</CardTitle>
                <Badge variant={campaign.is_active ? 'default' : 'secondary'}>
                  {campaign.is_active ? 'Actief' : 'Inactief'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {campaign.description && (
                <p className="text-sm text-muted-foreground">{campaign.description}</p>
              )}
              <p className="text-sm">
                Fonds: {campaign.funds?.name}
              </p>
              {campaign.goal_amount && (
                <p className="text-sm text-muted-foreground">
                  Doel: {formatMoney(campaign.goal_amount)}
                </p>
              )}
              {campaign.start_date && campaign.end_date && (
                <p className="text-xs text-muted-foreground">
                  {new Date(campaign.start_date).toLocaleDateString('nl-NL')} -{' '}
                  {new Date(campaign.end_date).toLocaleDateString('nl-NL')}
                </p>
              )}
              <CampaignLink mosqueSlug={mosqueSlug} campaignSlug={campaign.slug} />
              {isAdmin && (
                <div className="flex gap-2 pt-2">
                  <CampaignDialog
                    mode="edit"
                    campaign={campaign}
                    funds={funds}
                    trigger={
                      <Button variant="outline" size="sm">
                        <PencilIcon className="size-3 mr-1" />
                        Bewerken
                      </Button>
                    }
                  />
                  {campaign.is_active && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setArchiveTarget(campaign)}
                    >
                      <ArchiveIcon className="size-3 mr-1" />
                      Archiveren
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!archiveTarget} onOpenChange={(open) => !open && setArchiveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Campagne archiveren</DialogTitle>
            <DialogDescription>
              Weet u zeker dat u &ldquo;{archiveTarget?.title}&rdquo; wilt archiveren?
              De campagne wordt verborgen maar de gegevens blijven bewaard.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArchiveTarget(null)}>
              Annuleren
            </Button>
            <Button variant="destructive" onClick={handleArchive} disabled={archiving}>
              {archiving ? 'Bezig...' : 'Archiveren'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function CampaignLink({ mosqueSlug, campaignSlug }: { mosqueSlug: string; campaignSlug: string }) {
  const [copied, setCopied] = useState(false)
  const appUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const url = `${appUrl}/doneren/${mosqueSlug}/${campaignSlug}`

  function handleCopy() {
    navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success('Link gekopieerd')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-1.5 pt-1">
      <div className="flex-1 min-w-0 flex items-center rounded-md bg-muted/50 border border-border/60 px-2.5 py-1.5">
        <span className="text-[11px] text-muted-foreground truncate">/doneren/{mosqueSlug}/{campaignSlug}</span>
      </div>
      <button
        onClick={handleCopy}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        title="Kopieer link"
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      </button>
      <a
        href={`/doneren/${mosqueSlug}/${campaignSlug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        title="Openen"
      >
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  )
}
