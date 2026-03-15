'use client'

import { useState } from 'react'
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
import { FundDialog } from '@/components/fund/fund-dialog'
import { formatMoney } from '@/lib/money'
import {
  Pencil,
  Archive,
  Target,
  Calendar,
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
import { toast } from 'sonner'
import type { Fund } from '@/types'

/* ------------------------------------------------------------------ */
/*  Icon mapping — consistent Lucide icons by fund icon key            */
/* ------------------------------------------------------------------ */

const FUND_ICONS: Record<string, LucideIcon> = {
  landmark: Landmark,
  heart: Heart,
  book: BookOpen,
  hammer: Hammer,
  hand_heart: HandHeart,
  wallet: Wallet,
  home: Home,
  users: Users,
  star: Star,
}

const FUND_ICON_COLORS = [
  { bg: 'bg-[#C87D3A]/10', text: 'text-[#C87D3A]', hex: '#C87D3A' },
  { bg: 'bg-[#6B8F71]/10', text: 'text-[#6B8F71]', hex: '#6B8F71' },
  { bg: 'bg-[#7B8EAD]/10', text: 'text-[#7B8EAD]', hex: '#7B8EAD' },
  { bg: 'bg-[#D4956A]/10', text: 'text-[#D4956A]', hex: '#D4956A' },
  { bg: 'bg-[#f9a600]/10', text: 'text-[#f9a600]', hex: '#f9a600' },
  { bg: 'bg-[#8a8478]/10', text: 'text-[#8a8478]', hex: '#8a8478' },
]

// Auto-detect icon from fund name when no icon is explicitly set
const NAME_ICON_MAP: [RegExp, LucideIcon][] = [
  [/zakat/i, HandHeart],
  [/sadaqah|sadaqa|liefdadig/i, Heart],
  [/moskee|masjid|gebouw/i, Landmark],
  [/onderwijs|educatie|school|boek|quran|koran/i, BookOpen],
  [/bouw|renovatie|verbouwing|onderhoud/i, Hammer],
  [/gemeenschap|community|jeugd|jongeren/i, Users],
  [/huis|woning|huisvesting/i, Home],
  [/ramadan|eid|iftar|speciaal/i, Star],
  [/algemeen|general|overig/i, Wallet],
]

export function getFundIcon(icon: string | null, fundName?: string): LucideIcon {
  if (icon && FUND_ICONS[icon]) return FUND_ICONS[icon]
  if (fundName) {
    for (const [pattern, lucideIcon] of NAME_ICON_MAP) {
      if (pattern.test(fundName)) return lucideIcon
    }
  }
  return Landmark
}

export { FUND_ICONS, FUND_ICON_COLORS }

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

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

  // Compute the max total across funds for relative bar sizing
  const maxTotal = Math.max(...funds.map((f) => totals[f.id] ?? 0), 1)

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
        {funds.map((fund, index) => {
          const total = totals[fund.id] ?? 0
          const goalAmount = fund.goal_amount
          const goalProgress = goalAmount ? Math.min(100, Math.round((total / goalAmount) * 100)) : null
          const relativeProgress = Math.round((total / maxTotal) * 100)

          const Icon = getFundIcon(fund.icon, fund.name)
          const colorSet = FUND_ICON_COLORS[index % FUND_ICON_COLORS.length]

          return (
            <div
              key={fund.id}
              className="rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(38,27,7,0.04),0_1px_2px_rgba(38,27,7,0.02)] transition-shadow duration-200 hover:shadow-[0_4px_16px_rgba(38,27,7,0.06)]"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorSet.bg}`}>
                    <Icon className={`h-[18px] w-[18px] ${colorSet.text}`} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-semibold text-[#261b07] leading-tight">{fund.name}</h4>
                    <span className={`text-[10px] font-semibold uppercase tracking-wide ${
                      fund.is_active ? 'text-[#4a7c10]' : 'text-[#a09888]'
                    }`}>
                      {fund.is_active ? 'Actief' : 'Gearchiveerd'}
                    </span>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <FundDialog
                      mode="edit"
                      fund={fund}
                      trigger={
                        <button className="flex h-7 w-7 items-center justify-center rounded-lg text-[#a09888] hover:bg-[#f3f1ec] hover:text-[#261b07] transition-colors">
                          <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </button>
                      }
                    />
                    {fund.is_active && (
                      <button
                        onClick={() => setArchiveTarget(fund)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-[#a09888] hover:bg-red-50 hover:text-red-500 transition-colors"
                      >
                        <Archive className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Description */}
              {fund.description && (
                <p className="text-[12px] text-[#8a8478] mb-4 line-clamp-2">{fund.description}</p>
              )}

              {/* Total + relative progress bar */}
              <div className="mb-1">
                <p className="text-[24px] font-bold tracking-tight text-[#261b07] leading-none">
                  {formatMoney(total)}
                </p>
                <p className="text-[11px] text-[#b5b0a5] mt-1">totaal ontvangen</p>
              </div>

              {/* Always show a progress bar — either goal-based or relative to other funds */}
              <div className="mt-3">
                {goalProgress !== null ? (
                  /* Goal-based progress */
                  <>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Target className="h-3 w-3 text-[#a09888]" strokeWidth={1.5} />
                        <span className="text-[11px] font-medium text-[#8a8478]">
                          Doel: {formatMoney(goalAmount!)}
                        </span>
                      </div>
                      <span className={`text-[11px] font-semibold ${
                        goalProgress >= 100 ? 'text-[#4a7c10]' : 'text-[#261b07]'
                      }`}>
                        {goalProgress}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#f3f1ec] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${goalProgress}%`,
                          backgroundColor: goalProgress >= 100 ? '#4a7c10' : FUND_ICON_COLORS[index % FUND_ICON_COLORS.length].hex,
                        }}
                      />
                    </div>
                    {fund.goal_deadline && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <Calendar className="h-3 w-3 text-[#b5b0a5]" strokeWidth={1.5} />
                        <span className="text-[10px] text-[#b5b0a5]">
                          Deadline: {new Date(fund.goal_deadline).toLocaleDateString('nl-NL', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  /* Relative progress (compared to top fund) */
                  <div className="h-1.5 w-full rounded-full bg-[#f3f1ec] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${relativeProgress}%`,
                        backgroundColor: FUND_ICON_COLORS[index % FUND_ICON_COLORS.length].hex,
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
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
