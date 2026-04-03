'use client'

import { useState, useCallback } from 'react'
import useSWR from 'swr'
import { formatMoney } from '@/lib/money'
import { Check, X, Minus, Search, Users } from 'lucide-react'
import { AddCommitmentDialog } from './add-commitment-dialog'
import { toast } from 'sonner'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface GridMember {
  commitment_id: string
  donor_id: string
  name: string | null
  email: string | null
  monthly_amount: number
  start_date: string
}

interface PaymentCell {
  status: string
  amount_paid: number
  method: string | null
}

interface GridData {
  members: GridMember[]
  months: string[]
  payments: Record<string, Record<string, PaymentCell>>
}

function formatMonth(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('nl-NL', { month: 'short', year: '2-digit' })
}

function isCurrentOrPast(monthStr: string): boolean {
  const now = new Date()
  const current = new Date(now.getFullYear(), now.getMonth(), 1)
  const month = new Date(monthStr + 'T00:00:00')
  return month <= current
}

function isAfterStart(monthStr: string, startDate: string): boolean {
  return monthStr >= startDate.slice(0, 7) + '-01' || monthStr >= startDate
}

export function ShardGrid({ defaultAmount }: { defaultAmount: number }) {
  const { data, mutate, isLoading } = useSWR<GridData>('/api/shard/payments?months=6', fetcher, {
    revalidateOnFocus: false,
  })
  const { data: statsData } = useSWR('/api/shard/stats', fetcher, { revalidateOnFocus: false })

  const [search, setSearch] = useState('')
  const [showUnpaidOnly, setShowUnpaidOnly] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null) // "donorId-month" key

  const togglePayment = useCallback(async (member: GridMember, month: string, currentStatus: string) => {
    const key = `${member.donor_id}-${month}`
    if (toggling === key) return
    setToggling(key)

    const isPaying = currentStatus !== 'paid'
    const method = 'cash'

    // Optimistic update
    mutate((prev) => {
      if (!prev) return prev
      const updated = { ...prev, payments: { ...prev.payments } }
      if (!updated.payments[member.commitment_id]) {
        updated.payments[member.commitment_id] = {}
      }
      updated.payments[member.commitment_id] = {
        ...updated.payments[member.commitment_id],
        [month]: isPaying
          ? { status: 'paid', amount_paid: member.monthly_amount, method }
          : { status: 'unpaid', amount_paid: 0, method: null },
      }
      return updated
    }, false)

    try {
      if (isPaying) {
        await fetch('/api/shard/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payments: [{ donor_id: member.donor_id, month, method }],
          }),
        })
      } else {
        // Mark as unpaid by setting amount to 0
        await fetch('/api/shard/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payments: [{ donor_id: member.donor_id, month, method: 'cash', amount_paid: 0 }],
          }),
        })
      }
    } catch {
      toast.error('Fout bij bijwerken')
      mutate() // revert
    } finally {
      setToggling(null)
    }
  }, [toggling, mutate])

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(38,27,7,0.04)] p-6">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 rounded-lg bg-[#f3f1ec] animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const members = data?.members ?? []
  const months = data?.months ?? []
  const payments = data?.payments ?? {}
  const stats = statsData?.stats

  // Filter
  const filtered = members.filter((m) => {
    if (search) {
      const q = search.toLowerCase()
      const nameMatch = m.name?.toLowerCase().includes(q)
      const emailMatch = m.email?.toLowerCase().includes(q)
      if (!nameMatch && !emailMatch) return false
    }
    if (showUnpaidOnly) {
      const currentMonth = months[months.length - 1]
      if (!currentMonth) return true
      const p = payments[m.commitment_id]?.[currentMonth]
      if (p?.status === 'paid') return false
    }
    return true
  })

  return (
    <div className="space-y-5">
      {/* Stats row */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-4">
          <StatCard label="Actieve leden" value={String(stats.active_members)} />
          <StatCard label="Verwacht / maand" value={formatMoney(stats.monthly_expected)} />
          <StatCard label="Ontvangen deze maand" value={formatMoney(stats.collected_this_month)} />
          <StatCard
            label="Incasso-graad"
            value={
              stats.active_members > 0
                ? `${Math.round((stats.paid_this_month / stats.active_members) * 100)}%`
                : '—'
            }
            highlight={stats.unpaid_this_month > 0 ? `${stats.unpaid_this_month} nog niet betaald` : undefined}
          />
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#b5b0a5]" strokeWidth={1.5} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Zoek lid..."
              className="rounded-lg border border-[#e3dfd5] bg-white pl-9 pr-4 py-2 text-[13px] text-[#261b07] placeholder:text-[#b5b0a5] outline-none focus:border-[#261b07]/30 focus:ring-1 focus:ring-[#261b07]/10 transition-colors w-[200px]"
            />
          </div>
          <button
            onClick={() => setShowUnpaidOnly(!showUnpaidOnly)}
            className={`inline-flex items-center h-9 px-3 rounded-lg border text-[12px] font-medium transition-colors ${
              showUnpaidOnly
                ? 'bg-[#261b07] text-white border-[#261b07]'
                : 'bg-white text-[#8a8478] border-[#e3dfd5] hover:bg-[#f3f1ec]'
            }`}
          >
            Alleen openstaand
          </button>
        </div>
        <AddCommitmentDialog defaultAmount={defaultAmount} onSuccess={() => mutate()} />
      </div>

      {/* Grid */}
      <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(38,27,7,0.04)] overflow-hidden">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e3dfd5]">
                  <th className="sticky left-0 bg-white z-10 text-left px-4 sm:px-6 py-3 text-[11px] font-medium text-[#a09888] uppercase tracking-wide min-w-[180px]">
                    Lid
                  </th>
                  <th className="text-right px-3 py-3 text-[11px] font-medium text-[#a09888] uppercase tracking-wide">
                    Bedrag
                  </th>
                  {months.map((month) => (
                    <th key={month} className="text-center px-2 py-3 text-[11px] font-medium text-[#a09888] uppercase tracking-wide min-w-[64px]">
                      {formatMonth(month)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((member) => (
                  <tr key={member.donor_id} className="border-b border-[#e3dfd5]/50 hover:bg-[#fafaf8]">
                    <td className="sticky left-0 bg-white z-10 px-4 sm:px-6 py-3">
                      <p className="text-[13px] font-medium text-[#261b07] truncate max-w-[160px]">
                        {member.name ?? <span className="text-[#b5b0a5] italic">Naamloos</span>}
                      </p>
                      {member.email && (
                        <p className="text-[11px] text-[#a09888] truncate max-w-[160px]">{member.email}</p>
                      )}
                    </td>
                    <td className="text-right px-3 py-3 text-[12px] font-semibold text-[#261b07] tabular-nums whitespace-nowrap">
                      {formatMoney(member.monthly_amount)}
                    </td>
                    {months.map((month) => {
                      const payment = payments[member.commitment_id]?.[month]
                      const status = payment?.status ?? 'unpaid'
                      const isPastOrCurrent = isCurrentOrPast(month)
                      const isStarted = isAfterStart(month, member.start_date)
                      const canToggle = isPastOrCurrent && isStarted

                      return (
                        <td key={month} className="text-center px-2 py-3">
                          {canToggle ? (
                            <button
                              onClick={() => togglePayment(member, month, status)}
                              disabled={toggling === `${member.donor_id}-${month}`}
                              className={`inline-flex items-center justify-center h-8 w-8 rounded-lg transition-colors ${
                                status === 'paid'
                                  ? 'bg-[#e8f0d4] text-[#4a7c10] hover:bg-[#d8e6be]'
                                  : status === 'partial'
                                    ? 'bg-[#fef3cd] text-[#8a6d00] hover:bg-[#fde68a]'
                                    : 'bg-red-50 text-red-400 hover:bg-red-100'
                              }`}
                            >
                              {status === 'paid' ? (
                                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                              ) : status === 'partial' ? (
                                <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
                              ) : (
                                <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                              )}
                            </button>
                          ) : (
                            <span className="inline-flex items-center justify-center h-8 w-8 text-[#d5cfb8]">
                              <Minus className="h-3 w-3" strokeWidth={1.5} />
                            </span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="rounded-full bg-[#f3f1ec] p-5 mb-5">
              <Users className="h-7 w-7 text-[#a09888]" strokeWidth={1.5} />
            </div>
            <h3 className="text-[13px] font-medium text-[#261b07] mb-1.5">
              {members.length === 0 ? 'Geen contributieleden' : 'Geen resultaten'}
            </h3>
            <p className="text-[13px] text-[#a09888] text-center max-w-xs leading-relaxed">
              {members.length === 0
                ? 'Voeg leden toe om de maandelijkse contributie bij te houden.'
                : 'Pas uw zoekterm of filters aan.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(38,27,7,0.04)]">
      <p className="text-[11px] font-medium text-[#a09888] uppercase tracking-wide mb-1">{label}</p>
      <p className="text-[20px] font-bold text-[#261b07] tracking-tight leading-none">{value}</p>
      {highlight && (
        <p className="text-[11px] text-[#C87D3A] font-medium mt-1.5">{highlight}</p>
      )}
    </div>
  )
}
