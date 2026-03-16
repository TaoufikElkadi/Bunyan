'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { formatMoney } from '@/lib/money'
import { AlertTriangle, Clock, XCircle } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type LapsedDonor = {
  id: string
  name: string | null
  email: string | null
  last_donated_at: string
  total_donated: number
  donation_count: number
}

type ExpiringPeriodic = {
  id: string
  donor_id: string
  annual_amount: number
  end_date: string
  donors: { name: string | null; email: string | null }
}

type CancelledRecurring = {
  id: string
  donor_id: string
  amount: number
  frequency: string
  updated_at: string
  donors: { name: string | null; email: string | null }
}

type AlertsResponse = {
  alerts: {
    lapsed_donors: LapsedDonor[]
    expiring_periodic: ExpiringPeriodic[]
    recently_cancelled: CancelledRecurring[]
  }
}

export function AlertBanner() {
  const { data, isLoading } = useSWR<AlertsResponse>('/api/members/alerts', fetcher, {
    revalidateOnFocus: false,
  })

  if (isLoading) return null

  const alerts = data?.alerts
  if (!alerts) return null

  const hasAlerts =
    alerts.lapsed_donors.length > 0 ||
    alerts.expiring_periodic.length > 0 ||
    alerts.recently_cancelled.length > 0

  if (!hasAlerts) return null

  return (
    <div className="space-y-3">
      {/* Lapsed donors */}
      {alerts.lapsed_donors.length > 0 && (
        <AlertRow
          icon={<AlertTriangle className="h-4 w-4" strokeWidth={1.5} />}
          iconColor="text-[#8a6d00] bg-[#fef3cd]"
          borderColor="border-[#fde68a]"
          title={`${alerts.lapsed_donors.length} vervallen donateurs`}
          description="Deze leden hebben al meer dan 12 maanden niet gedoneerd"
        >
          <div className="mt-2 space-y-1">
            {alerts.lapsed_donors.slice(0, 5).map((donor) => (
              <Link
                key={donor.id}
                href={`/leden/${donor.id}`}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-1.5 px-2 -mx-2 rounded-md hover:bg-[#fef3cd]/50 transition-colors"
              >
                <span className="text-[12px] font-medium text-[#261b07] truncate">
                  {donor.name ?? donor.email ?? 'Onbekend'}
                </span>
                <span className="text-[11px] text-[#8a8478] tabular-nums shrink-0">
                  {formatMoney(donor.total_donated)} · {donor.donation_count} donaties
                </span>
              </Link>
            ))}
            {alerts.lapsed_donors.length > 5 && (
              <Link
                href="/leden?status=lapsed"
                className="block text-[11px] font-medium text-[#8a6d00] hover:underline mt-1"
              >
                + {alerts.lapsed_donors.length - 5} meer bekijken
              </Link>
            )}
          </div>
        </AlertRow>
      )}

      {/* Expiring periodic gifts */}
      {alerts.expiring_periodic.length > 0 && (
        <AlertRow
          icon={<Clock className="h-4 w-4" strokeWidth={1.5} />}
          iconColor="text-[#7c3aed] bg-[#ede9fe]"
          borderColor="border-[#ddd6fe]"
          title={`${alerts.expiring_periodic.length} periodieke giften verlopen binnenkort`}
          description="Deze overeenkomsten verlopen binnen 60 dagen"
        >
          <div className="mt-2 space-y-1">
            {alerts.expiring_periodic.slice(0, 5).map((pg) => (
              <Link
                key={pg.id}
                href={`/leden/${pg.donor_id}`}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-1.5 px-2 -mx-2 rounded-md hover:bg-[#ede9fe]/50 transition-colors"
              >
                <span className="text-[12px] font-medium text-[#261b07] truncate">
                  {pg.donors?.name ?? pg.donors?.email ?? 'Onbekend'}
                </span>
                <span className="text-[11px] text-[#8a8478] tabular-nums shrink-0">
                  {formatMoney(pg.annual_amount)}/jaar · verloopt {new Date(pg.end_date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                </span>
              </Link>
            ))}
          </div>
        </AlertRow>
      )}

      {/* Recently cancelled recurrings */}
      {alerts.recently_cancelled.length > 0 && (
        <AlertRow
          icon={<XCircle className="h-4 w-4" strokeWidth={1.5} />}
          iconColor="text-red-500 bg-red-50"
          borderColor="border-red-200"
          title={`${alerts.recently_cancelled.length} terugkerende donaties gestopt`}
          description="Geannuleerd in de afgelopen 30 dagen"
        >
          <div className="mt-2 space-y-1">
            {alerts.recently_cancelled.slice(0, 5).map((rc) => (
              <Link
                key={rc.id}
                href={`/leden/${rc.donor_id}`}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-1.5 px-2 -mx-2 rounded-md hover:bg-red-50/50 transition-colors"
              >
                <span className="text-[12px] font-medium text-[#261b07] truncate">
                  {rc.donors?.name ?? rc.donors?.email ?? 'Onbekend'}
                </span>
                <span className="text-[11px] text-[#8a8478] tabular-nums shrink-0">
                  {formatMoney(rc.amount)}/{rc.frequency === 'monthly' ? 'maand' : rc.frequency === 'weekly' ? 'week' : 'jaar'}
                </span>
              </Link>
            ))}
          </div>
        </AlertRow>
      )}
    </div>
  )
}

function AlertRow({
  icon,
  iconColor,
  borderColor,
  title,
  description,
  children,
}: {
  icon: React.ReactNode
  iconColor: string
  borderColor: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className={`rounded-xl border ${borderColor} bg-white p-5`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconColor}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-[#261b07]">{title}</p>
          <p className="text-[11px] text-[#8a8478] mt-0.5">{description}</p>
          {children}
        </div>
      </div>
    </div>
  )
}
