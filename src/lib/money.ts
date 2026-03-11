/** Convert euros to cents (for storage) */
export function eurosToCents(euros: number): number {
  return Math.round(euros * 100)
}

/** Convert cents to euros (for display) */
export function centsToEuros(cents: number): number {
  return cents / 100
}

/** Format cents as Dutch currency string */
export function formatMoney(cents: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100)
}

/** Format cents as compact currency (no decimals for whole euros) */
export function formatMoneyCompact(cents: number): string {
  const euros = cents / 100
  if (euros % 1 === 0) {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(euros)
  }
  return formatMoney(cents)
}
