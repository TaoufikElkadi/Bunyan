'use client'

import useSWR from 'swr'
import Link from 'next/link'
import type { MemberStats } from '@/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function ConversionFunnel() {
  const { data, isLoading } = useSWR<{ stats: MemberStats }>('/api/members/stats', fetcher, {
    revalidateOnFocus: false,
  })

  if (isLoading) {
    return (
      <div className="rounded-xl border border-[#e3dfd5] bg-white p-6">
        <div className="h-4 w-40 rounded bg-[#f3f1ec] animate-pulse mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 rounded bg-[#f3f1ec] animate-pulse" style={{ width: `${100 - i * 20}%` }} />
          ))}
        </div>
      </div>
    )
  }

  const stats = data?.stats
  if (!stats) return null

  const steps = [
    { label: 'Alle donateurs', count: stats.total_donors, color: 'bg-[#e3dfd5]' },
    { label: 'Geïdentificeerd', count: stats.total_donors - stats.anonymous, color: 'bg-[#d4e4b8]' },
    { label: 'Actief (12 maanden)', count: stats.active, color: 'bg-[#4a7c10]' },
    { label: 'Periodieke overeenkomst', count: stats.with_periodic, color: 'bg-[#2563eb]' },
  ]

  const maxCount = Math.max(steps[0].count, 1)

  // Conversion between active and periodic
  const activeWithoutPeriodic = Math.max(0, stats.active - stats.with_periodic)
  const conversionRate = stats.active > 0
    ? Math.round((stats.with_periodic / stats.active) * 100)
    : 0

  return (
    <div className="rounded-xl border border-[#e3dfd5] bg-white p-6">
      <h3 className="text-[15px] font-semibold text-[#261b07] mb-1">Conversie funnel</h3>
      <p className="text-[12px] text-[#a09888] mb-5">Van donateur naar periodieke gift</p>

      <div className="space-y-3">
        {steps.map((step, idx) => {
          const widthPct = Math.max((step.count / maxCount) * 100, step.count > 0 ? 6 : 2)
          const prevCount = idx > 0 ? steps[idx - 1].count : null
          const dropoff = prevCount && prevCount > 0
            ? Math.round((step.count / prevCount) * 100)
            : null

          return (
            <div key={step.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[12px] text-[#8a8478]">{step.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-[#261b07] tabular-nums">{step.count}</span>
                  {dropoff !== null && (
                    <span className="text-[10px] text-[#a09888] tabular-nums">({dropoff}%)</span>
                  )}
                </div>
              </div>
              <div className="h-3 rounded-full bg-[#f3f1ec] overflow-hidden">
                <div
                  className={`h-full rounded-full ${step.color} transition-all duration-700`}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* CTA */}
      {activeWithoutPeriodic > 0 && (
        <div className="mt-5 pt-4 border-t border-[#e3dfd5]/60">
          <p className="text-[12px] text-[#8a8478] mb-3">
            <span className="font-semibold text-[#261b07]">{activeWithoutPeriodic}</span> actieve donateurs
            hebben nog geen periodieke overeenkomst.
            {conversionRate > 0 && (
              <span> Huidige conversie: <span className="font-semibold text-[#261b07]">{conversionRate}%</span></span>
            )}
          </p>
          <Link
            href="/anbi"
            className="inline-flex items-center h-8 px-4 rounded-lg bg-[#261b07] text-white text-[12px] font-medium hover:bg-[#261b07]/90 transition-colors"
          >
            Periodieke gift aanmaken
          </Link>
        </div>
      )}
    </div>
  )
}
