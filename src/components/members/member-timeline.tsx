import { formatMoney } from '@/lib/money'
import { HandCoins, Repeat, FileText, Tag, XCircle, Wallet } from 'lucide-react'
import type { MemberEvent, MemberEventType } from '@/types'

const EVENT_CONFIG: Record<MemberEventType, { icon: typeof HandCoins; label: string; color: string }> = {
  donation: { icon: HandCoins, label: 'Donatie', color: 'text-[#4a7c10] bg-[#e8f0d4]' },
  recurring_started: { icon: Repeat, label: 'Terugkerend gestart', color: 'text-[#2563eb] bg-[#e0edff]' },
  recurring_cancelled: { icon: XCircle, label: 'Terugkerend gestopt', color: 'text-red-500 bg-red-50' },
  periodic_signed: { icon: FileText, label: 'Periodieke gift getekend', color: 'text-[#7c3aed] bg-[#ede9fe]' },
  periodic_expired: { icon: FileText, label: 'Periodieke gift verlopen', color: 'text-[#8a6d00] bg-[#fef3cd]' },
  receipt_sent: { icon: FileText, label: 'Giftenverklaring verstuurd', color: 'text-[#8a8478] bg-[#f3f1ec]' },
  tag_added: { icon: Tag, label: 'Tag toegevoegd', color: 'text-[#8a8478] bg-[#f3f1ec]' },
  shard_started: { icon: Wallet, label: 'Contributie gestart', color: 'text-[#0d9488] bg-[#d1fae5]' },
  shard_payment: { icon: Wallet, label: 'Contributie betaald', color: 'text-[#4a7c10] bg-[#e8f0d4]' },
  shard_cancelled: { icon: XCircle, label: 'Contributie gestopt', color: 'text-red-500 bg-red-50' },
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function MemberTimeline({ events }: { events: MemberEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="text-[13px] text-[#a09888] py-8 text-center">
        Geen activiteit gevonden.
      </p>
    )
  }

  return (
    <div className="space-y-0">
      {events.map((event, idx) => {
        const config = EVENT_CONFIG[event.event_type] ?? EVENT_CONFIG.donation
        const Icon = config.icon
        const data = event.event_data as Record<string, unknown>

        return (
          <div
            key={event.id}
            className="flex gap-3 py-3 border-b border-[#e3dfd5]/50 last:border-0"
          >
            <div className="flex flex-col items-center">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${config.color}`}>
                <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
              </div>
              {idx < events.length - 1 && (
                <div className="w-px flex-1 bg-[#e3dfd5]/60 mt-1" />
              )}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[12px] font-medium text-[#261b07]">{config.label}</p>
                {typeof data.amount === 'number' && (
                  <span className="text-[12px] font-semibold text-[#261b07] tabular-nums">
                    {formatMoney(data.amount as number)}
                  </span>
                )}
                {typeof data.annual_amount === 'number' && (
                  <span className="text-[12px] font-semibold text-[#261b07] tabular-nums">
                    {formatMoney(data.annual_amount as number)}/jaar
                  </span>
                )}
              </div>
              <p className="text-[10px] text-[#b5b0a5] mt-0.5">
                {formatDate(event.created_at)}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
