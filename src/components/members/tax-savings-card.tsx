'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { formatMoney } from '@/lib/money'
import { ArrowRight, Check, Clock } from 'lucide-react'
import type { TaxOpportunityData } from '@/app/api/members/tax-opportunity/route'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const MIN_ELIGIBLE = 5

export function TaxSavingsCard() {
  const { data, isLoading } = useSWR<TaxOpportunityData>(
    '/api/members/tax-opportunity',
    fetcher,
    { revalidateOnFocus: false },
  )

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(38,27,7,0.04),0_1px_2px_rgba(38,27,7,0.02)]">
        <div className="h-4 w-40 rounded bg-[#f3f1ec] animate-pulse mb-4" />
        <div className="h-8 w-28 rounded bg-[#f3f1ec] animate-pulse mb-3" />
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-[#f3f1ec] animate-pulse" />
          <div className="h-3 w-3/4 rounded bg-[#f3f1ec] animate-pulse" />
        </div>
      </div>
    )
  }

  if (!data) return null

  const { eligible_count, avg_estimated_annual, total_missed_savings, tax_rate } = data

  // State: insufficient data
  if (eligible_count < MIN_ELIGIBLE) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(38,27,7,0.04),0_1px_2px_rgba(38,27,7,0.02)]">
        <h3 className="text-[13px] font-semibold text-[#261b07] mb-3">
          Gemist belastingvoordeel
        </h3>
        <div className="flex items-start gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#f3f1ec]">
            <Clock className="h-3.5 w-3.5 text-[#a09888]" strokeWidth={1.5} />
          </div>
          <p className="text-[12px] text-[#a09888] leading-relaxed">
            Zodra er meer donatiegegevens beschikbaar zijn, berekenen wij het mogelijke belastingvoordeel voor uw gemeenschap.
          </p>
        </div>
      </div>
    )
  }

  // State: all active donors have periodic gifts
  if (eligible_count === 0 || total_missed_savings === 0) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(38,27,7,0.04),0_1px_2px_rgba(38,27,7,0.02)]">
        <h3 className="text-[13px] font-semibold text-[#261b07] mb-3">
          Gemist belastingvoordeel
        </h3>
        <div className="flex items-start gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#e8f0d4]">
            <Check className="h-3.5 w-3.5 text-[#4a7c10]" strokeWidth={2} />
          </div>
          <p className="text-[12px] text-[#4a7c10] leading-relaxed font-medium">
            Al uw actieve leden hebben een periodieke gift. Goed bezig!
          </p>
        </div>
      </div>
    )
  }

  // State: opportunity — show the full calculation
  const taxRateLabel = `${(tax_rate * 100).toFixed(2).replace('.', ',')}%`

  return (
    <div className="rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(38,27,7,0.04),0_1px_2px_rgba(38,27,7,0.02)]">
      <h3 className="text-[13px] font-semibold text-[#261b07] mb-1">
        Gemist belastingvoordeel
      </h3>
      <p className="text-[11px] text-[#a09888] mb-4">
        Maximaal voordeel als alle leden overstappen naar periodieke giften
      </p>

      {/* Big number */}
      <p className="text-[28px] font-bold tracking-tight text-[#C87D3A] leading-none mb-4">
        <span className="text-[16px] font-semibold">tot </span>{formatMoney(total_missed_savings)}
        <span className="text-[13px] font-medium text-[#a09888] ml-1">/jaar</span>
      </p>

      {/* Supporting stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <p className="text-[18px] font-bold text-[#261b07] leading-none">{eligible_count}</p>
          <p className="text-[10px] text-[#a09888] mt-1 leading-tight">leden zonder periodieke gift</p>
        </div>
        <div>
          <p className="text-[18px] font-bold text-[#261b07] leading-none">{formatMoney(avg_estimated_annual)}</p>
          <p className="text-[10px] text-[#a09888] mt-1 leading-tight">gem. jaardonatie</p>
        </div>
        <div>
          <p className="text-[18px] font-bold text-[#261b07] leading-none">{taxRateLabel}</p>
          <p className="text-[10px] text-[#a09888] mt-1 leading-tight">belastingtarief</p>
        </div>
      </div>

      {/* CTA */}
      <Link
        href="/leden?status=active&periodic=no"
        className="flex items-center justify-center gap-1.5 w-full rounded-lg bg-[#261b07] px-4 py-2.5 text-[12px] font-semibold text-[#f8f7f5] hover:bg-[#3a2c14] transition-colors"
      >
        Bekijk deze leden
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  )
}
