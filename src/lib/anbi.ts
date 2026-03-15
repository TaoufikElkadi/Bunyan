/**
 * Pure logic for ANBI receipt generation.
 * Extracted from API routes for testability.
 */

export interface RawDonation {
  id: string
  donor_id: string
  fund_id: string
  amount: number
  method: string
  donors: { id: string; name: string | null; email: string | null; address: string | null } | null
  funds: { name: string } | null
}

export interface DonorAggregation {
  donorId: string
  name: string
  email: string | null
  address: string | null
  totalAmount: number
  funds: Map<string, { fundName: string; amount: number; count: number }>
}

/**
 * Groups raw donation rows by donor, then by fund.
 * Excludes anonymous donors (no name).
 */
export function groupDonationsByDonor(
  donations: RawDonation[]
): Map<string, DonorAggregation> {
  const donorMap = new Map<string, DonorAggregation>()

  for (const donation of donations) {
    const donor = donation.donors
    if (!donor || !donor.name) continue

    const donorId = donor.id
    const fundName = donation.funds?.name ?? 'Onbekend fonds'

    if (!donorMap.has(donorId)) {
      donorMap.set(donorId, {
        donorId,
        name: donor.name,
        email: donor.email,
        address: donor.address,
        totalAmount: 0,
        funds: new Map(),
      })
    }

    const entry = donorMap.get(donorId)!
    entry.totalAmount += donation.amount

    const fundKey = donation.fund_id
    if (!entry.funds.has(fundKey)) {
      entry.funds.set(fundKey, { fundName, amount: 0, count: 0 })
    }
    const fundEntry = entry.funds.get(fundKey)!
    fundEntry.amount += donation.amount
    fundEntry.count += 1
  }

  return donorMap
}

/**
 * Generates a receipt number in the format ANBI-{year}-{seq}.
 * @param year Calendar year
 * @param seq Sequential number (1-based)
 */
export function formatReceiptNumber(year: number, seq: number): string {
  return `ANBI-${year}-${String(seq).padStart(6, '0')}`
}

/**
 * Parses a receipt number to extract the sequence number.
 * Returns 0 if the format doesn't match.
 */
export function parseReceiptSequence(receiptNumber: string): number {
  const match = receiptNumber.match(/^ANBI-\d{4}-(\d+)$/)
  if (!match) return 0
  return parseInt(match[1], 10)
}

/**
 * Validates a periodic gift agreement.
 * Returns null if valid, or an error message string.
 */
export function validatePeriodicGift(params: {
  startDate: string
  endDate: string
  annualAmount: number
}): string | null {
  const { startDate, endDate, annualAmount } = params

  if (annualAmount <= 0) {
    return 'Jaarlijks bedrag moet groter zijn dan 0'
  }

  const start = new Date(startDate)
  const end = new Date(endDate)

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 'Ongeldige datum'
  }

  if (end <= start) {
    return 'Einddatum moet na startdatum liggen'
  }

  // Minimum 5 years
  const minEnd = new Date(start)
  minEnd.setFullYear(minEnd.getFullYear() + 5)

  if (end < minEnd) {
    return 'Periodieke giften vereisen een looptijd van minimaal 5 jaar'
  }

  return null
}
