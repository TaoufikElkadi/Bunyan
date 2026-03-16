import type { MemberStatus } from '@/types'

const STATUS_CONFIG: Record<MemberStatus, { label: string; className: string }> = {
  periodic: {
    label: 'Periodiek',
    className: 'bg-[#e0edff] text-[#2563eb] border-[#bfdbfe]',
  },
  active: {
    label: 'Actief',
    className: 'bg-[#e8f0d4] text-[#4a7c10] border-[#d4e4b8]',
  },
  lapsed: {
    label: 'Vervallen',
    className: 'bg-[#fef3cd] text-[#8a6d00] border-[#fde68a]',
  },
  inactive: {
    label: 'Inactief',
    className: 'bg-red-50 text-red-600 border-red-200',
  },
  anonymous: {
    label: 'Anoniem',
    className: 'bg-[#f3f1ec] text-[#8a8478] border-[#e3dfd5]',
  },
  identified: {
    label: 'Bekend',
    className: 'bg-[#f3f1ec] text-[#261b07] border-[#e3dfd5]',
  },
}

export function MemberStatusBadge({ status }: { status: MemberStatus }) {
  const config = STATUS_CONFIG[status]
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ${config.className}`}
    >
      {config.label}
    </span>
  )
}
