const FEES = {
  ideal: { fixed: 29, percentage: 0 },
  card: { fixed: 25, percentage: 1.8 },
  sepa: { fixed: 25, percentage: 0 },
  bancontact: { fixed: 39, percentage: 0 },
  stripe: { fixed: 29, percentage: 0 }, // simplified — most NL donations are iDEAL
} as const

type PaymentMethod = keyof typeof FEES

export function calculateCoverFee(
  amountCents: number,
  method: PaymentMethod
): number {
  const fee = FEES[method]
  return fee.fixed + Math.round(amountCents * fee.percentage / 100)
}

export function getMethodFeeDescription(method: PaymentMethod): string {
  const fee = FEES[method]
  if (fee.percentage > 0) {
    return `€${(fee.fixed / 100).toFixed(2)} + ${fee.percentage}%`
  }
  return `€${(fee.fixed / 100).toFixed(2)}`
}
