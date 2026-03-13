import { describe, it, expect } from 'vitest'
import { eurosToCents, centsToEuros, formatMoney, formatMoneyCompact } from '@/lib/money'

describe('eurosToCents', () => {
  it('converts whole euros', () => {
    expect(eurosToCents(25)).toBe(2500)
  })

  it('converts euros with cents', () => {
    expect(eurosToCents(25.50)).toBe(2550)
  })

  it('converts zero', () => {
    expect(eurosToCents(0)).toBe(0)
  })

  it('converts smallest unit', () => {
    expect(eurosToCents(0.01)).toBe(1)
  })

  it('handles floating point edge case (19.99)', () => {
    expect(eurosToCents(19.99)).toBe(1999)
  })

  it('converts large amounts', () => {
    expect(eurosToCents(10000)).toBe(1000000)
  })

  it('rounds correctly on half-cent boundaries', () => {
    // 1.555 * 100 = 155.5 → Math.round → 156
    expect(eurosToCents(1.555)).toBe(156)
  })
})

describe('centsToEuros', () => {
  it('converts whole euro amounts', () => {
    expect(centsToEuros(2500)).toBe(25)
  })

  it('converts amounts with cents', () => {
    expect(centsToEuros(2550)).toBe(25.50)
  })

  it('converts zero', () => {
    expect(centsToEuros(0)).toBe(0)
  })
})

describe('formatMoney', () => {
  it('formats a normal amount in Dutch locale', () => {
    const result = formatMoney(2550)
    // Dutch formatting uses comma for decimals, non-breaking space before amount
    expect(result).toMatch(/€/)
    expect(result).toMatch(/25,50/)
  })

  it('formats zero', () => {
    const result = formatMoney(0)
    expect(result).toMatch(/€/)
    expect(result).toMatch(/0,00/)
  })

  it('formats a large amount with thousand separator', () => {
    const result = formatMoney(1234567)
    expect(result).toMatch(/€/)
    expect(result).toMatch(/12.345,67/)
  })

  it('formats a small amount (1 cent)', () => {
    const result = formatMoney(1)
    expect(result).toMatch(/€/)
    expect(result).toMatch(/0,01/)
  })
})

describe('formatMoneyCompact', () => {
  it('omits decimals for whole euro amounts', () => {
    const result = formatMoneyCompact(2500)
    expect(result).toMatch(/€/)
    expect(result).toMatch(/25/)
    // Should NOT contain ,00
    expect(result).not.toMatch(/,00/)
  })

  it('includes decimals for non-whole amounts', () => {
    const result = formatMoneyCompact(2550)
    expect(result).toMatch(/€/)
    expect(result).toMatch(/25,50/)
  })
})
