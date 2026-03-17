'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { formatMoney } from '@/lib/money'
import { ArrowRight, Wallet } from 'lucide-react'
import type { ShardStats } from '@/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function ShardCollectionCard() {
  const { data, isLoading } = useSWR<{ stats: ShardStats }>('/api/shard/stats', fetcher, {
    revalidateOnFocus: false,
  })

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(38,27,7,0.04),0_1px_2px_rgba(38,27,7,0.02)]">
        <div className="h-4 w-32 rounded bg-[#f3f1ec] animate-pulse mb-4" />
        <div className="h-6 w-20 rounded bg-[#f3f1ec] animate-pulse mb-3" />
        <div className="h-3 w-full rounded bg-[#f3f1ec] animate-pulse" />
      </div>
    )
  }

  const stats = data?.stats
  if (!stats || stats.active_members === 0) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(38,27,7,0.04),0_1px_2px_rgba(38,27,7,0.02)]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-semibold text-[#261b07]">Contributie</h3>
        </div>
        <div className="flex flex-col items-center py-3">
          <Wallet className="h-5 w-5 text-[#b5b0a5] mb-2" strokeWidth={1.5} />
          <p className="text-[11px] text-[#a09888] text-center">
            Nog geen contributieleden. Voeg leden toe via het contributiescherm.
          </p>
        </div>
      </div>
    )
  }

  const collectionRate = Math.round((stats.paid_this_month / stats.active_members) * 100)

  return (
    <div className="rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(38,27,7,0.04),0_1px_2px_rgba(38,27,7,0.02)]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] font-semibold text-[#261b07]">Contributie</h3>
        <Link
          href="/contributie"
          className="text-[11px] font-medium text-[#a09888] hover:text-[#261b07] transition-colors flex items-center gap-0.5"
        >
          Beheer
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Collection rate bar */}
      <div className="mb-3">
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-[24px] font-bold text-[#261b07] tracking-tight leading-none">{collectionRate}%</span>
          <span className="text-[11px] text-[#a09888]">
            {stats.paid_this_month}/{stats.active_members} betaald
          </span>
        </div>
        <div className="h-2 rounded-full bg-[#f3f1ec] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#4a7c10] transition-all duration-500"
            style={{ width: `${collectionRate}%` }}
          />
        </div>
      </div>

      {/* Collected vs expected */}
      <div className="flex items-center justify-between text-[11px] text-[#a09888]">
        <span>Ontvangen: <span className="font-semibold text-[#261b07]">{formatMoney(stats.collected_this_month)}</span></span>
        <span>Verwacht: <span className="font-semibold text-[#261b07]">{formatMoney(stats.monthly_expected)}</span></span>
      </div>

      {stats.unpaid_this_month > 0 && (
        <Link
          href="/contributie"
          className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg bg-[#C87D3A]/10 border border-[#C87D3A]/20 hover:bg-[#C87D3A]/15 transition-colors"
        >
          <span className="text-[11px] text-[#C87D3A]">
            <span className="font-semibold">{stats.unpaid_this_month}</span> leden nog niet betaald
          </span>
        </Link>
      )}
    </div>
  )
}
