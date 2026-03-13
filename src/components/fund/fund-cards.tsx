'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { FundDialog } from '@/components/fund/fund-dialog'
import { formatMoney } from '@/lib/money'
import { PencilIcon, ArchiveIcon } from 'lucide-react'
import { toast } from 'sonner'
import type { Fund } from '@/types'

interface FundCardsProps {
  funds: Fund[]
  totals: Record<string, number>
  role?: string
}

export function FundCards({ funds, totals, role }: FundCardsProps) {
  const isAdmin = role === 'admin'
  const router = useRouter()
  const [archiveTarget, setArchiveTarget] = useState<Fund | null>(null)
  const [archiving, setArchiving] = useState(false)

  async function handleArchive() {
    if (!archiveTarget) return
    setArchiving(true)

    try {
      const res = await fetch(`/api/funds/${archiveTarget.id}`, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Er is iets misgegaan')
        return
      }

      toast.success('Fonds gearchiveerd')
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {funds.map((fund) => {
          const total = totals[fund.id] ?? 0
          const goalAmount = fund.goal_amount
          const progress = goalAmount ? Math.min(100, Math.round((total / goalAmount) * 100)) : null

          return (
            <Card key={fund.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {fund.icon} {fund.name}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Badge variant={fund.is_active ? 'default' : 'secondary'}>
                      {fund.is_active ? 'Actief' : 'Inactief'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {fund.description && (
                  <p className="text-sm text-muted-foreground">{fund.description}</p>
                )}
                <p className="text-xl font-bold">{formatMoney(total)}</p>
                {progress !== null && (
                  <div className="space-y-1">
                    <Progress value={progress} />
                    <p className="text-xs text-muted-foreground">
                      {progress}% van {formatMoney(goalAmount!)}
                    </p>
                  </div>
                )}
                {isAdmin && (
                  <div className="flex gap-2 pt-2">
                    <FundDialog
                      mode="edit"
                      fund={fund}
                      trigger={
                        <Button variant="outline" size="sm">
                          <PencilIcon className="size-3 mr-1" />
                          Bewerken
                        </Button>
                      }
                    />
                    {fund.is_active && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setArchiveTarget(fund)}
                      >
                        <ArchiveIcon className="size-3 mr-1" />
                        Archiveren
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Archive confirmation dialog */}
      <Dialog open={!!archiveTarget} onOpenChange={(open) => !open && setArchiveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fonds archiveren</DialogTitle>
            <DialogDescription>
              Weet u zeker dat u &ldquo;{archiveTarget?.name}&rdquo; wilt archiveren?
              Het fonds wordt verborgen op de donatiepagina, maar bestaande donaties blijven bewaard.
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
