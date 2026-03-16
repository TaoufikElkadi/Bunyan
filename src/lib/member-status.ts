import type { MemberStatus, ChurnRisk } from '@/types'

const TWELVE_MONTHS_MS = 365 * 24 * 60 * 60 * 1000
const EIGHTEEN_MONTHS_MS = 548 * 24 * 60 * 60 * 1000
const NINE_MONTHS_MS = 274 * 24 * 60 * 60 * 1000
const THREE_MONTHS_MS = 91 * 24 * 60 * 60 * 1000

interface MemberStatusInput {
  email: string | null
  name: string | null
  last_donated_at: string | null
  has_active_recurring: boolean
  has_active_periodic: boolean
}

export function computeMemberStatus(donor: MemberStatusInput): MemberStatus {
  if (donor.has_active_periodic) return 'periodic'
  if (!donor.email && !donor.name) return 'anonymous'
  if (!donor.last_donated_at) return 'identified'

  const elapsed = Date.now() - new Date(donor.last_donated_at).getTime()
  if (elapsed <= TWELVE_MONTHS_MS) return 'active'
  if (elapsed <= EIGHTEEN_MONTHS_MS) return 'lapsed'
  return 'inactive'
}

export function computeChurnRisk(donor: MemberStatusInput): ChurnRisk {
  if (donor.has_active_recurring || donor.has_active_periodic) return 'low'
  if (!donor.last_donated_at) return 'high'

  const elapsed = Date.now() - new Date(donor.last_donated_at).getTime()
  if (elapsed <= THREE_MONTHS_MS) return 'low'
  if (elapsed <= NINE_MONTHS_MS) return 'medium'
  return 'high'
}

export function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (24 * 60 * 60 * 1000))
}
